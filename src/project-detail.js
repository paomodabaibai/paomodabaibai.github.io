const portfolioRoot = "./public/assets/games/pokor/portfolio/";
const characterNames = ["Heart", "Spade", "Club", "Diamond", "Maid", "Believer"];
const iconArtwork = [
  ["status", "状态栏"], ["wheel", "轮盘纹样"],
  ["character-status", "角色状态栏"], ["rosette", "花形纹样"],
  ["cards", "卡牌花色"], ["helmet", "头盔"],
  ["attack", "攻击标记"], ["block", "方块"],
  ["direction", "方向标记"], ["blocked-tile", "禁行地块"],
  ["dialogue", "对话框"], ["column", "立柱"],
  ["pawn", "棋子"], ["gate", "门"],
  ["settings", "设置纹样"], ["hazard-tile", "危险地块"],
];

// A project is a readable exhibition, independent of the arcade display mode.
export function mountProjectDetail(container, project, { filter = "all", icon, esc, openImage, announce }) {
  const poker = project.id === "pokor";
  const draft = project.status === "draft";
  const back = `#/collection/${project.category}?filter=${encodeURIComponent(filter)}&project=${encodeURIComponent(project.id)}`;
  const links = project.links || (project.steamUrl ? [{ label: "在 Steam 查看", href: project.steamUrl }] : []);
  const gallery = (project.gallery || []).map((entry, i) => ({
    src: typeof entry === "string" ? entry : entry.src,
    label: typeof entry === "string" ? `游戏画面 ${i + 1}` : entry.label || `游戏画面 ${i + 1}`,
  }));
  if (poker) gallery.unshift({ src: `${portfolioRoot}hero.webp`, label: "主界面设计" });
  const hero = poker ? `${portfolioRoot}hero.webp` : project.image;
  const heading = (id, title) => `<h2 class="project-section-title" id="title-${id}">${poker ? `<img src="${portfolioRoot}heading-${id}.webp" alt="${esc(title)}" loading="lazy"/>` : esc(title)}</h2>`;
  const imageButton = (src, label, className = "") => {
    const dimensions = src.endsWith("hero.webp") ? [1920, 1012] : src.endsWith("overview-map.webp") ? [1200, 956] : src.endsWith("character-lineup.webp") ? [2600, 1282] : src === project.image ? [460, 215] : null;
    return `<button class="project-artwork ${className}" type="button" data-project-image="${esc(src)}" aria-label="放大${esc(label)}"><img src="${esc(src)}" alt="${esc(label)}" ${dimensions ? `width="${dimensions[0]}" height="${dimensions[1]}"` : ""} decoding="async"/><span class="project-image-expand" aria-hidden="true">${icon("expand")}</span></button>`;
  };
  const role = project.facts?.find((fact) => /职责|负责/.test(fact.label))?.value || "待补充";
  const facts = (project.facts || []).filter((fact) => !/职责|负责|展示状态/.test(fact.label));
  const source = project.sourceUrl || project.steamUrl;

  container.innerHTML = `<article class="project-exhibition page scroll-page ${poker ? "project-exhibition--poker" : "project-exhibition--standard"}" aria-label="${esc(project.title)} 作品详情">
    <header class="project-masthead project-width"><h1>${esc(project.title)}</h1><p>${esc(project.subtitle || (draft ? "作品档案" : project.description))}</p></header>
    ${hero ? `<div class="project-hero project-width">${imageButton(hero, `${project.title} 主视觉`, "project-hero-art")}</div><button class="project-scroll-cue" type="button" data-project-section="overview"><span>向下滑动，探索作品</span>${icon("down")}</button>` : ""}
    <section class="project-overview project-width" data-section="overview" aria-labelledby="title-overview">
      ${heading("overview", "项目简述")}
      ${draft ? `<div class="project-empty"><p>项目资料整理中</p><p>作品画面与设计过程将在这里展示。</p></div>` : `<div class="project-overview-grid">
        ${poker ? `<figure class="project-world">${imageButton(`${portfolioRoot}overview-map.webp`, "POKOR 等距场景地图")}<figcaption>场景与世界</figcaption></figure>` : `<div class="project-introduction"><p>${esc(project.description)}</p>${links.map((link) => `<a class="project-action" href="${esc(link.href)}" target="_blank" rel="noopener noreferrer">${esc(link.label)}${icon("external")}</a>`).join("")}</div>`}
        <div class="project-overview-copy">
          ${poker ? `<div><h3>故事背景</h3><p>扮演 Heart，指挥扑克牌兵，探索不断变化的苍白宫殿。不同的剧情选择，通往不同的故事结局。</p></div>` : ""}
          ${(project.sections || []).map((section) => `<div><h3>${esc(poker && section.title === "玩法" ? "玩法设定" : section.title)}</h3><p>${esc(section.body)}</p></div>`).join("")}
          <div><h3>个人负责部分</h3><p class="${role === "待补充" ? "project-pending" : ""}">${esc(role)}</p></div>
        </div>
      </div>`}
      ${facts.length ? `<dl class="project-facts">${facts.map((fact) => `<div><dt>${esc(fact.label)}</dt><dd>${esc(fact.value)}</dd></div>`).join("")}</dl>` : ""}
      ${poker ? `<div class="project-overview-links">${links.map((link) => `<a class="project-action" href="${esc(link.href)}" target="_blank" rel="noopener noreferrer">${esc(link.label)}${icon("external")}</a>`).join("")}</div>` : ""}
    </section>
    ${gallery.length ? `<section class="project-interface" data-section="interface" aria-labelledby="title-interface"><div class="project-width">
      ${heading("interface", poker ? "界面设计" : "游戏画面")}
      <div class="project-gallery ${poker ? "project-gallery--ornate" : ""}" role="region" aria-roledescription="轮播" aria-label="${esc(project.title)} 界面与游戏画面" tabindex="0">
        ${poker ? `<img class="project-gallery-frame" src="${portfolioRoot}interface-frame.webp" alt="" loading="lazy"/>` : ""}
        <div class="project-gallery-inner"><p class="project-gallery-label">${esc(gallery[0].label)}</p>
          <div class="project-gallery-stage"><button type="button" class="project-gallery-arrow" data-gallery-step="-1" aria-label="上一张画面">${icon("back")}</button>
            <button class="project-gallery-image" type="button" aria-label="放大${esc(gallery[0].label)}"><img src="${esc(gallery[0].src)}" alt="${esc(gallery[0].label)}" width="1920" height="1080" loading="lazy"/><span class="project-image-expand" aria-hidden="true">${icon("expand")}</span></button>
            <button type="button" class="project-gallery-arrow" data-gallery-step="1" aria-label="下一张画面">${icon("arrow")}</button></div>
          <div class="project-gallery-controls"><div class="project-gallery-dots" role="group" aria-label="选择画面">${gallery.map((entry, i) => `<button type="button" data-gallery-index="${i}" aria-label="${esc(entry.label)}" aria-pressed="${i === 0}"><span></span></button>`).join("")}</div><span class="project-gallery-count" aria-live="polite">1 / ${gallery.length}</span></div>
        </div>
      </div>
      <p class="project-gallery-hint">${poker ? "从主界面到游戏中的每一幕" : "卡牌、猫猫与每一局的变数"}<span>点击画面查看大图</span></p>
    </div></section>` : ""}
    ${poker ? `<section class="project-characters project-width" data-section="characters" aria-labelledby="title-characters">${heading("characters", "角色一览")}
      <figure tabindex="0" aria-label="角色设定，手机可左右滑动浏览">${imageButton(`${portfolioRoot}character-lineup.webp`, "Heart、Spade、Club、Diamond、Maid 与 Believer 角色设定", "project-lineup")}<figcaption class="project-character-names">${characterNames.map((name) => `<span>${name}</span>`).join("")}</figcaption></figure><p class="project-character-hint">左右滑动查看角色 · 点击画面放大</p>
    </section>
    <section class="project-icons project-width" data-section="icons" aria-labelledby="title-icons">${heading("icons", "图标一览")}<div class="project-icon-gallery"></div></section>` : ""}
    <footer class="project-ending project-width"><a class="project-action" href="${back}">${icon("back")}返回作品册</a>${source ? `<a class="project-source" href="${esc(source)}" target="_blank" rel="noopener noreferrer">${esc(project.sourceLabel || "项目来源")}${icon("external")}</a>` : ""}<button class="project-ending-top" type="button">回到顶部${icon("up")}</button></footer>
  </article>`;

  const page = container.querySelector(".project-exhibition");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const removers = [];
  const on = (element, type, callback, options) => {
    element.addEventListener(type, callback, options);
    removers.push(() => element.removeEventListener(type, callback, options));
  };
  let alive = true;
  const sectionElements = [...page.querySelectorAll("[data-section]")];
  const sectionOffset = () => (parseFloat(getComputedStyle(page).getPropertyValue("--site-header-clearance")) || 104) + 24;
  const scrollToSection = (id) => {
    const target = sectionElements.find((section) => section.dataset.section === id);
    if (!target) return;
    const top = page.scrollTop + target.getBoundingClientRect().top - page.getBoundingClientRect().top - sectionOffset();
    page.scrollTo({ top, behavior: motion.matches ? "instant" : "smooth" });
  };
  page.querySelectorAll("[data-project-section]").forEach((button) => on(button, "click", () => scrollToSection(button.dataset.projectSection)));
  on(page.querySelector(".project-ending-top"), "click", () => page.scrollTo({ top: 0, behavior: motion.matches ? "instant" : "smooth" }));
  // One delegated handler also covers the icon artwork loaded from its manifest.
  on(page, "click", (event) => {
    const button = event.target.closest("[data-project-image]");
    if (button) openImage(button.dataset.projectImage, button.querySelector("img").alt, button);
  });

  if (gallery.length) {
    let selected = 0;
    let gesture = null;
    let suppressClickUntil = 0;
    const galleryRoot = page.querySelector(".project-gallery");
    const imageButton = page.querySelector(".project-gallery-image");
    const image = imageButton.querySelector("img");
    const dots = [...page.querySelectorAll("[data-gallery-index]")];
    const select = (index) => {
      selected = (index + gallery.length) % gallery.length;
      const entry = gallery[selected];
      image.src = entry.src;
      image.alt = entry.label;
      imageButton.setAttribute("aria-label", `放大${entry.label}`);
      page.querySelector(".project-gallery-label").textContent = entry.label;
      page.querySelector(".project-gallery-count").textContent = `${selected + 1} / ${gallery.length}`;
      dots.forEach((dot, i) => dot.setAttribute("aria-pressed", String(i === selected)));
      if (!motion.matches) image.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 240 });
    };
    page.querySelectorAll("[data-gallery-step]").forEach((button) => on(button, "click", () => select(selected + Number(button.dataset.galleryStep))));
    dots.forEach((button) => on(button, "click", () => select(Number(button.dataset.galleryIndex))));
    on(galleryRoot, "keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      select(event.key === "Home" ? 0 : event.key === "End" ? gallery.length - 1 : selected + (event.key === "ArrowRight" ? 1 : -1));
    });
    on(imageButton, "click", () => {
      if (performance.now() >= suppressClickUntil) openImage(gallery[selected].src, gallery[selected].label, imageButton);
    });
    on(imageButton, "pointerdown", (event) => {
      if (!event.isPrimary || event.button !== 0) return;
      gesture = { x: event.clientX, y: event.clientY, id: event.pointerId };
      imageButton.setPointerCapture(event.pointerId);
    });
    on(imageButton, "pointerup", (event) => {
      if (!gesture || event.pointerId !== gesture.id) return;
      const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        select(selected + (dx < 0 ? 1 : -1));
        suppressClickUntil = performance.now() + 400;
      }
      gesture = null;
    });
    on(imageButton, "pointercancel", () => { gesture = null; });
    on(imageButton, "lostpointercapture", () => { gesture = null; });
    on(imageButton, "dragstart", (event) => event.preventDefault());
  }

  if (poker) {
    // Individual transparent crops preserve the original pairs and can be replaced independently.
    const target = page.querySelector(".project-icon-gallery");
    // The reference sheet contains eight pairs, ordered by row.
    target.innerHTML = iconArtwork.map(([file, label]) => imageButton(`${portfolioRoot}icon-${file}.webp`, `POKOR ${label}设计`, "project-icon")).join("");
  }

  let revealObserver;
  if (!motion.matches && "IntersectionObserver" in window) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || !alive) return;
        if (!motion.matches) entry.target.animate([{ opacity: 0.25, transform: "translateY(16px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 550, easing: "cubic-bezier(.2,.7,.2,1)" });
        revealObserver.unobserve(entry.target);
      });
    }, { root: page, threshold: 0.08 });
    page.querySelectorAll(".project-section-title, .project-world, .project-overview-copy > div, .project-gallery, .project-lineup, .project-icon").forEach((element) => revealObserver.observe(element));
  }
  return () => {
    alive = false;
    removers.forEach((remove) => remove());
    revealObserver?.disconnect();
    page.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
  };
}
