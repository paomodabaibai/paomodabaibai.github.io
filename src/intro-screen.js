import { mountIntroParticles } from "./intro-particles.js";
import { mountTitleParticles } from "./title-particles.js";
import { createCRT, screenToScene, CRT_CURVATURE, CRT_HOME_LENS } from "./crt.js";

// The monochrome grain generator is adapted from React Bits / Animations / Noise.
// Copyright (c) 2026 David Haz. MIT + Commons Clause; see
// /public/third-party/ReactBits-LICENSE.txt. The lifecycle below is site-specific.
const TILE = 256;
const SCREEN = { opacity: 0.085, size: 1, fps: 10, contrast: 0.75 };
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const generator = (seed) => {
  let state = seed >>> 0 || 1;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

function grainTile(contrast) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = TILE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const image = ctx.createImageData(TILE, TILE);
  const random = generator(1013904223);
  const range = 0.5 + contrast * 1.1;
  for (let i = 0; i < image.data.length; i += 4) {
    const value = clamp(0.5 + (random() + random() - 1) * range, 0, 1) * 255;
    image.data[i] = image.data[i + 1] = image.data[i + 2] = value;
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL();
}

export function mountIntroScreen(host, { arcade = false } = {}) {
  const field = document.createElement("div");
  field.className = "intro-particle-field";
  field.setAttribute("aria-hidden", "true");
  const screen = document.createElement("div");
  screen.className = "intro-screen";
  screen.setAttribute("aria-hidden", "true");
  const grain = document.createElement("div");
  grain.className = "intro-grain";
  const tile = grainTile(SCREEN.contrast);
  if (tile) grain.style.backgroundImage = `url("${tile}")`;
  grain.style.opacity = SCREEN.opacity;
  grain.style.backgroundSize = `${TILE * SCREEN.size}px ${TILE * SCREEN.size}px`;
  screen.append(grain);
  host.prepend(field);
  host.append(screen);
  const source = document.createElement("canvas");
  const background = document.createElement("canvas");
  const context = source.getContext("2d", { alpha: false });
  const backgroundContext = background.getContext("2d", { alpha: false });
  let crt = null;
  let output = null;
  let titleCanvas = null;
  let disposeTitle = () => {};
  let revealed = false;
  let alive = true;
  let screenTone;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");

  function composite() {
    if (!alive || !crt || !context || !background.width) return;
    context.drawImage(background, 0, 0, source.width, source.height);
    if (titleCanvas && !titleCanvas.hidden)
      context.drawImage(titleCanvas, 0, 0, source.width, source.height);
    if (!crt.render(motion.matches ? 0 : performance.now() / 1000)) releaseCRT();
  }

  function captureBackground(canvas) {
    if (!backgroundContext || !alive) return;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    const width = Math.max(1, Math.round(host.clientWidth * ratio));
    const height = Math.max(1, Math.round(host.clientHeight * ratio));
    if (source.width !== width || source.height !== height) {
      source.width = background.width = width;
      source.height = background.height = height;
      if (output) { output.width = width; output.height = height; }
      screenTone = backgroundContext.createRadialGradient(width * 0.5, height * 0.44, 0, width * 0.5, height * 0.5, Math.hypot(width, height) * 0.55);
      screenTone.addColorStop(0, "#1c1c1c");
      screenTone.addColorStop(0.65, "#141414");
      screenTone.addColorStop(1, "#0d0d0d");
    }
    // Capture synchronously before the WebGL particle buffer is discarded.
    backgroundContext.fillStyle = screenTone || "#181818";
    backgroundContext.fillRect(0, 0, width, height);
    backgroundContext.drawImage(canvas, 0, 0, width, height);
    composite();
  }

  function releaseCRT() {
    output?.removeEventListener("webglcontextlost", contextLost);
    crt?.destroy();
    crt = null;
    output?.remove();
    output = null;
    host.classList.remove("has-crt");
    host.dataset.renderer = "canvas-2d";
  }

  function contextLost(event) {
    event.preventDefault();
    // Reduced motion has no continuing particle frames to discover the loss.
    releaseCRT();
  }

  function setArcade(enabled) {
    arcade = enabled;
    host.classList.toggle("is-arcade", arcade);
    if (!arcade) {
      releaseCRT();
      host.dataset.renderer = "normal";
      return;
    }
    if (crt || !context || !backgroundContext) return;
    output = document.createElement("canvas");
    output.className = "intro-crt";
    output.setAttribute("aria-hidden", "true");
    output.width = source.width;
    output.height = source.height;
    crt = createCRT(output, source, { lens: CRT_HOME_LENS, bezel: [0.125, 0.125, 0.13] });
    if (!crt) { releaseCRT(); return; }
    output.addEventListener("webglcontextlost", contextLost);
    host.append(output);
    host.classList.add("has-crt");
    host.dataset.renderer = "webgl-crt";
    composite();
  }

  const disposeParticles = mountIntroParticles(field, {
    interactionTarget: host,
    onRender: captureBackground,
    mapPointer: (u, v) => crt ? screenToScene(u, v, CRT_CURVATURE, CRT_HOME_LENS) : { x: u, y: v },
  });
  const titleStage = host.querySelector(".identity");
  function reveal() {
    if (!alive || revealed) return;
    revealed = true;
    host.classList.remove("is-intro-pending");
    host.classList.add("is-intro-ready");
    host.querySelector("#start").disabled = false;
    disposeTitle = mountTitleParticles(titleStage, titleStage?.querySelector("h1"), {
      rasterizeReducedMotion: true,
      onRender(canvas) { titleCanvas = canvas; composite(); },
    });
  }
  setArcade(arcade);
  const random = generator(7316);
  let timer = 0;
  let phase = "ready";
  let leaveCallback = null;

  function animateGrain() {
    timer = 0;
    if (!alive || motion.matches || document.hidden) return;
    const x = Math.round(random() * TILE),
      y = Math.round(random() * TILE);
    grain.style.transform = `translate(${x}px, ${y}px)`;
    timer = window.setTimeout(animateGrain, 1000 / SCREEN.fps);
  }
  function sync() {
    clearTimeout(timer);
    timer = 0;
    if (!motion.matches && !document.hidden) animateGrain();
  }
  motion.addEventListener("change", sync);
  document.addEventListener("visibilitychange", sync);
  sync();
  const cleanup = () => {
    if (!alive) return;
    alive = false;
    leaveCallback = null;
    clearTimeout(timer);
    motion.removeEventListener("change", sync);
    document.removeEventListener("visibilitychange", sync);
    disposeParticles();
    disposeTitle();
    releaseCRT();
    source.width = source.height = background.width = background.height = 1;
    field.remove();
    screen.remove();
  };
  cleanup.setArcade = setArcade;
  cleanup.reveal = reveal;
  cleanup.leave = (callback) => {
    if (!alive) return;
    if (phase === "left") {
      callback?.();
      return;
    }
    // Header navigation or another start request supersedes the pending action
    // without restarting the outgoing cloud.
    leaveCallback = callback;
    if (phase === "leaving") return;
    phase = "leaving";
    host.classList.add("is-leaving");
    const finish = () => {
      if (!alive) return;
      phase = "left";
      const next = leaveCallback;
      leaveCallback = null;
      next?.();
    };
    if (disposeTitle.disperse) disposeTitle.disperse(finish);
    else finish();
  };
  return cleanup;
}
