import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type GamePhase = "ready" | "playing" | "dying" | "ended";
export type CameraAngle = "close-left" | "close-right" | "far-left" | "far-right";

interface Pipe {
  id: number;
  z: number;
  x: number;
  gapY: number;
  passed: boolean;
  hit: boolean;
  moveSpeed: number;
  moveRange: number;
  moveOffset: number;
  baseGapY: number;
  passedTime: number;
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
  dyingTimer: number;
  gameTime: number;
  cameraAngle: CameraAngle;

  start: () => void;
  restart: () => void;
  end: (reason?: string, pipeId?: number) => void;
  flap: () => void;
  updateBird: (delta: number) => void;
  updateDying: (delta: number) => void;
  getPathX: (z: number) => number;
  setCameraAngle: (angle: CameraAngle) => void;
}

const GRAVITY = -16;
const FLAP_FORCE = 7;
const PIPE_SPACING = 18;
const BIRD_SPEED = 13;
const GAP_SIZE = 5.0;
const PIPE_HEIGHT = 12;
const INITIAL_PIPE_Z = -40;
const PIPE_RADIUS = 1.0;
const PIPE_CAP_RADIUS = PIPE_RADIUS * 1.2;
const PIPE_CAP_HEIGHT = 0.3;

const BIRD_VISUAL_RADIUS = 0.4;

const DYING_DURATION = 1.0;

const MIN_GAP_SIZE = 3.6;
const MIN_PIPE_SPACING = 12;
const MAX_MOVE_SPEED = 2.5;
const MAX_MOVE_RANGE = 1.8;

function getDifficulty(score: number) {
  const t = Math.min(score / 40, 1);

  const gapSize = GAP_SIZE - (GAP_SIZE - MIN_GAP_SIZE) * t;
  const pipeSpacing = PIPE_SPACING - (PIPE_SPACING - MIN_PIPE_SPACING) * t;

  const moveChance = Math.min(score / 20, 0.7);
  const moveSpeed = MAX_MOVE_SPEED * t;
  const moveRange = MAX_MOVE_RANGE * t;

  return { gapSize, pipeSpacing, moveChance, moveSpeed, moveRange };
}

function getPathX(z: number): number {
  return 8 * Math.sin(z * 0.025) + 4 * Math.sin(z * 0.06 + 1.5);
}

function checkPipeCollision(
  birdY: number,
  birdZ: number,
  pipe: Pipe,
  currentGapSize: number
): { hit: boolean; side: string } {
  const dz = Math.abs(birdZ - pipe.z);

  if (dz > PIPE_RADIUS + BIRD_VISUAL_RADIUS) {
    return { hit: false, side: "" };
  }

  const halfGap = currentGapSize / 2;

  const bottomPipeTop = pipe.gapY - halfGap;
  const topPipeBottom = pipe.gapY + halfGap;

  const birdBottom = birdY - BIRD_VISUAL_RADIUS;
  const birdTop = birdY + BIRD_VISUAL_RADIUS;

  if (birdBottom < bottomPipeTop) {
    return { hit: true, side: "bottom" };
  }
  if (birdTop > topPipeBottom) {
    return { hit: true, side: "top" };
  }

  return { hit: false, side: "" };
}

function createPipe(id: number, z: number, score: number): Pipe {
  const diff = getDifficulty(score);
  const baseGapY = 2.5 + Math.random() * 4;
  const isMoving = Math.random() < diff.moveChance;
  return {
    id,
    z,
    x: getPathX(z),
    gapY: baseGapY,
    baseGapY,
    passed: false,
    hit: false,
    moveSpeed: isMoving ? 0.8 + Math.random() * diff.moveSpeed : 0,
    moveRange: isMoving ? 0.5 + Math.random() * diff.moveRange : 0,
    moveOffset: Math.random() * Math.PI * 2,
    passedTime: 0,
  };
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
    dyingTimer: 0,
    gameTime: 0,
    cameraAngle: "close-left" as CameraAngle,

    getPathX,

    start: () => {
      set((state) => {
        if (state.phase === "ready") {
          const pipes: Pipe[] = [];
          let id = 0;
          for (let i = 0; i < 8; i++) {
            const pz = INITIAL_PIPE_Z - i * PIPE_SPACING;
            pipes.push(createPipe(id++, pz, 0));
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
            gameTime: 0,
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
        dyingTimer: 0,
        gameTime: 0,
      }));
    },

    end: (reason?: string, hitPipeId?: number) => {
      set((state) => {
        if (state.phase === "playing") {
          const best = Math.max(state.score, state.bestScore);
          localStorage.setItem("flappy3d_best", best.toString());
          const updatedPipes = hitPipeId !== undefined
            ? state.pipes.map(p => p.id === hitPipeId ? { ...p, hit: true } : p)
            : state.pipes;
          return {
            phase: "dying",
            bestScore: best,
            deathReason: reason || "",
            dyingTimer: 0,
            birdVelocity: 3,
            pipes: updatedPipes,
          };
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

    updateDying: (delta: number) => {
      const state = get();
      if (state.phase !== "dying") return;

      const newTimer = state.dyingTimer + delta;
      const newVelocity = state.birdVelocity + GRAVITY * delta;
      const newY = Math.max(0, state.birdY + newVelocity * delta);

      if (newTimer >= DYING_DURATION || newY <= 0) {
        set({ phase: "ended", birdY: newY, birdVelocity: newVelocity, dyingTimer: newTimer });
      } else {
        set({ birdY: newY, birdVelocity: newVelocity, dyingTimer: newTimer });
      }
    },

    setCameraAngle: (angle: CameraAngle) => {
      set({ cameraAngle: angle });
    },

    updateBird: (delta: number) => {
      const state = get();
      if (state.phase !== "playing") return;

      const clampedDelta = Math.min(delta, 0.05);
      const newVelocity = state.birdVelocity + GRAVITY * clampedDelta;
      const newY = state.birdY + newVelocity * clampedDelta;
      const newZ = state.birdZ - BIRD_SPEED * clampedDelta;
      const newX = getPathX(newZ);
      const newGameTime = state.gameTime + clampedDelta;

      if (newY < BIRD_VISUAL_RADIUS) {
        get().end("Hit the ground");
        return;
      }
      if (newY > 12) {
        get().end("Flew too high");
        return;
      }

      const diff = getDifficulty(state.score);

      const movingPipes = state.pipes.map((pipe) => {
        if (pipe.moveSpeed > 0) {
          const newGapY = pipe.baseGapY + Math.sin(newGameTime * pipe.moveSpeed + pipe.moveOffset) * pipe.moveRange;
          const clampedGapY = Math.max(diff.gapSize / 2 + 0.5, Math.min(newGapY, 12 - diff.gapSize / 2 - 0.5));
          return { ...pipe, gapY: clampedGapY };
        }
        return pipe;
      });

      for (const pipe of movingPipes) {
        const result = checkPipeCollision(newY, newZ, pipe, diff.gapSize);
        if (result.hit) {
          get().end(`Hit ${result.side} pipe`, pipe.id);
          return;
        }
      }

      const PIPE_EXIT_DURATION = 0.5;

      let scoreIncrement = 0;
      const updatedPipes = movingPipes.map((pipe) => {
        if (!pipe.passed && newZ < pipe.z - PIPE_CAP_RADIUS - BIRD_VISUAL_RADIUS) {
          scoreIncrement++;
          return { ...pipe, passed: true, passedTime: 0 };
        }
        if (pipe.passed) {
          return { ...pipe, passedTime: pipe.passedTime + clampedDelta };
        }
        return pipe;
      });

      const newScore = state.score + scoreIncrement;

      const furthestZ = Math.min(...updatedPipes.map((p) => p.z));
      let finalPipes = updatedPipes;
      let nextId = state.nextPipeId;

      if (newZ - furthestZ < 100) {
        const newDiff = getDifficulty(newScore);
        const newPipes = [];
        for (let i = 0; i < 4; i++) {
          const pz = furthestZ - newDiff.pipeSpacing * (i + 1);
          newPipes.push(createPipe(nextId++, pz, newScore));
        }
        finalPipes = [...finalPipes, ...newPipes];
      }

      finalPipes = finalPipes.filter((p) => p.z > newZ - 160 && (!p.passed || p.passedTime < PIPE_EXIT_DURATION));

      set({
        birdY: newY,
        birdX: newX,
        birdVelocity: newVelocity,
        birdZ: newZ,
        pipes: finalPipes,
        score: newScore,
        nextPipeId: nextId,
        gameTime: newGameTime,
      });
    },

  }))
);

export { GRAVITY, FLAP_FORCE, PIPE_SPACING, BIRD_SPEED, GAP_SIZE, PIPE_HEIGHT, INITIAL_PIPE_Z, PIPE_RADIUS, PIPE_CAP_RADIUS, PIPE_CAP_HEIGHT, BIRD_VISUAL_RADIUS, getPathX };
