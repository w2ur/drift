import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame, getPathX } from "@/lib/stores/useGame";

export function Bird() {
  const groupRef = useRef<THREE.Group>(null);
  const wingRef = useRef<THREE.Group>(null);
  const phase = useGame((s) => s.phase);
  const wingTime = useRef(0);
  const prevX = useRef(0);

  const bodyColor = useMemo(() => new THREE.Color("#FFD700"), []);
  const beakColor = useMemo(() => new THREE.Color("#FF6B00"), []);
  const eyeColor = useMemo(() => new THREE.Color("#222222"), []);
  const eyeWhite = useMemo(() => new THREE.Color("#FFFFFF"), []);
  const wingColor = useMemo(() => new THREE.Color("#FFA500"), []);
  const bellyColor = useMemo(() => new THREE.Color("#FFF8DC"), []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const state = useGame.getState();

    groupRef.current.position.set(state.birdX, state.birdY, state.birdZ);

    const tiltAngle = THREE.MathUtils.clamp(state.birdVelocity * 0.06, -0.6, 0.5);
    groupRef.current.rotation.x = -tiltAngle;

    if (state.phase === "playing") {
      const pathDx = state.birdX - prevX.current;
      const turnAngle = THREE.MathUtils.clamp(-pathDx * 2, -0.4, 0.4);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, turnAngle, 0.1);

      const lookAheadZ = state.birdZ - 2;
      const lookAheadX = getPathX(lookAheadZ);
      const dirX = lookAheadX - state.birdX;
      const yawAngle = Math.atan2(dirX, -2);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, yawAngle, 0.08);

      prevX.current = state.birdX;
    }

    wingTime.current += delta * 15;
    if (wingRef.current) {
      wingRef.current.rotation.z = Math.sin(wingTime.current) * 0.5;
    }
  });

  if (phase === "ready") {
    return (
      <group ref={groupRef} position={[0, 4, 0]}>
        <mesh>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>
        <mesh position={[0, -0.1, -0.35]}>
          <coneGeometry args={[0.12, 0.25, 8]} />
          <meshStandardMaterial color={beakColor} />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={groupRef} position={[0, 4, 0]}>
      <mesh>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>

      <mesh position={[0, -0.05, 0]}>
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshStandardMaterial color={bellyColor} />
      </mesh>

      <mesh position={[0.18, 0.12, -0.28]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color={eyeWhite} />
      </mesh>
      <mesh position={[0.18, 0.12, -0.34]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color={eyeColor} />
      </mesh>

      <mesh position={[-0.18, 0.12, -0.28]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color={eyeWhite} />
      </mesh>
      <mesh position={[-0.18, 0.12, -0.34]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color={eyeColor} />
      </mesh>

      <mesh position={[0, 0.0, -0.42]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.08, 0.2, 8]} />
        <meshStandardMaterial color={beakColor} />
      </mesh>

      <group ref={wingRef}>
        <mesh position={[0.35, 0.05, 0.05]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.3, 0.06, 0.25]} />
          <meshStandardMaterial color={wingColor} />
        </mesh>
        <mesh position={[-0.35, 0.05, 0.05]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.3, 0.06, 0.25]} />
          <meshStandardMaterial color={wingColor} />
        </mesh>
      </group>

      <mesh position={[0, 0.05, 0.35]} rotation={[-0.2, 0, 0]}>
        <boxGeometry args={[0.2, 0.15, 0.12]} />
        <meshStandardMaterial color={wingColor} />
      </mesh>
    </group>
  );
}
