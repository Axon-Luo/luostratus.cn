import { el } from "../utils/dom.js";

export function confirmDialog({
  title = "确认操作",
  message,
  confirmText = "确认",
  cancelText = "取消",
  danger = false
}) {
  return new Promise((resolve) => {
    const root = document.querySelector("#dialog-root");
    const close = (result) => {
      backdrop.remove();
      resolve(result);
    };

    const dialog = el("section", {
      className: "dialog",
      attrs: { role: "dialog", "aria-modal": "true", "aria-labelledby": "dialog-title" }
    }, [
      el("h2", { text: title, attrs: { id: "dialog-title" } }),
      el("p", { text: message }),
      el("div", { className: "dialog-actions" }, [
        el("button", {
          className: "button button-ghost",
          text: cancelText,
          onClick: () => close(false)
        }),
        el("button", {
          className: `button ${danger ? "button-danger" : "button-primary"}`,
          text: confirmText,
          onClick: () => close(true)
        })
      ])
    ]);

    const backdrop = el("div", {
      className: "dialog-backdrop",
      onClick: (event) => {
        if (event.target === backdrop) close(false);
      }
    }, dialog);
    root.replaceChildren(backdrop);
    dialog.querySelector("button:last-child").focus();
  });
}
