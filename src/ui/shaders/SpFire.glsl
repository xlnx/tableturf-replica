uniform sampler2D uAlphaSampler;
uniform sampler2D uFlameSampler;
uniform sampler2D uDistortionSampler;

uniform vec3 uColorPrimary;
uniform vec3 uColorSecondary;

float clamp01(float x) {
    return clamp(x, 0.0, 1.0);
}

void main() {
  const float b1 = 0.1;
  const float b2 = 0.5;

  const float speed = 0.1;

  vec2 t2 = vVertexPosition + iTime * speed * vec2(0.07, 1.0);
  vec2 t1 = vVertexPosition;
  vec2 t0 = vVertexPosition + 7.0 * iTime * speed * vec2(0.0, 1.0);

  vec4 v2 = texture2D(uDistortionSampler, t2);
  vec2 pos = v2.xy * 0.1;
  vec4 v1 = texture2D(uFlameSampler, pos + t1);
  vec4 v0 = texture2D(uAlphaSampler, pos + t0);

  float e1 = clamp01(v0.w + v1.w - 1.0);
  float e2 = clamp01(v1.x + e1);
  float e3 = clamp01(e2 - 0.4);
  float a = clamp01(b1 * 10.0 * e3);

  vec3 color = mix(uColorSecondary, uColorPrimary, a);
  float alpha = clamp01(6.0 * e3 * b2);

  gl_FragColor = vec4(color * alpha, alpha);
}