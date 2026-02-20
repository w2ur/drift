import * as THREE from "three";

export interface BiomePalette {
  sky: THREE.Color;
  fog: THREE.Color;
  ground: THREE.Color;
  pipeMain: THREE.Color;
  pipeCap: THREE.Color;
  fogNear: number;
  fogFar: number;
}

export interface BiomeConfig {
  name: string;
  palette: BiomePalette;
  pipesPerBiome: number;
  hazard?: string;
}
