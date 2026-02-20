import * as THREE from "three";
import { PostProcessing } from "./PostProcessing";

export class Renderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  private _postProcessing?: PostProcessing;

  constructor(container: HTMLElement) {
    // WebGL renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    container.appendChild(this.renderer.domElement);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x87ceeb, 80, 180);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      500
    );
    this.camera.position.set(0, 6, 8);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(8, 20, 0);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    dirLight.shadow.bias = -0.001;
    dirLight.shadow.camera.left = -15;
    dirLight.shadow.camera.right = 15;
    dirLight.shadow.camera.top = 15;
    dirLight.shadow.camera.bottom = -15;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 40;
    this.scene.add(dirLight);
    this.scene.add(dirLight.target);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 10, -10);
    this.scene.add(fillLight);

    // Handle resize
    window.addEventListener("resize", () => this.onResize(container));
  }

  initPostProcessing(): void {
    this._postProcessing = new PostProcessing(
      this.renderer,
      this.scene,
      this.camera
    );
  }

  get postProcessing(): PostProcessing | undefined {
    return this._postProcessing;
  }

  private onResize(container: HTMLElement): void {
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this._postProcessing?.setSize(container.clientWidth, container.clientHeight);
  }

  render(): void {
    if (this._postProcessing) {
      this._postProcessing.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  get directionalLight(): THREE.DirectionalLight {
    return this.scene.children.find(
      (c) => c instanceof THREE.DirectionalLight && c.castShadow
    ) as THREE.DirectionalLight;
  }
}
