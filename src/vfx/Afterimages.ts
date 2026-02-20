import * as THREE from "three";

export class Afterimages {
  readonly group = new THREE.Group();
  private ghosts: THREE.Mesh[] = [];
  private positions: THREE.Vector3[] = [];
  private maxGhosts = 4;

  constructor(
    birdGeometry: THREE.BufferGeometry,
    birdColor: THREE.ColorRepresentation
  ) {
    for (let i = 0; i < this.maxGhosts; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: birdColor,
        transparent: true,
        opacity: 0.3 - i * 0.07,
        depthWrite: false,
      });
      const ghost = new THREE.Mesh(birdGeometry.clone(), mat);
      ghost.visible = false;
      this.ghosts.push(ghost);
      this.positions.push(new THREE.Vector3());
      this.group.add(ghost);
    }
  }

  update(
    birdPosition: THREE.Vector3,
    birdRotation: THREE.Euler,
    speed: number
  ): void {
    const active = speed > 18;

    // Shift positions down the chain
    for (let i = this.maxGhosts - 1; i > 0; i--) {
      this.positions[i].copy(this.positions[i - 1]);
    }
    this.positions[0].copy(birdPosition);

    // Update ghosts
    for (let i = 0; i < this.maxGhosts; i++) {
      this.ghosts[i].visible = active && i > 0; // skip i=0 (same as bird)
      if (this.ghosts[i].visible) {
        this.ghosts[i].position.copy(this.positions[i]);
        this.ghosts[i].rotation.copy(birdRotation);
        const t = (speed - 18) / (22 - 18);
        (this.ghosts[i].material as THREE.MeshBasicMaterial).opacity =
          (0.3 - i * 0.07) * t;
      }
    }
  }
}
