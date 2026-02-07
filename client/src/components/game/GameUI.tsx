import { useGame } from "@/lib/stores/useGame";
import { useAudio } from "@/lib/stores/useAudio";
import { useEffect, useRef } from "react";

function ScoreDisplay() {
  const score = useGame((s) => s.score);
  const phase = useGame((s) => s.phase);
  const prevScore = useRef(0);

  useEffect(() => {
    if (score > prevScore.current && phase === "playing") {
      const { playSuccess } = useAudio.getState();
      playSuccess();
    }
    prevScore.current = score;
  }, [score, phase]);

  if (phase !== "playing") return null;

  return (
    <div style={{
      position: "absolute",
      top: "40px",
      left: "50%",
      transform: "translateX(-50%)",
      fontSize: "64px",
      fontWeight: "bold",
      color: "#FFFFFF",
      textShadow: "3px 3px 6px rgba(0,0,0,0.5), -1px -1px 3px rgba(0,0,0,0.3)",
      fontFamily: "'Inter', sans-serif",
      zIndex: 10,
      userSelect: "none",
      pointerEvents: "none",
    }}>
      {score}
    </div>
  );
}

function StartScreen() {
  const phase = useGame((s) => s.phase);

  if (phase !== "ready") return null;

  return (
    <div style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10,
      userSelect: "none",
      pointerEvents: "none",
    }}>
      <div style={{
        background: "rgba(0,0,0,0.6)",
        borderRadius: "20px",
        padding: "40px 60px",
        textAlign: "center",
        backdropFilter: "blur(10px)",
      }}>
        <h1 style={{
          fontSize: "48px",
          fontWeight: "bold",
          color: "#FFD700",
          margin: "0 0 10px 0",
          fontFamily: "'Inter', sans-serif",
          textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
        }}>
          3D Flappy Bird
        </h1>
        <p style={{
          fontSize: "18px",
          color: "#FFFFFF",
          margin: "0 0 30px 0",
          fontFamily: "'Inter', sans-serif",
          opacity: 0.9,
        }}>
          Fly through the pipes in 3D!
        </p>
        <div style={{
          fontSize: "22px",
          color: "#FFD700",
          fontFamily: "'Inter', sans-serif",
          animation: "pulse 1.5s ease-in-out infinite",
        }}>
          Click / Tap / Space to start
        </div>
      </div>
    </div>
  );
}

function GameOverScreen() {
  const phase = useGame((s) => s.phase);
  const score = useGame((s) => s.score);
  const bestScore = useGame((s) => s.bestScore);
  const restart = useGame((s) => s.restart);
  const deathReason = useGame((s) => s.deathReason);

  if (phase !== "ended") return null;

  return (
    <div style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10,
      userSelect: "none",
    }}>
      <div style={{
        background: "rgba(0,0,0,0.7)",
        borderRadius: "20px",
        padding: "40px 60px",
        textAlign: "center",
        backdropFilter: "blur(10px)",
      }}>
        <h2 style={{
          fontSize: "42px",
          fontWeight: "bold",
          color: "#FF4444",
          margin: "0 0 20px 0",
          fontFamily: "'Inter', sans-serif",
        }}>
          Game Over
        </h2>
        <div style={{
          fontSize: "28px",
          color: "#FFFFFF",
          margin: "0 0 10px 0",
          fontFamily: "'Inter', sans-serif",
        }}>
          Score: <span style={{ color: "#FFD700", fontWeight: "bold" }}>{score}</span>
        </div>
        <div style={{
          fontSize: "20px",
          color: "#AAAAAA",
          margin: "0 0 10px 0",
          fontFamily: "'Inter', sans-serif",
        }}>
          Best: <span style={{ color: "#FFD700" }}>{bestScore}</span>
        </div>
        {deathReason && (
          <div style={{
            fontSize: "18px",
            color: "#FF9999",
            margin: "5px 0 25px 0",
            fontFamily: "'Inter', sans-serif",
            padding: "8px 16px",
            background: "rgba(255,0,0,0.15)",
            borderRadius: "8px",
          }}>
            {deathReason}
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            restart();
          }}
          style={{
            background: "linear-gradient(135deg, #FFD700, #FFA500)",
            border: "none",
            borderRadius: "12px",
            padding: "14px 40px",
            fontSize: "20px",
            fontWeight: "bold",
            color: "#333",
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
            transition: "transform 0.1s",
            pointerEvents: "auto",
          }}
          onMouseDown={(e) => {
            (e.target as HTMLElement).style.transform = "scale(0.95)";
          }}
          onMouseUp={(e) => {
            (e.target as HTMLElement).style.transform = "scale(1)";
          }}
        >
          Play Again (R)
        </button>
      </div>
    </div>
  );
}

function SoundToggle() {
  const isMuted = useAudio((s) => s.isMuted);
  const toggleMute = useAudio((s) => s.toggleMute);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleMute();
      }}
      style={{
        position: "absolute",
        top: "15px",
        right: "15px",
        zIndex: 20,
        background: "rgba(0,0,0,0.5)",
        border: "none",
        borderRadius: "50%",
        width: "44px",
        height: "44px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontSize: "20px",
        color: "#fff",
        pointerEvents: "auto",
      }}
    >
      {isMuted ? "🔇" : "🔊"}
    </button>
  );
}

export function GameUI() {
  return (
    <>
      <ScoreDisplay />
      <StartScreen />
      <GameOverScreen />
      <SoundToggle />
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
}
