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
- Audio starts on first interaction (browser policy)
- Score persists across page reloads (localStorage)
- No WebGL errors in browser console

## Deployment

Static file. Place `drift.html` on any static host.

## Project-Specific Rules

- Everything must stay in one file — do not split into multiple files
- No external dependencies — no npm, no CDN, no libraries
- Target: under 200 lines total
- Footer "Made with care by William" on start screen
