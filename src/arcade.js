import { createCRT, screenToScene, sceneToScreen } from "./crt.js";

const WORLD = { width: 1280, height: 720, ground: 570 };
const PORTALS = [
  { id: "games", x: 320, title: "Game Desgin" },
  { id: "interfaces", x: 640, title: "界面" },
  { id: "other", x: 960, title: "其它" },
].map((portal) => ({ ...portal, y: 370, width: 62, height: 62, bump: 0 }));
let arcadeInstanceCount = 0;

// The mosaic is a category illustration. Only the two existing portfolio covers
// refer to projects; the remaining tiles are unnamed, decorative game artwork.
const APP_TILE_ART = [
  { top: "#fb8867", bottom: "#ed4d5f", art: '<path d="M32 45 17 31c-10-10 5-21 15-10 10-11 25 0 15 10Z" fill="#fff4e9"/>' },
  { top: "#67d5fa", bottom: "#2777ed", art: '<path d="m33 12 5 13 14 1-11 9 3 14-12-8-12 8 3-14-11-9 14-1Z" fill="#fff6ba"/><path d="m18 45-7 6m6-12-7 5" stroke="#e9fbff" stroke-width="3" stroke-linecap="round"/>' },
  { image: "./public/assets/games/catpoker/cover.jpg", position: "72% center", top: "#9186de", bottom: "#6153a8" },
  { top: "#a0e883", bottom: "#3eb48b", art: '<path d="M32 48V28" stroke="#fff5ce" stroke-width="4" stroke-linecap="round"/><path d="M32 34C17 36 13 26 14 17c13-1 21 5 18 17Zm0-6C30 15 40 11 50 13c0 12-5 19-18 15Z" fill="#fff5ce"/>' },
  { top: "#ffc66d", bottom: "#f17c38", art: '<rect x="15" y="15" width="34" height="34" rx="9" fill="#fff7e5" transform="rotate(-9 32 32)"/><g fill="#d97635"><circle cx="23" cy="24" r="3"/><circle cx="40" cy="23" r="3"/><circle cx="32" cy="32" r="3"/><circle cx="24" cy="41" r="3"/><circle cx="41" cy="40" r="3"/></g>' },
  { top: "#87c9ff", bottom: "#4b87ee", art: '<path d="m32 11 19 11v22L32 55 13 44V22Z" fill="#eef8ff"/><path d="m13 22 19 11 19-11M32 33v22" fill="none" stroke="#77aeef" stroke-width="3"/>' },
  { top: "#f897c1", bottom: "#db5e9a", art: '<g fill="#fff4d8"><ellipse cx="32" cy="22" rx="8" ry="13"/><ellipse cx="32" cy="42" rx="8" ry="13"/><ellipse cx="22" cy="32" rx="13" ry="8"/><ellipse cx="42" cy="32" rx="13" ry="8"/></g><circle cx="32" cy="32" r="8" fill="#ffc755"/>' },
  { image: "./public/assets/games/pokor/cover.jpg", position: "44% center", top: "#bf785e", bottom: "#774b47" },
  { top: "#70ddda", bottom: "#259aa8", art: '<path d="m15 22 9 9 8-15 8 15 9-9-4 24H19Z" fill="#fff2b2"/><path d="M21 49h22" stroke="#fff2b2" stroke-width="3" stroke-linecap="round"/>' },
  { top: "#5c78b0", bottom: "#354e83", art: '<rect x="18" y="12" width="28" height="40" rx="5" fill="#fcf1dd" transform="rotate(8 32 32)"/><path d="M32 23c-4 5-9 8-9 12a5 5 0 0 0 8 3l-2 6h6l-2-6a5 5 0 0 0 8-3c0-4-5-7-9-12Z" fill="#354e83"/>' },
];

function previewMarkup(category) {
  if (category === "games") {
    return `<div class="pm-arcade__app-field">${Array.from({ length: 20 }, (_, index) => {
      const column = index % 5;
      const row = Math.floor(index / 5);
      const tile = APP_TILE_ART[(index * 3) % APP_TILE_ART.length];
      const artwork = tile.image
        ? `<img src="${tile.image}" alt="" draggable="false" decoding="async" style="object-position:${tile.position}">`
        : `<svg viewBox="0 0 64 64" fill="none" focusable="false">${tile.art}</svg>`;
      return `<span class="pm-arcade__app-tile" style="--tile-column:${column - 2};--tile-row:${row - 1.5 + (column % 2 ? 0.42 : 0)};--tile-top:${tile.top};--tile-bottom:${tile.bottom};--float-time:${5.1 + (index % 7) * 0.63}s;--float-delay:${-index * 0.79}s;--float-x:${index % 2 ? 2 : -2}px;--float-y:${-3 - index % 3}px;--tile-turn:${(index % 3) - 1}deg">${artwork}</span>`;
    }).join("")}</div>`;
  }
  if (category === "interfaces") {
    return `<div class="pm-arcade__interface-field">
      <div class="pm-arcade__mini-window pm-arcade__mini-window--back"><span class="pm-arcade__window-toolbar"><i></i><i></i><i></i></span><div class="pm-arcade__mini-palette"><b></b><b></b><b></b><b></b></div><div class="pm-arcade__mini-lines"><i></i><i></i></div></div>
      <div class="pm-arcade__mini-window pm-arcade__mini-window--front"><span class="pm-arcade__window-toolbar"><i></i><i></i><i></i></span><div class="pm-arcade__mini-landscape"><span></span></div><div class="pm-arcade__mini-lines"><i></i><i></i></div></div>
      <div class="pm-arcade__mini-phone"><span></span><div class="pm-arcade__mini-orbit"></div><i></i><i></i><b></b></div>
    </div>`;
  }
  return `<div class="pm-arcade__paper-field">
    <div class="pm-arcade__mini-paper pm-arcade__mini-paper--back"><div class="pm-arcade__paper-diagram"><i></i><i></i><i></i></div><span></span><span></span><span></span></div>
    <div class="pm-arcade__mini-paper pm-arcade__mini-paper--front"><div class="pm-arcade__paper-chart"><i></i><i></i><i></i><i></i><i></i></div><span></span><span></span><span></span></div>
    <div class="pm-arcade__mini-swatch"><span></span><span></span><span></span></div>
  </div>`;
}

const STYLES = `
  .pm-arcade { position: absolute; inset: 0; overflow: hidden; color: #f0f0f0; background: #000; isolation: isolate; }
  .pm-arcade__frame { position: absolute; inset: 0; overflow: hidden; background: #000; }
  .pm-arcade.is-cutting-out .pm-arcade__frame { animation: pm-arcade-cutout 420ms steps(8, end) both; }
  .pm-arcade.is-cutting-out::before { content: ''; position: absolute; z-index: 20; inset: 0; pointer-events: none; opacity: 0; background: repeating-radial-gradient(circle at 17% 23%, #fff 0 1px, transparent 1px 3px), repeating-linear-gradient(0deg, #fff0 0 2px, #fff2 2px 3px, #0002 3px 5px); mix-blend-mode: screen; animation: pm-arcade-static 420ms steps(9, end) both; }
  .pm-arcade.is-cutting-out::after { content: ''; position: absolute; z-index: 21; inset: 0; pointer-events: none; background: #fff; opacity: 0; animation: pm-arcade-flash 420ms steps(6, end) both; }
  .pm-arcade__canvas { display: block; position: absolute; inset: 0; width: 100%; height: 100%; outline: none; touch-action: none; }
  .pm-arcade__canvas:focus-visible { outline: none; }
  .pm-arcade__boot { position: absolute; z-index: 30; inset: 0; overflow: hidden; pointer-events: none; background: #000; animation: pm-arcade-boot-cover 900ms steps(10, end) both; }
  .pm-arcade__boot::before { content: ''; position: absolute; inset: 0; background: repeating-linear-gradient(0deg, #fff0 0 2px, #fff2 2px 3px, #0003 3px 5px), repeating-radial-gradient(circle at 24% 36%, #fff 0 1px, transparent 1px 4px); mix-blend-mode: screen; animation: pm-arcade-boot-noise 900ms steps(9, end) both; }
  .pm-arcade__boot::after { content: ''; position: absolute; left: 0; right: 0; top: 50%; height: 3px; opacity: 0; background: #fff; box-shadow: 0 0 22px 5px #fff9; transform: scaleX(.02); animation: pm-arcade-boot-line 600ms steps(8, end) 80ms both; }
  .pm-arcade__fallback { display: none; pointer-events: none; border-radius: 7% / 9%; }
  .pm-arcade.is-fallback .pm-arcade__canvas:first-child { opacity: 0; }
  .pm-arcade.is-fallback .pm-arcade__fallback { display: block; }
  .pm-arcade.is-fallback .pm-arcade__frame::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: repeating-linear-gradient(0deg,#0001 0 1px,transparent 1px 3px); box-shadow: inset 0 0 8vw 4vw #000b; border-radius: 7% / 9%; }
  .pm-arcade__hud { position: absolute; z-index: 3; left: clamp(24px,5vw,80px); right: clamp(24px,5vw,80px); bottom: max(32px,env(safe-area-inset-bottom)); display: flex; align-items: center; justify-content: space-between; gap: 16px; pointer-events: none; }
  .pm-arcade__keys { display: flex; align-items: center; gap: 20px; margin: 0; color: #969696; font-size: 12px; }
  .pm-arcade__keys span { display: flex; align-items: center; gap: 8px; white-space: nowrap; }
  .pm-arcade__keys kbd { color: #dedede; font: inherit; }
  .pm-arcade__mode { pointer-events: auto; }
  .pm-arcade__touch { display: none; gap: 10px; pointer-events: auto; }
  .pm-arcade__touch button { display: grid; place-items: center; width: 52px; height: 52px; border: 1px solid #ffffff32; border-radius: 50%; background: #ffffff0c; color: #e6e6e6; font: 21px/1 sans-serif; touch-action: none; -webkit-user-select: none; user-select: none; cursor: pointer; backdrop-filter: blur(14px); }
  .pm-arcade__touch button:active { background: #fff3; }
  .pm-arcade__touch button[data-control="jump"] { margin-left: 16px; }
  .pm-arcade button:focus-visible { outline: 2px solid #fff; outline-offset: 4px; }
  .pm-arcade__sr { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
  .pm-arcade__access:focus-within { z-index: 6; top: 90px; left: 24px; width: auto; height: auto; margin: 0; clip: auto; overflow: visible; display: flex; gap: 8px; background: #111; padding: 12px; border-radius: 12px; }
  .pm-arcade__access button { font: inherit; padding: 8px 14px; border: 0; background: #eee; color: #111; border-radius: 6px; cursor: pointer; }
  @keyframes pm-arcade-cutout { 0%, 100% { opacity: 1; filter: none; transform: none; } 13% { opacity: .35; filter: contrast(1.7) brightness(1.55); transform: translateX(-2px); } 29% { opacity: .92; filter: contrast(1.3); transform: translateX(3px); } 47% { opacity: .16; filter: brightness(2.2); transform: translateX(-1px) skewX(-.4deg); } 64% { opacity: .68; filter: contrast(2.2); transform: translateX(2px); } 82% { opacity: .08; filter: brightness(2.8); transform: scaleY(.995); } }
  @keyframes pm-arcade-static { 0%, 100% { opacity: 0; background-position: 0 0, 0 0; } 18% { opacity: .72; background-position: 13px -9px, 0 4px; } 39% { opacity: .28; background-position: -17px 11px, 0 -2px; } 57% { opacity: .88; background-position: 9px 3px, 0 7px; } 76% { opacity: .42; background-position: -11px -5px, 0 -4px; } }
  @keyframes pm-arcade-flash { 0%, 62%, 100% { opacity: 0; } 67% { opacity: .8; } 72% { opacity: .08; } }
  @keyframes pm-arcade-boot-cover { 0%, 58% { opacity: 1; clip-path: inset(0); } 72% { opacity: .98; clip-path: inset(49.5% 0); } 100% { opacity: 0; clip-path: inset(49.5% 0); } }
  @keyframes pm-arcade-boot-noise { 0%, 100% { opacity: .12; background-position: 0 0, 0 0; } 24% { opacity: .7; background-position: 0 8px, 12px -9px; } 47% { opacity: .3; background-position: 0 -5px, -16px 7px; } 69% { opacity: .82; background-position: 0 3px, 9px 4px; } }
  @keyframes pm-arcade-boot-line { 0% { opacity: 0; transform: scaleX(.02); } 25% { opacity: 1; transform: scaleX(.2); } 62% { opacity: 1; transform: scaleX(1); } 100% { opacity: 0; transform: scaleX(1); } }
  @media (pointer: coarse), (max-width: 700px) { .pm-arcade__touch { display: flex; flex: 1; min-width: 0; } .pm-arcade__keys { display: none; } .pm-arcade__hud { left: 24px; right: 24px; bottom: max(30px,env(safe-area-inset-bottom)); } .pm-arcade__mode { flex-shrink: 0; margin-left: 12px; } .pm-arcade__mode .mode-switch button { padding-inline: 10px; } .pm-arcade__touch button[data-control="jump"] { margin-left: auto; } }
  @media (max-height: 600px) { .pm-arcade__hud { bottom: 15px; } }
  @media (prefers-reduced-motion: reduce) { .pm-arcade.is-cutting-out .pm-arcade__frame, .pm-arcade.is-cutting-out::before, .pm-arcade.is-cutting-out::after, .pm-arcade__boot, .pm-arcade__boot::before, .pm-arcade__boot::after { animation-duration: 1ms; animation-delay: 0ms; } }
`;

/** Only the card's Enter button selects a category; hitting a brick reveals it. */
export function mountArcade(
  container,
  { onCategory = () => {}, modeMarkup = "" } = {},
) {
  const cardIdPrefix = `pm-arcade-${++arcadeInstanceCount}-card`;
  const root = document.createElement("section");
  root.className = "pm-arcade";
  root.setAttribute("aria-label", "街机");
  root.innerHTML = `
    <style>${STYLES}</style>
    <div class="pm-arcade__frame">
      <canvas class="pm-arcade__canvas" tabindex="0" role="application" aria-label="方向键移动，空格跳跃。顶起或点击问号查看分类卡片。"></canvas>
      <canvas class="pm-arcade__canvas pm-arcade__fallback" aria-hidden="true"></canvas>
      <nav class="pm-arcade__sr pm-arcade__access" aria-label="分类卡片">
        ${PORTALS.map((portal) => `<button type="button" data-category="${portal.id}" aria-expanded="false" aria-controls="${cardIdPrefix}-${portal.id}">${portal.title}</button>`).join("")}
      </nav>
      <span class="pm-arcade__sr" role="status" aria-live="polite"></span>
    </div>
    ${PORTALS.map((portal) => `<aside class="pm-arcade__card" data-category="${portal.id}" id="${cardIdPrefix}-${portal.id}" hidden aria-label="${portal.title}作品分类卡片">
      <div class="pm-arcade__preview pm-arcade__preview--${portal.id}" aria-hidden="true">${previewMarkup(portal.id)}</div>
      <div class="pm-arcade__card-row"><h2>${portal.title}</h2></div>
      <button class="pm-arcade__enter" type="button" aria-label="进入${portal.title}"><span>进入</span><span aria-hidden="true">↗</span></button>
    </aside>`).join("")}
    <div class="pm-arcade__hud">
      <p class="pm-arcade__keys"><span><kbd>← →</kbd> 移动</span><span><kbd>SPACE</kbd> 跳跃</span></p>
      <div class="pm-arcade__touch" aria-label="触控操作">
        <button type="button" data-control="left" aria-label="向左">←</button>
        <button type="button" data-control="right" aria-label="向右">→</button>
        <button type="button" data-control="jump" aria-label="跳跃">↑</button>
      </div>
      <div class="pm-arcade__mode">${modeMarkup}</div>
    </div>
    <div class="pm-arcade__boot" aria-hidden="true"></div>`;
  container.append(root);
  root.classList.add("is-booting");
  const canvas = root.querySelector("canvas");
  const fallbackCanvas = root.querySelector(".pm-arcade__fallback");
  const source = document.createElement("canvas");
  const context = source.getContext("2d", { alpha: false });
  const fallback = fallbackCanvas.getContext("2d", { alpha: false });
  if (!context || !fallback) {
    root.remove();
    throw new Error("A 2D canvas is required.");
  }
  const crt = createCRT(canvas, source);
  let useCRT = Boolean(crt);
  root.classList.toggle("is-fallback", !useCRT);
  root.dataset.renderer = useCRT ? "webgl-crt" : "canvas-2d";
  const cards = new Map(
    [...root.querySelectorAll(".pm-arcade__card")].map((card) => [card.dataset.category, card]),
  );
  const categoryButtons = new Map(
    [...root.querySelectorAll(".pm-arcade__access [data-category]")].map((button) => [button.dataset.category, button]),
  );
  const openCards = new Set();
  const status = root.querySelector('[role="status"]');
  const portals = PORTALS.map((portal) => ({ ...portal }));
  const motionPreference = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );
  let reducedMotion = motionPreference.matches;
  let bootTimer = window.setTimeout(
    () => root.classList.remove("is-booting"),
    reducedMotion ? 0 : 920,
  );
  let destroyed = false,
    frame = 0,
    previousTime = 0,
    elapsed = 0,
    accumulator = 0;
  let hovered = null;
  let viewWidth = WORLD.width,
    cameraX = 0,
    renderScale = 1,
    cssWidth = 1,
    cssHeight = 1,
    currentCardWidth = 0;
  const keys = { left: false, right: false },
    pressed = new Set(),
    touchDirections = new Map();
  const particles = [],
    listeners = [];
  const player = {
    x: 188,
    y: WORLD.ground - 43,
    width: 28,
    height: 43,
    vx: 0,
    vy: 0,
    grounded: true,
    facing: 1,
    walk: 0,
    jumpBuffer: 0,
    coyote: 0.1,
  };
  const listen = (target, event, handler, options) => {
    target.addEventListener(event, handler, options);
    listeners.push(() => target.removeEventListener(event, handler, options));
  };
  const rect = (x, y, width, height, fill) => {
    context.fillStyle = fill;
    context.fillRect(
      Math.round(x),
      Math.round(y),
      Math.round(width),
      Math.round(height),
    );
  };
  const line = (x1, y1, x2, y2, stroke, width = 1) => {
    context.strokeStyle = stroke;
    context.lineWidth = width;
    context.beginPath();
    context.moveTo(Math.round(x1), Math.round(y1));
    context.lineTo(Math.round(x2), Math.round(y2));
    context.stroke();
  };
  const polygon = (points, color) => {
    context.beginPath();
    points.forEach(([x, y], index) =>
      index ? context.lineTo(x, y) : context.moveTo(x, y),
    );
    context.closePath();
    context.fillStyle = color;
    context.fill();
  };
  const label = (value, x, y, size = 15, fill = "#bcbcbc") => {
    context.font = `500 ${size}px "SF Pro Text", "Helvetica Neue", "Microsoft YaHei", sans-serif`;
    context.textAlign = "center";
    context.fillStyle = fill;
    context.fillText(value, Math.round(x), Math.round(y));
  };
  function getCameraTarget() {
    if (viewWidth >= WORLD.width) return (WORLD.width - viewWidth) / 2;
    return Math.max(
      0,
      Math.min(
        WORLD.width - viewWidth,
        player.x + player.width / 2 - viewWidth * 0.34,
      ),
    );
  }
  function resize() {
    const bounds = canvas.getBoundingClientRect();
    cssWidth = Math.max(1, bounds.width);
    cssHeight = Math.max(1, bounds.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width =
      fallbackCanvas.width =
      source.width =
        Math.round(cssWidth * dpr);
    canvas.height =
      fallbackCanvas.height =
      source.height =
        Math.round(cssHeight * dpr);
    context.imageSmoothingEnabled = false;
    fallback.imageSmoothingEnabled = false;
    viewWidth = (WORLD.height * cssWidth) / cssHeight;
    renderScale = source.height / WORLD.height;
    cameraX = getCameraTarget();
    positionCards();
  }
  function closeCard(portal) {
    if (!openCards.delete(portal.id)) return;
    const card = cards.get(portal.id);
    card.hidden = true;
    status.textContent = `${portal.title}，卡片已收起`;
    categoryButtons.get(portal.id).setAttribute("aria-expanded", "false");
    canvas.focus({ preventScroll: true });
  }
  function activate(portal) {
    if (!portal || destroyed) return;
    portal.bump = 0.32;
    if (openCards.has(portal.id)) {
      closeCard(portal);
      return;
    }
    openCards.add(portal.id);
    const card = cards.get(portal.id);
    categoryButtons.get(portal.id).setAttribute("aria-expanded", "true");
    card.hidden = false;
    card.style.animation = "none";
    void card.offsetWidth;
    card.style.removeProperty("animation");
    status.textContent = `${portal.title}，卡片已展开。再次顶起或点击同一方块可收起。`;
    for (let i = 0; i < 10; i += 1) {
      const angle = -Math.PI + (i * Math.PI) / 9;
      particles.push({
        x: portal.x,
        y: portal.y,
        vx: Math.cos(angle) * 90,
        vy: Math.sin(angle) * 130 - 20,
        life: 0.5,
      });
    }
    positionCards();
  }
  function positionCards() {
    const anchors = portals.map((portal) => {
      const u = (portal.x - cameraX) / viewWidth,
        v = (portal.y - 5) / WORLD.height;
      const point = useCRT ? sceneToScreen(u, v) : { x: u, y: v };
      const rawX = point.x * cssWidth;
      return { portal, point, rawX, brickVisible: rawX >= 0 && rawX <= cssWidth };
    });
    const visibleCenters = anchors.filter((anchor) => anchor.brickVisible).map((anchor) => anchor.rawX);
    let cardWidth = cssHeight < 600 ? 230 : 274;
    if (visibleCenters.length > 1) {
      const gap = Math.min(
        ...visibleCenters.slice(1).map((x, index) => x - visibleCenters[index]),
      );
      const availableWidth = (cssWidth - 36 - (visibleCenters.length - 1) * 16) / visibleCenters.length;
      cardWidth = Math.floor(Math.min(cardWidth, gap - 16, availableWidth));
    }
    if (cardWidth !== currentCardWidth) {
      currentCardWidth = cardWidth;
      root.style.setProperty("--pm-arcade-card-width", `${cardWidth}px`);
      root.classList.toggle("has-compact-cards", cardWidth < 230);
    }
    const placements = [];
    for (const { portal, point, rawX, brickVisible } of anchors) {
      if (!openCards.has(portal.id)) continue;
      const card = cards.get(portal.id);
      const width = card.offsetWidth || 274,
        height = card.offsetHeight || 224;
      // Keep visible bricks' controls usable. Once a brick leaves the screen,
      // its card keeps its world anchor instead of piling up at the viewport edge.
      const x = brickVisible
        ? Math.max(width / 2 + 18, Math.min(cssWidth - width / 2 - 18, rawX))
        : rawX;
      const top = Math.max(
        cssHeight < 600 ? 78 : 94,
        point.y * cssHeight - height - 20,
      );
      placements.push({ card, width, rawX, x, top, brickVisible });
    }
    // Edge accommodation must consider neighbouring open cards together: moving
    // only the rightmost card inward can otherwise cover the middle card's button.
    const visibleCards = placements.filter((placement) => placement.brickVisible);
    for (let i = visibleCards.length - 2; i >= 0; i -= 1) {
      const current = visibleCards[i], next = visibleCards[i + 1];
      current.x = Math.min(current.x, next.x - (current.width + next.width) / 2 - 16);
    }
    if (visibleCards.length) {
      const first = visibleCards[0];
      const shift = Math.max(0, 18 + first.width / 2 - first.x);
      if (shift) visibleCards.forEach((placement) => { placement.x += shift; });
    }
    // Read all card dimensions before updating positions to avoid layout thrashing.
    for (const { card, width, rawX, x, top, brickVisible } of placements) {
      card.style.left = `${x}px`;
      card.style.top = `${top}px`;
      card.style.setProperty(
        "--tail-x",
        `${Math.max(24, Math.min(width - 24, rawX - x + width / 2))}px`,
      );
      card.style.zIndex = brickVisible ? "6" : "5";
      card.inert = !brickVisible;
    }
  }
  function clearInputs() {
    pressed.clear();
    touchDirections.clear();
    keys.left = keys.right = false;
    player.jumpBuffer = 0;
    player.vx = 0;
  }
  function syncDirections() {
    keys.left =
      pressed.has("ArrowLeft") ||
      pressed.has("KeyA") ||
      [...touchDirections.values()].includes("left");
    keys.right =
      pressed.has("ArrowRight") ||
      pressed.has("KeyD") ||
      [...touchDirections.values()].includes("right");
  }
  const controlledCodes = new Set([
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "KeyA",
    "KeyD",
    "KeyW",
    "Space",
  ]);
  listen(canvas, "keydown", (event) => {
    if (
      !controlledCodes.has(event.code) ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    )
      return;
    event.preventDefault();
    if (
      ["ArrowUp", "KeyW", "Space"].includes(event.code) &&
      !pressed.has(event.code)
    )
      player.jumpBuffer = 0.14;
    pressed.add(event.code);
    syncDirections();
  });
  listen(canvas, "keyup", (event) => {
    if (!controlledCodes.has(event.code)) return;
    event.preventDefault();
    pressed.delete(event.code);
    syncDirections();
  });
  listen(canvas, "blur", clearInputs);
  listen(window, "blur", clearInputs);
  listen(document, "visibilitychange", () => {
    if (document.hidden) clearInputs();
  });
  listen(motionPreference, "change", (event) => {
    reducedMotion = event.matches;
  });
  listen(canvas, "webglcontextlost", (event) => {
    event.preventDefault();
    useCRT = false;
    root.classList.add("is-fallback");
    root.dataset.renderer = "canvas-2d";
  });
  function portalAt(event) {
    const bounds = canvas.getBoundingClientRect();
    const u = (event.clientX - bounds.left) / bounds.width,
      v = (event.clientY - bounds.top) / bounds.height;
    const point = useCRT ? screenToScene(u, v) : { x: u, y: v };
    const x = point.x * viewWidth + cameraX,
      y = point.y * WORLD.height;
    return portals.find(
      (portal) =>
        Math.abs(x - portal.x) < 47 &&
        y >= portal.y - 45 &&
        y <= portal.y + portal.height + 12,
    );
  }
  listen(canvas, "pointermove", (event) => {
    hovered = portalAt(event)?.id || null;
    canvas.style.cursor = hovered ? "pointer" : "default";
  });
  listen(canvas, "pointerleave", () => {
    hovered = null;
    canvas.style.cursor = "default";
  });
  listen(canvas, "click", (event) => {
    canvas.focus({ preventScroll: true });
    const portal = portalAt(event);
    if (portal) activate(portal);
  });
  cards.forEach((card, category) => {
    listen(card, "pointerdown", (event) => event.stopPropagation());
    listen(card, "click", (event) => event.stopPropagation());
    listen(card.querySelector(".pm-arcade__enter"), "click", () => {
      if (openCards.has(category)) onCategory(category);
    });
  });
  categoryButtons.forEach((button, category) => {
    listen(button, "click", () => {
      activate(portals.find((item) => item.id === category));
      const card = cards.get(category);
      if (!card.hidden && !card.inert) {
        card.querySelector(".pm-arcade__enter").focus({ preventScroll: true });
      }
    });
  });
  root.querySelectorAll("[data-control]").forEach((button) => {
    listen(button, "pointerdown", (event) => {
      event.preventDefault();
      canvas.focus({ preventScroll: true });
      button.setPointerCapture(event.pointerId);
      const control = button.dataset.control;
      if (control === "jump") player.jumpBuffer = 0.14;
      else touchDirections.set(event.pointerId, control);
      syncDirections();
    });
    const release = (event) => {
      touchDirections.delete(event.pointerId);
      syncDirections();
    };
    listen(button, "pointerup", release);
    listen(button, "pointercancel", release);
    listen(button, "lostpointercapture", release);
    listen(button, "keydown", (event) => {
      if (!["Space", "Enter"].includes(event.code)) return;
      event.preventDefault();
      const control = button.dataset.control;
      if (control === "jump" && !event.repeat) player.jumpBuffer = 0.14;
      else if (control !== "jump") touchDirections.set("keyboard", control);
      syncDirections();
    });
    listen(button, "keyup", (event) => {
      if (!["Space", "Enter"].includes(event.code)) return;
      event.preventDefault();
      touchDirections.delete("keyboard");
      syncDirections();
    });
    listen(button, "blur", () => {
      touchDirections.delete("keyboard");
      syncDirections();
    });
  });
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  listen(window, "resize", resize);
  resize();

  function update(dt) {
    elapsed += dt;
    const direction = Number(keys.right) - Number(keys.left);
    player.vx +=
      (direction * 260 - player.vx) *
      Math.min(1, dt * (player.grounded ? 22 : 10));
    if (direction) player.facing = direction;
    player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
    player.coyote = player.grounded ? 0.1 : Math.max(0, player.coyote - dt);
    if (player.jumpBuffer > 0 && player.coyote > 0) {
      player.vy = -690;
      player.grounded = false;
      player.jumpBuffer = 0;
      player.coyote = 0;
    }
    const solids = portals.map((portal) => ({
      x: portal.x - 31,
      y: portal.y,
      width: 62,
      height: 62,
      portal,
    }));
    player.x = Math.max(
      28,
      Math.min(WORLD.width - player.width - 28, player.x + player.vx * dt),
    );
    for (const solid of solids) {
      if (
        player.x + player.width > solid.x &&
        player.x < solid.x + solid.width &&
        player.y + player.height > solid.y + 0.5 &&
        player.y < solid.y + solid.height - 0.5
      ) {
        if (player.vx > 0) player.x = solid.x - player.width;
        else if (player.vx < 0) player.x = solid.x + solid.width;
        player.vx = 0;
      }
    }
    const oldY = player.y;
    player.vy += 1750 * dt;
    player.y += player.vy * dt;
    player.grounded = false;
    for (const solid of solids) {
      if (
        player.x + player.width <= solid.x ||
        player.x >= solid.x + solid.width
      )
        continue;
      if (
        player.vy >= 0 &&
        oldY + player.height <= solid.y + 0.5 &&
        player.y + player.height >= solid.y
      ) {
        player.y = solid.y - player.height;
        player.vy = 0;
        player.grounded = true;
      } else if (
        player.vy < 0 &&
        oldY >= solid.y + solid.height - 0.5 &&
        player.y <= solid.y + solid.height
      ) {
        player.y = solid.y + solid.height;
        player.vy = 0;
        activate(solid.portal);
      }
    }
    if (player.y + player.height >= WORLD.ground) {
      player.y = WORLD.ground - player.height;
      player.vy = 0;
      player.grounded = true;
    }
    player.walk =
      player.grounded && Math.abs(player.vx) > 15 ? player.walk + dt * 14 : 0;
    for (const portal of portals) portal.bump = Math.max(0, portal.bump - dt);
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const particle = particles[i];
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 460 * dt;
      particle.life -= dt;
      if (particle.life <= 0) particles.splice(i, 1);
    }
    cameraX += (getCameraTarget() - cameraX) * Math.min(1, dt * 8);
  }

  function drawBackground() {
    const left = cameraX - 20;
    rect(left, 0, viewWidth + 40, WORLD.height, "#111111");
    // A deep industrial nave: distant wall, recessed bays, structural ribs.
    rect(left, 145, viewWidth + 40, 355, "#171717");
    for (let bay = -1; bay < 6; bay += 1) {
      const x = bay * 320;
      rect(x + 54, 194, 212, 281, "#0e0e0e");
      rect(x + 61, 201, 198, 265, "#131313");
      rect(x + 72, 215, 176, 232, "#161616");
      rect(x + 94, 254, 132, 165, "#121212");
      rect(x + 106, 268, 108, 139, "#101010");
      rect(x + 157, 270, 4, 135, "#222222");
      rect(x + 104, 336, 112, 3, "#202020");
      rect(x + 24, 138, 17, 352, "#292929");
      rect(x + 28, 142, 4, 343, "#363636");
      rect(x + 41, 145, 5, 342, "#0c0c0c");
      rect(x + 16, 173, 31, 12, "#323232");
      rect(x + 16, 459, 31, 16, "#303030");
      for (let bolt = 0; bolt < 2; bolt += 1) {
        rect(x + 20 + bolt * 20, 176, 3, 3, "#737373");
        rect(x + 20 + bolt * 20, 463, 3, 3, "#6a6a6a");
      }
    }
    rect(left, 124, viewWidth + 40, 12, "#3c3c3c");
    rect(left, 136, viewWidth + 40, 6, "#090909");
    rect(left, 143, viewWidth + 40, 5, "#525252");
    rect(left, 161, viewWidth + 40, 3, "#242424");
    // Ceiling conduits and monochrome lamps.
    for (let x = -320; x < 1800; x += 320) {
      polygon(
        [
          [x + 20, 0],
          [x + 74, 0],
          [x + 155, 122],
          [x + 139, 122],
        ],
        "#202020",
      );
      line(x + 23, 0, x + 141, 123, "#3a3a3a", 3);
      rect(x + 175, 105, 90, 9, "#646464");
      rect(x + 182, 108, 76, 3, "#bdbdbd");
      polygon(
        [
          [x + 184, 116],
          [x + 257, 116],
          [x + 290, 220],
          [x + 140, 220],
        ],
        "#1c1c1c",
      );
    }
    // Machinery without invented readouts or decorative copy.
    for (const x of [92, 440, 752, 1100]) {
      rect(x, 448, 85, 112, "#262626");
      rect(x + 5, 453, 75, 103, "#1b1b1b");
      rect(x + 12, 464, 61, 36, "#111111");
      for (let i = 0; i < 7; i += 1)
        rect(x + 14 + i * 8, 466, 3, 31, "#353535");
      rect(x + 15, 515, 45, 3, "#4c4c4c");
      rect(x + 15, 524, 45, 3, "#363636");
      rect(x + 64, 515, 6, 6, "#a9a9a9");
      rect(x - 7, 558, 98, 9, "#404040");
    }
    rect(left, 494, viewWidth + 40, 5, "#454545");
    rect(left, 500, viewWidth + 40, 7, "#0a0a0a");
    rect(left, 508, viewWidth + 40, 3, "#313131");
    for (let x = -120; x < 1500; x += 160) {
      rect(x, 511, 6, 57, "#292929");
      line(x + 7, 513, x + 65, 567, "#222222", 6);
    }
    rect(left, WORLD.ground, viewWidth + 40, 6, "#adadad");
    rect(left, WORLD.ground + 6, viewWidth + 40, 7, "#3b3b3b");
    rect(left, WORLD.ground + 13, viewWidth + 40, 14, "#101010");
    rect(left, WORLD.ground + 27, viewWidth + 40, 3, "#4a4a4a");
    rect(left, WORLD.ground + 30, viewWidth + 40, 150, "#171717");
    for (let x = -200; x < 1600; x += 64) {
      rect(x, WORLD.ground + 8, 35, 2, "#757575");
      line(x, WORLD.ground + 32, 640 + (x - 640) * 1.4, 720, "#2d2d2d", 2);
    }
    for (const y of [610, 632, 664, 708])
      rect(left, y, viewWidth + 40, 1, "#2b2b2b");
    polygon(
      [
        [-120, 0],
        [19, 0],
        [55, 117],
        [55, 720],
        [-120, 720],
      ],
      "#0b0b0b",
    );
    polygon(
      [
        [1400, 0],
        [1261, 0],
        [1225, 117],
        [1225, 720],
        [1400, 720],
      ],
      "#0b0b0b",
    );
    rect(51, 151, 4, 410, "#272727");
    rect(1225, 151, 4, 410, "#272727");
  }

  function drawCategoryGlyph(category, x, y) {
    context.save();
    context.translate(x, y);
    context.strokeStyle = "#65400e";
    context.fillStyle = "#65400e";
    context.lineWidth = 2.6;
    context.lineJoin = "round";
    context.lineCap = "round";
    if (category === "games") {
      context.beginPath();
      context.moveTo(-13, -9);
      context.lineTo(13, -9);
      context.lineTo(17, -5);
      context.lineTo(21, 11);
      context.lineTo(17, 15);
      context.lineTo(11, 15);
      context.lineTo(5, 8);
      context.lineTo(-5, 8);
      context.lineTo(-11, 15);
      context.lineTo(-17, 15);
      context.lineTo(-21, 11);
      context.lineTo(-17, -5);
      context.closePath();
      context.stroke();
      context.fillRect(-14, -1, 10, 3);
      context.fillRect(-10.5, -4.5, 3, 10);
      for (const [cx, cy] of [[10, -2], [15, 3]]) {
        context.beginPath();
        context.arc(cx, cy, 2.1, 0, Math.PI * 2);
        context.fill();
      }
    } else if (category === "interfaces") {
      context.strokeRect(-18, -13, 36, 28);
      context.beginPath();
      context.moveTo(-18, -5);
      context.lineTo(18, -5);
      context.moveTo(-7, -5);
      context.lineTo(-7, 15);
      context.moveTo(-1, 2);
      context.lineTo(12, 2);
      context.moveTo(-1, 8);
      context.lineTo(7, 8);
      context.stroke();
      for (const cx of [-12, -7, -2]) context.fillRect(cx, -10, 2, 2);
    } else {
      context.beginPath();
      context.moveTo(-10, -15);
      context.lineTo(6, -15);
      context.lineTo(15, -6);
      context.lineTo(15, 17);
      context.lineTo(-10, 17);
      context.closePath();
      context.moveTo(6, -15);
      context.lineTo(6, -6);
      context.lineTo(15, -6);
      context.moveTo(-16, -9);
      context.lineTo(-16, 17);
      context.moveTo(-4, 1);
      context.lineTo(8, 1);
      context.moveTo(-4, 7);
      context.lineTo(8, 7);
      context.moveTo(-4, 12);
      context.lineTo(4, 12);
      context.stroke();
    }
    context.restore();
  }

  function drawPortal(portal) {
    const y =
      portal.y -
      (reducedMotion ? 0 : Math.sin((portal.bump / 0.32) * Math.PI) * 11);
    const opened = openCards.has(portal.id);
    const active = hovered === portal.id || opened;
    const near = Math.abs(player.x + 14 - portal.x) < 80;
    rect(portal.x - 51, portal.y + 68, 102, 5, "#080808");
    rect(portal.x - 41, portal.y + 71, 82, 4, "#383838");
    rect(portal.x - 33, y + 4, 66, 64, "#090909");
    rect(portal.x - 31, y, 62, 60, opened ? "#dd9d2b" : active ? "#e5e5e5" : "#bfbfbf");
    rect(portal.x - 28, y + 3, 56, 4, opened ? "#fff2a5" : "#f7f7f7");
    rect(portal.x - 28, y + 7, 56, 49, opened ? "#b67b1c" : active ? "#c9c9c9" : "#8a8a8a");
    if (opened) {
      const gold = context.createLinearGradient(0, y + 10, 0, y + 53);
      gold.addColorStop(0, "#ffe89a");
      gold.addColorStop(0.45, "#f7c959");
      gold.addColorStop(1, "#e9ac35");
      rect(portal.x - 25, y + 10, 50, 43, gold);
      rect(portal.x - 28, y + 7, 3, 46, "#fbe4a1");
    } else {
      rect(portal.x - 25, y + 10, 50, 43, active ? "#e2e2e2" : "#a5a5a5");
    }
    rect(portal.x - 27, y + 56, 54, 4, opened ? "#795016" : "#595959");
    for (const [x, py] of [
      [-23, 10],
      [20, 10],
      [-23, 49],
      [20, 49],
    ])
      rect(portal.x + x, y + py, 3, 3, opened ? "#91601b" : "#4c4c4c");
    if (opened) {
      drawCategoryGlyph(portal.id, portal.x, y + 30);
    } else {
      const sprite = [
        "01110",
        "11011",
        "00011",
        "00110",
        "00100",
        "00000",
        "00100",
      ];
      sprite.forEach((row, rowIndex) =>
        [...row].forEach((pixel, column) => {
          if (pixel === "1")
            rect(portal.x - 10 + column * 4, y + 15 + rowIndex * 4, 4, 4, "#1b1b1b");
        }),
      );
    }
    if (!opened) {
      label(
        portal.title,
        portal.x,
        portal.y - 23,
        17,
        active || near ? "#f0f0f0" : "#a0a0a0",
      );
    }
    rect(
      portal.x - 29,
      WORLD.ground - 3,
      58,
      3,
      active || near ? "#f1f1f1" : "#6b6b6b",
    );
    if (near && !opened) {
      rect(portal.x - 2, WORLD.ground - 22, 4, 10, "#a7a7a7");
      rect(portal.x - 5, WORLD.ground - 20, 10, 3, "#a7a7a7");
    }
  }
  function drawPlayer() {
    const stride = player.walk ? Math.sin(player.walk) * 3 : 0;
    const x = Math.round(player.x),
      y = Math.round(
        player.y + (player.grounded ? Math.abs(stride) * -0.4 : 0),
      );
    context.globalAlpha = 0.35;
    rect(x - 5, WORLD.ground - 2, 39, 3, "#000000");
    context.globalAlpha = 1;
    // Original monochrome milk-carton robot.
    rect(x + 18, y - 8, 3, 12, "#b5b5b5");
    rect(x + 18, y - 8, 10, 3, "#dedede");
    rect(x + 5, y, 18, 5, "#888888");
    rect(x + 2, y + 5, 24, 5, "#d5d5d5");
    rect(x, y + 10, 28, 25, "#808080");
    rect(x + 3, y + 10, 22, 24, "#e1e1e1");
    rect(x + 3, y + 10, 22, 3, "#ffffff");
    rect(x + 3, y + 27, 22, 7, "#a9a9a9");
    const face = player.facing === 1 ? 2 : -2;
    rect(x + 6 + face, y + 17, 4, 5, "#171717");
    rect(x + 16 + face, y + 17, 4, 5, "#171717");
    rect(x + 12 + face, y + 24, 4, 2, "#555555");
    rect(x - 4, y + 21 - stride / 2, 4, 10, "#999999");
    rect(x + 28, y + 21 + stride / 2, 4, 10, "#999999");
    rect(x + 4, y + 35, 6, 5 + Math.max(0, stride), "#a2a2a2");
    rect(x + 18, y + 35, 6, 5 + Math.max(0, -stride), "#a2a2a2");
    rect(x + 2, y + 39 + Math.max(0, stride), 8, 3, "#f1f1f1");
    rect(x + 18, y + 39 + Math.max(0, -stride), 8, 3, "#f1f1f1");
  }
  function draw() {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = "#000000";
    context.fillRect(0, 0, source.width, source.height);
    context.setTransform(
      renderScale,
      0,
      0,
      renderScale,
      -cameraX * renderScale,
      0,
    );
    drawBackground();
    for (const portal of portals) drawPortal(portal);
    drawPlayer();
    if (!reducedMotion)
      for (const particle of particles) {
        context.globalAlpha = Math.min(1, particle.life * 3);
        rect(particle.x, particle.y, 3, 3, "#e8e8e8");
      }
    context.globalAlpha = 1;
    if (useCRT && !crt.render(reducedMotion ? 0 : elapsed)) {
      useCRT = false;
      root.classList.add("is-fallback");
      root.dataset.renderer = "canvas-2d";
    }
    if (!useCRT) fallback.drawImage(source, 0, 0);
  }
  function tick(time) {
    if (destroyed) return;
    const dt = previousTime ? Math.min((time - previousTime) / 1000, 0.06) : 0;
    previousTime = time;
    if (!document.hidden) {
      accumulator += dt;
      while (accumulator >= 1 / 120) {
        update(1 / 120);
        accumulator -= 1 / 120;
      }
      positionCards();
      draw();
    }
    frame = requestAnimationFrame(tick);
  }
  draw();
  frame = requestAnimationFrame(tick);
  let leaving = false;
  let leaveTimer = 0;
  let leaveCallback = null;
  function cleanup() {
    if (destroyed) return;
    destroyed = true;
    clearTimeout(bootTimer);
    clearTimeout(leaveTimer);
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    listeners.forEach((remove) => remove());
    clearInputs();
    openCards.clear();
    cards.clear();
    categoryButtons.clear();
    crt?.destroy();
    source.width =
      source.height =
      fallbackCanvas.width =
      fallbackCanvas.height =
        1;
    root.remove();
  }
  cleanup.leave = (callback) => {
    if (destroyed) return;
    leaveCallback = callback;
    if (leaving) return;
    leaving = true;
    root.classList.add("is-cutting-out");
    const finish = () => {
      const next = leaveCallback;
      leaveCallback = null;
      cleanup();
      next?.();
    };
    if (reducedMotion) requestAnimationFrame(finish);
    else leaveTimer = window.setTimeout(finish, 420);
  };
  return cleanup;
}
