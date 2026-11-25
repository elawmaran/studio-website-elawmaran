/* =====================================================================
   ELAW STUDIOS — SITE CONFIGURATION
   ---------------------------------------------------------------------
   One place for brand, contact, social links, form + SEO settings.
   Edit the values below — no HTML changes needed.
   Items marked  TODO  are placeholders you must replace before launch.
   ===================================================================== */
window.ELAW = window.ELAW || {};

window.ELAW.site = {
  brand: "ELAW STUDIOS",
  descriptor: "AI Creative & Digital Marketing Studio",
  tagline: "Turning ideas into content, campaigns and digital experiences.",

  /* Live site — hosted on Hostinger (subdomain of elawmaran.tech) */
  url: "https://studio.elawmaran.tech/",

  contact: {
    /* TODO: replace with your real studio email */
    email: "hello@elawstudios.com",
    location: "India · Working worldwide",
    responseNote: "We usually reply within 1–2 business days."
  },

  /* Leave a url empty ("") to hide that link everywhere on the site. */
  social: [
    { id: "linkedin",  label: "LinkedIn",  url: "" /* TODO e.g. https://www.linkedin.com/company/elawstudios */ },
    { id: "instagram", label: "Instagram", url: "" /* TODO e.g. https://www.instagram.com/elawstudios */ },
    { id: "vimeo",     label: "Vimeo",     url: "" /* TODO e.g. https://vimeo.com/elawstudios */ }
  ],

  /* Project inquiry form.
     - Leave `endpoint` empty  → the form opens the visitor's email app with all answers pre-filled.
     - Set `endpoint` to a form service URL (Formspree, Getform, Basin, your own API…)
       → answers are POSTed as JSON and a success message is shown on the page. */
  form: {
    endpoint: "",
    projectTypes: [
      "Social Media", "Reels", "AI Content", "Video Production", "3D",
      "Digital Marketing", "Website", "AI Campaign", "Other"
    ],
    timelines: ["ASAP (under 2 weeks)", "2–4 weeks", "1–3 months", "3+ months", "Flexible / not sure"],
    budgets: ["Under ₹1L / $1.5k", "₹1L–3L / $1.5k–4k", "₹3L–8L / $4k–10k", "₹8L+ / $10k+", "Not sure yet — need guidance"]
  }
};
