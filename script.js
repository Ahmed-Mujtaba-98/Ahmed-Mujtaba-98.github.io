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

// ── Back-to-top button (mobile) ───────────────────────
const backToTop = document.getElementById("backToTop");

if (backToTop) {
  window.addEventListener("scroll", () => {
    backToTop.classList.toggle("is-visible", window.scrollY > 400);
  });

  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// ── PDF pre-open notice (posters / presentations) ─────
const pdfNoticeOverlay  = document.getElementById("pdfNoticeOverlay");
const pdfNoticeContinue = document.getElementById("pdfNoticeContinue");
const pdfNoticeCancel   = document.getElementById("pdfNoticeCancel");

function openPdfWithNotice(url) {
  if (!pdfNoticeOverlay) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  pdfNoticeContinue.href = url;
  pdfNoticeOverlay.hidden = false;
}

function closePdfNotice() {
  pdfNoticeOverlay.hidden = true;
  pdfNoticeContinue.href = "#";
}

if (pdfNoticeOverlay) {
  pdfNoticeCancel.addEventListener("click", closePdfNotice);
  // Defer so the browser's own navigation (opening the PDF in a new tab)
  // reads the original href before we reset it.
  pdfNoticeContinue.addEventListener("click", () => setTimeout(closePdfNotice, 0));
  pdfNoticeOverlay.addEventListener("click", e => {
    if (e.target === pdfNoticeOverlay) closePdfNotice();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !pdfNoticeOverlay.hidden) closePdfNotice();
  });
}

// ── Card bullets "read more" toggle (Experience & Projects) ──
document.querySelectorAll("#experience .card-bullets, #projects .card-bullets")
  .forEach(list => {
    const items = Array.from(list.children);
    if (items.length <= 2) return;

    const extraItems = items.slice(2);
    extraItems.forEach(li => { li.hidden = true; });

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "card-bullets-more-btn";
    btn.textContent = "Read more";
    btn.setAttribute("aria-expanded", "false");

    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      extraItems.forEach(li => { li.hidden = expanded; });
      btn.setAttribute("aria-expanded", String(!expanded));
      btn.textContent = expanded ? "Read more" : "Show less";
    });

    list.insertAdjacentElement("afterend", btn);
  });

// ── Bio "more" toggle ──────────────────────────────────
const bioMoreBtn  = document.getElementById("bioMoreBtn");
const bioMoreText = document.getElementById("bioMoreText");

if (bioMoreBtn && bioMoreText) {
  bioMoreBtn.addEventListener("click", () => {
    const expanded = bioMoreBtn.getAttribute("aria-expanded") === "true";
    bioMoreText.hidden = expanded;
    bioMoreBtn.setAttribute("aria-expanded", String(!expanded));
    bioMoreBtn.textContent = expanded ? "More" : "Less";
  });
}

// ── Dynamic Publications ──────────────────────────────
// SVG icons (inline so no external dependency)
const ICON_PAPER  = `<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`;
const ICON_CODE   = `<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`;
const ICON_POSTER = `<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="1"/><circle cx="9.5" cy="9.5" r="1.5"/><path d="M4 16l4.5-4.5a2 2 0 012.8 0L16 16M14 14l1.5-1.5a2 2 0 012.8 0L20 14"/></svg>`;
const ICON_PPT    = `<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M8 21h8M12 18v3"/></svg>`;
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
  // Author lists often already end in "." (e.g. "et al."), so avoid a double stop.
  const authors = pub.authors.replace(/\s*\.\s*$/, "");
  citation.innerHTML =
    `${authors}. &ldquo;${pub.title}.&rdquo; <em>${pub.venue}</em>, ${pub.year}.`;

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

  if (pub.poster) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pub-btn pub-btn--poster";
    btn.innerHTML = `${ICON_POSTER} Poster ${ICON_EXT}`;
    btn.addEventListener("click", () => openPdfWithNotice(pub.poster));
    actions.appendChild(btn);
  }

  if (pub.ppt) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pub-btn pub-btn--ppt";
    btn.innerHTML = `${ICON_PPT} PPT ${ICON_EXT}`;
    btn.addEventListener("click", () => openPdfWithNotice(pub.ppt));
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
    // index.html ships a pre-rendered copy of this list (see tools/build-seo.ps1),
    // so on failure we leave that markup in place rather than replacing it.
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
    // Pre-rendered markup from tools/build-seo.ps1 stays visible on failure.
  }
}

loadUpdates();
