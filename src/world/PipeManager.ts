import * as THREE from "three";
import { getPathX } from "./Bird";
import { ToonMaterial } from "../shaders/ToonMaterial";

// --- Pure functions (exported for testing) ---

export interface CollisionInput {
  z: number;
  gapY: number;
  gapSize: number;
}

export interface CollisionResult {
  hit: boolean;
  nearMiss: boolean;
  side: "top" | "bottom" | "";
}

const PIPE_RADIUS = 1.0;
const NEAR_MISS_THRESHOLD = 0.3;

export function checkCollision(
  birdY: number,
  birdZ: number,
  birdRadius: number,
  pipe: CollisionInput
): CollisionResult {
  const dz = Math.abs(birdZ - pipe.z);
  if (dz > PIPE_RADIUS + birdRadius) {
    return { hit: false, nearMiss: false, side: "" };
  }

  const halfGap = pipe.gapSize / 2;
  const birdBottom = birdY - birdRadius;
  const birdTop = birdY + birdRadius;
  const gapBottom = pipe.gapY - halfGap;
  const gapTop = pipe.gapY + halfGap;

  if (birdBottom < gapBottom) {
    return { hit: true, nearMiss: false, side: "bottom" };
  }
  if (birdTop > gapTop) {
    return { hit: true, nearMiss: false, side: "top" };
  }

  // Near-miss check
  const distToBottom = birdBottom - gapBottom;
  const distToTop = gapTop - birdTop;
  const minDist = Math.min(distToBottom, distToTop);
  const nearMiss = minDist < NEAR_MISS_THRESHOLD;

  return { hit: false, nearMiss, side: "" };
}

export interface Difficulty {
  gapSize: number;
  pipeSpacing: number;
  speed: number;
  moveChance: number;
  moveSpeed: number;
  moveRange: number;
}

export function getDifficulty(score: number): Difficulty {
  const t = Math.min(score / 80, 1);
  const eased = t * t;
  return {
    gapSize: 5.0 - (5.0 - 3.6) * eased,
    pipeSpacing: 18 - (18 - 12) * eased,
    speed: 13 + (22 - 13) * eased,
    moveChance: Math.min(score / 50, 0.7),
    moveSpeed: 2.5 * eased,
    moveRange: 1.8 * eased,
  };
}

// --- Pipe data ---

export interface Pipe {
  id: number;
  z: number;
  x: number;
  gapY: number;
  gapSize: number;
  passed: boolean;
  hit: boolean;
  moveSpeed: number;
  moveRange: number;
  moveOffset: number;
  baseGapY: number;
}

// --- PipeManager class ---

export interface PipeUpdateResult {
  scored: number;
  hitPipe: Pipe | null;
  nearMissPipes: Pipe[];
}

export class PipeManager {
  readonly group = new THREE.Group();
  pipes: Pipe[] = [];
  private nextId = 0;
  private pipeHeight = 12;
  private meshes = new Map<number, THREE.Group>();

  spawn(count: number, startZ: number, score: number): void {
    const diff = getDifficulty(score);
    for (let i = 0; i < count; i++) {
      const z = startZ - diff.pipeSpacing * i;
      const pipe = this.createPipe(z, score);
      this.pipes.push(pipe);
      this.addPipeMesh(pipe, diff.gapSize);
    }
  }

  private createPipe(z: number, score: number): Pipe {
    const diff = getDifficulty(score);
    const baseGapY = 2.5 + Math.random() * 4;
    const isMoving = Math.random() < diff.moveChance;
    return {
      id: this.nextId++,
      z,
      x: getPathX(z),
      gapY: baseGapY,
      gapSize: diff.gapSize,
      baseGapY,
      passed: false,
      hit: false,
      moveSpeed: isMoving ? 0.8 + Math.random() * diff.moveSpeed : 0,
      moveRange: isMoving ? 0.5 + Math.random() * diff.moveRange : 0,
      moveOffset: Math.random() * Math.PI * 2,
    };
  }

  private addPipeMesh(pipe: Pipe, gapSize: number): void {
    const pipeGroup = new THREE.Group();
    const radius = 1.0;
    const capRadius = 1.2;
    const capHeight = 0.3;
    const halfGap = gapSize / 2;

    const pipeMat = new ToonMaterial(0x2ecc40);
    const capMat = new ToonMaterial(0x27ae36);

    // Bottom pipe
    const bottomHeight = pipe.gapY - halfGap;
    if (bottomHeight > 0) {
      const bottomGeo = new THREE.CylinderGeometry(radius, radius, bottomHeight, 16);
      const bottom = new THREE.Mesh(bottomGeo, pipeMat);
      bottom.position.y = bottomHeight / 2;
      bottom.castShadow = true;
      pipeGroup.add(bottom);

      const bottomCapGeo = new THREE.CylinderGeometry(capRadius, capRadius, capHeight, 16);
      const bottomCap = new THREE.Mesh(bottomCapGeo, capMat);
      bottomCap.position.y = bottomHeight;
      bottomCap.castShadow = true;
      pipeGroup.add(bottomCap);
    }

    // Top pipe
    const topStart = pipe.gapY + halfGap;
    const topHeight = this.pipeHeight - topStart;
    if (topHeight > 0) {
      const topGeo = new THREE.CylinderGeometry(radius, radius, topHeight, 16);
      const top = new THREE.Mesh(topGeo, pipeMat);
      top.position.y = topStart + topHeight / 2;
      top.castShadow = true;
      pipeGroup.add(top);

      const topCapGeo = new THREE.CylinderGeometry(capRadius, capRadius, capHeight, 16);
      const topCap = new THREE.Mesh(topCapGeo, capMat);
      topCap.position.y = topStart;
      topCap.castShadow = true;
      pipeGroup.add(topCap);
    }

    pipeGroup.position.set(pipe.x, 0, pipe.z);
    this.group.add(pipeGroup);
    this.meshes.set(pipe.id, pipeGroup);
  }

  update(
    birdY: number,
    birdZ: number,
    birdRadius: number,
    score: number,
    gameTime: number,
    delta: number
  ): PipeUpdateResult {
    let scored = 0;
    let hitPipe: Pipe | null = null;
    const nearMissPipes: Pipe[] = [];
    const diff = getDifficulty(score);

    // Suppress unused variable warning — diff used below for spawn
    void diff;

    // Update moving pipes
    for (const pipe of this.pipes) {
      if (pipe.moveSpeed > 0) {
        pipe.gapY =
          pipe.baseGapY +
          Math.sin(gameTime * pipe.moveSpeed + pipe.moveOffset) * pipe.moveRange;
        pipe.gapY = Math.max(
          pipe.gapSize / 2 + 0.5,
          Math.min(pipe.gapY, 12 - pipe.gapSize / 2 - 0.5)
        );
      }
    }

    // Collision check
    for (const pipe of this.pipes) {
      if (pipe.passed || pipe.hit) continue;
      const result = checkCollision(birdY, birdZ, birdRadius, pipe);
      if (result.hit) {
        pipe.hit = true;
        hitPipe = pipe;
        const mesh = this.meshes.get(pipe.id);
        if (mesh) {
          mesh.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              (child.material as ToonMaterial).setColor(0xff3333);
            }
          });
        }
        break;
      }
      if (result.nearMiss) {
        nearMissPipes.push(pipe);
      }
    }

    // Scoring — pipe is passed when bird is well past it
    for (const pipe of this.pipes) {
      if (!pipe.passed && !pipe.hit && birdZ < pipe.z - PIPE_RADIUS - birdRadius) {
        pipe.passed = true;
        scored++;
      }
    }

    // Spawn more pipes if needed
    const furthestZ =
      this.pipes.length > 0 ? Math.min(...this.pipes.map((p) => p.z)) : 0;
    if (this.pipes.length === 0 || birdZ - furthestZ < 100) {
      const newDiff = getDifficulty(score + scored);
      for (let i = 0; i < 4; i++) {
        const z =
          (this.pipes.length > 0 ? furthestZ : birdZ - 40) -
          newDiff.pipeSpacing * (i + 1);
        const pipe = this.createPipe(z, score + scored);
        this.pipes.push(pipe);
        this.addPipeMesh(pipe, newDiff.gapSize);
      }
    }

    // Cleanup far-behind pipes
    const cleanupZ = birdZ + 20;
    this.pipes = this.pipes.filter((p) => {
      if (p.z > cleanupZ) {
        const mesh = this.meshes.get(p.id);
        if (mesh) {
          this.group.remove(mesh);
          this.meshes.delete(p.id);
        }
        return false;
      }
      return true;
    });

    return { scored, hitPipe, nearMissPipes };
  }

  reset(): void {
    this.pipes = [];
    this.nextId = 0;
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
    this.meshes.clear();
  }
}
