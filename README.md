# Birdie

A maximally juicy 3D Flappy Bird game with toon cel-shading, 5 biomes, boss fights, and an arcade leaderboard. Built from scratch with raw Three.js.

## Play

Run locally:

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Controls

- **Space / Click / Tap** — Flap
- **R** — Restart after game over
- **M** — Mute / unmute

## Features

- **5 Biomes** — Meadow, Sunset Canyon, Storm Sea, Neon City, Sky Temple — each with unique pipe geometry, palettes, and hazards
- **Boss Segments** — Special pipe patterns at biome boundaries with bonus scoring
- **Near-Miss Combos** — Bullet-time slow-mo, score multipliers, and visual feedback for close calls
- **Power-Ups** — Shield, Slow-mo, Giant, Score x2
- **Juice** — Squash-and-stretch, particles, screen shake, speed lines, chromatic aberration, death freeze frame
- **Leaderboard** — Arcade-style top 10 with name entry, persisted in localStorage
- **Audio** — Fully synthesized SFX and per-biome procedural music (no audio files)
- **Mobile** — Responsive touch controls, performance budgets for mobile devices

## Tech Stack

- **Three.js** — 3D rendering with custom GLSL toon/cel-shading
- **TypeScript** — Type safety
- **Vite** — Build tooling with GLSL plugin
- **Web Audio API** — All sounds synthesized at runtime
- **postprocessing** — Bloom, chromatic aberration, vignette

## Build

```bash
npm run build    # TypeScript check + Vite build
npm run check    # TypeScript only
npm test         # Vitest (127 tests)
```

Output goes to `dist/` — deploy with any static host.

## Project Structure

```
src/
├── engine/     GameEngine, StateMachine, Clock, InputManager
├── renderer/   Renderer, CameraController, PostProcessing
├── world/      Bird, PipeManager, Environment, BiomeManager, BossManager, PowerUpManager
│   ├── biomes/ 5 biome configs (Meadow, SunsetCanyon, StormSea, NeonCity, SkyTemple)
│   └── hazards/ WindGust, Lightning, LaserGate, RotatingRing, HazardManager
├── vfx/        ParticleSystem, SpeedLines, Afterimages
├── shaders/    GLSL shaders (toon, particles) + ToonMaterial wrapper
├── audio/      AudioManager (Web Audio API synthesized SFX)
├── game/       ScoreManager, LeaderboardManager
└── ui/         UIManager (vanilla DOM overlays, no React)
```

---

Made with care by [William](https://william.revah.paris)
