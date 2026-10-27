import { crtScreenOutline } from "./crt.js";

// The router owns one display for both the title and game channels. This module
// knows only whether the mounted surface uses CRT, never routes or game input.
export function createArcadeDisplay(surface) {
  const root = document.createElement("div");
  root.className = "arcade-display";
  root.hidden = true;
  root.setAttribute("aria-hidden", "true");
  const edge = crtScreenOutline().map(({ x, y }) => `${(x * 1000).toFixed(3)},${(y * 1000).toFixed(3)}`);
  // Keep the aperture stationary, slightly inside the antialiased glass edge.
  // Signal children can expand/roll without ever painting over the cabinet.
  const aperture = crtScreenOutline(0.008).map(({ x, y }) => `${(x * 100).toFixed(5)}% ${(y * 100).toFixed(5)}%`);
  document.documentElement.style.setProperty("--arcade-screen-clip", `polygon(${aperture.join(",")})`);
  const outline = `M${edge.join(" L")} Z`;
  root.innerHTML = `<div class="arcade-display__aperture"><div class="arcade-display__signal"></div></div>
    <svg class="arcade-display__bezel" viewBox="0 0 1000 1000" preserveAspectRatio="none">
      <defs>
        <linearGradient id="arcade-bevel-light" x1="0" y1="0" x2=".25" y2="1">
          <stop stop-color="#606060"/><stop offset=".18" stop-color="#333333"/>
          <stop offset=".52" stop-color="#151515"/><stop offset=".84" stop-color="#242424"/><stop offset="1" stop-color="#494949"/>
        </linearGradient>
        <linearGradient id="arcade-glass-light" x1="0" y1="0" x2=".65" y2="1">
          <stop stop-color="#ffffff" stop-opacity=".32"/><stop offset=".3" stop-color="#ffffff" stop-opacity=".08"/>
          <stop offset=".65" stop-color="#ffffff" stop-opacity=".02"/><stop offset="1" stop-color="#ffffff" stop-opacity=".18"/>
        </linearGradient>
        <path id="arcade-glass-outline" d="${outline}"/>
      </defs>
      <use class="arcade-display__shadow" href="#arcade-glass-outline"/>
      <use class="arcade-display__housing" href="#arcade-glass-outline"/>
      <use class="arcade-display__bevel" href="#arcade-glass-outline"/>
      <use class="arcade-display__recess" href="#arcade-glass-outline"/>
      <use class="arcade-display__reflection" href="#arcade-glass-outline"/>
    </svg>`;
  document.body.append(root);
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let active = false;
  let timers = [];
  let finishPending = null;

  function cancel() {
    timers.forEach(clearTimeout);
    timers = [];
    finishPending = null;
    root.classList.remove("is-booting", "is-changing-channel", "is-powering-off");
    surface.classList.remove("is-changing-channel", "is-powering-off");
  }

  function phase(value) {
    root.dataset.phase = value;
    document.body.dataset.displayPhase = value;
  }

  function present(next) {
    active = next;
    root.hidden = !active;
    document.body.dataset.screen = active ? "arcade" : "normal";
  }

  function transition(next, commit, ready) {
    // A later route/mode request cancels every callback belonging to the old
    // signal. The source is the mounted display, not the requested mode.
    cancel();
    let committed = false;
    const swap = (waitForSignal = false) => {
      if (committed) return;
      committed = true;
      present(next);
      commit({ waitForSignal });
    };
    const finish = () => {
      cancel();
      swap();
      phase("ready");
      ready?.();
    };
    if (motion.matches || document.hidden) {
      finish();
      return;
    }
    finishPending = finish;
    if (active && next) {
      phase("channel");
      root.classList.add("is-changing-channel");
      surface.classList.add("is-changing-channel");
      timers.push(setTimeout(() => swap(), 180), setTimeout(finish, 460));
    } else if (active) {
      phase("off");
      root.classList.add("is-powering-off");
      surface.classList.add("is-powering-off");
      timers.push(setTimeout(finish, 420));
    } else if (next) {
      phase("boot");
      root.hidden = false;
      root.classList.add("is-booting");
      swap(true);
      timers.push(setTimeout(finish, 920));
    } else finish();
  }

  const settle = () => {
    if (motion.matches || document.hidden) finishPending?.();
  };
  motion.addEventListener("change", settle);
  document.addEventListener("visibilitychange", settle);
  return {
    get active() { return active; },
    transition,
    destroy() {
      cancel();
      motion.removeEventListener("change", settle);
      document.removeEventListener("visibilitychange", settle);
      root.remove();
    },
  };
}
