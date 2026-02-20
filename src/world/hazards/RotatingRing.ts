import * as THREE from "three";

interface RingEntry {
  mesh: THREE.Mesh;
  z: number;
  rotationSpeed: number;
}

export class RotatingRing {
  readonly group = new THREE.Group();
  active = false;
  private rings: RingEntry[] = [];

  spawnRing(pipeZ: number, pipeX: number, gapY: number): void {
    if (!this.active) return;
    if (Math.random() > 0.3) return;

    const geo = new THREE.TorusGeometry(1.5, 0.15, 8, 24);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.6,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pipeX, gapY, pipeZ);
    mesh.rotation.x = Math.PI / 2;
    this.group.add(mesh);
    this.rings.push({
      mesh,
      z: pipeZ,
      rotationSpeed: 1 + Math.random() * 2,
    });
  }

  update(delta: number, birdZ: number): void {
    if (!this.active) return;

    for (const ring of this.rings) {
      ring.mesh.rotation.z += ring.rotationSpeed * delta;
    }

    this.rings = this.rings.filter((r) => {
      if (r.z > birdZ + 20) {
        this.group.remove(r.mesh);
        return false;
      }
      return true;
    });
  }

  activate(): void {
    this.active = true;
  }

  deactivate(): void {
    this.active = false;
    this.rings.forEach((r) => this.group.remove(r.mesh));
    this.rings = [];
  }
}
