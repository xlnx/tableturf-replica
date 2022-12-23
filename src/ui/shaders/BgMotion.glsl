uniform vec3 uColorFgPrimary;
uniform vec3 uColorFgSecondary;
uniform vec3 uColorBg;
uniform float uSpeed;
uniform float uAngle;
uniform float uScale;

uniform sampler2D uPatternSampler;

void main() {
  vec2 du = normalize(vec2(-1.0, 0.3));

  vec2 p1 = vVertexPosition * vec2(outputFrame.z / outputFrame.w, 1.0);
  vec2 pos = (p1 + iTime * du * uSpeed) * rotate2D(uAngle) * uScale;
  float a1 = sin(iTime * 8.0) * 0.5 + 0.5;
  float a2 = texture2D(uPatternSampler, pos).x * 0.3;
  vec3 fg = mix(uColorFgPrimary, uColorFgSecondary, a1);
  vec3 color = mix(fg, uColorBg, a2);

  float alpha = texture2D(uSampler, vTextureCoord).a;
  gl_FragColor = vec4(color * alpha, alpha);
}