# Tetristeza

<p align="center">
  <img src="assets/branding/tetristeza-logo-1.svg" alt="Tetristeza" width="680" />
</p>

<p align="center">
  <strong>A tiny neon falling-block game with questionable emotional stability.</strong>
</p>

<p align="center">
  <a href="https://santiagorodriguez.com/Tetristeza/">
    <img src="https://img.shields.io/badge/PLAY_ONLINE-22d3ee?style=for-the-badge&labelColor=111827" alt="Play Tetristeza online" />
  </a>
  <a href="https://github.com/santirodriguez/Tetristeza/releases">
    <img src="https://img.shields.io/github/v/release/santirodriguez/Tetristeza?style=for-the-badge&labelColor=111827&color=8b5cf6" alt="Latest stable release" />
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/LICENSE-GPL--3.0-f472b6?style=for-the-badge&labelColor=111827" alt="GPL-3.0 license" />
  </a>
</p>

<p align="center">
  <img src="assets/flags/us.svg" alt="" width="20" /> <strong>English</strong>
  &nbsp;·&nbsp;
  <img src="assets/flags/argentina.svg" alt="" width="20" /> <strong>Español</strong>
  &nbsp;·&nbsp;
  <img src="assets/flags/senyera.svg" alt="" width="20" /> <strong>Català</strong>
</p>

<p align="center">
  Falling blocks, neon colors and increasingly dramatic emotional consequences.
</p>

---

## 🎮 Play

<p align="center">
  <a href="https://santiagorodriguez.com/Tetristeza/">
    <img src="https://img.shields.io/badge/▶_PLAY_TETRISTEZA-111827?style=for-the-badge" alt="Play Tetristeza" />
  </a>
</p>

Play it in a modern browser, or open `index.html` locally.

---

## 📸 Gameplay

<p align="center">
  <img src="assets/screenshots/screenshot-v1.6.0.png" alt="Tetristeza gameplay" width="900" />
</p>

<p align="center">
  <sub>Tetristeza v1.6.0 candidate gameplay.</sub>
</p>

---

## ✨ Highlights

|  |  |  |
| :---: | :---: | :---: |
| **🧱 Arcade core** | **👻 Hold, Ghost & Next** | **🏆 Global Top 10** |
| 7-bag pieces, SRS-style rotation, combos, levels and back-to-back play. | Hold one piece, preview the next three and toggle Ghost whenever optimism becomes suspicious. | Qualifying scores can join a shared arcade ranking. |
| **📱 Touch friendly** | **🪟 Move to window** | **🌐 Three languages** |
| Responsive controls with both rotation directions and press-and-hold movement. | Move the live game into its own resizable window without losing state. | English, Español and Català. |

Sound, Music, Ghost, language and personal Best are remembered locally.

Original chiptune music, responsive arcade effects and a short Game Over melody are synthesized in the browser, with no audio downloads. Music starts with play and is on by default; a previously saved off setting stays off. **Sound / M** mutes everything. Toggle **Music** independently on the control card or in **Pause**, where Sound is also available.

---

## ⌨️ Controls

| Action | Keyboard |
| --- | :---: |
| Move | `←` `→` |
| Rotate | `↑` / `X` · `Z` |
| Soft / hard drop | `↓` · `Space` |
| Hold | `C` |
| Pause / Resume | `P` / `Esc` |
| Restart | `R` |
| Ghost | `G` |
| Sound | `M` |

Touch controls are shown on screen. On desktop, **Move to window** transfers the same running game into a separate resizable window.

---

## 🏆 Top 10

At Game Over, a qualifying score can enter the global Top 10 with a player name and an optional private email.

Only **name and score** are shown publicly. Earlier scores win ties.

If a save loses its network response, retries reuse the same protected submission for the server's 15-minute receipt window. After it expires, refresh the ranking to check the result.

Opening `index.html` directly uses a local-only Top 10 for testing; it never sends scores or stores email addresses.

It is an arcade leaderboard, not an esports anti-cheat department.

---

<details>
<summary><strong>🧮 Scoring</strong></summary>

<br />

- Single: **100 × level**
- Double: **300 × level**
- Triple: **500 × level**
- Tetris: **800 × level**
- Back-to-back Tetris: **+50%**
- Soft drop: **+1 per cell**
- Hard drop: **+2 per cell**
- Combo: **+50 × level × streak**
- Level increases every **10 lines**

</details>

<details>
<summary><strong>🛠️ Technical notes</strong></summary>

<br />

Tetristeza is intentionally lightweight: plain HTML, CSS and JavaScript.

The global Top 10 requires PHP 8+, PDO SQLite and a private writable storage directory outside `DOCUMENT_ROOT`. By default, the service creates `tetristeza-private/scores.sqlite` beside the document root; `TETRISTEZA_DB_PATH` can select another private database path. Do not package a live database or place it in the public web directory.

 The detachable window moves the real game DOM instead of mirroring it, so there is still only one board and one game state.

Modern Firefox, Chromium-based browsers and Safari are the intended targets. Audio starts only after a player gesture; pausing or hiding the game silences it. Unsupported audio leaves the game playable. Native Chromium has been checked over HTTP and `file://`; Firefox, Safari and physical mobile audio/interruption checks remain release acceptance items.

Run the dependency-free audio lifecycle checks with `node --test tests/audio.test.cjs`. For a manual smoke check, play over HTTP and directly from `index.html`, toggle Sound/Music, pause, change language, and move the live game to a window and back. Verify keyboard focus and mobile Pause controls. Test leaderboard failures and retries only against an isolated PHP service with a temporary private database, never by submitting test scores to production.

The runtime logo is a transparent lossless 640 px WebP derived from the original SVG, which remains the source and README artwork. To regenerate it with a temporary Sharp installation: `sharp('assets/branding/tetristeza-logo-1.svg').resize({width:640}).webp({lossless:true}).toFile('assets/branding/tetristeza-logo-runtime.webp')`. No build toolchain is required to play.

</details>

---

## 👤 Author

Made by **[Santiago Rodriguez](https://santiagorodriguez.com)**.

<a href="https://santiagorodriguez.com/donate">
  <img src="assets/badges/donate.svg" alt="Donate" height="52" />
</a>

## 📄 License

**GNU General Public License v3.0 (GPL-3.0)** — see [LICENSE](LICENSE).
