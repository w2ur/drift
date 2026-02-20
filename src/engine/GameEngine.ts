import { StateMachine } from "./StateMachine";
import { Clock } from "./Clock";

export class GameEngine {
  readonly state = new StateMachine();
  readonly clock = new Clock();
  private animationId = 0;
  private lastTime = 0;
  private running = false;

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.loop();
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.animationId);
  }

  private loop = (): void => {
    if (!this.running) return;
    const now = performance.now();
    const rawDelta = (now - this.lastTime) / 1000;
    this.lastTime = now;
    this.clock.tick(rawDelta);
    this.update(this.clock.scaledDelta);
    this.animationId = requestAnimationFrame(this.loop);
  };

  private update(_delta: number): void {
    // Will be filled in by subsequent tasks
  }
}
