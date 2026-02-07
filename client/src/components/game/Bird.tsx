import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame, getPathX } from "@/lib/stores/useGame";

export function Bird() {
  const groupRef = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Group>(null);
  const wingRef = useRef<THREE.Group>(null);
  const wingTime = useRef(0);

  const bodyColor = useMemo(() => new THREE.Color("#FFD700"), []);
  const beakColor = useMemo(() => new THREE.Color("#FF6B00"), []);
  const eyeColor = useMemo(() => new THREE.Color("#222222"), []);
  const eyeWhite = useMemo(() => new THREE.Color("#FFFFFF"), []);
  const wingColor = useMemo(() => new THREE.Color("#FFA500"), []);
  const bellyColor = useMemo(() => new THREE.Color("#FFF8DC"), []);

  useFrame((_, delta) => {
    if (!groupRef.current || !modelRef.current) return;
    const state = useGame.getState();

    groupRef.current.position.set(state.birdX, state.birdY, state.birdZ);

    if (state.phase === "playing") {
      const lookDist = 3;
      const lookAheadZ = state.birdZ - lookDist;
      const lookAheadX = getPathX(lookAheadZ);
      const dx = lookAheadX - state.birdX;
      const dz = lookAheadZ - state.birdZ;

      const yawAngle = Math.atan2(-dx, -dz);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y, yawAngle, 0.12
      );

      const pitchAngle = THREE.MathUtils.clamp(-state.birdVelocity * 0.05, -0.5, 0.4);
      modelRef.current.rotation.x = THREE.MathUtils.lerp(
        modelRef.current.rotation.x, pitchAngle, 0.15
      );

      const pathSlope = (getPathX(state.birdZ - 0.5) - getPathX(state.birdZ + 0.5));
      const bankAngle = THREE.MathUtils.clamp(pathSlope * 0.15, -0.3, 0.3);
      modelRef.current.rotation.z = THREE.MathUtils.lerp(
        modelRef.current.rotation.z, bankAngle, 0.1
      );

      wingTime.current += delta * 15;
      if (wingRef.current) {
        wingRef.current.rotation.z = Math.sin(wingTime.current) * 0.5;
      }
    } else if (state.phase === "dying") {
      const pitchAngle = THREE.MathUtils.clamp(-state.birdVelocity * 0.08, -1.2, 0.4);
      modelRef.current.rotation.x = THREE.MathUtils.lerp(
        modelRef.current.rotation.x, pitchAngle, 0.2
      );

      modelRef.current.rotation.z = THREE.MathUtils.lerp(
        modelRef.current.rotation.z, 0.5, 0.05
      );

      if (wingRef.current) {
        wingRef.current.rotation.z = -0.8;
      }
    } else {
      modelRef.current.rotation.x = 0;
      modelRef.current.rotation.z = 0;
      groupRef.current.rotation.y = 0;

      wingTime.current += delta * 8;
      if (wingRef.current) {
        wingRef.current.rotation.z = Math.sin(wingTime.current) * 0.3;
      }
    }
  });

  const birdModel = (
    <group ref={modelRef}>
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

  return (
    <group ref={groupRef} position={[0, 4, 0]}>
      {birdModel}
    </group>
  );
}
