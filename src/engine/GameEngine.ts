import * as THREE from "three";
import { StateMachine } from "./StateMachine";
import { Clock } from "./Clock";
import { InputManager } from "./InputManager";
import { Renderer } from "../renderer/Renderer";
import { CameraController } from "../renderer/CameraController";
import { Bird } from "../world/Bird";
import { PipeManager, getDifficulty } from "../world/PipeManager";
import { Environment } from "../world/Environment";
import { ScoreManager } from "../game/ScoreManager";
import { UIManager } from "../ui/UIManager";
import { ParticleSystem } from "../vfx/ParticleSystem";

export class GameEngine {
  readonly state = new StateMachine();
  readonly clock = new Clock();
  readonly input = new InputManager();
  renderer!: Renderer;
  cameraController!: CameraController;
  bird!: Bird;
  pipeManager!: PipeManager;
  environment!: Environment;
  scoreManager!: ScoreManager;
  ui!: UIManager;
  particles!: ParticleSystem;
  private animationId = 0;
  private lastTime = 0;
  private running = false;
  private dyingCaIntensity = 0;
  private trailTimer = 0;
  private bulletTimeTimer = 0;

  start(): void {
    if (this.running) return;
    this.running = true;
    const container = document.getElementById("game")!;
    this.renderer = new Renderer(container);
    this.renderer.initPostProcessing();
    this.cameraController = new CameraController(this.renderer.camera);
    this.bird = new Bird();
    this.renderer.scene.add(this.bird.group);
    this.environment = new Environment();
    this.renderer.scene.add(this.environment.group);
    this.pipeManager = new PipeManager();
    this.renderer.scene.add(this.pipeManager.group);
    this.scoreManager = new ScoreManager();
    this.ui = new UIManager();
    this.particles = new ParticleSystem();
    this.renderer.scene.add(this.particles.points);
    this.lastTime = performance.now();
    this.input.bind();
    this.input.on("flap", () => this.handleFlap());
    this.input.on("restart", () => this.handleRestart());

    this.state.on("ended", () => {
      const isNewBest = this.scoreManager.score >= this.scoreManager.bestScore;
      this.scoreManager.finalize();
      this.ui.showGameOver(
        this.scoreManager.score,
        this.scoreManager.bestScore,
        isNewBest
      );
    });

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
    const birdPos = new THREE.Vector3(
      this.bird.physics.x,
      this.bird.physics.y,
      this.bird.physics.z
    );

    // Bullet-time countdown using real (unscaled) delta
    if (this.bulletTimeTimer > 0) {
      this.bulletTimeTimer -= this.clock.delta;
      if (this.bulletTimeTimer <= 0) {
        this.clock.timeScale = 1.0;
      }
    }

    if (phase === "playing") {
      const difficulty = getDifficulty(this.scoreManager.score);
      const currentSpeed = difficulty.speed;
      const result = this.bird.physics.tick(delta, currentSpeed);
      if (result.hitGround || result.hitCeiling) {
        this.particles.emitDeathBurst(birdPos);
        this.state.transition("dying");
        this.cameraController.shake(0.5, 0.5);
        this.cameraController.punch(new THREE.Vector3(0, 0, 2));
        this.dyingCaIntensity = 0.01;
      }

      const caIntensity = Math.max(0, (currentSpeed - 15) * 0.001);
      this.renderer.postProcessing?.setChromaticAberration(caIntensity);

      const pipeResult = this.pipeManager.update(
        this.bird.physics.y,
        this.bird.physics.z,
        this.bird.physics.radius,
        this.scoreManager.score,
        this.clock.elapsed,
        delta
      );
      if (pipeResult.hitPipe) {
        this.particles.emitDeathBurst(birdPos);
        this.state.transition("dying");
        this.dyingCaIntensity = 0.01;
      }
      if (pipeResult.scored > 0) {
        this.scoreManager.addScore(pipeResult.scored);
        this.ui.updateScore(this.scoreManager.score);
      }
      if (pipeResult.nearMissPipes.length > 0) {
        this.clock.timeScale = 0.3;
        this.bulletTimeTimer = 0.2;
        this.scoreManager.registerNearMiss();
        this.ui.showCombo(this.scoreManager.combo);
        this.particles.emitNearMissSparks(birdPos);
        this.ui.flashEdges();
        this.cameraController.zoomPulse();
      }

      // Periodic bird trail
      this.trailTimer += delta;
      if (this.trailTimer > 0.02) {
        this.particles.emitBirdTrail(birdPos);
        this.trailTimer = 0;
      }
    }

    if (phase === "dying") {
      this.bird.physics.velocity += -16 * delta;
      this.bird.physics.y += this.bird.physics.velocity * delta;
      if (this.bird.physics.y <= 0) {
        this.state.transition("ended");
      }

      this.dyingCaIntensity *= 0.9;
      this.renderer.postProcessing?.setChromaticAberration(this.dyingCaIntensity);
    }

    if (phase === "playing" || phase === "dying") {
      this.environment.update(this.bird.physics.x, this.bird.physics.z);
    }

    this.particles.update(delta);
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
      this.particles.emitFlapFeathers(
        new THREE.Vector3(
          this.bird.physics.x,
          this.bird.physics.y,
          this.bird.physics.z
        )
      );
    } else if (this.state.phase === "ready") {
      this.state.transition("playing");
      this.ui.showPlaying();
      this.pipeManager.spawn(8, -40, 0);
      this.bird.physics.velocity = 2;
      this.bird.physics.flap();
      this.bird.triggerSquash();
    }
  }

  private handleRestart(): void {
    if (this.state.phase === "ended") {
      this.pipeManager.reset();
      this.scoreManager.reset();
      this.state.reset();
      this.ui.showStart();
    }
  }
}
