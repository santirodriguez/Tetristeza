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
2. Open `index.html` in a modern browser. That’s it.

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

---

## Technical Notes

### Fix: “gap” between the floor and the falling piece

**Root cause:** cells were drawn with a **floored** square size (`s = Math.floor(min(cellW, cellH))`).  
When the canvas size wasn’t an exact multiple of the grid, `s*ROWS` was **shorter** than the canvas height, leaving a visible gap at the bottom.

**Solution:** use the **exact** per-cell size from the canvas (`cellW = canvasWidth/COLS`, `cellH = canvasHeight/ROWS`) **without flooring**.  
All drawing (fills, gradients, strokes) now uses `cellW`/`cellH`, so the board covers the canvas perfectly.

Relevant code:

```js
function getCell(){
  const cw = canvas.width / dpr / COLS;
  const ch = canvas.height / dpr / ROWS;
  return {cellW:cw, cellH:ch};
}

function drawCell(x,y,color,ghost=false){
  const {cellW, cellH} = getCell();
  const px = x*cellW, py = y*cellH;
  // gradient fill using cellH (no rounding)
  // ...
  ctx.fillRect(px, py, cellW, cellH);
  // stroke aligned to pixel grid for crisp borders:
  ctx.strokeRect(Math.floor(px)+.5, Math.floor(py)+.5, Math.floor(cellW)-1, Math.floor(cellH)-1);
}
