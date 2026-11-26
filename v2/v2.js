/* =====================================================================
   ELAW STUDIOS v2 — parallax film-set site. Content comes from /data/*.js
   ===================================================================== */
(() => {
  "use strict";
  const E = window.ELAW || {}, SITE = E.site || {}, C = E.content || {};
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s = "") => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const TYPES = E.projectTypes || {};
  const scrollFns = []; let ticking = false;
  const onScroll = f => scrollFns.push(f);
  addEventListener("scroll", () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { scrollFns.forEach(f => f()); ticking = false; }); }, { passive: true });
  addEventListener("resize", () => scrollFns.forEach(f => f()));

  /* ---------- hero parallax + mouse depth ---------- */
  const hero = $(".hero"), layers = $$(".hero .layer"), camLayer = $(".hero .camera"), title = $(".hero__title"), hud = $(".hud"), copy = $(".hero__copy");
  let mx = 0, my = 0, tmx = 0, tmy = 0;
  if (!REDUCED) {
    addEventListener("pointermove", e => { tmx = e.clientX / innerWidth - .5; tmy = e.clientY / innerHeight - .5; }, { passive: true });
    const tick = () => {
      mx += (tmx - mx) * .06; my += (tmy - my) * .06;
      const y = Math.min(scrollY, innerHeight * 1.2), p = y / innerHeight;
      layers.forEach(l => {
        const d = +l.dataset.depth || 0;
        let t = `translate3d(${(-mx * 40 * d).toFixed(1)}px, ${(y * (1 - d) * .9 - my * 18 * d).toFixed(1)}px, 0)`;
        if (l === camLayer) t += ` scale(${(1 + p * .55).toFixed(3)})`;
        if (l === title) t += ` scale(${(1 + p * .18).toFixed(3)})`;
        l.style.transform = t;
      });
      title.style.opacity = Math.max(0, 1 - p * 1.3);
      hud.style.opacity = Math.max(0, 1 - p * 2.2);
      copy.style.opacity = Math.max(0, 1 - p * 2.4);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  // live timecode in the viewfinder
  const tc = $("[data-timecode]"), t0 = performance.now();
  const pad = n => String(n).padStart(2, "0");
  setInterval(() => { const ms = performance.now() - t0, f = Math.floor(ms / 41.66) % 24, s = Math.floor(ms / 1000); tc.textContent = `00:${pad(Math.floor(s / 60))}:${pad(s % 60)}:${pad(f)}`; }, 42);

  /* ---------- clapperboard services ---------- */
  const claps = $("[data-clappers]");
  claps.innerHTML = (C.services || []).map((s, i) => `
    <article class="clap rv" style="transition-delay:${i * .08}s">
      <div class="clap__stick" aria-hidden="true"></div>
      <div class="clap__board">
        <div class="clap__meta"><span>Scene<b>${esc(s.no)}</b></span><span>Take<b>1</b></span><span>Roll<b>${"ABCDE"[i] || "A"}</b></span></div>
        <h3 class="clap__title">${esc(s.title)}</h3>
        <p class="clap__hook">${esc(s.hook)}</p>
        <ul class="clap__items">${s.items.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
      </div>
    </article>`).join("");

  /* ---------- film strip of real work ---------- */
  const projects = (E.projects || []);
  const withVideo = projects.filter(p => p.vimeoUrl);
  const reel = [...withVideo, ...projects.filter(p => !p.vimeoUrl && p.featured).slice(0, 2)];
  const strip = $("[data-strip]");
  const art = p => `<div class="art" style="background:radial-gradient(70% 60% at 50% 40%, hsl(${p.art?.hue ?? 30} 85% 55% / .7), #120e13 75%)"></div>`;
  strip.innerHTML = reel.map((p, i) => `
    <figure class="frame${p.vimeoUrl ? "" : " frame--soon"}" ${p.vimeoUrl ? `data-vimeo="${esc(p.vimeoUrl)}" tabindex="0" role="button" aria-label="Play ${esc(p.title)}"` : ""}>
      ${p.thumbnail ? `<img src="${esc(p.thumbnail)}" alt="${esc(p.title)} — ${esc(p.subtitle || "")}" loading="lazy">` : art(p)}
      <span class="frame__num">SC ${pad(i + 1)} · ${esc((TYPES[p.type] || "").split("—")[0].trim() || "ELAW")}</span>
      <figcaption class="frame__cap"><div><small>${esc(p.subtitle || "")}</small><h3>${esc(p.title)}</h3></div><span class="frame__play" aria-hidden="true"></span></figcaption>
    </figure>`).join("");
  const filmstrip = $("[data-filmstrip]");
  const desktop = () => innerWidth > 640 && !REDUCED;
  const sizeStrip = () => { if (desktop()) filmstrip.style.height = `${Math.max(180, (strip.scrollWidth / innerWidth) * 100 + 60)}vh`; else filmstrip.style.height = ""; };
  sizeStrip(); addEventListener("resize", sizeStrip);
  onScroll(() => {
    if (!desktop()) { strip.style.transform = ""; return; }
    const r = filmstrip.getBoundingClientRect(), total = r.height - innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / total));
    const maxX = strip.scrollWidth - innerWidth + 80;
    strip.style.transform = `translate3d(${(40 - p * maxX).toFixed(1)}px,0,0)`;
  });

  /* ---------- lightbox (Vimeo) ---------- */
  const lb = $("#lightbox"), lbBody = $("[data-lightbox-body]");
  const vimeoId = u => (String(u).match(/vimeo\.com\/(?:video\/)?(\d+)/) || [])[1];
  const openVideo = url => { const id = vimeoId(url); if (!id) return; lbBody.innerHTML = `<iframe src="https://player.vimeo.com/video/${id}?autoplay=1&title=0&byline=0&portrait=0&dnt=1&color=ffb000" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="Video"></iframe>`; lb.showModal(); };
  strip.addEventListener("click", e => { const f = e.target.closest("[data-vimeo]"); if (f) openVideo(f.dataset.vimeo); });
  strip.addEventListener("keydown", e => { const f = e.target.closest("[data-vimeo]"); if (f && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openVideo(f.dataset.vimeo); } });
  lb.addEventListener("close", () => { lbBody.innerHTML = ""; });
  lb.addEventListener("click", e => { if (e.target === lb || e.target.closest(".lightbox__close")) lb.close(); });

  /* ---------- AI ad console ---------- */
  const prompts = [
    "cinematic perfume bottle, smoke, gold rim light, 9:16 reel",
    "fresh mango splash, macro, sunlit studio, product hero",
    "coffee beans falling in slow motion, warm tones, 16:9 ad",
    "festive sweet shop ad, appetising close-ups, 8 second spot"
  ];
  const frames = withVideo.map(p => p.thumbnail).filter(Boolean);
  const out = $("[data-ai-frame]"), typed = $("[data-typed]"), tag = $(".console__tag");
  frames.forEach((src, i) => out.insertAdjacentHTML("afterbegin", `<img src="${esc(src)}" alt="" data-i="${i}">`));
  let pi = 0;
  const runConsole = async () => {
    for (;;) {
      const text = prompts[pi % prompts.length]; typed.textContent = ""; tag.textContent = "PROMPT";
      $$("img", out).forEach(im => im.classList.remove("on"));
      for (const ch of text) { typed.textContent += ch; await new Promise(r => setTimeout(r, REDUCED ? 0 : 34)); }
      tag.textContent = "GENERATING…"; out.classList.remove("is-gen"); void out.offsetWidth; out.classList.add("is-gen");
      await new Promise(r => setTimeout(r, 1100));
      const img = $(`img[data-i="${pi % Math.max(1, frames.length)}"]`, out); if (img) img.classList.add("on");
      tag.textContent = "ELAW LAB · CONCEPT";
      await new Promise(r => setTimeout(r, 2600)); pi++;
    }
  };
  let consoleStarted = false;
  new IntersectionObserver(es => { if (es[0].isIntersecting && !consoleStarted) { consoleStarted = true; runConsole(); } }, { threshold: .3 }).observe(out);

  /* ---------- reels phones (staggered parallax) ---------- */
  const phones = $("[data-phones]");
  const reelCols = ["#ff6a2a", "#ff2e88", "#29e3ff", "#ffb000", "#6b5bff"];
  phones.innerHTML = (E.reels || []).slice(0, 5).map((r, i) => `
    <div class="phone" data-speed="${[.08, -.06, .1, -.05, .07][i]}"><div class="phone__frame"><div class="phone__screen" style="--c:${reelCols[i]}">
      <div><b>${esc(r.title)}</b><small>${r.vimeoUrl || r.video ? "PLAY" : "COMING SOON"}</small></div></div></div></div>`).join("");
  if (!REDUCED) onScroll(() => {
    const r = phones.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    const c = r.top + r.height / 2 - innerHeight / 2;
    $$(".phone", phones).forEach(ph => ph.style.transform = `translateY(${(c * +ph.dataset.speed).toFixed(1)}px)`);
  });

  /* ---------- edit timeline ---------- */
  const tl = $("[data-timeline]"), tlBox = $(".timeline"), playTc = $("[data-playtc]"), steps = $("[data-steps]");
  steps.innerHTML = (C.process || []).map(s => `<li><b>${esc(s.title)}</b><span>${esc(s.text)}</span></li>`).join("");
  new IntersectionObserver(es => es.forEach(e => e.isIntersecting && tlBox.classList.add("is-in")), { threshold: .3 }).observe(tlBox);
  onScroll(() => {
    const r = tl.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    const p = REDUCED ? 1 : Math.min(1, Math.max(0, (innerHeight * .8 - r.top) / (r.height * .9)));
    tlBox.style.setProperty("--p", p.toFixed(3));
    const secs = Math.round(p * 90); playTc.textContent = `${pad(Math.floor(secs / 60))}:${pad(secs % 60)}`;
    const lis = $$("li", steps); lis.forEach((li, i) => li.classList.toggle("on", p >= i / lis.length));
  });

  /* ---------- reveal + contact ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in");
    if (e.target.classList.contains("clap")) setTimeout(() => e.target.classList.add("is-clapped"), REDUCED ? 0 : 380);
    io.unobserve(e.target);
  }), { threshold: .2 });
  $$(".rv").forEach(el => io.observe(el));
  const email = SITE.contact?.email;
  $$("[data-email]").forEach(a => { a.href = `mailto:${email}`; });
  $$("[data-year]").forEach(s => s.textContent = new Date().getFullYear());
  $("[data-social]").innerHTML = [email ? `<a href="mailto:${esc(email)}">${esc(email)}</a>` : "", ...(SITE.social || []).filter(s => s.url).map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`)].join("");
  scrollFns.forEach(f => f());
})();
