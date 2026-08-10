export function initTabs() {
  const root = document.querySelector("#main-tabs");
  if (!root) return;
  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tab]");
    if (!button) return;
    const tab = button.dataset.tab;

    root.querySelectorAll("[data-tab]").forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", String(active));
    });
    document.querySelectorAll("[data-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.panel !== tab;
    });
  });
}
