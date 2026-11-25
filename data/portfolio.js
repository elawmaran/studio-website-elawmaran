/* =====================================================================
   ELAW STUDIOS — PORTFOLIO DATA  (the only file you edit to add work)
   ---------------------------------------------------------------------
   Sections fed from this file:
     projects  → Selected Work (featured) + Portfolio grid + case-study view
     reels     → "Stop the scroll." phone showcase
     aiLab     → The AI Creative Lab gallery
     models    → The ELAW 3D Showroom

   PROJECT TYPE LABELS (shown on every card — keep work honestly labelled):
     "lab"         → ELAW LAB — Concept Campaign        (experimental / self-initiated)
     "exploration" → ELAW STUDIOS — Creative Exploration (personal / portfolio work)
     "client"      → Client Project                     (only for real, approved client work)

   MEDIA RULES
     thumbnail : path to a WebP/AVIF/JPG poster, e.g. "assets/portfolio/my-film.webp"
     vimeoUrl  : any Vimeo link — "https://vimeo.com/123456789",
                 "https://vimeo.com/123456789/abcdef1234" (unlisted) or the player URL.
     heroVideo : optional short muted loop (MP4/WebM) used on the card on hover.
     Leave anything empty ("") and a polished generative placeholder is drawn
     from `art` instead:  art: { hue: 0–360, style: "orb|grid|wave|prism|beam|rings|grain" }

   NEVER add results, metrics, clients or testimonials that aren't real.
   Use `goal` to describe intent for concept work.
   ===================================================================== */
window.ELAW = window.ELAW || {};

window.ELAW.categories = ["All", "Social", "Reels", "AI", "Video", "3D", "Digital"];

window.ELAW.projectTypes = {
  lab:         "ELAW LAB — Concept Campaign",
  exploration: "ELAW STUDIOS — Creative Exploration",
  client:      "Client Project"
};

window.ELAW.projects = [
  {
    id: "liquid-gold",
    featured: true,                       // shows in SELECTED WORK (first featured = large hero slot)
    title: "Liquid Gold",
    subtitle: "Cinematic product film concept",
    category: ["Video", "3D", "AI"],
    type: "lab",
    year: "2026",
    description: "A slow, sculptural product film exploring how premium packaging can be revealed through light, liquid metal and macro camera moves — built in a hybrid 3D + AI pipeline.",
    thumbnail: "",                        // e.g. "assets/portfolio/liquid-gold.webp"
    heroVideo: "",                        // e.g. "assets/videos/liquid-gold-loop.mp4"
    vimeoUrl: "",                         // ← paste your Vimeo link here
    gallery: [],                          // ["assets/portfolio/liquid-gold-01.webp", …]
    tools: ["Blender", "Substance Painter", "AI video", "After Effects", "DaVinci Resolve"],
    process: ["Moodboard & AI look development", "3D blockout & lighting", "Macro camera choreography", "Grade & sound design"],
    goal: "Show how a single product can carry a 15–30 second cinematic launch film across web and social.",
    art: { hue: 38, style: "orb" }
  },
  {
    id: "neon-monsoon",
    featured: true,
    title: "Neon Monsoon",
    subtitle: "AI fashion campaign concept",
    category: ["AI", "Social"],
    type: "lab",
    year: "2026",
    description: "An AI-generated fashion editorial set in a rain-soaked future city — exploring consistent characters, wardrobe and lighting across a full campaign set.",
    thumbnail: "",
    heroVideo: "",
    vimeoUrl: "",
    gallery: [],
    tools: ["ComfyUI", "Midjourney", "Photoshop", "AI video"],
    process: ["Character & wardrobe bible", "Prompt + control pipelines", "Retouch & typography", "Cut-downs for 9:16 / 1:1 / 16:9"],
    goal: "Prove that an AI pipeline can hold one visual identity across stills, reels and banners.",
    art: { hue: 320, style: "wave" }
  },
  {
    id: "creative-core",
    featured: true,
    title: "The Creative Core",
    subtitle: "Real-time 3D brand identity",
    category: ["3D", "Digital"],
    type: "exploration",
    year: "2026",
    description: "ELAW's own identity object — a glass-and-metal orb that holds every discipline the studio works in. Designed as a real-time asset for web, AR and motion.",
    thumbnail: "",
    heroVideo: "",
    vimeoUrl: "",
    gallery: [],
    tools: ["Blender", "Three.js", "WebGL", "model-viewer"],
    process: ["Form exploration", "Material & light studies", "Real-time optimisation (GLB)", "Web integration"],
    goal: "One 3D asset that works as logo, hero visual and AR object.",
    art: { hue: 190, style: "rings" }
  },
  {
    id: "stop-scroll-system",
    featured: true,
    title: "Stop-Scroll Reel System",
    subtitle: "Short-form video framework",
    category: ["Reels", "Social", "Video"],
    type: "lab",
    year: "2026",
    description: "A repeatable framework for vertical video: hook in the first second, kinetic type, product hero beats and platform-native endings.",
    thumbnail: "",
    heroVideo: "",
    vimeoUrl: "",
    gallery: [],
    tools: ["Premiere Pro", "After Effects", "CapCut", "AI voice & music"],
    process: ["Hook library", "Template motion kit", "Batch production", "Platform cut-downs"],
    goal: "Produce consistent, on-brand reels at volume without losing craft.",
    art: { hue: 12, style: "beam" }
  },
  {
    id: "elaw-ai",
    featured: true,
    title: "ELAW AI",
    subtitle: "Self-hosted open-source LLM assistant",
    category: ["Digital", "AI"],
    type: "exploration",
    year: "2026",
    description: "A private, self-hosted AI assistant built on open-source language models — designed, built and deployed end-to-end by ELAW.",
    thumbnail: "",
    heroVideo: "",
    vimeoUrl: "",
    link: "https://llm.elawmaran.tech",
    gallery: [],
    tools: ["Ollama", "Open-source LLMs", "Web UI", "Self-hosting"],
    process: ["Model selection", "Interface design", "Deployment & hosting"],
    goal: "Demonstrate full-stack AI product capability — from model to interface.",
    art: { hue: 160, style: "grid" }
  },
  {
    id: "ai-travel-crm",
    featured: false,
    title: "AI Travel CRM",
    subtitle: "AI-native CRM product demo",
    category: ["Digital", "AI"],
    type: "exploration",
    year: "2026",
    description: "An AI-native CRM concept for travel agencies, built as a working live demo to explore how AI can sit inside everyday business tools.",
    thumbnail: "",
    heroVideo: "",
    vimeoUrl: "",
    link: "https://ai.elawmaran.tech",
    gallery: [],
    tools: ["AI assistants", "Web app", "Product design"],
    process: ["Workflow mapping", "AI feature design", "Prototype build", "Live demo"],
    goal: "Show how AI can make a digital product feel effortless for non-technical teams.",
    art: { hue: 210, style: "prism" }
  },
  {
    id: "launch-kit",
    featured: false,
    title: "Launch Week Content Kit",
    subtitle: "Social content system concept",
    category: ["Social"],
    type: "lab",
    year: "2026",
    description: "A 7-day launch content system: teaser, reveal, carousel, reel and story assets designed as one coherent campaign.",
    thumbnail: "",
    heroVideo: "",
    vimeoUrl: "",
    gallery: [],
    tools: ["Figma", "Photoshop", "After Effects", "AI imagery"],
    process: ["Campaign narrative", "Design system", "Asset production", "Posting plan"],
    goal: "Give a brand a ready-to-post launch week in one production sprint.",
    art: { hue: 52, style: "grain" }
  },
  {
    id: "arcade-futures",
    featured: false,
    title: "Arcade Futures",
    subtitle: "Game-art motion study",
    category: ["3D", "Video"],
    type: "exploration",
    year: "2026",
    description: "A motion study drawing on years of game-art production — reels, symbols and light treated as kinetic sculpture.",
    thumbnail: "",
    heroVideo: "",
    vimeoUrl: "",
    gallery: [],
    tools: ["Maya", "Blender", "Unity", "After Effects"],
    process: ["Asset modelling", "Look development", "Animation", "Compositing"],
    goal: "Translate game-industry polish into brand motion.",
    art: { hue: 270, style: "orb" }
  }
];

/* ---------------------------------------------------------------------
   REELS  — vertical 9:16 showcase.  category: Reels | Social Ads | Product Videos | AI Video
   video  : short MP4/WebM (muted autoplay when on screen). Keep under ~4 MB, 720×1280.
   poster : WebP still shown before the video loads.
   vimeoUrl (optional): opens the full reel in the viewer when tapped.
   --------------------------------------------------------------------- */
window.ELAW.reels = [
  { title: "Product Drop", category: "Product Videos", type: "lab",         video: "", poster: "", vimeoUrl: "", art: { hue: 28,  style: "beam"  } },
  { title: "Hook in 1s",   category: "Reels",          type: "lab",         video: "", poster: "", vimeoUrl: "", art: { hue: 340, style: "wave"  } },
  { title: "Dream Sequence", category: "AI Video",     type: "lab",         video: "", poster: "", vimeoUrl: "", art: { hue: 200, style: "orb"   } },
  { title: "Swipe Story",  category: "Social Ads",     type: "lab",         video: "", poster: "", vimeoUrl: "", art: { hue: 150, style: "grid"  } },
  { title: "Studio Loop",  category: "Reels",          type: "exploration", video: "", poster: "", vimeoUrl: "", art: { hue: 260, style: "rings" } }
];

/* ---------------------------------------------------------------------
   AI CREATIVE LAB — category: Characters | Products | Fashion | Advertising | Environments | Cinematic | Experimental
   image : "assets/ai-lab/<file>.webp"  (≈1200px on the long edge)
   ratio : "portrait" | "landscape" | "square"  (controls the masonry tile)
   --------------------------------------------------------------------- */
window.ELAW.aiLabCategories = ["All", "Characters", "Products", "Fashion", "Advertising", "Environments", "Cinematic", "Experimental"];

window.ELAW.aiLab = [
  { title: "The Cartographer",   category: "Characters",   tools: ["ComfyUI", "Photoshop"],     type: "lab", ratio: "portrait",  image: "", art: { hue: 24,  style: "orb"   } },
  { title: "Glass Fragrance",    category: "Products",     tools: ["Midjourney", "Blender"],    type: "lab", ratio: "square",    image: "", art: { hue: 190, style: "prism" } },
  { title: "Monsoon Couture",    category: "Fashion",      tools: ["ComfyUI", "Flux"],          type: "lab", ratio: "portrait",  image: "", art: { hue: 320, style: "wave"  } },
  { title: "Billboard 2049",     category: "Advertising",  tools: ["Midjourney", "Photoshop"],  type: "lab", ratio: "landscape", image: "", art: { hue: 48,  style: "beam"  } },
  { title: "Salt Desert Temple", category: "Environments", tools: ["ComfyUI"],                  type: "lab", ratio: "landscape", image: "", art: { hue: 16,  style: "grain" } },
  { title: "Last Train Home",    category: "Cinematic",    tools: ["AI video", "DaVinci"],      type: "lab", ratio: "landscape", image: "", art: { hue: 220, style: "beam"  } },
  { title: "Chrome Botanica",    category: "Experimental", tools: ["ComfyUI", "TouchDesigner"], type: "lab", ratio: "square",    image: "", art: { hue: 140, style: "rings" } },
  { title: "Courier No. 7",      category: "Characters",   tools: ["Midjourney"],               type: "lab", ratio: "portrait",  image: "", art: { hue: 280, style: "orb"   } },
  { title: "Sneaker Levitation", category: "Products",     tools: ["Blender", "AI upscale"],    type: "lab", ratio: "square",    image: "", art: { hue: 4,   style: "grid"  } },
  { title: "Neon Bazaar",        category: "Environments", tools: ["ComfyUI", "Flux"],          type: "lab", ratio: "portrait",  image: "", art: { hue: 300, style: "grain" } }
];

/* ---------------------------------------------------------------------
   3D SHOWROOM — GLB/GLTF assets shown with <model-viewer>.
   src    : "assets/3d/<file>.glb"   (aim for < 5 MB; use Draco/Meshopt compression)
   poster : optional WebP shown while loading
   The three starter models are lightweight procedural placeholders —
   replace them with your own GLBs.
   --------------------------------------------------------------------- */
window.ELAW.models = [
  { name: "Creative Core",  src: "assets/3d/elaw-core.glb",  poster: "", type: "exploration", text: "The ELAW identity object — faceted metal core inside an orbit ring." },
  { name: "Signal Knot",    src: "assets/3d/signal-knot.glb", poster: "", type: "lab",         text: "A torus-knot study in brushed metal — motion graphics source asset." },
  { name: "Monolith Prism", src: "assets/3d/prism.glb",       poster: "", type: "lab",         text: "A product-plinth prism for 3D showroom and AR placement tests." }
];
