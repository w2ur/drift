attribute float aLife;
attribute float aMaxLife;
attribute float aSize;
attribute vec3 aColor;

varying float vLife;
varying vec3 vColor;

void main() {
  vLife = aLife / aMaxLife;
  vColor = aColor;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  // Screen-space size scaling
  gl_PointSize = aSize * (300.0 / -mvPosition.z);
  gl_PointSize = max(gl_PointSize, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}
