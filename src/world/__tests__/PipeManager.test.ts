import { describe, it, expect } from "vitest";
import { checkCollision, getDifficulty } from "../PipeManager";

describe("Pipe collision", () => {
  it("returns false when bird is far from pipe", () => {
    const result = checkCollision(4, -10, 0.4, { z: -20, gapY: 4, gapSize: 5 });
    expect(result.hit).toBe(false);
  });

  it("returns true when bird hits bottom pipe", () => {
    const result = checkCollision(2, -10, 0.4, { z: -10, gapY: 5, gapSize: 4 });
    expect(result.hit).toBe(true);
  });

  it("returns true when bird hits top pipe", () => {
    const result = checkCollision(7, -10, 0.4, { z: -10, gapY: 4, gapSize: 4 });
    expect(result.hit).toBe(true);
  });

  it("returns false when bird is in gap", () => {
    const result = checkCollision(4, -10, 0.4, { z: -10, gapY: 4, gapSize: 5 });
    expect(result.hit).toBe(false);
  });

  it("detects near-miss within 0.3 units of pipe edge", () => {
    // Bird just barely inside the gap
    const result = checkCollision(4, -10, 0.4, { z: -10, gapY: 4, gapSize: 2.5 });
    // Bird edge is at 3.6 and 4.4, gap is 2.75-5.25 — bird is well inside
    // Let's test with a tighter scenario
    const result2 = checkCollision(3.1, -10, 0.4, { z: -10, gapY: 4, gapSize: 3 });
    // Gap bottom at 2.5, bird bottom at 2.7 — only 0.2 units away from edge
    expect(result2.hit).toBe(false);
    expect(result2.nearMiss).toBe(true);
  });
});

describe("Difficulty scaling", () => {
  it("starts easy", () => {
    const d = getDifficulty(0);
    expect(d.gapSize).toBe(5.0);
    expect(d.speed).toBe(13);
    expect(d.pipeSpacing).toBe(18);
  });

  it("gets harder with score", () => {
    const d = getDifficulty(150);
    expect(d.gapSize).toBeLessThan(4);
    expect(d.speed).toBeGreaterThan(18);
    expect(d.pipeSpacing).toBeLessThan(13);
  });

  it("caps difficulty", () => {
    const d = getDifficulty(1000);
    expect(d.gapSize).toBeCloseTo(3.4);
    expect(d.speed).toBeCloseTo(20);
  });
});
