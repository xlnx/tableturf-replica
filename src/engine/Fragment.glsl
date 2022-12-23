precision highp float;

varying vec2 vTextureCoord;
varying vec2 vVertexPosition;

uniform sampler2D uSampler;

uniform vec4 outputFrame;
uniform vec4 inputSize;
uniform float resolution;
uniform vec4 inputPixel;

uniform float iTime;

mat2 rotate2D(float deg) {
  float r = radians(deg);
  return mat2(cos(r), -sin(r), sin(r), cos(r));
}

vec2 getScreenPixelPos() {
  return vVertexPosition * outputFrame.zw + outputFrame.xy;
}

