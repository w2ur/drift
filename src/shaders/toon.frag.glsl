uniform vec3 baseColor;
uniform vec3 lightDirection;
uniform float ambientStrength;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vViewDirection;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(lightDirection);

  // Diffuse — dot product
  float NdotL = dot(normal, lightDir);

  // 4-band cel shading with smooth transitions
  float shade;
  if (NdotL > 0.6) {
    shade = 1.0; // fully lit
  } else if (NdotL > 0.2) {
    shade = 0.7; // mid-tone
  } else if (NdotL > -0.1) {
    shade = 0.45; // shadow
  } else {
    shade = 0.3; // deep shadow
  }

  // Rim light — glow at edges
  float rimDot = 1.0 - max(dot(normalize(vViewDirection), normal), 0.0);
  float rimIntensity = smoothstep(0.6, 1.0, rimDot);
  vec3 rimColor = baseColor * 1.5;

  // Combine
  vec3 ambient = baseColor * ambientStrength;
  vec3 diffuse = baseColor * shade;
  vec3 rim = rimColor * rimIntensity * 0.3;

  vec3 finalColor = ambient + diffuse * (1.0 - ambientStrength) + rim;

  gl_FragColor = vec4(finalColor, 1.0);
}
