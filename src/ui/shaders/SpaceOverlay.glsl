uniform sampler2D uPatternSampler;

uniform vec3 uColorPrimary;
uniform vec3 uColorSecondary;

uniform float uValue;
uniform float uScale;
uniform float uAngle;
uniform float uAngleV;

void main() {
  float speed = 0.2;
  vec2 dir = vec2(1.0, 0) * rotate2D(uAngleV);
  vec2 xy = (vVertexPosition.xy + dir * iTime * speed) * 
            rotate2D(uAngle) * 
            inversesqrt(2.0) * uScale;
  vec4 guide = texture2D(uPatternSampler, xy);
  vec3 color = mix(uColorSecondary, uColorPrimary, uValue);
  gl_FragColor = vec4(color * guide.x, guide.a);
}