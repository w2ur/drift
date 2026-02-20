import { describe, it, expect } from "vitest";
import { BiomeManager } from "../BiomeManager";

describe("BiomeManager", () => {
  it("starts in Meadow", () => {
    const bm = new BiomeManager();
    expect(bm.currentBiome.name).toBe("Meadow");
    expect(bm.biomeIndex).toBe(0);
  });

  it("stays in same biome before reaching pipesPerBiome", () => {
    const bm = new BiomeManager();
    for (let i = 1; i <= 24; i++) bm.onPipePassed(i);
    expect(bm.currentBiome.name).toBe("Meadow");
    expect(bm.isTransitioning).toBe(false);
  });

  it("starts transition at pipesPerBiome", () => {
    const bm = new BiomeManager();
    for (let i = 1; i <= 25; i++) bm.onPipePassed(i);
    expect(bm.isTransitioning).toBe(true);
  });

  it("completes transition after TRANSITION_PIPES more pipes", () => {
    const bm = new BiomeManager();
    for (let i = 1; i <= 30; i++) bm.onPipePassed(i);
    expect(bm.currentBiome.name).toBe("Sunset Canyon");
    expect(bm.isTransitioning).toBe(false);
  });

  it("cycles through all 5 biomes", () => {
    const bm = new BiomeManager();
    // Each biome: 25 pipes + 5 transition = 30 pipes
    for (let i = 1; i <= 150; i++) bm.onPipePassed(i);
    expect(bm.loopCount).toBe(1);
    expect(bm.currentBiome.name).toBe("Meadow");
  });

  it("returns interpolated palette during transition", () => {
    const bm = new BiomeManager();
    for (let i = 1; i <= 25; i++) bm.onPipePassed(i);
    expect(bm.isTransitioning).toBe(true);
    const palette = bm.getCurrentPalette();
    expect(palette.sky).toBeDefined();
  });

  it("resets correctly", () => {
    const bm = new BiomeManager();
    for (let i = 1; i <= 50; i++) bm.onPipePassed(i);
    bm.reset();
    expect(bm.biomeIndex).toBe(0);
    expect(bm.loopCount).toBe(0);
  });
});
