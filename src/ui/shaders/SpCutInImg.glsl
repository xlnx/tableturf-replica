uniform vec3 uColor;

void main() {
  float alpha = texture2D(uSampler, vTextureCoord).a;
  gl_FragColor = vec4(vec3(uColor * alpha), alpha);
}
