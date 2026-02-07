import { useEffect, useCallback, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGame, getPathX } from "@/lib/stores/useGame";
import { useAudio } from "@/lib/stores/useAudio";
import { Bird } from "./Bird";
import { Pipes } from "./Pipes";
import { Ground, Sky, Clouds } from "./Ground";

function CameraController() {
  const { camera } = useThree();
  const smoothX = useRef(0);
  const smoothY = useRef(5);
  const smoothZ = useRef(8);

  useFrame(() => {
    const state = useGame.getState();

    const lookAheadZ = state.birdZ - 5;
    const lookAheadX = getPathX(lookAheadZ);
    const avgX = (state.birdX + lookAheadX) * 0.5;

    const targetX = avgX;
    const targetY = state.birdY + 2.5;
    const targetZ = state.birdZ + 10;

    smoothX.current = THREE.MathUtils.lerp(smoothX.current, targetX, 0.06);
    smoothY.current = THREE.MathUtils.lerp(smoothY.current, targetY, 0.06);
    smoothZ.current = THREE.MathUtils.lerp(smoothZ.current, targetZ, 0.08);

    camera.position.set(smoothX.current, smoothY.current, smoothZ.current);

    const lookTarget = new THREE.Vector3(state.birdX, state.birdY, state.birdZ - 15);
    camera.lookAt(lookTarget);
  });

  return null;
}

function GameLogic() {
  const prevPhase = useRef<string>("ready");

  useFrame((_, delta) => {
    const state = useGame.getState();

    if (state.phase === "playing") {
      state.updateBird(delta);
    }

    if (prevPhase.current === "playing" && state.phase === "ended") {
      const { playHit } = useAudio.getState();
      playHit();
    }

    prevPhase.current = state.phase;
  });

  return null;
}

function InputHandler() {
  const handleFlap = useCallback(() => {
    const state = useGame.getState();
    if (state.phase === "ready") {
      state.start();
      setTimeout(() => useGame.getState().flap(), 50);
    } else if (state.phase === "playing") {
      state.flap();
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        handleFlap();
      }
      if (e.code === "KeyR") {
        const state = useGame.getState();
        if (state.phase === "ended") {
          state.restart();
        }
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "BUTTON") return;
      handleFlap();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [handleFlap]);

  return null;
}

export function GameScene() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 20, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-5, 10, -10]} intensity={0.3} />

      <Sky />
      <Clouds />
      <Ground />
      <Bird />
      <Pipes />

      <CameraController />
      <GameLogic />
      <InputHandler />

      <fog attach="fog" args={["#87CEEB", 80, 180]} />
    </>
  );
}
