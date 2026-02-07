import { useEffect, useCallback, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGame, getPathX } from "@/lib/stores/useGame";
import { useAudio } from "@/lib/stores/useAudio";
import { Bird } from "./Bird";
import { Pipes } from "./Pipes";
import { Ground, Sky, Clouds } from "./Ground";

function GameLogic() {
  const prevPhase = useRef<string>("ready");

  useFrame((_, delta) => {
    const state = useGame.getState();

    if (state.phase === "playing") {
      state.updateBird(delta);
    } else if (state.phase === "dying") {
      state.updateDying(delta);
    }

    if (prevPhase.current === "playing" && (state.phase === "dying" || state.phase === "ended")) {
      const { playHit } = useAudio.getState();
      playHit();
    }

    prevPhase.current = state.phase;
  });

  return null;
}

function CameraController() {
  const { camera } = useThree();
  const smoothPos = useRef(new THREE.Vector3(0, 6, 8));
  const smoothLook = useRef(new THREE.Vector3(0, 4, -10));

  useFrame(() => {
    const state = useGame.getState();

    const behindDist = 10;
    const behindZ = state.birdZ + behindDist;
    const behindX = getPathX(behindZ);

    const targetPos = new THREE.Vector3(
      behindX * 0.5 + state.birdX * 0.5,
      state.birdY + 3,
      behindZ
    );

    const lookAheadZ = state.birdZ - 12;
    const lookAheadX = getPathX(lookAheadZ);
    const targetLook = new THREE.Vector3(
      lookAheadX * 0.7 + state.birdX * 0.3,
      state.birdY - 0.5,
      lookAheadZ
    );

    const lerpSpeed = state.phase === "dying" ? 0.03 : 0.12;
    smoothPos.current.lerp(targetPos, lerpSpeed);
    smoothLook.current.lerp(targetLook, lerpSpeed);

    camera.position.copy(smoothPos.current);
    camera.lookAt(smoothLook.current);
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

      <GameLogic />
      <InputHandler />

      <Sky />
      <Clouds />
      <Ground />
      <Bird />
      <Pipes />

      <CameraController />

      <fog attach="fog" args={["#87CEEB", 80, 180]} />
    </>
  );
}
