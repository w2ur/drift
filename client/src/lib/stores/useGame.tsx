import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type GamePhase = "ready" | "playing" | "ended";

interface Pipe {
  id: number;
  z: number;
  x: number;
  gapY: number;
  passed: boolean;
}

interface GameState {
  phase: GamePhase;
  score: number;
  bestScore: number;
  birdY: number;
  birdX: number;
  birdVelocity: number;
  birdZ: number;
  pipes: Pipe[];
  nextPipeId: number;
  deathReason: string;

  start: () => void;
  restart: () => void;
  end: (reason?: string) => void;
  flap: () => void;
  updateBird: (delta: number) => void;
  getPathX: (z: number) => number;
}

const GRAVITY = -16;
const FLAP_FORCE = 7;
const PIPE_SPACING = 18;
const BIRD_SPEED = 13;
const GAP_SIZE = 5.0;
const PIPE_HEIGHT = 12;
const INITIAL_PIPE_Z = -40;
const BIRD_RADIUS = 0.2;
const PIPE_RADIUS = 1.0;
const PIPE_CAP_RADIUS = PIPE_RADIUS * 1.2;
const PIPE_CAP_HEIGHT = 0.3;

function getPathX(z: number): number {
  return 8 * Math.sin(z * 0.025) + 4 * Math.sin(z * 0.06 + 1.5);
}

export const useGame = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    phase: "ready",
    score: 0,
    bestScore: parseInt(localStorage.getItem("flappy3d_best") || "0"),
    birdY: 4,
    birdX: 0,
    birdVelocity: 0,
    birdZ: 0,
    pipes: [],
    nextPipeId: 0,
    deathReason: "",

    getPathX,

    start: () => {
      set((state) => {
        if (state.phase === "ready") {
          const pipes: Pipe[] = [];
          let id = 0;
          for (let i = 0; i < 8; i++) {
            const pz = INITIAL_PIPE_Z - i * PIPE_SPACING;
            pipes.push({
              id: id++,
              z: pz,
              x: getPathX(pz),
              gapY: 3 + Math.random() * 3.5,
              passed: false,
            });
          }
          return {
            phase: "playing",
            score: 0,
            birdY: 4,
            birdX: getPathX(0),
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
        birdY: 4,
        birdX: 0,
        birdVelocity: 0,
        birdZ: 0,
        pipes: [],
        nextPipeId: 0,
      }));
    },

    end: (reason?: string) => {
      set((state) => {
        if (state.phase === "playing") {
          const best = Math.max(state.score, state.bestScore);
          localStorage.setItem("flappy3d_best", best.toString());
          return { phase: "ended", bestScore: best, deathReason: reason || "" };
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
      const newX = getPathX(newZ);

      if (newY < 0.4) {
        get().end("Hit the ground");
        return;
      }
      if (newY > 12) {
        get().end("Flew too high");
        return;
      }

      const collisionDist = PIPE_RADIUS + BIRD_RADIUS;
      for (const pipe of state.pipes) {
        const dx = newX - pipe.x;
        const dz = newZ - pipe.z;
        const distXZ = Math.sqrt(dx * dx + dz * dz);

        if (distXZ < collisionDist) {
          const halfGap = GAP_SIZE / 2;
          const gapBottom = pipe.gapY - halfGap + BIRD_RADIUS;
          const gapTop = pipe.gapY + halfGap - BIRD_RADIUS;

          if (newY < gapBottom || newY > gapTop) {
            const side = newY < gapBottom ? "bottom" : "top";
            get().end(`Hit ${side} pipe #${pipe.id}`);
            return;
          }
        }
      }

      let scoreIncrement = 0;
      const updatedPipes = state.pipes.map((pipe) => {
        if (!pipe.passed && newZ < pipe.z - PIPE_CAP_RADIUS - BIRD_RADIUS) {
          scoreIncrement++;
          return { ...pipe, passed: true };
        }
        return pipe;
      });

      const newScore = state.score + scoreIncrement;

      const furthestZ = Math.min(...updatedPipes.map((p) => p.z));
      let finalPipes = updatedPipes;
      let nextId = state.nextPipeId;

      if (newZ - furthestZ < 100) {
        const newPipes = [];
        for (let i = 0; i < 4; i++) {
          const pz = furthestZ - PIPE_SPACING * (i + 1);
          newPipes.push({
            id: nextId++,
            z: pz,
            x: getPathX(pz),
            gapY: 3 + Math.random() * 3.5,
            passed: false,
          });
        }
        finalPipes = [...finalPipes, ...newPipes];
      }

      finalPipes = finalPipes.filter((p) => p.z < newZ + 30 && p.z > newZ - 160);

      set({
        birdY: newY,
        birdX: newX,
        birdVelocity: newVelocity,
        birdZ: newZ,
        pipes: finalPipes,
        score: newScore,
        nextPipeId: nextId,
      });
    },

  }))
);

export { GRAVITY, FLAP_FORCE, PIPE_SPACING, BIRD_SPEED, GAP_SIZE, PIPE_HEIGHT, INITIAL_PIPE_Z, BIRD_RADIUS, PIPE_RADIUS, PIPE_CAP_RADIUS, PIPE_CAP_HEIGHT, getPathX };
