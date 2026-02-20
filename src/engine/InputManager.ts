export type InputAction = "flap" | "restart" | "mute";
type ActionCallback = () => void;

export class InputManager {
  private listeners = new Map<InputAction, ActionCallback[]>();
  private boundKeydown: ((e: KeyboardEvent) => void) | null = null;
  private boundPointerdown: ((e: PointerEvent) => void) | null = null;

  on(action: InputAction, callback: ActionCallback): void {
    if (!this.listeners.has(action)) this.listeners.set(action, []);
    this.listeners.get(action)!.push(callback);
  }

  trigger(action: InputAction): void {
    this.listeners.get(action)?.forEach((cb) => cb());
  }

  bind(): void {
    this.boundKeydown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        this.trigger("flap");
      }
      if (e.code === "KeyR") this.trigger("restart");
      if (e.code === "KeyM") this.trigger("mute");
    };

    this.boundPointerdown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("button") || target.closest("input") || target.closest("footer")) return;
      this.trigger("flap");
    };

    window.addEventListener("keydown", this.boundKeydown);
    window.addEventListener("pointerdown", this.boundPointerdown);
  }

  unbind(): void {
    if (this.boundKeydown) window.removeEventListener("keydown", this.boundKeydown);
    if (this.boundPointerdown) window.removeEventListener("pointerdown", this.boundPointerdown);
  }
}
