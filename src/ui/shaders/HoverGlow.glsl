uniform float uTime0;
uniform sampler2D uGlowSampler;
uniform sampler2D uLightDsSampler;

void main() {
  float angle = -60.0;
  float speed = 5.5;
  float scale = 3.0;
  float offset = 4.0;
  float interval = 6.0;
  float alpha = 0.35;
  float time = iTime - uTime0;
  vec2 dp = time * vec2(-1.0, 0.0) * speed;
  vec2 pos = (vVertexPosition + dp) * rotate2D(angle);
  float x = clamp(mod(pos.x + offset, interval) * scale, 0.0, 1.0);
  vec4 blend = texture2D(uLightDsSampler, vec2(x, 0.5));
  vec4 color = texture2D(uGlowSampler, vVertexPosition);
  gl_FragColor = vec4(color.rgb * blend.r, blend.a) * alpha;
}
