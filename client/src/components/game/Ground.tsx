import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "@/lib/stores/useGame";
import { useTexture } from "@react-three/drei";

export function Ground() {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture("/textures/grass.png");

  useMemo(() => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(50, 50);
  }, [texture]);

  useFrame(() => {
    if (!meshRef.current) return;
    const state = useGame.getState();
    meshRef.current.position.z = state.birdZ;
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[200, 400]} />
      <meshStandardMaterial map={texture} color="#4CAF50" />
    </mesh>
  );
}

export function Sky() {
  return (
    <>
      <mesh position={[0, 50, 0]}>
        <sphereGeometry args={[200, 32, 32]} />
        <meshBasicMaterial color="#87CEEB" side={THREE.BackSide} />
      </mesh>
    </>
  );
}

function CloudInstance({ position }: { position: [number, number, number] }) {
  const scale = useMemo(() => 0.8 + Math.random() * 1.2, []);
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.5, 8, 8]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.9} />
      </mesh>
      <mesh position={[1.2, 0.2, 0]}>
        <sphereGeometry args={[1.1, 8, 8]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.9} />
      </mesh>
      <mesh position={[-1.0, 0.1, 0.3]}>
        <sphereGeometry args={[1.2, 8, 8]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.9} />
      </mesh>
      <mesh position={[0.3, 0.5, -0.2]}>
        <sphereGeometry args={[0.9, 8, 8]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

export function Clouds() {
  const groupRef = useRef<THREE.Group>(null);

  const cloudData = useMemo(() => {
    const data: [number, number, number][] = [];
    for (let i = 0; i < 30; i++) {
      const x = (Math.random() - 0.5) * 80;
      const y = 12 + Math.random() * 15;
      const z = -i * 30 - Math.random() * 20;
      data.push([x, y, z]);
    }
    return data;
  }, []);

  useFrame(() => {
    if (!groupRef.current) return;
    const state = useGame.getState();
    groupRef.current.position.z = -state.birdZ * 0.3;
  });

  return (
    <group ref={groupRef}>
      {cloudData.map((pos, i) => (
        <CloudInstance key={i} position={pos} />
      ))}
    </group>
  );
}
