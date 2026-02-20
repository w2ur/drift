import * as THREE from "three";
import { StateMachine } from "./StateMachine";
import { Clock } from "./Clock";
import { InputManager } from "./InputManager";
import { Renderer } from "../renderer/Renderer";
import { CameraController } from "../renderer/CameraController";
import { Bird } from "../world/Bird";
import { PipeManager, getDifficulty } from "../world/PipeManager";
import { Environment } from "../world/Environment";
import { BiomeManager } from "../world/BiomeManager";
import { ScoreManager } from "../game/ScoreManager";
import { UIManager } from "../ui/UIManager";
import { ParticleSystem } from "../vfx/ParticleSystem";
import { SpeedLines } from "../vfx/SpeedLines";
import { Afterimages } from "../vfx/Afterimages";
import { BossManager } from "../world/BossManager";

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
  speedLines!: SpeedLines;
  afterimages!: Afterimages;
  biomeManager!: BiomeManager;
  bossManager!: BossManager;
  private animationId = 0;
  private lastTime = 0;
  private running = false;
  private dyingCaIntensity = 0;
  private trailTimer = 0;
  private bulletTimeTimer = 0;
  private freezeTimer = 0;
  private dyingTimer = 0;
  private deathUITimer = 0;
  private gameOverPending = false;

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

    this.speedLines = new SpeedLines();
    this.renderer.camera.add(this.speedLines.mesh);
    this.renderer.scene.add(this.renderer.camera);

    this.afterimages = new Afterimages(
      new THREE.SphereGeometry(0.4, 16, 12),
      0xffd700
    );
    this.renderer.scene.add(this.afterimages.group);

    this.biomeManager = new BiomeManager();
    this.bossManager = new BossManager();

    this.lastTime = performance.now();
    this.input.bind();
    this.input.on("flap", () => this.handleFlap());
    this.input.on("restart", () => this.handleRestart());

    this.state.on("ended", () => {
      this.scoreManager.finalize();
      // Game-over UI is shown after deathUITimer expires (see update loop)
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

    // Bullet-time countdown using real (unscaled) delta (only active during playing)
    if (this.bulletTimeTimer > 0 && phase === "playing") {
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
        this.startDeathSequence();
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
        if (this.bossManager.active) {
          this.bossManager.onBossPipeHit();
        }
        this.particles.emitDeathBurst(birdPos);
        this.state.transition("dying");
        this.startDeathSequence();
      }
      if (pipeResult.scored > 0) {
        this.scoreManager.addScore(pipeResult.scored);

        if (this.bossManager.active) {
          const bossResult = this.bossManager.onBossPipePassed();
          if (bossResult.complete) {
            this.cameraController.setBossMode(false);
            if (bossResult.cleanClear) {
              this.scoreManager.addScore(bossResult.bonus);
              this.ui.showBossCleared();
            }
          }
        }

        this.ui.updateScore(this.scoreManager.score);

        const wasTransitioning = this.biomeManager.isTransitioning;
        this.biomeManager.onPipePassed(this.scoreManager.score);
        if (!wasTransitioning && this.biomeManager.isTransitioning) {
          this.bossManager.startBoss(this.biomeManager.biomeIndex);
          this.cameraController.setBossMode(true);
        }

        const palette = this.biomeManager.getCurrentPalette();
        this.environment.setSkyColor(palette.sky);
        this.environment.setGroundColor(palette.ground);
        const fog = this.renderer.scene.fog as THREE.Fog;
        fog.color.copy(palette.fog);
        fog.near = palette.fogNear;
        fog.far = palette.fogFar;
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

      // Speed effects
      this.speedLines.update(currentSpeed);
      this.afterimages.update(birdPos, this.bird.group.rotation, currentSpeed);
    }

    if (phase === "dying") {
      const realDelta = this.clock.delta;

      // Freeze timer uses real (unscaled) delta
      if (this.freezeTimer > 0) {
        this.freezeTimer -= realDelta;
        if (this.freezeTimer <= 0) {
          this.clock.timeScale = 0.3;
        }
      }

      // Transition from slow-mo to normal after 0.8s
      this.dyingTimer += realDelta;
      if (this.dyingTimer > 0.8 && this.clock.timeScale < 1.0) {
        this.clock.timeScale = 1.0;
      }

      // Bird physics (uses scaled delta — paused during freeze, slow during slow-mo)
      this.bird.physics.velocity += -16 * delta;
      this.bird.physics.y += this.bird.physics.velocity * delta;
      if (this.bird.physics.y <= 0) {
        this.state.transition("ended");
      }

      // CA burst decays toward zero
      this.dyingCaIntensity *= 0.95;
      this.renderer.postProcessing?.setChromaticAberration(this.dyingCaIntensity);

      // Gradually desaturate and darken vignette
      const deathProgress = Math.min(this.dyingTimer / 1.5, 1.0);
      this.renderer.postProcessing?.setVignetteDarkness(0.4 + deathProgress * 0.45);
      this.renderer.postProcessing?.setSaturation(1.0 - deathProgress * 0.85);
    }

    // Delayed game-over UI after bird has fallen
    if (phase === "ended" && this.gameOverPending) {
      this.deathUITimer -= this.clock.delta;
      if (this.deathUITimer <= 0) {
        this.gameOverPending = false;
        const isNewBest =
          this.scoreManager.score >= this.scoreManager.bestScore;
        this.ui.showGameOver(
          this.scoreManager.score,
          this.scoreManager.bestScore,
          isNewBest
        );
      }
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

  private startDeathSequence(): void {
    this.clock.timeScale = 0;
    this.freezeTimer = 0.3;
    this.dyingTimer = 0;
    this.deathUITimer = 0.8;
    this.gameOverPending = true;
    this.dyingCaIntensity = 0.01;
    this.cameraController.shake(0.5, 0.5);
    this.cameraController.punch(new THREE.Vector3(0, 0, 2));
    this.renderer.postProcessing?.setChromaticAberration(0.01);
    this.speedLines.update(0);
    this.afterimages.update(
      new THREE.Vector3(this.bird.physics.x, this.bird.physics.y, this.bird.physics.z),
      this.bird.group.rotation,
      0
    );
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
      this.biomeManager.reset();
      this.bossManager.reset();
      this.cameraController.setBossMode(false);
      const defaultPalette = this.biomeManager.getCurrentPalette();
      this.environment.setSkyColor(defaultPalette.sky);
      this.environment.setGroundColor(defaultPalette.ground);
      const fog = this.renderer.scene.fog as THREE.Fog;
      fog.color.copy(defaultPalette.fog);
      fog.near = defaultPalette.fogNear;
      fog.far = defaultPalette.fogFar;
      this.state.reset();
      this.clock.timeScale = 1.0;
      this.freezeTimer = 0;
      this.dyingTimer = 0;
      this.deathUITimer = 0;
      this.gameOverPending = false;
      this.dyingCaIntensity = 0;
      this.renderer.postProcessing?.setVignetteDarkness(0.4);
      this.renderer.postProcessing?.setSaturation(1.0);
      this.renderer.postProcessing?.setChromaticAberration(0);
      this.speedLines.update(0);
      this.ui.showStart();
    }
  }
}
