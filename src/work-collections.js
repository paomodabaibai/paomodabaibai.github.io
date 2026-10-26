import { mountTitleParticles } from "./title-particles.js";

const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );

// Original, monochrome game symbols, rather than covers of individual projects.
const symbols = [
  '<path d="M24 8h16v16h16v16H40v16H24V40H8V24h16Z"/>',
  '<path d="M16 8h8v8h16V8h8v16h8v24h-8v8h-8v-8H24v8h-8v-8H8V24h8Z"/><path class="symbol-cutout" d="M20 28h8v8h-8zm16 0h8v8h-8z"/>',
  '<path d="M8 16h8V8h16v8h8V8h16v8h8v24h-8v8h-8v8h-8v8H24v-8h-8v-8H8V40H0V16Z" transform="translate(4 0) scale(.875)"/>',
  '<path d="M20 8h24v8h8v8h8v24h-8v8h-8l-8-8h-8l-8 8h-8V24h8Z"/><path class="symbol-cutout" d="M20 26h6v-6h6v6h6v6h-6v6h-6v-6h-6zm24-2h6v6h-6zm6 10h6v6h-6z"/>',
  '<path d="M24 8h16v16h16v16H40v16H24V40H8V24h16Z" transform="rotate(45 32 32)"/>',
  '<path d="M24 4h16v8h8v8h8v36H44V44H32v12H20V44H8V20h8v-8h8Z"/><path class="symbol-cutout" d="M20 20h8v12h-8zm20 0h8v12h-8z"/>',
];

const arrow =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';

/** Mount the category screen. Cleanup also exposes leave(callback) and getCategory(). */
export function mountWorkCollections(
  container,
  { categories = [], initialCategory = "games", onEnter } = {},
) {
  if (!container) return () => {};
  const entries = categories.map((category) => ({
    id: category.id,
    title: category.id === "games" ? "Game Desgin" : category.name,
  }));
  if (!entries.length) return () => {};
  let selected = entries.find((entry) => entry.id === initialCategory) || entries[0];
  let disposeTitle = () => {};
  let destroyed = false;
  let phase = "ready";
  let pendingEntry = null;
  let leaveCallback = null;
  let wheelAmount = 0;
  let wheelTime = 0;
  let wheelDirection = 0;
  let wheelGestureConsumed = false;

  container.innerHTML = `<section class="work-collections-page page" aria-label="作品集合"><div class="collection-symbol-field" aria-hidden="true">${symbols
    .map(
      (symbol, index) =>
        `<svg class="collection-float collection-float-${index + 1}" viewBox="0 0 64 64">${symbol}</svg>`,
    )
    .join("")}</div><div class="collection-title-stage"><h1 class="collection-title" aria-live="polite" aria-atomic="true"></h1></div><div class="work-collections-controls"><nav class="work-collections-nav" aria-label="作品集合分类"><button class="collection-cycle collection-cycle-previous" type="button" aria-label="上一个分类">${arrow}</button><div class="collection-dots">${entries
    .map(
      (entry) =>
        `<button class="collection-dot" type="button" data-collection="${escapeHTML(entry.id)}" aria-label="${escapeHTML(entry.title)}" title="${escapeHTML(entry.title)}" aria-pressed="${entry.id === selected.id}"><span aria-hidden="true"></span></button>`,
    )
    .join("")}</div><button class="collection-cycle collection-cycle-next" type="button" aria-label="下一个分类">${arrow}</button></nav><a class="collection-enter" href="#/collection/${escapeHTML(selected.id)}"><span>进入集合</span>${arrow}</a></div></section>`;

  const page = container.querySelector(".work-collections-page");
  const titleStage = page.querySelector(".collection-title-stage");
  const title = page.querySelector(".collection-title");
  const enter = page.querySelector(".collection-enter");
  const buttons = [...page.querySelectorAll("[data-collection]")];
  const previous = page.querySelector(".collection-cycle-previous");
  const next = page.querySelector(".collection-cycle-next");

  function updateTitle() {
    disposeTitle();
    page.dataset.collection = selected.id;
    title.replaceChildren();
    // Breaking between words is deliberate on narrow screens, never mid-word.
    for (const [index, word] of selected.title.split(" ").entries()) {
      if (index) title.append(document.createTextNode(" "));
      const span = document.createElement("span");
      span.textContent = word;
      title.append(span);
    }
    enter.href = `#/collection/${encodeURIComponent(selected.id)}`;
    enter.setAttribute("aria-label", `进入 ${selected.title} 集合`);
    buttons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.collection === selected.id));
    });
    disposeTitle = mountTitleParticles(titleStage, title);
  }

  function finishExit() {
    if (destroyed) return;
    if (phase === "leaving") {
      phase = "left";
      const callback = leaveCallback;
      leaveCallback = null;
      callback?.();
      return;
    }
    if (phase !== "switching") return;
    selected = pendingEntry || selected;
    pendingEntry = null;
    phase = "ready";
    page.classList.remove("is-switching");
    updateTitle();
  }

  function disperse() {
    if (disposeTitle.disperse) disposeTitle.disperse(finishExit);
    else finishExit();
  }

  function selectEntry(entry) {
    if (destroyed || phase === "leaving" || phase === "left" || !entry) return;
    if (phase === "switching") {
      pendingEntry = entry;
      return;
    }
    if (entry === selected) return;
    pendingEntry = entry;
    phase = "switching";
    page.classList.add("is-switching");
    disperse();
  }

  function select(event) {
    const entry = entries.find((item) => item.id === event.currentTarget.dataset.collection);
    selectEntry(entry);
  }

  function cycle(direction) {
    const index = entries.indexOf(pendingEntry || selected);
    selectEntry(entries[(index + direction + entries.length) % entries.length]);
  }

  const selectPrevious = () => cycle(-1);
  const selectNext = () => cycle(1);

  function wheel(event) {
    // Preserve browser zoom; one trackpad gesture changes one category.
    if (event.ctrlKey) return;
    const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (!delta) return;
    event.preventDefault();
    const now = performance.now();
    const quiet = now - wheelTime > 180;
    const direction = Math.sign(delta);
    wheelTime = now;
    if (quiet || direction !== wheelDirection) {
      wheelGestureConsumed = false;
      wheelAmount = 0;
    }
    wheelDirection = direction;
    if (phase !== "ready" || wheelGestureConsumed) {
      if (phase !== "ready") wheelGestureConsumed = true;
      wheelAmount = 0;
      return;
    }
    if (quiet || Math.sign(delta) !== Math.sign(wheelAmount)) wheelAmount = 0;
    const multiplier = event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? window.innerHeight : 1;
    wheelAmount += delta * multiplier;
    if (Math.abs(wheelAmount) < 44) return;
    cycle(Math.sign(wheelAmount));
    wheelAmount = 0;
    wheelGestureConsumed = true;
  }

  function keyboard(event) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    cycle(event.key === "ArrowLeft" ? -1 : 1);
  }

  function leave(callback) {
    if (destroyed) return;
    if (phase === "left") {
      callback?.();
      return;
    }
    leaveCallback = callback;
    if (phase === "leaving") return;
    const alreadyDispersing = phase === "switching";
    phase = "leaving";
    page.classList.add("is-leaving");
    if (!alreadyDispersing) disperse();
  }

  function enterCollection(event) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const id = (pendingEntry || selected).id;
    leave(() => {
      if (onEnter) onEnter(id);
      else location.hash = `/collection/${encodeURIComponent(id)}`;
    });
  }

  function syncVisibility() {
    page.classList.toggle("is-paused", document.hidden);
  }
  buttons.forEach((button) => button.addEventListener("click", select));
  previous.addEventListener("click", selectPrevious);
  next.addEventListener("click", selectNext);
  enter.addEventListener("click", enterCollection);
  page.addEventListener("wheel", wheel, { passive: false });
  container.addEventListener("keydown", keyboard);
  document.addEventListener("visibilitychange", syncVisibility);
  syncVisibility();
  updateTitle();

  const cleanup = () => {
    if (destroyed) return;
    destroyed = true;
    leaveCallback = null;
    pendingEntry = null;
    disposeTitle();
    buttons.forEach((button) => button.removeEventListener("click", select));
    previous.removeEventListener("click", selectPrevious);
    next.removeEventListener("click", selectNext);
    enter.removeEventListener("click", enterCollection);
    page.removeEventListener("wheel", wheel);
    container.removeEventListener("keydown", keyboard);
    document.removeEventListener("visibilitychange", syncVisibility);
    page.remove();
  };
  cleanup.leave = leave;
  cleanup.getCategory = () => (pendingEntry || selected).id;
  return cleanup;
}
