import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "@/lib/stores/useGame";

const POWERUP_COLORS: Record<string, string> = {
  shield: "#4FC3F7",
  slowmo: "#AB47BC",
  shrink: "#66BB6A",
};

const POWERUP_LABELS: Record<string, string> = {
  shield: "S",
  slowmo: "T",
  shrink: "M",
};

function PowerUpItem({ id, x, y, z, type }: { id: number; x: number; y: number; z: number; type: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const color = useMemo(() => new THREE.Color(POWERUP_COLORS[type] || "#fff"), [type]);
  const glowColor = useMemo(() => new THREE.Color(POWERUP_COLORS[type] || "#fff").multiplyScalar(0.5), [type]);
  const time = useRef(Math.random() * Math.PI * 2);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    time.current += delta * 3;
    groupRef.current.rotation.y += delta * 2;
    groupRef.current.position.y = y + Math.sin(time.current) * 0.3;
  });

  return (
    <group ref={groupRef} position={[x, y, z]}>
      <mesh>
        <octahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={glowColor}
          emissiveIntensity={0.5}
          transparent
          opacity={0.9}
        />
      </mesh>
      <mesh>
        <octahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export function PowerUpItems() {
  const powerUps = useGame((s) => s.powerUps);

  return (
    <>
      {powerUps.map((pu) => (
        <PowerUpItem key={pu.id} id={pu.id} x={pu.x} y={pu.y} z={pu.z} type={pu.type} />
      ))}
    </>
  );
}
