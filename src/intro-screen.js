import { mountIntroParticles } from "./intro-particles.js";
import { mountTitleParticles } from "./title-particles.js";

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

export function mountIntroScreen(host) {
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
  const disposeParticles = mountIntroParticles(field, {
    interactionTarget: host,
  });
  const titleStage = host.querySelector(".identity");
  const disposeTitle = mountTitleParticles(titleStage, titleStage?.querySelector("h1"));
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const random = generator(7316);
  let timer = 0,
    alive = true;
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
    field.remove();
    screen.remove();
  };
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
