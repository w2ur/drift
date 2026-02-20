import * as THREE from "three";
import { BiomeConfig } from "./Biome";

export const SUNSET_CANYON: BiomeConfig = {
  name: "Sunset Canyon",
  palette: {
    sky: new THREE.Color(0xff8c42),
    fog: new THREE.Color(0xff8c42),
    ground: new THREE.Color(0xc0392b),
    pipeMain: new THREE.Color(0xa0522d),
    pipeCap: new THREE.Color(0x8b4513),
    fogNear: 60,
    fogFar: 160,
  },
  pipesPerBiome: 25,
  hazard: "wind",
};
