import { useMemo } from "react";
import * as THREE from "three";
import { useGame, GAP_SIZE, PIPE_RADIUS, PIPE_CAP_RADIUS, PIPE_CAP_HEIGHT } from "@/lib/stores/useGame";

const PIPE_SEGMENTS = 12;
const PIPE_MAX_HEIGHT = 15;

function PipePair({ x, z, gapY, hit }: { x: number; z: number; gapY: number; hit: boolean }) {
  const halfGap = GAP_SIZE / 2;

  const bottomHeight = gapY - halfGap;
  const topStart = gapY + halfGap;
  const topHeight = PIPE_MAX_HEIGHT - topStart;

  const pipeColor = useMemo(() => new THREE.Color("#2ECC40"), []);
  const pipeCapColor = useMemo(() => new THREE.Color("#27AE36"), []);
  const hitColor = useMemo(() => new THREE.Color("#FF3333"), []);
  const hitCapColor = useMemo(() => new THREE.Color("#CC2222"), []);

  const bodyCol = hit ? hitColor : pipeColor;
  const capCol = hit ? hitCapColor : pipeCapColor;

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[PIPE_CAP_RADIUS * 1.3, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} depthWrite={false} />
      </mesh>

      {bottomHeight > 0 && (
        <group>
          <mesh receiveShadow position={[0, bottomHeight / 2, 0]}>
            <cylinderGeometry args={[PIPE_RADIUS, PIPE_RADIUS, bottomHeight, PIPE_SEGMENTS]} />
            <meshStandardMaterial color={bodyCol} />
          </mesh>
          <mesh receiveShadow position={[0, bottomHeight + PIPE_CAP_HEIGHT / 2, 0]}>
            <cylinderGeometry args={[PIPE_CAP_RADIUS, PIPE_CAP_RADIUS, PIPE_CAP_HEIGHT, PIPE_SEGMENTS]} />
            <meshStandardMaterial color={capCol} />
          </mesh>
        </group>
      )}

      {topHeight > 0 && (
        <group>
          <mesh receiveShadow position={[0, topStart + topHeight / 2, 0]}>
            <cylinderGeometry args={[PIPE_RADIUS, PIPE_RADIUS, topHeight, PIPE_SEGMENTS]} />
            <meshStandardMaterial color={bodyCol} />
          </mesh>
          <mesh receiveShadow position={[0, topStart - PIPE_CAP_HEIGHT / 2, 0]}>
            <cylinderGeometry args={[PIPE_CAP_RADIUS, PIPE_CAP_RADIUS, PIPE_CAP_HEIGHT, PIPE_SEGMENTS]} />
            <meshStandardMaterial color={capCol} />
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
        <PipePair key={pipe.id} x={pipe.x} z={pipe.z} gapY={pipe.gapY} hit={pipe.hit} />
      ))}
    </>
  );
}
