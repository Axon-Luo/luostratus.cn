const STORAGE_KEY = "oc-timeline-generator.project.v1";

export function loadStoredProject() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { project: null, error: null };
    return { project: JSON.parse(raw), error: null };
  } catch (error) {
    return { project: null, error: `无法读取本地项目：${error.message}` };
  }
}

export function saveStoredProject(project) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    return { ok: true };
  } catch (error) {
    const likelyQuota = error?.name === "QuotaExceededError";
    return {
      ok: false,
      error: likelyQuota
        ? "浏览器本地存储空间不足。请删除或压缩部分图片后重试。"
        : `本地保存失败：${error.message}`
    };
  }
}

export function clearStoredProject() {
  localStorage.removeItem(STORAGE_KEY);
}
