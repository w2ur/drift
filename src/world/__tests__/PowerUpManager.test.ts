import { describe, it, expect } from "vitest";
import { PowerUpManager } from "../PowerUpManager";

describe("PowerUpManager", () => {
  it("has no active power-ups initially", () => {
    const pm = new PowerUpManager();
    expect(pm.hasShield()).toBe(false);
    expect(pm.isGiant()).toBe(false);
    expect(pm.getTimeScale()).toBe(1);
    expect(pm.getScoreMultiplier()).toBe(1);
  });

  it("shield absorbs one hit", () => {
    const pm = new PowerUpManager();
    pm.activate("shield");
    expect(pm.hasShield()).toBe(true);
    pm.useShield();
    expect(pm.hasShield()).toBe(false);
  });

  it("slow-mo sets time scale to 0.5", () => {
    const pm = new PowerUpManager();
    pm.activate("slowmo");
    expect(pm.getTimeScale()).toBe(0.5);
  });

  it("giant gives bird scale 2 and one smash", () => {
    const pm = new PowerUpManager();
    pm.activate("giant");
    expect(pm.isGiant()).toBe(true);
    expect(pm.getBirdScale()).toBe(2);
    pm.useGiantSmash();
    expect(pm.isGiant()).toBe(false);
    expect(pm.getBirdScale()).toBe(1);
  });

  it("score x2 doubles score multiplier", () => {
    const pm = new PowerUpManager();
    pm.activate("scorex2");
    expect(pm.getScoreMultiplier()).toBe(2);
  });

  it("timed power-ups expire", () => {
    const pm = new PowerUpManager();
    pm.activate("slowmo");
    pm.update(6); // 6 seconds > 5 second duration
    expect(pm.getTimeScale()).toBe(1);
  });

  it("shield does not expire by time", () => {
    const pm = new PowerUpManager();
    pm.activate("shield");
    pm.update(100);
    expect(pm.hasShield()).toBe(true);
  });

  it("reset clears all power-ups", () => {
    const pm = new PowerUpManager();
    pm.activate("shield");
    pm.activate("slowmo");
    pm.reset();
    expect(pm.hasShield()).toBe(false);
    expect(pm.getTimeScale()).toBe(1);
  });
});
