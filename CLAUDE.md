# CLAUDE.md — Drift

## Project Overview

Raymarched 3D Flappy Bird-inspired game. Single HTML file, zero dependencies, under 200 lines. Tap to fly a glowing orb through pillar gaps in an abstract void with growing difficulty.

## Tech Stack

Raw WebGL2, GLSL (fragment shader raymarching), Web Audio API, vanilla JS. No libraries. No build step.

## User-Facing Language

English.

## Development

Open `drift.html` in a browser. Edit the file. Refresh. There is no build step, no dev server, no package manager.

## Project Structure

Everything is in `drift.html`:
- HTML: canvas + UI overlay elements
- CSS: fullscreen layout, UI positioning, animations
- JavaScript: game loop, physics, input, audio synthesis, WebGL setup
- GLSL: vertex shader (pass-through) + fragment shader (raymarching)

## Testing

Manual playtesting. Open the file, play the game. Key things to verify:
- Orb responds to tap with correct impulse
- Collision detection matches visual pillar positions
- Difficulty ramp is imperceptible until ~90s
- Audio starts on first interaction (browser policy), and is suspended 3 s after the last input and whenever the page is hidden; the next input wakes it
- Framed in a page of its own origin, the game posts `{type, score, best}` for each event; standalone it posts nothing
- Score persists across page reloads (localStorage)
- No WebGL errors in browser console

## Deployment

Served at `william.revah.paris/drift.html` (also reachable as `/drift`). When `drift.html` is modified, copy it to the portfolio repo:

```bash
cp drift.html ../william-revah-paris/public/drift.html
```

Note the `public/` segment — the hub is an Astro site and only `public/` is served. `./sync.sh` does exactly this and refuses to run if the destination directory is missing, so it cannot silently copy into a stray path. **`sync.sh` is tracked — do not gitignore it.** An untracked sync script means a fresh clone gets neither the correct path nor the guard, and the two copies drift apart.

Then commit in both repos. This sync is mandatory — never commit a `drift.html` change here without also updating the portfolio copy. The hub prints this file line by line as the Drift page's listing and the room's minimap, so every edit changes them.

## Project-Specific Rules

- Everything must stay in one file — do not split into multiple files
- No external dependencies — no npm, no CDN, no libraries
- Target: under 200 lines total (`wc -l drift.html` to check the current count)
- **Never add or remove a line to add a feature**: append to an existing line. The hub reads the file by line number (its listing, minimap and the `postMessage` lines it lights), so a line that moves breaks the page that prints it
- The game posts to its parent only when framed, with `targetOrigin = location.origin` and a `type` from the fixed list in `tell()`; never `'*'`
- Footer "Made with care by William" on start screen
