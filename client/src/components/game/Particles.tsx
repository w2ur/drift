import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "@/lib/stores/useGame";

const TRAIL_COUNT = 60;
const DEATH_PARTICLE_COUNT = 30;

export function BirdTrail() {
  const pointsRef = useRef<THREE.Points>(null);
  const positionsRef = useRef(new Float32Array(TRAIL_COUNT * 3));
  const sizesRef = useRef(new Float32Array(TRAIL_COUNT));
  const alphasRef = useRef(new Float32Array(TRAIL_COUNT));
  const spawnIndex = useRef(0);
  const spawnTimer = useRef(0);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(TRAIL_COUNT * 3);
    const sizes = new Float32Array(TRAIL_COUNT);
    const alphas = new Float32Array(TRAIL_COUNT);
    for (let i = 0; i < TRAIL_COUNT; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = -100;
      positions[i * 3 + 2] = 0;
      sizes[i] = 0;
      alphas[i] = 0;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("alpha", new THREE.BufferAttribute(alphas, 1));
    positionsRef.current = positions;
    sizesRef.current = sizes;
    alphasRef.current = alphas;
    return geo;
  }, []);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      vertexShader: `
        attribute float size;
        attribute float alpha;
        varying float vAlpha;
        void main() {
          vAlpha = alpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (200.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float fade = 1.0 - dist * 2.0;
          gl_FragColor = vec4(1.0, 0.85, 0.2, vAlpha * fade * 0.6);
        }
      `,
    });
  }, []);

  useFrame((_, delta) => {
    const state = useGame.getState();

    if (state.phase === "playing") {
      spawnTimer.current += delta;
      if (spawnTimer.current > 0.02) {
        spawnTimer.current = 0;
        const i = spawnIndex.current % TRAIL_COUNT;
        positionsRef.current[i * 3] = state.birdX + (Math.random() - 0.5) * 0.3;
        positionsRef.current[i * 3 + 1] = state.birdY + (Math.random() - 0.5) * 0.3;
        positionsRef.current[i * 3 + 2] = state.birdZ + 0.3;
        sizesRef.current[i] = 2.0 + Math.random() * 1.5;
        alphasRef.current[i] = 1.0;
        spawnIndex.current++;
      }
    }

    for (let i = 0; i < TRAIL_COUNT; i++) {
      alphasRef.current[i] = Math.max(0, alphasRef.current[i] - delta * 2.5);
      sizesRef.current[i] *= 0.97;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.size.needsUpdate = true;
    geometry.attributes.alpha.needsUpdate = true;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

export function DeathParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const velocities = useRef<THREE.Vector3[]>([]);
  const active = useRef(false);
  const timer = useRef(0);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(DEATH_PARTICLE_COUNT * 3);
    const sizes = new Float32Array(DEATH_PARTICLE_COUNT);
    const colors = new Float32Array(DEATH_PARTICLE_COUNT * 3);

    const vels: THREE.Vector3[] = [];
    for (let i = 0; i < DEATH_PARTICLE_COUNT; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = -100;
      positions[i * 3 + 2] = 0;
      sizes[i] = 0;
      const isFeather = Math.random() > 0.3;
      if (isFeather) {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.84 + Math.random() * 0.16;
        colors[i * 3 + 2] = 0.0;
      } else {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.65;
        colors[i * 3 + 2] = 0.0;
      }
      vels.push(new THREE.Vector3());
    }
    velocities.current = vels;

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      vertexColors: true,
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (200.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float fade = 1.0 - dist * 2.0;
          gl_FragColor = vec4(vColor, fade * 0.9);
        }
      `,
    });
  }, []);

  const prevPhase = useRef("ready");

  useFrame((_, delta) => {
    const state = useGame.getState();

    if (prevPhase.current === "playing" && state.phase === "dying") {
      active.current = true;
      timer.current = 0;
      const positions = geometry.attributes.position.array as Float32Array;
      const sizes = geometry.attributes.size.array as Float32Array;
      for (let i = 0; i < DEATH_PARTICLE_COUNT; i++) {
        positions[i * 3] = state.birdX;
        positions[i * 3 + 1] = state.birdY;
        positions[i * 3 + 2] = state.birdZ;
        sizes[i] = 3.0 + Math.random() * 4.0;
        velocities.current[i].set(
          (Math.random() - 0.5) * 12,
          Math.random() * 8 + 2,
          (Math.random() - 0.5) * 12
        );
      }
    }
    prevPhase.current = state.phase;

    if (!active.current) return;

    timer.current += delta;
    if (timer.current > 2.0) {
      active.current = false;
      return;
    }

    const positions = geometry.attributes.position.array as Float32Array;
    const sizes = geometry.attributes.size.array as Float32Array;

    for (let i = 0; i < DEATH_PARTICLE_COUNT; i++) {
      velocities.current[i].y -= 15 * delta;
      positions[i * 3] += velocities.current[i].x * delta;
      positions[i * 3 + 1] += velocities.current[i].y * delta;
      positions[i * 3 + 2] += velocities.current[i].z * delta;
      sizes[i] *= 0.97;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.size.needsUpdate = true;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}
