import { StateMachine } from "./StateMachine";
import { Clock } from "./Clock";
import { InputManager } from "./InputManager";
import { Renderer } from "../renderer/Renderer";
import { Bird } from "../world/Bird";

export class GameEngine {
  readonly state = new StateMachine();
  readonly clock = new Clock();
  readonly input = new InputManager();
  renderer!: Renderer;
  bird!: Bird;
  private animationId = 0;
  private lastTime = 0;
  private running = false;

  start(): void {
    if (this.running) return;
    this.running = true;
    const container = document.getElementById("game")!;
    this.renderer = new Renderer(container);
    this.bird = new Bird();
    this.renderer.scene.add(this.bird.group);
    this.lastTime = performance.now();
    this.input.bind();
    this.input.on("flap", () => this.handleFlap());
    this.input.on("restart", () => this.handleRestart());
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

  private update(delta: number): void {
    const phase = this.state.phase;

    if (phase === "playing") {
      const result = this.bird.physics.tick(delta, 13);
      if (result.hitGround || result.hitCeiling) {
        this.state.transition("dying");
      }
    }

    if (phase === "dying") {
      this.bird.physics.velocity += -16 * delta;
      this.bird.physics.y += this.bird.physics.velocity * delta;
    }

    this.bird.update(delta, this.state.phase === "playing", this.clock.elapsed);

    const light = this.renderer.directionalLight;
    light.position.set(
      this.bird.physics.x + 8,
      this.bird.physics.y + 15,
      this.bird.physics.z - 5
    );
    light.target.position.set(
      this.bird.physics.x,
      this.bird.physics.y,
      this.bird.physics.z
    );
    light.target.updateMatrixWorld();

    this.renderer.render();
  }

  private handleFlap(): void {
    if (this.state.phase === "playing") {
      this.bird.physics.flap();
      this.bird.triggerSquash();
    } else if (this.state.phase === "ready") {
      this.state.transition("playing");
      this.bird.physics.velocity = 2;
      this.bird.physics.flap();
      this.bird.triggerSquash();
    }
  }

  private handleRestart(): void {
    if (this.state.phase === "ended") {
      this.state.reset();
    }
  }
}
