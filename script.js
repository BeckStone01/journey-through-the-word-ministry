const body = document.body;
const header = document.querySelector("[data-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
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

function syncPanels() {
  if (reduceMotion.matches) {
    panels.forEach((panel) => {
      panel.style.setProperty("--panel-progress", "1");
      panel.classList.remove("panel-active");
    });
    return;
  }

  const center = window.innerHeight * 0.52;
  let activePanel = null;
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
  if (event.target.matches("a")) {
    closeNav();
  }
});

window.addEventListener("scroll", requestSync, { passive: true });
window.addEventListener("resize", () => {
  if (window.innerWidth > 900) {
    closeNav();
  }
  requestSync();
});
reduceMotion.addEventListener("change", requestSync);

syncHeader();
syncPanels();
