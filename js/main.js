/* =====================================================================
   ELAW STUDIOS — SITE SCRIPT
   Renders every content section from /data/*.js and wires up motion,
   the case-study viewer, Vimeo, reels, AI Lab, 3D showroom and form.
   No build step. No framework. Three.js + model-viewer load on demand.
   ===================================================================== */
(() => {
  "use strict";

  const E = window.ELAW || {};
  const SITE = E.site || {}, C = E.content || {};
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const THEME = document.documentElement.dataset.theme || "dark";
  const TW = THEME === "twilight";
  const TYPES = E.projectTypes || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s = "") => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const cats = p => (Array.isArray(p.category) ? p.category : [p.category]).filter(Boolean);
  const typeLabel = t => TYPES[t] || TYPES.lab || "ELAW LAB — Concept";
  const tagHTML = t => `<span class="tag tag--${esc(t || "lab")}">${esc(typeLabel(t))}</span>`;

  /* ---------- generative placeholder art ---------- */
  const artHTML = (art = {}, label = "", anim = true) =>
    `<div class="art${anim && !REDUCED ? " art--anim" : ""}" data-style="${esc(art.style || "orb")}" style="--h:${Number(art.hue ?? 190)}" role="img" aria-label="${esc(label)} — placeholder visual">${label ? `<span class="art__label">Visual coming soon</span>` : ""}</div>`;

  const imgHTML = (src, alt, cls = "") =>
    `<img class="${cls}" src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async">`;

  const mediaHTML = (item, alt) => item.thumbnail || item.image || item.poster
    ? imgHTML(item.thumbnail || item.image || item.poster, alt)
    : artHTML(item.art, alt);

  /* ---------- Vimeo helpers ---------- */
  function parseVimeo(url = "") {
    if (!url) return null;
    const m = String(url).match(/(?:vimeo\.com\/(?:video\/|channels\/[^/]+\/|groups\/[^/]+\/videos\/|album\/\d+\/video\/|manage\/videos\/)?|player\.vimeo\.com\/video\/)(\d+)(?:\/([a-z0-9]+))?(?:.*[?&]h=([a-z0-9]+))?/i);
    if (!m) return null;
    return { id: m[1], hash: m[3] || m[2] || "" };
  }
  function vimeoEmbedURL(url, { autoplay = true, background = false } = {}) {
    const v = parseVimeo(url); if (!v) return "";
    const q = new URLSearchParams({ autoplay: autoplay ? 1 : 0, title: 0, byline: 0, portrait: 0, dnt: 1, color: "d6b98c" });
    if (v.hash) q.set("h", v.hash);
    if (background) { q.set("background", 1); q.set("muted", 1); q.set("loop", 1); }
    return `https://player.vimeo.com/video/${v.id}?${q}`;
  }
  /* Auto poster: when a project has a Vimeo URL but no thumbnail, fetch Vimeo's own thumbnail */
  const vimeoThumbCache = {};
  function vimeoThumb(url) {
    if (!vimeoThumbCache[url]) {
      vimeoThumbCache[url] = fetch(`https://vimeo.com/api/oembed.json?width=1280&url=${encodeURIComponent(url)}`)
        .then(r => r.ok ? r.json() : null).then(j => j && j.thumbnail_url).catch(() => null);
    }
    return vimeoThumbCache[url];
  }
  function hydrateVimeoPosters(root) {
    $$("[data-vimeo-poster]", root).forEach(box => {
      vimeoThumb(box.dataset.vimeoPoster).then(src => {
        if (!src) return;
        const img = new Image(); img.alt = box.dataset.alt || ""; img.decoding = "async"; img.loading = "lazy"; img.src = src;
        img.onload = () => { const art = box.querySelector(".art"); art ? art.replaceWith(img) : box.prepend(img); };
      });
    });
  }

  /* =====================================================================
     RENDER: contact + social
     ===================================================================== */
  function renderContact() {
    const email = SITE.contact?.email;
    $$("[data-email]").forEach(a => { a.textContent = email; a.href = `mailto:${email}`; });
    $$("[data-location]").forEach(p => p.textContent = SITE.contact?.location || "");
    $$("[data-year]").forEach(s => s.textContent = new Date().getFullYear());
    const links = (SITE.social || []).filter(s => s.url);
    const list = $("[data-social-list]");
    if (list) list.innerHTML = [
      email ? `<li><a href="mailto:${esc(email)}">Email ↗</a></li>` : "",
      ...links.map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} ↗</a></li>`)
    ].join("");
    $$("[data-social]").forEach(d => d.innerHTML = links.map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join(""));
  }

  /* =====================================================================
     RENDER: services, story, process, why, about
     ===================================================================== */
  const SVC_GLYPHS = {
    social:    ["M4 5.5h16v10.5H9.5L5.5 19.5v-3.5H4z", "M12 13.4s-3.2-1.9-3.2-4.1a1.7 1.7 0 0 1 3.2-.8 1.7 1.7 0 0 1 3.2.8c0 2.2-3.2 4.1-3.2 4.1z"],
    ai:        ["M11 3.5l2.2 6.3 6.3 2.2-6.3 2.2L11 20.5l-2.2-6.3L2.5 12l6.3-2.2z", "M18.5 3v4M16.5 5h4"],
    video:     ["M4 9.5h16v10H4z", "M4 9.5l1.4-4.2h14.2L18.6 9.5", "M9.6 5.3L8.2 9.5M14.6 5.3l-1.4 4.2", "M10.5 12.6v4l3.6-2z"],
    marketing: ["M3.5 10v4h3.2l7.3 4.3V5.7L6.7 10z", "M17.2 9.2a4 4 0 0 1 0 5.6M19.6 7a7 7 0 0 1 0 10", "M7 14l1.6 4.6h2.6L9.8 14"],
    digital:   ["M3.5 5h17v14h-17z", "M3.5 8.6h17", "M9.6 11.6L7 14.2l2.6 2.6M14.4 11.6l2.6 2.6-2.6 2.6"]
  };
  const svcGlyph = id => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${(SVC_GLYPHS[id] || []).map(d => `<path d="${d}"/>`).join("")}</svg>`;

  function renderServices() {
    const box = $("[data-services]"); if (!box) return;
    box.innerHTML = (C.services || []).map((s, i) => `
      <article class="svc__row reveal" style="--d:${i * 0.06}s" id="svc-${esc(s.id)}">
        <div class="svc__art" data-svc="${esc(s.id)}" aria-hidden="true">${svcGlyph(s.id)}</div>
        <span class="svc__no">${esc(s.no)}</span>
        <div><h3 class="svc__title">${esc(s.title)}</h3><p class="svc__hook">${esc(s.hook)}</p></div>
        <ul class="svc__items">${s.items.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
        <span class="svc__icon" aria-hidden="true">→</span>
      </article>`).join("");
  }

  function renderStory() {
    const steps = C.story || []; if (!steps.length) return;
    const rail = $("[data-story-rail]"), words = $("[data-story-words]"), line = $("[data-story-line]"),
          count = $("[data-story-count]"), bar = $("[data-story-bar]"), sec = $("#story");
    rail.innerHTML = steps.map(s => `<li>${esc(s.word)}</li>`).join("");
    words.innerHTML = steps.map((s, i) => `<span${i === steps.length - 1 ? " data-last" : ""}>${esc(s.word)}</span>`).join("");
    const lis = $$("li", rail), ws = $$("span", words);
    let current = -1;
    const set = i => {
      if (i === current) return; current = i;
      lis.forEach((li, k) => { li.classList.toggle("is-active", k === i); li.classList.toggle("is-done", k < i); });
      ws.forEach((w, k) => { w.classList.toggle("is-active", k === i); w.classList.toggle("is-past", k < i); });
      line.textContent = steps[i].line;
      count.textContent = `${String(i + 1).padStart(2, "0")} / ${String(steps.length).padStart(2, "0")}`;
    };
    set(0);
    if (REDUCED) return;
    onScroll(() => {
      const r = sec.getBoundingClientRect(), total = r.height - innerHeight;
      if (r.bottom < 0 || r.top > innerHeight) return;
      const p = Math.min(1, Math.max(0, -r.top / total));
      bar.style.transform = `scaleX(${p})`;
      set(Math.min(steps.length - 1, Math.floor(p * steps.length * 0.999)));
    });
  }

  function renderProcess() {
    const box = $("[data-process]"); if (!box) return;
    box.innerHTML = (C.process || []).map((s, i) => `
      <li class="step reveal" style="--d:${i * 0.08}s">
        <span class="step__node">${esc(s.no)}</span>
        <h3 class="step__title">${esc(s.title)}</h3>
        <p class="step__text">${esc(s.text)}</p>
      </li>`).join("");
    const steps = $$(".step", box);
    const update = () => {
      const r = box.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const p = REDUCED ? 1 : Math.min(1, Math.max(0, (innerHeight * 0.75 - r.top) / r.height));
      box.style.setProperty("--tl", p.toFixed(3));
      steps.forEach((s, i) => s.classList.toggle("is-lit", p >= i / steps.length + 0.02 || REDUCED));
    };
    onScroll(update); update();
  }

  function renderWhy() {
    const box = $("[data-why]"); if (!box) return;
    box.innerHTML = (C.why || []).map((w, i) => `
      <div class="why__item reveal" style="--d:${i * 0.08}s">
        <div class="why__big">${esc(w.big)}<small>${esc(w.unit)}</small></div>
        <p>${esc(w.text)}</p>
      </div>`).join("");
    const pills = $("[data-about-pillars]");
    if (pills) pills.innerHTML = (C.aboutPillars || []).map(p => `<li>${esc(p)}</li>`).join("");
  }

  /* =====================================================================
     RENDER: work (featured + portfolio)
     ===================================================================== */
  const projects = E.projects || [];

  function cardHTML(p, i, big = false) {
    const hasVideo = !!(p.vimeoUrl || p.heroVideo);
    const poster = p.thumbnail ? imgHTML(p.thumbnail, p.title) : artHTML(p.art, p.title);
    return `
      <article class="card${big ? " card--big" : ""} reveal" style="--i:${i}" data-id="${esc(p.id)}">
        <div class="card__media" ${!p.thumbnail && p.vimeoUrl ? `data-vimeo-poster="${esc(p.vimeoUrl)}" data-alt="${esc(p.title)}"` : ""} data-parallax>
          ${poster}
          ${p.heroVideo ? `<video muted loop playsinline preload="none" data-src="${esc(p.heroVideo)}" aria-hidden="true"></video>` : ""}
          <div class="card__top">${tagHTML(p.type)}${p.year ? `<span class="tag">${esc(p.year)}</span>` : ""}</div>
          ${hasVideo ? `<span class="card__play" aria-hidden="true"></span>` : ""}
        </div>
        <div class="card__meta">
          <div><h3 class="card__title">${esc(p.title)}</h3><p class="card__sub">${esc(p.subtitle || "")}</p></div>
          <span class="card__cats">${cats(p).map(esc).join(" · ")}</span>
        </div>
        <button class="card__open" type="button" data-open-project="${esc(p.id)}" aria-label="Open case study: ${esc(p.title)}"></button>
      </article>`;
  }

  function wireCards(root) {
    hydrateVimeoPosters(root);
    $$(".card", root).forEach(card => {
      const v = $("video", card); if (!v || REDUCED) return;
      const play = () => { if (!v.src) v.src = v.dataset.src; v.play().then(() => card.classList.add("is-playing")).catch(() => {}); };
      const stop = () => { v.pause(); card.classList.remove("is-playing"); };
      card.addEventListener("mouseenter", play); card.addEventListener("mouseleave", stop);
      card.addEventListener("focusin", play); card.addEventListener("focusout", stop);
    });
    observeReveals(root);
  }

  function renderFeatured() {
    const box = $("[data-featured]"); if (!box) return;
    const list = projects.filter(p => p.featured).slice(0, 6);
    box.innerHTML = list.map((p, i) => cardHTML(p, i, i === 0)).join("");
    wireCards(box);
  }

  function renderPortfolio() {
    const box = $("[data-portfolio]"), fbox = $("[data-filters]"), empty = $("[data-portfolio-empty]");
    if (!box) return;
    const categories = E.categories || ["All"];
    fbox.innerHTML = categories.map((c, i) => `<button class="filter" role="tab" type="button" aria-selected="${i === 0}" data-cat="${esc(c)}">${esc(c)}</button>`).join("");
    const draw = cat => {
      const list = cat === "All" ? projects : projects.filter(p => cats(p).some(x => x.toLowerCase() === cat.toLowerCase()));
      box.innerHTML = list.map((p, i) => cardHTML(p, i)).join("");
      empty.hidden = list.length > 0;
      wireCards(box);
      $$(".reveal", box).forEach(el => el.classList.add("in"));
    };
    fbox.addEventListener("click", e => {
      const b = e.target.closest("[data-cat]"); if (!b) return;
      $$("[data-cat]", fbox).forEach(x => x.setAttribute("aria-selected", x === b));
      draw(b.dataset.cat);
    });
    draw("All");
  }

  /* =====================================================================
     CASE-STUDY VIEWER (one <dialog> reused for projects, reels, lab)
     ===================================================================== */
  const viewer = $("#viewer"), vbody = $("[data-viewer-body]");
  let lastFocus = null;

  function openViewer(html) {
    lastFocus = document.activeElement;
    vbody.innerHTML = html;
    if (typeof viewer.showModal === "function") viewer.showModal(); else viewer.setAttribute("open", "");
    document.body.classList.add("is-locked");
    viewer.querySelector(".viewer__inner").scrollTop = 0;
    hydrateVimeoPosters(vbody);
  }
  function closeViewer() {
    if (viewer.open && typeof viewer.close === "function") viewer.close(); else viewer.removeAttribute("open");
  }
  viewer.addEventListener("close", () => {
    vbody.innerHTML = ""; // stops Vimeo/video playback
    document.body.classList.remove("is-locked");
    lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
  });
  viewer.addEventListener("click", e => { if (e.target === viewer || e.target.closest("[data-close]")) closeViewer(); });

  function heroMediaHTML(item, vertical = false) {
    const cls = `v-media${vertical ? " v-media--vertical" : ""}`;
    if (item.vimeoUrl && parseVimeo(item.vimeoUrl)) {
      return `<div class="${cls}"><iframe src="${esc(vimeoEmbedURL(item.vimeoUrl))}" title="${esc(item.title)} — video" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`;
    }
    const vid = item.heroVideo || item.video;
    if (vid) return `<div class="${cls}"><video src="${esc(vid)}" ${item.thumbnail || item.poster ? `poster="${esc(item.thumbnail || item.poster)}"` : ""} controls autoplay muted playsinline loop></video></div>`;
    const img = item.thumbnail || item.image || item.poster;
    if (img) return `<div class="${cls}"><img src="${esc(img)}" alt="${esc(item.title)}"></div>`;
    return `<div class="${cls}">${artHTML(item.art, item.title)}<span class="v-media__note tag">Media coming soon</span></div>`;
  }

  function openProject(id) {
    const p = projects.find(x => x.id === id); if (!p) return;
    const dl = [
      ["Project type", esc(typeLabel(p.type))],
      ["Category", cats(p).map(esc).join(" · ")],
      p.tools?.length ? ["Tools", `<div class="v-chips">${p.tools.map(t => `<span>${esc(t)}</span>`).join("")}</div>`] : null,
      p.process?.length ? ["Process", `<ol>${p.process.map(s => `<li>${esc(s)}</li>`).join("")}</ol>`] : null,
      p.result ? ["Result", esc(p.result)] : (p.goal ? ["Goal", esc(p.goal)] : null)
    ].filter(Boolean);
    openViewer(`
      ${heroMediaHTML(p)}
      <div class="v-content">
        <div>
          ${tagHTML(p.type)}
          <h2 class="v-title" id="viewer-title">${esc(p.title)}</h2>
          ${p.subtitle ? `<p class="v-sub">${esc(p.subtitle)}</p>` : ""}
          <p class="v-desc">${esc(p.description || "")}</p>
          ${p.link ? `<a class="btn btn--ghost btn--sm v-link" href="${esc(p.link)}" target="_blank" rel="noopener">Visit live project ↗</a>` : ""}
        </div>
        <dl class="v-dl">${dl.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>
      </div>
      ${p.gallery?.length ? `<div class="v-gallery">${p.gallery.map((g, i) => imgHTML(g, `${p.title} — image ${i + 1}`)).join("")}</div>` : ""}
    `);
  }

  document.addEventListener("click", e => {
    const o = e.target.closest("[data-open-project]");
    if (o) { e.preventDefault(); openProject(o.dataset.openProject); }
  });

  /* =====================================================================
     REELS — 9:16 phones, lazy video, play only when visible
     ===================================================================== */
  function renderReels() {
    const track = $("[data-reels]"); if (!track) return;
    const reels = E.reels || [];
    track.innerHTML = reels.map((r, i) => `
      <figure class="phone reveal" style="--d:${i * 0.07}s">
        <div class="phone__frame">
          <div class="phone__screen">
            ${r.poster ? imgHTML(r.poster, r.title) : artHTML(r.art, r.title)}
            ${r.video ? `<video muted loop playsinline preload="none" data-src="${esc(r.video)}" ${r.poster ? `poster="${esc(r.poster)}"` : ""} aria-label="${esc(r.title)}"></video>` : ""}
            <div class="phone__side" aria-hidden="true"><i></i><i></i><i></i></div>
            ${!(r.video || r.vimeoUrl || r.poster) ? `<div class="phone__soon" aria-hidden="true"><i></i>Coming soon</div>` : ""}
            <div class="phone__ui">${r.video || r.vimeoUrl ? tagHTML(r.type) : ""}<strong>${esc(r.title)}</strong></div>
          </div>
          ${(r.vimeoUrl || r.video) ? `<button class="phone__btn" type="button" data-reel="${i}" aria-label="Play ${esc(r.title)}"></button>` : ""}
        </div>
        <figcaption class="phone__cap mono">${esc(r.category)}</figcaption>
      </figure>`).join("");

    const ready = reels.filter(r => r.video || r.vimeoUrl).length, note = $("[data-reels-note]");
    if (note) note.textContent = ready ? `${ready} reel${ready > 1 ? "s" : ""} · more dropping soon` : "New reels dropping soon";

    // lazy-load + autoplay when on screen
    if (!REDUCED && "IntersectionObserver" in window) {
      const io = new IntersectionObserver(entries => entries.forEach(en => {
        const v = $("video", en.target); if (!v) return;
        if (en.isIntersecting) { if (!v.src) v.src = v.dataset.src; v.play().catch(() => {}); }
        else v.pause();
      }), { threshold: 0.4 });
      $$(".phone", track).forEach(p => io.observe(p));
    }

    track.addEventListener("click", e => {
      if (track.dataset.dragged === "1") return;
      const b = e.target.closest("[data-reel]"); if (!b) return;
      const r = reels[+b.dataset.reel];
      openViewer(`${heroMediaHTML({ ...r, heroVideo: r.video }, true)}
        <div class="v-content"><div>${tagHTML(r.type)}<h2 class="v-title" id="viewer-title">${esc(r.title)}</h2><p class="v-sub">${esc(r.category)}</p></div></div>`);
    });

    // drag-to-scroll on desktop
    let down = false, sx = 0, sl = 0, moved = 0;
    track.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") return; down = true; moved = 0; sx = e.clientX; sl = track.scrollLeft; track.dataset.dragged = "0"; });
    addEventListener("pointermove", e => { if (!down) return; const dx = e.clientX - sx; moved = Math.abs(dx); if (moved > 4) { track.classList.add("is-dragging"); track.dataset.dragged = "1"; } track.scrollLeft = sl - dx; });
    addEventListener("pointerup", () => { if (!down) return; down = false; track.classList.remove("is-dragging"); setTimeout(() => track.dataset.dragged = "0", 50); });
    observeReveals(track);
  }

  /* =====================================================================
     AI CREATIVE LAB
     ===================================================================== */
  function renderLab() {
    const box = $("[data-lab]"), fbox = $("[data-lab-filters]"); if (!box) return;
    const items = E.aiLab || [];
    fbox.innerHTML = (E.aiLabCategories || ["All"]).map((c, i) => `<button class="filter" role="tab" type="button" aria-selected="${i === 0}" data-labcat="${esc(c)}">${esc(c)}</button>`).join("");
    const draw = cat => {
      const list = items.map((it, idx) => ({ it, idx })).filter(({ it }) => cat === "All" || it.category === cat);
      box.innerHTML = list.map(({ it, idx }, i) => `
        <button class="tile tile--${esc(it.ratio || "portrait")}" type="button" style="--i:${i}" data-lab-item="${idx}" aria-label="${esc(it.title)} — ${esc(it.category)} concept">
          <div class="tile__media">${it.image ? imgHTML(it.image, `${it.title} — AI concept`) : artHTML(it.art, it.title)}</div>
          ${tagHTML(it.type)}
          <div class="tile__info"><strong>${esc(it.title)}</strong><span>${esc(it.category)}<span class="tile__tools"> · ${esc((it.tools || []).join(", "))}</span></span></div>
        </button>`).join("");
    };
    fbox.addEventListener("click", e => {
      const b = e.target.closest("[data-labcat]"); if (!b) return;
      $$("[data-labcat]", fbox).forEach(x => x.setAttribute("aria-selected", x === b));
      draw(b.dataset.labcat);
    });
    box.addEventListener("click", e => {
      const t = e.target.closest("[data-lab-item]"); if (!t) return;
      const it = items[+t.dataset.labItem];
      openViewer(`${heroMediaHTML({ ...it, thumbnail: it.image }, it.ratio === "portrait")}
        <div class="v-content">
          <div>${tagHTML(it.type)}<h2 class="v-title" id="viewer-title">${esc(it.title)}</h2><p class="v-sub">${esc(it.category)} concept</p></div>
          <dl class="v-dl">
            <div><dt>Concept</dt><dd>${esc(it.concept || it.title)}</dd></div>
            <div><dt>Category</dt><dd>${esc(it.category)}</dd></div>
            <div><dt>Tools</dt><dd><div class="v-chips">${(it.tools || []).map(x => `<span>${esc(x)}</span>`).join("")}</div></dd></div>
            <div><dt>Project type</dt><dd>${esc(typeLabel(it.type))}</dd></div>
          </dl>
        </div>`);
    });
    draw("All");
  }

  /* =====================================================================
     3D SHOWROOM — model-viewer loaded only when the section is near
     ===================================================================== */
  function renderShowroom() {
    const models = E.models || []; const room = $(".room"); if (!room || !models.length) return;
    const vp = $("[data-room-viewport]"), list = $("[data-room-list]"), btn = $("[data-room-activate]");
    let mv = null, current = 0, loading = null;
    list.innerHTML = models.map((m, i) => `<button class="room__item" role="tab" type="button" aria-selected="${i === 0}" data-model="${i}"><span>${esc(m.name)}</span><small>${String(i + 1).padStart(2, "0")}</small></button>`).join("");
    const info = i => {
      const m = models[i];
      $("[data-room-name]").textContent = m.name;
      $("[data-room-text]").textContent = m.text || "";
      const t = $("[data-room-type]"); t.className = `tag tag--${m.type || "lab"}`; t.textContent = typeLabel(m.type);
    };
    info(0);

    const loadLib = () => loading || (loading = new Promise((res, rej) => {
      if (customElements.get("model-viewer")) return res();
      const s = document.createElement("script");
      s.type = "module"; s.src = "https://cdn.jsdelivr.net/npm/@google/model-viewer@4.0.0/dist/model-viewer.min.js";
      s.onload = () => customElements.whenDefined("model-viewer").then(res); s.onerror = rej;
      document.head.appendChild(s);
    }));

    const show = i => {
      current = i; info(i);
      $$("[data-model]", list).forEach(b => b.setAttribute("aria-selected", +b.dataset.model === i));
      if (!mv) return;
      room.classList.add("is-loading");
      mv.src = models[i].src; mv.alt = `${models[i].name} — interactive 3D model`;
      mv.poster = models[i].poster || "";
    };

    const activate = () => {
      if (mv) return;
      room.classList.add("is-loading"); btn.disabled = true;
      loadLib().then(() => {
        mv = document.createElement("model-viewer");
        Object.entries({
          "camera-controls": "", "touch-action": "pan-y", "interaction-prompt": "auto",
          "shadow-intensity": "1", "shadow-softness": "0.9", exposure: "1.05",
          "environment-image": "neutral", "tone-mapping": "agx", loading: "eager", reveal: "auto",
          "camera-orbit": "30deg 72deg auto", "min-camera-orbit": "auto auto 40%", "max-camera-orbit": "auto auto 140%"
        }).forEach(([k, v]) => mv.setAttribute(k, v));
        if (!REDUCED) { mv.setAttribute("auto-rotate", ""); mv.setAttribute("auto-rotate-delay", "800"); mv.setAttribute("rotation-per-second", "18deg"); }
        mv.addEventListener("load", () => room.classList.remove("is-loading"));
        mv.addEventListener("error", () => { room.classList.remove("is-loading"); $("[data-room-loading]").textContent = "Model could not be loaded."; room.classList.add("is-loading"); });
        vp.appendChild(mv); btn.hidden = true; show(current);
      }).catch(() => {
        room.classList.remove("is-loading"); btn.disabled = false;
        btn.querySelector("span:last-child").textContent = "3D viewer unavailable — tap to retry";
        loading = null;
      });
    };
    btn.addEventListener("click", activate);
    list.addEventListener("click", e => { const b = e.target.closest("[data-model]"); if (b) { show(+b.dataset.model); activate(); } });

    // auto-activate when close to the viewport, unless the visitor saves data
    const saveData = navigator.connection && navigator.connection.saveData;
    if (!saveData && "IntersectionObserver" in window) {
      const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { activate(); io.disconnect(); } }, { rootMargin: "300px 0px" });
      io.observe(room);
    }
  }

  /* =====================================================================
     PROJECT INQUIRY FORM
     ===================================================================== */
  function renderForm() {
    const form = $("#inquiry"); if (!form) return;
    const cfg = SITE.form || {};
    $("[data-form-types]").innerHTML = (cfg.projectTypes || []).map(t => `<label class="chip"><input type="checkbox" name="projectType" value="${esc(t)}"><span>${esc(t)}</span></label>`).join("");
    $("[data-form-timelines]").insertAdjacentHTML("beforeend", (cfg.timelines || []).map(t => `<option>${esc(t)}</option>`).join(""));
    $("[data-form-budgets]").insertAdjacentHTML("beforeend", (cfg.budgets || []).map(t => `<option>${esc(t)}</option>`).join(""));
    $("[data-form-note]").textContent = `Every project is quoted individually. ${SITE.contact?.responseNote || ""}`;
    const status = $("[data-form-status]");

    const fieldOf = el => el.closest(".field");
    const setErr = (field, msg) => {
      field.classList.toggle("is-invalid", !!msg);
      let e = $(".err", field);
      if (msg) { if (!e) { e = document.createElement("span"); e.className = "err"; field.appendChild(e); } e.textContent = msg; }
      else if (e) e.remove();
    };
    const validate = () => {
      let ok = true, first = null;
      const fail = (el, msg) => { setErr(fieldOf(el), msg); if (ok) first = el; ok = false; };
      const name = form.elements.name, email = form.elements.email, desc = form.elements.description;
      [name, email, desc].forEach(el => setErr(fieldOf(el), ""));
      if (!name.value.trim()) fail(name, "Please tell us your name.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) fail(email, "Please enter a valid email.");
      const types = $$("input[name=projectType]:checked", form);
      const tf = $("[data-form-types]").closest(".field"); setErr(tf, "");
      if (!types.length) fail($("input[name=projectType]", form), "Choose at least one project type.");
      if (desc.value.trim().length < 10) fail(desc, "A sentence or two about the project helps us reply properly.");
      if (first) first.focus();
      return ok;
    };
    form.addEventListener("input", e => { const f = fieldOf(e.target); if (f && f.classList.contains("is-invalid")) setErr(f, ""); });

    form.addEventListener("submit", async e => {
      e.preventDefault();
      status.className = "form__status"; status.textContent = "";
      if (form.elements.website_hp.value) return; // bot
      if (!validate()) { status.classList.add("is-err"); status.textContent = "Please check the highlighted fields."; return; }
      const fd = new FormData(form);
      const data = {
        name: fd.get("name"), company: fd.get("company"), email: fd.get("email"), country: fd.get("country"),
        projectType: fd.getAll("projectType").join(", "), description: fd.get("description"),
        timeline: fd.get("timeline"), budget: fd.get("budget"), reference: fd.get("reference"), notes: fd.get("notes"),
        source: location.href
      };
      const btn = $("button[type=submit]", form);
      if (cfg.endpoint) {
        btn.disabled = true; btn.firstChild.textContent = "Sending… ";
        try {
          const r = await fetch(cfg.endpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) });
          if (!r.ok) throw new Error(r.status);
          done(data.name);
        } catch {
          status.classList.add("is-err");
          status.innerHTML = `Something went wrong sending your request. Please email us at <a href="mailto:${esc(SITE.contact?.email)}">${esc(SITE.contact?.email)}</a>.`;
        } finally { btn.disabled = false; btn.firstChild.textContent = "Request a proposal "; }
      } else {
        const body = Object.entries({
          Name: data.name, Company: data.company, Email: data.email, Country: data.country, "Project type": data.projectType,
          Timeline: data.timeline, "Budget range": data.budget, "Reference / website": data.reference,
          "Project description": data.description, "Additional notes": data.notes
        }).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n");
        const href = `mailto:${SITE.contact?.email}?subject=${encodeURIComponent(`Project inquiry — ${data.company || data.name}`)}&body=${encodeURIComponent(body)}`;
        location.href = href;
        status.classList.add("is-ok");
        status.textContent = "Your email app should open with your request ready to send. If it didn't, email us directly at " + SITE.contact?.email + ".";
      }
    });
    function done(name) {
      form.classList.add("is-sent");
      form.insertAdjacentHTML("beforeend", `<div class="form__done"><span class="dot" style="display:inline-block;margin-bottom:18px"></span><h3>Thank you, ${esc(String(name).split(" ")[0])}.</h3><p class="muted">Your request is with us. ${esc(SITE.contact?.responseNote || "")}</p></div>`);
    }
  }

  /* =====================================================================
     NAVIGATION
     ===================================================================== */
  function initNav() {
    const nav = $(".nav"), toggle = $(".nav__toggle"), menu = $("#mobile-menu");
    let lastY = scrollY;
    onScroll(() => {
      const y = scrollY;
      nav.classList.toggle("is-scrolled", y > 20);
      nav.classList.toggle("is-hidden", y > lastY && y > 600 && menu.hidden);
      lastY = y;
    });
    const setMenu = open => {
      toggle.setAttribute("aria-expanded", open); toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      menu.hidden = !open; document.body.classList.toggle("is-locked", open);
      if (open) $("a", menu).focus();
    };
    toggle.addEventListener("click", () => setMenu(menu.hidden));
    menu.addEventListener("click", e => { if (e.target.closest("a")) setMenu(false); });
    addEventListener("keydown", e => { if (e.key === "Escape" && !menu.hidden) { setMenu(false); toggle.focus(); } });
    addEventListener("resize", () => { if (innerWidth > 1100 && !menu.hidden) setMenu(false); });

    // active section highlight
    const links = $$(".nav__links a");
    const map = new Map(links.map(a => [a.getAttribute("href").slice(1), a]));
    map.set("portfolio", map.get("work")); map.set("reels", map.get("work")); map.set("why", map.get("process")); map.set("start", map.get("contact"));
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(es => es.forEach(en => {
        if (en.isIntersecting) { links.forEach(a => a.classList.remove("is-active")); map.get(en.target.id)?.classList.add("is-active"); }
      }), { rootMargin: "-45% 0px -50% 0px" });
      $$("main section[id], footer[id]").forEach(s => map.has(s.id) && io.observe(s));
    }
  }

  /* =====================================================================
     MOTION UTILITIES
     ===================================================================== */
  const scrollFns = []; let ticking = false;
  function onScroll(fn) { scrollFns.push(fn); }
  addEventListener("scroll", () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => { scrollFns.forEach(f => f()); ticking = false; });
  }, { passive: true });
  addEventListener("resize", () => scrollFns.forEach(f => f()), { passive: true });

  let revealIO = null;
  function observeReveals(root = document) {
    const els = $$(".reveal:not(.in)", root);
    if (REDUCED || !("IntersectionObserver" in window)) { els.forEach(el => el.classList.add("in")); return; }
    revealIO = revealIO || new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add("in"); revealIO.unobserve(en.target); }
    }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    els.forEach(el => revealIO.observe(el));
  }

  function initParallax() {
    if (REDUCED) return;
    const brand = $("[data-brand-reveal]");
    if (brand) onScroll(() => {
      const r = brand.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const p = Math.min(1, Math.max(0, 1 - (r.top + r.height * 0.5) / (innerHeight + r.height * 0.5))); // 0 entering → 1 leaving
      brand.style.setProperty("--bs", (1.14 - Math.min(p, 0.55) * 0.25).toFixed(4));
      brand.style.setProperty("--bo", Math.min(1, 0.35 + p * 1.6).toFixed(3));
    });
    onScroll(() => {
      $$("[data-parallax]").forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; // -1..1
        el.style.setProperty("--py", `${(p * -28).toFixed(1)}px`);
      });
    });
  }

  /* =====================================================================
     HERO — ELAW CREATIVE CORE  (Three.js, with CSS fallback)
     ===================================================================== */
  /* Icons for the Creative Core (24×24 line icons, drawn for ELAW) */
  const circ = (x, y, r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
  const CORE_ICONS = {
    Camera:  { d: ["M3.5 8.5h3.2l1.8-2.6h7l1.8 2.6h3.2v10.6H3.5z", circ(12, 13.6, 3.6), circ(17.6, 10.6, .4)] },
    Video:   { d: ["M3.5 6.5h17v11h-17z"], fill: ["M10 9.4v5.2l4.6-2.6z"] },
    Social:  { d: ["M12 19.5s-7-4.3-7-9.3A3.9 3.9 0 0 1 12 7.6a3.9 3.9 0 0 1 7 2.6c0 5-7 9.3-7 9.3z"] },
    AI:      { d: ["M12 3.5l2 6.5 6.5 2-6.5 2-2 6.5-2-6.5-6.5-2 6.5-2z", "M18.5 3.8v3M17 5.3h3"] },
    "3D":    { d: ["M12 3.6l7.6 4.3v8.4L12 20.6l-7.6-4.3V7.9z", "M12 12.2l7.6-4.3M12 12.2v8.4M12 12.2L4.4 7.9"] },
    Digital: { d: ["M3.5 5h17v11h-17z", "M9 19.5h6M12 16v3.5", "M7 9.5l2 1.5-2 1.5M11 12.5h3"] },
    Music:   { d: ["M9 17.5V6.2l10-2v11", circ(6.6, 17.5, 2.4), circ(16.6, 15.2, 2.4)] }
  };
  const iconSVG = name => {
    const ic = CORE_ICONS[name]; if (!ic) return "";
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ic.d.map(d => `<path d="${d}"/>`).join("")}${(ic.fill || []).map(d => `<path d="${d}" fill="currentColor" stroke="none"/>`).join("")}</svg>`;
  };

  function buildFallbackSats() {
    const box = $("[data-core-sats]"); if (!box) return;
    const sats = C.coreSatellites || [];
    box.innerHTML = sats.map((s, i) => {
      const a = (i / sats.length) * Math.PI * 2 - Math.PI / 2, rad = 46;
      return `<div class="core__sat" style="left:${50 + Math.cos(a) * rad}%;top:${50 + Math.sin(a) * rad}%"><span title="${esc(s)}" style="--c1:${(ICON_TINTS[s] || [])[0] || "#cfd5dc"};--c2:${(ICON_TINTS[s] || [])[1] || "#59606a"}">${iconSVG(s)}</span></div>`;
    }).join("");
  }

  /* Draw a glossy 3D sphere icon to a canvas → texture for a Three.js sprite */
  const ICON_TINTS = {
    Camera: ["#ffd36b", "#e07b12"], Video: ["#ff8a7a", "#d8264a"], Social: ["#ff9fd0", "#d6267e"],
    AI: ["#c9b2ff", "#6d3df0"], "3D": ["#8cf2ff", "#1b8fd6"], Digital: ["#9fb4ff", "#3b4fd8"], Music: ["#8ff0c0", "#14a06a"]
  };
  function iconTexture(THREE, name) {
    const S = 256, c = document.createElement("canvas"); c.width = c.height = S;
    const g = c.getContext("2d"), [c1, c2] = ICON_TINTS[name] || ["#cfd5dc", "#59606a"];
    const cx = S / 2, cy = S / 2 - 4, rad = 100;
    // light contact shadow
    g.save(); g.filter = "blur(8px)"; g.fillStyle = "rgba(0,0,0,.28)"; g.beginPath(); g.ellipse(cx, cy + rad + 8, rad * .55, 8, 0, 0, Math.PI * 2); g.fill(); g.restore();
    // sphere body: bright, gently shaded towards the edge
    g.beginPath(); g.arc(cx, cy, rad, 0, Math.PI * 2);
    const body = g.createRadialGradient(cx - rad * .35, cy - rad * .4, rad * .05, cx, cy, rad);
    body.addColorStop(0, c1); body.addColorStop(.62, c2); body.addColorStop(1, c2);
    g.fillStyle = body; g.fill();
    g.save(); g.beginPath(); g.arc(cx, cy, rad, 0, Math.PI * 2); g.clip();
    const edge = g.createRadialGradient(cx, cy, rad * .7, cx, cy, rad); edge.addColorStop(0, "rgba(0,0,0,0)"); edge.addColorStop(1, "rgba(0,0,0,.18)");
    g.fillStyle = edge; g.fillRect(0, 0, S, S);
    // subtle diamond (brilliant) cut: octagon table + star and girdle facets
    const N = 8, tR = rad * .46, rot = Math.PI / 8, P = (r, k) => [cx + Math.cos(rot + k * Math.PI * 2 / N) * r, cy + Math.sin(rot + k * Math.PI * 2 / N) * r];
    for (let k = 0; k < N; k++) {
      const [ax, ay] = P(tR, k), [bx, by] = P(tR, k + 1), [ox, oy] = P(rad * 1.02, k + .5), [o1x, o1y] = P(rad * 1.02, k), [o2x, o2y] = P(rad * 1.02, k + 1);
      g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.lineTo(ox, oy); g.closePath(); g.fillStyle = k % 2 ? "rgba(255,255,255,.09)" : "rgba(0,0,0,.06)"; g.fill();
      g.beginPath(); g.moveTo(ax, ay); g.lineTo(o1x, o1y); g.lineTo(ox, oy); g.closePath(); g.fillStyle = k % 2 ? "rgba(0,0,0,.05)" : "rgba(255,255,255,.07)"; g.fill();
    }
    g.beginPath(); for (let k = 0; k <= N; k++) { const [px, py] = P(tR, k); k ? g.lineTo(px, py) : g.moveTo(px, py); } g.fillStyle = "rgba(255,255,255,.08)"; g.fill();
    g.lineWidth = 1.2; g.strokeStyle = "rgba(255,255,255,.22)";
    for (let k = 0; k < N; k++) { const [ax, ay] = P(tR, k), [ox, oy] = P(rad * 1.02, k + .5), [o1x, o1y] = P(rad * 1.02, k); g.beginPath(); g.moveTo(o1x, o1y); g.lineTo(ax, ay); g.lineTo(ox, oy); g.stroke(); }
    g.beginPath(); for (let k = 0; k <= N; k++) { const [px, py] = P(tR, k); k ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke();
    // glossy cap + hotspot
    const cap = g.createLinearGradient(0, cy - rad, 0, cy - rad * .1); cap.addColorStop(0, "rgba(255,255,255,.55)"); cap.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = cap; g.beginPath(); g.ellipse(cx - rad * .08, cy - rad * .5, rad * .6, rad * .36, -0.25, 0, Math.PI * 2); g.fill();
    const hot = g.createRadialGradient(cx - rad * .42, cy - rad * .5, 0, cx - rad * .42, cy - rad * .5, rad * .18); hot.addColorStop(0, "rgba(255,255,255,.9)"); hot.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = hot; g.fillRect(0, 0, S, S); g.restore();
    // bright rim
    g.beginPath(); g.arc(cx, cy, rad - 1.5, 0, Math.PI * 2); g.lineWidth = 3; g.strokeStyle = "rgba(255,255,255,.4)"; g.stroke();
    const x = cx - 98, y = cy - 98, h = 196;
    // icon glyph, white with soft drop shadow
    const ic = CORE_ICONS[name];
    if (ic) {
      g.save(); const k = 5.2; g.translate(S / 2 - 12 * k, y + h / 2 - 12 * k + 2); g.scale(k, k);
      g.shadowColor = "rgba(0,0,0,.22)"; g.shadowBlur = 4; g.shadowOffsetY = 2;
      g.strokeStyle = "#ffffff"; g.fillStyle = "#ffffff"; g.lineWidth = 1.9; g.lineCap = "round"; g.lineJoin = "round";
      ic.d.forEach(d => g.stroke(new Path2D(d))); (ic.fill || []).forEach(d => g.fill(new Path2D(d)));
      g.restore();
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  }

  function webglOK() {
    try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; }
  }

  async function initCore() {
    buildFallbackSats();
    const hero = $(".hero"), canvas = $("#core-canvas");
    if (REDUCED || !webglOK() || (navigator.connection && navigator.connection.saveData)) return;
    let THREE;
    try { THREE = await import("https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js"); }
    catch { return; } // CSS core stays

    const mobile = matchMedia("(max-width: 760px)").matches;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100); camera.position.set(0, 0, 9);

    const LIGHT = document.documentElement.dataset.theme === "light";
    // studio environment built in-code (no HDR download)
    const envScene = new THREE.Scene();
    const box = new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20), new THREE.MeshBasicMaterial({ color: LIGHT ? 0xbdb5a6 : TW ? 0x150e30 : 0x050608, side: THREE.BackSide }));
    envScene.add(box);
    const panel = (w, h, pos, col, int) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(int), side: THREE.DoubleSide })); m.position.set(...pos); m.lookAt(0, 0, 0); envScene.add(m); };
    if (TW) { panel(10, 4, [0, 8, 2], 0xffffff, 3.5); panel(4, 9, [-9, 1, 3], 0x9b6bff, 3); panel(3, 8, [9, 0, -2], 0xffa27a, 3); panel(12, 2, [0, -6, 6], 0x5b3bd6, 1.2); }
    else { panel(10, 4, [0, 8, 2], 0xffffff, 4); panel(4, 9, [-9, 1, 3], 0xffffff, 2.2); panel(3, 8, [9, 0, -2], 0x8cf2ff, 3); panel(12, 2, [0, -6, 6], 0xffffff, .8); }
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(envScene, 0.02).texture;

    const root = new THREE.Group(); scene.add(root);
    const accent = new THREE.Color(TW ? 0xb48cff : 0x8cf2ff);

    // ── SUN: faceted diamond core with a glowing heart
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), new THREE.MeshStandardMaterial({ color: 0xc9d1da, metalness: 0.85, roughness: 0.3, flatShading: true, envMapIntensity: 1.6, emissive: TW ? 0x2a1660 : 0x0d3a42, emissiveIntensity: 0.6 }));
    root.add(core);
    const heart = new THREE.Mesh(new THREE.SphereGeometry(0.16, 32, 32), new THREE.MeshBasicMaterial({ color: accent }));
    root.add(heart);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex(THREE), color: accent, transparent: true, blending: LIGHT ? THREE.NormalBlending : THREE.AdditiveBlending, depthWrite: false, opacity: LIGHT ? 0.35 : 0.55 }));
    glow.scale.set(2.6, 2.6, 1); root.add(glow);

    // ── 3D ICON MODELS (chrome + graphite, cyan light accents)
    const chrome = new THREE.MeshStandardMaterial({ color: 0xe9edf2, metalness: 1, roughness: 0.2, envMapIntensity: 1.5 });
    const graphite = new THREE.MeshStandardMaterial({ color: 0x2a2f37, metalness: 0.75, roughness: 0.32, envMapIntensity: 1.3 });
    const lit = new THREE.MeshStandardMaterial({ color: 0x06191d, emissive: accent, emissiveIntensity: 1.1, metalness: 0.2, roughness: 0.15 });
    const M = (geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); return m; };
    const ext = (shapes, depth = 0.2, bev = 0.05) => new THREE.ExtrudeGeometry(shapes, { depth, bevelEnabled: true, bevelThickness: bev, bevelSize: bev * .8, bevelSegments: 4, curveSegments: 28 });
    const PI2 = Math.PI / 2;
    const MODELS = {
      Camera: () => { const g = new THREE.Group();
        g.add(M(new THREE.BoxGeometry(1, .64, .42), graphite), M(new THREE.BoxGeometry(.38, .17, .32), graphite, -.2, .4, 0),
              M(new THREE.CylinderGeometry(.07, .07, .07, 24), chrome, .3, .36, 0),
              M(new THREE.CylinderGeometry(.27, .31, .34, 48), chrome, .04, -.02, .36, PI2),
              M(new THREE.TorusGeometry(.22, .035, 16, 48), chrome, .04, -.02, .53),
              M(new THREE.CylinderGeometry(.19, .19, .02, 48), lit, .04, -.02, .535, PI2),
              M(new THREE.BoxGeometry(.16, .08, .02), lit, .34, .18, .22));
        return g; },
      Video: () => { const g = new THREE.Group();
        g.add(M(new THREE.BoxGeometry(.92, .5, .42), graphite),
              M(new THREE.CylinderGeometry(.23, .23, .1, 48), chrome, -.22, .5, 0, PI2), M(new THREE.CylinderGeometry(.23, .23, .1, 48), chrome, .25, .5, 0, PI2),
              M(new THREE.CylinderGeometry(.06, .06, .14, 24), lit, -.22, .5, 0, PI2), M(new THREE.CylinderGeometry(.06, .06, .14, 24), lit, .25, .5, 0, PI2),
              M(new THREE.CylinderGeometry(.13, .21, .3, 40), chrome, .6, -.02, 0, 0, 0, PI2),
              M(new THREE.CylinderGeometry(.12, .12, .02, 40), lit, .76, -.02, 0, 0, 0, PI2));
        return g; },
      Social: () => { const h = new THREE.Shape();
        h.moveTo(0, -.45); h.bezierCurveTo(-.15, -.32, -.55, -.05, -.55, .18); h.bezierCurveTo(-.55, .42, -.33, .55, -.17, .55); h.bezierCurveTo(-.07, .55, 0, .48, 0, .4);
        h.bezierCurveTo(0, .48, .07, .55, .17, .55); h.bezierCurveTo(.33, .55, .55, .42, .55, .18); h.bezierCurveTo(.55, -.05, .15, -.32, 0, -.45);
        const g = new THREE.Group(); g.add(M(ext(h, .24, .07), chrome)); return g; },
      AI: () => { const star = (s, x = 0, y = 0) => { const sh = new THREE.Shape(); sh.moveTo(x, y + .6 * s); sh.quadraticCurveTo(x + .08 * s, y + .08 * s, x + .6 * s, y); sh.quadraticCurveTo(x + .08 * s, y - .08 * s, x, y - .6 * s); sh.quadraticCurveTo(x - .08 * s, y - .08 * s, x - .6 * s, y); sh.quadraticCurveTo(x - .08 * s, y + .08 * s, x, y + .6 * s); return sh; };
        const g = new THREE.Group(); g.add(M(ext(star(1), .2, .06), chrome), M(ext(star(.36, 1.45, 1.45), .12, .03), lit, 0, 0, .05)); return g; },
      "3D": () => { const g = new THREE.Group(), geo = new THREE.BoxGeometry(.7, .7, .7);
        g.add(M(geo, chrome), new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(.72, .72, .72)), new THREE.LineBasicMaterial({ color: accent })));
        g.rotation.set(.6, .7, 0); return g; },
      Digital: () => { const g = new THREE.Group();
        g.add(M(new THREE.BoxGeometry(1.05, .68, .07), graphite), M(new THREE.PlaneGeometry(.93, .56), lit, 0, .02, .037),
              M(new THREE.BoxGeometry(.34, .045, .01), chrome, -.2, .12, .045), M(new THREE.BoxGeometry(.5, .045, .01), chrome, -.12, .02, .045), M(new THREE.BoxGeometry(.26, .045, .01), chrome, -.24, -.08, .045),
              M(new THREE.CylinderGeometry(.045, .045, .24, 20), chrome, 0, -.45, 0), M(new THREE.BoxGeometry(.42, .035, .2), chrome, 0, -.57, 0));
        return g; },
      Music: () => { const head = (x, y) => { const s = new THREE.Shape(); s.absellipse(x, y, .17, .13, 0, Math.PI * 2, false, -.4); return s; };
        const rect = (x0, y0, x1, y1) => { const s = new THREE.Shape(); s.moveTo(x0, y0); s.lineTo(x1, y0); s.lineTo(x1, y1); s.lineTo(x0, y1); s.lineTo(x0, y0); return s; };
        const beam = new THREE.Shape(); beam.moveTo(-.13, .3); beam.lineTo(.47, .42); beam.lineTo(.47, .56); beam.lineTo(-.13, .44); beam.lineTo(-.13, .3);
        const g = new THREE.Group(); g.add(M(ext([head(-.24, -.36), head(.32, -.24), rect(-.13, -.36, -.07, .4), rect(.41, -.24, .47, .5), beam], .16, .04), chrome)); return g; }
    };
    const buildIcon = name => {
      const g = (MODELS[name] || MODELS["3D"])();
      const bb = new THREE.Box3().setFromObject(g), c = bb.getCenter(new THREE.Vector3()), sz = bb.getSize(new THREE.Vector3());
      g.children.forEach(ch => ch.position.sub(c));
      const holder = new THREE.Group(); holder.add(g); holder.scale.setScalar((mobile ? .36 : .32) / Math.max(sz.x, sz.y, sz.z)); return holder;
    };

    // ── SOLAR SYSTEM: flat, tilted concentric orbits around the diamond sun
    const TILT = 0.42;
    const satNames = C.coreSatellites || [];
    const solar = new THREE.Group(); root.add(solar);
    const orbitPos = (r, a, out) => out.set(Math.cos(a) * r, -Math.sin(a) * r * Math.sin(TILT), Math.sin(a) * r * Math.cos(TILT));
    const tmp = new THREE.Vector3();
    const labels = document.createElement("div"); labels.className = "core-labels"; labels.setAttribute("aria-hidden", "true");
    Object.assign(labels.style, { position: "absolute", inset: "0", pointerEvents: "none" });
    $(".hero__stage").appendChild(labels);
    const sats = satNames.map((name, i) => {
      const r = 0.74 + i * 0.165;
      const pts = []; for (let k = 0; k <= 160; k++) pts.push(orbitPos(r, k / 160 * Math.PI * 2, new THREE.Vector3()));
      solar.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: i % 2 ? 0xffffff : accent, transparent: true, opacity: i % 2 ? .1 : .22 })));
      const icon = buildIcon(name); solar.add(icon);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex(THREE), color: accent, transparent: true, opacity: .22, blending: LIGHT ? THREE.NormalBlending : THREE.AdditiveBlending, depthWrite: false }));
      halo.scale.set(.55, .55, 1); solar.add(halo);
      const lab = document.createElement("span"); lab.textContent = name;
      Object.assign(lab.style, { position: "absolute", left: "0", top: "0", fontFamily: "var(--f-mono)", fontSize: "10.5px", letterSpacing: ".14em", textTransform: "uppercase", color: LIGHT ? "rgba(23,21,15,.85)" : "rgba(243,244,246,.85)", padding: "5px 9px", borderRadius: "99px", border: LIGHT ? "1px solid rgba(28,24,18,.14)" : "1px solid rgba(255,255,255,.14)", background: LIGHT ? "rgba(255,255,255,.6)" : "rgba(8,10,13,.45)", backdropFilter: "blur(6px)", whiteSpace: "nowrap", willChange: "transform,opacity", transition: "opacity .4s" });
      labels.appendChild(lab);
      return { icon, halo, lab, r, a: i * 2.4, w: 0.42 * Math.pow(0.74 / r, 1.5), spin: 0.5 + (i % 3) * 0.2 };
    });

    // dust
    const N = mobile ? 260 : 600, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { const r = 2.4 + Math.random() * 3.5, t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1); pos.set([r * Math.sin(p) * Math.cos(t), r * Math.cos(p) * .6, r * Math.sin(p) * Math.sin(t)], i * 3); }
    const dustG = new THREE.BufferGeometry(); dustG.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const dust = new THREE.Points(dustG, new THREE.PointsMaterial({ size: 0.018, color: LIGHT ? 0x9a7444 : TW ? 0xe9dcff : 0xcfe9ee, transparent: true, opacity: LIGHT ? .35 : .55, depthWrite: false }));
    root.add(dust);

    // floating glass cubes (twilight theme)
    const cubes = [];
    if (TW) {
      const cols = [0x8b5cf6, 0x22d3ee, 0xffb547, 0xf472b6, 0xa78bfa, 0x38bdf8];
      const spots = [[-2.1, 1.25, 0.6, .42], [1.95, 1.55, -0.4, .34], [2.25, -1.3, 0.5, .3], [-1.8, -1.45, -0.3, .26], [-0.6, 2.05, -0.8, .22], [0.7, -2.05, 0.2, .2]];
      spots.slice(0, mobile ? 4 : 6).forEach(([x, y, z, s], i) => {
        const g = new THREE.Group();
        const geo = new THREE.BoxGeometry(s, s, s);
        const glass = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: cols[i], metalness: 0.1, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.05, iridescence: 1, iridescenceIOR: 1.35, envMapIntensity: 2.2, transparent: true, opacity: 0.62, emissive: cols[i], emissiveIntensity: 0.18 }));
        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 }));
        const inner = new THREE.Mesh(new THREE.BoxGeometry(s * .42, s * .42, s * .42), new THREE.MeshBasicMaterial({ color: cols[i] }));
        g.add(glass, edges, inner); g.userData = { base: new THREE.Vector3(x, y, z), ph: i * 1.3, sp: 0.25 + (i % 3) * 0.12 };
        g.rotation.set(Math.random() * 3, Math.random() * 3, 0); scene.add(g); cubes.push(g);
      });
    }

    const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(3, 5, 4); scene.add(key);
    const rim = new THREE.PointLight(accent, 6, 10); rim.position.set(-2.5, -1, 2); scene.add(rim);

    // layout
    let W = 0, H = 0, baseX = 0, baseY = 0, baseS = 1;
    const resize = () => {
      W = hero.clientWidth; H = hero.clientHeight;
      renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
      const wide = W / H > 1.05;
      baseX = wide ? Math.min(2.9, camera.aspect * 1.45) : 0.7; baseY = wide ? 0.2 : 1.35; baseS = wide ? 0.95 : 0.72;
    };
    resize(); addEventListener("resize", resize);

    // interaction
    let mx = 0, my = 0, tx = 0, ty = 0, scrollP = 0, visible = true, raf = 0;
    addEventListener("pointermove", e => { tx = (e.clientX / innerWidth - .5); ty = (e.clientY / innerHeight - .5); }, { passive: true });
    onScroll(() => { scrollP = Math.min(1, Math.max(0, scrollY / (hero.offsetHeight || 1))); });
    new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible && !raf) loop(); }).observe(hero);
    document.addEventListener("visibilitychange", () => { if (!document.hidden && visible && !raf) loop(); });

    const clock = new THREE.Clock(), v = new THREE.Vector3();
    function loop() {
      if (!visible || document.hidden) { raf = 0; return; }
      raf = requestAnimationFrame(loop);
      const dtF = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
      mx += (tx - mx) * 0.04; my += (ty - my) * 0.04;
      root.position.set(baseX - mx * 0.25, baseY + my * 0.2 + scrollP * 1.6, 0);
      const s = baseS * (1 - scrollP * 0.18); root.scale.setScalar(s);
      root.rotation.y = mx * 0.35;
      root.rotation.x = Math.sin(t * 0.3) * 0.03 + my * 0.2;
      core.rotation.set(t * 0.3, t * 0.45, 0);
      heart.scale.setScalar(1 + Math.sin(t * 2) * 0.08);
      glow.material.opacity = 0.45 + Math.sin(t * 2) * 0.1;
      dust.rotation.y = -t * 0.02;
      cubes.forEach(c => {
        const u = c.userData;
        c.position.set(root.position.x + u.base.x * s, root.position.y + u.base.y * s + Math.sin(t * u.sp + u.ph) * 0.12, u.base.z);
        c.rotation.x += 0.004 * (1 + u.sp); c.rotation.y += 0.006 * (1 + u.sp);
        c.scale.setScalar(1 - scrollP * 0.3);
      });
      sats.forEach(o => {
        o.a += o.w * dtF * (1 + scrollP * 1.5);
        orbitPos(o.r, o.a, o.icon.position); o.halo.position.copy(o.icon.position);
        o.icon.rotation.y = t * o.spin; o.icon.rotation.x = Math.sin(t * .6 + o.r) * .2;
        const front = Math.sin(o.a) > -0.15;
        o.icon.getWorldPosition(v); v.project(camera);
        const x = (v.x * .5 + .5) * W, y = (-v.y * .5 + .5) * H;
        o.lab.style.transform = `translate(${(x + 24).toFixed(1)}px, ${(y - 10).toFixed(1)}px)`;
        o.lab.style.opacity = front ? (1 - scrollP * 1.5).toFixed(2) : "0.22";
      });
      renderer.render(scene, camera);
    }
    loop();
    hero.classList.add("has-webgl");
  }

  function radialTex(THREE) {
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const g = c.getContext("2d"), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(.25, "rgba(255,255,255,.35)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  /* =====================================================================
     BOOT
     ===================================================================== */
  function boot() {
    renderContact(); renderServices(); renderStory(); renderFeatured(); renderPortfolio();
    renderReels(); renderLab(); renderShowroom(); renderProcess(); renderWhy(); renderForm();
    initNav(); initParallax(); observeReveals();
    requestAnimationFrame(() => document.documentElement.classList.add("is-ready"));
    scrollFns.forEach(f => f());
    const start = () => initCore().catch(() => {});
    "requestIdleCallback" in window ? requestIdleCallback(start, { timeout: 1200 }) : setTimeout(start, 300);
  }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", boot) : boot();

  // expose helpers for debugging / future pages
  window.ELAW.utils = { parseVimeo, vimeoEmbedURL };
})();
