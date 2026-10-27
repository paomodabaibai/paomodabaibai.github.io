const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]);

const icon = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${name === "download"
  ? '<path d="M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4"/>'
  : '<path d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6"/>'}</svg>`;

/** Keep the header mounted between albums and details so the drawer retains focus. */
export function renderSiteHeader(header, {
  view, id, mode, categories, getProject, getCategory, announce, preserveDrawer = false,
}) {
  const expanded = view === "collection" || view === "project";
  const activeCategory = view === "collection" ? getCategory(id)?.id : view === "project" ? getProject(id)?.category : null;
  const worksActive = ["arcade", "work", "collection", "project"].includes(view);

  if (preserveDrawer && expanded && header.querySelector(".work-subnav")) {
    header.querySelector(".work-nav-trigger").setAttribute("aria-current", "page");
    header.querySelectorAll(".work-subnav a").forEach((link) => {
      if (link.dataset.category === activeCategory) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    header.querySelector(".resume-notice").hidden = true;
    header.querySelector(".resume-button").setAttribute("aria-expanded", "false");
    return;
  }

  header.classList.toggle("has-work-subnav", expanded);
  header.innerHTML = `
    <a class="brand" href="#/" aria-label="PeanutMilk 首页">
      <span class="brand-avatar" aria-hidden="true"><span class="brand-symbol">p<span>m</span></span></span>
      <span class="brand-name">PeanutMilk</span>
    </a>
    <nav class="primary-nav" aria-label="主导航">
      <span class="work-nav-group">
        <a class="work-nav-trigger" href="${mode === "arcade" ? "#/arcade" : "#/work"}" ${worksActive ? 'aria-current="page"' : ""}>作品</a>
        ${expanded ? `<span class="work-subnav" aria-label="作品分类">${categories.map((category) => `<a href="#/collection/${escapeHTML(category.id)}" data-category="${escapeHTML(category.id)}" ${category.id === activeCategory ? 'aria-current="page"' : ""}>${escapeHTML(category.name)}</a>`).join("")}</span>` : ""}
      </span>
      <a class="about-nav-link" href="#/about" ${view === "about" ? 'aria-current="page"' : ""}>关于我</a>
    </nav>
    <div class="header-actions">
      <button class="fullscreen-toggle icon-button" type="button" aria-label="切换全屏" title="切换全屏" ${!document.fullscreenEnabled ? "hidden" : ""}>${icon("expand")}</button>
      <button class="resume-button" type="button" aria-expanded="false" aria-controls="resume-notice"><span>下载 PDF</span>${icon("download")}</button>
    </div>
    <div class="resume-notice" id="resume-notice" role="status" hidden>PDF 下载即将开放。</div>`;

  const resumeButton = header.querySelector(".resume-button");
  const notice = header.querySelector(".resume-notice");
  resumeButton.onclick = () => {
    notice.hidden = !notice.hidden;
    resumeButton.setAttribute("aria-expanded", String(!notice.hidden));
  };
  // A short local disclosure communicates the placeholder without an inert button
  // or a pretend download; no document listeners survive header replacement.
  header.onkeydown = (event) => {
    if (event.key === "Escape" && !notice.hidden) {
      notice.hidden = true;
      resumeButton.setAttribute("aria-expanded", "false");
      resumeButton.focus();
    }
  };
  header.onfocusout = (event) => {
    if (!header.contains(event.relatedTarget)) {
      notice.hidden = true;
      resumeButton.setAttribute("aria-expanded", "false");
    }
  };
  header.querySelector(".fullscreen-toggle").onclick = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      announce("全屏不可用");
    }
  };
}
