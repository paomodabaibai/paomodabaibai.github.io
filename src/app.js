import {
  profile,
  categories,
  getProject,
  getCategory,
  getProjects,
} from "./content.js";
import { mountArcade } from "./arcade.js";
import { createArcadeDisplay } from "./arcade-display.js";
import { mountIntroScreen } from "./intro-screen.js";
import { mountWorkCollections } from "./work-collections.js";
import { mountTitleParticles } from "./title-particles.js";
import { advanceAlbumMotion, albumPose, albumEdgeOpacity, fitAlbumLayout } from "./album-motion.js";
import { createContentTransition } from "./content-transition.js";
import { renderSiteHeader } from "./site-header.js";
import { mountProjectDetail } from "./project-detail.js";
const main = document.querySelector("#main"),
  header = document.querySelector("#header"),
  footer = document.querySelector("#footer");
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const announce = (text) => {
  document.querySelector("#announcer").textContent = text;
};
history.scrollRestoration = "manual";
let mode = "arcade";
let collectionOrigin = "/work";
let workCategory = "games";
let cleanup = () => {},
  lightbox;
const selections = {};
const expandedViews = new Set(["collection", "project"]);
const display = createArcadeDisplay(main);
const icon = (name) => {
  const paths = {
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    up: '<path d="m6 14 6-6 6 6"/>',
    down: '<path d="m6 10 6 6 6-6"/>',
    grid: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
    indie: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
    commercial: '<rect x="3" y="7" width="18" height="14" rx="3"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12a24 24 0 0 0 18 0M10 13v3h4v-3"/>',
    game: '<path d="M7 7h10a3 3 0 0 1 3 3l1 7a2 2 0 0 1-3 1l-3-3H9l-3 3a2 2 0 0 1-3-1l1-7a3 3 0 0 1 3-3Z"/><path d="M7 9v5m-2-2.5h4m6-1h.1m2 2h.1"/>',
    external:
      '<path d="M14 4h6v6M20 4l-9 9M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5"/>',
    back: '<path d="M19 12H5m6-6-6 6 6 6"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    screen:
      '<rect x="3" y="5" width="18" height="13" rx="2"/><path d="M8 21h8m-4-3v3M7 9h5m-5 4h9"/>',
    file: '<path d="M6 3h8l4 4v14H6V3Zm8 0v5h4M9 12h6m-6 4h6"/>',
    expand: '<path d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.arrow}</svg>`;
};
function navigate(path) {
  if (location.hash === "#" + path) render();
  else location.hash = path;
}
function modeSwitchMarkup() {
  return `<div class="mode-switch" role="group" aria-label="切换街机模式"><button data-mode="arcade" aria-pressed="${mode === "arcade"}">${icon("game")}<span>街机</span></button><button data-mode="normal" aria-pressed="${mode === "normal"}">${icon("grid")}<span>常规</span></button></div>`;
}
function bindModeSwitches(scope = document) {
  scope.querySelectorAll("[data-mode]").forEach((button) => {
    button.onclick = () => setMode(button.dataset.mode);
  });
}
function mountLandingBulletins(landing, render = () => {}) {
  const track = landing?.querySelector(".landing__bulletins-track");
  if (!track) return () => {};
  const messages = [...track.querySelectorAll(".landing__bulletin")].map((line) => line.textContent);
  track.replaceChildren();
  const active = [];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let index = 0;
  let timer = 0;
  let frame = 0;
  let alive = true;
  const renderFrames = (duration = 980) => {
    window.cancelAnimationFrame(frame);
    if (reducedMotion) {
      render(track);
      return;
    }
    const started = performance.now();
    const tick = (now) => {
      if (!alive) return;
      render(track);
      if (now - started < duration) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
  };
  const createLine = () => {
    const line = document.createElement("p");
    line.className = "landing__bulletin";
    line.textContent = messages[index % messages.length];
    index += 1;
    line.dataset.row = "0";
    line.style.setProperty("--bulletin-row", "0");
    track.append(line);
    active.push(line);
    render(track);
    requestAnimationFrame(() => {
      line.classList.add("is-visible");
      renderFrames();
    });
  };
  const push = () => {
    if (!alive) return;
    for (let i = active.length - 1; i >= 0; i -= 1) {
      const line = active[i];
      const row = Number(line.dataset.row || 0) + 1;
      line.dataset.row = String(row);
      line.style.setProperty("--bulletin-row", String(row));
      if (row >= 4) {
        active.splice(i, 1);
        line.classList.remove("is-visible");
        line.classList.add("is-leaving");
        window.setTimeout(() => {
          line.remove();
          render(track);
        }, 920);
      }
    }
    createLine();
    renderFrames();
    timer = window.setTimeout(push, 1900 + Math.random() * 900);
  };
  // Keep the first bulletin present immediately; subsequent messages still
  // arrive on the slower ticker so the stack has time to read.
  createLine();
  if (!reducedMotion) timer = window.setTimeout(push, 2200);
  return () => {
    alive = false;
    window.clearTimeout(timer);
    window.cancelAnimationFrame(frame);
    active.splice(0).forEach((line) => line.remove());
    track.replaceChildren();
  };
}
function setMode(next) {
  if (!["arcade", "normal"].includes(next) || next === mode) return;
  mode = next;
  header.querySelector(".work-nav-trigger").href = mode === "arcade" ? "#/arcade" : "#/work";
  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.mode === mode));
  });
  announce(mode === "arcade" ? "已选择街机模式" : "已选择常规模式");
  // Home changes presentation in place. Category screens change route; shared
  // albums/details and their return origin are independent of this preference.
  if (document.body.dataset.view === "home") {
    const pendingView = (location.hash.slice(1).split("?")[0]).split("/")[1];
    if (["arcade", "work"].includes(pendingView))
      navigate(mode === "arcade" ? "/arcade" : `/work?category=${workCategory}`);
    else render();
  } else if (["arcade", "work"].includes(document.body.dataset.view)) {
    workCategory = cleanup.getCategory?.() || workCategory;
    navigate(mode === "arcade" ? "/arcade" : `/work?category=${workCategory}`);
  }
}
function status(project) {
  return project.statusLabel || (project.status === "draft"
    ? "待补充"
    : project.releaseStatus === "coming-soon"
      ? "即将推出"
      : "已发售");
}
function artwork(project, cls = "") {
  if (project.image)
    return `<img class="project-image ${project.imageFit === "cover" ? "project-image--cover" : ""} ${cls}" src="${esc(project.image)}" alt="${esc(project.title)}" width="460" height="215" decoding="async"/>`;
  const art = project.art === "research" ? "file" : project.art === "game" ? "game" : "screen";
  const label = project.art === "research" ? "研究" : project.art === "game" ? "Game Desgin" : "界面设计";
  return `<div class="placeholder-art ${esc(project.art)} ${cls}">${icon(art)}<span>${label}</span></div>`;
}
function renderHeader(view, id, { preserveDrawer = false } = {}) {
  renderSiteHeader(header, { view, id, mode, categories, getProject, getCategory, announce, preserveDrawer });
  footer.replaceChildren();
}
function renderHome() {
  main.innerHTML = `<section class="landing page is-intro-pending"><div class="identity"><h1><span>PeanutMilk</span></h1></div><div class="start-actions"><button class="button start-button" id="start" type="button" disabled>开始</button></div><div class="landing__bulletins" aria-hidden="true"><div class="landing__bulletins-track"><p class="landing__bulletin">与时俱进的UED/UX设计师</p><p class="landing__bulletin">游戏全流程制作者</p><p class="landing__bulletin">享受游戏的奶家人</p><p class="landing__bulletin">一天涌现325个设计小巧思的UI设计师</p></div></div><div class="intro-mode">${modeSwitchMarkup()}</div></section>`;
  const landing = main.querySelector(".landing");
  const introCleanup = mountIntroScreen(landing, { arcade: mode === "arcade" });
  const bulletinCleanup = mountLandingBulletins(landing, introCleanup.renderBulletins);
  cleanup = () => {
    bulletinCleanup();
    introCleanup();
  };
  cleanup.setArcade = introCleanup.setArcade;
  cleanup.reveal = introCleanup.reveal;
  cleanup.leave = introCleanup.leave;
  main.querySelector("#start").onclick = () =>
    navigate(mode === "arcade" ? "/arcade" : "/work");
}
function renderArcade() {
  main.innerHTML =
    '<section class="arcade-page page" aria-label="街机"><div id="arcade-mount"></div></section>';
  cleanup = mountArcade(main.querySelector("#arcade-mount"), {
    modeMarkup: modeSwitchMarkup(),
    onCategory: (id) => navigate("/collection/" + id),
  });
}
function renderWork(query) {
  cleanup = mountWorkCollections(main, {
    categories,
    initialCategory: getCategory(query.get("category"))?.id || workCategory,
    modeMarkup: modeSwitchMarkup(),
    onEnter: (id) => navigate("/collection/" + id),
  });
}
function renderCollection(categoryId, query) {
  const category = getCategory(categoryId);
  if (!category) return renderNotFound();
  let filter =
    categoryId === "games" &&
    ["all", "indie", "commercial"].includes(query.get("filter"))
      ? query.get("filter")
      : "all";
  let items = getProjects(categoryId, filter);
  const requested = items.findIndex(
    (project) => project.id === (query.get("project") || selections[categoryId]),
  );
  const firstPublished = items.findIndex((project) => project.status !== "draft");
  let selected = requested >= 0 ? requested : Math.max(0, firstPublished);
  let selectedSlot = selected;
  // A filter changes the content, never the six-position viewing geometry.
  const above = 3;
  const below = 2;
  function cardsMarkup() {
    // Render one DOM card for each project. The flow is finite; moving past
    // either end is clamped instead of creating cyclic copies of a project.
    return items.map((project, index) => {
      const slot = index;
      return `<button class="album-card ${project.image ? "" : "draft-card"}" data-index="${index}" data-slot="${slot}" aria-label="选择 ${esc(project.title)}，第 ${index + 1} 件，共 ${items.length} 件"><span class="album-card-front"><span class="album-media">${artwork(project)}</span><span class="album-caption"><strong>${esc(project.title)}</strong>${icon("arrow")}</span></span><span class="album-card-back" aria-hidden="true"><span class="album-back-mark">p<span>m</span></span><span>PeanutMilk</span></span></button>`;
    }).join("");
  }
  const filters = [
    { id: "all", label: "全部", symbol: "grid" },
    { id: "indie", label: "独立游戏", symbol: "indie" },
    { id: "commercial", label: "商业游戏", symbol: "commercial" },
  ];
  const filterMarkup = categoryId === "games"
    ? `<div class="sub-filter" role="group" aria-label="游戏分类">${filters.map(({ id, label, symbol }) => `<button type="button" data-sub="${id}" aria-label="${label}" aria-pressed="${filter === id}">${icon(symbol)}<span class="filter-label" aria-hidden="true">${label}</span></button>`).join("")}</div>`
    : "";
  main.innerHTML = `<section class="collection-page album-flow-page page"><div class="collection-toolbar"><a class="back-link" href="#${collectionOrigin}" aria-label="返回">${icon("back")}</a></div>${filterMarkup}<div class="album-stage" tabindex="0" role="group" aria-roledescription="作品卡片流" aria-label="作品卡片，上下方向键或滑动切换">${cardsMarkup()}</div><div class="album-controls"><button class="icon-button" id="previous" aria-label="上一件作品">${icon("up")}</button><span id="album-position"></span><button class="icon-button" id="next" aria-label="下一件作品">${icon("down")}</button></div><div class="project-preview" id="project-preview" aria-live="polite" aria-atomic="true"></div></section>`;
  const page = main.querySelector(".album-flow-page");
  const stage = page.querySelector(".album-stage");
  const preview = page.querySelector("#project-preview");
  preview.innerHTML = '<div class="preview-inner"><div class="preview-copy"><div class="preview-content"></div></div><a class="button primary">详情</a></div>';
  const previewContent = preview.querySelector(".preview-content");
  const detailButton = preview.querySelector(".button");
  let cards = [...stage.querySelectorAll(".album-card")];
  let cardFaces = cards.map((card) => [...card.children]);
  const previous = page.querySelector("#previous");
  const next = page.querySelector("#next");
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const transitionsEnabled = () => alive && !motion.matches && !document.hidden;
  const galleryTransition = createContentTransition(stage, { enabled: transitionsEnabled, duration: 300 });
  const previewTransition = createContentTransition(previewContent, { enabled: transitionsEnabled, duration: 220 });
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  let alive = true;
  const movement = { position: selected, target: selected, velocity: 0 };
  let lastTime = 0;
  let frame = 0;
  let layout = null;
  let drag = null;
  let suppressClickUntil = 0;

  function relative(index, center = movement.position) {
    return cards.length > 1 ? index - center : 0;
  }

  function positionCards() {
    if (!layout) return;
    cards.forEach((card, index) => {
      const distance = relative(index);
      const pose = albumPose(distance, layout);
      const opacity = albumEdgeOpacity(distance, above, below) * pose.prominence;
      const focus = Math.max(0, 1 - distance * distance) ** 2;
      card.style.setProperty("--card-focus", focus.toFixed(4));
      card.style.transform = `translate3d(${pose.x.toFixed(3)}px, ${pose.y.toFixed(3)}px, ${pose.z.toFixed(3)}px) translate(-50%, -50%) rotateX(${pose.pitch.toFixed(3)}deg) scale(${pose.scale.toFixed(5)})`;
      // Opacity on the 3D parent flattens its children and exposes mirrored
      // fronts. Fade the two faces separately so their backfaces stay culled.
      cardFaces[index].forEach((face) => { face.style.opacity = opacity.toFixed(4); });
      const inactive = opacity < 0.06;
      if (card.inert !== inactive) card.inert = inactive;
    });
  }

  function confineMovement() {
    const max = Math.max(0, items.length - 1);
    const position = clamp(movement.position, 0, max);
    if (position !== movement.position) {
      movement.position = position;
      movement.velocity = 0;
    }
  }

  function syncSelection(push = false, transition = push) {
    const nearest = items.length ? clamp(Math.round(movement.position), 0, items.length - 1) : 0;
    const nearestSlot = cards.length ? clamp(Math.round(movement.position), 0, cards.length - 1) : 0;
    if (push && nearest === selected && nearestSlot === selectedSlot) return;
    const followFocus = cards.includes(document.activeElement);
    const changedProject = nearest !== selected;
    selected = nearest;
    selectedSlot = nearestSlot;
    if (followFocus) {
      cards[selectedSlot]?.focus({ preventScroll: true });
    }
    cards.forEach((card, index) => {
      card.classList.toggle("selected", index === selectedSlot);
      card.setAttribute("aria-pressed", String(index === selectedSlot));
      card.tabIndex = index === selectedSlot ? 0 : -1;
      card.style.zIndex = String(100 - Math.abs(relative(index, Math.round(movement.position))) * 15);
    });
    if (!push || changedProject) updatePreview(push, transition);
  }

  function measure() {
    if (!alive) return;
    const { width, height } = stage.getBoundingClientRect();
    if (layout && (Math.abs(layout.width - width) > 0.5 || Math.abs(layout.height - height) > 0.5)) {
      galleryTransition.finish();
      previewTransition.finish();
    }
    const compact = window.matchMedia("(max-width: 700px)").matches;
    const landscape = window.matchMedia("(max-height: 540px) and (min-width: 701px)").matches;
    const tablet = window.matchMedia("(max-width: 900px)").matches;
    const maxCardWidth = Math.min(
      compact ? 230 : landscape ? 208 : tablet ? 340 : Math.min(440, window.innerWidth * 0.26),
      width * 0.57,
    );
    layout = fitAlbumLayout({
      width, height, maxCardWidth, captionHeight: compact || landscape ? 32 : 42,
      above, below, perspective: parseFloat(getComputedStyle(stage).perspective),
      emphasis: landscape ? 1.35 : 1.55,
    });
    stage.style.setProperty("--card-width", `${layout.cardWidth}px`);
    stage.style.setProperty("--card-height", `${layout.cardHeight}px`);
    stage.style.perspectiveOrigin = `${layout.centerX}px ${layout.centerY}px`;
    // The ribbon's optical center differs from the stage's midpoint.
    page.style.setProperty("--album-center-x", `${stage.offsetLeft + layout.centerX}px`);
    page.style.setProperty("--album-center-y", `${stage.offsetTop + layout.centerY}px`);
    positionCards();
  }

  function updatePreview(push = false, transition = push) {
    const project = items[selected];
    if (!project) {
      const reveal = transition ? previewTransition.capture() : () => {};
      previewContent.innerHTML = "<h1>暂无作品</h1>";
      detailButton.hidden = true;
      page.querySelector("#album-position").textContent = "0 / 0";
      previous.disabled = next.disabled = true;
      reveal();
      return;
    }
    selections[categoryId] = project.id;
    page.querySelector("#album-position").textContent = `${selected + 1} / ${items.length}`;
    previous.disabled = items.length < 2 || selected <= 0;
    next.disabled = items.length < 2 || selected >= items.length - 1;
    const description = project.previewDescription || project.description;
    const tags = (project.previewTags || project.tags).filter((tag) => tag !== "独立游戏").slice(0, 3);
    const markup = `<h1>${esc(project.title)}</h1><p class="preview-description">${esc(description || (project.status === "draft" ? status(project) : ""))}</p><ul class="preview-tags" aria-label="作品标签">${tags.map((tag) => `<li>${esc(tag)}</li>`).join("")}</ul><span class="project-status sr-only">${status(project)}</span>`;
    if (previewContent.innerHTML !== markup) {
      const reveal = transition ? previewTransition.capture() : () => {};
      previewContent.innerHTML = markup;
      reveal();
    }
    detailButton.hidden = false;
    detailButton.href = `#/project/${project.id}?filter=${filter}`;
    if (push) {
      history.replaceState(null, "", `#/collection/${categoryId}?filter=${filter}&project=${project.id}`);
      announce(project.title);
    }
  }

  function animate(time) {
    frame = 0;
    if (!alive || document.hidden) return;
    const seconds = clamp((time - lastTime) / 1000, 0, 0.05);
    lastTime = time;
    const settled = advanceAlbumMotion(movement, seconds);
    confineMovement();
    positionCards();
    syncSelection(true);
    if (!settled) frame = requestAnimationFrame(animate);
  }

  function settleToTarget() {
    if (motion.matches || document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
      movement.position = movement.target;
      movement.velocity = 0;
      positionCards();
      syncSelection(true);
      return;
    }
    if (!frame) {
      lastTime = performance.now();
      frame = requestAnimationFrame(animate);
    }
  }

  function stopDrag() {
    const pointerId = drag?.id;
    drag = null;
    stage.classList.remove("is-dragging");
    if (pointerId !== undefined && stage.hasPointerCapture(pointerId)) stage.releasePointerCapture(pointerId);
  }

  function move(delta) {
    if (items.length < 2 || !delta) return;
    stopDrag();
    movement.target = clamp(movement.target + delta, 0, items.length - 1);
    if (movement.target === movement.position && movement.velocity === 0) {
      syncSelection(true);
      return;
    }
    settleToTarget();
  }

  const selectCard = (event) => {
    const card = event.target.closest(".album-card");
    if (!card || !stage.contains(card) || card.inert) return;
    const delta = Number(card.dataset.slot) - clamp(Math.round(movement.target), 0, cards.length - 1);
    move(delta);
  };
  stage.addEventListener("click", selectCard);
  previous.onclick = () => move(-1);
  next.onclick = () => move(1);
  page.querySelectorAll("[data-sub]").forEach((button) => {
    button.onclick = () => {
      if (button.dataset.sub !== filter) navigate(`/collection/games?filter=${button.dataset.sub}`);
    };
  });
  const keydown = (event) => {
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const targetIndex = clamp(Math.round(movement.target), 0, items.length - 1);
    if (event.key === "Home") move(-targetIndex);
    else if (event.key === "End") move(items.length - 1 - targetIndex);
    else move(["ArrowUp", "ArrowLeft"].includes(event.key) ? -1 : 1);
    cards[selectedSlot]?.focus({ preventScroll: true });
  };
  stage.addEventListener("keydown", keydown);
  let lastWheel = -Infinity;
  let lastWheelStep = -Infinity;
  let wheelTotal = 0;
  let wheelDirection = 0;
  let wheelMagnitude = 0;
  let wheelTriggered = false;
  const wheel = (event) => {
    const raw = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (items.length < 2 || !raw || event.ctrlKey) return;
    event.preventDefault();
    const now = performance.now();
    const direction = Math.sign(raw);
    const changedDirection = direction !== wheelDirection;
    if (now - lastWheel > 160 || changedDirection) {
      wheelTotal = 0;
      wheelTriggered = false;
    }
    const amount = raw * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? layout.height : 1);
    wheelTotal += amount;
    // A trackpad's momentum tail belongs to one gesture. A fresh notch or
    // deliberate reversal can retarget immediately without braking the ribbon.
    const freshGesture = !wheelTriggered && Math.abs(wheelTotal) >= 10;
    const sustainedScroll = wheelTriggered && now - lastWheelStep > 220
      && Math.abs(wheelTotal) >= 100 && Math.abs(amount) >= Math.max(12, wheelMagnitude * 0.95);
    if (freshGesture || sustainedScroll) {
      move(direction);
      wheelTotal = 0;
      wheelTriggered = true;
      lastWheelStep = now;
    }
    wheelDirection = direction;
    wheelMagnitude = Math.abs(amount);
    lastWheel = now;
  };
  stage.addEventListener("wheel", wheel, { passive: false });
  const pointerDown = (event) => {
    if (!event.isPrimary || event.button !== 0 || items.length < 2) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, base: movement.position, time: performance.now(), active: false, axis: null };
    cancelAnimationFrame(frame);
    frame = 0;
  };
  const pointerMove = (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    const dx = drag.x - event.clientX, dy = drag.y - event.clientY;
    if (!drag.active && Math.hypot(dx, dy) < 6) return;
    if (!drag.active) {
      drag.active = true;
      drag.axis = Math.abs(dy) >= Math.abs(dx) ? "y" : "x";
      movement.velocity = 0;
      stage.setPointerCapture(event.pointerId);
      stage.classList.add("is-dragging");
    }
    event.preventDefault();
    const now = performance.now();
    const position = clamp(
      drag.base + (drag.axis === "y" ? dy : dx) / layout.travel[1],
      0,
      items.length - 1,
    );
    const speed = (position - movement.position) / Math.max(0.008, (now - drag.time) / 1000);
    movement.velocity = clamp(movement.velocity * 0.55 + speed * 0.45, -7, 7);
    movement.position = position;
    drag.time = now;
    positionCards();
    syncSelection(true);
  };
  const pointerUp = (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    if (drag.active) {
      if (performance.now() - drag.time > 90 || event.type !== "pointerup") movement.velocity = 0;
      movement.target = clamp(Math.round(movement.position + clamp(movement.velocity * 0.11, -0.6, 0.6)), 0, items.length - 1);
      suppressClickUntil = performance.now() + 300;
    }
    drag = null;
    stage.classList.remove("is-dragging");
    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    settleToTarget();
  };
  const suppressDragClick = (event) => {
    if (performance.now() < suppressClickUntil) {
      event.preventDefault();
      event.stopPropagation();
    }
  };
  const preventImageDrag = (event) => event.preventDefault();
  stage.addEventListener("pointerdown", pointerDown);
  stage.addEventListener("pointermove", pointerMove);
  stage.addEventListener("lostpointercapture", pointerUp);
  window.addEventListener("pointerup", pointerUp);
  window.addEventListener("pointercancel", pointerUp);
  stage.addEventListener("click", suppressDragClick, true);
  stage.addEventListener("dragstart", preventImageDrag);
  const syncMotion = () => {
    if (motion.matches || document.hidden) {
      stopDrag();
      previewTransition.finish();
      galleryTransition.finish();
      settleToTarget();
    }
  };
  motion.addEventListener("change", syncMotion);
  document.addEventListener("visibilitychange", syncMotion);
  const observer = new ResizeObserver(measure);
  observer.observe(stage);
  syncSelection();
  measure();

  function updateCollection(nextCategory, query) {
    if (!alive || nextCategory !== categoryId) return false;
    const nextFilter = categoryId === "games" && ["all", "indie", "commercial"].includes(query.get("filter"))
      ? query.get("filter") : "all";
    const projectId = query.get("project") || selections[categoryId];
    if (nextFilter === filter && (!projectId || projectId === items[selected]?.id) &&
      movement.position === movement.target && !drag) return true;
    const scrollTop = page.scrollTop;
    const focusCard = stage.contains(document.activeElement);
    const focusDetail = page.querySelector("#project-preview").contains(document.activeElement);
    stopDrag();
    cancelAnimationFrame(frame);
    frame = 0;
    const revealGallery = galleryTransition.capture();
    filter = nextFilter;
    items = getProjects(categoryId, filter);
    const requested = items.findIndex((project) => project.id === projectId);
    const firstPublished = items.findIndex((project) => project.status !== "draft");
    selected = requested >= 0 ? requested : Math.max(0, firstPublished);
    selectedSlot = selected;
    Object.assign(movement, { position: selected, target: selected, velocity: 0 });
    lastWheel = lastWheelStep = -Infinity;
    wheelTotal = wheelDirection = wheelMagnitude = 0;
    wheelTriggered = false;
    suppressClickUntil = 0;
    // Keep the page, stage, filter buttons and pager mounted. Their positions,
    // pointer hover, keyboard focus and the page's scroll position survive.
    stage.innerHTML = cardsMarkup();
    cards = [...stage.querySelectorAll(".album-card")];
    cardFaces = cards.map((card) => [...card.children]);
    page.querySelectorAll("[data-sub]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.sub === filter));
    });
    measure();
    syncSelection(false, true);
    page.scrollTop = scrollTop;
    if (focusCard) (cards[selectedSlot] || stage).focus({ preventScroll: true });
    if (focusDetail) page.querySelector(".project-preview .button")?.focus({ preventScroll: true });
    revealGallery([...stage.querySelectorAll(".album-card.selected img")]);
    announce(`${filters.find((entry) => entry.id === filter)?.label || category.name}，${items.length} 件作品`);
    return true;
  }
  cleanup = () => {
    alive = false;
    stopDrag();
    cancelAnimationFrame(frame);
    previewTransition.finish();
    galleryTransition.finish();
    observer.disconnect();
    motion.removeEventListener("change", syncMotion);
    document.removeEventListener("visibilitychange", syncMotion);
    stage.removeEventListener("keydown", keydown);
    stage.removeEventListener("wheel", wheel);
    stage.removeEventListener("pointerdown", pointerDown);
    stage.removeEventListener("pointermove", pointerMove);
    stage.removeEventListener("lostpointercapture", pointerUp);
    window.removeEventListener("pointerup", pointerUp);
    window.removeEventListener("pointercancel", pointerUp);
    stage.removeEventListener("click", suppressDragClick, true);
    stage.removeEventListener("click", selectCard);
    stage.removeEventListener("dragstart", preventImageDrag);
    page.querySelectorAll("[data-sub]").forEach((button) => { button.onclick = null; });
    previous.onclick = next.onclick = null;
  };
  cleanup.updateCollection = updateCollection;
}
function renderProject(id, query) {
  const p = getProject(id);
  if (!p) return renderNotFound();
  const filter = ["all", "indie", "commercial"].includes(query.get("filter")) ? query.get("filter") : "all";
  cleanup = mountProjectDetail(main, p, { filter, icon, esc, openImage, announce });
}
function openImage(src, title, trigger) {
  lightbox?.close();
  const dialog = document.createElement("dialog");
  lightbox = dialog;
  dialog.className = "image-dialog";
  dialog.setAttribute("aria-label", `${title} 大图`);
  dialog.innerHTML = `<div class="image-dialog-toolbar"><span>${esc(title)}</span><button class="image-zoom-toggle" type="button" aria-pressed="false" disabled>${icon("expand")}<span>放大细节</span></button><button class="icon-button close-dialog" type="button" aria-label="关闭">${icon("close")}</button></div><div class="image-dialog-viewport" tabindex="0" aria-label="图片查看区域"><img src="${esc(src)}" alt="${esc(title)}"/><p class="image-dialog-status" role="status">图片加载中…</p></div>`;
  document.body.append(dialog);
  dialog.showModal();
  const picture = dialog.querySelector("img");
  const viewport = dialog.querySelector(".image-dialog-viewport");
  const zoom = dialog.querySelector(".image-zoom-toggle");
  const ready = () => {
    zoom.disabled = false;
    dialog.querySelector(".image-dialog-status").hidden = true;
  };
  picture.onload = ready;
  picture.onerror = () => { dialog.querySelector(".image-dialog-status").textContent = "图片暂时无法加载，请关闭后重试。"; };
  if (picture.complete && picture.naturalWidth) ready();
  zoom.onclick = () => {
    const enlarged = dialog.classList.toggle("is-zoomed");
    zoom.setAttribute("aria-pressed", String(enlarged));
    zoom.querySelector("span").textContent = enlarged ? "适应窗口" : "放大细节";
    picture.style.width = enlarged ? `${Math.min(3200, Math.max(picture.naturalWidth, viewport.clientWidth * 2))}px` : "";
    viewport.scrollTop = viewport.scrollLeft = 0;
  };
  dialog.querySelector(".close-dialog").onclick = () => dialog.close();
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener(
    "close",
    () => {
      dialog.remove();
      if (lightbox === dialog) lightbox = null;
      if (trigger?.isConnected) trigger.focus();
    },
    { once: true },
  );
}
function renderAbout() {
  const gameList = profile.games?.length ? profile.games : ["待补充"];
  const contact = /\S+@\S+\.\S+/.test(profile.email || "")
    ? `<a class="about-value about-link" href="mailto:${esc(profile.email)}">${esc(profile.email)}</a>`
    : `<p class="about-value">${esc(profile.email || "待补充")}</p>`;
  main.innerHTML = `<section class="about-page page scroll-page"><div class="about-inner"><div class="about-heading"><div class="about-title-stage" data-particle-surface="self"><h1 class="about-title"><span>${esc(profile.title || "关于我")}</span></h1></div><p class="about-meta">${esc(profile.alias)}</p><p class="about-intro">${esc(profile.description)}</p></div><div class="about-details"><section class="about-detail"><h2>联系</h2>${contact}</section><section class="about-detail"><h2>爱玩的游戏</h2><ul class="about-games">${gameList.map((game) => `<li>${esc(game)}</li>`).join("")}</ul></section><section class="about-detail"><h2>Steam 好友码</h2><p class="about-value">${esc(profile.steamFriendCode || "待补充")}</p></section></div></div></section>`;
  const titleStage = main.querySelector(".about-title-stage");
  const title = main.querySelector(".about-title");
  const disposeTitle = mountTitleParticles(titleStage, title);
  cleanup = () => disposeTitle();
}
function renderNotFound() {
  main.innerHTML = `<section class="not-found page"><h1>404</h1><a class="button primary" href="#/work">作品 ${icon("arrow")}</a></section>`;
}
function render() {
  const change = () => {
    const view = ((location.hash.slice(1) || "/").split("?")[0]).split("/")[1];
    const arcade = view === "arcade" || (!view && mode === "arcade");
    display.transition(arcade, renderNow, () => cleanup.reveal?.());
  };
  const stayingHome = document.body.dataset.view === "home" &&
    (location.hash.slice(1) || "/").split("?")[0] === "/";
  // CRT-to-CRT is a channel change. Only a normal page owns particle departure.
  if (!display.active && !stayingHome && cleanup.leave) cleanup.leave(change);
  else change();
}
function renderNow({ waitForSignal = false } = {}) {
  const previousView = document.body.dataset.view;
  if (document.body.dataset.view === "work") {
    workCategory = cleanup.getCategory?.() || workCategory;
    collectionOrigin = `/work?category=${workCategory}`;
  }
  const [path, search = ""] = (location.hash.slice(1) || "/").split("?");
  const [, view = "", id] = path.split("/");
  const query = new URLSearchParams(search);
  if (previousView === "collection" && view === "collection" && cleanup.updateCollection?.(id, query)) return;
  const preserveHome = previousView === "home" && !view &&
    !main.querySelector(".landing.is-leaving");
  if (!preserveHome) {
    cleanup();
    cleanup = () => {};
  }
  lightbox?.close();
  if (view === "work") {
    mode = "normal";
    workCategory = getCategory(query.get("category"))?.id || workCategory;
    collectionOrigin = `/work?category=${workCategory}`;
  } else if (view === "arcade") {
    mode = "arcade";
    collectionOrigin = "/arcade";
  }
  document.body.dataset.view = view || "home";
  renderHeader(view, id, {
    preserveDrawer: expandedViews.has(previousView) && expandedViews.has(view),
  });
  if (!view) {
    if (preserveHome) cleanup.setArcade(mode === "arcade");
    else renderHome();
    if (!waitForSignal) cleanup.reveal?.();
  }
  else if (view === "arcade") renderArcade();
  else if (view === "work") renderWork(query);
  else if (view === "collection") renderCollection(id, query);
  else if (view === "project") renderProject(id, query);
  else if (view === "about") renderAbout();
  else renderNotFound();
  header.querySelector(".work-nav-trigger").href = mode === "arcade" ? "#/arcade" : "#/work";
  if (["", "arcade", "work"].includes(view)) bindModeSwitches(main);
  document.title =
    (view === "project" && getProject(id) ? getProject(id).title + " — " : "") +
    "PeanutMilk";
  if (!preserveHome) (view === "arcade" ? main.querySelector("canvas[tabindex]") : main)?.focus({
    preventScroll: true,
  });
}
document.querySelector(".skip-link").onclick = (event) => {
  event.preventDefault();
  main.focus({ preventScroll: true });
};
window.addEventListener("hashchange", render);
render();
