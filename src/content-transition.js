// Keep the outgoing picture above the live content while it dissolves. The live
// surface stays fully opaque, so interruptions never flash through to black.
export function createContentTransition(element, { enabled, duration = 280 } = {}) {
  const layers = new Set();

  function remove(layer) {
    if (!layers.delete(layer)) return;
    clearTimeout(layer.timer);
    layer.animation?.cancel();
    layer.node.remove();
  }

  function finish() {
    [...layers].forEach(remove);
  }

  function capture() {
    if (!enabled() || !element.childElementCount) {
      finish();
      return () => {};
    }
    const copy = element.cloneNode(true);
    copy.removeAttribute("id");
    copy.removeAttribute("aria-live");
    copy.setAttribute("aria-hidden", "true");
    copy.setAttribute("data-motion-copy", "");
    copy.classList.add("is-transition-copy");
    copy.classList.remove("is-dragging");
    copy.inert = true;
    copy.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
    copy.querySelectorAll("[tabindex]").forEach((node) => { node.tabIndex = -1; });
    // Insert below earlier outgoing layers to preserve their current composite.
    element.after(copy);
    const layer = { node: copy, animation: null, timer: 0 };
    layers.add(layer);

    // Rapid input must not accumulate an unbounded number of render surfaces.
    // Discard the least visible contribution, not simply the oldest picture.
    if (layers.size > 4) {
      let remaining = 1;
      const contributions = [...layers].map((entry) => {
        const opacity = Number(getComputedStyle(entry.node).opacity);
        const weight = remaining * opacity;
        remaining *= 1 - opacity;
        return { entry, weight };
      });
      remove(contributions.sort((a, b) => a.weight - b.weight)[0].entry);
    }

    return (images = []) => {
      const reveal = () => {
        clearTimeout(layer.timer);
        if (!layers.has(layer)) return;
        if (!enabled()) return finish();
        layer.animation = copy.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration,
          easing: "cubic-bezier(.22,.61,.36,1)",
          fill: "forwards",
        });
        layer.animation.finished.then(() => remove(layer), () => remove(layer));
      };
      if (!images.length) return reveal();
      // Local covers are usually decoded already. Keep the old view visible on
      // the first visit too; a failed image can never block navigation forever.
      const decoded = Promise.allSettled(images.map((image) => image.decode()));
      const deadline = new Promise((resolve) => { layer.timer = setTimeout(resolve, 240); });
      Promise.race([decoded, deadline]).then(reveal);
    };
  }

  return { capture, finish };
}
