export const cinematicVertex = /* glsl */ `
  attribute vec2 uv;
  attribute vec3 position;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  varying vec2 vUv;
  varying float vDepth;

  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vUv = uv;
    vDepth = smoothstep(2.0, 10.0, -viewPosition.z);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

export const cinematicFragment = /* glsl */ `
  precision highp float;
  uniform sampler2D tMap;
  uniform float uDarkness;
  uniform float uProgress;
  varying vec2 vUv;
  varying float vDepth;

  void main() {
    vec2 uv = vUv;
    float breathing = sin((uv.y + uProgress) * 3.14159265) * 0.0025;
    uv.x += breathing;
    vec4 color = texture2D(tMap, uv);
    float edge = smoothstep(0.0, 0.08, uv.y) * smoothstep(1.0, 0.92, uv.y);
    float depthShade = mix(1.0, 0.66, vDepth);
    color.rgb *= (1.0 - uDarkness) * depthShade;
    color.rgb = mix(vec3(dot(color.rgb, vec3(0.299, 0.587, 0.114))), color.rgb, 0.7);
    gl_FragColor = vec4(color.rgb, edge);
  }
`;
