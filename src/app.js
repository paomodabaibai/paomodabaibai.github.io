import {
  profile,
  categories,
  getProject,
  getCategory,
  getProjects,
} from "./content.js";
import { mountArcade } from "./arcade.js";
import { mountIntroScreen } from "./intro-screen.js";
import { mountWorkCollections } from "./work-collections.js";
import { mountTitleParticles } from "./title-particles.js";
import { advanceAlbumMotion, albumPose, albumEdgeOpacity, fitAlbumLayout } from "./album-motion.js";
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
const icon = (name) => {
  const paths = {
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    up: '<path d="m6 14 6-6 6 6"/>',
    down: '<path d="m6 10 6 6 6-6"/>',
    grid: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
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
  return `<div class="mode-switch" role="group" aria-label="作品集合浏览模式"><button data-mode="arcade" aria-pressed="${mode === "arcade"}">${icon("game")}<span>街机</span></button><button data-mode="normal" aria-pressed="${mode === "normal"}">${icon("grid")}<span>常规</span></button></div>`;
}
function bindModeSwitches(scope = document) {
  scope.querySelectorAll("[data-mode]").forEach((button) => {
    button.onclick = () => setMode(button.dataset.mode);
  });
}
function setMode(next) {
  if (!["arcade", "normal"].includes(next) || next === mode) return;
  mode = next;
  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.mode === mode));
  });
  announce(mode === "arcade" ? "已选择街机模式" : "已选择常规模式");
  // Only the two category-selection screens follow a mode change. The home,
  // shared albums and project details keep their current content and state.
  if (["arcade", "work"].includes(document.body.dataset.view)) {
    workCategory = cleanup.getCategory?.() || workCategory;
    navigate(mode === "arcade" ? "/arcade" : `/work?category=${workCategory}`);
  }
}
function status(project) {
  return project.status === "draft"
    ? "待补充"
    : project.releaseStatus === "coming-soon"
      ? "即将推出"
      : "已发售";
}
function artwork(project, cls = "") {
  if (project.image)
    return `<img class="project-image ${cls}" src="${esc(project.image)}" alt="${esc(project.title)}" width="460" height="215" decoding="async"/>`;
  const art = project.art === "research" ? "file" : project.art === "game" ? "game" : "screen";
  const label = project.art === "research" ? "研究" : project.art === "game" ? "Game Desgin" : "界面设计";
  return `<div class="placeholder-art ${esc(project.art)} ${cls}">${icon(art)}<span>${label}</span></div>`;
}
function renderHeader(view, id, { preserveDrawer = false } = {}) {
  const activeCategory = view === "collection"
    ? getCategory(id)?.id
    : view === "project"
      ? getProject(id)?.category
      : null;
  const expandedWorks = expandedViews.has(view);
  if (preserveDrawer && expandedWorks && header.querySelector(".work-subnav")) {
    header.querySelector(".work-nav-trigger")?.setAttribute("aria-current", "page");
    header.querySelectorAll(".work-subnav a").forEach((link, index) => {
      const categoryId = categories[index]?.id;
      if (categoryId === activeCategory) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    return;
  }
  const subnav = expandedWorks
    ? `<span class="work-subnav" aria-label="作品分类">${categories.map((cat) => `<a href="#/collection/${cat.id}" ${cat.id === activeCategory ? 'aria-current="page"' : ""}>${cat.name}</a>`).join("")}</span>`
    : "";
  header.innerHTML = `<a class="brand" href="#/" aria-label="PeanutMilk 首页"><span class="brand-symbol" aria-hidden="true">p<span>m</span></span><span>PeanutMilk</span></a><nav class="primary-nav" aria-label="主导航"><span class="work-nav-group"><a class="work-nav-trigger" href="#/work" ${["work", "collection", "project"].includes(view) ? 'aria-current="page"' : ""}>作品</a>${subnav}</span><a href="#/about" ${view === "about" ? 'aria-current="page"' : ""}>关于我</a></nav><div class="header-actions"><button class="fullscreen-toggle icon-button" aria-label="切换全屏">${icon("expand")}</button></div>`;
  const fsButton = header.querySelector(".fullscreen-toggle");
  if (!document.fullscreenEnabled) fsButton.hidden = true;
  fsButton.onclick = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      announce("全屏不可用");
    }
  };
  footer.replaceChildren();
}
function renderHome() {
  main.innerHTML = `<section class="landing page"><div class="identity"><h1><span>PeanutMilk</span></h1></div><div class="start-actions"><button class="button start-button" id="start" type="button">开始</button></div></section>`;
  cleanup = mountIntroScreen(main.querySelector(".landing"));
  const leaveHome = cleanup.leave;
  main.querySelector("#start").onclick = () =>
    leaveHome(() => navigate(mode === "arcade" ? "/arcade" : "/work"));
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
  const filter =
    categoryId === "games" &&
    ["all", "indie", "commercial"].includes(query.get("filter"))
      ? query.get("filter")
      : "all";
  const items = getProjects(categoryId, filter);
  const requested = items.findIndex(
    (project) => project.id === (query.get("project") || selections[categoryId]),
  );
  const firstPublished = items.findIndex((project) => project.status !== "draft");
  let selected = requested >= 0 ? requested : Math.max(0, firstPublished);
  main.innerHTML = `<section class="collection-page album-flow-page page"><div class="collection-toolbar"><a class="back-link" href="#${collectionOrigin}" aria-label="返回">${icon("back")}</a>${categoryId === "games" ? `<div class="sub-filter" role="group" aria-label="游戏分类"><button data-sub="all" aria-pressed="${filter === "all"}">全部</button><button data-sub="indie" aria-pressed="${filter === "indie"}">独立游戏</button><button data-sub="commercial" aria-pressed="${filter === "commercial"}">商业界面</button></div>` : ""}</div><div class="album-stage" tabindex="0" role="group" aria-roledescription="轮播" aria-label="作品卡片，上下方向键或滑动切换">${items.map((project, index) => `<button class="album-card ${project.image ? "" : "draft-card"}" data-index="${index}" aria-label="选择 ${esc(project.title)}，第 ${index + 1} 件，共 ${items.length} 件"><span class="album-card-front"><span class="album-media">${artwork(project)}</span><span class="album-caption"><strong>${esc(project.title)}</strong>${icon("arrow")}</span></span><span class="album-card-back" aria-hidden="true"><span class="album-back-mark">p<span>m</span></span><span>PeanutMilk</span></span></button>`).join("")}</div><div class="project-preview" id="project-preview" aria-live="polite" aria-atomic="true"></div><div class="album-controls"><button class="icon-button" id="previous" aria-label="上一件作品">${icon("up")}</button><span id="album-position"></span><button class="icon-button" id="next" aria-label="下一件作品">${icon("down")}</button></div></section>`;
  const page = main.querySelector(".album-flow-page");
  const stage = page.querySelector(".album-stage");
  const cards = [...page.querySelectorAll(".album-card")];
  const cardFaces = cards.map((card) => [...card.children]);
  const previous = page.querySelector("#previous");
  const next = page.querySelector("#next");
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const modulo = (value, length) => ((value % length) + length) % length;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  let alive = true;
  const movement = { position: selected, target: selected, velocity: 0 };
  let lastTime = 0;
  let frame = 0;
  let layout = null;
  let drag = null;
  let suppressClickUntil = 0;
  let previewAnimation = null;
  const above = Math.ceil((items.length - 1) / 2);
  const below = Math.floor((items.length - 1) / 2);

  function relative(index, center = movement.position) {
    return items.length > 1
      ? modulo(index - center + above + 0.5, items.length) - above - 0.5
      : 0;
  }

  function positionCards() {
    if (!layout) return;
    cards.forEach((card, index) => {
      const distance = relative(index);
      const pose = albumPose(distance, layout);
      const opacity = albumEdgeOpacity(distance, above, below) * pose.prominence;
      card.style.transform = `translate3d(${pose.x.toFixed(3)}px, ${pose.y.toFixed(3)}px, ${pose.z.toFixed(3)}px) translate(-50%, -50%) rotateX(${pose.pitch.toFixed(3)}deg) scale(${pose.scale.toFixed(5)})`;
      // Opacity on the 3D parent flattens its children and exposes mirrored
      // fronts. Fade the two faces separately so their backfaces stay culled.
      cardFaces[index].forEach((face) => { face.style.opacity = opacity.toFixed(4); });
      const inactive = opacity < 0.06;
      if (card.inert !== inactive) card.inert = inactive;
    });
  }

  function syncSelection(push = false) {
    const nearest = items.length ? modulo(Math.round(movement.position), items.length) : 0;
    if (push && nearest === selected) return;
    const followFocus = cards.includes(document.activeElement);
    selected = nearest;
    cards.forEach((card, index) => {
      card.classList.toggle("selected", index === selected);
      card.setAttribute("aria-pressed", String(index === selected));
      card.tabIndex = index === selected ? 0 : -1;
      card.style.zIndex = String(100 - Math.abs(relative(index, Math.round(movement.position))) * 15);
    });
    updatePreview(push);
    if (followFocus) cards[selected]?.focus({ preventScroll: true });
  }

  function measure() {
    if (!alive) return;
    const { width, height } = stage.getBoundingClientRect();
    const compact = window.matchMedia("(max-width: 700px)").matches;
    const landscape = window.matchMedia("(max-height: 540px) and (min-width: 701px)").matches;
    const tablet = window.matchMedia("(max-width: 900px)").matches;
    const maxCardWidth = Math.min(
      compact ? 230 : landscape ? 208 : tablet ? 340 : 370,
      width * (compact ? 0.64 : 0.63),
    );
    layout = fitAlbumLayout({
      width, height, maxCardWidth, captionHeight: compact || landscape ? 32 : 42,
      above, below, perspective: parseFloat(getComputedStyle(stage).perspective),
      emphasis: landscape ? 1.35 : 1.55,
    });
    stage.style.setProperty("--card-width", `${layout.cardWidth}px`);
    stage.style.setProperty("--card-height", `${layout.cardHeight}px`);
    stage.style.perspectiveOrigin = `${layout.centerX}px ${layout.centerY}px`;
    positionCards();
  }

  function updatePreview(push = false) {
    const project = items[selected];
    if (!project) {
      page.querySelector("#project-preview").innerHTML = "<h1>暂无作品</h1>";
      page.querySelector("#album-position").textContent = "0 / 0";
      previous.disabled = next.disabled = true;
      return;
    }
    selections[categoryId] = project.id;
    page.querySelector("#album-position").textContent = `${selected + 1} / ${items.length}`;
    previous.disabled = next.disabled = items.length < 2;
    page.querySelector("#project-preview").innerHTML = `<div class="preview-inner"><div class="preview-meta"><span>${project.subcategory === "indie" ? "独立游戏" : category.name}</span>${project.year ? `<span>${esc(project.year)}</span>` : ""}</div><h1>${esc(project.title)}</h1>${project.description ? `<p class="preview-description">${esc(project.description)}</p>` : ""}<p class="preview-tags">${esc(project.tags.filter((tag) => tag !== "独立游戏").slice(0, 3).join(" / "))}</p><span class="project-status">${status(project)}</span><a class="button primary" href="#/project/${project.id}?filter=${filter}">详情 ${icon("arrow")}</a></div>`;
    previewAnimation?.cancel();
    if (push && !motion.matches && !document.hidden) {
      previewAnimation = page.querySelector(".preview-inner").animate(
        [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "translateY(0)" }],
        { duration: 180, easing: "cubic-bezier(.2,.7,.2,1)" },
      );
    }
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
    movement.target += delta;
    settleToTarget();
  }

  cards.forEach((card, index) => {
    card.onclick = () => {
      if (card.inert) return;
      let delta = index - modulo(movement.target, items.length);
      if (delta > items.length / 2) delta -= items.length;
      if (delta < -items.length / 2) delta += items.length;
      move(delta);
    };
  });
  previous.onclick = () => move(-1);
  next.onclick = () => move(1);
  page.querySelectorAll("[data-sub]").forEach((button) => {
    button.onclick = () => navigate(`/collection/games?filter=${button.dataset.sub}`);
  });
  const keydown = (event) => {
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const targetIndex = modulo(movement.target, items.length);
    if (event.key === "Home") move(-targetIndex);
    else if (event.key === "End") move(items.length - 1 - targetIndex);
    else move(["ArrowUp", "ArrowLeft"].includes(event.key) ? -1 : 1);
    cards[selected]?.focus({ preventScroll: true });
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
    const position = drag.base + (drag.axis === "y" ? dy : dx) / layout.travel[1];
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
      movement.target = Math.round(movement.position + clamp(movement.velocity * 0.11, -0.6, 0.6));
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
      previewAnimation?.cancel();
      settleToTarget();
    }
  };
  motion.addEventListener("change", syncMotion);
  document.addEventListener("visibilitychange", syncMotion);
  const observer = new ResizeObserver(measure);
  observer.observe(stage);
  syncSelection();
  measure();
  cleanup = () => {
    alive = false;
    stopDrag();
    cancelAnimationFrame(frame);
    previewAnimation?.cancel();
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
    stage.removeEventListener("dragstart", preventImageDrag);
    cards.forEach((card) => { card.onclick = null; });
    previous.onclick = next.onclick = null;
  };
}
function renderProject(id, query) {
  const p = getProject(id);
  if (!p) return renderNotFound();
  const filter = query.get("filter") || "all",
    links =
      p.links || (p.steamUrl ? [{ label: "Steam", href: p.steamUrl }] : []),
    source = p.sourceUrl || p.steamUrl;
  main.innerHTML = `<article class="detail-page page scroll-page"><a class="back-link" href="#/collection/${p.category}?filter=${encodeURIComponent(filter)}&project=${p.id}" aria-label="返回作品册">${icon("back")}</a><div class="detail-header"><h1>${esc(p.title)}</h1><span>${status(p)}</span></div><div class="detail-hero">${artwork(p)}</div><div class="detail-body"><aside><h2>信息</h2><dl>${p.facts.map((f) => `<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join("")}</dl>${links.map((link) => `<a class="button primary" href="${esc(link.href)}" target="_blank" rel="noopener noreferrer">${esc(link.label)} ${icon("external")}</a>`).join("")}</aside><div class="detail-story">${p.description ? `<p>${esc(p.description)}</p>` : ""}${p.sections.map((s) => `<section><h2>${esc(s.title)}</h2><p>${esc(s.body)}</p></section>`).join("")}</div></div>${p.gallery.length ? `<section class="detail-gallery"><h2>画面</h2><div>${p.gallery.map((img, i) => `<button class="screenshot-button" data-image="${esc(typeof img === "string" ? img : img.src)}" aria-label="放大 ${esc(p.title)} 截图 ${i + 1}"><img src="${esc(typeof img === "string" ? img : img.src)}" alt="${esc(p.title)} 截图 ${i + 1}" width="1920" height="1080" loading="lazy"/>${icon("expand")}</button>`).join("")}</div></section>` : ""}${source ? `<a class="source-credit" href="${esc(source)}" target="_blank" rel="noopener noreferrer">${esc(p.sourceLabel || "来源")} ${icon("external")}</a>` : ""}</article>`;
  main
    .querySelectorAll("[data-image]")
    .forEach(
      (button) =>
        (button.onclick = () =>
          openImage(button.dataset.image, p.title, button)),
    );
}
function openImage(src, title, trigger) {
  lightbox?.close();
  const dialog = document.createElement("dialog");
  lightbox = dialog;
  dialog.className = "image-dialog";
  dialog.innerHTML = `<button class="icon-button close-dialog" aria-label="关闭">${icon("close")}</button><img src="${esc(src)}" alt="${esc(title)}"/>`;
  document.body.append(dialog);
  dialog.showModal();
  dialog.querySelector("button").onclick = () => dialog.close();
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
  // Keep the outgoing intro or category mounted until its dispersion finishes.
  // The transition owns cancellation and coalesces rapid navigation requests.
  if (cleanup.leave) cleanup.leave(renderNow);
  else renderNow();
}
function renderNow() {
  const previousView = document.body.dataset.view;
  if (document.body.dataset.view === "work") {
    workCategory = cleanup.getCategory?.() || workCategory;
    collectionOrigin = `/work?category=${workCategory}`;
  }
  cleanup();
  cleanup = () => {};
  lightbox?.close();
  const [path, search = ""] = (location.hash.slice(1) || "/").split("?");
  const [, view = "", id] = path.split("/");
  const query = new URLSearchParams(search);
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
  if (!view) renderHome();
  else if (view === "arcade") renderArcade();
  else if (view === "work") renderWork(query);
  else if (view === "collection") renderCollection(id, query);
  else if (view === "project") renderProject(id, query);
  else if (view === "about") renderAbout();
  else renderNotFound();
  if (["arcade", "work"].includes(view)) bindModeSwitches(main);
  document.title =
    (view === "project" && getProject(id) ? getProject(id).title + " — " : "") +
    "PeanutMilk";
  (view === "arcade" ? main.querySelector("canvas[tabindex]") : main)?.focus({
    preventScroll: true,
  });
}
document.querySelector(".skip-link").onclick = (event) => {
  event.preventDefault();
  main.focus({ preventScroll: true });
};
window.addEventListener("hashchange", render);
render();
