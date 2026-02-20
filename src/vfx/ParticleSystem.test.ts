import { describe, it, expect, vi, beforeEach } from "vitest";
import * as THREE from "three";

// Mock GLSL shader imports
vi.mock("../shaders/particle.vert.glsl", () => ({ default: "" }));
vi.mock("../shaders/particle.frag.glsl", () => ({ default: "" }));

import { ParticleSystem } from "./ParticleSystem";

describe("ParticleSystem", () => {
  let ps: ParticleSystem;

  beforeEach(() => {
    ps = new ParticleSystem(100);
  });

  it("creates a Points object added to scene", () => {
    expect(ps.points).toBeInstanceOf(THREE.Points);
  });

  it("starts with all particles inactive (sizes all zero)", () => {
    const geo = ps.points.geometry as THREE.BufferGeometry;
    const sizes = geo.attributes.aSize as THREE.BufferAttribute;
    for (let i = 0; i < 100; i++) {
      expect(sizes.array[i]).toBe(0);
    }
  });

  it("activates particles when emit is called", () => {
    const pos = new THREE.Vector3(1, 2, 3);
    ps.emit({
      position: pos,
      color: new THREE.Color(0xff0000),
      count: 5,
      life: 1.0,
      size: 4,
    });
    // Update to push data to buffers
    ps.update(0.016);
    const geo = ps.points.geometry as THREE.BufferGeometry;
    const sizes = geo.attributes.aSize as THREE.BufferAttribute;
    let activeCount = 0;
    for (let i = 0; i < 100; i++) {
      if ((sizes.array as Float32Array)[i] > 0) activeCount++;
    }
    expect(activeCount).toBe(5);
  });

  it("deactivates particles after their lifetime expires", () => {
    ps.emit({
      position: new THREE.Vector3(0, 0, 0),
      color: new THREE.Color(0xffffff),
      count: 3,
      life: 0.1,
      size: 4,
    });
    // Advance past lifetime
    ps.update(0.2);
    const geo = ps.points.geometry as THREE.BufferGeometry;
    const sizes = geo.attributes.aSize as THREE.BufferAttribute;
    let activeCount = 0;
    for (let i = 0; i < 100; i++) {
      if ((sizes.array as Float32Array)[i] > 0) activeCount++;
    }
    expect(activeCount).toBe(0);
  });

  it("does not exceed the requested count when emitting", () => {
    ps.emit({
      position: new THREE.Vector3(0, 0, 0),
      color: new THREE.Color(0xffffff),
      count: 10,
      life: 2.0,
      size: 3,
    });
    ps.update(0.016);
    const geo = ps.points.geometry as THREE.BufferGeometry;
    const sizes = geo.attributes.aSize as THREE.BufferAttribute;
    let activeCount = 0;
    for (let i = 0; i < 100; i++) {
      if ((sizes.array as Float32Array)[i] > 0) activeCount++;
    }
    expect(activeCount).toBe(10);
  });

  it("applies gravity to particle velocity over time", () => {
    ps.emit({
      position: new THREE.Vector3(0, 5, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      color: new THREE.Color(0xffffff),
      count: 1,
      life: 10.0,
      size: 3,
      gravity: -9.8,
    });
    ps.update(0.1);
    // After 0.1s with gravity -9.8, velocity.y should be -0.98, y should have decreased
    const geo = ps.points.geometry as THREE.BufferGeometry;
    const positions = geo.attributes.position as THREE.BufferAttribute;
    const arr = positions.array as Float32Array;
    // y should be less than 5 after gravity is applied
    expect(arr[1]).toBeLessThan(5);
  });

  it("emitBirdTrail spawns 1 particle", () => {
    ps.emitBirdTrail(new THREE.Vector3(0, 0, 0));
    ps.update(0.016);
    const sizes = (
      ps.points.geometry.attributes.aSize as THREE.BufferAttribute
    ).array as Float32Array;
    const active = Array.from(sizes).filter((s) => s > 0).length;
    expect(active).toBe(1);
  });

  it("emitFlapFeathers spawns 3 particles", () => {
    ps.emitFlapFeathers(new THREE.Vector3(0, 0, 0));
    ps.update(0.016);
    const sizes = (
      ps.points.geometry.attributes.aSize as THREE.BufferAttribute
    ).array as Float32Array;
    const active = Array.from(sizes).filter((s) => s > 0).length;
    expect(active).toBe(3);
  });

  it("emitDeathBurst spawns 30 particles", () => {
    ps.emitDeathBurst(new THREE.Vector3(0, 0, 0));
    ps.update(0.016);
    const sizes = (
      ps.points.geometry.attributes.aSize as THREE.BufferAttribute
    ).array as Float32Array;
    const active = Array.from(sizes).filter((s) => s > 0).length;
    expect(active).toBe(30);
  });

  it("emitPipeShatter spawns 15 particles", () => {
    ps.emitPipeShatter(new THREE.Vector3(0, 0, 0), new THREE.Color(0x00ff00));
    ps.update(0.016);
    const sizes = (
      ps.points.geometry.attributes.aSize as THREE.BufferAttribute
    ).array as Float32Array;
    const active = Array.from(sizes).filter((s) => s > 0).length;
    expect(active).toBe(15);
  });

  it("emitNearMissSparks spawns 5 particles", () => {
    ps.emitNearMissSparks(new THREE.Vector3(0, 0, 0));
    ps.update(0.016);
    const sizes = (
      ps.points.geometry.attributes.aSize as THREE.BufferAttribute
    ).array as Float32Array;
    const active = Array.from(sizes).filter((s) => s > 0).length;
    expect(active).toBe(5);
  });

  it("emitPowerUpCollect spawns 10 particles", () => {
    ps.emitPowerUpCollect(
      new THREE.Vector3(0, 0, 0),
      new THREE.Color(0x00ffff)
    );
    ps.update(0.016);
    const sizes = (
      ps.points.geometry.attributes.aSize as THREE.BufferAttribute
    ).array as Float32Array;
    const active = Array.from(sizes).filter((s) => s > 0).length;
    expect(active).toBe(10);
  });
});
