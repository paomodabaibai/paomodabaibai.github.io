// The coordinate helpers use exactly the same barrel function as the shader.
export const CRT_CURVATURE = 0.105;
// Home content follows the same barrel profile as the physical glass; the
// edge-faded lens below controls corner shear separately.
export const CRT_CONTENT_CURVATURE = CRT_CURVATURE;
export const CRT_CORNER_RADIUS = 0.12;
// The title channel uses a stronger interior lens while the physical glass
// mask stays identical to the game channel, independent of content sampling.
export const CRT_HOME_LENS = 0.28;
export function screenToScene(u, v, curvature = CRT_CURVATURE, lens = 0) {
  const x = u * 2 - 1,
    y = v * 2 - 1;
  const bend = 1 + curvature * (x * x + y * y);
  const qx = x * bend, qy = y * bend;
  // Keep the lens radial around the title, then soften it toward the lower
  // glass so corner labels do not shear into exaggerated parallelograms.
  const lensWeight = Math.max(0, 1 - qx * qx) * Math.max(0, 1 - qy * qy);
  const edgeT = Math.min(1, Math.max(0, (Math.abs(qy) - 0.1) / 0.55));
  const edgeFade = 1 - 0.55 * edgeT * edgeT * (3 - 2 * edgeT);
  const focus = 1 - lens * lensWeight * edgeFade;
  return { x: (qx * focus + 1) / 2, y: (qy * focus + 1) / 2 };
}
/** Normalized physical glass outline, shared by the rim and effect aperture. */
export function crtScreenOutline(inset = 0) {
  const points = [];
  const half = 1 - inset * 2;
  const radius = Math.max(0, CRT_CORNER_RADIUS - inset * 2);
  const straight = half - radius;
  const add = (x, y) => points.push(sceneToScreen((x + 1) / 2, (y + 1) / 2));
  for (let side = 0; side < 4; side++) {
    const angle = side * Math.PI / 2;
    const rotate = (x, y) => add(x * Math.cos(angle) - y * Math.sin(angle), x * Math.sin(angle) + y * Math.cos(angle));
    for (let step = 0; step <= 48; step += 1) {
      rotate(-straight + step / 48 * straight * 2, -half);
    }
    for (let step = 1; step <= 12; step++) {
      const arc = -Math.PI / 2 + step / 12 * Math.PI / 2;
      rotate(straight + Math.cos(arc) * radius, -straight + Math.sin(arc) * radius);
    }
  }
  return points;
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
const fragmentSource = (contentCurvature = CRT_CURVATURE) => `
  precision mediump float;
  uniform sampler2D uScene;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uLens;
  uniform vec3 uBezel;
  varying vec2 vUV;
  void main() {
    vec2 p = vUV * 2.0 - 1.0;
    vec2 curved = p * (1.0 + ${contentCurvature} * dot(p, p));
    vec2 maskCurved = p * (1.0 + ${CRT_CURVATURE} * dot(p, p));
    float lensWeight = max(0.0, 1.0 - curved.x * curved.x) * max(0.0, 1.0 - curved.y * curved.y);
    float edgeT = smoothstep(0.1, 0.65, abs(curved.y));
    float edgeFade = 1.0 - 0.55 * edgeT * edgeT * (3.0 - 2.0 * edgeT);
    float focus = 1.0 - uLens * lensWeight * edgeFade;
    vec2 sceneUV = curved * focus * 0.5 + 0.5;
    vec2 texel = 1.0 / uResolution;
    vec2 imageUV = vec2(sceneUV.x, 1.0 - sceneUV.y);
    vec3 base = texture2D(uScene, imageUV).rgb;
    vec3 bloom = texture2D(uScene, imageUV + vec2(texel.x * 2.0, 0.0)).rgb;
    bloom += texture2D(uScene, imageUV - vec2(texel.x * 2.0, 0.0)).rgb;
    bloom += texture2D(uScene, imageUV + vec2(0.0, texel.y * 2.0)).rgb;
    bloom += texture2D(uScene, imageUV - vec2(0.0, texel.y * 2.0)).rgb;
    vec3 color = base * 0.93 + bloom * 0.033;
    float scan = 0.95 + 0.05 * cos(sceneUV.y * 720.0 * 3.14159265);
    float grille = 0.98 + 0.02 * cos(gl_FragCoord.x * 3.14159265);
    float grain = fract(sin(dot(gl_FragCoord.xy + uTime, vec2(12.9898, 78.233))) * 43758.5453);
    float vignette = 1.0 - 0.27 * pow(min(dot(p, p) * 0.5, 1.0), 1.35);
    vec2 corner = abs(maskCurved) - vec2(1.0 - ${CRT_CORNER_RADIUS});
    float glassDistance = length(max(corner, 0.0)) + min(max(corner.x, corner.y), 0.0) - ${CRT_CORNER_RADIUS};
    float glassMask = 1.0 - smoothstep(-0.016, 0.0, glassDistance);
    color = mix(uBezel, color * scan * grille * vignette + (grain - 0.5) * 0.012, glassMask);
    gl_FragColor = vec4(max(color, vec3(0.0)), 1.0);
  }
`;
/** Returns null when WebGL is unavailable. The caller owns its 2D fallback. */
export function createCRT(canvas, source, { lens = 0, bezel = [0, 0, 0], curvature = CRT_CURVATURE } = {}) {
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
  let destroyed = false;
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    if (texture) gl.deleteTexture(texture);
    if (buffer) gl.deleteBuffer(buffer);
    if (program) gl.deleteProgram(program);
    for (const shader of shaders) gl.deleteShader(shader);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource(curvature)));
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
    gl.uniform1f(gl.getUniformLocation(program, "uLens"), lens);
    gl.uniform3fv(gl.getUniformLocation(program, "uBezel"), bezel);
    const resolution = gl.getUniformLocation(program, "uResolution");
    const time = gl.getUniformLocation(program, "uTime");
    return {
      render(seconds) {
        if (destroyed || gl.isContextLost()) return false;
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
