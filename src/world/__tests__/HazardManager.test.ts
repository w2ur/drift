import { describe, it, expect, beforeEach } from "vitest";
import { WindGust } from "../hazards/WindGust";
import { Lightning } from "../hazards/Lightning";
import { LaserGate } from "../hazards/LaserGate";
import { RotatingRing } from "../hazards/RotatingRing";
import { HazardManager } from "../hazards/HazardManager";

describe("WindGust", () => {
  it("starts inactive", () => {
    const wind = new WindGust();
    expect(wind.active).toBe(false);
  });

  it("returns 0 displacement when inactive", () => {
    const wind = new WindGust();
    const displacement = wind.update(0.016, 0);
    expect(displacement).toBe(0);
  });

  it("activates and deactivates correctly", () => {
    const wind = new WindGust();
    wind.activate();
    expect(wind.active).toBe(true);
    wind.deactivate();
    expect(wind.active).toBe(false);
  });

  it("returns 0 displacement immediately after activate (cooldown period)", () => {
    const wind = new WindGust();
    wind.activate();
    // Initial cooldown is 3s, so a small delta should not trigger a gust
    const displacement = wind.update(0.016, 0);
    expect(displacement).toBe(0);
  });
});

describe("Lightning", () => {
  it("starts inactive", () => {
    const lightning = new Lightning();
    expect(lightning.active).toBe(false);
  });

  it("returns no flash when inactive", () => {
    const lightning = new Lightning();
    const result = lightning.update(0.016, 0, 0);
    expect(result.flash).toBe(false);
  });

  it("activates and deactivates correctly", () => {
    const lightning = new Lightning();
    lightning.activate();
    expect(lightning.active).toBe(true);
    lightning.deactivate();
    expect(lightning.active).toBe(false);
  });

  it("returns no flash immediately after activate (cooldown period)", () => {
    const lightning = new Lightning();
    lightning.activate();
    // Initial cooldown is 2s, so a small delta should not trigger a flash
    const result = lightning.update(0.016, 0, 0);
    expect(result.flash).toBe(false);
  });
});

describe("LaserGate", () => {
  it("starts inactive", () => {
    const laser = new LaserGate();
    expect(laser.active).toBe(false);
  });

  it("returns false collision when inactive", () => {
    const laser = new LaserGate();
    const hit = laser.update(0.016, 0, 4, 0, 0.4);
    expect(hit).toBe(false);
  });

  it("activates and deactivates correctly", () => {
    const laser = new LaserGate();
    laser.activate();
    expect(laser.active).toBe(true);
    laser.deactivate();
    expect(laser.active).toBe(false);
  });

  it("does not spawn laser when inactive", () => {
    const laser = new LaserGate();
    const initialChildren = laser.group.children.length;
    laser.spawnLaser(-40, 0, 4);
    expect(laser.group.children.length).toBe(initialChildren);
  });

  it("deactivate clears all lasers from group", () => {
    const laser = new LaserGate();
    laser.activate();
    // Force spawn several lasers by bypassing random check
    for (let i = 0; i < 20; i++) {
      laser.spawnLaser(-40 - i, 0, 4);
    }
    laser.deactivate();
    expect(laser.group.children.length).toBe(0);
  });
});

describe("RotatingRing", () => {
  it("starts inactive", () => {
    const ring = new RotatingRing();
    expect(ring.active).toBe(false);
  });

  it("activates and deactivates correctly", () => {
    const ring = new RotatingRing();
    ring.activate();
    expect(ring.active).toBe(true);
    ring.deactivate();
    expect(ring.active).toBe(false);
  });

  it("does not spawn ring when inactive", () => {
    const ring = new RotatingRing();
    const initialChildren = ring.group.children.length;
    ring.spawnRing(-40, 0, 4);
    expect(ring.group.children.length).toBe(initialChildren);
  });

  it("deactivate clears all rings from group", () => {
    const ring = new RotatingRing();
    ring.activate();
    for (let i = 0; i < 20; i++) {
      ring.spawnRing(-40 - i, 0, 4);
    }
    ring.deactivate();
    expect(ring.group.children.length).toBe(0);
  });

  it("update does nothing when inactive", () => {
    const ring = new RotatingRing();
    // Should not throw
    expect(() => ring.update(0.016, 0)).not.toThrow();
  });
});

describe("HazardManager", () => {
  let manager: HazardManager;

  beforeEach(() => {
    manager = new HazardManager();
  });

  it("starts with all hazards inactive", () => {
    expect(manager.wind.active).toBe(false);
    expect(manager.lightning.active).toBe(false);
    expect(manager.laser.active).toBe(false);
    expect(manager.ring.active).toBe(false);
  });

  it("activates wind hazard for wind biome", () => {
    manager.setActiveBiome("wind");
    expect(manager.wind.active).toBe(true);
    expect(manager.lightning.active).toBe(false);
    expect(manager.laser.active).toBe(false);
    expect(manager.ring.active).toBe(false);
  });

  it("activates lightning hazard for lightning biome", () => {
    manager.setActiveBiome("lightning");
    expect(manager.lightning.active).toBe(true);
    expect(manager.wind.active).toBe(false);
    expect(manager.laser.active).toBe(false);
    expect(manager.ring.active).toBe(false);
  });

  it("activates laser hazard for laser biome", () => {
    manager.setActiveBiome("laser");
    expect(manager.laser.active).toBe(true);
    expect(manager.wind.active).toBe(false);
    expect(manager.lightning.active).toBe(false);
    expect(manager.ring.active).toBe(false);
  });

  it("activates ring hazard for rings biome", () => {
    manager.setActiveBiome("rings");
    expect(manager.ring.active).toBe(true);
    expect(manager.wind.active).toBe(false);
    expect(manager.lightning.active).toBe(false);
    expect(manager.laser.active).toBe(false);
  });

  it("deactivates all hazards when no hazard specified (Meadow)", () => {
    manager.setActiveBiome("wind");
    manager.setActiveBiome(undefined);
    expect(manager.wind.active).toBe(false);
    expect(manager.lightning.active).toBe(false);
    expect(manager.laser.active).toBe(false);
    expect(manager.ring.active).toBe(false);
  });

  it("switches active hazard when biome changes", () => {
    manager.setActiveBiome("wind");
    expect(manager.wind.active).toBe(true);
    manager.setActiveBiome("lightning");
    expect(manager.wind.active).toBe(false);
    expect(manager.lightning.active).toBe(true);
  });

  it("reset deactivates all hazards", () => {
    manager.setActiveBiome("laser");
    manager.reset();
    expect(manager.laser.active).toBe(false);
  });

  it("group contains all hazard sub-groups", () => {
    expect(manager.group.children).toContain(manager.wind.group);
    expect(manager.group.children).toContain(manager.lightning.group);
    expect(manager.group.children).toContain(manager.laser.group);
    expect(manager.group.children).toContain(manager.ring.group);
  });
});
