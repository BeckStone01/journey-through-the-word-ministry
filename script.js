const body = document.body;
const header = document.querySelector("[data-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const navLinks = Array.from(nav.querySelectorAll('a[href^="#"]'));
const panels = Array.from(document.querySelectorAll(".scroll-panel"));
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let ticking = false;

function syncHeader() {
  header.classList.toggle("scrolled", window.scrollY > 12);
}

function closeNav() {
  body.classList.remove("nav-open");
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", "Open navigation");
}

function scrollToPanel(hash, instant = false) {
  hash = normalizeHash(hash);
  const target = document.querySelector(hash);

  if (!target) {
    return;
  }

  const headerHeight = header.offsetHeight || header.getBoundingClientRect().height;
  const top = hash === "#home" ? 0 : target.offsetTop - headerHeight;

  window.scrollTo({
    top: Math.max(0, Math.round(top)),
    behavior: instant || reduceMotion.matches ? "auto" : "smooth"
  });
}

function normalizeHash(hash) {
  if (hash === "#gather") {
    return "#join";
  }

  if (hash === "#new") {
    return "#home";
  }

  return hash;
}

function syncPanels() {
  let activePanel = null;

  if (reduceMotion.matches) {
    panels.forEach((panel) => {
      panel.style.setProperty("--panel-progress", "1");
      panel.classList.remove("panel-active");
    });
    activePanel = panels.find((panel) => {
      const rect = panel.getBoundingClientRect();
      return rect.top <= window.innerHeight * 0.5 && rect.bottom >= window.innerHeight * 0.5;
    }) || panels[0];
    syncActiveNav(activePanel);
    return;
  }

  const center = window.innerHeight * 0.52;
  let activeProgress = -1;

  panels.forEach((panel) => {
    const rect = panel.getBoundingClientRect();
    const panelCenter = rect.top + rect.height * 0.5;
    const distance = Math.abs(panelCenter - center);
    const range = Math.max(window.innerHeight * 0.66, rect.height * 0.42);
    const progress = Math.max(0, Math.min(1, 1 - distance / range));

    panel.style.setProperty("--panel-progress", progress.toFixed(3));

    if (progress > activeProgress) {
      activeProgress = progress;
      activePanel = panel;
    }
  });

  panels.forEach((panel) => {
    panel.classList.toggle("panel-active", panel === activePanel);
  });

  syncActiveNav(activePanel);
}

function syncActiveNav(activePanel) {
  const activeId = activePanel && activePanel.id;

  navLinks.forEach((link) => {
    const linkHash = link.getAttribute("href").replace("#gather", "#join");
    const isActive = activeId && linkHash === `#${activeId}`;
    link.classList.toggle("active", Boolean(isActive));
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function requestSync() {
  if (ticking) {
    return;
  }

  ticking = true;
  window.requestAnimationFrame(() => {
    syncHeader();
    syncPanels();
    ticking = false;
  });
}

navToggle.addEventListener("click", () => {
  const isOpen = body.classList.toggle("nav-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
  navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
});

nav.addEventListener("click", (event) => {
  const link = event.target.closest("a");

  if (!link) {
    return;
  }

  const url = new URL(link.href, window.location.href);

  if (url.pathname === window.location.pathname && url.hash) {
    event.preventDefault();
    closeNav();
    const normalizedHash = normalizeHash(url.hash);
    scrollToPanel(normalizedHash);
    history.pushState(null, "", normalizedHash);
    requestSync();
    return;
  }

  closeNav();
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  if (nav.contains(link)) {
    return;
  }

  link.addEventListener("click", (event) => {
    const hash = link.getAttribute("href");

    if (hash && hash.length > 1) {
      event.preventDefault();
      const normalizedHash = normalizeHash(hash);
      scrollToPanel(normalizedHash);
      history.pushState(null, "", normalizedHash);
      requestSync();
    }
  });
});

window.addEventListener("scroll", requestSync, { passive: true });
window.addEventListener("resize", () => {
  if (window.innerWidth > 900) {
    closeNav();
  }
  requestSync();
});
reduceMotion.addEventListener("change", requestSync);

function alignCurrentHash() {
  if (!window.location.hash) {
    return;
  }

  const normalizedHash = normalizeHash(window.location.hash);

  if (normalizedHash !== window.location.hash) {
    history.replaceState(null, "", normalizedHash);
  }

  scrollToPanel(normalizedHash, true);
  requestSync();
}

if (window.location.hash) {
  window.requestAnimationFrame(() => {
    alignCurrentHash();
  });
  window.setTimeout(alignCurrentHash, 120);
  window.addEventListener("load", () => window.setTimeout(alignCurrentHash, 80));
}

window.addEventListener("hashchange", alignCurrentHash);
syncHeader();
syncPanels();
