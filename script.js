// ── Footer year ──────────────────────────────────────
document.getElementById("year").textContent = new Date().getFullYear();

// ── Mobile nav toggle ─────────────────────────────────
const toggle = document.getElementById("navToggle");
const links  = document.getElementById("navLinks");

toggle.addEventListener("click", () => {
  const open = links.classList.toggle("is-open");
  toggle.setAttribute("aria-expanded", open);
});

links.querySelectorAll("a").forEach(a => {
  a.addEventListener("click", () => {
    links.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  });
});

// ── Active nav link on scroll ─────────────────────────
const sections = document.querySelectorAll("section[id]");
const navItems  = document.querySelectorAll(".nav-links a");

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute("id");
      navItems.forEach(a => {
        a.classList.toggle("active", a.getAttribute("href") === `#${id}`);
      });
    }
  });
}, { threshold: 0.3 });

sections.forEach(s => observer.observe(s));

// ── Dynamic Publications ──────────────────────────────
// SVG icons (inline so no external dependency)
const ICON_PAPER  = `<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`;
const ICON_CODE   = `<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`;
const ICON_BIBTEX = `<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7V5a2 2 0 012-2h14a2 2 0 012 2v2"/><rect x="1" y="7" width="22" height="13" rx="2"/><path d="M8 12h.01M12 12h.01M16 12h.01"/></svg>`;
const ICON_EXT    = `<svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;

const TYPE_META = {
  journal:    { label: "Journal",    cls: "pub-badge--journal" },
  conference: { label: "Conference", cls: "pub-badge--conf"    },
  workshop:   { label: "Workshop",   cls: "pub-badge--workshop"},
};

const GROUPS = [
  { key: "journal",    heading: "Journal Articles"   },
  { key: "conference", heading: "Conference Papers"  },
  { key: "workshop",   heading: "Workshops"          },
];

function buildPubCard(pub) {
  const meta = TYPE_META[pub.type] || TYPE_META.conference;

  // Badge
  const badge = document.createElement("div");
  badge.className = `pub-badge ${meta.cls}`;
  badge.textContent = meta.label;

  // Citation (venue + year; no separate citation field)
  const citation = document.createElement("p");
  citation.className = "pub-citation";
  citation.innerHTML =
    `${pub.authors}. &ldquo;${pub.title}.&rdquo; <em>${pub.venue}</em>, ${pub.year}.`;

  // Action buttons
  const actions = document.createElement("div");
  actions.className = "pub-actions";

  if (pub.paper) {
    const btn = document.createElement("a");
    btn.href = pub.paper;
    btn.target = "_blank";
    btn.rel = "noopener noreferrer";
    btn.className = "pub-btn pub-btn--paper";
    btn.innerHTML = `${ICON_PAPER} Paper ${ICON_EXT}`;
    actions.appendChild(btn);
  }

  if (pub.code) {
    const btn = document.createElement("a");
    btn.href = pub.code;
    btn.target = "_blank";
    btn.rel = "noopener noreferrer";
    btn.className = "pub-btn pub-btn--code";
    btn.innerHTML = `${ICON_CODE} Code ${ICON_EXT}`;
    actions.appendChild(btn);
  }

  if (pub.bibtex) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pub-btn pub-btn--bibtex";
    btn.innerHTML = `${ICON_BIBTEX} BibTeX`;
    btn.addEventListener("click", () => {
      const escaped = pub.bibtex
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<title>BibTeX</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0f172a;color:#e2e8f0;font-family:'Courier New',Courier,monospace;padding:2.5rem;line-height:1.75}
  h2{font-family:system-ui,sans-serif;color:#93c5fd;font-size:.75rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:1.5rem}
  pre{white-space:pre-wrap;word-break:break-word;font-size:.92rem;background:#1e293b;padding:1.5rem;border-radius:8px;border:1px solid #334155}
  button{margin-top:1.25rem;padding:.5rem 1.25rem;background:#3b82f6;color:#fff;border:none;border-radius:6px;font-size:.82rem;font-weight:600;cursor:pointer;font-family:system-ui,sans-serif}
  button:hover{background:#2563eb}
</style></head>
<body>
<h2>BibTeX Citation</h2>
<pre>${escaped}</pre>
<button onclick="navigator.clipboard.writeText(document.querySelector('pre').textContent).then(()=>this.textContent='Copied!')">Copy to clipboard</button>
</body></html>`;
      const blob = new Blob([html], { type: "text/html" });
      const url  = URL.createObjectURL(blob);
      window.open(url, "_blank");
    });
    actions.appendChild(btn);
  }

  // Assemble
  const content = document.createElement("div");
  content.className = "pub-content";
  content.appendChild(citation);
  if (actions.children.length) content.appendChild(actions);

  const article = document.createElement("article");
  article.className = "pub-card";
  article.appendChild(badge);
  article.appendChild(content);

  return article;
}

async function loadPublications() {
  const container = document.getElementById("pub-container");
  if (!container) return;

  try {
    const res  = await fetch("data/publications.json");
    if (!res.ok) throw new Error("fetch failed");
    const pubs = await res.json();

    container.innerHTML = "";

    GROUPS.forEach(group => {
      const items = pubs.filter(p => p.type === group.key);
      if (!items.length) return;

      const heading = document.createElement("h3");
      heading.className = "pub-category-title";
      heading.textContent = group.heading;
      container.appendChild(heading);

      const list = document.createElement("div");
      list.className = "pub-list";
      items.forEach(pub => list.appendChild(buildPubCard(pub)));
      container.appendChild(list);
    });

  } catch {
    container.innerHTML =
      `<p class="pub-loading">Could not load publications. <a href="data/publications.json">View JSON</a>.</p>`;
  }
}

loadPublications();

// ── Dynamic Updates ───────────────────────────────────
async function loadUpdates() {
  const container = document.getElementById("updates-container");
  const fade      = container && container.parentElement.querySelector(".updates-fade");
  if (!container) return;

  try {
    const res     = await fetch("data/updates.json");
    if (!res.ok) throw new Error("fetch failed");
    const updates = await res.json();

    container.innerHTML = "";
    updates.forEach(u => {
      const article = document.createElement("article");
      article.className = "update-card";
      article.innerHTML = `
        <div class="update-meta">
          <time class="update-date" datetime="${u.datetime}">${u.dateDisplay}</time>
        </div>
        <div class="update-body"><p>${u.text}</p></div>`;
      container.appendChild(article);
    });

    // Hide the fade overlay when user has scrolled to the bottom
    if (fade) {
      container.addEventListener("scroll", () => {
        const atBottom =
          container.scrollTop + container.clientHeight >= container.scrollHeight - 8;
        fade.style.opacity = atBottom ? "0" : "1";
      });
    }

  } catch {
    container.innerHTML = `<p class="pub-loading">Could not load updates.</p>`;
  }
}

loadUpdates();
