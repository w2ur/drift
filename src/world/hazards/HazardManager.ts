import * as THREE from "three";
import { WindGust } from "./WindGust";
import { Lightning } from "./Lightning";
import { LaserGate } from "./LaserGate";
import { RotatingRing } from "./RotatingRing";

export class HazardManager {
  readonly group = new THREE.Group();
  readonly wind = new WindGust();
  readonly lightning = new Lightning();
  readonly laser = new LaserGate();
  readonly ring = new RotatingRing();

  constructor() {
    this.group.add(this.wind.group);
    this.group.add(this.lightning.group);
    this.group.add(this.laser.group);
    this.group.add(this.ring.group);
  }

  setActiveBiome(hazard?: string): void {
    this.wind.deactivate();
    this.lightning.deactivate();
    this.laser.deactivate();
    this.ring.deactivate();

    switch (hazard) {
      case "wind":
        this.wind.activate();
        break;
      case "lightning":
        this.lightning.activate();
        break;
      case "laser":
        this.laser.activate();
        break;
      case "rings":
        this.ring.activate();
        break;
    }
  }

  reset(): void {
    this.wind.deactivate();
    this.lightning.deactivate();
    this.laser.deactivate();
    this.ring.deactivate();
  }
}
