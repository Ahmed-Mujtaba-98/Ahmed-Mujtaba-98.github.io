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

  // Assemble
  const content = document.createElement("div");
  content.className = "pub-content";
  content.appendChild(citation);
  if (actions.children.length) content.appendChild(actions);

  const article = document.createElement("article");
  article.className = "pub-card";
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
