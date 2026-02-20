varying float vLife;
varying vec3 vColor;

void main() {
  // Soft circle
  float dist = length(gl_PointCoord - vec2(0.5));
  if (dist > 0.5) discard;

  float alpha = smoothstep(0.5, 0.2, dist) * (1.0 - vLife);
  gl_FragColor = vec4(vColor, alpha);
}
