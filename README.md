# ELAW STUDIOS — website (Revision 1)

AI Creative & Digital Marketing Studio. The site is plain HTML, CSS and JavaScript with **no build step**. Three.js (hero orb) and model-viewer (3D showroom) load from a CDN only when they're needed.

```
index.html              ← page structure (you rarely need to touch this)
css/styles.css          ← design system + all layout
js/main.js              ← renders every section from /data and runs the motion
data/
  site.config.js        ← email, social links, form endpoint, form options
  content.js            ← services, Idea→Impact story, process, Why ELAW, about pillars
  portfolio.js          ← projects, Vimeo links, reels, AI Lab gallery, 3D models
assets/
  brand/      logo, favicon, social preview image (og-image.png)
  hero/       optional hero stills / loops
  3d/         GLB / GLTF models for the showroom
  portfolio/  project posters + gallery images
  ai-lab/     AI-generated concept images
  reels/      9:16 reel posters
  videos/     MP4 / WebM loops (cards + reels)
  icons/      UI icons if you add any
scripts/check.mjs       ← content checker (missing files, bad Vimeo links, wrong labels)
```

## Run it locally
```bash
cd "ElawStudios "
python3 -m http.server 5173      # then open http://localhost:5173
# or:  npm run dev
npm run check                     # checks data files + asset paths
```
Opening `index.html` by double-clicking also works. A local server is better because some browsers block modules on `file://`.

## How to add a Vimeo project
Open `data/portfolio.js` and copy one object in `window.ELAW.projects`:
```js
{
  id: "brand-film-x",                 // unique, lowercase, no spaces
  featured: true,                      // true = shown in SELECTED WORK (the first featured item gets the large slot)
  title: "Brand Film X",
  subtitle: "Product launch film",
  category: ["Video", "Reels"],        // any of: Social, Reels, AI, Video, 3D, Digital
  type: "exploration",                 // "lab" | "exploration" | "client" (use "client" only for real client work)
  year: "2026",
  description: "One or two sentences.",
  vimeoUrl: "https://vimeo.com/123456789",   // unlisted links like vimeo.com/123/abc123 also work
  thumbnail: "",                       // optional: if empty, Vimeo's own thumbnail is fetched automatically
  heroVideo: "",                       // optional short muted loop played on card hover
  gallery: [],
  tools: ["Blender", "After Effects"],
  process: ["Concept", "Production", "Edit"],
  goal: "What the piece set out to do.",     // use `result:` only for real, verifiable results
  art: { hue: 200, style: "beam" }     // placeholder look used until media exists
}
```
That's the only change needed. The card, filters, Selected Work slot and case-study viewer (with the Vimeo embed) all update from it. Vertical reels use the same `vimeoUrl` field in `window.ELAW.reels`.

## How to add portfolio images
1. Export a **WebP** (or AVIF) poster about 1600px wide, under ~300 KB, and save it to `assets/portfolio/`.
2. Set `thumbnail: "assets/portfolio/your-file.webp"`.
3. Gallery images go in `gallery: ["assets/portfolio/x-01.webp", …]`.
4. AI Lab images go in `assets/ai-lab/` and the `aiLab` list. Set `ratio` to `"portrait" | "landscape" | "square"`.
5. Reels: put a 720×1280 MP4 (H.264, muted, under ~4 MB) in `assets/videos/` and a WebP poster in `assets/reels/`, then set `video` and `poster`.

Quick conversions:
```bash
cwebp -q 82 input.png -o assets/portfolio/name.webp
ffmpeg -i in.mov -vf "scale=720:-2" -c:v libx264 -crf 26 -preset veryfast -an -movflags +faststart assets/videos/name.mp4
```

## How to add 3D assets
1. Export **GLB** from Blender (File → Export → glTF 2.0, format *glTF Binary*, enable *Compression*). Aim for under 5 MB.
2. Save it to `assets/3d/`.
3. Add it to `window.ELAW.models` in `data/portfolio.js`:
```js
{ name: "Product X", src: "assets/3d/product-x.glb", poster: "", type: "lab", text: "Short description." }
```
The three starter models (`elaw-core.glb`, `signal-knot.glb`, `prism.glb`) are small procedural placeholders. Replace them with your own.

## How to change contact / social links
Edit `data/site.config.js`:
- `contact.email`: used in the footer, the mailto fallback and form messages
- `social`: LinkedIn / Instagram / Vimeo URLs. An empty URL hides that link.
- `form.endpoint`: paste a Formspree / Getform / Basin URL (or your own API) to receive inquiries directly. If it's left empty, the form opens the visitor's email app with every answer filled in.

The live domain `https://studio.elawmaran.tech/` is set in `index.html` (canonical, og:url, og:image, twitter:image, JSON-LD), `robots.txt`, `sitemap.xml` and `data/site.config.js`. If the domain changes, update all of these.

## Deploy — GitHub Pages + Hostinger domain · https://studio.elawmaran.tech
This uses the same setup as **qa.elawmaran.tech**: a public GitHub repo served by GitHub Pages, with the domain's DNS managed at Hostinger.

- Repo: `elawmaran/studio-website-elawmaran` (public)
- `CNAME` contains `studio.elawmaran.tech`, and `.nojekyll` makes GitHub serve the files as they are (no build)

**One-time setup**
1. **GitHub → repo → Settings → Pages:** Source *Deploy from a branch*, Branch `main`, folder `/ (root)`. The custom domain `studio.elawmaran.tech` is read from `CNAME`.
2. **Hostinger hPanel → Domains → elawmaran.tech → DNS / Nameservers:** add a record:
   | Type  | Name     | Points to              | TTL  |
   |-------|----------|------------------------|------|
   | CNAME | `studio` | `elawmaran.github.io`  | 3600 |
   (The same pattern as the existing `qa` record.)
3. When the DNS check turns green in GitHub → Settings → Pages, tick **Enforce HTTPS**.

**Updating the site:** edit the files (usually `data/portfolio.js` plus new files in `assets/`), then
```bash
git add -A && git commit -m "Add new work" && git push
```
GitHub Pages republishes in about a minute.

**Alternative: host directly on Hostinger** (no GitHub): create the `studio` subdomain in hPanel, enable SSL, and upload `elaw-studios-site.zip` into its folder. The included `.htaccess` handles HTTPS, caching and 3D file types there (GitHub Pages ignores it). Rebuild the zip with:
```bash
zip -r elaw-studios-site.zip index.html .htaccess robots.txt sitemap.xml site.webmanifest CNAME css js data assets -x "*.DS_Store" "*/.gitkeep"
```

## Labelling rule
Every project, reel and AI Lab item shows its type: **ELAW LAB — Concept Campaign**, **ELAW STUDIOS — Creative Exploration** or **Client Project**. Don't add clients, metrics or testimonials that aren't real.
