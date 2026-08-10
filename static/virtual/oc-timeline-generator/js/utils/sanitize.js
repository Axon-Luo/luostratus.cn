export function toSafeString(value, fallback = "") {
  if (typeof value === "string") return value.slice(0, 200000);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

export function toSafeBoolean(value, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

export function toSafeNumber(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export function isImageDataUrl(value) {
  return typeof value === "string" && /^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(value);
}

export function isImageAssetReference(value) {
  return typeof value === "string" && /^idb-image:[a-z0-9-]+$/i.test(value);
}

export function safeImage(value) {
  return isImageDataUrl(value) || isImageAssetReference(value) ? value : "";
}

export function safeFileName(value, fallback = "oc-timeline") {
  const cleaned = toSafeString(value, fallback)
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[.\s]+$/g, "")
    .trim()
    .slice(0, 80);
  return cleaned || fallback;
}

