import * as THREE from "three";
import { getPathX } from "../world/Bird";

function noise2D(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return (n - Math.floor(n)) * 2 - 1;
}

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private smoothPos = new THREE.Vector3(0, 6, 8);
  private smoothLook = new THREE.Vector3(0, 4, -10);
  private shakeOffset = new THREE.Vector3();
  private shakeTime = 0;
  private shakeDuration = 0;
  private shakeIntensity = 0;
  private punchOffset = new THREE.Vector3();
  private dutchAngle = 0;
  private targetDutchAngle = 0;

  // Camera preset (close-left default)
  private behindDist = 6;
  private sideOffset = -3;
  private height = 1.8;
  private lookAheadZ = -10;
  private lookY = 0.2;

  // Zoom pulse for near-miss feedback
  private zoomOffset = 0;
  private targetZoomOffset = 0;

  // Boss mode — smoothly zoom out
  private targetBehindDist = 6;
  private targetHeight = 1.8;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
  }

  update(
    birdX: number,
    birdY: number,
    birdZ: number,
    isDying: boolean,
    delta: number,
    elapsed: number
  ): void {
    const lerpSpeed = isDying ? 0.03 : 0.12;

    // Boss mode smooth transition
    this.behindDist += (this.targetBehindDist - this.behindDist) * 0.05;
    this.height += (this.targetHeight - this.height) * 0.05;

    // Zoom pulse spring
    this.zoomOffset += (this.targetZoomOffset - this.zoomOffset) * 0.1;

    const behindZ = birdZ + (this.behindDist - this.zoomOffset);
    const behindX = getPathX(behindZ);

    const targetPos = new THREE.Vector3(
      behindX * 0.5 + birdX * 0.5 + this.sideOffset,
      birdY + this.height,
      behindZ
    );

    const lookZ = birdZ + this.lookAheadZ;
    const lookX = getPathX(lookZ);
    const targetLook = new THREE.Vector3(
      lookX * 0.7 + birdX * 0.3,
      birdY + this.lookY,
      lookZ
    );

    this.smoothPos.lerp(targetPos, lerpSpeed);
    this.smoothLook.lerp(targetLook, lerpSpeed);

    // Screen shake
    this.updateShake(delta, elapsed);

    // Punch decay
    this.punchOffset.multiplyScalar(0.9);

    // Dutch angle — tilt into turns
    const pathDx = getPathX(birdZ - 2) - birdX;
    this.targetDutchAngle = -Math.atan2(pathDx, 2) * 0.15;
    this.dutchAngle += (this.targetDutchAngle - this.dutchAngle) * 0.05;

    // Apply
    this.camera.position.copy(this.smoothPos).add(this.shakeOffset).add(this.punchOffset);
    this.camera.lookAt(this.smoothLook);
    this.camera.rotation.z = this.dutchAngle;
  }

  shake(intensity: number, duration: number): void {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTime = 0;
  }

  punch(direction: THREE.Vector3): void {
    this.punchOffset.copy(direction);
  }

  microBounce(): void {
    this.punchOffset.set(0, 0.02, 0);
  }

  zoomPulse(): void {
    this.zoomOffset = 1;
    this.targetZoomOffset = 0;
  }

  setBossMode(active: boolean): void {
    this.targetBehindDist = active ? 15 : 6;
    this.targetHeight = active ? 4 : 1.8;
  }

  private updateShake(delta: number, elapsed: number): void {
    if (this.shakeTime < this.shakeDuration) {
      this.shakeTime += delta;
      const t = 1 - this.shakeTime / this.shakeDuration;
      const intensity = this.shakeIntensity * t;
      this.shakeOffset.set(
        noise2D(elapsed * 50, 0) * intensity,
        noise2D(0, elapsed * 50) * intensity,
        noise2D(elapsed * 50, elapsed * 50) * intensity * 0.5
      );
    } else {
      this.shakeOffset.set(0, 0, 0);
    }
  }
}
