# 3D Flappy Bird

## Overview
A 3D version of Flappy Bird where the player flies forward through a winding 3D world. The path curves left and right using sine waves, and the player controls only the bird's altitude via flapping. Built with React Three Fiber.

## Recent Changes
- 2026-02-07: Added winding/turning path, fixed collision detection, tuned difficulty
- 2026-02-07: Initial implementation of 3D Flappy Bird game

## Project Architecture
- **Frontend**: React + TypeScript + React Three Fiber
- **Server**: Express (serves the client)
- **State Management**: Zustand stores
  - `useGame` - Game state (phase, score, bird physics, pipes, path)
  - `useAudio` - Sound management

### Key Components
- `client/src/components/game/Bird.tsx` - Bird character with animated wings, follows curved path
- `client/src/components/game/Pipes.tsx` - 3D pipe obstacles placed along curved path
- `client/src/components/game/Ground.tsx` - Ground plane, sky dome, clouds (follow bird)
- `client/src/components/game/GameScene.tsx` - Main scene, camera (follows curve), physics, input
- `client/src/components/game/GameUI.tsx` - UI overlay (score, menus)
- `client/src/lib/stores/useGame.tsx` - Core game logic, path function, collision detection
- `client/src/App.tsx` - App entry point with Canvas

### Path System
- Path defined by `getPathX(z) = 8*sin(z*0.025) + 4*sin(z*0.06+1.5)`
- Bird X position automatically follows the path
- Pipes placed at path X positions
- Camera smoothly follows with look-ahead

### Controls
- Space / Click / Tap: Flap (also starts game)
- R: Restart after game over

### Game Constants
- Bird speed: 13 units/sec forward
- Gravity: -16
- Flap force: 7
- Pipe spacing: 18 units apart
- Gap size: 5 units
- Pipe radius: 1.0 units
- Bird collision radius: 0.35

## User Preferences
- Prefers challenging gameplay (not too easy)
- Wants path turns/curves for variety
