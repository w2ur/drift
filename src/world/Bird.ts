import * as THREE from "three";

const GRAVITY = -16;
const FLAP_FORCE = 7;
const BIRD_RADIUS = 0.4;

export function getPathX(z: number): number {
  return 8 * Math.sin(z * 0.025) + 4 * Math.sin(z * 0.06 + 1.5);
}

interface TickResult {
  hitGround: boolean;
  hitCeiling: boolean;
}

export class BirdPhysics {
  y = 4;
  x = 0;
  z = 0;
  velocity = 0;
  radius = BIRD_RADIUS;

  flap(): void {
    this.velocity = FLAP_FORCE;
  }

  tick(delta: number, speed: number): TickResult {
    this.velocity += GRAVITY * delta;
    this.y += this.velocity * delta;
    this.z -= speed * delta;
    this.x = getPathX(this.z);

    if (this.y < this.radius) {
      return { hitGround: true, hitCeiling: false };
    }
    if (this.y > 12) {
      return { hitGround: false, hitCeiling: true };
    }
    return { hitGround: false, hitCeiling: false };
  }

  reset(): void {
    this.y = 4;
    this.x = 0;
    this.z = 0;
    this.velocity = 0;
    this.radius = BIRD_RADIUS;
  }
}

export class Bird {
  readonly group = new THREE.Group();
  readonly physics = new BirdPhysics();
  private body!: THREE.Mesh;
  private wingL!: THREE.Mesh;
  private wingR!: THREE.Mesh;
  private squashScale = new THREE.Vector3(1, 1, 1);
  private squashTarget = new THREE.Vector3(1, 1, 1);

  constructor() {
    this.buildMesh();
  }

  private buildMesh(): void {
    // Body — golden sphere
    const bodyGeo = new THREE.SphereGeometry(BIRD_RADIUS, 16, 12);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.4,
      metalness: 0.1,
    });
    this.body = new THREE.Mesh(bodyGeo, bodyMat);
    this.body.castShadow = true;
    this.group.add(this.body);

    // Eyes — white spheres
    const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.15, 0.1, -0.32);
    this.group.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.15, 0.1, -0.32);
    this.group.add(eyeR);

    // Pupils — black spheres
    const pupilGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const pupilL = new THREE.Mesh(pupilGeo, pupilMat);
    pupilL.position.set(-0.15, 0.1, -0.38);
    this.group.add(pupilL);

    const pupilR = new THREE.Mesh(pupilGeo, pupilMat);
    pupilR.position.set(0.15, 0.1, -0.38);
    this.group.add(pupilR);

    // Beak — orange cone
    const beakGeo = new THREE.ConeGeometry(0.08, 0.2, 8);
    const beakMat = new THREE.MeshStandardMaterial({ color: 0xff8c00 });
    const beak = new THREE.Mesh(beakGeo, beakMat);
    beak.rotation.x = -Math.PI / 2;
    beak.position.set(0, 0, -0.45);
    this.group.add(beak);

    // Wings — orange boxes
    const wingGeo = new THREE.BoxGeometry(0.35, 0.06, 0.2);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0xffa500 });

    this.wingL = new THREE.Mesh(wingGeo, wingMat);
    this.wingL.position.set(-0.38, 0, 0);
    this.wingL.castShadow = true;
    this.group.add(this.wingL);

    this.wingR = new THREE.Mesh(wingGeo, wingMat);
    this.wingR.position.set(0.38, 0, 0);
    this.wingR.castShadow = true;
    this.group.add(this.wingR);

    // Tail — orange box
    const tailGeo = new THREE.BoxGeometry(0.15, 0.08, 0.12);
    const tailMat = new THREE.MeshStandardMaterial({ color: 0xffa500 });
    const tail = new THREE.Mesh(tailGeo, tailMat);
    tail.position.set(0, 0, 0.35);
    this.group.add(tail);
  }

  update(delta: number, isPlaying: boolean, elapsed: number): void {
    this.group.position.set(this.physics.x, this.physics.y, this.physics.z);

    // Wing animation — sine wave
    const wingFreq = isPlaying ? 15 : 8;
    const wingAngle = Math.sin(elapsed * wingFreq) * 0.6;
    this.wingL.rotation.z = wingAngle;
    this.wingR.rotation.z = -wingAngle;

    // Pitch from velocity
    const pitch = THREE.MathUtils.clamp(this.physics.velocity * 0.07, -0.5, 0.5);
    this.group.rotation.x = pitch;

    // Yaw — look along path (look 2 units ahead on z)
    const lookAheadZ = this.physics.z - 2;
    const lookAheadX = getPathX(lookAheadZ);
    const dx = lookAheadX - this.physics.x;
    const yaw = Math.atan2(dx, -2);
    this.group.rotation.y = yaw;

    // Bank into turns
    this.group.rotation.z = -yaw * 0.4;

    // Squash and stretch — lerp toward rest
    this.squashScale.lerp(this.squashTarget, 0.15);
    this.body.scale.copy(this.squashScale);
  }

  triggerSquash(): void {
    this.squashScale.set(1.3, 0.7, 1.1);
    this.squashTarget.set(1, 1, 1);
  }
}
