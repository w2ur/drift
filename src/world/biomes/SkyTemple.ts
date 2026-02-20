import * as THREE from "three";
import { BiomeConfig } from "./Biome";

export const SKY_TEMPLE: BiomeConfig = {
  name: "Sky Temple",
  palette: {
    sky: new THREE.Color(0xf0e6d3),
    fog: new THREE.Color(0xf0e6d3),
    ground: new THREE.Color(0xf5f5f5),
    pipeMain: new THREE.Color(0xf5f5f5),
    pipeCap: new THREE.Color(0xffd700),
    fogNear: 50,
    fogFar: 140,
  },
  pipesPerBiome: 25,
  hazard: "rings",
};
