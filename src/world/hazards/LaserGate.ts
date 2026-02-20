import * as THREE from "three";

interface LaserEntry {
  mesh: THREE.Mesh;
  y: number;
  speed: number;
  pipeZ: number;
}

export class LaserGate {
  readonly group = new THREE.Group();
  active = false;
  private lasers: LaserEntry[] = [];

  spawnLaser(pipeZ: number, pipeX: number, gapY: number): void {
    if (!this.active) return;
    if (Math.random() > 0.4) return;

    const geo = new THREE.BoxGeometry(4, 0.1, 0.1);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.8,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pipeX, gapY, pipeZ);
    this.group.add(mesh);
    this.lasers.push({
      mesh,
      y: gapY,
      speed: 0.5 + Math.random() * 1.5,
      pipeZ,
    });
  }

  update(
    delta: number,
    birdX: number,
    birdY: number,
    birdZ: number,
    birdRadius: number
  ): boolean {
    if (!this.active) return false;

    void delta;
    void birdX;

    let hitLaser = false;

    for (const laser of this.lasers) {
      laser.y += Math.sin(Date.now() * 0.001 * laser.speed) * delta * 2;
      laser.mesh.position.y = laser.y;

      const dz = Math.abs(birdZ - laser.pipeZ);
      if (dz < 0.5) {
        const dy = Math.abs(birdY - laser.y);
        if (dy < birdRadius + 0.05) {
          hitLaser = true;
        }
      }
    }

    this.lasers = this.lasers.filter((l) => {
      if (l.mesh.position.z > birdZ + 20) {
        this.group.remove(l.mesh);
        return false;
      }
      return true;
    });

    return hitLaser;
  }

  activate(): void {
    this.active = true;
  }

  deactivate(): void {
    this.active = false;
    this.lasers.forEach((l) => this.group.remove(l.mesh));
    this.lasers = [];
  }
}
