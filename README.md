# Tetristeza

<p align="center">
  <img src="assets/branding/tetristeza-logo-1.svg" alt="Tetristeza" width="680" />
</p>

<p align="center">
  <strong>A tiny falling-block puzzler with neon colors and questionable emotional stability.</strong>
</p>

<p align="center">
  <strong>🇺🇸 English</strong> &nbsp;·&nbsp;
  <strong>🇦🇷 Español</strong> &nbsp;·&nbsp;
  <img src="https://upload.wikimedia.org/wikipedia/commons/c/ce/Flag_of_Catalonia.svg" alt="Catalan Senyera" height="14" /> <strong>Català</strong>
</p>

Tetristeza is a lightweight browser game built with plain HTML5 Canvas and vanilla JavaScript.

No accounts. No ads. No analytics. No external cloud service. Just blocks, poor decisions, and a scoreboard.

## Why

I wanted a lightweight falling-block game: open it, play it, close it. No launcher, no account, no dependency tree large enough to develop its own mood.

Then I added Hold, Ghost, particles, actual moods, a global Top 10, and enough wall kicks to make the blocks slightly less vindictive.

## Play

**Online:** the current stable v1.3.0 build is available at **https://santiagorodriguez.com/Tetristeza/**. The v1.4.0 work is currently being prepared in the repository.

**Local:** clone or download the repository, open `index.html`, and press Start. Opening it directly from disk uses an isolated local Top 10 for testing; an HTTP(S) deployment uses the real server leaderboard.

## Screenshot

<p align="center">
  <img src="assets/screenshots/screenshot-v1.1.png" alt="Tetristeza gameplay" width="900" />
</p>

## What it does

- **7-bag randomizer** for fair piece distribution
- **Hold**, **3-piece Next queue**, and **Ghost** piece support
- SRS-style clockwise and counter-clockwise rotation with wall/floor kicks
- Smooth movement with **DAS/ARR**, soft drop, and hard drop
- Finite lock-delay resets so pieces cannot be stalled forever
- **Scoring, combos, back-to-back bonuses, and levels**
- **Global Top 10** with names up to 8 characters and an optional private email
- Lightweight particles and minimal audio through the Web Audio API
- Responsive keyboard and Pointer Events controls for mouse/touch/pen
- Viewport-aware playfield sizing so the complete board stays visible at normal browser zoom
- Optional **detachable game window** that moves the live playfield instead of duplicating it
- Persistent language preference and personal best stored locally in the browser
- HiDPI Canvas rendering and reduced-motion support
- No framework, package manager, compiler, or runtime dependency for the game itself

## Controls

| Action | Key |
| --- | --- |
| Move | `←` `→` |
| Rotate clockwise | `↑` or `X` |
| Rotate counter-clockwise | `Z` |
| Soft drop | `↓` |
| Hard drop | `Space` |
| Hold | `C` |
| Pause | `P` |
| Quick restart | `R` |
| Ghost toggle | `G` |
| Mute | `M` |

On touch devices, use the on-screen controls. Left, right, and soft drop support press-and-hold; Pause stays available in the active mobile control dock. On desktop, **Move to window** transfers the same live game surface to a resizable window; closing it or choosing **Return to page** puts the game back without starting a second session.

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

At Game Over, a qualifying score can join the global Top 10 with a name of up to **8 characters** and an optional private email. Only the best ten survive; everyone else is politely forgotten by SQLite. Earlier scores win ties.

It is intentionally an arcade leaderboard, not an esports anti-cheat department.

## Author

[Santiago Rodriguez](https://santiagorodriguez.com)

<a href="https://santiagorodriguez.com/donate"><img src="assets/badges/donate.svg" alt="Donate" height="52" /></a>

## Technical notes

The game stays in plain HTML/CSS/JavaScript. `assets/js/leaderboard.js` is a small browser bootstrap: it loads the leaderboard implementation from `assets/js/leaderboard-core.js` and then the detachable-window behavior from `assets/js/display.js`. The leaderboard uses a single self-hosted `api/scores.php` endpoint backed by SQLite.

The detachable window is opened only by an explicit user action. The actual game section and overlay move between documents, so there is only one playfield and one game state; the animation loop follows the window that currently owns the game surface.

The SQLite database lives outside the public document root by default. Set `TETRISTEZA_DB_PATH` only when a different private server path is needed.

The repository intentionally has no frontend build step. Browser compatibility follows current standards supported across modern Firefox, Chromium-based browsers, and Safari rather than browser-specific forks.

## License

Tetristeza is released under the **GNU General Public License v3.0 (GPL-3.0)**. See [LICENSE](LICENSE) for the full license text.