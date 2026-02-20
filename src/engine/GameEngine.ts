import * as THREE from "three";
import { StateMachine } from "./StateMachine";
import { Clock } from "./Clock";
import { InputManager } from "./InputManager";
import { Renderer } from "../renderer/Renderer";
import { CameraController } from "../renderer/CameraController";
import { Bird } from "../world/Bird";
import { PipeManager } from "../world/PipeManager";
import { Environment } from "../world/Environment";

export class GameEngine {
  readonly state = new StateMachine();
  readonly clock = new Clock();
  readonly input = new InputManager();
  renderer!: Renderer;
  cameraController!: CameraController;
  bird!: Bird;
  pipeManager!: PipeManager;
  environment!: Environment;
  private animationId = 0;
  private lastTime = 0;
  private running = false;
  private score = 0;

  start(): void {
    if (this.running) return;
    this.running = true;
    const container = document.getElementById("game")!;
    this.renderer = new Renderer(container);
    this.cameraController = new CameraController(this.renderer.camera);
    this.bird = new Bird();
    this.renderer.scene.add(this.bird.group);
    this.environment = new Environment();
    this.renderer.scene.add(this.environment.group);
    this.pipeManager = new PipeManager();
    this.renderer.scene.add(this.pipeManager.group);
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
        this.cameraController.shake(0.5, 0.5);
        this.cameraController.punch(new THREE.Vector3(0, 0, 2));
      }

      const pipeResult = this.pipeManager.update(
        this.bird.physics.y,
        this.bird.physics.z,
        this.bird.physics.radius,
        this.score,
        this.clock.elapsed,
        delta
      );
      if (pipeResult.hitPipe) {
        this.state.transition("dying");
      }
      if (pipeResult.scored > 0) {
        this.score += pipeResult.scored;
      }
    }

    if (phase === "dying") {
      this.bird.physics.velocity += -16 * delta;
      this.bird.physics.y += this.bird.physics.velocity * delta;
    }

    if (phase === "playing" || phase === "dying") {
      this.environment.update(this.bird.physics.x, this.bird.physics.z);
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

    this.cameraController.update(
      this.bird.physics.x,
      this.bird.physics.y,
      this.bird.physics.z,
      this.state.phase === "dying",
      delta,
      this.clock.elapsed
    );

    this.renderer.render();
  }

  private handleFlap(): void {
    if (this.state.phase === "playing") {
      this.bird.physics.flap();
      this.bird.triggerSquash();
      this.cameraController.microBounce();
    } else if (this.state.phase === "ready") {
      this.state.transition("playing");
      this.pipeManager.spawn(8, -40, 0);
      this.bird.physics.velocity = 2;
      this.bird.physics.flap();
      this.bird.triggerSquash();
    }
  }

  private handleRestart(): void {
    if (this.state.phase === "ended") {
      this.pipeManager.reset();
      this.score = 0;
      this.state.reset();
    }
  }
}
