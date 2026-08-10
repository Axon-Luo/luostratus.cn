import { safeFileName } from "./sanitize.js";
import { validateProject, normalizeProject } from "./validation.js";
import {
  createPortableProject,
  migrateProjectImages,
  preloadProjectImages
} from "./imageStore.js";

export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportProjectJson(project) {
  const portable = await createPortableProject(project);
  const json = JSON.stringify(portable, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  downloadBlob(blob, `${safeFileName(project.name)}.json`);
}

function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("无法读取JSON文件。"));
    reader.onload = () => resolve(reader.result);
    reader.readAsText(file, "utf-8");
  });
}

export async function readJsonProject(file) {
  if (!file) throw new Error("没有选择文件。");
  if (file.size > 80 * 1024 * 1024) throw new Error("JSON文件超过80MB，无法导入。");

  try {
    const parsed = JSON.parse(await readTextFile(file));
    const result = validateProject(parsed);
    if (!result.valid) throw new Error(result.error);
    const project = normalizeProject(parsed);
    await migrateProjectImages(project);
    await preloadProjectImages(project);
    return project;
  } catch (error) {
    throw new Error(`导入失败：${error.message}`);
  }
}
