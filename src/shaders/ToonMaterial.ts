import * as THREE from "three";
import vertexShader from "./toon.vert.glsl";
import fragmentShader from "./toon.frag.glsl";

export class ToonMaterial extends THREE.ShaderMaterial {
  constructor(
    color: THREE.ColorRepresentation,
    options?: { transparent?: boolean; opacity?: number }
  ) {
    const c = new THREE.Color(color);
    super({
      vertexShader,
      fragmentShader,
      uniforms: {
        baseColor: { value: c },
        lightDirection: { value: new THREE.Vector3(0.5, 1, 0.3).normalize() },
        ambientStrength: { value: 0.3 },
      },
      transparent: options?.transparent ?? false,
    });
    if (options?.opacity !== undefined) {
      this.uniforms.opacity = { value: options.opacity };
    }
  }

  setColor(color: THREE.ColorRepresentation): void {
    (this.uniforms.baseColor.value as THREE.Color).set(color);
  }
}
