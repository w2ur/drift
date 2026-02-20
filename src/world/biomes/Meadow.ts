import * as THREE from "three";
import { BiomeConfig } from "./Biome";

export const MEADOW: BiomeConfig = {
  name: "Meadow",
  palette: {
    sky: new THREE.Color(0x87ceeb),
    fog: new THREE.Color(0x87ceeb),
    ground: new THREE.Color(0x4caf50),
    pipeMain: new THREE.Color(0x8b4513),
    pipeCap: new THREE.Color(0x654321),
    fogNear: 80,
    fogFar: 180,
  },
  pipesPerBiome: 25,
};
