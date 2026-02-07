import { useEffect, useCallback, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGame, getPathX } from "@/lib/stores/useGame";
import { useAudio } from "@/lib/stores/useAudio";
import { Bird } from "./Bird";
import { Pipes } from "./Pipes";
import { Ground, Sky, Clouds } from "./Ground";
import { BirdTrail, DeathParticles } from "./Particles";
import { PowerUpItems } from "./PowerUps";

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

const CAMERA_PRESETS = {
  "close-left":  { behindDist: 6,  sideOffset: -3, height: 1.8, lookAheadZ: -10, lookY: 0.2 },
  "close-right": { behindDist: 6,  sideOffset: 3,  height: 1.8, lookAheadZ: -10, lookY: 0.2 },
  "center":      { behindDist: 9,  sideOffset: 0,  height: 2.5, lookAheadZ: -12, lookY: -0.2 },
  "far-left":    { behindDist: 12, sideOffset: -5, height: 3.5, lookAheadZ: -14, lookY: -0.5 },
  "far-right":   { behindDist: 12, sideOffset: 5,  height: 3.5, lookAheadZ: -14, lookY: -0.5 },
  "birdview":    { behindDist: 0.5, sideOffset: 0,  height: 0,   lookAheadZ: -15, lookY: 0 },
};

function CameraController() {
  const { camera } = useThree();
  const smoothPos = useRef(new THREE.Vector3(0, 6, 8));
  const smoothLook = useRef(new THREE.Vector3(0, 4, -10));

  useFrame(() => {
    const state = useGame.getState();
    const preset = CAMERA_PRESETS[state.cameraAngle];

    const behindZ = state.birdZ + preset.behindDist;
    const behindX = getPathX(behindZ);

    const targetPos = new THREE.Vector3(
      behindX * 0.5 + state.birdX * 0.5 + preset.sideOffset,
      state.birdY + preset.height,
      behindZ
    );

    const lookAheadZ = state.birdZ + preset.lookAheadZ;
    const lookAheadX = getPathX(lookAheadZ);
    const targetLook = new THREE.Vector3(
      lookAheadX * 0.7 + state.birdX * 0.3,
      state.birdY + preset.lookY,
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

function ColorShift() {
  const { scene } = useThree();
  const skyMeshRef = useRef<THREE.Mesh | null>(null);
  const lastScore = useRef(-1);

  useFrame(() => {
    const state = useGame.getState();
    if (state.score === lastScore.current) return;
    lastScore.current = state.score;

    const t = Math.min(state.score / 50, 1);

    const skyColor = new THREE.Color();
    if (t < 0.33) {
      skyColor.lerpColors(new THREE.Color("#87CEEB"), new THREE.Color("#FF8C42"), t / 0.33);
    } else if (t < 0.66) {
      skyColor.lerpColors(new THREE.Color("#FF8C42"), new THREE.Color("#6B3FA0"), (t - 0.33) / 0.33);
    } else {
      skyColor.lerpColors(new THREE.Color("#6B3FA0"), new THREE.Color("#1a1a3e"), (t - 0.66) / 0.34);
    }

    if (!skyMeshRef.current) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.geometry instanceof THREE.SphereGeometry) {
          const geo = child.geometry as THREE.SphereGeometry;
          if (geo.parameters.radius === 250) {
            skyMeshRef.current = child;
          }
        }
      });
    }

    if (skyMeshRef.current) {
      (skyMeshRef.current.material as THREE.MeshBasicMaterial).color.copy(skyColor);
    }

    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.copy(skyColor);
    }
  });

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
      <PowerUpItems />
      <BirdTrail />
      <DeathParticles />

      <CameraController />
      <ColorShift />

      <fog attach="fog" args={["#87CEEB", 80, 180]} />
    </>
  );
}
