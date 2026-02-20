import * as THREE from "three";
import {
  EffectComposer,
  EffectPass,
  RenderPass,
  BloomEffect,
  ChromaticAberrationEffect,
  VignetteEffect,
  BlendFunction,
} from "postprocessing";

export class PostProcessing {
  private composer: EffectComposer;
  private chromaticAberration: ChromaticAberrationEffect;
  private bloom: BloomEffect;
  private vignette: VignetteEffect;
  private caOffset = new THREE.Vector2(0, 0);

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ) {
    this.composer = new EffectComposer(renderer);

    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);

    this.bloom = new BloomEffect({
      blendFunction: BlendFunction.ADD,
      luminanceThreshold: 0.8,
      luminanceSmoothing: 0.3,
      intensity: 0.5,
    });

    this.chromaticAberration = new ChromaticAberrationEffect({
      offset: this.caOffset,
      radialModulation: false,
      modulationOffset: 0.15,
    });

    this.vignette = new VignetteEffect({
      darkness: 0.4,
      offset: 0.3,
    });

    const effectPass = new EffectPass(
      camera,
      this.bloom,
      this.chromaticAberration,
      this.vignette
    );
    this.composer.addPass(effectPass);
  }

  render(): void {
    this.composer.render();
  }

  setSize(width: number, height: number): void {
    this.composer.setSize(width, height);
  }

  setChromaticAberration(intensity: number): void {
    this.caOffset.set(intensity, intensity);
    this.chromaticAberration.offset = this.caOffset;
  }

  setBloomIntensity(intensity: number): void {
    this.bloom.intensity = intensity;
  }

  setVignetteDarkness(darkness: number): void {
    this.vignette.darkness = darkness;
  }
}
