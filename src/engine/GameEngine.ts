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
import { LeaderboardManager } from "../game/LeaderboardManager";
import { UIManager } from "../ui/UIManager";
import { ParticleSystem } from "../vfx/ParticleSystem";
import { SpeedLines } from "../vfx/SpeedLines";
import { Afterimages } from "../vfx/Afterimages";
import { BossManager } from "../world/BossManager";
import { HazardManager } from "../world/hazards/HazardManager";
import { PowerUpManager } from "../world/PowerUpManager";
import { AudioManager } from "../audio/AudioManager";

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
  leaderboard!: LeaderboardManager;
  ui!: UIManager;
  particles!: ParticleSystem;
  speedLines!: SpeedLines;
  afterimages!: Afterimages;
  biomeManager!: BiomeManager;
  bossManager!: BossManager;
  hazards!: HazardManager;
  powerUps!: PowerUpManager;
  audio!: AudioManager;
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
    this.leaderboard = new LeaderboardManager();
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
    this.hazards = new HazardManager();
    this.renderer.scene.add(this.hazards.group);
    this.powerUps = new PowerUpManager();
    this.renderer.scene.add(this.powerUps.group);

    this.audio = new AudioManager();

    // Set initial biome on pipe manager
    const initialPalette = this.biomeManager.getCurrentPalette();
    this.pipeManager.setBiome(
      this.biomeManager.currentBiome.name,
      initialPalette.pipeMain,
      initialPalette.pipeCap
    );

    this.lastTime = performance.now();
    this.input.bind();
    this.input.on("flap", () => this.handleFlap());
    this.input.on("restart", () => this.handleRestart());
    this.input.on("mute", () => this.audio.toggleMute());

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
        if (this.powerUps.isGiant()) {
          // Giant smash: destroy the pipe and continue
          this.powerUps.useGiantSmash();
          this.bird.group.scale.setScalar(1);
          this.bird.physics.radius = 0.4;
          this.pipeManager.removePipeById(pipeResult.hitPipe.id);
          this.particles.emitDeathBurst(birdPos);
        } else if (this.powerUps.hasShield()) {
          // Shield absorbs the hit
          this.powerUps.useShield();
          this.audio.playShieldBreak();
          if (this.bossManager.active) {
            this.bossManager.onBossPipeHit();
          }
        } else {
          if (this.bossManager.active) {
            this.bossManager.onBossPipeHit();
          }
          this.particles.emitDeathBurst(birdPos);
          this.state.transition("dying");
          this.startDeathSequence();
        }
      }
      if (pipeResult.scored > 0) {
        const scoreToAdd = pipeResult.scored * this.powerUps.getScoreMultiplier();
        this.scoreManager.addScore(scoreToAdd);
        this.audio.playScore(this.scoreManager.combo);

        if (this.bossManager.active) {
          const bossResult = this.bossManager.onBossPipePassed();
          if (bossResult.complete) {
            this.cameraController.setBossMode(false);
            if (bossResult.cleanClear) {
              this.scoreManager.addScore(bossResult.bonus);
              this.ui.showBossCleared();
              this.audio.playBossClear();
            }
          }
        }

        this.ui.updateScore(this.scoreManager.score);

        const wasTransitioning = this.biomeManager.isTransitioning;
        const prevBiomeIndex = this.biomeManager.biomeIndex;
        this.biomeManager.onPipePassed(this.scoreManager.score);
        if (!wasTransitioning && this.biomeManager.isTransitioning) {
          this.bossManager.startBoss(this.biomeManager.biomeIndex);
          this.cameraController.setBossMode(true);
          this.audio.playBossEntry();
        }
        if (this.biomeManager.biomeIndex !== prevBiomeIndex) {
          this.hazards.setActiveBiome(this.biomeManager.currentBiome.hazard);
          this.audio.startBiomeMusic(this.biomeManager.currentBiome.name);
          const biomePalette = this.biomeManager.getCurrentPalette();
          this.pipeManager.setBiome(
            this.biomeManager.currentBiome.name,
            biomePalette.pipeMain,
            biomePalette.pipeCap
          );
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
        this.audio.playNearMiss(this.scoreManager.combo);
        this.particles.emitNearMissSparks(birdPos);
        this.ui.flashEdges();
        this.cameraController.zoomPulse();
      }

      // Bird trail — only at high speed
      if (currentSpeed > 16) {
        this.trailTimer += delta;
        const trailInterval = Math.max(0.01, 0.04 - (currentSpeed - 16) * 0.003);
        if (this.trailTimer > trailInterval) {
          this.particles.emitBirdTrail(birdPos);
          this.trailTimer = 0;
        }
      }

      // Speed effects
      this.speedLines.update(currentSpeed);
      this.afterimages.update(birdPos, this.bird.group.rotation, currentSpeed);

      // Hazards
      const windDisplacement = this.hazards.wind.update(delta, this.bird.physics.z);
      if (windDisplacement !== 0) {
        this.bird.physics.x += windDisplacement;
      }
      const lightningResult = this.hazards.lightning.update(
        delta,
        this.bird.physics.x,
        this.bird.physics.z
      );
      if (lightningResult.flash) {
        this.renderer.postProcessing?.setChromaticAberration(0.008);
      }
      const hitLaser = this.hazards.laser.update(
        delta,
        this.bird.physics.x,
        this.bird.physics.y,
        this.bird.physics.z,
        this.bird.physics.radius
      );
      if (hitLaser) {
        this.particles.emitDeathBurst(birdPos);
        this.state.transition("dying");
        this.startDeathSequence();
      }
      this.hazards.ring.update(delta, this.bird.physics.z);

      // Power-ups: update timers and animations
      this.powerUps.update(delta);
      this.powerUps.cleanupBehind(this.bird.physics.z);

      // Apply slow-mo time scale (only when no bullet-time or death freeze is active)
      if (this.bulletTimeTimer <= 0) {
        const slowmoScale = this.powerUps.getTimeScale();
        if (slowmoScale !== this.clock.timeScale) {
          this.clock.timeScale = slowmoScale;
        }
      }

      // Sync bird visual scale with giant power-up
      const targetScale = this.powerUps.getBirdScale();
      this.bird.group.scale.setScalar(targetScale);
      this.bird.physics.radius = 0.4 * targetScale;

      // Check power-up collection
      const collected = this.powerUps.checkCollection(birdPos, this.bird.physics.radius);
      if (collected) {
        this.audio.playPowerUpCollect();
      }

      // Spawn power-ups near upcoming pipes (ahead of the bird)
      if (pipeResult.scored > 0) {
        for (const pipe of this.pipeManager.pipes) {
          if (!pipe.passed && !pipe.hit && pipe.z < this.bird.physics.z - 15) {
            this.powerUps.spawnNearPipe(pipe.x, pipe.gapY, pipe.z);
            break; // only one spawn attempt per score
          }
        }
      }
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
        const score = this.scoreManager.score;
        const isNewBest = score >= this.scoreManager.bestScore;
        if (isNewBest) {
          this.audio.playHighScore();
        }
        this.ui.showGameOver(score, this.scoreManager.bestScore, isNewBest);

        const biomeName = this.biomeManager.currentBiome.name;
        const showLeaderboard = (): void => {
          this.ui.showLeaderboard(this.leaderboard.entries);
        };

        if (this.leaderboard.qualifies(score)) {
          this.ui.showPseudoInput((name: string) => {
            this.leaderboard.addEntry(name, score, biomeName);
            showLeaderboard();
          });
        } else {
          showLeaderboard();
        }
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
    this.audio.playDeath();
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
      this.audio.playFlap();
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
      this.audio.playFlap();
    }
  }

  private handleRestart(): void {
    if (this.state.phase === "ended") {
      this.bird.physics.reset();
      this.pipeManager.reset();
      this.scoreManager.reset();
      this.biomeManager.reset();
      this.bossManager.reset();
      this.hazards.reset();
      this.powerUps.reset();
      this.bird.group.scale.setScalar(1);
      this.cameraController.setBossMode(false);
      const defaultPalette = this.biomeManager.getCurrentPalette();
      this.pipeManager.setBiome(
        this.biomeManager.currentBiome.name,
        defaultPalette.pipeMain,
        defaultPalette.pipeCap
      );
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
      this.audio.stopMusic();
      this.ui.showStart(this.leaderboard.entries);
    }
  }
}
