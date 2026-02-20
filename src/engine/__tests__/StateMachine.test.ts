import { describe, it, expect, vi } from "vitest";
import { StateMachine } from "../StateMachine";

describe("StateMachine", () => {
  it("starts in ready phase", () => {
    const sm = new StateMachine();
    expect(sm.phase).toBe("ready");
  });

  it("transitions ready → playing", () => {
    const sm = new StateMachine();
    sm.transition("playing");
    expect(sm.phase).toBe("playing");
  });

  it("transitions playing → dying → ended", () => {
    const sm = new StateMachine();
    sm.transition("playing");
    sm.transition("dying");
    expect(sm.phase).toBe("dying");
    sm.transition("ended");
    expect(sm.phase).toBe("ended");
  });

  it("transitions ended → ready (restart)", () => {
    const sm = new StateMachine();
    sm.transition("playing");
    sm.transition("dying");
    sm.transition("ended");
    sm.transition("ready");
    expect(sm.phase).toBe("ready");
  });

  it("rejects invalid transitions", () => {
    const sm = new StateMachine();
    expect(sm.transition("ended")).toBe(false);
    expect(sm.phase).toBe("ready");
  });

  it("fires callbacks on transition", () => {
    const sm = new StateMachine();
    const cb = vi.fn();
    sm.on("playing", cb);
    sm.transition("playing");
    expect(cb).toHaveBeenCalledWith("ready");
  });
});
