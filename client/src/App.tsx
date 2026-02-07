import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import { useAudio } from "./lib/stores/useAudio";
import { GameScene } from "./components/game/GameScene";
import { GameUI } from "./components/game/GameUI";
import "@fontsource/inter";

function AudioInitializer() {
  const setBackgroundMusic = useAudio((s) => s.setBackgroundMusic);
  const setHitSound = useAudio((s) => s.setHitSound);
  const setSuccessSound = useAudio((s) => s.setSuccessSound);

  useEffect(() => {
    const bg = new Audio("/sounds/background.mp3");
    bg.loop = true;
    bg.volume = 0.3;
    setBackgroundMusic(bg);

    const hit = new Audio("/sounds/hit.mp3");
    hit.volume = 0.5;
    setHitSound(hit);

    const success = new Audio("/sounds/success.mp3");
    success.volume = 0.4;
    setSuccessSound(success);
  }, [setBackgroundMusic, setHitSound, setSuccessSound]);

  return null;
}

function App() {
  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden" }}>
      <AudioInitializer />
      <Canvas
        shadows
        camera={{
          position: [0, 5, 8],
          fov: 60,
          near: 0.1,
          far: 300,
        }}
        gl={{
          antialias: true,
          powerPreference: "default",
        }}
      >
        <Suspense fallback={null}>
          <GameScene />
        </Suspense>
      </Canvas>
      <GameUI />
    </div>
  );
}

export default App;
