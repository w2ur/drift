import * as THREE from "three";
import { BiomeConfig } from "./Biome";

export const STORM_SEA: BiomeConfig = {
  name: "Storm Sea",
  palette: {
    sky: new THREE.Color(0x2c3e50),
    fog: new THREE.Color(0x2c3e50),
    ground: new THREE.Color(0x008080),
    pipeMain: new THREE.Color(0x708090),
    pipeCap: new THREE.Color(0x556677),
    fogNear: 40,
    fogFar: 120,
  },
  pipesPerBiome: 25,
  hazard: "lightning",
};
