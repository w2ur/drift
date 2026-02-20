import * as THREE from "three";

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform float intensity;
uniform vec3 lineColor;
varying vec2 vUv;

void main() {
  vec2 center = vUv - 0.5;
  float angle = atan(center.y, center.x);
  float dist = length(center);

  // Radial lines — sharp lines at regular angular intervals
  float lines = step(0.97, fract(angle * 12.0 / 3.14159));

  // Only show lines toward edges (not center)
  float edgeFade = smoothstep(0.1, 0.4, dist);

  // Final alpha
  float alpha = lines * edgeFade * intensity * 0.3;

  gl_FragColor = vec4(lineColor, alpha);
}
`;

export class SpeedLines {
  readonly mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;

  constructor() {
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        intensity: { value: 0 },
        lineColor: { value: new THREE.Vector3(1, 1, 1) },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });

    const geo = new THREE.PlaneGeometry(2, 2);
    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 999;
  }

  update(speed: number): void {
    const t = Math.max(0, (speed - 18) / (22 - 18));
    this.material.uniforms.intensity.value = t;
  }

  setColor(r: number, g: number, b: number): void {
    this.material.uniforms.lineColor.value.set(r, g, b);
  }
}
