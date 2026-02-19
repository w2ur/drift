# 3D Flappy Bird Rebuild - Design Document

**Date**: 2026-02-18
**Status**: Approved

## Overview

A complete rebuild of Birdie as a maximally juicy, visually stunning 3D Flappy Bird with toon/cel-shading, biome transitions, boss segments, and an arcade-style leaderboard. Built from scratch with raw Three.js (no React) for maximum performance and control.

## Tech Stack

- **Three.js** — 3D rendering, custom shaders, post-processing
- **TypeScript** — type safety and DX
- **Vite** — fast dev, hot reload, build
- **Custom GLSL** — toon shaders, outlines, bloom, screen effects
- **Vanilla DOM** — minimal UI overlays (score, menus, HUD)
- **Web Audio API** — spatial audio, music crossfade, synthesized SFX

No React. No ECS. No game engine. Clean imperative game code.

## Visual Style

Stylized toon/cel-shading inspired by Zelda: Wind Waker. Bold outlines, vibrant flat colors, dynamic palettes per biome.

## Architecture

```
GameEngine
├── StateMachine (ready → playing → dying → ended)
├── Clock (delta time, elapsed)
├── InputManager (keyboard, touch, pointer — unified)
├── World
│   ├── Bird (physics, animation, squash-and-stretch)
│   ├── PipeManager (spawning, scrolling, collision)
│   ├── BiomeManager (transitions, palette, pipe styles)
│   ├── ParticleSystem (trails, explosions, effects)
│   └── PowerUpManager (spawning, active effects)
├── Renderer (Three.js, post-processing pipeline)
├── CameraController (follow, shake, punch, slow-mo, Dutch angle)
├── AudioManager (Web Audio API, spatial, music crossfade)
├── ScoreManager (combos, multipliers, localStorage)
├── LeaderboardManager (top 10, pseudo entry, localStorage)
└── UIManager (vanilla DOM overlays — score, menus, HUD)
```

### Render Pipeline

1. Toon shader pass (custom material on all meshes)
2. Outline pass (sobel edge detection on normals/depth)
3. Bloom pass (selective, for power-ups and effects)
4. Chromatic aberration (scales with speed, spikes on death)
5. Vignette + color grading (per-biome LUT)
6. Motion blur (per-object radial blur on pipes)

### Physics

Simple gravity model (same proven approach as current game):
- Gravity: -16
- Flap force: 7
- Delta-time clamped to 0.05s for stability
- Squash-and-stretch deformation on bird mesh based on velocity

## Biomes

5 biomes, each lasting ~25 pipes before transitioning. Boss segment at each boundary.

| Biome | Palette | Pipes | Unique Hazard |
|-------|---------|-------|---------------|
| Meadow (start) | Bright greens, sky blue, white clouds | Wooden posts with flowers | None (tutorial zone) |
| Sunset Canyon | Warm oranges, deep reds, purple sky | Red rock pillars | Wind gusts (horizontal push) |
| Storm Sea | Dark grays, teal water, lightning flashes | Barnacle-covered steel | Lightning strikes (flash + narrow safe zone) |
| Neon City | Dark purple, neon pink/cyan/yellow glow | Glowing circuit-board towers | Moving laser gates between pipes |
| Sky Temple | White marble, gold, ethereal fog | Marble columns with gold trim | Rotating stone rings |

After Sky Temple, loops back to Meadow at higher difficulty. Loop counter displayed.

### Biome Transitions (over ~5 seconds)

- Sky color lerps between palettes
- Ground texture crossfades
- Fog density/color shifts
- Pipe style changes gradually
- Music crossfades between tracks

### Boss Segments (at each biome boundary)

- 3-5 second "boss pipe" sequence
- Unique pattern per biome exit
- Dramatic camera zoom-out during boss, returns to normal after
- Bonus points for clearing cleanly

## Juice & Game Feel

### On Every Flap

- Bird squashes (0.7x height, 1.3x width) then springs back over 0.1s
- Wing snap animation with motion blur
- Small upward particle burst (2-3 feather particles)
- Subtle camera micro-bounce (1px up)
- Haptic feedback on mobile (if supported)

### Near-Miss System (within 0.3 units of pipe)

- Time slows to 0.3x for 0.2 seconds ("bullet time")
- Screen edges flash white briefly
- "CLOSE!" text pops with scale animation
- Combo counter increments (x2, x3... score multiplier)
- Camera slight zoom-in during slow-mo
- Increasing pitch sound effect per combo

### On Scoring

- Score number punches up with spring animation
- Quick screen-edge glow in biome accent color
- Satisfying "ding" with pitch increasing per combo

### On Death

- 0.3s freeze frame (everything stops)
- Camera punch backward
- Bird ragdolls with feather explosion (30+ particles)
- Screen cracks outward from bird position (shader effect)
- Chromatic aberration burst
- Screen desaturates to grayscale as bird falls
- Pipe shatter sends chunks flying with physics
- Bass-heavy impact sound
- 0.5s pause before game over UI

### Speed Effects

- Speed lines: radial lines from screen center at high speeds (>18 units/s)
- Bird afterimages: ghostly copies trail behind at high speed
- Camera roll: slight Dutch angle tilting into turns
- Barrel distortion: subtle at high speed, fish-eye pulse on flap

### Combo System (x5+)

- Background starts pulsing
- Screen edges get rainbow shimmer
- Maximum particle density

### Screen Shake (Perlin noise-based)

- Boss entry: medium, 0.3s
- Power-up collect: light, 0.1s
- Death: heavy, 0.5s

## Power-Ups

Spawn randomly, ~15% chance per pipe.

| Power-Up | Color | Effect | Duration |
|----------|-------|--------|----------|
| Shield | Blue orb | Absorbs one hit | Until hit |
| Slow-mo | Purple | 0.5x game speed | 5 seconds |
| Giant | Red | Bird grows 2x, smashes through one pipe | One-time use |
| Score x2 | Gold star | Double points | 10 seconds |

No coin shop, no skins, no persistent progression beyond the leaderboard. Classic arcade design.

## Leaderboard

- Arcade/flipper-style top 10 board
- Players enter a pseudo (name) when achieving a top 10 score
- Stored in localStorage
- Displayed on game over screen and start screen
- Classic gold/silver/bronze highlighting for top 3

## Audio

### Music

- One looping track per biome
- Crossfade over 3 seconds during biome transitions
- Tempo subtly increases with game speed
- Boss segments get intensity ramp / drum fill

### Sound Effects

- Flap: quick whoosh, pitch variation (±10%)
- Score: ascending "ding", pitch rises with combo
- Near-miss: dramatic swoosh + bass thump
- Power-up collect: magical shimmer, unique per type
- Shield break: glass shatter
- Giant smash: heavy bass impact + pipe crumble
- Boss entry: warning horn
- Boss clear: triumphant fanfare sting
- Death: impact, slow-mo whoosh, sad trombone fade
- New high score: celebratory jingle

Implementation via Web Audio API with spatial audio on pipes (stereo panning).

## Controls

- Space / Click / Tap: Flap
- R: Restart after game over
- M: Mute/unmute
- Mobile: full touch support

## Constraints

- Must run for free in any modern web browser
- No backend required (localStorage for persistence)
- No paid assets (synthesized audio, procedural textures, or CC0 sources)
- Zero build warnings
- Must include "Made with care by William" footer linking to https://william.revah.paris
