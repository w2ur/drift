import { useMemo } from "react";
import * as THREE from "three";
import { useGame, GAP_SIZE } from "@/lib/stores/useGame";

const PIPE_RADIUS = 1.0;
const PIPE_SEGMENTS = 12;
const PIPE_MAX_HEIGHT = 15;

function PipePair({ z, gapY }: { z: number; gapY: number }) {
  const halfGap = GAP_SIZE / 2;

  const bottomHeight = gapY - halfGap;
  const topStart = gapY + halfGap;
  const topHeight = PIPE_MAX_HEIGHT - topStart;

  const pipeColor = useMemo(() => new THREE.Color("#2ECC40"), []);
  const pipeCapColor = useMemo(() => new THREE.Color("#27AE36"), []);

  return (
    <group position={[0, 0, z]}>
      {bottomHeight > 0 && (
        <group>
          <mesh position={[0, bottomHeight / 2, 0]}>
            <cylinderGeometry args={[PIPE_RADIUS, PIPE_RADIUS, bottomHeight, PIPE_SEGMENTS]} />
            <meshStandardMaterial color={pipeColor} />
          </mesh>
          <mesh position={[0, bottomHeight, 0]}>
            <cylinderGeometry args={[PIPE_RADIUS * 1.2, PIPE_RADIUS * 1.2, 0.4, PIPE_SEGMENTS]} />
            <meshStandardMaterial color={pipeCapColor} />
          </mesh>
        </group>
      )}

      {topHeight > 0 && (
        <group>
          <mesh position={[0, topStart + topHeight / 2, 0]}>
            <cylinderGeometry args={[PIPE_RADIUS, PIPE_RADIUS, topHeight, PIPE_SEGMENTS]} />
            <meshStandardMaterial color={pipeColor} />
          </mesh>
          <mesh position={[0, topStart, 0]}>
            <cylinderGeometry args={[PIPE_RADIUS * 1.2, PIPE_RADIUS * 1.2, 0.4, PIPE_SEGMENTS]} />
            <meshStandardMaterial color={pipeCapColor} />
          </mesh>
        </group>
      )}
    </group>
  );
}

export function Pipes() {
  const pipes = useGame((s) => s.pipes);

  return (
    <>
      {pipes.map((pipe) => (
        <PipePair key={pipe.id} z={pipe.z} gapY={pipe.gapY} />
      ))}
    </>
  );
}
