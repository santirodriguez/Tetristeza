<?php
declare(strict_types=1);

ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");

const TOP_LIMIT = 10;
const MAX_NAME_CHARS = 8;
const MAX_EMAIL_LENGTH = 254;
const MAX_REQUEST_BYTES = 2048;
const MAX_SCORE = 999999999;

function respond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function publicScores(PDO $db): array
{
    $stmt = $db->query(
        'SELECT name, score FROM scores ORDER BY score DESC, created_at ASC, id ASC LIMIT ' . TOP_LIMIT
    );

    return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
}

function characterCount(string $value): int
{
    $count = preg_match_all('/./u', $value, $matches);
    return $count === false ? PHP_INT_MAX : $count;
}

function validPlayerName(string $name): bool
{
    return $name !== ''
        && characterCount($name) <= MAX_NAME_CHARS
        && preg_match('/[\\p{L}\\p{N}]/u', $name) === 1
        && preg_match("/^[\\p{L}\\p{N} _.'’·-]+$/u", $name) === 1;
}

function sameOriginRequest(): bool
{
    $host = $_SERVER['HTTP_HOST'] ?? '';
    if ($host === '') {
        return false;
    }

    $expectedHost = preg_replace('/:\\d+$/', '', $host);
    foreach (['HTTP_ORIGIN', 'HTTP_REFERER'] as $header) {
        if (empty($_SERVER[$header])) {
            continue;
        }

        $sourceHost = parse_url((string) $_SERVER[$header], PHP_URL_HOST);
        if (!is_string($sourceHost) || strcasecmp($sourceHost, (string) $expectedHost) !== 0) {
            return false;
        }
    }

    return true;
}

function privateConfiguredPath(string $configured, string $documentRoot): string
{
    $configuredDir = realpath(dirname($configured));
    $publicRoot = realpath($documentRoot);
    if ($configuredDir === false || $publicRoot === false) {
        throw new RuntimeException('Configured private storage path is invalid.');
    }

    $configuredPrefix = rtrim($configuredDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
    $publicPrefix = rtrim($publicRoot, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
    if ($configuredDir === $publicRoot || strpos($configuredPrefix, $publicPrefix) === 0) {
        throw new RuntimeException('Configured storage must be outside the public document root.');
    }

    return $configuredDir . DIRECTORY_SEPARATOR . basename($configured);
}

function databasePath(): string
{
    $documentRoot = $_SERVER['DOCUMENT_ROOT'] ?? '';
    if ($documentRoot === '') {
        throw new RuntimeException('Document root unavailable.');
    }

    $configured = getenv('TETRISTEZA_DB_PATH');
    if (is_string($configured) && trim($configured) !== '') {
        return privateConfiguredPath(trim($configured), $documentRoot);
    }

    $privateDir = dirname(rtrim($documentRoot, DIRECTORY_SEPARATOR)) . DIRECTORY_SEPARATOR . 'tetristeza-private';
    if (!is_dir($privateDir) && !mkdir($privateDir, 0700, true) && !is_dir($privateDir)) {
        throw new RuntimeException('Private storage unavailable.');
    }
    if (!chmod($privateDir, 0700)) {
        throw new RuntimeException('Private storage permissions unavailable.');
    }

    return $privateDir . DIRECTORY_SEPARATOR . 'scores.sqlite';
}

function openDatabase(): PDO
{
    if (!extension_loaded('pdo_sqlite')) {
        throw new RuntimeException('PDO SQLite is unavailable.');
    }

    $path = databasePath();
    $db = new PDO('sqlite:' . $path, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    $db->exec('PRAGMA busy_timeout = 3000');
    $db->exec('PRAGMA secure_delete = ON');
    $db->exec(
        'CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NULL,
            score INTEGER NOT NULL,
            created_at INTEGER NOT NULL
        )'
    );
    $db->exec('CREATE INDEX IF NOT EXISTS scores_rank_idx ON scores(score DESC, created_at ASC, id ASC)');

    if (is_file($path) && !chmod($path, 0600)) {
        throw new RuntimeException('Private storage permissions unavailable.');
    }

    return $db;
}

try {
    $db = openDatabase();
} catch (Throwable $error) {
    respond(503, ['ok' => false, 'error' => 'leaderboard_unavailable']);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    try {
        respond(200, ['ok' => true, 'scores' => publicScores($db)]);
    } catch (Throwable $error) {
        respond(503, ['ok' => false, 'error' => 'leaderboard_unavailable']);
    }
}

if ($method !== 'POST') {
    header('Allow: GET, POST');
    respond(405, ['ok' => false, 'error' => 'method_not_allowed']);
}

if (!sameOriginRequest()) {
    respond(403, ['ok' => false, 'error' => 'origin_not_allowed']);
}

$contentType = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
if ($contentType !== 'application/json') {
    respond(415, ['ok' => false, 'error' => 'json_required']);
}

$contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($contentLength > MAX_REQUEST_BYTES) {
    respond(413, ['ok' => false, 'error' => 'request_too_large']);
}

$forwardedProto = strtolower(trim(explode(',', (string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? ''))[0]));
$isHttps = (!empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off') || $forwardedProto === 'https';
if (!session_start([
    'cookie_httponly' => true,
    'cookie_samesite' => 'Strict',
    'cookie_secure' => $isHttps,
    'use_strict_mode' => true,
])) {
    respond(503, ['ok' => false, 'error' => 'leaderboard_unavailable']);
}

$now = time();
$recent = array_values(array_filter(
    $_SESSION['score_posts'] ?? [],
    static function ($timestamp) use ($now): bool {
        return is_int($timestamp) && $timestamp > $now - 60;
    }
));
if (count($recent) >= 5) {
    session_write_close();
    header('Retry-After: 60');
    respond(429, ['ok' => false, 'error' => 'rate_limited']);
}
$recent[] = $now;
$_SESSION['score_posts'] = $recent;
session_write_close();

$raw = file_get_contents('php://input', false, null, 0, MAX_REQUEST_BYTES + 1);
if ($raw === false) {
    respond(400, ['ok' => false, 'error' => 'invalid_json']);
}
if (strlen($raw) > MAX_REQUEST_BYTES) {
    respond(413, ['ok' => false, 'error' => 'request_too_large']);
}

$data = json_decode($raw, true);
if (!is_array($data)) {
    respond(400, ['ok' => false, 'error' => 'invalid_json']);
}

if (!array_key_exists('name', $data) || !is_string($data['name'])) {
    respond(422, ['ok' => false, 'error' => 'invalid_name']);
}
$name = trim($data['name']);
if (!validPlayerName($name)) {
    respond(422, ['ok' => false, 'error' => 'invalid_name']);
}

$email = $data['email'] ?? '';
if (!is_string($email)) {
    respond(422, ['ok' => false, 'error' => 'invalid_email']);
}
$email = trim($email);
if ($email !== '') {
    if (strlen($email) > MAX_EMAIL_LENGTH || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
        respond(422, ['ok' => false, 'error' => 'invalid_email']);
    }
} else {
    $email = null;
}

if (!array_key_exists('score', $data) || !is_int($data['score'])) {
    respond(422, ['ok' => false, 'error' => 'invalid_score']);
}
$score = $data['score'];
if ($score <= 0 || $score > MAX_SCORE) {
    respond(422, ['ok' => false, 'error' => 'invalid_score']);
}

try {
    $db->exec('BEGIN IMMEDIATE TRANSACTION');

    $count = (int) $db->query('SELECT COUNT(*) FROM scores')->fetchColumn();
    $qualifies = $count < TOP_LIMIT;

    if (!$qualifies) {
        $cutoff = $db->query(
            'SELECT score FROM scores ORDER BY score DESC, created_at ASC, id ASC LIMIT 1 OFFSET ' . (TOP_LIMIT - 1)
        )->fetchColumn();
        $qualifies = $cutoff !== false && $score > (int) $cutoff;
    }

    if (!$qualifies) {
        $db->rollBack();
        respond(200, ['ok' => true, 'accepted' => false, 'scores' => publicScores($db)]);
    }

    $insert = $db->prepare('INSERT INTO scores (name, email, score, created_at) VALUES (:name, :email, :score, :created_at)');
    $insert->execute([
        ':name' => $name,
        ':email' => $email,
        ':score' => $score,
        ':created_at' => $now,
    ]);
    $newId = (int) $db->lastInsertId();

    $delete = $db->prepare(
        'DELETE FROM scores WHERE id NOT IN (
            SELECT id FROM scores ORDER BY score DESC, created_at ASC, id ASC LIMIT ' . TOP_LIMIT . '
        )'
    );
    $delete->execute();

    $rankedIds = $db->query(
        'SELECT id FROM scores ORDER BY score DESC, created_at ASC, id ASC LIMIT ' . TOP_LIMIT
    )->fetchAll(PDO::FETCH_COLUMN);
    $positionIndex = array_search((string) $newId, array_map('strval', $rankedIds), true);
    $position = $positionIndex === false ? null : $positionIndex + 1;
    $scores = publicScores($db);

    $db->commit();

    respond(201, [
        'ok' => true,
        'accepted' => $position !== null,
        'position' => $position,
        'scores' => $scores,
    ]);
} catch (Throwable $error) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    respond(503, ['ok' => false, 'error' => 'leaderboard_unavailable']);
}
