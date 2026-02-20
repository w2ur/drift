import { describe, it, expect } from "vitest";
import { Clock } from "../Clock";

describe("Clock", () => {
  it("returns clamped delta", () => {
    const clock = new Clock();
    const delta = clock.clampDelta(0.016);
    expect(delta).toBeCloseTo(0.016);
  });

  it("clamps large deltas to 0.05", () => {
    const clock = new Clock();
    const delta = clock.clampDelta(0.2);
    expect(delta).toBe(0.05);
  });

  it("tracks elapsed time", () => {
    const clock = new Clock();
    clock.tick(0.016);
    clock.tick(0.016);
    expect(clock.elapsed).toBeCloseTo(0.032);
  });

  it("supports time scale for slow-mo", () => {
    const clock = new Clock();
    clock.timeScale = 0.5;
    clock.tick(0.016);
    expect(clock.scaledDelta).toBeCloseTo(0.008);
  });
});
