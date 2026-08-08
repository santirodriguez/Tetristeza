<p align="center">
  <img src="assets/branding/tetristeza-logo-1.svg" alt="Tetristeza" width="680">
</p>

# Tetristeza

A tiny neon falling-block puzzler built with plain HTML5 Canvas and vanilla JavaScript. Tetristeza stays lightweight and dependency-free while providing hold, ghost, next preview, smooth DAS/ARR movement, particles, audio, scoring, and its subtle mood system.

> **Test build:** a preview of the current development version will be published at **https://santiagorodriguez.com/Tetristeza/**.
>
> **v1.1 screenshot:** the final screenshot will be added as `assets/screenshot-v1.1.png` once the interface is finalized.

## Highlights

- **No dependencies**: one HTML game plus static assets.
- **HiDPI canvas** with responsive resizing.
- **7-bag randomizer** for fair piece distribution.
- **Lock delay** and **DAS/ARR** for smooth movement.
- **Ghost piece**, **Hold**, and **Next** preview.
- **Leveling and scoring** with combos and back-to-back Tetris bonuses.
- **Lightweight particles** for line clears and hard-drop impact.
- **Minimal audio** through the Web Audio API.
- **Responsive controls** for keyboard and on-screen play.
- **Language selector** with persistent preference.

## Languages

Tetristeza v1.1 includes:

- 🇺🇸 **English** — default
- 🇦🇷 **Español (Argentina)**
- **Català**, represented in the interface by the traditional Senyera

The selected language is saved locally in the browser and can be changed without restarting the current game.

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

## How to run

1. Clone or download this repository.
2. Open `tetristeza.html` in a modern browser.

For the best audio behavior, serve the files through a small static web server so the browser can initialize audio after a user gesture.

## Scoring & Levels

- **Single:** 100 × level
- **Double:** 300 × level
- **Triple:** 500 × level
- **Tetris:** 800 × level, with a 50% back-to-back bonus
- **Soft drop:** +1 per cell
- **Hard drop:** +2 per cell
- **Combo:** +50 × level × combo streak
- The level increases every **10 lines**.
- Gravity accelerates down to a minimum interval of **120 ms**.

## Technical notes

Tetristeza intentionally stays small: the interface, game logic, localization, styles, and rendering remain in `tetristeza.html`, with no framework, package manager, build step, or runtime dependency. The v1.1 update adds localization and UI/accessibility polish without changing the core gameplay rules.

## License

Tetristeza is released under the **GNU General Public License v3.0 (GPL-3.0)**. See `LICENSE` for the full license text.
