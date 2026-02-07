# 3D Flappy Bird

## Overview
A 3D version of Flappy Bird where the player flies forward through a winding 3D world. The path curves left and right using sine waves, and the player controls only the bird's altitude via flapping. Built with React Three Fiber.

## Recent Changes
- 2026-02-07: Added particle effects (trail + death explosion), sky color shift, power-ups (shield/slowmo/shrink), speed boost scaling
- 2026-02-07: Added 6 camera angle options (close-left/right, center, far-left/right, birdview) selectable before game start
- 2026-02-07: Pipe exit animation - top slides up, bottom slides down after passing
- 2026-02-07: Pipes cast shadows like the bird
- 2026-02-07: Progressive difficulty - gap shrinks (5->3.6), pipe spacing decreases (18->12), moving pipes introduced as score increases
- 2026-02-07: Real shadow casting - bird casts shadows on ground and pipes via Three.js shadow system
- 2026-02-07: Full collision refactor - uses bird visual radius (0.4) vs pipe visual gap edges, added "dying" phase with death animation, hit pipe turns red, camera slows on death
- 2026-02-07: Added winding/turning path, fixed collision detection, tuned difficulty
- 2026-02-07: Initial implementation of 3D Flappy Bird game

## Project Architecture
- **Frontend**: React + TypeScript + React Three Fiber
- **Server**: Express (serves the client)
- **State Management**: Zustand stores
  - `useGame` - Game state (phase, score, bird physics, pipes, path, power-ups, speed)
  - `useAudio` - Sound management

### Key Components
- `client/src/components/game/Bird.tsx` - Bird character with animated wings, follows curved path, shrinks with power-up
- `client/src/components/game/Pipes.tsx` - 3D pipe obstacles placed along curved path, exit animation
- `client/src/components/game/Ground.tsx` - Ground plane, sky dome, clouds (follow bird)
- `client/src/components/game/GameScene.tsx` - Main scene, camera presets, physics, input, color shift
- `client/src/components/game/GameUI.tsx` - UI overlay (score, menus, power-up HUD, speed indicator, camera selector)
- `client/src/components/game/Particles.tsx` - Bird trail particles + death feather explosion
- `client/src/components/game/PowerUps.tsx` - 3D collectible power-up items (octahedron shapes)
- `client/src/lib/stores/useGame.tsx` - Core game logic, path function, collision detection, power-up system
- `client/src/App.tsx` - App entry point with Canvas

### Path System
- Path defined by `getPathX(z) = 8*sin(z*0.025) + 4*sin(z*0.06+1.5)`
- Bird X position automatically follows the path
- Pipes placed at path X positions
- Camera smoothly follows with look-ahead

### Power-Up System
- Shield (blue): Absorbs one pipe hit, 0.5s invulnerability after use
- Slow Motion (purple): Halves bird speed for 6 seconds
- Shrink (green): Halves bird collision radius for 6 seconds
- 25% chance to spawn at each pipe gap
- Displayed as rotating octahedrons with glow effect

### Color Shift System
- Sky transitions: blue -> sunset orange -> purple -> dark night as score increases (0-50)
- Fog color matches sky for consistency

### Speed Boost
- Bird speed scales from 13 to 22 units/sec based on score (0-40 range)
- Speed indicator shown in top-left during gameplay

### Controls
- Space / Click / Tap: Flap (also starts game)
- R: Restart after game over

### Game Constants
- Bird base speed: 13 units/sec (scales to 22 max)
- Gravity: -16
- Flap force: 7
- Pipe spacing: 18 units apart (scales to 12)
- Gap size: 5 units (scales to 3.6)
- Pipe radius: 1.0 units
- Bird visual radius: 0.4 (used for collision)

## User Preferences
- Prefers challenging gameplay (not too easy)
- Wants path turns/curves for variety
- Prefers particles, color shift, power-ups, speed boost features
