uniform float uVelocity;
uniform float uWavelength;
uniform float uAmplitude;
uniform float uPhase;
uniform float uTime;
uniform vec3 uColorPrimary;
uniform vec3 uColorSecondary;
uniform sampler2D uThunderPattern;

const float PI = 3.141592654;

float wavey() {
  float x = vVertexPosition.x * 2.0 * PI / uWavelength;
  float y = uAmplitude * (sin(x) - 1.0) + uTime * uVelocity;
  return y;
}

vec3 thunder() {
  float ratio = inputSize.x / inputSize.y;
  vec2 scale = vec2(ratio, 1.0) * 2.0;
  vec3 v = texture2D(uThunderPattern, vVertexPosition * scale).rgb;
  v = mix(uColorSecondary, uColorPrimary, v);
  return v;
}

vec4 phase0() {
  if (vVertexPosition.y > wavey()) {
    return vec4(0.0);
  } else {
    return vec4(thunder(), 1.0);
  }
}

vec4 phase1() {
  return vec4(thunder(), 1.0);
}

vec4 phase2() {
  if (vVertexPosition.y < wavey()) {
    return vec4(0.0);
  } else {
    return vec4(thunder(), 1.0);
  }
}

void main() {
  if (uPhase < 0.5) {
    gl_FragColor = phase0();
  }
  else if (uPhase < 1.5) {
    gl_FragColor = phase1();
  }
  else {
    gl_FragColor = phase2();
  }
}
