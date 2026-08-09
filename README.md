# Tetristeza

<p align="center">
  <img src="assets/branding/tetristeza-logo-1.svg" alt="Tetristeza" width="680" />
</p>

<p align="center">
  <strong>A tiny falling-block puzzler with neon colors and questionable emotional stability.</strong>
</p>

Tetristeza is a lightweight browser game built with plain HTML5 Canvas and vanilla JavaScript.

No accounts. No ads. No analytics. No external cloud service. The blocks are already dealing with enough.

> **Play online:** the current v1.1 build is available at **https://santiagorodriguez.com/Tetristeza/**.

## Why

I wanted a falling-block game that could open quickly and not turn “move some blocks around” into a software architecture conference.

Then I added particles, audio, Hold, Ghost, combos, back-to-back bonuses, a mood system, and a tiny arcade-style leaderboard.

Scope control is a process.

## What it does

- **7-bag randomizer** for fair piece distribution
- **Hold**, **Next**, and **Ghost** piece support
- Smooth movement with **DAS/ARR**, soft drop, and hard drop
- **Scoring, combos, back-to-back bonuses, and levels**
- **Global Top 10** with names up to 8 characters and an optional private email
- Lightweight particles and minimal audio through the Web Audio API
- Responsive keyboard and touch controls
- English, Spanish (Argentina), and Catalan interface
- Persistent language preference and personal best stored locally in the browser
- HiDPI Canvas rendering
- No framework, package manager, compiler, or runtime dependency for the game itself

## Screenshot

<p align="center">
  <img src="assets/screenshots/screenshot-v1.1.png" alt="Tetristeza v1.1 gameplay" width="900" />
</p>

## Controls

| Action | Key |
| --- | --- |
| Move | `←` `→` |
| Rotate | `↑` |
| Soft drop | `↓` |
| Hard drop | `Space` |
| Hold | `C` |
| Pause | `P` |
| Ghost toggle | `G` |
| Mute | `M` |

On touch devices, use the on-screen controls.

## Play

Play the current v1.1 build at **https://santiagorodriguez.com/Tetristeza/**.

To run the game locally:

1. Clone or download this repository.
2. Open `index.html` in a modern browser.
3. Click or tap once before expecting the browser to make noise. Browsers have trust issues with autoplay, and in this case they are probably right.

The core game remains playable without a server. The global leaderboard is an optional online feature and requires PHP with PDO SQLite support.

## Scoring & Levels

- **Single:** 100 × level
- **Double:** 300 × level
- **Triple:** 500 × level
- **Tetris:** 800 × level, with a 50% back-to-back bonus
- **Soft drop:** +1 per cell
- **Hard drop:** +2 per cell
- **Combo:** +50 × level × combo streak
- The level increases every **10 lines**
- Gravity accelerates down to a minimum interval of **120 ms**

## Global Top 10

At game over, Tetristeza loads the global Top 10. A qualifying score can be saved with a name of up to **8 characters** and, optionally, an email address.

Only the ten highest scores are retained. The email is never included in public leaderboard responses and is deleted automatically when its score falls out of the Top 10. Equal scores keep the earlier result ahead.

The leaderboard is deliberately casual rather than cheat-proof: the game still runs in the browser, while the server validates submissions, applies the final ranking atomically, and rejects malformed or excessive requests.

## Languages

- 🇺🇸 **English** — default
- 🇦🇷 **Español (Argentina)**
- **Català** — represented in the interface by the traditional Senyera

The selected language is saved locally and can be changed without restarting the current game.

## Author

[Santiago Rodriguez](https://santiagorodriguez.com)

<a href="https://santiagorodriguez.com/donate"><img src="assets/badges/donate.svg" alt="Donate" height="52" /></a>

## Technical notes

Tetristeza intentionally stays small. The game interface, localization, gameplay logic, and rendering remain in `index.html`. The leaderboard is isolated in `assets/js/leaderboard.js` and a single `api/scores.php` endpoint.

The game uses HTML5 Canvas, vanilla JavaScript, CSS, the Web Audio API, and `localStorage`. The online leaderboard uses self-hosted PHP and SQLite, with no framework or third-party service.

The SQLite database is kept outside the public document root by default. Set `TETRISTEZA_DB_PATH` on the server only if a different private path is required.

## License

Tetristeza is released under the **GNU General Public License v3.0 (GPL-3.0)**. See [LICENSE](LICENSE) for the full license text.
