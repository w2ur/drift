import * as THREE from "three";

export type PowerUpType = "shield" | "slowmo" | "giant" | "scorex2";

interface ActivePowerUp {
  type: PowerUpType;
  timeRemaining: number; // -1 means no timer (shield, giant)
}

interface SpawnedPickup {
  id: number;
  type: PowerUpType;
  z: number;
  mesh: THREE.Mesh;
  baseY: number;
  age: number;
}

const POWER_UP_COLORS: Record<PowerUpType, number> = {
  shield: 0x4fc3f7,
  slowmo: 0xce93d8,
  giant: 0xef5350,
  scorex2: 0xffd700,
};

const POWER_UP_DURATIONS: Record<PowerUpType, number> = {
  shield: -1,   // no timer
  slowmo: 5,
  giant: -1,    // one-use
  scorex2: 10,
};

const SPAWN_CHANCE = 0.15;
const COLLECT_DISTANCE = 1.2;

export class PowerUpManager {
  readonly group = new THREE.Group();

  private active: Map<PowerUpType, ActivePowerUp> = new Map();
  private pickups: SpawnedPickup[] = [];
  private nextId = 0;

  // --- Logic API ---

  hasShield(): boolean {
    return this.active.has("shield");
  }

  useShield(): void {
    this.active.delete("shield");
  }

  isGiant(): boolean {
    return this.active.has("giant");
  }

  getBirdScale(): number {
    return this.isGiant() ? 2 : 1;
  }

  useGiantSmash(): void {
    this.active.delete("giant");
  }

  getTimeScale(): number {
    return this.active.has("slowmo") ? 0.5 : 1;
  }

  getScoreMultiplier(): number {
    return this.active.has("scorex2") ? 2 : 1;
  }

  activate(type: PowerUpType): void {
    const duration = POWER_UP_DURATIONS[type];
    this.active.set(type, { type, timeRemaining: duration });
  }

  update(delta: number): void {
    for (const [type, powerUp] of this.active) {
      if (powerUp.timeRemaining < 0) continue;
      powerUp.timeRemaining -= delta;
      if (powerUp.timeRemaining <= 0) {
        this.active.delete(type);
      }
    }

    // Animate pickups
    for (const pickup of this.pickups) {
      pickup.age += delta;
      pickup.mesh.rotation.y += delta * 2;
      pickup.mesh.rotation.x += delta * 1.2;
      pickup.mesh.position.y = pickup.baseY + Math.sin(pickup.age * 2) * 0.3;
    }
  }

  spawnNearPipe(pipeX: number, pipeY: number, pipeZ: number): void {
    if (Math.random() > SPAWN_CHANCE) return;

    const types: PowerUpType[] = ["shield", "slowmo", "giant", "scorex2"];
    const type = types[Math.floor(Math.random() * types.length)];

    const geo = PowerUpManager.createGeometry(type);
    const mat = new THREE.MeshStandardMaterial({
      color: POWER_UP_COLORS[type],
      emissive: POWER_UP_COLORS[type],
      emissiveIntensity: 0.4,
      roughness: 0.2,
      metalness: 0.6,
    });
    const mesh = new THREE.Mesh(geo, mat);

    const baseY = pipeY;
    mesh.position.set(pipeX, baseY, pipeZ);
    this.group.add(mesh);

    this.pickups.push({
      id: this.nextId++,
      type,
      z: pipeZ,
      mesh,
      baseY,
      age: Math.random() * Math.PI * 2,
    });
  }

  checkCollection(
    birdPos: THREE.Vector3,
    _birdRadius: number
  ): PowerUpType | null {
    for (let i = 0; i < this.pickups.length; i++) {
      const pickup = this.pickups[i];
      const dist = birdPos.distanceTo(pickup.mesh.position);
      if (dist < COLLECT_DISTANCE) {
        this.group.remove(pickup.mesh);
        this.pickups.splice(i, 1);
        this.activate(pickup.type);
        return pickup.type;
      }
    }
    return null;
  }

  cleanupBehind(birdZ: number): void {
    const cleanupZ = birdZ + 20;
    this.pickups = this.pickups.filter((pickup) => {
      if (pickup.z > cleanupZ) {
        this.group.remove(pickup.mesh);
        return false;
      }
      return true;
    });
  }

  private static createGeometry(type: PowerUpType): THREE.BufferGeometry {
    switch (type) {
      case "shield":
        // Sphere — protective bubble
        return new THREE.SphereGeometry(0.45, 12, 8);
      case "slowmo":
        // Torus — clock/time ring
        return new THREE.TorusGeometry(0.35, 0.12, 8, 16);
      case "giant":
        // Box — big and solid
        return new THREE.BoxGeometry(0.7, 0.7, 0.7);
      case "scorex2":
        // Star-like — torus knot
        return new THREE.TorusKnotGeometry(0.28, 0.1, 32, 8, 2, 3);
    }
  }

  reset(): void {
    this.active.clear();
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
    this.pickups = [];
    this.nextId = 0;
  }
}
