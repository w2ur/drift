import * as THREE from "three";
import { isMobile } from "../utils/platform";

export class Environment {
  readonly group = new THREE.Group();
  private ground!: THREE.Mesh;
  private sky!: THREE.Mesh;
  private clouds: THREE.Group[] = [];

  constructor() {
    this.buildGround();
    this.buildSky();
    this.buildClouds();
  }

  private buildGround(): void {
    const geo = new THREE.PlaneGeometry(400, 400);
    const mat = new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.8 });
    this.ground = new THREE.Mesh(geo, mat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.group.add(this.ground);
  }

  private buildSky(): void {
    const geo = new THREE.SphereGeometry(250, 32, 16);
    const mat = new THREE.MeshBasicMaterial({ color: 0x87ceeb, side: THREE.BackSide });
    this.sky = new THREE.Mesh(geo, mat);
    this.group.add(this.sky);
  }

  private buildClouds(): void {
    const cloudCount = isMobile() ? 20 : 40;
    for (let i = 0; i < cloudCount; i++) {
      const cloud = this.createCloud();
      cloud.position.set(
        (Math.random() - 0.5) * 200,
        15 + Math.random() * 20,
        (Math.random() - 0.5) * 300
      );
      cloud.scale.setScalar(1 + Math.random() * 2);
      this.clouds.push(cloud);
      this.group.add(cloud);
    }
  }

  private createCloud(): THREE.Group {
    const cloud = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    const configs = [
      { size: 1, pos: [0, 0, 0] },
      { size: 0.8, pos: [0.8, 0.2, 0] },
      { size: 0.7, pos: [-0.7, 0.1, 0.3] },
      { size: 0.6, pos: [0.3, -0.1, -0.4] },
    ];
    for (const c of configs) {
      const geo = new THREE.SphereGeometry(c.size, 8, 6);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(c.pos[0], c.pos[1], c.pos[2]);
      cloud.add(mesh);
    }
    return cloud;
  }

  update(birdX: number, birdZ: number): void {
    this.ground.position.set(birdX, 0, birdZ);
    this.sky.position.set(birdX, 0, birdZ);
    // Clouds parallax — recycle clouds that are far behind
    for (const cloud of this.clouds) {
      if (cloud.position.z > birdZ + 100) {
        cloud.position.z -= 300;
      }
    }
  }

  setSkyColor(color: THREE.Color): void {
    (this.sky.material as THREE.MeshBasicMaterial).color.copy(color);
  }

  setGroundColor(color: THREE.Color): void {
    (this.ground.material as THREE.MeshStandardMaterial).color.copy(color);
  }
}
