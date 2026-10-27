/**
 * Vanilla adaptation of React Bits / Backgrounds / Particles.
 * Copyright (c) 2026 David Haz. MIT + Commons Clause.
 * Upstream: https://reactbits.dev/backgrounds/particles
 * Source: E:/work/Skills/react-bits/src/content/Backgrounds/Particles/Particles.jsx
 * See public/third-party/ReactBits-LICENSE.txt for the full license notice.
 * Reuses the upstream instanced quad rendering, perspective projection, bob,
 * coverage antialiasing, seeded generator, and cursor repulsion. The screen-space
 * wake, responsive frustum distribution and lifecycle are local adaptations.
 */

const FOCAL = 1 / Math.tan((7.5 * Math.PI) / 180);
const TRAIL_COUNT = 12;
const TRAIL_SECONDS = 1.45;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const seeded = (seed) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const VERTEX = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aCorner;
layout(location = 1) in vec3 aPosition;
layout(location = 2) in vec4 aRandom;
uniform float uTime;
uniform float uCamera;
uniform float uAspect;
uniform vec2 uView;
uniform float uRatio;
uniform float uSize;
uniform float uReveal;
uniform vec4 uPointer;
uniform float uStrength;
uniform vec4 uTrail[${TRAIL_COUNT}];
uniform int uTrailCount;
out vec2 vLocal;
out float vRadius;
out float vAlpha;

vec3 bob(vec4 r, float t) {
  return vec3(
    sin(t * r.z + 6.28 * r.w) * mix(0.1, 1.5, r.x),
    sin(t * r.y + 6.28 * r.x) * mix(0.1, 1.5, r.w),
    sin(t * r.w + 6.28 * r.y) * mix(0.1, 1.5, r.z)
  );
}

void main() {
  vec3 world = aPosition + bob(aRandom, uTime) * 0.25;
  vec3 view = world - vec3(0.0, 0.0, uCamera);
  float dist = length(view);
  float ahead = -view.z;
  vec2 ndc = vec2(view.x * ${FOCAL.toFixed(6)} / uAspect, view.y * ${FOCAL.toFixed(6)}) / ahead;
  vec2 screen = (ndc * 0.5 + 0.5) * uView;
  vec2 shift = vec2(0.0);
  float flash = 0.0;
  if (uPointer.z > 0.001) {
    vec2 delta = screen - uPointer.xy;
    float reach = length(delta);
    float falloff = exp(-dot(delta, delta) / (uPointer.w * uPointer.w));
    vec2 away = reach > 0.001 ? delta / reach : vec2(0.0);
    shift += away * uPointer.w * 0.5 * falloff * uStrength * uPointer.z;
    flash += falloff * uPointer.z * 0.25;
  }
  for (int i = 0; i < ${TRAIL_COUNT}; i++) {
    if (i >= uTrailCount) break;
    vec4 trace = uTrail[i];
    vec2 delta = screen - trace.xy;
    float reach = length(delta);
    float radius = uPointer.w * mix(0.32, 1.05, trace.z);
    float falloff = exp(-dot(delta, delta) / (radius * radius));
    float fade = (1.0 - trace.z) * (1.0 - trace.z) * trace.w;
    vec2 away = reach > 0.001 ? delta / reach : vec2(0.0);
    shift += away * falloff * fade * 34.0 * uStrength;
    flash += falloff * fade * 0.1;
  }
  shift *= min(1.0, uPointer.w / max(length(shift), 0.001));
  screen += shift;
  float diameter = clamp(uSize * (0.55 + aRandom.x * 1.1) / dist, 0.65, 2.8);
  float device = diameter * uRatio;
  float radius = max(diameter, 1.0 / uRatio) * 0.5;
  float coverage = min(1.0, device * device);
  float extent = radius + 1.5;
  float reveal = clamp(uReveal * 1.6 - aRandom.z * 0.6, 0.0, 1.0);
  vLocal = aCorner * extent;
  vRadius = radius;
  vAlpha = coverage * mix(0.3, 0.95, aRandom.w) * min(1.4, 1.0 + flash) * reveal * reveal;
  gl_Position = vec4((screen + aCorner * extent) / uView * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform float uRatio;
uniform float uOpacity;
in vec2 vLocal;
in float vRadius;
in float vAlpha;
out vec4 outColor;
void main() {
  float soft = 0.7 / uRatio;
  float shape = 1.0 - smoothstep(vRadius - soft, vRadius + soft, length(vLocal));
  float alpha = shape * vAlpha * uOpacity;
  if (alpha < 0.002) discard;
  outColor = vec4(vec3(alpha), alpha);
}`;

function createProgram(gl) {
  const shaders = [];
  const program = gl.createProgram();
  if (!program) return null;
  for (const [type, source] of [
    [gl.VERTEX_SHADER, VERTEX],
    [gl.FRAGMENT_SHADER, FRAGMENT],
  ]) {
    const shader = gl.createShader(type);
    if (!shader) break;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      break;
    }
    shaders.push(shader);
    gl.attachShader(program, shader);
  }
  if (shaders.length === 2) gl.linkProgram(program);
  const linked =
    shaders.length === 2 && gl.getProgramParameter(program, gl.LINK_STATUS);
  shaders.forEach((shader) => gl.deleteShader(shader));
  if (!linked) {
    gl.deleteProgram(program);
    return null;
  }
  const uniforms = {};
  const total = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < total; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info)
      uniforms[info.name.replace("[0]", "")] = gl.getUniformLocation(
        program,
        info.name,
      );
  }
  return { program, uniforms };
}

/**
 * Mount a monochrome dust field. All sizes and pointer coordinates are CSS px.
 * particleCount is the desired density at 1440 × 900; actual count scales with
 * area and is capped at maxParticles (1800). Mobile uses mobileDensity (0.8).
 * Options: interactionTarget, particleCount, particleBaseSize, opacity, speed,
 * hoverRadius, hoverStrength, mobileDensity, maxParticles, pixelRatio, seed,
 * introDuration, maxFPS, onRender(canvas), mapPointer(u, v). Pointer mapping
 * accepts and returns normalized top-left coordinates ({ x, y }). onRender
 * runs synchronously while the WebGL drawing buffer is available.
 * Returns an idempotent cleanup function.
 */
export function mountIntroParticles(container, options = {}) {
  if (!container) return () => {};
  const settings = {
    particleCount: 1400,
    particleBaseSize: 40,
    opacity: 0.58,
    speed: 0.18,
    hoverRadius: 165,
    hoverStrength: 1.5,
    mobileDensity: 0.8,
    maxParticles: 1800,
    pixelRatio: 1.75,
    seed: 19,
    introDuration: 1.2,
    maxFPS: 60,
    ...options,
  };
  const target = options.interactionTarget || container;
  const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduce = reduceQuery.matches;
  let canvas = document.createElement("canvas");
  canvas.className = "intro-particles-canvas";
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText =
    "position:absolute;inset:0;display:block;width:100%;height:100%;pointer-events:none;";
  container.append(canvas);
  let gl;
  try {
    gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });
  } catch {}
  let gpu = gl && createProgram(gl);
  let context2d;
  let buffers = [];
  let vao;
  let destroyed = false;
  let raf = 0;
  let last = 0;
  let visible = true;
  let width = 1,
    height = 1,
    ratio = 1,
    count = 0;
  let clock = 0,
    reveal = reduce ? 1 : 0;
  let positions = new Float32Array(0),
    randoms = new Float32Array(0);
  const packedTrail = new Float32Array(TRAIL_COUNT * 4);
  const trail = [];
  const pointer = {
    x: 0,
    y: 0,
    sx: 0,
    sy: 0,
    active: 0,
    inside: false,
    lastX: 0,
    lastY: 0,
    lastTime: 0,
  };
  const camera = 20;

  function releaseGPU() {
    if (!gl) return;
    if (gpu) gl.deleteProgram(gpu.program);
    buffers.forEach((buffer) => gl.deleteBuffer(buffer));
    if (vao) gl.deleteVertexArray(vao);
    buffers = [];
    gpu = null;
    vao = null;
  }

  function fallback() {
    releaseGPU();
    canvas.removeEventListener("webglcontextlost", onContextLost);
    const replacement = canvas.cloneNode(false);
    canvas.replaceWith(replacement);
    canvas = replacement;
    context2d = canvas.getContext("2d", { alpha: true });
    gl = null;
    container.dataset.renderer = context2d ? "canvas-2d" : "none";
  }

  function onContextLost(event) {
    event.preventDefault();
    if (destroyed) return;
    fallback();
    resize();
  }

  if (gpu) {
    canvas.addEventListener("webglcontextlost", onContextLost);
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    for (const [index, size] of [
      [0, 2],
      [1, 3],
      [2, 4],
    ]) {
      const buffer = gl.createBuffer();
      buffers.push(buffer);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(index);
      gl.vertexAttribPointer(index, size, gl.FLOAT, false, 0, 0);
      if (index) gl.vertexAttribDivisor(index, 1);
      else
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
          gl.STATIC_DRAW,
        );
    }
    gl.bindVertexArray(null);
    container.dataset.renderer = "webgl2";
  } else fallback();

  function rebuild() {
    const density = width < 700 ? settings.mobileDensity : 1;
    count = Math.round(
      clamp(
        ((settings.particleCount * width * height) / (1440 * 900)) * density,
        180,
        settings.maxParticles,
      ),
    );
    positions = new Float32Array(count * 3);
    randoms = new Float32Array(count * 4);
    const random = seeded(settings.seed);
    const aspect = width / height;
    for (let i = 0; i < count; i++) {
      const x = random() * 2.16 - 1.08,
        y = random() * 2.16 - 1.08;
      const depth = 14 + random() * 52;
      positions.set(
        [(x * aspect * depth) / FOCAL, (y * depth) / FOCAL, camera - depth],
        i * 3,
      );
      randoms.set([random(), random(), random(), random()], i * 4);
    }
    if (gpu) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers[1]);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers[2]);
      gl.bufferData(gl.ARRAY_BUFFER, randoms, gl.STATIC_DRAW);
    }
  }

  function render2d() {
    if (!context2d) return;
    const ctx = context2d;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#fff";
    for (let i = 0; i < count; i++) {
      const r = i * 4,
        p = i * 3;
      const [a, b, c, d] = randoms.subarray(r, r + 4);
      const wx =
        positions[p] + Math.sin(clock * c + 6.28 * d) * (0.1 + 1.4 * a) * 0.25;
      const wy =
        positions[p + 1] +
        Math.sin(clock * b + 6.28 * a) * (0.1 + 1.4 * d) * 0.25;
      const wz =
        positions[p + 2] +
        Math.sin(clock * d + 6.28 * b) * (0.1 + 1.4 * c) * 0.25;
      const ahead = camera - wz;
      let x = (((wx * FOCAL) / (width / height) / ahead) * 0.5 + 0.5) * width;
      let y = (((wy * FOCAL) / ahead) * 0.5 + 0.5) * height;
      let dx = 0,
        dy = 0,
        flash = 0;
      const repel = (px, py, radius, amount) => {
        const ex = x - px,
          ey = y - py,
          distance = Math.hypot(ex, ey);
        if (distance < 0.001) return;
        const power =
          Math.exp(-(ex * ex + ey * ey) / (radius * radius)) * amount;
        dx += (ex / distance) * power;
        dy += (ey / distance) * power;
        flash += power * 0.002;
      };
      repel(
        pointer.sx,
        pointer.sy,
        settings.hoverRadius,
        settings.hoverRadius * 0.5 * settings.hoverStrength * pointer.active,
      );
      for (const trace of trail) {
        const age = trace.age / TRAIL_SECONDS;
        repel(
          trace.x,
          trace.y,
          settings.hoverRadius * (0.32 + 0.73 * age),
          (1 - age) ** 2 * trace.strength * 34 * settings.hoverStrength,
        );
      }
      const limit = Math.min(
        1,
        settings.hoverRadius / Math.max(Math.hypot(dx, dy), 0.001),
      );
      x += dx * limit;
      y += dy * limit;
      const diameter = clamp(
        (settings.particleBaseSize * (0.55 + a * 1.1)) /
          Math.hypot(wx, wy, ahead),
        0.65,
        2.8,
      );
      const intro = clamp(reveal * 1.6 - c * 0.6, 0, 1);
      ctx.globalAlpha = clamp(
        settings.opacity *
          (0.3 + 0.65 * d) *
          Math.min(1.4, 1 + flash) *
          intro *
          intro,
        0,
        1,
      );
      ctx.beginPath();
      ctx.arc(x, height - y, diameter / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    options.onRender?.(canvas);
  }

  function render() {
    if (!gpu) return render2d();
    const u = gpu.uniforms;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(gpu.program);
    gl.bindVertexArray(vao);
    gl.uniform1f(u.uTime, clock);
    gl.uniform1f(u.uCamera, camera);
    gl.uniform1f(u.uAspect, width / height);
    gl.uniform2f(u.uView, width, height);
    gl.uniform1f(u.uRatio, ratio);
    gl.uniform1f(u.uSize, settings.particleBaseSize);
    gl.uniform1f(u.uReveal, reveal);
    gl.uniform1f(u.uOpacity, settings.opacity);
    gl.uniform4f(
      u.uPointer,
      pointer.sx,
      pointer.sy,
      pointer.active,
      settings.hoverRadius,
    );
    gl.uniform1f(u.uStrength, settings.hoverStrength);
    trail.forEach((trace, i) =>
      packedTrail.set(
        [trace.x, trace.y, trace.age / TRAIL_SECONDS, trace.strength],
        i * 4,
      ),
    );
    gl.uniform4fv(u.uTrail, packedTrail);
    gl.uniform1i(u.uTrailCount, trail.length);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
    gl.bindVertexArray(null);
    options.onRender?.(canvas);
  }

  function frame(now) {
    raf = 0;
    if (destroyed || !visible || document.hidden) return;
    if (reduce) {
      reveal = 1;
      render();
      return;
    }
    if (last && now - last < 1000 / settings.maxFPS - 1) {
      raf = requestAnimationFrame(frame);
      return;
    }
    const dt = last ? clamp((now - last) / 1000, 0.001, 0.05) : 1 / 60;
    last = now;
    clock += dt * settings.speed;
    reveal = Math.min(1, reveal + dt / Math.max(0.01, settings.introDuration));
    const follow = 1 - Math.exp(-dt / 0.055);
    pointer.sx += (pointer.x - pointer.sx) * follow;
    pointer.sy += (pointer.y - pointer.sy) * follow;
    pointer.active +=
      ((pointer.inside ? 1 : 0) - pointer.active) * (1 - Math.exp(-dt / 0.18));
    for (let i = trail.length - 1; i >= 0; i--) {
      trail[i].age += dt;
      if (trail[i].age >= TRAIL_SECONDS) trail.splice(i, 1);
    }
    render();
    raf = requestAnimationFrame(frame);
  }

  function wake() {
    if (!destroyed && !raf && visible && !document.hidden)
      raf = requestAnimationFrame(frame);
  }

  function resize() {
    if (destroyed) return;
    width = Math.max(1, container.clientWidth);
    height = Math.max(1, container.clientHeight);
    ratio = Math.min(window.devicePixelRatio || 1, settings.pixelRatio, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    trail.length = 0;
    pointer.inside = false;
    pointer.active = 0;
    rebuild();
    render();
    wake();
  }

  function move(event) {
    if (reduce || destroyed) return;
    const rect = container.getBoundingClientRect();
    const u = (event.clientX - rect.left) / Math.max(1, rect.width);
    const v = (event.clientY - rect.top) / Math.max(1, rect.height);
    const mapped = options.mapPointer?.(u, v) || { x: u, y: v };
    const x = mapped.x * width;
    const y = (1 - mapped.y) * height;
    const inside = x >= 0 && y >= 0 && x <= width && y <= height;
    const now = performance.now();
    if (!pointer.inside) {
      pointer.sx = x;
      pointer.sy = y;
      pointer.lastX = x;
      pointer.lastY = y;
      pointer.lastTime = now;
    }
    const distance = Math.hypot(x - pointer.lastX, y - pointer.lastY);
    if (inside && distance > 20 && now - pointer.lastTime > 30) {
      trail.push({ x, y, age: 0, strength: clamp(distance / 65, 0.4, 1) });
      if (trail.length > TRAIL_COUNT) trail.shift();
      pointer.lastX = x;
      pointer.lastY = y;
      pointer.lastTime = now;
    }
    pointer.x = x;
    pointer.y = y;
    pointer.inside = inside;
    wake();
  }

  function leave() {
    pointer.inside = false;
  }
  function up(event) {
    if (event.pointerType !== "mouse") leave();
  }
  function visibility() {
    last = 0;
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
      leave();
    } else wake();
  }
  function motionChanged() {
    reduce = reduceQuery.matches;
    pointer.active = 0;
    pointer.inside = false;
    trail.length = 0;
    last = 0;
    wake();
  }

  target.addEventListener("pointermove", move, { passive: true });
  target.addEventListener("pointerdown", move, { passive: true });
  target.addEventListener("pointerleave", leave, { passive: true });
  target.addEventListener("pointerup", up, { passive: true });
  target.addEventListener("pointercancel", leave, { passive: true });
  window.addEventListener("blur", leave);
  document.addEventListener("visibilitychange", visibility);
  reduceQuery.addEventListener("change", motionChanged);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  const intersection = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    last = 0;
    if (visible) wake();
    else {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  });
  intersection.observe(container);
  resize();

  return () => {
    if (destroyed) return;
    destroyed = true;
    cancelAnimationFrame(raf);
    resizeObserver.disconnect();
    intersection.disconnect();
    target.removeEventListener("pointermove", move);
    target.removeEventListener("pointerdown", move);
    target.removeEventListener("pointerleave", leave);
    target.removeEventListener("pointerup", up);
    target.removeEventListener("pointercancel", leave);
    window.removeEventListener("blur", leave);
    document.removeEventListener("visibilitychange", visibility);
    reduceQuery.removeEventListener("change", motionChanged);
    canvas.removeEventListener("webglcontextlost", onContextLost);
    releaseGPU();
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    canvas.remove();
    delete container.dataset.renderer;
  };
}
