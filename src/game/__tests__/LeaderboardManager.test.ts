// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import { LeaderboardManager } from "../LeaderboardManager";

describe("LeaderboardManager", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts with empty leaderboard", () => {
    const lb = new LeaderboardManager();
    expect(lb.entries).toHaveLength(0);
  });

  it("adds entry and sorts by score descending", () => {
    const lb = new LeaderboardManager();
    lb.addEntry("Alice", 50);
    lb.addEntry("Bob", 100);
    expect(lb.entries[0].name).toBe("Bob");
    expect(lb.entries[1].name).toBe("Alice");
  });

  it("keeps only top 10", () => {
    const lb = new LeaderboardManager();
    for (let i = 0; i < 12; i++) lb.addEntry(`P${i}`, i * 10);
    expect(lb.entries).toHaveLength(10);
    expect(lb.entries[0].score).toBe(110);
  });

  it("detects if score qualifies for leaderboard", () => {
    const lb = new LeaderboardManager();
    expect(lb.qualifies(1)).toBe(true);
    for (let i = 0; i < 10; i++) lb.addEntry(`P${i}`, 100);
    expect(lb.qualifies(50)).toBe(false);
    expect(lb.qualifies(101)).toBe(true);
  });

  it("persists to localStorage", () => {
    const lb1 = new LeaderboardManager();
    lb1.addEntry("Test", 42);
    const lb2 = new LeaderboardManager();
    expect(lb2.entries[0].name).toBe("Test");
    expect(lb2.entries[0].score).toBe(42);
  });
});
