import { describe, it, expect, beforeEach } from "vitest";
import { BossManager } from "../BossManager";

describe("BossManager", () => {
  let bm: BossManager;

  beforeEach(() => {
    bm = new BossManager();
  });

  it("starts inactive", () => {
    expect(bm.active).toBe(false);
    expect(bm.currentPattern).toBeNull();
  });

  it("activates on startBoss and sets pattern from biome index", () => {
    bm.startBoss(0);
    expect(bm.active).toBe(true);
    expect(bm.currentPattern).not.toBeNull();
    expect(bm.currentPattern!.name).toBe("Zigzag");
  });

  it("selects correct pattern per biome index", () => {
    bm.startBoss(1);
    expect(bm.currentPattern!.name).toBe("Shrinking");

    bm.startBoss(2);
    expect(bm.currentPattern!.name).toBe("Wave");

    bm.startBoss(3);
    expect(bm.currentPattern!.name).toBe("Alternating");

    bm.startBoss(4);
    expect(bm.currentPattern!.name).toBe("Narrow");
  });

  it("wraps pattern index with modulo", () => {
    bm.startBoss(5); // wraps to index 0 => Zigzag
    expect(bm.currentPattern!.name).toBe("Zigzag");
  });

  it("does not complete boss before all pipes are passed", () => {
    bm.startBoss(0); // Zigzag: pipeCount 3
    const r1 = bm.onBossPipePassed();
    expect(r1.complete).toBe(false);
    const r2 = bm.onBossPipePassed();
    expect(r2.complete).toBe(false);
    expect(bm.active).toBe(true);
  });

  it("completes boss after all pipes passed without hitting", () => {
    bm.startBoss(0); // Zigzag: pipeCount 3
    bm.onBossPipePassed();
    bm.onBossPipePassed();
    const result = bm.onBossPipePassed();
    expect(result.complete).toBe(true);
    expect(result.cleanClear).toBe(true);
    expect(result.bonus).toBe(10);
    expect(bm.active).toBe(false);
  });

  it("completes boss after all pipes passed but marks dirty clear when hit occurred", () => {
    bm.startBoss(0); // Zigzag: pipeCount 3
    bm.onBossPipePassed();
    bm.onBossPipeHit();
    bm.onBossPipePassed();
    const result = bm.onBossPipePassed();
    expect(result.complete).toBe(true);
    expect(result.cleanClear).toBe(false);
    expect(result.bonus).toBe(0);
  });

  it("resets to inactive state", () => {
    bm.startBoss(2);
    bm.onBossPipePassed();
    bm.reset();
    expect(bm.active).toBe(false);
    expect(bm.currentPattern).toBeNull();
  });

  it("can start a new boss after reset", () => {
    bm.startBoss(1);
    bm.reset();
    bm.startBoss(3);
    expect(bm.active).toBe(true);
    expect(bm.currentPattern!.name).toBe("Alternating");
  });

  it("getGapY on Zigzag pattern alternates above/below base", () => {
    bm.startBoss(0);
    const pattern = bm.currentPattern!;
    const base = 5;
    expect(pattern.getGapY(0, base)).toBe(base + 1.5);
    expect(pattern.getGapY(1, base)).toBe(base - 1.5);
    expect(pattern.getGapY(2, base)).toBe(base + 1.5);
  });

  it("getGapY on Wave pattern uses sin", () => {
    bm.startBoss(2);
    const pattern = bm.currentPattern!;
    const base = 5;
    expect(pattern.getGapY(0, base)).toBeCloseTo(base + Math.sin(0) * 2);
    expect(pattern.getGapY(1, base)).toBeCloseTo(base + Math.sin(1.5) * 2);
  });
});
