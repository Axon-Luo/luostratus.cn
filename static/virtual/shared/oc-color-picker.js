(function () {
  "use strict";

  const SELECTOR = 'input[type="color"], input[data-oc-color]';
  let observer;

  function fieldsWithin(root) {
    const fields = [];
    if (root instanceof HTMLInputElement && root.matches(SELECTOR)) fields.push(root);
    if (root?.querySelectorAll) fields.push(...root.querySelectorAll(SELECTOR));
    return [...new Set(fields)];
  }

  function syncPreview(field) {
    const wrapper = field.closest(".clr-field");
    if (wrapper) wrapper.style.color = field.value;
  }

  function prepare(root = document) {
    if (typeof window.Coloris !== "function") return [];
    const fields = fieldsWithin(root);
    fields.forEach((field) => {
      if (field.type === "color") field.type = "text";
      field.setAttribute("data-oc-color", "");
      field.setAttribute("autocomplete", "off");
      field.setAttribute("spellcheck", "false");
      field.setAttribute("maxlength", "7");
      field.setAttribute("readonly", "");
    });
    if (fields.length) window.Coloris.wrap(fields);
    fields.forEach(syncPreview);
    return fields;
  }

  function syncAll() {
    document.querySelectorAll("input[data-oc-color]").forEach(syncPreview);
  }

  function init() {
    if (typeof window.Coloris !== "function") return;
    window.Coloris({
      el: "input[data-oc-color]",
      theme: "large",
      themeMode: "light",
      format: "hex",
      formatToggle: false,
      alpha: false,
      focusInput: false,
      selectInput: false,
      closeButton: true,
      closeLabel: "完成",
      margin: 8,
      a11y: {
        open: "打开颜色选择器",
        close: "关闭颜色选择器",
        clear: "清除颜色",
        hueSlider: "色相",
        alphaSlider: "透明度",
        input: "颜色值",
        format: "颜色格式",
        swatch: "颜色样本",
        instruction: "使用方向键调整饱和度与亮度。"
      }
    });
    prepare(document);
    observer = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) prepare(node);
      }));
    });
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("input", (event) => {
      if (event.target.matches?.("input[data-oc-color]")) syncPreview(event.target);
    });
    document.addEventListener("click", () => requestAnimationFrame(syncAll));
    document.addEventListener("change", () => requestAnimationFrame(syncAll));
  }

  window.OCColorPicker = { refresh: prepare, sync: syncAll };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
