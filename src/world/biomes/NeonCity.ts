import * as THREE from "three";
import { BiomeConfig } from "./Biome";

export const NEON_CITY: BiomeConfig = {
  name: "Neon City",
  palette: {
    sky: new THREE.Color(0x1a0a2e),
    fog: new THREE.Color(0x1a0a2e),
    ground: new THREE.Color(0x2d1b4e),
    pipeMain: new THREE.Color(0x00ffff),
    pipeCap: new THREE.Color(0xff1493),
    fogNear: 30,
    fogFar: 100,
  },
  pipesPerBiome: 25,
  hazard: "laser",
};
