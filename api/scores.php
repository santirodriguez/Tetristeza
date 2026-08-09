<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');

const TOP_LIMIT = 10;
const MAX_NAME_CHARS = 8;
const MAX_EMAIL_LENGTH = 254;
const MAX_SCORE = 999999999;

function respond(int $status, array $payload): never
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

function sameOriginRequest(): bool
{
    $host = $_SERVER['HTTP_HOST'] ?? '';
    if ($host === '') {
        return false;
    }

    foreach (['HTTP_ORIGIN', 'HTTP_REFERER'] as $header) {
        if (empty($_SERVER[$header])) {
            continue;
        }

        $sourceHost = parse_url((string) $_SERVER[$header], PHP_URL_HOST);
        if (!is_string($sourceHost) || strcasecmp($sourceHost, preg_replace('/:\d+$/', '', $host)) !== 0) {
            return false;
        }
    }

    return true;
}

function databasePath(): string
{
    $configured = getenv('TETRISTEZA_DB_PATH');
    if (is_string($configured) && trim($configured) !== '') {
        return $configured;
    }

    $documentRoot = $_SERVER['DOCUMENT_ROOT'] ?? '';
    if ($documentRoot === '') {
        throw new RuntimeException('Document root unavailable.');
    }

    $privateDir = dirname(rtrim($documentRoot, DIRECTORY_SEPARATOR)) . DIRECTORY_SEPARATOR . 'tetristeza-private';
    if (!is_dir($privateDir) && !mkdir($privateDir, 0700, true) && !is_dir($privateDir)) {
        throw new RuntimeException('Private storage unavailable.');
    }

    return $privateDir . DIRECTORY_SEPARATOR . 'scores.sqlite';
}

function openDatabase(): PDO
{
    if (!extension_loaded('pdo_sqlite')) {
        throw new RuntimeException('PDO SQLite is unavailable.');
    }

    $db = new PDO('sqlite:' . databasePath(), null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    $db->exec('PRAGMA busy_timeout = 3000');
    $db->exec('PRAGMA journal_mode = WAL');
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
if ($contentLength > 2048) {
    respond(413, ['ok' => false, 'error' => 'request_too_large']);
}

session_start([
    'cookie_httponly' => true,
    'cookie_samesite' => 'Strict',
    'use_strict_mode' => true,
]);

$now = time();
$recent = array_values(array_filter(
    $_SESSION['score_posts'] ?? [],
    static fn($timestamp): bool => is_int($timestamp) && $timestamp > $now - 60
));
if (count($recent) >= 5) {
    respond(429, ['ok' => false, 'error' => 'rate_limited']);
}
$recent[] = $now;
$_SESSION['score_posts'] = $recent;

$raw = file_get_contents('php://input');
$data = json_decode($raw === false ? '' : $raw, true);
if (!is_array($data)) {
    respond(400, ['ok' => false, 'error' => 'invalid_json']);
}

$name = trim((string) ($data['name'] ?? ''));
$email = trim((string) ($data['email'] ?? ''));
$score = filter_var($data['score'] ?? null, FILTER_VALIDATE_INT);

if ($name === '' || characterCount($name) > MAX_NAME_CHARS || preg_match('/[\x00-\x1F\x7F]/u', $name)) {
    respond(422, ['ok' => false, 'error' => 'invalid_name']);
}

if ($email !== '') {
    if (strlen($email) > MAX_EMAIL_LENGTH || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
        respond(422, ['ok' => false, 'error' => 'invalid_email']);
    }
} else {
    $email = null;
}

if ($score === false || $score < 0 || $score > MAX_SCORE) {
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

    $rankStmt = $db->prepare(
        'SELECT position FROM (
            SELECT id, ROW_NUMBER() OVER (ORDER BY score DESC, created_at ASC, id ASC) AS position
            FROM scores
        ) WHERE id = :id'
    );
    $rankStmt->execute([':id' => $newId]);
    $position = $rankStmt->fetchColumn();

    $db->commit();

    respond(201, [
        'ok' => true,
        'accepted' => $position !== false,
        'position' => $position === false ? null : (int) $position,
        'scores' => publicScores($db),
    ]);
} catch (Throwable $error) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    respond(503, ['ok' => false, 'error' => 'leaderboard_unavailable']);
}
