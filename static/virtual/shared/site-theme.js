(function () {
  "use strict";

  var KEY = "pref-theme";
  var root = document.documentElement;

  function current() {
    var value = null;
    try {
      value = localStorage.getItem(KEY);
    } catch (error) {
      /* localStorage may be unavailable in private mode. */
    }
    return value === "light" ? "light" : "dark";
  }

  function apply(theme) {
    root.dataset.siteTheme = theme;
    var button = document.getElementById("site-theme-toggle");
    if (!button) return;
    var sun = button.querySelector(".theme-sun");
    var moon = button.querySelector(".theme-moon");
    if (sun) sun.setAttribute("aria-hidden", theme === "dark" ? "false" : "true");
    if (moon) moon.setAttribute("aria-hidden", theme === "dark" ? "true" : "false");
    var label = theme === "dark" ? "\u5207\u6362\u5230\u660e\u4eae\u6a21\u5f0f" : "\u5207\u6362\u5230\u9ed1\u6697\u6a21\u5f0f";
    button.setAttribute("aria-label", label);
    button.title = label + " (T)";
  }

  function toggle() {
    var next = current() === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(KEY, next);
    } catch (error) {
      /* Ignore storage failures. */
    }
    apply(next);
    window.dispatchEvent(new CustomEvent("site-theme-change", { detail: { theme: next } }));
  }

  function initButton() {
    if (document.getElementById("site-theme-toggle")) return;
    var button = document.createElement("button");
    button.type = "button";
    button.id = "site-theme-toggle";
    button.className = "site-theme-toggle";
    button.innerHTML =
      '<svg class="theme-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>' +
      '<svg class="theme-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
    button.addEventListener("click", toggle);

    document.body.appendChild(button);
    apply(current());
  }

  apply(current());

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initButton);
  } else {
    initButton();
  }

  document.addEventListener("keydown", function (event) {
    if ((event.key !== "t" && event.key !== "T") || event.metaKey || event.ctrlKey || event.altKey) return;
    var target = event.target;
    if (target && target.closest && target.closest("input, select, textarea")) return;
    toggle();
  });

  window.addEventListener("storage", function (event) {
    if (event.key === KEY) apply(current());
  });
})();
