import * as THREE from "three";
import { BiomeConfig, BiomePalette } from "./biomes/Biome";
import { MEADOW } from "./biomes/Meadow";
import { SUNSET_CANYON } from "./biomes/SunsetCanyon";
import { STORM_SEA } from "./biomes/StormSea";
import { NEON_CITY } from "./biomes/NeonCity";
import { SKY_TEMPLE } from "./biomes/SkyTemple";

const BIOMES: BiomeConfig[] = [MEADOW, SUNSET_CANYON, STORM_SEA, NEON_CITY, SKY_TEMPLE];
const TRANSITION_PIPES = 5;

export class BiomeManager {
  biomeIndex = 0;
  loopCount = 0;
  isTransitioning = false;
  private pipesSinceLastTransition = 0;
  private transitionProgress = 0;

  get currentBiome(): BiomeConfig {
    return BIOMES[this.biomeIndex];
  }

  get nextBiome(): BiomeConfig {
    return BIOMES[(this.biomeIndex + 1) % BIOMES.length];
  }

  onPipePassed(totalPipes: number): void {
    this.pipesSinceLastTransition++;

    if (
      this.pipesSinceLastTransition >= this.currentBiome.pipesPerBiome &&
      !this.isTransitioning
    ) {
      this.isTransitioning = true;
      this.transitionProgress = 0;
    }

    if (this.isTransitioning) {
      this.transitionProgress++;
      if (this.transitionProgress >= TRANSITION_PIPES) {
        this.biomeIndex = (this.biomeIndex + 1) % BIOMES.length;
        if (this.biomeIndex === 0) this.loopCount++;
        this.isTransitioning = false;
        this.pipesSinceLastTransition = 0;
        this.transitionProgress = 0;
      }
    }
  }

  getCurrentPalette(_t?: number): BiomePalette {
    if (!this.isTransitioning) return this.currentBiome.palette;

    const progress = this.transitionProgress / TRANSITION_PIPES;
    const current = this.currentBiome.palette;
    const next = this.nextBiome.palette;

    return {
      sky: new THREE.Color().lerpColors(current.sky, next.sky, progress),
      fog: new THREE.Color().lerpColors(current.fog, next.fog, progress),
      ground: new THREE.Color().lerpColors(current.ground, next.ground, progress),
      pipeMain: new THREE.Color().lerpColors(current.pipeMain, next.pipeMain, progress),
      pipeCap: new THREE.Color().lerpColors(current.pipeCap, next.pipeCap, progress),
      fogNear: current.fogNear + (next.fogNear - current.fogNear) * progress,
      fogFar: current.fogFar + (next.fogFar - current.fogFar) * progress,
    };
  }

  reset(): void {
    this.biomeIndex = 0;
    this.loopCount = 0;
    this.isTransitioning = false;
    this.pipesSinceLastTransition = 0;
    this.transitionProgress = 0;
  }
}
