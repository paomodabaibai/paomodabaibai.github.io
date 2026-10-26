// The coordinate helpers use exactly the same barrel function as the shader.
export const CRT_CURVATURE = 0.105;
export function screenToScene(u, v, curvature = CRT_CURVATURE) {
  const x = u * 2 - 1,
    y = v * 2 - 1;
  const bend = 1 + curvature * (x * x + y * y);
  return { x: (x * bend + 1) / 2, y: (y * bend + 1) / 2 };
}
export function sceneToScreen(u, v, curvature = CRT_CURVATURE) {
  const x = u * 2 - 1,
    y = v * 2 - 1;
  const sourceRadius = Math.hypot(x, y);
  if (sourceRadius < 1e-8) return { x: 0.5, y: 0.5 };
  let radius = sourceRadius;
  for (let i = 0; i < 6; i += 1)
    radius -=
      (radius + curvature * radius ** 3 - sourceRadius) /
      (1 + 3 * curvature * radius ** 2);
  const scale = radius / sourceRadius;
  return { x: (x * scale + 1) / 2, y: (y * scale + 1) / 2 };
}
const VERTEX = `
  attribute vec2 aPosition;
  varying vec2 vUV;
  void main() { vUV = (aPosition + 1.0) * 0.5; gl_Position = vec4(aPosition, 0.0, 1.0); }
`;
const FRAGMENT = `
  precision mediump float;
  uniform sampler2D uScene;
  uniform vec2 uResolution;
  uniform float uTime;
  varying vec2 vUV;
  void main() {
    vec2 p = vUV * 2.0 - 1.0;
    vec2 curved = p * (1.0 + ${CRT_CURVATURE} * dot(p, p));
    vec2 uv = curved * 0.5 + 0.5;
    vec2 texel = 1.0 / uResolution;
    vec2 imageUV = vec2(uv.x, 1.0 - uv.y);
    vec3 base = texture2D(uScene, imageUV).rgb;
    vec3 bloom = texture2D(uScene, imageUV + vec2(texel.x * 2.0, 0.0)).rgb;
    bloom += texture2D(uScene, imageUV - vec2(texel.x * 2.0, 0.0)).rgb;
    bloom += texture2D(uScene, imageUV + vec2(0.0, texel.y * 2.0)).rgb;
    bloom += texture2D(uScene, imageUV - vec2(0.0, texel.y * 2.0)).rgb;
    vec3 color = base * 0.93 + bloom * 0.033;
    float scan = 0.95 + 0.05 * cos(uv.y * 720.0 * 3.14159265);
    float grille = 0.98 + 0.02 * cos(gl_FragCoord.x * 3.14159265);
    float grain = fract(sin(dot(gl_FragCoord.xy + uTime, vec2(12.9898, 78.233))) * 43758.5453);
    float vignette = 1.0 - 0.27 * pow(min(dot(p, p) * 0.5, 1.0), 1.35);
    float edges = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
    float glassMask = smoothstep(0.0, 0.008, edges);
    color = (color * scan * grille * vignette + (grain - 0.5) * 0.012) * glassMask;
    gl_FragColor = vec4(max(color, vec3(0.0)), 1.0);
  }
`;
/** Returns null when WebGL is unavailable. The caller owns its 2D fallback. */
export function createCRT(canvas, source) {
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: "low-power",
  });
  if (!gl) return null;
  const shaders = [];
  const compile = (type, body) => {
    const shader = gl.createShader(type);
    shaders.push(shader);
    gl.shaderSource(shader, body);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
      throw new Error(
        gl.getShaderInfoLog(shader) || "CRT shader compilation failed",
      );
    return shader;
  };
  let program, buffer, texture;
  const destroy = () => {
    if (texture) gl.deleteTexture(texture);
    if (buffer) gl.deleteBuffer(buffer);
    if (program) gl.deleteProgram(program);
    for (const shader of shaders) gl.deleteShader(shader);
  };
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error(
        gl.getProgramInfoLog(program) || "CRT shader link failed",
      );
    gl.useProgram(program);
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform1i(gl.getUniformLocation(program, "uScene"), 0);
    const resolution = gl.getUniformLocation(program, "uResolution");
    const time = gl.getUniformLocation(program, "uTime");
    return {
      render(seconds) {
        if (gl.isContextLost()) return false;
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(resolution, source.width, source.height);
        gl.uniform1f(time, seconds);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          source,
        );
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        return true;
      },
      destroy,
    };
  } catch (error) {
    destroy();
    console.warn("CRT unavailable; using the 2D fallback.", error);
    return null;
  }
}
