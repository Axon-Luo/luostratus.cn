export function timelineDateSortValue(value) {
  const normalized = String(value || "").normalize("NFKC").trim();
  if (!normalized) return null;
  if (normalized.includes("元年")) return 0;

  const yearMatch = normalized.match(/([+-]?\d+(?:\.\d+)?)\s*年/);
  if (!yearMatch) return null;

  let year = Number(yearMatch[1]);
  if (!Number.isFinite(year)) return null;

  const prefix = normalized.slice(0, yearMatch.index).trim();
  if (year > 0 && /(?:公元前|纪元前|前)$/.test(prefix)) year = -year;
  return year;
}

export function compareTimelineDates(left, right) {
  const leftValue = timelineDateSortValue(left);
  const rightValue = timelineDateSortValue(right);

  if (leftValue !== null && rightValue !== null && leftValue !== rightValue) {
    return leftValue - rightValue;
  }

  return String(left || "").localeCompare(String(right || ""), "zh-CN", {
    numeric: true,
    sensitivity: "base"
  });
}
