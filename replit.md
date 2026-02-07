# 3D Flappy Bird

## Overview
A 3D version of Flappy Bird where the player flies forward through a 3D world instead of the traditional left-to-right movement. Built with React Three Fiber.

## Recent Changes
- 2026-02-07: Initial implementation of 3D Flappy Bird game

## Project Architecture
- **Frontend**: React + TypeScript + React Three Fiber
- **Server**: Express (serves the client)
- **State Management**: Zustand stores
  - `useGame` - Game state (phase, score, bird physics, pipes)
  - `useAudio` - Sound management

### Key Components
- `client/src/components/game/Bird.tsx` - Bird character with animated wings
- `client/src/components/game/Pipes.tsx` - 3D pipe obstacles (cylinders with gaps)
- `client/src/components/game/Ground.tsx` - Ground plane, sky dome, clouds
- `client/src/components/game/GameScene.tsx` - Main scene, camera, physics, input
- `client/src/components/game/GameUI.tsx` - UI overlay (score, menus)
- `client/src/lib/stores/useGame.tsx` - Core game logic and state
- `client/src/App.tsx` - App entry point with Canvas

### Controls
- Space / Click / Tap: Flap (also starts game)
- R: Restart after game over

### Game Constants
- Bird speed: 12 units/sec forward
- Gravity: -18
- Flap force: 7
- Pipe spacing: 20 units apart
- Gap size: 5 units

## User Preferences
- None recorded yet
