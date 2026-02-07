import { useRef, useEffect, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "@/lib/stores/useGame";
import { useAudio } from "@/lib/stores/useAudio";
import { Bird } from "./Bird";
import { Pipes } from "./Pipes";
import { Ground, Sky, Clouds } from "./Ground";

function CameraController() {
  const { camera } = useThree();

  useFrame(() => {
    const state = useGame.getState();
    const targetX = 0;
    const targetY = state.birdY + 2;
    const targetZ = state.birdZ + 8;

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.1);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.08);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.1);

    camera.lookAt(0, state.birdY, state.birdZ - 10);
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

    if (prevPhase.current !== "playing" && state.phase === "playing") {
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

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      handleFlap();
    };

    const onClick = () => {
      handleFlap();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("touchstart", onTouchStart, { passive: false });
    window.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("click", onClick);
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

      <fog attach="fog" args={["#87CEEB", 60, 150]} />
    </>
  );
}
