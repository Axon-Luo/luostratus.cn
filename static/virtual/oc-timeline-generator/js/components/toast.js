export function showToast(message, type = "info", duration = 2800) {
  const root = document.querySelector("#toast-root");
  if (!root) return;
  const toast = document.createElement("div");
  toast.className = `toast${type === "error" ? " is-error" : type === "success" ? " is-success" : ""}`;
  toast.textContent = message;
  root.append(toast);
  window.setTimeout(() => toast.remove(), duration);
}
