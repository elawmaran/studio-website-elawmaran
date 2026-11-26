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
  /* ---------- hero cursor play: follow-spot, focus reticle, camera aims, click = shutter ---------- */
  const reticle = $(".reticle"), rLbl = $(".reticle__lbl"), flash = $(".flash"), shotsEl = $("[data-shots]");
  const camHead = $(".cam__head"), camG = $(".cam"), glint = $(".cam__glint");
  if (!REDUCED && hero && reticle) {
    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    let px = innerWidth / 2, py = innerHeight * .45, rx = px, ry = py, sx = px, sy = py, inHero = false, lastMove = 0, locked = false, ang = 0, shots = 0, hideT;
    const local = e => { const b = hero.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
    const overUI = el => el && el.closest && el.closest(".hero__copy, .nav, a, button");
    hero.addEventListener("pointermove", e => {
      [px, py] = local(e); lastMove = performance.now();
      const ui = overUI(e.target);
      if (e.pointerType === "mouse") hero.classList.toggle("is-live", !ui);
      if (locked) { locked = false; reticle.classList.remove("is-lock"); rLbl.textContent = "AF"; }
    }, { passive: true });
    hero.addEventListener("pointerleave", () => { hero.classList.remove("is-live"); });
    hero.addEventListener("pointerdown", e => {
      if (overUI(e.target)) return;
      [px, py] = local(e); if (e.pointerType !== "mouse") { rx = px; ry = py; sx = px; sy = py; }
      hero.classList.add("is-live");
      shots++; if (shotsEl) shotsEl.textContent = "SHOT " + String(shots).padStart(3, "0");
      flash.classList.remove("is-on"); void flash.offsetWidth; flash.classList.add("is-on");
      hero.classList.remove("is-shot"); void hero.offsetWidth; hero.classList.add("is-shot", "has-shot");
      reticle.classList.add("is-snap"); rLbl.textContent = "● SHOT " + String(shots).padStart(3, "0");
      setTimeout(() => { reticle.classList.remove("is-snap"); rLbl.textContent = locked ? "AF · LOCK" : "AF"; }, 650);
      if (e.pointerType !== "mouse") { clearTimeout(hideT); hideT = setTimeout(() => hero.classList.remove("is-live"), 1400); }
    });
    const aim = () => {
      const now = performance.now();
      rx += (px - rx) * .22; ry += (py - ry) * .22;
      sx += (px - sx) * .08; sy += (py - sy) * .08;
      reticle.style.transform = `translate3d(${rx.toFixed(1)}px, ${ry.toFixed(1)}px, 0)`;
      hero.style.setProperty("--sx", sx.toFixed(0) + "px"); hero.style.setProperty("--sy", sy.toFixed(0) + "px");
      if (!locked && fine && hero.classList.contains("is-live") && now - lastMove > 420) { locked = true; reticle.classList.add("is-lock"); rLbl.textContent = "AF · LOCK"; }
      // camera head tilts toward the cursor (pivot = tripod head)
      if (camHead && camG && scrollY < innerHeight) {
        const m = camG.getScreenCTM(), hb = hero.getBoundingClientRect();
        if (m) {
          const pyScreen = m.b * 800 + m.d * 690 + m.f - hb.top;
          const target = Math.max(-14, Math.min(14, -((py - pyScreen) / innerHeight) * 42));
          ang += (target - ang) * .07;
          camHead.setAttribute("transform", `rotate(${ang.toFixed(2)} 800 690)`);
          glint.setAttribute("cx", (452 + mx * 14).toFixed(1)); glint.setAttribute("cy", (575 + my * 10).toFixed(1));
        }
      }
      requestAnimationFrame(aim);
    };
    requestAnimationFrame(aim);
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

  /* ---------- call sheet enquiry form ---------- */
  (() => {
    const form = $("#inquiry"); if (!form) return;
    const cfg = SITE.form || {}, email = SITE.contact?.email || "";
    const td = $("[data-today]"); if (td) td.textContent = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" }).toUpperCase();
    $("[data-form-types]").innerHTML = (cfg.projectTypes || []).map(t => `<label class="chip"><input type="checkbox" name="projectType" value="${esc(t)}"><span>${esc(t)}</span></label>`).join("");
    $("[data-form-timelines]").insertAdjacentHTML("beforeend", (cfg.timelines || []).map(t => `<option>${esc(t)}</option>`).join(""));
    $("[data-form-budgets]").insertAdjacentHTML("beforeend", (cfg.budgets || []).map(t => `<option>${esc(t)}</option>`).join(""));
    $("[data-form-note]").textContent = `Every project is quoted individually. ${SITE.contact?.responseNote || ""}`;
    const status = $("[data-form-status]"), fieldOf = el => el.closest(".f");
    const setErr = (f, msg) => { f.classList.toggle("is-invalid", !!msg); let e = $(".err", f); if (msg) { if (!e) { e = document.createElement("span"); e.className = "err"; f.appendChild(e); } e.textContent = msg; } else if (e) e.remove(); };
    const validate = () => {
      let ok = true, first = null; const fail = (el, msg) => { setErr(fieldOf(el), msg); if (ok) first = el; ok = false; };
      const { name, email: em, description: desc } = form.elements;
      [name, em, desc].forEach(el => setErr(fieldOf(el), ""));
      setErr($("[data-form-types]").closest(".f"), "");
      if (!name.value.trim()) fail(name, "Please tell us your name.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em.value.trim())) fail(em, "Please enter a valid email.");
      if (!$$("input[name=projectType]:checked", form).length) fail($("input[name=projectType]", form), "Choose at least one.");
      if (desc.value.trim().length < 10) fail(desc, "A sentence or two about the project helps us reply properly.");
      if (first) first.focus(); return ok;
    };
    form.addEventListener("input", e => { const f = fieldOf(e.target); if (f && f.classList.contains("is-invalid")) setErr(f, ""); });
    form.addEventListener("submit", async e => {
      e.preventDefault(); status.className = "sheet__status f--full"; status.textContent = "";
      if (form.elements.website_hp.value) return;
      if (!validate()) { status.classList.add("is-err"); status.textContent = "Please check the highlighted fields."; return; }
      const fd = new FormData(form);
      const data = { name: fd.get("name"), company: fd.get("company"), email: fd.get("email"), country: fd.get("country"), projectType: fd.getAll("projectType").join(", "), description: fd.get("description"), timeline: fd.get("timeline"), budget: fd.get("budget"), reference: fd.get("reference"), source: location.href };
      const btnTxt = $("button[type=submit] span", form);
      if (cfg.endpoint) {
        btnTxt.textContent = "Sending…";
        try { const r = await fetch(cfg.endpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) }); if (!r.ok) throw 0;
          status.classList.add("is-ok"); status.textContent = `That's a wrap, ${String(data.name).split(" ")[0]} — your request is with us. ${SITE.contact?.responseNote || ""}`; form.reset();
        } catch { status.classList.add("is-err"); status.innerHTML = `Something went wrong. Please email us at <a href="mailto:${esc(email)}">${esc(email)}</a>.`; }
        finally { btnTxt.textContent = "Request a proposal"; }
      } else {
        const body = Object.entries({ Name: data.name, Company: data.company, Email: data.email, Country: data.country, "Project type": data.projectType, Timeline: data.timeline, "Budget range": data.budget, "Reference / website": data.reference, "Project description": data.description }).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n");
        location.href = `mailto:${email}?subject=${encodeURIComponent(`Project inquiry — ${data.company || data.name}`)}&body=${encodeURIComponent(body)}`;
        status.classList.add("is-ok"); status.textContent = `Your email app should open with your request ready to send. If it didn't, email us at ${email}.`;
      }
    });
  })();
})();
