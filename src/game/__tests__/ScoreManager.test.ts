// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import { ScoreManager } from "../ScoreManager";

describe("ScoreManager", () => {
  let sm: ScoreManager;

  beforeEach(() => {
    localStorage.clear();
    sm = new ScoreManager();
  });

  it("starts at zero", () => {
    expect(sm.score).toBe(0);
    expect(sm.combo).toBe(0);
    expect(sm.multiplier).toBe(1);
  });

  it("adds score with multiplier", () => {
    sm.addScore(1);
    expect(sm.score).toBe(1);
  });

  it("increases combo on near-miss", () => {
    sm.registerNearMiss();
    expect(sm.combo).toBe(1);
    expect(sm.multiplier).toBe(2);
  });

  it("applies multiplier from combos", () => {
    sm.registerNearMiss();
    sm.registerNearMiss();
    sm.addScore(1);
    expect(sm.score).toBe(3); // 1 * (1 + 2 combo)
  });

  it("resets combo after scoring without near-miss", () => {
    sm.registerNearMiss();
    sm.addScore(1); // uses combo
    sm.addScore(1); // no near-miss, combo should have been reset
    expect(sm.score).toBe(3); // 2 + 1
  });

  it("tracks best score via finalize", () => {
    sm.addScore(10);
    sm.finalize();
    expect(sm.bestScore).toBe(10);
  });

  it("persists best score in localStorage", () => {
    sm.addScore(42);
    sm.finalize();
    const sm2 = new ScoreManager();
    expect(sm2.bestScore).toBe(42);
  });

  it("resets score but keeps best", () => {
    sm.addScore(50);
    sm.finalize();
    sm.reset();
    expect(sm.score).toBe(0);
    expect(sm.bestScore).toBe(50);
  });
});
