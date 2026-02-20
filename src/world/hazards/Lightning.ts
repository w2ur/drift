import * as THREE from "three";

export class Lightning {
  readonly group = new THREE.Group();
  active = false;
  private flashTimer = 0;
  private flashCooldown = 0;
  private isFlashing = false;
  private bolt: THREE.Line | null = null;

  constructor() {
    this.createBolt();
  }

  private createBolt(): void {
    if (this.bolt) {
      this.group.remove(this.bolt);
      this.bolt.geometry.dispose();
    }

    const points: THREE.Vector3[] = [];
    let y = 20;
    while (y > 0) {
      points.push(new THREE.Vector3((Math.random() - 0.5) * 2, y, 0));
      y -= 1 + Math.random() * 2;
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 });
    this.bolt = new THREE.Line(geo, mat);
    this.bolt.visible = false;
    this.group.add(this.bolt);
  }

  update(delta: number, birdX: number, birdZ: number): { flash: boolean } {
    if (!this.active) return { flash: false };

    this.flashCooldown -= delta;
    let flash = false;

    if (this.flashCooldown <= 0 && !this.isFlashing) {
      this.isFlashing = true;
      this.flashTimer = 0.15;
      flash = true;

      if (this.bolt) {
        this.bolt.visible = true;
        this.bolt.position.set(
          birdX + (Math.random() - 0.5) * 10,
          0,
          birdZ - 5 - Math.random() * 10
        );
        this.createBolt();
      }
      this.flashCooldown = 4 + Math.random() * 4;
    }

    if (this.isFlashing) {
      this.flashTimer -= delta;
      if (this.flashTimer <= 0) {
        this.isFlashing = false;
        if (this.bolt) this.bolt.visible = false;
      }
    }

    return { flash };
  }

  activate(): void {
    this.active = true;
    this.flashCooldown = 2;
    this.isFlashing = false;
    this.flashTimer = 0;
  }

  deactivate(): void {
    this.active = false;
    if (this.bolt) this.bolt.visible = false;
    this.isFlashing = false;
  }
}
