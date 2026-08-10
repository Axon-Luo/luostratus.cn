import { createBlankProject } from "./projectPresets.js";
import {
  getInitialStorageError,
  getProject,
  redo,
  replaceProject,
  saveNow,
  subscribe,
  undo,
  updatePath
} from "./state.js";
import { applyTheme } from "./themes.js";
import { renderHeaderEditor } from "./editors/headerEditor.js";
import { renderTimelineEditor } from "./editors/timelineEditor.js";
import { renderFooterEditor } from "./editors/footerEditor.js";
import { renderStyleEditor } from "./editors/styleEditor.js";
import { renderHeaderPreview } from "./previews/headerPreview.js";
import { renderTimelinePreview } from "./previews/timelinePreview.js";
import { renderFooterPreview } from "./previews/footerPreview.js";
import { initTabs } from "./components/tabs.js";
import { showToast } from "./components/toast.js";
import { confirmDialog } from "./components/confirmDialog.js";
import { exportProjectJson, readJsonProject } from "./utils/file.js";
import {
  migrateProjectImages,
  preloadProjectImages
} from "./utils/imageStore.js";
import {
  exportElementAsPng,
  scheduleExportFontPreparation
} from "./utils/exportImage.js";
import { initTutorial } from "./tutorial.js";

const app = document.querySelector("#app");
const projectNameInput = document.querySelector("#project-name");
const status = document.querySelector("#autosave-status");
const scaleSelect = document.querySelector("#canvas-scale");
const stage = document.querySelector("#canvas-stage");
const dimensionLabel = document.querySelector("#canvas-dimensions");
const canvasViewport = document.querySelector("#canvas-viewport");
const mobileLayoutQuery = window.matchMedia("(max-width: 767px)");

function renderPreviews(project) {
  applyTheme(project);
  renderHeaderPreview(project);
  renderTimelinePreview(project);
  renderFooterPreview(project);
  scheduleExportFontPreparation(project);
}

function renderEditors(editor = "all") {
  if (editor === "all" || editor === "header") renderHeaderEditor();
  if (editor === "all" || editor === "timeline") renderTimelineEditor();
  if (editor === "all" || editor === "footer") renderFooterEditor();
  if (editor === "all" || editor === "style") renderStyleEditor();
}

function applyScale(project) {
  const scale = project.canvas.scale;
  scaleSelect.value = String(scale);

  if (mobileLayoutQuery.matches) {
    const availableWidth = Math.max(240, (canvasViewport?.clientWidth || window.innerWidth) - 24);
    const fitScale = Math.min(1, availableWidth / project.canvas.width);
    stage.style.transform = "none";
    stage.style.zoom = String(fitScale);
    dimensionLabel.textContent = `${project.canvas.width} × AUTO · 适宽`;
    return;
  }

  stage.style.zoom = "";
  stage.style.transform = `scale(${scale})`;
  dimensionLabel.textContent = `${project.canvas.width} × AUTO`;
}

function syncToolbar(project, meta = {}) {
  if (document.activeElement !== projectNameInput) projectNameInput.value = project.name;
  document.querySelector("#undo").disabled = !meta.canUndo;
  document.querySelector("#redo").disabled = !meta.canRedo;
  document.querySelector("#export-header").disabled = !project.header.enabled;
  document.querySelector("#export-footer").disabled = !project.footer.enabled;

  if (meta.type === "saving" || meta.type === "change") {
    status.textContent = "保存中";
    status.className = "status-pill is-saving";
  } else if (meta.type === "storage-error") {
    status.textContent = "保存失败";
    status.className = "status-pill is-error";
  } else {
    status.textContent = "已保存";
    status.className = "status-pill";
  }
}

async function runExport(selector, suffix, button) {
  const project = getProject();
  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = "正在生成…";
  try {
    await exportElementAsPng(document.querySelector(selector), project, suffix);
    showToast(`${suffix} PNG 已导出。`, "success");
  } catch (error) {
    showToast(`导出失败：${error.message}`, "error", 5000);
  } finally {
    button.textContent = originalText;
    button.disabled = false;
    syncToolbar(getProject(), { type: "saved" });
  }
}

function setPreviewMode(enabled) {
  app.classList.toggle("is-preview-mode", enabled);
  document.querySelector("#preview-mode").textContent = enabled ? "退出预览" : "专注预览";
}

function bindToolbar() {
  projectNameInput.addEventListener("input", (event) => {
    updatePath(["name"], event.target.value, {
      group: "project-name",
      editor: "",
      structural: false
    });
  });

  document.querySelector("#new-project").addEventListener("click", async () => {
    const confirmed = await confirmDialog({
      title: "新建空白项目？",
      message: "当前项目会被替换。建议先导出 JSON 备份；已替换的项目无法通过撤销恢复。",
      confirmText: "新建项目",
      danger: true
    });
    if (!confirmed) return;
    replaceProject(createBlankProject(), { source: "new-project" });
    showToast("空白项目已创建。", "success");
  });

  document.querySelector("#save-project").addEventListener("click", () => {
    const result = saveNow();
    showToast(result.ok ? "项目已保存到当前浏览器。" : result.error, result.ok ? "success" : "error");
  });
  document.querySelector("#export-json").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "正在整理图片…";
    try {
      await exportProjectJson(getProject());
      showToast("项目 JSON 已导出，图片已包含在文件中。", "success");
    } catch (error) {
      showToast(`导出失败：${error.message}`, "error", 5200);
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  });
  document.querySelector("#import-json").addEventListener("click", () => {
    document.querySelector("#import-json-input").click();
  });
  document.querySelector("#import-json-input").addEventListener("change", async (event) => {
    const [file] = event.target.files;
    if (!file) return;
    try {
      const project = await readJsonProject(file);
      replaceProject(project, { source: "import" });
      showToast("项目导入成功。", "success");
    } catch (error) {
      showToast(error.message, "error", 5200);
    } finally {
      event.target.value = "";
    }
  });

  document.querySelector("#undo").addEventListener("click", () => {
    if (!undo()) showToast("没有可以撤销的操作。");
  });
  document.querySelector("#redo").addEventListener("click", () => {
    if (!redo()) showToast("没有可以重做的操作。");
  });
  document.querySelector("#preview-mode").addEventListener("click", () => {
    setPreviewMode(!app.classList.contains("is-preview-mode"));
  });
  document.querySelector("#exit-preview").addEventListener("click", () => setPreviewMode(false));
  scaleSelect.addEventListener("change", (event) => {
    updatePath(["canvas", "scale"], Number(event.target.value), {
      editor: "",
      structural: false
    });
  });

  const exports = [
    ["#export-all", "#timeline-canvas", "完整时间轴"],
    ["#export-header", "#header-preview", "头图"],
    ["#export-timeline", "#timeline-preview", "时间轴"],
    ["#export-footer", "#footer-preview", "尾图"]
  ];
  exports.forEach(([buttonSelector, targetSelector, suffix]) => {
    const button = document.querySelector(buttonSelector);
    button.addEventListener("click", () => runExport(targetSelector, suffix, button));
  });
}

function initMobileWorkspace() {
  const workspace = document.querySelector(".workspace");
  const tabs = document.querySelector("#mobile-editor-tabs");
  const resizer = document.querySelector("#mobile-preview-resizer");
  if (!workspace || !tabs || !resizer) return;

  const setMobilePanel = (panel) => {
    const next = panel === "style" ? "style" : "content";
    app.dataset.mobilePanel = next;
    tabs.querySelectorAll("[data-mobile-panel]").forEach((button) => {
      const active = button.dataset.mobilePanel === next;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
  };

  tabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-mobile-panel]");
    if (button) setMobilePanel(button.dataset.mobilePanel);
  });

  const updatePreviewHeight = (clientY) => {
    if (!mobileLayoutQuery.matches) return;
    const workspaceTop = workspace.getBoundingClientRect().top;
    const minimum = 140;
    const maximum = Math.max(minimum, workspace.clientHeight - 250);
    const height = Math.min(maximum, Math.max(minimum, clientY - workspaceTop));
    workspace.style.setProperty("--mobile-preview-height", `${height}px`);
    const percentage = Math.round((height / Math.max(1, workspace.clientHeight)) * 100);
    resizer.setAttribute("aria-valuenow", String(percentage));
  };

  let resizing = false;
  resizer.addEventListener("pointerdown", (event) => {
    if (!mobileLayoutQuery.matches) return;
    resizing = true;
    resizer.setPointerCapture(event.pointerId);
    app.classList.add("is-mobile-resizing");
    updatePreviewHeight(event.clientY);
  });
  resizer.addEventListener("pointermove", (event) => {
    if (resizing) updatePreviewHeight(event.clientY);
  });
  const stopResizing = (event) => {
    if (!resizing) return;
    resizing = false;
    if (resizer.hasPointerCapture?.(event.pointerId)) resizer.releasePointerCapture(event.pointerId);
    app.classList.remove("is-mobile-resizing");
  };
  resizer.addEventListener("pointerup", stopResizing);
  resizer.addEventListener("pointercancel", stopResizing);
  resizer.addEventListener("keydown", (event) => {
    if (!mobileLayoutQuery.matches || !["ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const currentHeight = document.querySelector(".preview-workspace")?.getBoundingClientRect().height || 240;
    updatePreviewHeight(workspace.getBoundingClientRect().top + currentHeight + (event.key === "ArrowDown" ? 24 : -24));
  });
  resizer.addEventListener("dblclick", () => {
    if (!mobileLayoutQuery.matches) return;
    const currentHeight = document.querySelector(".preview-workspace")?.getBoundingClientRect().height || 0;
    const nextRatio = currentHeight < workspace.clientHeight * 0.32 ? 0.42 : 0.24;
    updatePreviewHeight(workspace.getBoundingClientRect().top + workspace.clientHeight * nextRatio);
  });

  const formControlSelector = "input, textarea, select, [contenteditable='true']";
  document.addEventListener("focusin", (event) => {
    if (mobileLayoutQuery.matches && event.target.matches?.(formControlSelector)) {
      app.classList.add("mobile-keyboard-open");
    }
  });
  document.addEventListener("focusout", () => {
    window.setTimeout(() => {
      if (!document.activeElement?.matches?.(formControlSelector)) {
        app.classList.remove("mobile-keyboard-open");
      }
    }, 80);
  });

  document.querySelector("#main-tabs")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tab]");
    if (!button || !mobileLayoutQuery.matches) return;
    window.requestAnimationFrame(() => {
      const section = document.querySelector(`#${button.dataset.tab}-preview`);
      const fitScale = Number.parseFloat(stage.style.zoom) || 1;
      if (section && canvasViewport) {
        canvasViewport.scrollTo({
          top: Math.max(0, section.offsetTop * fitScale - 8),
          behavior: "smooth"
        });
      }
    });
  });

  const refreshMobileScale = () => window.requestAnimationFrame(() => applyScale(getProject()));
  window.addEventListener("resize", refreshMobileScale);
  mobileLayoutQuery.addEventListener?.("change", () => {
    workspace.style.removeProperty("--mobile-preview-height");
    app.classList.remove("mobile-keyboard-open", "is-mobile-resizing");
    refreshMobileScale();
  });

  setMobilePanel(app.dataset.mobilePanel);
}

function bindKeyboardShortcuts() {
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && app.classList.contains("is-preview-mode")) {
      setPreviewMode(false);
      return;
    }
    const modifier = event.ctrlKey || event.metaKey;
    if (!modifier || event.altKey) return;
    if (event.key.toLowerCase() === "z") {
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    }
    if (event.key.toLowerCase() === "y") {
      event.preventDefault();
      redo();
    }
    if (event.key.toLowerCase() === "s") {
      event.preventDefault();
      const result = saveNow();
      if (result.ok) showToast("项目已保存。", "success");
    }
  });
}

async function initialize() {
  initTabs();
  initMobileWorkspace();
  bindToolbar();
  bindKeyboardShortcuts();
  const project = getProject();

  try {
    const migration = await migrateProjectImages(project);
    const preload = await preloadProjectImages(project);
    if (migration.migrated) saveNow();
    if (preload.missing.length) {
      showToast(`${preload.missing.length} 张本地图片未能读取，可重新上传修复。`, "error", 5200);
    }
  } catch (error) {
    showToast(`本地图片库暂不可用，已使用兼容模式：${error.message}`, "error", 5200);
  }

  renderEditors();
  renderPreviews(project);
  applyScale(project);
  syncToolbar(project, { type: "saved", canUndo: false, canRedo: false });
  initTutorial();

  subscribe((nextProject, meta) => {
    syncToolbar(nextProject, meta);
    if (meta.type === "storage-error") {
      showToast(meta.storageError || "本地保存失败。", "error", 5200);
      return;
    }
    if (["saving", "saved"].includes(meta.type)) return;
    renderPreviews(nextProject);
    applyScale(nextProject);
    if (meta.structural) renderEditors(meta.editor || "all");
  });

  const storageError = getInitialStorageError();
  if (storageError) showToast(storageError, "error", 5200);
}

initialize().catch((error) => {
  showToast(`初始化失败：${error.message}`, "error", 5200);
});



