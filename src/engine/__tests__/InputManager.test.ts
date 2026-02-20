import { describe, it, expect, vi } from "vitest";
import { InputManager } from "../InputManager";

describe("InputManager", () => {
  it("fires flap callback on registered action", () => {
    const im = new InputManager();
    const cb = vi.fn();
    im.on("flap", cb);
    im.trigger("flap");
    expect(cb).toHaveBeenCalledOnce();
  });

  it("fires restart callback", () => {
    const im = new InputManager();
    const cb = vi.fn();
    im.on("restart", cb);
    im.trigger("restart");
    expect(cb).toHaveBeenCalledOnce();
  });

  it("fires mute callback", () => {
    const im = new InputManager();
    const cb = vi.fn();
    im.on("mute", cb);
    im.trigger("mute");
    expect(cb).toHaveBeenCalledOnce();
  });
});
