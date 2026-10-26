const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, value));

/**
 * Rasterize the actual heading into particles, then assemble its letterforms.
 * The semantic heading remains the readable fallback when canvas is unavailable
 * or reduced motion is requested. Animation stops completely after assembly.
 * The cleanup function exposes disperse(callback), including during assembly.
 */
export function mountTitleParticles(container, heading) {
  if (!container || !heading) return () => {};
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const canvas = document.createElement("canvas");
  canvas.className = "collection-title-particles";
  canvas.setAttribute("aria-hidden", "true");
  const context = canvas.getContext("2d", { alpha: true });
  const mask = document.createElement("canvas");
  const maskContext = mask.getContext("2d", { willReadFrequently: true });
  if (!context || !maskContext) return () => {};
  // The title stage only defines text layout. Its edges must never clip the
  // particle cloud, so paint on a separate surface covering the entire page.
  const surface = container.dataset.particleSurface === "self"
    ? container
    : container.closest(".page") || container;
  surface.append(canvas);

  let disposed = false;
  let frame = 0;
  let width = 0;
  let height = 0;
  let ratio = 1;
  let elapsed = 0;
  let lastTime = 0;
  let particles = [];
  let visible = true;
  let phase = "assemble";
  let onDispersed = null;
  let ink = "#f5f5f5";
  const duration = 1500;
  const dispersalDuration = 840;

  function draw() {
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    context.fillStyle = ink;
    for (const point of particles) {
      let x, y, alpha, radius = point.radius;
      if (phase === "disperse") {
        const progress = clamp((elapsed - point.exitDelay) / (dispersalDuration - 120), 0, 1);
        const travel = 1 - (1 - progress) ** 2;
        const curl = Math.sin(progress * Math.PI) * point.curl;
        x = point.exitX + point.scatterX * travel + curl;
        y = point.exitY + point.scatterY * travel - curl * 0.6;
        alpha = point.exitAlpha * (1 - progress) ** 1.7;
        radius *= 1 + progress * 0.55;
      } else {
        const progress = clamp((elapsed - point.delay) / (duration - 250), 0, 1);
        const ease = 1 - (1 - progress) ** 4;
        const travel = 1 - ease;
        x = point.x + (point.fromX - point.x) * travel;
        y = point.y + (point.fromY - point.y) * travel;
        alpha = point.alpha * ease;
      }
      point.renderX = x;
      point.renderY = y;
      point.renderAlpha = alpha;
      context.globalAlpha = alpha;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
  }

  function animate(time) {
    frame = 0;
    if (disposed) return;
    // Some browsers update matches before delivering the media-query event.
    // Resolve an active departure here too so navigation never waits forever.
    if (motion.matches) {
      rebuild();
      return;
    }
    if (document.hidden || !visible) return;
    const end = phase === "disperse" ? dispersalDuration : duration;
    elapsed = Math.min(end, elapsed + (lastTime ? Math.min(time - lastTime, 64) : 16));
    lastTime = time;
    draw();
    if (elapsed < end) frame = requestAnimationFrame(animate);
    else if (phase === "disperse") completeDispersal();
  }

  function wake() {
    const end = phase === "disperse" ? dispersalDuration : duration;
    if (!disposed && phase !== "gone" && !motion.matches && !document.hidden && visible && !frame && elapsed < end)
      frame = requestAnimationFrame(animate);
  }

  function rebuild() {
    if (disposed) return;
    if (phase === "gone") return;
    cancelAnimationFrame(frame);
    frame = 0;
    if (motion.matches) {
      canvas.hidden = true;
      container.classList.remove("has-title-particles");
      if (phase === "disperse") completeDispersal();
      return;
    }
    canvas.hidden = false;
    const bounds = canvas.getBoundingClientRect();
    width = Math.max(1, Math.round(bounds.width));
    height = Math.max(1, Math.round(bounds.height));
    ratio = Math.min(window.devicePixelRatio || 1, 1.75);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    // A resize during departure updates the paint surface, not the trajectory
    // or its completion callback. Continue from the same visible positions.
    if (phase === "disperse") {
      draw();
      wake();
      return;
    }
    container.classList.remove("has-title-particles");
    const titleBounds = container.getBoundingClientRect();
    const maskWidth = Math.max(1, Math.ceil(titleBounds.width));
    const maskHeight = Math.max(1, Math.ceil(titleBounds.height));
    const offsetX = titleBounds.left - bounds.left;
    const offsetY = titleBounds.top - bounds.top;
    // Only rasterize the title-sized area; a full-page paint surface does not
    // require scanning a full-page glyph mask on every resize.
    mask.width = maskWidth;
    mask.height = maskHeight;
    const style = getComputedStyle(heading);
    ink = style.color;
    maskContext.clearRect(0, 0, maskWidth, maskHeight);
    maskContext.fillStyle = "#fff";
    maskContext.textBaseline = "alphabetic";
    maskContext.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const spacing = Number.parseFloat(style.letterSpacing) || 0;
    const fontSize = Number.parseFloat(style.fontSize);
    // Draw each DOM word at its measured position; CSS owns responsive wrapping.
    for (const word of heading.querySelectorAll("span")) {
      const box = word.getBoundingClientRect();
      const metrics = maskContext.measureText(word.textContent);
      const ascent = metrics.fontBoundingBoxAscent || fontSize * 0.91;
      const descent = metrics.fontBoundingBoxDescent || fontSize * 0.22;
      const baseline = box.top - titleBounds.top + (box.height - ascent - descent) / 2 + ascent;
      let x = box.left - titleBounds.left;
      for (const character of word.textContent) {
        maskContext.fillText(character, x, baseline);
        x += maskContext.measureText(character).width + spacing;
      }
    }
    const pixels = maskContext.getImageData(0, 0, maskWidth, maskHeight).data;
    const step = maskWidth < 600 ? 2.2 : 3.1;
    const next = [];
    let seed = 91237;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const spreadX = Math.min(width * 0.22, 380);
    const spreadY = Math.min(height * 0.27, 320);
    for (let y = 0; y < maskHeight; y += step) {
      for (let x = 0; x < maskWidth; x += step) {
        const alpha = pixels[(Math.floor(y) * maskWidth + Math.floor(x)) * 4 + 3];
        if (!alpha || alpha < 110) continue;
        const angle = Math.atan2(y - maskHeight / 2, x - maskWidth / 2) + (random() - 0.5) * 1.3;
        const distance = 70 + Math.sqrt(-2 * Math.log(Math.max(random(), 1e-6))) * Math.min(width * 0.16, 230);
        // Gaussian offsets around each glyph have soft, irregular tails. A
        // uniform random rectangle would still reveal a box with a larger canvas.
        const cloudRadius = Math.sqrt(-2 * Math.log(Math.max(random(), 1e-6)));
        const cloudAngle = random() * Math.PI * 2;
        next.push({
          x: x + offsetX,
          y: y + offsetY,
          fromX: x + offsetX + Math.cos(cloudAngle) * cloudRadius * spreadX,
          fromY: y + offsetY + Math.sin(cloudAngle) * cloudRadius * spreadY,
          delay: random() * 230,
          exitDelay: random() * 115,
          scatterX: Math.cos(angle) * distance,
          scatterY: Math.sin(angle) * distance * 0.72,
          curl: (random() - 0.5) * 80,
          radius: step * (0.3 + random() * 0.16),
          alpha: 0.7 + random() * 0.3,
        });
      }
    }
    particles = next;
    lastTime = 0;
    if (particles.length) container.classList.add("has-title-particles");
    draw();
    wake();
  }

  function visibilityChanged() {
    lastTime = 0;
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
      if (phase === "disperse") completeDispersal();
    } else wake();
  }

  function completeDispersal() {
    if (disposed || phase === "gone") return;
    cancelAnimationFrame(frame);
    frame = 0;
    phase = "gone";
    context.clearRect(0, 0, width * ratio, height * ratio);
    container.classList.add("title-is-dispersed");
    const callback = onDispersed;
    onDispersed = null;
    callback?.();
  }

  function disperse(callback) {
    if (disposed) return;
    if (phase === "gone") {
      callback?.();
      return;
    }
    onDispersed = callback;
    if (phase === "disperse") return;
    // Capture the visible positions so a quick click reverses the incoming cloud
    // naturally, instead of snapping unfinished particles into the letterforms.
    for (const point of particles) {
      point.exitX = point.renderX ?? point.x;
      point.exitY = point.renderY ?? point.y;
      point.exitAlpha = point.renderAlpha ?? point.alpha;
    }
    phase = "disperse";
    elapsed = 0;
    lastTime = 0;
    if (motion.matches || !particles.length || document.hidden || !visible) {
      completeDispersal();
      return;
    }
    wake();
  }

  const observer = new ResizeObserver(rebuild);
  observer.observe(container);
  if (surface !== container) observer.observe(surface);
  const intersection = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    lastTime = 0;
    if (visible) wake();
    else {
      cancelAnimationFrame(frame);
      frame = 0;
      if (phase === "disperse") completeDispersal();
    }
  });
  intersection.observe(container);
  motion.addEventListener("change", rebuild);
  window.addEventListener("resize", rebuild);
  document.addEventListener("visibilitychange", visibilityChanged);
  rebuild();
  // Font loading may change the glyph geometry without changing the container.
  document.fonts?.ready.then(() => {
    if (!disposed) rebuild();
  });

  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    onDispersed = null;
    cancelAnimationFrame(frame);
    observer.disconnect();
    intersection.disconnect();
    motion.removeEventListener("change", rebuild);
    window.removeEventListener("resize", rebuild);
    document.removeEventListener("visibilitychange", visibilityChanged);
    container.classList.remove("has-title-particles", "title-is-dispersed");
    canvas.remove();
    particles = [];
  };
  cleanup.disperse = disperse;
  return cleanup;
}
