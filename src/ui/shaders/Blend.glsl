uniform vec3 uColorPrimary;
uniform vec3 uColorSecondary;

void main() {
  vec4 v = texture2D(uSampler, vTextureCoord);
  vec3 color = mix(uColorSecondary, uColorPrimary, v.x);
  gl_FragColor = vec4(color, 1.0) * v.a;
}