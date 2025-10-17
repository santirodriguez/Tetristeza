# Tetristeza

A tiny neon Tetris-like built with plain HTML5 Canvas and vanilla JavaScript.  
Fast, responsive, HiDPI-aware, with hold/ghost/next, smooth DAS/ARR, particles, and a subtle “mood” wash.

![screenshot](docs/screenshot.png)

---

## Highlights

- **Pixel-perfect board**: no gaps at the bottom/right edges (see _Technical notes_).
- **HiDPI canvas** with dynamic resizing.
- **7-bag randomizer** for fair piece distribution.
- **Lock delay** and **DAS/ARR** for smooth movement.
- **Ghost piece**, **Hold**, **Next** preview.
- **Leveling & scoring** (singles → Tetris, combo, B2B bonus).
- **Lightweight particles** for line clears & hard-drop impact.
- **Minimal audio** using Web Audio API (mute toggle).

---

## Controls

- **Move**: `←` `→`  
- **Rotate**: `↑`  
- **Soft drop**: `↓`  
- **Hard drop**: `Space`  
- **Hold**: `C`  
- **Pause**: `P`  
- **Ghost toggle**: `G`  
- **Mute**: `M`

On mobile/trackpad, use the on-screen buttons.

---

## How to run

1. Clone or download this repo.
2. Open `tetristeza.html` in a modern browser. That’s it.

> Tip: For the best audio experience, run from a small static server (e.g. VSCode Live Server, `python -m http.server`, etc.) so the browser happily initializes audio on user gesture.

---

## Scoring & Levels

- **Line clears** per standard Tetris scoring (by level):  
  - Single: 100 × level  
  - Double: 300 × level  
  - Triple: 500 × level  
  - Tetris: 800 × level (+50% if **Back-to-Back**)
- **Soft drop**: +1 per cell  
- **Hard drop**: +2 per cell  
- **Combo**: +50 × level × combo streak
- Level increases every **10 lines**.  
  Gravity accelerates: `dropInterval = max(120ms, 1000ms - (level-1)*80ms)`.
