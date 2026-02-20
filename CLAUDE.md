# CLAUDE.md — Birdie

## Project Overview

3D Flappy Bird game with toon cel-shading, 5 biomes with unique pipe geometry, boss segments, power-ups, near-miss combos, and arcade leaderboard. Pure Three.js + TypeScript — no React, no game engine.

## Tech Stack

Three.js, TypeScript, Vite, custom GLSL shaders (toon/cel-shading), Web Audio API, postprocessing library, vanilla DOM for UI.

## User-Facing Language

English.

## Development

```bash
npm install
npm run dev      # Vite dev server at localhost:5173
npm run check    # TypeScript type-check
npm test         # Vitest (127+ tests)
npm run build    # Production build to dist/
```

## Project Structure

- `src/engine/` — GameEngine orchestrator, StateMachine, Clock, InputManager
- `src/renderer/` — Three.js Renderer, CameraController (shake/punch/zoom), PostProcessing
- `src/world/` — Bird (physics + mesh), PipeManager, Environment, BiomeManager, BossManager, PowerUpManager
- `src/world/biomes/` — 5 biome configs (BiomeConfig interface + Meadow/SunsetCanyon/StormSea/NeonCity/SkyTemple)
- `src/world/hazards/` — WindGust, Lightning, LaserGate, RotatingRing, HazardManager
- `src/vfx/` — ParticleSystem (500-pool GPU), SpeedLines, Afterimages
- `src/shaders/` — toon.vert/frag.glsl, particle.vert/frag.glsl, ToonMaterial.ts
- `src/audio/` — AudioManager (all sounds synthesized via Web Audio API)
- `src/game/` — ScoreManager, LeaderboardManager (localStorage)
- `src/ui/` — UIManager (vanilla DOM overlays, no React)

## Testing

Vitest with happy-dom. Tests cover: StateMachine, Clock, BirdPhysics, PipeCollision, ScoreManager, LeaderboardManager, BiomeManager, BossManager, PowerUpManager, HazardManager, AudioManager, ParticleSystem.

Test files live next to source: `src/foo/__tests__/Foo.test.ts` or `src/foo/Foo.test.ts`.

## Build Warning Exceptions

- Three.js chunk size exceeds 500KB default: `chunkSizeWarningLimit` raised to 600 in vite.config.ts. This is expected for a Three.js game bundle.

## Deployment

Static site — build with `npm run build`, serve `dist/` from any static host.

## Project-Specific Rules

- No React — all rendering is imperative Three.js
- No external fonts or audio files — everything is synthesized/procedural
- Footer "Made with care by William" required at bottom of page
