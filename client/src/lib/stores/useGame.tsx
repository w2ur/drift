import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type GamePhase = "ready" | "playing" | "ended";

interface Pipe {
  id: number;
  z: number;
  gapY: number;
  passed: boolean;
}

interface GameState {
  phase: GamePhase;
  score: number;
  bestScore: number;
  birdY: number;
  birdVelocity: number;
  birdZ: number;
  pipes: Pipe[];
  nextPipeId: number;

  start: () => void;
  restart: () => void;
  end: () => void;
  flap: () => void;
  updateBird: (delta: number) => void;
}

const GRAVITY = -18;
const FLAP_FORCE = 7;
const PIPE_SPACING = 20;
const BIRD_SPEED = 12;
const GAP_SIZE = 5;
const PIPE_HEIGHT = 12;
const INITIAL_PIPE_Z = -40;

export const useGame = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    phase: "ready",
    score: 0,
    bestScore: parseInt(localStorage.getItem("flappy3d_best") || "0"),
    birdY: 3,
    birdVelocity: 0,
    birdZ: 0,
    pipes: [],
    nextPipeId: 0,

    start: () => {
      set((state) => {
        if (state.phase === "ready") {
          const pipes: Pipe[] = [];
          let id = 0;
          for (let i = 0; i < 8; i++) {
            pipes.push({
              id: id++,
              z: INITIAL_PIPE_Z - i * PIPE_SPACING,
              gapY: 2 + Math.random() * 4,
              passed: false,
            });
          }
          return {
            phase: "playing",
            score: 0,
            birdY: 3,
            birdVelocity: 2,
            birdZ: 0,
            pipes,
            nextPipeId: id,
          };
        }
        return {};
      });
    },

    restart: () => {
      set(() => ({
        phase: "ready",
        score: 0,
        birdY: 3,
        birdVelocity: 0,
        birdZ: 0,
        pipes: [],
        nextPipeId: 0,
      }));
    },

    end: () => {
      set((state) => {
        if (state.phase === "playing") {
          const best = Math.max(state.score, state.bestScore);
          localStorage.setItem("flappy3d_best", best.toString());
          return { phase: "ended", bestScore: best };
        }
        return {};
      });
    },

    flap: () => {
      const { phase } = get();
      if (phase === "playing") {
        set({ birdVelocity: FLAP_FORCE });
      }
    },

    updateBird: (delta: number) => {
      const state = get();
      if (state.phase !== "playing") return;

      const clampedDelta = Math.min(delta, 0.05);
      const newVelocity = state.birdVelocity + GRAVITY * clampedDelta;
      const newY = state.birdY + newVelocity * clampedDelta;
      const newZ = state.birdZ - BIRD_SPEED * clampedDelta;

      if (newY < 0.5 || newY > 10) {
        get().end();
        return;
      }

      for (const pipe of state.pipes) {
        const dz = Math.abs(newZ - pipe.z);
        if (dz < 1.5) {
          const halfGap = GAP_SIZE / 2;
          if (newY < pipe.gapY - halfGap + 0.4 || newY > pipe.gapY + halfGap - 0.4) {
            get().end();
            return;
          }
        }
      }

      let scoreIncrement = 0;
      const updatedPipes = state.pipes.map((pipe) => {
        if (!pipe.passed && newZ < pipe.z - 1.5) {
          scoreIncrement++;
          return { ...pipe, passed: true };
        }
        return pipe;
      });

      const newScore = state.score + scoreIncrement;

      const furthestZ = Math.min(...updatedPipes.map((p) => p.z));
      let finalPipes = updatedPipes;
      let nextId = state.nextPipeId;

      if (newZ - furthestZ < 80) {
        const newPipes = [];
        for (let i = 0; i < 3; i++) {
          newPipes.push({
            id: nextId++,
            z: furthestZ - PIPE_SPACING * (i + 1),
            gapY: 2 + Math.random() * 4,
            passed: false,
          });
        }
        finalPipes = [...finalPipes, ...newPipes];
      }

      finalPipes = finalPipes.filter((p) => p.z < newZ + 30 && p.z > newZ - 150);

      set({
        birdY: newY,
        birdVelocity: newVelocity,
        birdZ: newZ,
        pipes: finalPipes,
        score: newScore,
        nextPipeId: nextId,
      });
    },

  }))
);

export { GRAVITY, FLAP_FORCE, PIPE_SPACING, BIRD_SPEED, GAP_SIZE, PIPE_HEIGHT, INITIAL_PIPE_Z };
