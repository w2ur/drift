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
    texture.repeat.set(80, 80);
  }, [texture]);

  useFrame(() => {
    if (!meshRef.current) return;
    const state = useGame.getState();
    meshRef.current.position.set(state.birdX, 0, state.birdZ);
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[400, 400]} />
      <meshStandardMaterial map={texture} color="#4CAF50" />
    </mesh>
  );
}

export function Sky() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    const state = useGame.getState();
    meshRef.current.position.set(state.birdX, 50, state.birdZ);
  });

  return (
    <mesh ref={meshRef} position={[0, 50, 0]}>
      <sphereGeometry args={[250, 32, 32]} />
      <meshBasicMaterial color="#87CEEB" side={THREE.BackSide} />
    </mesh>
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
    for (let i = 0; i < 40; i++) {
      const x = (Math.random() - 0.5) * 100;
      const y = 14 + Math.random() * 15;
      const z = -i * 25 - Math.random() * 20;
      data.push([x, y, z]);
    }
    return data;
  }, []);

  useFrame(() => {
    if (!groupRef.current) return;
    const state = useGame.getState();
    groupRef.current.position.set(0, 0, -state.birdZ * 0.7 + state.birdZ);
  });

  return (
    <group ref={groupRef}>
      {cloudData.map((pos, i) => (
        <CloudInstance key={i} position={pos} />
      ))}
    </group>
  );
}
