// ELAW STUDIOS — content check.  Run:  npm run check   (or: node scripts/check.mjs)
// Loads the /data files the same way the browser does and reports problems:
// missing fields, broken asset paths, invalid Vimeo links, unknown project types.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ctx = { window: {} }; vm.createContext(ctx);
for (const f of ["site.config.js", "content.js", "portfolio.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, "data", f), "utf8"), ctx, { filename: f });
}
const E = ctx.window.ELAW;
let errors = 0, warnings = 0;
const err = m => { errors++; console.log("  ✗ " + m); };
const warn = m => { warnings++; console.log("  ! " + m); };
const asset = (p, where) => { if (p && !/^https?:\/\//.test(p) && !fs.existsSync(path.join(root, p))) err(`${where}: file not found → ${p}`); };
const vimeoOK = u => /(vimeo\.com\/(?:video\/)?\d+|player\.vimeo\.com\/video\/\d+)/.test(u);

console.log("\nELAW content check\n");
console.log("Site config");
if (!E.site?.contact?.email) err("contact.email is empty");
else if (/elawstudios\.com$/.test(E.site.contact.email)) warn(`contact.email is still the placeholder (${E.site.contact.email})`);
(E.site.social || []).forEach(s => { if (!s.url) warn(`social link "${s.label}" is empty (hidden on site)`); });
if (!E.site.form?.endpoint) warn("form.endpoint is empty → form uses the visitor's email app (mailto)");

console.log("Projects");
const ids = new Set(); const cats = new Set(E.categories.map(c => c.toLowerCase()));
E.projects.forEach((p, i) => {
  const w = `projects[${i}] ${p.id || "(no id)"}`;
  if (!p.id) err(`${w}: missing id`); else if (ids.has(p.id)) err(`${w}: duplicate id`); ids.add(p.id);
  if (!p.title) err(`${w}: missing title`);
  if (!E.projectTypes[p.type]) err(`${w}: type "${p.type}" must be one of ${Object.keys(E.projectTypes).join(", ")}`);
  (Array.isArray(p.category) ? p.category : [p.category]).forEach(c => { if (!cats.has(String(c).toLowerCase())) err(`${w}: category "${c}" is not in ELAW.categories`); });
  if (p.vimeoUrl && !vimeoOK(p.vimeoUrl)) err(`${w}: vimeoUrl doesn't look like a Vimeo link`);
  if (p.type === "client" && !p.result && !p.goal) warn(`${w}: client project without result/goal text`);
  asset(p.thumbnail, w); asset(p.heroVideo, w); (p.gallery || []).forEach(g => asset(g, w));
  if (!p.thumbnail && !p.vimeoUrl) warn(`${w}: no thumbnail or Vimeo yet (placeholder art shown)`);
});
if (E.projects.filter(p => p.featured).length < 3) warn("fewer than 3 featured projects");

console.log("Reels");
E.reels.forEach((r, i) => { asset(r.video, `reels[${i}]`); asset(r.poster, `reels[${i}]`); if (r.vimeoUrl && !vimeoOK(r.vimeoUrl)) err(`reels[${i}]: bad vimeoUrl`); if (!r.video && !r.vimeoUrl) warn(`reels[${i}] "${r.title}": no video yet`); });

console.log("AI Lab");
E.aiLab.forEach((a, i) => { asset(a.image, `aiLab[${i}]`); if (!E.aiLabCategories.includes(a.category)) err(`aiLab[${i}]: category "${a.category}" not in aiLabCategories`); if (!a.image) warn(`aiLab[${i}] "${a.title}": no image yet`); });

console.log("3D models");
E.models.forEach((m, i) => { if (!m.src) err(`models[${i}]: missing src`); asset(m.src, `models[${i}]`); asset(m.poster, `models[${i}]`); });

console.log(`\n${errors} error(s), ${warnings} warning(s)\n`);
process.exit(errors ? 1 : 0);
