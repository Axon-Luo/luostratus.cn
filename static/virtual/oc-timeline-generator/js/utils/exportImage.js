import { safeFileName } from "./sanitize.js";

let fontCacheKey = "";
let fontEmbedCssPromise = null;
let scheduledFontKey = "";
let scheduledFontHandle = null;

function getFontCacheKey(project) {
  return `${project.theme.titleFont}|${project.theme.bodyFont}`;
}

export function prepareExportFonts(project) {
  if (!globalThis.htmlToImage?.getFontEmbedCSS) return Promise.resolve("");
  const key = getFontCacheKey(project);
  if (fontCacheKey === key && fontEmbedCssPromise) return fontEmbedCssPromise;

  const canvas = document.querySelector("#timeline-canvas");
  if (!canvas) return Promise.resolve("");
  fontCacheKey = key;
  fontEmbedCssPromise = (async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    return htmlToImage.getFontEmbedCSS(canvas, { cacheBust: false });
  })().catch((error) => {
    if (fontCacheKey === key) {
      fontCacheKey = "";
      fontEmbedCssPromise = null;
    }
    throw error;
  });
  return fontEmbedCssPromise;
}

export function scheduleExportFontPreparation(project) {
  const key = getFontCacheKey(project);
  if (fontCacheKey === key || scheduledFontKey === key) return;

  if (scheduledFontHandle !== null) {
    if (globalThis.cancelIdleCallback) cancelIdleCallback(scheduledFontHandle);
    else clearTimeout(scheduledFontHandle);
  }

  scheduledFontKey = key;
  const prepare = () => {
    scheduledFontHandle = null;
    scheduledFontKey = "";
    prepareExportFonts(project).catch(() => {});
  };
  scheduledFontHandle = globalThis.requestIdleCallback
    ? requestIdleCallback(prepare, { timeout: 3000 })
    : setTimeout(prepare, 800);
}

function waitForImages(root) {
  const images = [...root.querySelectorAll("img")];
  return Promise.all(images.map((image) => {
    if (image.complete && image.naturalWidth) return Promise.resolve();
    return new Promise((resolve) => {
      const finish = () => resolve();
      image.addEventListener("load", finish, { once: true });
      image.addEventListener("error", finish, { once: true });
      window.setTimeout(finish, 5000);
    });
  }));
}

async function waitForAssets(root) {
  await waitForImages(root);
  if (document.fonts?.ready) await document.fonts.ready;
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

function downloadBlob(blob, fileName) {
  if (!(blob instanceof Blob)) throw new Error("PNG blob export failed");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = fileName;
  link.href = url;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function exportElementAsPng(element, project, suffix = "完整时间轴") {
  if (!element || element.hidden) throw new Error("该区域当前未显示，无法导出。");
  if (!globalThis.htmlToImage?.toBlob) {
    throw new Error("PNG导出组件未加载，请检查 vendor/html-to-image.min.js。");
  }

  await waitForAssets(element);
  let fontEmbedCSS = "";
  try {
    fontEmbedCSS = await prepareExportFonts(project);
  } catch {
    // 字体预处理失败时，仍允许导出组件回退到原有处理方式。
  }
  const backgroundColor = getComputedStyle(document.querySelector("#timeline-canvas"))
    .getPropertyValue("--canvas-background")
    .trim() || project.theme.backgroundColor;
  const blob = await htmlToImage.toBlob(element, {
    backgroundColor,
    cacheBust: false,
    pixelRatio: 2,
    skipFonts: false,
    ...(fontEmbedCSS ? { fontEmbedCSS } : {}),
    width: element.scrollWidth,
    height: element.scrollHeight,
    style: {
      transform: "none",
      margin: "0",
      boxShadow: "none"
    }
  });
  downloadBlob(blob, `${safeFileName(project.name)}-${suffix}.png`);
}
