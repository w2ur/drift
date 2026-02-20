import { describe, it, expect } from "vitest";
import { BirdPhysics } from "../Bird";

describe("BirdPhysics", () => {
  it("starts at initial position", () => {
    const bird = new BirdPhysics();
    expect(bird.y).toBe(4);
    expect(bird.z).toBe(0);
    expect(bird.velocity).toBe(0);
  });

  it("applies gravity each tick", () => {
    const bird = new BirdPhysics();
    bird.velocity = 0;
    bird.tick(0.016, 13);
    expect(bird.velocity).toBeLessThan(0);
    expect(bird.y).toBeLessThan(4);
  });

  it("flap sets upward velocity", () => {
    const bird = new BirdPhysics();
    bird.flap();
    expect(bird.velocity).toBe(7);
  });

  it("moves forward along z axis", () => {
    const bird = new BirdPhysics();
    bird.tick(0.016, 13);
    expect(bird.z).toBeLessThan(0);
  });

  it("follows winding path on x axis", () => {
    const bird = new BirdPhysics();
    bird.tick(1, 13);
    expect(bird.x).not.toBe(0);
  });

  it("detects ground collision", () => {
    const bird = new BirdPhysics();
    bird.y = 0.3;
    bird.velocity = -5;
    const result = bird.tick(0.1, 13);
    expect(result.hitGround).toBe(true);
  });

  it("detects ceiling collision", () => {
    const bird = new BirdPhysics();
    bird.y = 12.1;
    const result = bird.tick(0.016, 13);
    expect(result.hitCeiling).toBe(true);
  });
});
