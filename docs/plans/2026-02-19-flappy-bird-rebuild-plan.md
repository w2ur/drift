# 3D Flappy Bird Rebuild - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild Birdie from scratch as a maximally juicy 3D Flappy Bird with toon/cel-shading, 5 biomes, boss segments, and arcade leaderboard — using raw Three.js, no React.

**Architecture:** Clean imperative game engine with a central `GameEngine` class owning a `StateMachine`, `Clock`, `InputManager`, `World` (Bird, PipeManager, BiomeManager, ParticleSystem, PowerUpManager), `Renderer` (Three.js + post-processing), `CameraController`, `AudioManager`, `ScoreManager`, `LeaderboardManager`, and `UIManager`. No frameworks — vanilla DOM for UI overlays.

**Tech Stack:** Three.js, TypeScript, Vite, custom GLSL shaders, Web Audio API, vanilla DOM.

**Design doc:** `docs/plans/2026-02-18-3d-flappy-bird-rebuild-design.md`

---

## Phase 1: Foundation

### Task 1: Project Scaffold

**Files:**
- Delete: `client/`, `server/`, `shared/`, `script/`, `drizzle.config.ts`, `postcss.config.js`, `tailwind.config.ts`, `replit.md`, `.replit`
- Create: `src/main.ts` (entry point)
- Create: `src/engine/GameEngine.ts` (empty class stub)
- Create: `index.html` (root HTML)
- Create: `vite.config.ts` (new, minimal)
- Create: `tsconfig.json` (new, strict)
- Create: `package.json` (new, minimal deps)
- Keep: `docs/`, `.gitignore`

**Step 1: Remove old project files**

```bash
rm -rf client server shared script drizzle.config.ts postcss.config.js tailwind.config.ts replit.md .replit package.json package-lock.json vite.config.ts tsconfig.json
```

**Step 2: Initialize new project**

```bash
npm init -y
npm install three
npm install -D typescript vite vite-plugin-glsl @types/three
```

**Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "jsx": "preserve",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 4: Create `vite.config.ts`**

```typescript
import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";
import path from "path";

export default defineConfig({
  plugins: [glsl()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  assetsInclude: ["**/*.gltf", "**/*.glb", "**/*.mp3", "**/*.ogg", "**/*.wav"],
});
```

**Step 5: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Birdie</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    body { background: #000; font-family: system-ui, -apple-system, sans-serif; }
    #game { width: 100%; height: 100%; }
    #ui { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
    #ui > * { pointer-events: auto; }
    footer {
      position: fixed; bottom: 8px; width: 100%; text-align: center;
      font-size: 12px; color: rgba(255,255,255,0.5); pointer-events: auto; z-index: 100;
    }
    footer a { color: rgba(255,255,255,0.7); text-decoration: none; }
    footer a:hover { color: #fff; }
  </style>
</head>
<body>
  <div id="game"></div>
  <div id="ui"></div>
  <footer>Made with care by <a href="https://william.revah.paris" target="_blank">William</a></footer>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

**Step 6: Create `src/main.ts` stub**

```typescript
import { GameEngine } from "./engine/GameEngine";

const game = new GameEngine();
game.start();
```

**Step 7: Create `src/engine/GameEngine.ts` stub**

```typescript
export class GameEngine {
  start(): void {
    console.log("Birdie engine started");
  }
}
```

**Step 8: Update `package.json` scripts**

Add to `package.json`:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "check": "tsc --noEmit"
  }
}
```

**Step 9: Verify it runs**

```bash
npm run dev
```

Open browser — should see black screen with "Birdie engine started" in console and footer visible.

**Step 10: Commit**

```bash
git add -A
git commit -m "chore: scaffold new Three.js + TypeScript + Vite project"
```

---

### Task 2: Core Engine — StateMachine, Clock, Game Loop

**Files:**
- Create: `src/engine/StateMachine.ts`
- Create: `src/engine/Clock.ts`
- Modify: `src/engine/GameEngine.ts`
- Create: `src/engine/__tests__/StateMachine.test.ts`
- Create: `src/engine/__tests__/Clock.test.ts`

**Step 1: Install Vitest**

```bash
npm install -D vitest
```

Add to `package.json` scripts: `"test": "vitest run", "test:watch": "vitest"`

**Step 2: Write StateMachine test**

```typescript
// src/engine/__tests__/StateMachine.test.ts
import { describe, it, expect, vi } from "vitest";
import { StateMachine, GamePhase } from "../StateMachine";

describe("StateMachine", () => {
  it("starts in ready phase", () => {
    const sm = new StateMachine();
    expect(sm.phase).toBe("ready");
  });

  it("transitions ready → playing", () => {
    const sm = new StateMachine();
    sm.transition("playing");
    expect(sm.phase).toBe("playing");
  });

  it("transitions playing → dying → ended", () => {
    const sm = new StateMachine();
    sm.transition("playing");
    sm.transition("dying");
    expect(sm.phase).toBe("dying");
    sm.transition("ended");
    expect(sm.phase).toBe("ended");
  });

  it("transitions ended → ready (restart)", () => {
    const sm = new StateMachine();
    sm.transition("playing");
    sm.transition("dying");
    sm.transition("ended");
    sm.transition("ready");
    expect(sm.phase).toBe("ready");
  });

  it("rejects invalid transitions", () => {
    const sm = new StateMachine();
    expect(sm.transition("ended")).toBe(false);
    expect(sm.phase).toBe("ready");
  });

  it("fires callbacks on transition", () => {
    const sm = new StateMachine();
    const cb = vi.fn();
    sm.on("playing", cb);
    sm.transition("playing");
    expect(cb).toHaveBeenCalledWith("ready");
  });
});
```

**Step 3: Run test to verify it fails**

```bash
npx vitest run src/engine/__tests__/StateMachine.test.ts
```

Expected: FAIL — module not found.

**Step 4: Implement StateMachine**

```typescript
// src/engine/StateMachine.ts
export type GamePhase = "ready" | "playing" | "dying" | "ended";

const VALID_TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  ready: ["playing"],
  playing: ["dying"],
  dying: ["ended"],
  ended: ["ready"],
};

type PhaseCallback = (from: GamePhase) => void;

export class StateMachine {
  phase: GamePhase = "ready";
  private listeners = new Map<GamePhase, PhaseCallback[]>();

  transition(to: GamePhase): boolean {
    if (!VALID_TRANSITIONS[this.phase].includes(to)) return false;
    const from = this.phase;
    this.phase = to;
    this.listeners.get(to)?.forEach((cb) => cb(from));
    return true;
  }

  on(phase: GamePhase, callback: PhaseCallback): void {
    if (!this.listeners.has(phase)) this.listeners.set(phase, []);
    this.listeners.get(phase)!.push(callback);
  }

  reset(): void {
    this.phase = "ready";
  }
}
```

**Step 5: Run test to verify it passes**

```bash
npx vitest run src/engine/__tests__/StateMachine.test.ts
```

Expected: PASS.

**Step 6: Write Clock test**

```typescript
// src/engine/__tests__/Clock.test.ts
import { describe, it, expect } from "vitest";
import { Clock } from "../Clock";

describe("Clock", () => {
  it("returns clamped delta", () => {
    const clock = new Clock();
    // Simulate a frame with a known delta
    const delta = clock.clampDelta(0.016);
    expect(delta).toBeCloseTo(0.016);
  });

  it("clamps large deltas to 0.05", () => {
    const clock = new Clock();
    const delta = clock.clampDelta(0.2);
    expect(delta).toBe(0.05);
  });

  it("tracks elapsed time", () => {
    const clock = new Clock();
    clock.tick(0.016);
    clock.tick(0.016);
    expect(clock.elapsed).toBeCloseTo(0.032);
  });

  it("supports time scale for slow-mo", () => {
    const clock = new Clock();
    clock.timeScale = 0.5;
    clock.tick(0.016);
    expect(clock.scaledDelta).toBeCloseTo(0.008);
  });
});
```

**Step 7: Implement Clock**

```typescript
// src/engine/Clock.ts
export class Clock {
  elapsed = 0;
  delta = 0;
  scaledDelta = 0;
  timeScale = 1;
  private maxDelta = 0.05;

  clampDelta(raw: number): number {
    return Math.min(raw, this.maxDelta);
  }

  tick(rawDelta: number): void {
    this.delta = this.clampDelta(rawDelta);
    this.scaledDelta = this.delta * this.timeScale;
    this.elapsed += this.scaledDelta;
  }

  reset(): void {
    this.elapsed = 0;
    this.delta = 0;
    this.scaledDelta = 0;
    this.timeScale = 1;
  }
}
```

**Step 8: Run all tests**

```bash
npx vitest run
```

Expected: All PASS.

**Step 9: Wire GameEngine with StateMachine + Clock + requestAnimationFrame loop**

```typescript
// src/engine/GameEngine.ts
import { StateMachine } from "./StateMachine";
import { Clock } from "./Clock";

export class GameEngine {
  readonly state = new StateMachine();
  readonly clock = new Clock();
  private animationId = 0;
  private lastTime = 0;
  private running = false;

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.loop();
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.animationId);
  }

  private loop = (): void => {
    if (!this.running) return;
    const now = performance.now();
    const rawDelta = (now - this.lastTime) / 1000;
    this.lastTime = now;
    this.clock.tick(rawDelta);
    this.update(this.clock.scaledDelta);
    this.animationId = requestAnimationFrame(this.loop);
  };

  private update(delta: number): void {
    // Will be filled in by subsequent tasks
  }
}
```

**Step 10: Commit**

```bash
git add -A
git commit -m "feat: add StateMachine, Clock, and GameEngine loop"
```

---

### Task 3: Input Manager

**Files:**
- Create: `src/engine/InputManager.ts`
- Create: `src/engine/__tests__/InputManager.test.ts`
- Modify: `src/engine/GameEngine.ts`

**Step 1: Write InputManager test**

```typescript
// src/engine/__tests__/InputManager.test.ts
import { describe, it, expect, vi } from "vitest";
import { InputManager } from "../InputManager";

describe("InputManager", () => {
  it("fires flap callback on registered action", () => {
    const im = new InputManager();
    const cb = vi.fn();
    im.on("flap", cb);
    im.trigger("flap");
    expect(cb).toHaveBeenCalledOnce();
  });

  it("fires restart callback", () => {
    const im = new InputManager();
    const cb = vi.fn();
    im.on("restart", cb);
    im.trigger("restart");
    expect(cb).toHaveBeenCalledOnce();
  });

  it("fires mute callback", () => {
    const im = new InputManager();
    const cb = vi.fn();
    im.on("mute", cb);
    im.trigger("mute");
    expect(cb).toHaveBeenCalledOnce();
  });
});
```

**Step 2: Run test — expect fail**

```bash
npx vitest run src/engine/__tests__/InputManager.test.ts
```

**Step 3: Implement InputManager**

```typescript
// src/engine/InputManager.ts
export type InputAction = "flap" | "restart" | "mute";
type ActionCallback = () => void;

export class InputManager {
  private listeners = new Map<InputAction, ActionCallback[]>();
  private boundKeydown: ((e: KeyboardEvent) => void) | null = null;
  private boundPointerdown: ((e: PointerEvent) => void) | null = null;

  on(action: InputAction, callback: ActionCallback): void {
    if (!this.listeners.has(action)) this.listeners.set(action, []);
    this.listeners.get(action)!.push(callback);
  }

  trigger(action: InputAction): void {
    this.listeners.get(action)?.forEach((cb) => cb());
  }

  bind(): void {
    this.boundKeydown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        this.trigger("flap");
      }
      if (e.code === "KeyR") this.trigger("restart");
      if (e.code === "KeyM") this.trigger("mute");
    };

    this.boundPointerdown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("button") || target.closest("input") || target.closest("footer")) return;
      this.trigger("flap");
    };

    window.addEventListener("keydown", this.boundKeydown);
    window.addEventListener("pointerdown", this.boundPointerdown);
  }

  unbind(): void {
    if (this.boundKeydown) window.removeEventListener("keydown", this.boundKeydown);
    if (this.boundPointerdown) window.removeEventListener("pointerdown", this.boundPointerdown);
  }
}
```

**Step 4: Run tests — expect pass**

```bash
npx vitest run
```

**Step 5: Wire InputManager into GameEngine**

Add to `GameEngine`:
```typescript
import { InputManager } from "./InputManager";

// In constructor area:
readonly input = new InputManager();

// In start():
this.input.bind();
this.input.on("flap", () => this.handleFlap());
this.input.on("restart", () => this.handleRestart());

// Add methods:
private handleFlap(): void {
  if (this.state.phase === "ready") {
    this.state.transition("playing");
  }
  // Bird flap will be added in Task 5
}

private handleRestart(): void {
  if (this.state.phase === "ended") {
    this.state.reset();
  }
}
```

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add InputManager with keyboard and touch support"
```

---

### Task 4: Three.js Renderer + Scene Setup

**Files:**
- Create: `src/renderer/Renderer.ts`
- Modify: `src/engine/GameEngine.ts`
- Modify: `src/main.ts`

**Step 1: Create Renderer class**

```typescript
// src/renderer/Renderer.ts
import * as THREE from "three";

export class Renderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;

  constructor(container: HTMLElement) {
    // WebGL renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    container.appendChild(this.renderer.domElement);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x87ceeb, 80, 180);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      500
    );
    this.camera.position.set(0, 6, 8);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(8, 20, 0);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    dirLight.shadow.bias = -0.001;
    dirLight.shadow.camera.left = -15;
    dirLight.shadow.camera.right = 15;
    dirLight.shadow.camera.top = 15;
    dirLight.shadow.camera.bottom = -15;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 40;
    this.scene.add(dirLight);
    this.scene.add(dirLight.target);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 10, -10);
    this.scene.add(fillLight);

    // Handle resize
    window.addEventListener("resize", () => this.onResize(container));
  }

  private onResize(container: HTMLElement): void {
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  get directionalLight(): THREE.DirectionalLight {
    return this.scene.children.find(
      (c) => c instanceof THREE.DirectionalLight && c.castShadow
    ) as THREE.DirectionalLight;
  }
}
```

**Step 2: Wire Renderer into GameEngine**

Update `GameEngine.ts`:
```typescript
import { Renderer } from "../renderer/Renderer";

// Add field:
renderer!: Renderer;

// In start():
const container = document.getElementById("game")!;
this.renderer = new Renderer(container);

// In update():
this.renderer.render();
```

**Step 3: Update `src/main.ts`**

```typescript
import { GameEngine } from "./engine/GameEngine";

const game = new GameEngine();
game.start();
```

**Step 4: Verify — open browser**

Should see a black-ish scene with fog and lighting (empty scene with fog color visible).

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Three.js renderer with scene, camera, and lighting"
```

---

## Phase 2: Core Gameplay

### Task 5: Bird Model + Physics

**Files:**
- Create: `src/world/Bird.ts`
- Create: `src/world/__tests__/Bird.test.ts`
- Modify: `src/engine/GameEngine.ts`

**Step 1: Write Bird physics test**

```typescript
// src/world/__tests__/Bird.test.ts
import { describe, it, expect } from "vitest";
import { BirdPhysics } from "../Bird";

describe("BirdPhysics", () => {
  it("starts at initial position", () => {
    const bird = new BirdPhysics();
    expect(bird.y).toBe(4);
    expect(bird.z).toBe(0);
    expect(bird.velocity).toBe(0);
  });

  it("applies gravity each tick", () => {
    const bird = new BirdPhysics();
    bird.velocity = 0;
    bird.tick(0.016, 13);
    expect(bird.velocity).toBeLessThan(0);
    expect(bird.y).toBeLessThan(4);
  });

  it("flap sets upward velocity", () => {
    const bird = new BirdPhysics();
    bird.flap();
    expect(bird.velocity).toBe(7);
  });

  it("moves forward along z axis", () => {
    const bird = new BirdPhysics();
    bird.tick(0.016, 13);
    expect(bird.z).toBeLessThan(0);
  });

  it("follows winding path on x axis", () => {
    const bird = new BirdPhysics();
    bird.tick(1, 13);
    // x should follow getPathX(z)
    expect(bird.x).not.toBe(0);
  });

  it("detects ground collision", () => {
    const bird = new BirdPhysics();
    bird.y = 0.3;
    bird.velocity = -5;
    const result = bird.tick(0.1, 13);
    expect(result.hitGround).toBe(true);
  });

  it("detects ceiling collision", () => {
    const bird = new BirdPhysics();
    bird.y = 12.1;
    const result = bird.tick(0.016, 13);
    expect(result.hitCeiling).toBe(true);
  });
});
```

**Step 2: Run test — expect fail**

```bash
npx vitest run src/world/__tests__/Bird.test.ts
```

**Step 3: Implement BirdPhysics + Bird mesh**

```typescript
// src/world/Bird.ts
import * as THREE from "three";

const GRAVITY = -16;
const FLAP_FORCE = 7;
const BIRD_RADIUS = 0.4;

export function getPathX(z: number): number {
  return 8 * Math.sin(z * 0.025) + 4 * Math.sin(z * 0.06 + 1.5);
}

interface TickResult {
  hitGround: boolean;
  hitCeiling: boolean;
}

export class BirdPhysics {
  y = 4;
  x = 0;
  z = 0;
  velocity = 0;
  radius = BIRD_RADIUS;

  flap(): void {
    this.velocity = FLAP_FORCE;
  }

  tick(delta: number, speed: number): TickResult {
    this.velocity += GRAVITY * delta;
    this.y += this.velocity * delta;
    this.z -= speed * delta;
    this.x = getPathX(this.z);

    if (this.y < this.radius) {
      return { hitGround: true, hitCeiling: false };
    }
    if (this.y > 12) {
      return { hitGround: false, hitCeiling: true };
    }
    return { hitGround: false, hitCeiling: false };
  }

  reset(): void {
    this.y = 4;
    this.x = 0;
    this.z = 0;
    this.velocity = 0;
    this.radius = BIRD_RADIUS;
  }
}

export class Bird {
  readonly group = new THREE.Group();
  readonly physics = new BirdPhysics();
  private body!: THREE.Mesh;
  private wingL!: THREE.Mesh;
  private wingR!: THREE.Mesh;
  private squashScale = new THREE.Vector3(1, 1, 1);
  private squashTarget = new THREE.Vector3(1, 1, 1);

  constructor() {
    this.buildMesh();
  }

  private buildMesh(): void {
    // Body — golden sphere
    const bodyGeo = new THREE.SphereGeometry(0.4, 16, 12);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.4, metalness: 0.1 });
    this.body = new THREE.Mesh(bodyGeo, bodyMat);
    this.body.castShadow = true;
    this.group.add(this.body);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const eyeBlack = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const pupilGeo = new THREE.SphereGeometry(0.04, 8, 8);

    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(eyeGeo, eyeWhite);
      eye.position.set(side * 0.15, 0.1, -0.32);
      this.group.add(eye);
      const pupil = new THREE.Mesh(pupilGeo, eyeBlack);
      pupil.position.set(side * 0.15, 0.1, -0.38);
      this.group.add(pupil);
    }

    // Beak — orange cone
    const beakGeo = new THREE.ConeGeometry(0.08, 0.2, 8);
    const beakMat = new THREE.MeshStandardMaterial({ color: 0xff8c00 });
    const beak = new THREE.Mesh(beakGeo, beakMat);
    beak.rotation.x = -Math.PI / 2;
    beak.position.set(0, -0.02, -0.45);
    this.group.add(beak);

    // Wings
    const wingGeo = new THREE.BoxGeometry(0.35, 0.06, 0.2);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0xffa500, roughness: 0.5 });
    this.wingL = new THREE.Mesh(wingGeo, wingMat);
    this.wingL.position.set(-0.38, 0, 0);
    this.wingL.castShadow = true;
    this.group.add(this.wingL);

    this.wingR = new THREE.Mesh(wingGeo, wingMat);
    this.wingR.position.set(0.38, 0, 0);
    this.wingR.castShadow = true;
    this.group.add(this.wingR);

    // Tail
    const tailGeo = new THREE.BoxGeometry(0.15, 0.08, 0.12);
    const tailMat = new THREE.MeshStandardMaterial({ color: 0xffa500 });
    const tail = new THREE.Mesh(tailGeo, tailMat);
    tail.position.set(0, 0.05, 0.35);
    this.group.add(tail);
  }

  update(delta: number, isPlaying: boolean, elapsed: number): void {
    // Position
    this.group.position.set(this.physics.x, this.physics.y, this.physics.z);

    // Wing flap animation
    const wingFreq = isPlaying ? 15 : 8;
    const wingAngle = Math.sin(elapsed * wingFreq) * 0.6;
    this.wingL.rotation.z = wingAngle;
    this.wingR.rotation.z = -wingAngle;

    // Pitch based on velocity
    const pitch = THREE.MathUtils.clamp(this.physics.velocity * 0.07, -0.5, 0.5);
    this.group.rotation.x = pitch;

    // Yaw — look along path
    const lookAheadZ = this.physics.z - 2;
    const lookAheadX = getPathX(lookAheadZ);
    const dx = lookAheadX - this.physics.x;
    const yaw = Math.atan2(dx, -2);
    this.group.rotation.y = yaw;

    // Bank into turns
    this.group.rotation.z = -yaw * 0.4;

    // Squash and stretch — lerp toward target
    this.squashScale.lerp(this.squashTarget, 0.15);
    this.body.scale.copy(this.squashScale);
  }

  triggerSquash(): void {
    // On flap: squash vertically, stretch horizontally
    this.squashScale.set(1.3, 0.7, 1.1);
    this.squashTarget.set(1, 1, 1);
  }
}
```

**Step 4: Run tests — expect pass**

```bash
npx vitest run
```

**Step 5: Wire Bird into GameEngine**

Add Bird to GameEngine: instantiate in `start()`, add `bird.group` to `scene`, call `bird.update()` and `bird.physics.tick()` in `update()`. Wire `handleFlap` to call `bird.physics.flap()` and `bird.triggerSquash()`.

**Step 6: Verify — bird visible and controllable in browser**

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Bird with physics, mesh, and squash-stretch animation"
```

---

### Task 6: Camera Controller

**Files:**
- Create: `src/renderer/CameraController.ts`
- Modify: `src/engine/GameEngine.ts`

**Step 1: Implement CameraController**

```typescript
// src/renderer/CameraController.ts
import * as THREE from "three";
import { getPathX } from "../world/Bird";

// Perlin noise simplex approximation for screen shake
function noise2D(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return (n - Math.floor(n)) * 2 - 1;
}

interface ShakeConfig {
  intensity: number;
  duration: number;
}

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private smoothPos = new THREE.Vector3(0, 6, 8);
  private smoothLook = new THREE.Vector3(0, 4, -10);
  private shakeOffset = new THREE.Vector3();
  private shakeTime = 0;
  private shakeDuration = 0;
  private shakeIntensity = 0;
  private punchOffset = new THREE.Vector3();
  private punchDecay = 0;
  private dutchAngle = 0;
  private targetDutchAngle = 0;

  // Camera preset
  private behindDist = 6;
  private sideOffset = -3;
  private height = 1.8;
  private lookAheadZ = -10;
  private lookY = 0.2;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
  }

  update(
    birdX: number,
    birdY: number,
    birdZ: number,
    isDying: boolean,
    delta: number,
    elapsed: number
  ): void {
    const lerpSpeed = isDying ? 0.03 : 0.12;

    const behindZ = birdZ + this.behindDist;
    const behindX = getPathX(behindZ);

    const targetPos = new THREE.Vector3(
      behindX * 0.5 + birdX * 0.5 + this.sideOffset,
      birdY + this.height,
      behindZ
    );

    const lookZ = birdZ + this.lookAheadZ;
    const lookX = getPathX(lookZ);
    const targetLook = new THREE.Vector3(
      lookX * 0.7 + birdX * 0.3,
      birdY + this.lookY,
      lookZ
    );

    this.smoothPos.lerp(targetPos, lerpSpeed);
    this.smoothLook.lerp(targetLook, lerpSpeed);

    // Screen shake
    this.updateShake(delta, elapsed);

    // Punch decay
    this.punchOffset.multiplyScalar(0.9);

    // Dutch angle
    const pathDx = getPathX(birdZ - 2) - birdX;
    this.targetDutchAngle = -Math.atan2(pathDx, 2) * 0.15;
    this.dutchAngle += (this.targetDutchAngle - this.dutchAngle) * 0.05;

    // Apply
    this.camera.position.copy(this.smoothPos).add(this.shakeOffset).add(this.punchOffset);
    this.camera.lookAt(this.smoothLook);
    this.camera.rotation.z = this.dutchAngle;
  }

  shake(config: ShakeConfig): void {
    this.shakeIntensity = config.intensity;
    this.shakeDuration = config.duration;
    this.shakeTime = 0;
  }

  punch(direction: THREE.Vector3): void {
    this.punchOffset.copy(direction);
  }

  microBounce(): void {
    this.punchOffset.set(0, 0.02, 0);
  }

  private updateShake(delta: number, elapsed: number): void {
    if (this.shakeTime < this.shakeDuration) {
      this.shakeTime += delta;
      const t = 1 - this.shakeTime / this.shakeDuration;
      const intensity = this.shakeIntensity * t;
      this.shakeOffset.set(
        noise2D(elapsed * 50, 0) * intensity,
        noise2D(0, elapsed * 50) * intensity,
        noise2D(elapsed * 50, elapsed * 50) * intensity * 0.5
      );
    } else {
      this.shakeOffset.set(0, 0, 0);
    }
  }
}
```

**Step 2: Wire into GameEngine update loop**

**Step 3: Verify — camera follows bird smoothly in browser**

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add CameraController with shake, punch, and Dutch angle"
```

---

### Task 7: Pipe System

**Files:**
- Create: `src/world/PipeManager.ts`
- Create: `src/world/__tests__/PipeManager.test.ts`
- Modify: `src/engine/GameEngine.ts`

**Step 1: Write pipe collision + scoring tests**

```typescript
// src/world/__tests__/PipeManager.test.ts
import { describe, it, expect } from "vitest";
import { checkCollision, Pipe, getDifficulty, getPathX } from "../PipeManager";

describe("Pipe collision", () => {
  it("returns false when bird is far from pipe", () => {
    const pipe: Pipe = { id: 0, z: -20, x: 0, gapY: 4, gapSize: 5, passed: false, hit: false };
    const result = checkCollision(4, -10, 0.4, pipe);
    expect(result.hit).toBe(false);
  });

  it("returns true when bird hits bottom pipe", () => {
    const pipe: Pipe = { id: 0, z: -10, x: 0, gapY: 5, gapSize: 4, passed: false, hit: false };
    const result = checkCollision(2, -10, 0.4, pipe);
    expect(result.hit).toBe(true);
  });

  it("returns true when bird hits top pipe", () => {
    const pipe: Pipe = { id: 0, z: -10, x: 0, gapY: 4, gapSize: 4, passed: false, hit: false };
    const result = checkCollision(7, -10, 0.4, pipe);
    expect(result.hit).toBe(true);
  });

  it("returns false when bird is in gap", () => {
    const pipe: Pipe = { id: 0, z: -10, x: 0, gapY: 4, gapSize: 5, passed: false, hit: false };
    const result = checkCollision(4, -10, 0.4, pipe);
    expect(result.hit).toBe(false);
  });
});

describe("Difficulty scaling", () => {
  it("starts easy", () => {
    const d = getDifficulty(0);
    expect(d.gapSize).toBe(5.0);
    expect(d.speed).toBe(13);
  });

  it("gets harder with score", () => {
    const d = getDifficulty(80);
    expect(d.gapSize).toBeLessThan(4);
    expect(d.speed).toBeGreaterThan(20);
  });
});
```

**Step 2: Run test — expect fail**

**Step 3: Implement PipeManager**

The `PipeManager` class manages pipe spawning, movement, collision detection, and rendering. Key elements:
- `Pipe` interface: id, z, x, gapY, gapSize, passed, hit, moveSpeed, moveRange, moveOffset, baseGapY
- `checkCollision(birdY, birdZ, birdRadius, pipe)` — pure function
- `getDifficulty(score)` — pure function (same scaling as current game)
- `PipeManager.update(delta, birdZ, birdY, birdRadius, score)` — returns `{ scored: number, hitPipe: Pipe | null, nearMisses: Pipe[] }`
- Pipe meshes: green cylinders with caps, added to a `THREE.Group`
- Near-miss detection: bird passes within 0.3 units of pipe edge
- Pipe recycling: remove pipes far behind bird, spawn ahead

**Step 4: Run tests — expect pass**

**Step 5: Wire into GameEngine — add collision → death, scoring**

**Step 6: Verify — pipes visible, collision works, score increments**

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add PipeManager with collision, scoring, and near-miss detection"
```

---

### Task 8: Ground, Sky & Environment

**Files:**
- Create: `src/world/Environment.ts`
- Modify: `src/engine/GameEngine.ts`

**Step 1: Implement Environment**

```typescript
// src/world/Environment.ts
import * as THREE from "three";

export class Environment {
  readonly group = new THREE.Group();
  private ground!: THREE.Mesh;
  private sky!: THREE.Mesh;
  private clouds: THREE.Group[] = [];

  constructor() {
    this.buildGround();
    this.buildSky();
    this.buildClouds();
  }

  private buildGround(): void {
    const geo = new THREE.PlaneGeometry(400, 400);
    const mat = new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.8 });
    this.ground = new THREE.Mesh(geo, mat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.group.add(this.ground);
  }

  private buildSky(): void {
    const geo = new THREE.SphereGeometry(250, 32, 16);
    const mat = new THREE.MeshBasicMaterial({ color: 0x87ceeb, side: THREE.BackSide });
    this.sky = new THREE.Mesh(geo, mat);
    this.group.add(this.sky);
  }

  private buildClouds(): void {
    for (let i = 0; i < 40; i++) {
      const cloud = this.createCloud();
      cloud.position.set(
        (Math.random() - 0.5) * 200,
        15 + Math.random() * 20,
        (Math.random() - 0.5) * 300
      );
      cloud.scale.setScalar(1 + Math.random() * 2);
      this.clouds.push(cloud);
      this.group.add(cloud);
    }
  }

  private createCloud(): THREE.Group {
    const cloud = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    const sizes = [1, 0.8, 0.7, 0.6];
    const offsets = [[0, 0, 0], [0.8, 0.2, 0], [-0.7, 0.1, 0.3], [0.3, -0.1, -0.4]];
    sizes.forEach((s, i) => {
      const geo = new THREE.SphereGeometry(s, 8, 6);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(offsets[i][0], offsets[i][1], offsets[i][2]);
      cloud.add(mesh);
    });
    return cloud;
  }

  update(birdX: number, birdZ: number): void {
    // Ground follows bird
    this.ground.position.set(birdX, 0, birdZ);
    // Sky follows bird
    this.sky.position.set(birdX, 0, birdZ);
    // Clouds parallax
    this.clouds.forEach((c) => {
      if (c.position.z > birdZ + 100) {
        c.position.z -= 300;
      }
    });
  }

  setSkyColor(color: THREE.Color): void {
    (this.sky.material as THREE.MeshBasicMaterial).color.copy(color);
  }
}
```

**Step 2: Wire into GameEngine**

**Step 3: Verify — green ground, blue sky, white clouds visible**

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Environment with ground, sky dome, and clouds"
```

---

### Task 9: Score System + Basic HUD

**Files:**
- Create: `src/ui/UIManager.ts`
- Create: `src/game/ScoreManager.ts`
- Create: `src/game/__tests__/ScoreManager.test.ts`
- Modify: `src/engine/GameEngine.ts`

**Step 1: Write ScoreManager test**

```typescript
// src/game/__tests__/ScoreManager.test.ts
import { describe, it, expect } from "vitest";
import { ScoreManager } from "../ScoreManager";

describe("ScoreManager", () => {
  it("starts at zero", () => {
    const sm = new ScoreManager();
    expect(sm.score).toBe(0);
    expect(sm.combo).toBe(0);
    expect(sm.multiplier).toBe(1);
  });

  it("increments score with multiplier", () => {
    const sm = new ScoreManager();
    sm.addScore(1);
    expect(sm.score).toBe(1);
  });

  it("increases combo on near-miss", () => {
    const sm = new ScoreManager();
    sm.registerNearMiss();
    expect(sm.combo).toBe(1);
    expect(sm.multiplier).toBe(2);
  });

  it("resets combo on scoring without near-miss", () => {
    const sm = new ScoreManager();
    sm.registerNearMiss();
    sm.registerNearMiss();
    expect(sm.combo).toBe(2);
    sm.addScore(1);
    // Combo persists until a pipe is passed without near-miss
    // Actually combo should persist and multiply score
    expect(sm.score).toBe(3); // 1 * multiplier 3
  });

  it("tracks best score", () => {
    const sm = new ScoreManager();
    sm.addScore(5);
    sm.finalize();
    expect(sm.bestScore).toBe(5);
  });
});
```

**Step 2: Implement ScoreManager**

Key: `score`, `combo` (near-miss streak), `multiplier` (1 + combo), `bestScore` from localStorage.

**Step 3: Implement UIManager**

UIManager creates and manages DOM elements:
- Score display (centered, large font, text shadow)
- Combo display ("CLOSE! x3" with pop animation)
- Speed indicator bar
- Start screen ("Click to Play")
- Game over screen (score, best, restart button)
- Sound mute toggle
- All created programmatically, no framework

**Step 4: Wire into GameEngine**

**Step 5: Verify — score updates on screen, game over shows stats**

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add ScoreManager with combos and UIManager with HUD"
```

---

## Phase 3: Visual Identity

### Task 10: Toon Shader Material

**Files:**
- Create: `src/shaders/toon.vert.glsl`
- Create: `src/shaders/toon.frag.glsl`
- Create: `src/shaders/ToonMaterial.ts`
- Modify: `src/world/Bird.ts`, `src/world/PipeManager.ts`

**Step 1: Write toon vertex shader**

Standard vertex shader that passes normals and position to fragment shader. Include shadow map support via Three.js shader chunks.

**Step 2: Write toon fragment shader**

Cel-shading with 3-4 discrete lighting bands:
- Bright (lit directly)
- Mid-tone (45-90 degrees from light)
- Shadow (>90 degrees from light)
- Rim light (edge glow based on view angle)

Use `smoothstep` for soft band transitions. Accept `baseColor` uniform.

**Step 3: Create ToonMaterial wrapper**

```typescript
// src/shaders/ToonMaterial.ts
import * as THREE from "three";
import vertexShader from "./toon.vert.glsl";
import fragmentShader from "./toon.frag.glsl";

export class ToonMaterial extends THREE.ShaderMaterial {
  constructor(color: THREE.ColorRepresentation) {
    super({
      vertexShader,
      fragmentShader,
      uniforms: {
        baseColor: { value: new THREE.Color(color) },
        lightDirection: { value: new THREE.Vector3(0.5, 1, 0.3).normalize() },
        ambientStrength: { value: 0.3 },
      },
      lights: false,
    });
  }
}
```

**Step 4: Replace MeshStandardMaterial on bird and pipes with ToonMaterial**

**Step 5: Verify — cel-shaded look with visible lighting bands**

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add custom toon/cel-shading GLSL material"
```

---

### Task 11: Outline Post-Processing

**Files:**
- Create: `src/shaders/outline.frag.glsl`
- Create: `src/renderer/PostProcessing.ts`
- Modify: `src/renderer/Renderer.ts`

**Step 1: Install postprocessing library**

```bash
npm install postprocessing
```

**Step 2: Implement outline effect**

Use a Sobel edge detection pass on the depth/normal buffer to draw bold outlines around all geometry. This is the key to the Wind Waker look.

Alternatively, implement a custom `OutlinePass` using `EffectComposer` from `postprocessing`:
- Render scene normals to a render target
- Run Sobel filter on normals + depth
- Composite outlines (dark lines) onto the color buffer

**Step 3: Wire into Renderer**

Replace `renderer.render(scene, camera)` with `composer.render()`.

**Step 4: Verify — bold black outlines around bird, pipes, ground edges**

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add outline post-processing pass for toon look"
```

---

### Task 12: Bloom, Chromatic Aberration & Vignette

**Files:**
- Modify: `src/renderer/PostProcessing.ts`

**Step 1: Add selective bloom**

Add bloom effect to the post-processing pipeline. Use `SelectiveBloomEffect` or layer-based bloom so only power-ups and effects glow.

**Step 2: Add chromatic aberration**

`ChromaticAberrationEffect` with offset controlled by a uniform that scales with game speed and spikes on death.

**Step 3: Add vignette**

`VignetteEffect` with configurable darkness. Tighten vignette during boss segments.

**Step 4: Expose update methods**

```typescript
postProcessing.setChromaticAberration(intensity: number): void
postProcessing.setVignette(darkness: number): void
postProcessing.setBloomIntensity(intensity: number): void
```

**Step 5: Wire speed-based chromatic aberration into game loop**

**Step 6: Verify — bloom on bright objects, CA visible at speed, vignette around edges**

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add bloom, chromatic aberration, and vignette post-processing"
```

---

## Phase 4: Juice

### Task 13: Particle System

**Files:**
- Create: `src/vfx/ParticleSystem.ts`
- Create: `src/shaders/particle.vert.glsl`
- Create: `src/shaders/particle.frag.glsl`

**Step 1: Implement pool-based particle system**

```typescript
// src/vfx/ParticleSystem.ts
// GPU-instanced particle system using THREE.InstancedBufferGeometry
// Pool of N particles with position, velocity, color, life, size attributes
// Custom shader for screen-space sizing and alpha fade
// Methods:
//   emit(config: { position, velocity, color, count, life, size, gravity })
//   update(delta)
// Used for: bird trail, death burst, flap feathers, pipe shatter chunks,
//           near-miss sparks, power-up collect shimmer
```

Key design:
- Single `THREE.Points` or `InstancedMesh` with max 500 particles
- Each particle: position (vec3), velocity (vec3), color (vec3), life (float), maxLife (float), size (float)
- Update on CPU (simple — velocity + gravity), upload to GPU each frame
- Fragment shader: soft circle with alpha fade based on life/maxLife

**Step 2: Add convenience emitters**

```typescript
emitBirdTrail(position: THREE.Vector3, color: THREE.Color): void
emitDeathBurst(position: THREE.Vector3): void
emitFlapFeathers(position: THREE.Vector3): void
emitPipeShatter(position: THREE.Vector3, pipeColor: THREE.Color): void
emitNearMissSparks(position: THREE.Vector3): void
emitPowerUpCollect(position: THREE.Vector3, color: THREE.Color): void
```

**Step 3: Wire into GameEngine**

- Bird trail: emit every 0.02s during playing phase
- Flap feathers: emit on flap
- Death burst: emit on dying transition

**Step 4: Verify — golden trail behind bird, feather puff on flap, explosion on death**

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add GPU particle system with emitters for trail, death, and flap"
```

---

### Task 14: Near-Miss + Combo System

**Files:**
- Modify: `src/world/PipeManager.ts` (near-miss detection already stubbed)
- Modify: `src/game/ScoreManager.ts`
- Modify: `src/ui/UIManager.ts`
- Modify: `src/engine/GameEngine.ts`

**Step 1: Implement near-miss detection in PipeManager**

When bird passes a pipe and the closest edge distance is < 0.3 units, flag as near-miss. Return in update result.

**Step 2: Wire near-miss → ScoreManager combo**

Each near-miss increments combo. Combo resets when a pipe is passed without near-miss (give 2 pipes grace period).

**Step 3: Implement bullet-time effect**

On near-miss:
- Set `clock.timeScale = 0.3` for 0.2 real seconds
- After 0.2s, lerp back to 1.0

**Step 4: Add "CLOSE!" popup to UIManager**

DOM element that appears at bird screen position, scales up, fades out. Shows combo count.

**Step 5: Wire screen edge flash**

Brief white overlay div that fades from 0.3 opacity to 0 over 0.2s.

**Step 6: Add camera zoom-in on near-miss**

Temporarily reduce camera `behindDist` by 1 unit, spring back.

**Step 7: Verify — near-miss triggers slow-mo, popup, flash, camera zoom**

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: add near-miss combo system with bullet-time and visual feedback"
```

---

### Task 15: Death Sequence

**Files:**
- Modify: `src/engine/GameEngine.ts`
- Modify: `src/vfx/ParticleSystem.ts`
- Modify: `src/renderer/PostProcessing.ts`
- Modify: `src/ui/UIManager.ts`
- Create: `src/shaders/screenCrack.frag.glsl`

**Step 1: Implement freeze frame**

On death trigger:
1. Set `clock.timeScale = 0` for 0.3 real seconds (freeze)
2. Camera punch backward (new THREE.Vector3(0, 0, 2))
3. After 0.3s, resume at timeScale 0.3 (slow-mo death fall)

**Step 2: Implement death particles**

- 30+ feather particles burst from bird position
- Pipe shatter: 10-15 chunks from hit pipe with physics (gravity, random velocities)
- Use existing particle system emitters

**Step 3: Implement screen crack shader**

Custom full-screen quad with a crack pattern radiating from bird's screen-space position. Use a procedural Voronoi-based crack pattern in GLSL. Fade in over 0.3s. Can use a pre-made texture if procedural is too complex.

**Step 4: Implement desaturation**

Lerp `postProcessing.saturation` from 1.0 to 0.0 over 0.5s during dying phase.

**Step 5: Spike chromatic aberration on death**

Set CA offset to maximum (0.01) and decay over 0.5s.

**Step 6: Delay game-over UI by 0.8s total (0.3 freeze + 0.5 fall)**

**Step 7: Verify — death feels dramatic: freeze, crack, burst, desaturate, CA spike**

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: add dramatic death sequence with freeze, crack, and desaturation"
```

---

### Task 16: Speed Effects

**Files:**
- Create: `src/vfx/SpeedLines.ts`
- Create: `src/vfx/Afterimages.ts`
- Modify: `src/renderer/PostProcessing.ts`
- Modify: `src/engine/GameEngine.ts`

**Step 1: Implement speed lines**

Full-screen radial lines from screen center using a custom shader on a screen quad. Lines become visible when speed > 18 units/s. Intensity scales with speed. Biome-tinted.

**Step 2: Implement bird afterimages**

At high speed (>18), spawn ghost copies of the bird mesh behind the current position. Use transparent copies (opacity 0.3 → 0) at positions from 1-3 frames ago. Maximum 4 afterimages.

**Step 3: Wire barrel distortion**

Add a subtle barrel distortion uniform to post-processing. Scale with speed. Pulse briefly on flap.

**Step 4: Verify — at high speeds: radial lines, ghost trail, slight distortion**

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add speed lines, afterimages, and barrel distortion effects"
```

---

## Phase 5: Content

### Task 17: Biome System + Meadow

**Files:**
- Create: `src/world/BiomeManager.ts`
- Create: `src/world/biomes/Biome.ts` (interface)
- Create: `src/world/biomes/Meadow.ts`
- Create: `src/world/__tests__/BiomeManager.test.ts`
- Modify: `src/engine/GameEngine.ts`

**Step 1: Write BiomeManager test**

```typescript
// src/world/__tests__/BiomeManager.test.ts
import { describe, it, expect } from "vitest";
import { BiomeManager } from "../BiomeManager";

describe("BiomeManager", () => {
  it("starts in Meadow", () => {
    const bm = new BiomeManager();
    expect(bm.currentBiome.name).toBe("Meadow");
    expect(bm.biomeIndex).toBe(0);
  });

  it("transitions after 25 pipes", () => {
    const bm = new BiomeManager();
    bm.onPipePassed(24);
    expect(bm.isTransitioning).toBe(false);
    bm.onPipePassed(25);
    expect(bm.isTransitioning).toBe(true);
  });

  it("cycles through all 5 biomes", () => {
    const bm = new BiomeManager();
    for (let i = 1; i <= 125; i++) bm.onPipePassed(i);
    expect(bm.loopCount).toBe(1);
  });

  it("returns interpolated palette during transition", () => {
    const bm = new BiomeManager();
    bm.onPipePassed(25);
    const palette = bm.getCurrentPalette(0.5);
    // Should be a blend between Meadow and Sunset Canyon
    expect(palette.sky).toBeDefined();
  });
});
```

**Step 2: Implement Biome interface**

```typescript
// src/world/biomes/Biome.ts
import * as THREE from "three";

export interface BiomePalette {
  sky: THREE.Color;
  fog: THREE.Color;
  ground: THREE.Color;
  pipeMain: THREE.Color;
  pipeCap: THREE.Color;
  ambient: number; // ambient light intensity
  fogNear: number;
  fogFar: number;
}

export interface BiomeConfig {
  name: string;
  palette: BiomePalette;
  pipesPerBiome: number;
  // Pipe mesh factory — each biome creates unique pipe geometry
  createPipeMesh?: () => THREE.Group;
  // Hazard config
  hazard?: string;
}
```

**Step 3: Implement Meadow biome**

```typescript
// src/world/biomes/Meadow.ts
import * as THREE from "three";
import { BiomeConfig } from "./Biome";

export const MEADOW: BiomeConfig = {
  name: "Meadow",
  palette: {
    sky: new THREE.Color(0x87ceeb),
    fog: new THREE.Color(0x87ceeb),
    ground: new THREE.Color(0x4caf50),
    pipeMain: new THREE.Color(0x8b4513), // wooden brown
    pipeCap: new THREE.Color(0x654321),
    ambient: 0.6,
    fogNear: 80,
    fogFar: 180,
  },
  pipesPerBiome: 25,
};
```

**Step 4: Implement BiomeManager**

Manages biome progression, palette interpolation during transitions, and loop counting.

**Step 5: Wire into GameEngine — update sky/fog/ground colors based on biome**

**Step 6: Verify — game starts in Meadow palette**

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add BiomeManager with Meadow biome and palette transitions"
```

---

### Task 18: Remaining 4 Biomes

**Files:**
- Create: `src/world/biomes/SunsetCanyon.ts`
- Create: `src/world/biomes/StormSea.ts`
- Create: `src/world/biomes/NeonCity.ts`
- Create: `src/world/biomes/SkyTemple.ts`
- Modify: `src/world/BiomeManager.ts`

**Step 1: Define Sunset Canyon**

Palette: warm oranges (#FF8C42), deep reds (#C0392B), purple sky (#6B3FA0). Pipes: red rock pillars. Hazard: wind gusts (config only, implementation in Task 20).

**Step 2: Define Storm Sea**

Palette: dark grays (#4A4A4A), teal (#008080), dark sky (#2C3E50). Pipes: steel gray (#708090). Hazard: lightning strikes (config only).

**Step 3: Define Neon City**

Palette: dark purple (#1A0A2E), neon pink (#FF1493) accent. Pipes: glowing cyan (#00FFFF) with emissive. Hazard: laser gates (config only).

**Step 4: Define Sky Temple**

Palette: white marble (#F5F5F5), gold (#FFD700), ethereal fog. Pipes: marble white with gold trim. Hazard: rotating rings (config only).

**Step 5: Register all 5 biomes in BiomeManager**

**Step 6: Verify — play through all biome transitions (temporarily set pipesPerBiome = 5 for testing)**

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Sunset Canyon, Storm Sea, Neon City, and Sky Temple biomes"
```

---

### Task 19: Boss Segments

**Files:**
- Create: `src/world/BossManager.ts`
- Modify: `src/world/PipeManager.ts`
- Modify: `src/engine/GameEngine.ts`

**Step 1: Define boss patterns**

Each biome exit has a unique boss pipe pattern:
- **Meadow exit**: 3 rapid narrow gaps in zigzag (gap centers alternate high/low)
- **Sunset Canyon exit**: 4 pipes with shrinking gaps
- **Storm Sea exit**: 3 pipes with moving gaps (sine wave)
- **Neon City exit**: 5 rapid pipes, alternating left/right offset
- **Sky Temple exit**: 3 pipes with very narrow gaps but slow speed

**Step 2: Implement BossManager**

```typescript
// Triggers when BiomeManager signals biome boundary
// Overrides PipeManager spawning for 3-5 pipes
// Signals camera to zoom out
// Awards bonus points on clean clear
// Fires boss entry/clear events for audio + UI
```

**Step 3: Camera zoom-out during boss**

Temporarily increase `behindDist` to 15 and `height` to 5. Lerp back after boss clear.

**Step 4: Bonus scoring**

If all boss pipes cleared without being hit: +10 bonus points and "BOSS CLEARED!" popup.

**Step 5: Verify — boss sequence triggers at biome boundary, camera zooms, bonus awarded**

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add boss pipe segments at biome boundaries"
```

---

### Task 20: Biome Hazards

**Files:**
- Create: `src/world/hazards/WindGust.ts`
- Create: `src/world/hazards/Lightning.ts`
- Create: `src/world/hazards/LaserGate.ts`
- Create: `src/world/hazards/RotatingRing.ts`
- Modify: `src/engine/GameEngine.ts`

**Step 1: Implement WindGust (Sunset Canyon)**

Periodic horizontal push on the bird. Visual: particle streaks blowing across screen. Audio: wind whoosh. Duration: 1-2 seconds, every ~8 pipes.

**Step 2: Implement Lightning (Storm Sea)**

Random lightning flash (screen white for 0.1s). After flash: narrow "safe zone" column appears briefly — bird must be in it or take a near-miss. Visual: bolt geometry between sky and ground. Audio: thunder crack.

**Step 3: Implement LaserGate (Neon City)**

Horizontal laser beam between two pipes. Moves up/down slowly. Bird must time passage. Visual: glowing red line with particles. Collision = death.

**Step 4: Implement RotatingRing (Sky Temple)**

Stone ring obstacle that rotates around the pipe gap. Bird must time passage through the ring opening. Visual: torus geometry rotating. Collision = death.

**Step 5: Wire hazards to biome activation**

BiomeManager activates/deactivates hazards based on current biome.

**Step 6: Verify — each biome's hazard appears and functions correctly**

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add biome-specific hazards: wind, lightning, lasers, rotating rings"
```

---

## Phase 6: Systems

### Task 21: Power-Up System

**Files:**
- Create: `src/world/PowerUpManager.ts`
- Create: `src/world/__tests__/PowerUpManager.test.ts`
- Modify: `src/engine/GameEngine.ts`

**Step 1: Write PowerUpManager test**

```typescript
// src/world/__tests__/PowerUpManager.test.ts
import { describe, it, expect } from "vitest";
import { PowerUpManager } from "../PowerUpManager";

describe("PowerUpManager", () => {
  it("shield absorbs one hit", () => {
    const pm = new PowerUpManager();
    pm.activate("shield");
    expect(pm.hasShield()).toBe(true);
    pm.useShield();
    expect(pm.hasShield()).toBe(false);
  });

  it("slow-mo sets time scale", () => {
    const pm = new PowerUpManager();
    pm.activate("slowmo");
    expect(pm.getTimeScale()).toBe(0.5);
  });

  it("giant gives one smash", () => {
    const pm = new PowerUpManager();
    pm.activate("giant");
    expect(pm.isGiant()).toBe(true);
    expect(pm.getBirdScale()).toBe(2);
    pm.useGiantSmash();
    expect(pm.isGiant()).toBe(false);
  });

  it("score x2 doubles points", () => {
    const pm = new PowerUpManager();
    pm.activate("scorex2");
    expect(pm.getScoreMultiplier()).toBe(2);
  });

  it("timed power-ups expire", () => {
    const pm = new PowerUpManager();
    pm.activate("slowmo");
    pm.update(6); // 6 seconds
    expect(pm.getTimeScale()).toBe(1);
  });
});
```

**Step 2: Implement PowerUpManager**

4 power-up types: shield, slowmo, giant, scorex2. Renders octahedron meshes near pipes (15% spawn chance). Spinning + bobbing animation. Collection detection (distance < 1.2). HUD indicators with countdown bars (DOM elements).

**Step 3: Wire into GameEngine**

- Shield: intercept collision, absorb hit, break animation
- Slow-mo: set `clock.timeScale = 0.5`
- Giant: scale bird to 2x, smash through one pipe (remove pipe, emit shatter particles)
- Score x2: multiply `ScoreManager.addScore` result

**Step 4: Verify — power-ups spawn, collect, activate, expire, HUD shows countdown**

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add power-up system with shield, slow-mo, giant, and score x2"
```

---

### Task 22: Audio Manager + Synthesized SFX

**Files:**
- Create: `src/audio/AudioManager.ts`
- Modify: `src/engine/GameEngine.ts`

**Step 1: Implement AudioManager**

```typescript
// src/audio/AudioManager.ts
// Uses Web Audio API exclusively — no audio file dependencies
// All sounds are synthesized using OscillatorNode, GainNode, BiquadFilterNode
//
// Methods:
//   playFlap() — quick whoosh (white noise burst, bandpass filter, fast decay)
//   playScore(combo: number) — ascending ding (sine wave, pitch = 440 * (1 + combo * 0.1))
//   playNearMiss(combo: number) — dramatic swoosh + bass thump
//   playPowerUpCollect(type: string) — magical shimmer (multiple detuned sines)
//   playShieldBreak() — glass shatter (noise burst, high-pass filter)
//   playGiantSmash() — heavy bass impact (sub sine + noise)
//   playBossEntry() — warning horn (sawtooth, low frequency, volume ramp)
//   playBossClear() — triumphant fanfare (major chord arpeggio)
//   playDeath() — impact + slow-mo whoosh + sad trombone (pitch bend down)
//   playHighScore() — celebratory jingle (ascending major scale)
//
// Music:
//   playBiomeMusic(biome: string) — simple procedural loop per biome
//   crossfadeMusic(from: string, to: string, duration: number)
//   setMusicTempo(bpm: number)
//
// Controls:
//   mute / unmute toggle
//   masterVolume
```

**Step 2: Implement synthesized sound effects**

Each sound uses Web Audio API nodes:
- **Flap**: Create noise buffer → BandpassFilter(2000Hz) → GainNode(0→0, envelope: attack 0.01s, decay 0.05s)
- **Score ding**: OscillatorNode(sine, 440Hz * pitch) → GainNode(envelope: 0.01s attack, 0.3s decay)
- **Death**: OscillatorNode(sawtooth, 200Hz → 50Hz sweep over 0.5s) + noise burst

**Step 3: Implement simple procedural music per biome**

Each biome has a short (4-8 bar) loop generated with Web Audio API:
- **Meadow**: Major key, light arpeggios (C-E-G pattern), 120 BPM
- **Sunset Canyon**: Minor key, acoustic feel (Am-F-C-G), 100 BPM
- **Storm Sea**: Dramatic, low strings feel (Dm-Bb-Gm-A), 140 BPM
- **Neon City**: Synthwave bass pulse (Em-Cm), 130 BPM
- **Sky Temple**: Ethereal pads (Cmaj7-Fmaj7), 90 BPM

Use scheduled `OscillatorNode` events for notes.

**Step 4: Wire all audio events into GameEngine**

**Step 5: Add mute button to UIManager**

**Step 6: Verify — all sounds play at correct triggers, music loops, mute works**

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add AudioManager with synthesized SFX and procedural music"
```

---

### Task 23: Leaderboard

**Files:**
- Create: `src/game/LeaderboardManager.ts`
- Create: `src/game/__tests__/LeaderboardManager.test.ts`
- Modify: `src/ui/UIManager.ts`

**Step 1: Write LeaderboardManager test**

```typescript
// src/game/__tests__/LeaderboardManager.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { LeaderboardManager } from "../LeaderboardManager";

describe("LeaderboardManager", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts with empty leaderboard", () => {
    const lb = new LeaderboardManager();
    expect(lb.entries).toHaveLength(0);
  });

  it("adds entry and sorts by score descending", () => {
    const lb = new LeaderboardManager();
    lb.addEntry("Alice", 50);
    lb.addEntry("Bob", 100);
    expect(lb.entries[0].name).toBe("Bob");
    expect(lb.entries[1].name).toBe("Alice");
  });

  it("keeps only top 10", () => {
    const lb = new LeaderboardManager();
    for (let i = 0; i < 12; i++) lb.addEntry(`P${i}`, i * 10);
    expect(lb.entries).toHaveLength(10);
    expect(lb.entries[0].score).toBe(110);
  });

  it("detects if score qualifies for leaderboard", () => {
    const lb = new LeaderboardManager();
    expect(lb.qualifies(1)).toBe(true); // empty board
    for (let i = 0; i < 10; i++) lb.addEntry(`P${i}`, 100);
    expect(lb.qualifies(50)).toBe(false);
    expect(lb.qualifies(101)).toBe(true);
  });

  it("persists to localStorage", () => {
    const lb1 = new LeaderboardManager();
    lb1.addEntry("Test", 42);
    const lb2 = new LeaderboardManager();
    expect(lb2.entries[0].name).toBe("Test");
  });
});
```

**Step 2: Implement LeaderboardManager**

```typescript
// src/game/LeaderboardManager.ts
interface LeaderboardEntry {
  name: string;
  score: number;
  biome: string; // furthest biome reached
  date: string;
}

export class LeaderboardManager {
  entries: LeaderboardEntry[] = [];
  private storageKey = "birdie_leaderboard";

  constructor() {
    this.load();
  }

  qualifies(score: number): boolean {
    return this.entries.length < 10 || score > this.entries[this.entries.length - 1].score;
  }

  addEntry(name: string, score: number, biome = "Meadow"): void {
    this.entries.push({ name, score, biome, date: new Date().toISOString().split("T")[0] });
    this.entries.sort((a, b) => b.score - a.score);
    this.entries = this.entries.slice(0, 10);
    this.save();
  }

  private load(): void {
    const raw = localStorage.getItem(this.storageKey);
    if (raw) this.entries = JSON.parse(raw);
  }

  private save(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.entries));
  }
}
```

**Step 3: Add leaderboard UI**

On game over:
- If score qualifies: show pseudo (name) input field, save button
- Always show top 10 table with gold/silver/bronze highlighting for top 3
- Show on start screen as well (smaller version)

Arcade-style DOM table with monospace font, flickering gold effect on top entry.

**Step 4: Wire into GameEngine game-over flow**

**Step 5: Verify — leaderboard persists across refreshes, top 10 displays correctly**

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add arcade-style top 10 leaderboard with localStorage"
```

---

### Task 24: Complete UI System

**Files:**
- Modify: `src/ui/UIManager.ts`

**Step 1: Polish start screen**

- Game title "BIRDIE" in large stylized font (CSS text-shadow for depth)
- Subtitle: "A 3D Flappy Adventure"
- "Click or press Space to play" with pulsing animation
- Mini leaderboard showing top 3
- Mute button (top-right)

**Step 2: Polish game-over screen**

- Score with large display and spring animation
- "NEW HIGH SCORE!" if applicable, with gold glow animation
- Leaderboard (full top 10 if score qualifies, otherwise top 5)
- Pseudo input if qualified (auto-focus, enter to submit)
- "Press R or click to restart" button
- Death reason text

**Step 3: Polish in-game HUD**

- Score: top-center, large, text-shadow
- Combo indicator: appears on near-miss, shows "x2", "x3" etc with pop animation
- Active power-ups: bottom-left, icon + countdown bar
- Speed indicator: top-left, subtle bar
- Biome name: appears briefly on biome transition, fades after 2s
- Boss warning: "BOSS!" flashing text on boss entry

**Step 4: CSS animations**

All UI animations via CSS transitions/keyframes — no JS animation libraries needed.

**Step 5: Dark/light mode support**

Follow `prefers-color-scheme` for UI overlay elements (the 3D scene has its own palette from biomes). UI text and panels adapt.

**Step 6: Verify — all UI states look polished, animations smooth**

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: polish all UI screens with animations and dark/light mode"
```

---

## Phase 7: Polish

### Task 25: Unique Pipe Geometry Per Biome

**Files:**
- Modify: `src/world/PipeManager.ts`
- Modify: `src/world/biomes/*.ts`

**Step 1: Meadow pipes**

Wooden posts — brown cylinders with slight taper. Flower decorations (small colored spheres) on caps.

**Step 2: Sunset Canyon pipes**

Red rock pillars — irregular cylinder with noise-displaced vertices. Slightly wider base.

**Step 3: Storm Sea pipes**

Steel columns — gray metal with rivets (small sphere bumps). Barnacle clusters (small dark spheres).

**Step 4: Neon City pipes**

Glowing circuit towers — dark base with emissive colored lines (using emissive material). Pulsing glow.

**Step 5: Sky Temple pipes**

Marble columns — white with gold rings at cap. Ornate: slightly wider caps with beveled edges.

**Step 6: Transition between pipe styles**

During biome transitions, new pipes use the next biome's style. Old pipes remain until scrolled off.

**Step 7: Verify — each biome has visually distinct pipes**

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: add unique pipe geometry and materials for each biome"
```

---

### Task 26: Mobile Optimization & Performance

**Files:**
- Modify: various files

**Step 1: Touch controls**

Verify touch works for:
- Tap to flap (already via pointerdown)
- Touch pseudo input on game-over
- All buttons touchable with adequate size (min 44px)

**Step 2: Responsive canvas**

Handle orientation changes, resize events. Scale pixel ratio on low-end devices (cap at 1.5 on mobile).

**Step 3: Performance budget**

- Cap particles at 200 on mobile (vs 500 desktop)
- Reduce shadow map to 1024 on mobile
- Disable afterimages on mobile
- Reduce cloud count to 20 on mobile
- Detect via `navigator.maxTouchPoints > 0` or screen width

**Step 4: Meta tags for mobile**

Add to `index.html`:
```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#87ceeb">
```

**Step 5: Performance test**

Run on mobile device or Chrome DevTools device simulation. Target: 60fps on mid-range phone.

**Step 6: Commit**

```bash
git add -A
git commit -m "perf: optimize for mobile with responsive canvas and performance budgets"
```

---

### Task 27: Final Polish & README

**Files:**
- Modify: `README.md`
- Create: `CLAUDE.md`
- Modify: `src/engine/GameEngine.ts` (final tuning)

**Step 1: Tune game constants**

Play-test and adjust:
- Gravity, flap force (feel good?)
- Gap sizes (fair difficulty curve?)
- Speed ramp (smooth progression?)
- Near-miss threshold (too easy/hard?)
- Biome length (25 pipes right?)
- Boss difficulty

**Step 2: Write README.md**

```markdown
# Birdie

A 3D Flappy Bird game with toon cel-shading, 5 biomes, boss fights, and maximum juice.

## Tech Stack

- Three.js — 3D rendering with custom GLSL toon shaders
- TypeScript — type safety
- Vite — build tooling
- Web Audio API — synthesized sound effects and procedural music

## How to Run

npm install
npm run dev

Open http://localhost:5173

## How to Play

- **Space / Click / Tap**: Flap to fly
- **R**: Restart after game over
- **M**: Mute/unmute

## Features

- 5 biomes: Meadow, Sunset Canyon, Storm Sea, Neon City, Sky Temple
- Boss pipe segments at biome boundaries
- Near-miss combo system with bullet-time slow-mo
- Power-ups: Shield, Slow-mo, Giant, Score x2
- Arcade-style top 10 leaderboard
- Fully synthesized audio — no audio files needed
- Mobile-responsive with touch controls

## Deployment

npm run build
# Serve the dist/ folder with any static host
```

**Step 3: Write CLAUDE.md**

```markdown
# CLAUDE.md — Birdie

## Project Overview

3D Flappy Bird game with toon cel-shading, biome transitions, boss segments, and arcade leaderboard. Pure Three.js + TypeScript — no React.

## Tech Stack

- Three.js, TypeScript, Vite, custom GLSL shaders, Web Audio API, vanilla DOM

## Development

npm install && npm run dev

## Project Structure

- src/engine/ — GameEngine, StateMachine, Clock, InputManager
- src/renderer/ — Renderer, CameraController, PostProcessing
- src/world/ — Bird, PipeManager, Environment, BiomeManager, PowerUpManager
- src/world/biomes/ — Biome configs (Meadow, SunsetCanyon, etc.)
- src/world/hazards/ — WindGust, Lightning, LaserGate, RotatingRing
- src/vfx/ — ParticleSystem, SpeedLines, Afterimages
- src/shaders/ — GLSL shaders (toon, outline, particles, screen effects)
- src/audio/ — AudioManager (Web Audio API, synthesized SFX)
- src/game/ — ScoreManager, LeaderboardManager
- src/ui/ — UIManager (vanilla DOM)

## Testing

npm test (Vitest)
Tests cover: StateMachine, Clock, BirdPhysics, PipeCollision, ScoreManager, LeaderboardManager, BiomeManager, PowerUpManager.

## Build Warning Exceptions

None — zero warnings policy.

## User-Facing Language

English.
```

**Step 4: Run `npm run build` and `npm run check` — zero errors, zero warnings**

**Step 5: Commit**

```bash
git add -A
git commit -m "docs: add README and CLAUDE.md, final game tuning"
```

---

## Task Dependency Graph

```
Task 1 (scaffold) → Task 2 (engine) → Task 3 (input) → Task 4 (renderer)
                                                              ↓
Task 5 (bird) → Task 6 (camera) → Task 7 (pipes) → Task 8 (environment) → Task 9 (score+UI)
                                                              ↓
Task 10 (toon shader) → Task 11 (outlines) → Task 12 (bloom/CA/vignette)
                                                              ↓
Task 13 (particles) → Task 14 (near-miss) → Task 15 (death) → Task 16 (speed effects)
                                                              ↓
Task 17 (biome+meadow) → Task 18 (4 biomes) → Task 19 (bosses) → Task 20 (hazards)
                                                              ↓
Task 21 (power-ups) → Task 22 (audio) → Task 23 (leaderboard) → Task 24 (UI polish)
                                                              ↓
Task 25 (pipe geometry) → Task 26 (mobile) → Task 27 (README + polish)
```

All tasks are sequential — each builds on the previous. Within phases, some tasks could be parallelized by separate agents (e.g., Task 10-12 visual work while Task 13 particle work), but dependencies are tight enough that sequential is safest.

## Estimated Task Count

27 tasks, each with 3-8 steps. Total: ~120 discrete steps.
