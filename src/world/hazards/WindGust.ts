import * as THREE from "three";

export class WindGust {
  readonly group = new THREE.Group();
  active = false;
  private windForce = 0;
  private windTimer = 0;
  private windDuration = 0;
  private windCooldown = 0;
  private lines: THREE.Line[] = [];

  constructor() {
    for (let i = 0; i < 10; i++) {
      const geo = new THREE.BufferGeometry();
      const positions = new Float32Array([0, 0, 0, 3, 0, 0]);
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
      });
      const line = new THREE.Line(geo, mat);
      line.visible = false;
      this.lines.push(line);
      this.group.add(line);
    }
  }

  update(delta: number, birdZ: number): number {
    if (!this.active) return 0;

    this.windCooldown -= delta;
    void this.windTimer;

    if (this.windCooldown <= 0 && this.windDuration <= 0) {
      this.windDuration = 1 + Math.random();
      this.windForce = (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 3);
      this.windCooldown = 5 + Math.random() * 5;

      this.lines.forEach((line) => {
        line.visible = true;
        line.position.set(
          (Math.random() - 0.5) * 10,
          1 + Math.random() * 8,
          birdZ - 5 - Math.random() * 20
        );
      });
    }

    if (this.windDuration > 0) {
      this.windDuration -= delta;
      this.lines.forEach((line) => {
        line.position.x += this.windForce * delta * 2;
      });
      if (this.windDuration <= 0) {
        this.lines.forEach((l) => (l.visible = false));
      }
      return this.windForce * delta;
    }

    return 0;
  }

  activate(): void {
    this.active = true;
    this.windCooldown = 3;
    this.windDuration = 0;
    this.windForce = 0;
    this.windTimer = 0;
  }

  deactivate(): void {
    this.active = false;
    this.lines.forEach((l) => (l.visible = false));
  }
}
