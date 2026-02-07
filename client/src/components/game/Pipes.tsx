import { useMemo } from "react";
import * as THREE from "three";
import { useGame, PIPE_RADIUS, PIPE_CAP_RADIUS, PIPE_CAP_HEIGHT } from "@/lib/stores/useGame";

const PIPE_SEGMENTS = 12;
const PIPE_MAX_HEIGHT = 15;
const PIPE_EXIT_DURATION = 0.5;
const EXIT_DISTANCE = 20;

const MIN_GAP_SIZE = 3.6;
const BASE_GAP_SIZE = 5.0;

function getGapForScore(score: number) {
  const t = Math.min(score / 40, 1);
  return BASE_GAP_SIZE - (BASE_GAP_SIZE - MIN_GAP_SIZE) * t;
}

function PipePair({ x, z, gapY, hit, gapSize, passed, passedTime }: {
  x: number; z: number; gapY: number; hit: boolean; gapSize: number;
  passed: boolean; passedTime: number;
}) {
  const halfGap = gapSize / 2;

  const bottomHeight = gapY - halfGap;
  const topStart = gapY + halfGap;
  const topHeight = PIPE_MAX_HEIGHT - topStart;

  const pipeColor = useMemo(() => new THREE.Color("#2ECC40"), []);
  const pipeCapColor = useMemo(() => new THREE.Color("#27AE36"), []);
  const hitColor = useMemo(() => new THREE.Color("#FF3333"), []);
  const hitCapColor = useMemo(() => new THREE.Color("#CC2222"), []);

  const bodyCol = hit ? hitColor : pipeColor;
  const capCol = hit ? hitCapColor : pipeCapColor;

  let bottomOffset = 0;
  let topOffset = 0;
  if (passed) {
    const t = Math.min(passedTime / PIPE_EXIT_DURATION, 1);
    const eased = t * t;
    bottomOffset = -eased * EXIT_DISTANCE;
    topOffset = eased * EXIT_DISTANCE;
  }

  return (
    <group position={[x, 0, z]}>
      {!passed && (
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[PIPE_CAP_RADIUS * 1.3, 16]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.3} depthWrite={false} />
        </mesh>
      )}

      {bottomHeight > 0 && (
        <group position={[0, bottomOffset, 0]}>
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
        <group position={[0, topOffset, 0]}>
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
  const score = useGame((s) => s.score);
  const gapSize = getGapForScore(score);

  return (
    <>
      {pipes.map((pipe) => (
        <PipePair
          key={pipe.id}
          x={pipe.x}
          z={pipe.z}
          gapY={pipe.gapY}
          hit={pipe.hit}
          gapSize={gapSize}
          passed={pipe.passed}
          passedTime={pipe.passedTime}
        />
      ))}
    </>
  );
}
