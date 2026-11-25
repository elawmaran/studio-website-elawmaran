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
    const q = new URLSearchParams({ autoplay: autoplay ? 1 : 0, title: 0, byline: 0, portrait: 0, dnt: 1, color: "8cf2ff" });
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
  function renderServices() {
    const box = $("[data-services]"); if (!box) return;
    box.innerHTML = (C.services || []).map((s, i) => `
      <article class="svc__row reveal" style="--d:${i * 0.06}s" id="svc-${esc(s.id)}">
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
  function buildFallbackSats() {
    const box = $("[data-core-sats]"); if (!box) return;
    const sats = C.coreSatellites || [];
    box.innerHTML = sats.map((s, i) => {
      const a = (i / sats.length) * Math.PI * 2 - Math.PI / 2, rad = 46;
      return `<div class="core__sat" style="left:${50 + Math.cos(a) * rad}%;top:${50 + Math.sin(a) * rad}%"><span>${esc(s)}</span></div>`;
    }).join("");
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

    // studio environment built in-code (no HDR download)
    const envScene = new THREE.Scene();
    const box = new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20), new THREE.MeshBasicMaterial({ color: 0x050608, side: THREE.BackSide }));
    envScene.add(box);
    const panel = (w, h, pos, col, int) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(int), side: THREE.DoubleSide })); m.position.set(...pos); m.lookAt(0, 0, 0); envScene.add(m); };
    panel(10, 4, [0, 8, 2], 0xffffff, 4); panel(4, 9, [-9, 1, 3], 0xffffff, 2.2); panel(3, 8, [9, 0, -2], 0x8cf2ff, 3); panel(12, 2, [0, -6, 6], 0xffffff, .8);
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(envScene, 0.02).texture;

    const root = new THREE.Group(); scene.add(root);
    const accent = new THREE.Color(0x8cf2ff);

    // glass shell
    // glass shell: thin clear-coat surface + fresnel rim (cheaper and cleaner than transmission)
    const shellGeo = new THREE.SphereGeometry(1.35, mobile ? 48 : 96, mobile ? 48 : 96);
    const shell = new THREE.Mesh(shellGeo, new THREE.MeshBasicMaterial({ color: 0x8cf2ff, transparent: true, opacity: 0.035, depthWrite: false }));
    root.add(shell);
    const rimMat = new THREE.ShaderMaterial({
      uniforms: { c: { value: new THREE.Color(0x8cf2ff) } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: "varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }",
      fragmentShader: "uniform vec3 c; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 2.6); float hi = pow(max(dot(vN, normalize(vec3(-0.5,0.7,0.5))),0.0), 40.0); gl_FragColor = vec4(c * f * 0.85 + vec3(f*f*0.4 + hi*0.6), clamp(f + hi*0.6, 0.0, 1.0)); }"
    });
    root.add(new THREE.Mesh(shellGeo, rimMat));
    // inner faceted metal core + glowing heart
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), new THREE.MeshStandardMaterial({ color: 0xc9d1da, metalness: 0.85, roughness: 0.3, flatShading: true, envMapIntensity: 1.6, emissive: 0x0d3a42, emissiveIntensity: 0.6 }));
    root.add(core);
    const heart = new THREE.Mesh(new THREE.SphereGeometry(0.16, 32, 32), new THREE.MeshBasicMaterial({ color: accent }));
    root.add(heart);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex(THREE), color: accent, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.55 }));
    glow.scale.set(2.6, 2.6, 1); root.add(glow);

    // orbit rings
    const metal = new THREE.MeshStandardMaterial({ color: 0xdfe3e8, metalness: 1, roughness: 0.18 });
    const rings = [[1.7, 0.01, 1.25, 0.2], [1.95, 0.005, -0.4, 0.9], [1.0, 0.007, 0.6, -0.6]].map(([r, t, rx, rz], i) => {
      const m = new THREE.Mesh(new THREE.TorusGeometry(r, t, 12, 220), i === 1 ? new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: .55 }) : metal);
      m.rotation.set(rx, 0, rz); root.add(m); return m;
    });

    // satellites — miniature disciplines inside the core
    const satNames = C.coreSatellites || [];
    const satMat = new THREE.MeshStandardMaterial({ color: 0xf2f4f7, metalness: 0.9, roughness: 0.25 });
    const satGeo = {
      AI: new THREE.OctahedronGeometry(0.13),
      Video: new THREE.BoxGeometry(0.24, 0.14, 0.05),
      Social: new THREE.TorusGeometry(0.09, 0.03, 12, 32),
      "3D": new THREE.BoxGeometry(0.16, 0.16, 0.16),
      Camera: new THREE.CylinderGeometry(0.08, 0.1, 0.16, 24),
      Digital: new THREE.PlaneGeometry(0.22, 0.16, 4, 3),
      Music: new THREE.SphereGeometry(0.08, 20, 20)
    };
    const labels = document.createElement("div"); labels.className = "core-labels"; labels.setAttribute("aria-hidden", "true");
    Object.assign(labels.style, { position: "absolute", inset: "0", pointerEvents: "none" });
    $(".hero__stage").appendChild(labels);
    const sats = satNames.map((name, i) => {
      const g = satGeo[name] || new THREE.IcosahedronGeometry(0.1);
      const mat = name === "3D" ? new THREE.MeshBasicMaterial({ color: accent, wireframe: true }) : name === "Digital" ? new THREE.MeshBasicMaterial({ color: accent, wireframe: true, side: THREE.DoubleSide }) : satMat;
      const m = new THREE.Mesh(g, mat);
      const pivot = new THREE.Group(); pivot.rotation.set(Math.random() * Math.PI, (i / satNames.length) * Math.PI * 2, Math.random() * 0.6);
      m.position.x = 0.72 + (i % 3) * 0.15; pivot.add(m); root.add(pivot);
      const lab = document.createElement("span"); lab.textContent = name;
      Object.assign(lab.style, { position: "absolute", left: "0", top: "0", fontFamily: "var(--f-mono)", fontSize: "10.5px", letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(243,244,246,.85)", padding: "5px 9px", borderRadius: "99px", border: "1px solid rgba(255,255,255,.14)", background: "rgba(8,10,13,.45)", backdropFilter: "blur(6px)", whiteSpace: "nowrap", willChange: "transform,opacity", transition: "opacity .4s" });
      labels.appendChild(lab);
      return { m, pivot, lab, speed: 0.12 + (i % 4) * 0.05, spin: 0.4 + Math.random() * 0.6 };
    });

    // dust
    const N = mobile ? 260 : 600, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { const r = 2.4 + Math.random() * 3.5, t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1); pos.set([r * Math.sin(p) * Math.cos(t), r * Math.cos(p) * .6, r * Math.sin(p) * Math.sin(t)], i * 3); }
    const dustG = new THREE.BufferGeometry(); dustG.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const dust = new THREE.Points(dustG, new THREE.PointsMaterial({ size: 0.018, color: 0xcfe9ee, transparent: true, opacity: .55, depthWrite: false }));
    root.add(dust);

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
      const t = clock.getElapsedTime(), dt = Math.min(clock.getDelta(), 0.05);
      mx += (tx - mx) * 0.04; my += (ty - my) * 0.04;
      root.position.set(baseX - mx * 0.25, baseY + my * 0.2 + scrollP * 1.6, 0);
      const s = baseS * (1 - scrollP * 0.18); root.scale.setScalar(s);
      root.rotation.y = t * 0.08 + mx * 0.5 + scrollP * 1.6;
      root.rotation.x = Math.sin(t * 0.3) * 0.08 + my * 0.3;
      core.rotation.set(t * 0.3, t * 0.45, 0);
      heart.scale.setScalar(1 + Math.sin(t * 2) * 0.08);
      glow.material.opacity = 0.45 + Math.sin(t * 2) * 0.1;
      rings[0].rotation.z += 0.0018; rings[1].rotation.y += 0.001; rings[2].rotation.x -= 0.003;
      dust.rotation.y = -t * 0.02;
      sats.forEach(o => {
        o.pivot.rotation.y += o.speed * 0.01 * (1 + scrollP * 2);
        o.m.rotation.x += 0.01 * o.spin; o.m.rotation.y += 0.013 * o.spin;
        o.m.getWorldPosition(v); const depth = v.z; v.project(camera);
        const x = (v.x * .5 + .5) * W, y = (-v.y * .5 + .5) * H;
        o.lab.style.transform = `translate(${(x + 14).toFixed(1)}px, ${(y - 10).toFixed(1)}px)`;
        o.lab.style.opacity = depth > -0.2 ? (1 - scrollP * 1.5).toFixed(2) : "0.18";
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
