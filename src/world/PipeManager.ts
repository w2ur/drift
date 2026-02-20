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
  const t = Math.min(score / 150, 1);
  const eased = t * t;
  return {
    gapSize: 5.0 - (5.0 - 3.4) * eased,
    pipeSpacing: 18 - (18 - 11) * eased,
    speed: 13 + (20 - 13) * eased,
    moveChance: Math.min(score / 30, 0.6),
    moveSpeed: 1.5 + 2.0 * eased,
    moveRange: 0.8 + 1.5 * eased,
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

// Biome-specific pipe builder functions

function buildMeadowPipeMesh(
  group: THREE.Group,
  pipeMainColor: THREE.Color,
  pipeCapColor: THREE.Color,
  bottomHeight: number,
  topStart: number,
  topHeight: number,
  capHeight: number
): void {
  const radius = 1.0;
  const capRadius = 1.2;
  const pipeMat = new ToonMaterial(pipeMainColor);
  const capMat = new ToonMaterial(pipeCapColor);

  const flowerColors = [0xff69b4, 0xffff00, 0xff4444];

  if (bottomHeight > 0) {
    // Tapered wooden post
    const bottomGeo = new THREE.CylinderGeometry(radius * 0.9, radius, bottomHeight, 16);
    const bottom = new THREE.Mesh(bottomGeo, pipeMat);
    bottom.position.y = bottomHeight / 2;
    bottom.castShadow = true;
    group.add(bottom);

    const bottomCapGeo = new THREE.CylinderGeometry(capRadius, capRadius, capHeight, 16);
    const bottomCap = new THREE.Mesh(bottomCapGeo, capMat);
    bottomCap.position.y = bottomHeight;
    bottomCap.castShadow = true;
    group.add(bottomCap);

    // Flower decorations on cap
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const flowerMat = new ToonMaterial(flowerColors[i]);
      const flowerGeo = new THREE.SphereGeometry(0.1, 6, 6);
      const flower = new THREE.Mesh(flowerGeo, flowerMat);
      flower.position.set(
        Math.cos(angle) * 0.7,
        bottomHeight + capHeight / 2 + 0.1,
        Math.sin(angle) * 0.7
      );
      group.add(flower);
    }
  }

  if (topHeight > 0) {
    const topGeo = new THREE.CylinderGeometry(radius * 0.9, radius, topHeight, 16);
    const top = new THREE.Mesh(topGeo, pipeMat);
    top.position.y = topStart + topHeight / 2;
    top.castShadow = true;
    group.add(top);

    const topCapGeo = new THREE.CylinderGeometry(capRadius, capRadius, capHeight, 16);
    const topCap = new THREE.Mesh(topCapGeo, capMat);
    topCap.position.y = topStart;
    topCap.castShadow = true;
    group.add(topCap);

    // Flower decorations on cap
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const flowerMat = new ToonMaterial(flowerColors[i]);
      const flowerGeo = new THREE.SphereGeometry(0.1, 6, 6);
      const flower = new THREE.Mesh(flowerGeo, flowerMat);
      flower.position.set(
        Math.cos(angle) * 0.7,
        topStart - capHeight / 2 - 0.1,
        Math.sin(angle) * 0.7
      );
      group.add(flower);
    }
  }
}

function buildSunsetCanyonPipeMesh(
  group: THREE.Group,
  pipeMainColor: THREE.Color,
  pipeCapColor: THREE.Color,
  bottomHeight: number,
  topStart: number,
  topHeight: number,
  capHeight: number
): void {
  const capRadius = 1.2;
  const pipeMat = new ToonMaterial(pipeMainColor);
  const capMat = new ToonMaterial(pipeCapColor);

  if (bottomHeight > 0) {
    // 8-sided rock pillar with wider base
    const bottomGeo = new THREE.CylinderGeometry(0.9, 1.1, bottomHeight, 8);
    const bottom = new THREE.Mesh(bottomGeo, pipeMat);
    bottom.position.y = bottomHeight / 2;
    bottom.castShadow = true;
    group.add(bottom);

    const bottomCapGeo = new THREE.CylinderGeometry(capRadius, capRadius, capHeight, 8);
    const bottomCap = new THREE.Mesh(bottomCapGeo, capMat);
    bottomCap.position.y = bottomHeight;
    bottomCap.castShadow = true;
    group.add(bottomCap);
  }

  if (topHeight > 0) {
    const topGeo = new THREE.CylinderGeometry(0.9, 1.1, topHeight, 8);
    const top = new THREE.Mesh(topGeo, pipeMat);
    top.position.y = topStart + topHeight / 2;
    top.castShadow = true;
    group.add(top);

    const topCapGeo = new THREE.CylinderGeometry(capRadius, capRadius, capHeight, 8);
    const topCap = new THREE.Mesh(topCapGeo, capMat);
    topCap.position.y = topStart;
    topCap.castShadow = true;
    group.add(topCap);
  }
}

function buildStormSeaPipeMesh(
  group: THREE.Group,
  pipeMainColor: THREE.Color,
  pipeCapColor: THREE.Color,
  bottomHeight: number,
  topStart: number,
  topHeight: number
): void {
  const radius = 1.0;
  const capRadius = 1.2;
  const capHeight = 0.2;
  const pipeMat = new ToonMaterial(pipeMainColor);
  pipeMat.uniforms.ambientStrength = { value: 0.35 };
  const capMat = new ToonMaterial(pipeCapColor);
  const rivetMat = new ToonMaterial(0x999999);

  const rivetCount = 5;

  if (bottomHeight > 0) {
    const bottomGeo = new THREE.CylinderGeometry(radius, radius, bottomHeight, 16);
    const bottom = new THREE.Mesh(bottomGeo, pipeMat);
    bottom.position.y = bottomHeight / 2;
    bottom.castShadow = true;
    group.add(bottom);

    const bottomCapGeo = new THREE.CylinderGeometry(capRadius, capRadius, capHeight, 16);
    const bottomCap = new THREE.Mesh(bottomCapGeo, capMat);
    bottomCap.position.y = bottomHeight;
    bottomCap.castShadow = true;
    group.add(bottomCap);

    // Rivets around the pipe body
    for (let i = 0; i < rivetCount; i++) {
      const angle = (i / rivetCount) * Math.PI * 2;
      const rivetGeo = new THREE.SphereGeometry(0.06, 5, 5);
      const rivet = new THREE.Mesh(rivetGeo, rivetMat);
      rivet.position.set(
        Math.cos(angle) * (radius + 0.04),
        bottomHeight * 0.6,
        Math.sin(angle) * (radius + 0.04)
      );
      group.add(rivet);
    }
  }

  if (topHeight > 0) {
    const topGeo = new THREE.CylinderGeometry(radius, radius, topHeight, 16);
    const top = new THREE.Mesh(topGeo, pipeMat);
    top.position.y = topStart + topHeight / 2;
    top.castShadow = true;
    group.add(top);

    const topCapGeo = new THREE.CylinderGeometry(capRadius, capRadius, capHeight, 16);
    const topCap = new THREE.Mesh(topCapGeo, capMat);
    topCap.position.y = topStart;
    topCap.castShadow = true;
    group.add(topCap);

    // Rivets around the pipe body
    for (let i = 0; i < rivetCount; i++) {
      const angle = (i / rivetCount) * Math.PI * 2;
      const rivetGeo = new THREE.SphereGeometry(0.06, 5, 5);
      const rivet = new THREE.Mesh(rivetGeo, rivetMat);
      rivet.position.set(
        Math.cos(angle) * (radius + 0.04),
        topStart + topHeight * 0.4,
        Math.sin(angle) * (radius + 0.04)
      );
      group.add(rivet);
    }
  }
}

function buildNeonCityPipeMesh(
  group: THREE.Group,
  _pipeMainColor: THREE.Color,
  _pipeCapColor: THREE.Color,
  bottomHeight: number,
  topStart: number,
  topHeight: number,
  capHeight: number
): void {
  const radius = 1.0;
  const capRadius = 1.2;
  const pipeMat = new ToonMaterial(0x1a1a2e);
  const capMat = new ToonMaterial(0xff1493);
  // Neon ring colors
  const ringColors = [0x00ffff, 0xff1493, 0x00ffff];

  if (bottomHeight > 0) {
    const bottomGeo = new THREE.CylinderGeometry(radius, radius, bottomHeight, 16);
    const bottom = new THREE.Mesh(bottomGeo, pipeMat);
    bottom.position.y = bottomHeight / 2;
    bottom.castShadow = true;
    group.add(bottom);

    const bottomCapGeo = new THREE.CylinderGeometry(capRadius, capRadius, capHeight, 16);
    const bottomCap = new THREE.Mesh(bottomCapGeo, capMat);
    bottomCap.position.y = bottomHeight;
    bottomCap.castShadow = true;
    group.add(bottomCap);

    // Neon rings along the body
    const ringPositions = [bottomHeight * 0.25, bottomHeight * 0.55, bottomHeight * 0.8];
    ringPositions.forEach((yPos, idx) => {
      if (yPos < bottomHeight - 0.2) {
        const ringGeo = new THREE.TorusGeometry(1.05, 0.03, 8, 24);
        const ringMat = new ToonMaterial(ringColors[idx % ringColors.length]);
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.y = yPos;
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
      }
    });
  }

  if (topHeight > 0) {
    const topGeo = new THREE.CylinderGeometry(radius, radius, topHeight, 16);
    const top = new THREE.Mesh(topGeo, pipeMat);
    top.position.y = topStart + topHeight / 2;
    top.castShadow = true;
    group.add(top);

    const topCapGeo = new THREE.CylinderGeometry(capRadius, capRadius, capHeight, 16);
    const topCap = new THREE.Mesh(topCapGeo, capMat);
    topCap.position.y = topStart;
    topCap.castShadow = true;
    group.add(topCap);

    // Neon rings along the body
    const ringPositions = [
      topStart + topHeight * 0.2,
      topStart + topHeight * 0.5,
      topStart + topHeight * 0.75,
    ];
    ringPositions.forEach((yPos, idx) => {
      if (yPos < topStart + topHeight - 0.2) {
        const ringGeo = new THREE.TorusGeometry(1.05, 0.03, 8, 24);
        const ringMat = new ToonMaterial(ringColors[idx % ringColors.length]);
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.y = yPos;
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
      }
    });
  }
}

function buildSkyTemplePipeMesh(
  group: THREE.Group,
  pipeMainColor: THREE.Color,
  pipeCapColor: THREE.Color,
  bottomHeight: number,
  topStart: number,
  topHeight: number,
  capHeight: number
): void {
  const radius = 1.0;
  const capRadius = 1.3;
  const pipeMat = new ToonMaterial(pipeMainColor);
  const capMat = new ToonMaterial(pipeCapColor);
  const goldMat = new ToonMaterial(0xffd700);

  if (bottomHeight > 0) {
    // Smooth marble column with higher segment count
    const bottomGeo = new THREE.CylinderGeometry(radius, radius, bottomHeight, 24);
    const bottom = new THREE.Mesh(bottomGeo, pipeMat);
    bottom.position.y = bottomHeight / 2;
    bottom.castShadow = true;
    group.add(bottom);

    const bottomCapGeo = new THREE.CylinderGeometry(capRadius, capRadius, capHeight, 24);
    const bottomCap = new THREE.Mesh(bottomCapGeo, capMat);
    bottomCap.position.y = bottomHeight;
    bottomCap.castShadow = true;
    group.add(bottomCap);

    // Gold ring at cap
    const goldRingGeo = new THREE.TorusGeometry(1.15, 0.04, 8, 24);
    const goldRing = new THREE.Mesh(goldRingGeo, goldMat);
    goldRing.position.y = bottomHeight;
    goldRing.rotation.x = Math.PI / 2;
    group.add(goldRing);
  }

  if (topHeight > 0) {
    const topGeo = new THREE.CylinderGeometry(radius, radius, topHeight, 24);
    const top = new THREE.Mesh(topGeo, pipeMat);
    top.position.y = topStart + topHeight / 2;
    top.castShadow = true;
    group.add(top);

    const topCapGeo = new THREE.CylinderGeometry(capRadius, capRadius, capHeight, 24);
    const topCap = new THREE.Mesh(topCapGeo, capMat);
    topCap.position.y = topStart;
    topCap.castShadow = true;
    group.add(topCap);

    // Gold ring at cap
    const goldRingGeo = new THREE.TorusGeometry(1.15, 0.04, 8, 24);
    const goldRing = new THREE.Mesh(goldRingGeo, goldMat);
    goldRing.position.y = topStart;
    goldRing.rotation.x = Math.PI / 2;
    group.add(goldRing);
  }
}

function buildDefaultPipeMesh(
  group: THREE.Group,
  pipeMainColor: THREE.Color,
  pipeCapColor: THREE.Color,
  bottomHeight: number,
  topStart: number,
  topHeight: number,
  capHeight: number
): void {
  const radius = 1.0;
  const capRadius = 1.2;
  const pipeMat = new ToonMaterial(pipeMainColor);
  const capMat = new ToonMaterial(pipeCapColor);

  if (bottomHeight > 0) {
    const bottomGeo = new THREE.CylinderGeometry(radius, radius, bottomHeight, 16);
    const bottom = new THREE.Mesh(bottomGeo, pipeMat);
    bottom.position.y = bottomHeight / 2;
    bottom.castShadow = true;
    group.add(bottom);

    const bottomCapGeo = new THREE.CylinderGeometry(capRadius, capRadius, capHeight, 16);
    const bottomCap = new THREE.Mesh(bottomCapGeo, capMat);
    bottomCap.position.y = bottomHeight;
    bottomCap.castShadow = true;
    group.add(bottomCap);
  }

  if (topHeight > 0) {
    const topGeo = new THREE.CylinderGeometry(radius, radius, topHeight, 16);
    const top = new THREE.Mesh(topGeo, pipeMat);
    top.position.y = topStart + topHeight / 2;
    top.castShadow = true;
    group.add(top);

    const topCapGeo = new THREE.CylinderGeometry(capRadius, capRadius, capHeight, 16);
    const topCap = new THREE.Mesh(topCapGeo, capMat);
    topCap.position.y = topStart;
    topCap.castShadow = true;
    group.add(topCap);
  }
}

export class PipeManager {
  readonly group = new THREE.Group();
  pipes: Pipe[] = [];
  private nextId = 0;
  private pipeHeight = 12;
  private meshes = new Map<number, THREE.Group>();
  private biomeName = "Meadow";
  private pipeMainColor = new THREE.Color(0x8b4513);
  private pipeCapColor = new THREE.Color(0x654321);

  setBiome(biomeName: string, pipeMainColor: THREE.Color, pipeCapColor: THREE.Color): void {
    this.biomeName = biomeName;
    this.pipeMainColor = pipeMainColor.clone();
    this.pipeCapColor = pipeCapColor.clone();
  }

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
    const capHeight = 0.3;
    const halfGap = gapSize / 2;

    const bottomHeight = pipe.gapY - halfGap;
    const topStart = pipe.gapY + halfGap;
    const topHeight = this.pipeHeight - topStart;

    switch (this.biomeName) {
      case "Meadow":
        buildMeadowPipeMesh(
          pipeGroup,
          this.pipeMainColor,
          this.pipeCapColor,
          bottomHeight,
          topStart,
          topHeight,
          capHeight
        );
        break;
      case "Sunset Canyon":
        buildSunsetCanyonPipeMesh(
          pipeGroup,
          this.pipeMainColor,
          this.pipeCapColor,
          bottomHeight,
          topStart,
          topHeight,
          capHeight
        );
        break;
      case "Storm Sea":
        buildStormSeaPipeMesh(
          pipeGroup,
          this.pipeMainColor,
          this.pipeCapColor,
          bottomHeight,
          topStart,
          topHeight
        );
        break;
      case "Neon City":
        buildNeonCityPipeMesh(
          pipeGroup,
          this.pipeMainColor,
          this.pipeCapColor,
          bottomHeight,
          topStart,
          topHeight,
          capHeight
        );
        break;
      case "Sky Temple":
        buildSkyTemplePipeMesh(
          pipeGroup,
          this.pipeMainColor,
          this.pipeCapColor,
          bottomHeight,
          topStart,
          topHeight,
          capHeight
        );
        break;
      default:
        buildDefaultPipeMesh(
          pipeGroup,
          this.pipeMainColor,
          this.pipeCapColor,
          bottomHeight,
          topStart,
          topHeight,
          capHeight
        );
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

  removePipeById(id: number): void {
    const mesh = this.meshes.get(id);
    if (mesh) {
      this.group.remove(mesh);
      this.meshes.delete(id);
    }
    this.pipes = this.pipes.filter((p) => p.id !== id);
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
