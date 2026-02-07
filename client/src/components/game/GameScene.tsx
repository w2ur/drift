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

function ShadowLight() {
  const lightRef = useRef<THREE.DirectionalLight>(null);

  useFrame(() => {
    if (!lightRef.current) return;
    const state = useGame.getState();
    lightRef.current.position.set(state.birdX + 8, state.birdY + 15, state.birdZ - 5);
    lightRef.current.target.position.set(state.birdX, state.birdY, state.birdZ);
    lightRef.current.target.updateMatrixWorld();
  });

  return (
    <directionalLight
      ref={lightRef}
      position={[8, 20, 0]}
      intensity={1.2}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-bias={-0.001}
    >
      <orthographicCamera attach="shadow-camera" args={[-15, 15, 15, -15, 0.5, 40]} />
    </directionalLight>
  );
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
      <ShadowLight />
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
