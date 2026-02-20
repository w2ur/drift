import * as THREE from "three";
import vertexShader from "../shaders/particle.vert.glsl";
import fragmentShader from "../shaders/particle.frag.glsl";
import { isMobile } from "../utils/platform";

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  life: number;
  maxLife: number;
  size: number;
  gravity: number;
  active: boolean;
}

interface EmitConfig {
  position: THREE.Vector3;
  velocity?: THREE.Vector3;
  velocitySpread?: THREE.Vector3;
  color: THREE.Color;
  count: number;
  life: number;
  lifeSpread?: number;
  size: number;
  sizeSpread?: number;
  gravity?: number;
}

export class ParticleSystem {
  readonly points: THREE.Points;
  private particles: Particle[];
  private maxParticles: number;
  private geometry: THREE.BufferGeometry;
  private positions: Float32Array;
  private lifes: Float32Array;
  private maxLifes: Float32Array;
  private sizes: Float32Array;
  private colors: Float32Array;

  constructor(maxParticles = isMobile() ? 200 : 500) {
    this.maxParticles = maxParticles;
    this.particles = [];

    // Pre-allocate all particles
    for (let i = 0; i < maxParticles; i++) {
      this.particles.push({
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        color: new THREE.Color(),
        life: 0,
        maxLife: 0,
        size: 0,
        gravity: 0,
        active: false,
      });
    }

    // Buffer arrays
    this.positions = new Float32Array(maxParticles * 3);
    this.lifes = new Float32Array(maxParticles);
    this.maxLifes = new Float32Array(maxParticles);
    this.sizes = new Float32Array(maxParticles);
    this.colors = new Float32Array(maxParticles * 3);

    // Geometry
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.positions, 3)
    );
    this.geometry.setAttribute(
      "aLife",
      new THREE.BufferAttribute(this.lifes, 1)
    );
    this.geometry.setAttribute(
      "aMaxLife",
      new THREE.BufferAttribute(this.maxLifes, 1)
    );
    this.geometry.setAttribute(
      "aSize",
      new THREE.BufferAttribute(this.sizes, 1)
    );
    this.geometry.setAttribute(
      "aColor",
      new THREE.BufferAttribute(this.colors, 3)
    );

    // Material
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(this.geometry, material);
    this.points.frustumCulled = false;
  }

  emit(config: EmitConfig): void {
    let spawned = 0;
    for (const p of this.particles) {
      if (spawned >= config.count) break;
      if (p.active) continue;

      p.active = true;
      p.position.copy(config.position);
      p.color.copy(config.color);
      p.life = 0;
      p.maxLife =
        config.life +
        (config.lifeSpread ? (Math.random() - 0.5) * config.lifeSpread : 0);
      p.size =
        config.size +
        (config.sizeSpread ? (Math.random() - 0.5) * config.sizeSpread : 0);
      p.gravity = config.gravity ?? 0;

      if (config.velocity) {
        p.velocity.copy(config.velocity);
      } else {
        p.velocity.set(0, 0, 0);
      }
      if (config.velocitySpread) {
        p.velocity.x += (Math.random() - 0.5) * config.velocitySpread.x;
        p.velocity.y += (Math.random() - 0.5) * config.velocitySpread.y;
        p.velocity.z += (Math.random() - 0.5) * config.velocitySpread.z;
      }

      spawned++;
    }
  }

  update(delta: number): void {
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p.active) {
        this.sizes[i] = 0; // hide inactive
        continue;
      }

      p.life += delta;
      if (p.life >= p.maxLife) {
        p.active = false;
        this.sizes[i] = 0;
        continue;
      }

      // Physics
      p.velocity.y += p.gravity * delta;
      p.position.addScaledVector(p.velocity, delta);

      // Write to buffers
      const i3 = i * 3;
      this.positions[i3] = p.position.x;
      this.positions[i3 + 1] = p.position.y;
      this.positions[i3 + 2] = p.position.z;
      this.lifes[i] = p.life;
      this.maxLifes[i] = p.maxLife;
      this.sizes[i] = p.size;
      this.colors[i3] = p.color.r;
      this.colors[i3 + 1] = p.color.g;
      this.colors[i3 + 2] = p.color.b;
    }

    // Flag buffers for upload
    (
      this.geometry.attributes.position as THREE.BufferAttribute
    ).needsUpdate = true;
    (this.geometry.attributes.aLife as THREE.BufferAttribute).needsUpdate =
      true;
    (this.geometry.attributes.aMaxLife as THREE.BufferAttribute).needsUpdate =
      true;
    (this.geometry.attributes.aSize as THREE.BufferAttribute).needsUpdate =
      true;
    (this.geometry.attributes.aColor as THREE.BufferAttribute).needsUpdate =
      true;
  }

  emitBirdTrail(position: THREE.Vector3): void {
    this.emit({
      position,
      velocity: new THREE.Vector3(0, 0.5, 0.5),
      velocitySpread: new THREE.Vector3(0.3, 0.3, 0.3),
      color: new THREE.Color(0xffd700),
      count: 1,
      life: 0.5,
      size: 3,
      sizeSpread: 1,
      gravity: -2,
    });
  }

  emitFlapFeathers(position: THREE.Vector3): void {
    this.emit({
      position,
      velocity: new THREE.Vector3(0, 2, 0),
      velocitySpread: new THREE.Vector3(2, 2, 2),
      color: new THREE.Color(0xffa500),
      count: 3,
      life: 0.6,
      lifeSpread: 0.2,
      size: 4,
      sizeSpread: 2,
      gravity: -5,
    });
  }

  emitDeathBurst(position: THREE.Vector3): void {
    const colors = [0xffd700, 0xffa500, 0xff8c00, 0xffffff];
    for (let i = 0; i < 30; i++) {
      this.emit({
        position,
        velocity: new THREE.Vector3(0, 3, 0),
        velocitySpread: new THREE.Vector3(8, 8, 8),
        color: new THREE.Color(
          colors[Math.floor(Math.random() * colors.length)]
        ),
        count: 1,
        life: 2,
        lifeSpread: 0.5,
        size: 5,
        sizeSpread: 3,
        gravity: -10,
      });
    }
  }

  emitPipeShatter(position: THREE.Vector3, pipeColor: THREE.Color): void {
    this.emit({
      position,
      velocity: new THREE.Vector3(0, 5, 0),
      velocitySpread: new THREE.Vector3(6, 6, 6),
      color: pipeColor,
      count: 15,
      life: 1.5,
      lifeSpread: 0.5,
      size: 6,
      sizeSpread: 3,
      gravity: -12,
    });
  }

  emitNearMissSparks(position: THREE.Vector3): void {
    this.emit({
      position,
      velocity: new THREE.Vector3(0, 1, 0),
      velocitySpread: new THREE.Vector3(3, 3, 3),
      color: new THREE.Color(0xffffff),
      count: 5,
      life: 0.3,
      size: 3,
      sizeSpread: 1,
      gravity: 0,
    });
  }

  emitPowerUpCollect(position: THREE.Vector3, color: THREE.Color): void {
    this.emit({
      position,
      velocity: new THREE.Vector3(0, 2, 0),
      velocitySpread: new THREE.Vector3(4, 4, 4),
      color,
      count: 10,
      life: 0.8,
      lifeSpread: 0.3,
      size: 4,
      sizeSpread: 2,
      gravity: -3,
    });
  }
}
