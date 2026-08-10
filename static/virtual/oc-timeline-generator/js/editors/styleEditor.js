import { clearHistory, getProject, updatePath, updateProject, replaceProject } from "../state.js";
import {
  createBlankProject,
  createDefaultExample
} from "../projectPresets.js";
import { BODY_FONTS, THEME_PRESETS, TITLE_FONTS } from "../themes.js";
import { clear, el } from "../utils/dom.js";
import {
  createSelectField,
  createSwitch,
  editorBlock
} from "../components/form.js";
import { confirmDialog } from "../components/confirmDialog.js";
import { showToast } from "../components/toast.js";
import {
  cleanupUnusedImages,
  getImageStorageStats,
  requestPersistentImageStorage
} from "../utils/imageStore.js";

function formatStorageBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const COLOR_FIELDS = [
  ["主题色", "primaryColor"],
  ["辅助色", "secondaryColor"],
  ["背景色", "backgroundColor"],
  ["正文颜色", "textColor"],
  ["标题颜色", "titleColor"],
  ["边框颜色", "borderColor"]
];


function rangeField({ label, value, min, max, step = 1, path, suffix }) {
  const output = el("span", { className: "range-value", text: `${value}${suffix}` });
  const input = el("input", {
    attrs: { type: "range", min, max, step },
    value,
    onInput: (event) => {
      const next = Number(event.target.value);
      output.textContent = `${next}${suffix}`;
      updatePath(path, next, {
        group: `range:${path.join(".")}`,
        editor: "style",
        structural: false
      });
    }
  });
  return el("label", { className: "field" }, [
    el("span", { text: label }),
    input,
    output
  ]);
}

export function renderStyleEditor() {
  const root = document.querySelector("#style-editor");
  if (!root) return;
  const project = getProject();
  const { theme, canvas } = project;
  clear(root);

  const presetBlock = editorBlock("主题预设", "PRESETS");
  const cards = el("div", { className: "theme-presets" });
  Object.entries(THEME_PRESETS).forEach(([key, preset]) => {
    cards.append(el("button", {
      className: `theme-card${theme.preset === key ? " is-active" : ""}`,
      type: "button",
      dataset: { value: key },
      onClick: () => {
        updateProject((draft) => {
          Object.assign(draft.theme, preset, { preset: key });
        }, { editor: "style", structural: true, source: `theme:${key}` });
      }
    }, [
      el("strong", { text: preset.label }),
      el("small", { text: preset.description })
    ]));
  });
  presetBlock.append(cards);
  root.append(presetBlock);

  const colorsBlock = editorBlock("色彩", "COLORS");
  const colorGrid = el("div", { className: "field-grid two-columns" });
  COLOR_FIELDS.forEach(([label, key]) => {
    const color = el("input", {
      value: theme[key],
      attrs: { type: "color", "aria-label": label },
      onInput: (event) => updatePath(["theme", key], event.target.value, {
        group: `color:${key}`,
        editor: "style",
        structural: false
      })
    });
    colorGrid.append(el("label", { className: "field" }, [
      el("span", { text: label }),
      el("div", { className: "color-field" }, [
        color
      ])
    ]));
  });
  colorsBlock.append(colorGrid);
  root.append(colorsBlock);

  const typeBlock = editorBlock("字体与尺寸", "TYPE");
  const typeGrid = el("div", { className: "field-grid" }, [
    createSelectField({
      label: "标题字体",
      value: theme.titleFont,
      path: ["theme", "titleFont"],
      editor: "style",
      options: Object.entries(TITLE_FONTS).map(([value, font]) => [value, font.label]),
      structural: false
    }),
    createSelectField({
      label: "正文字体",
      value: theme.bodyFont,
      path: ["theme", "bodyFont"],
      editor: "style",
      options: Object.entries(BODY_FONTS).map(([value, font]) => [value, font.label]),
      structural: false
    }),
    rangeField({
      label: "基础字号",
      value: theme.baseFontSize,
      min: 12,
      max: 28,
      path: ["theme", "baseFontSize"],
      suffix: "px"
    }),
    rangeField({
      label: "圆角大小",
      value: theme.borderRadius,
      min: 0,
      max: 32,
      path: ["theme", "borderRadius"],
      suffix: "px"
    })
  ]);
  typeBlock.append(typeGrid);
  root.append(typeBlock);

  const canvasBlock = editorBlock("画布", "CANVAS");
  canvasBlock.append(el("div", { className: "field-grid" }, [
    rangeField({
      label: "画布宽度",
      value: canvas.width,
      min: 560,
      max: 1200,
      step: 10,
      path: ["canvas", "width"],
      suffix: "px"
    }),
    rangeField({
      label: "画布内边距",
      value: canvas.padding,
      min: 20,
      max: 100,
      step: 2,
      path: ["canvas", "padding"],
      suffix: "px"
    }),
    createSwitch({
      label: "显示纸张纹理",
      checked: theme.showTexture,
      path: ["theme", "showTexture"],
      editor: "style",
      structural: false
    }),
    createSwitch({
      label: "显示画布外边框",
      checked: theme.showBorder,
      path: ["theme", "showBorder"],
      editor: "style",
      structural: false
    })
  ]));
  root.append(canvasBlock);

  const storageBlock = editorBlock("本地图片库", "INDEXEDDB");
  const storageStatus = el("p", {
    className: "storage-summary",
    text: "正在读取图片存储信息…"
  });
  const refreshStorageStatus = async () => {
    const stats = await getImageStorageStats(getProject());
    if (!storageStatus.isConnected) return;
    storageStatus.textContent = stats.supported
      ? `${stats.count} 张图片 · ${formatStorageBytes(stats.bytes)} · ${stats.persistent ? "持久存储已启用" : "标准浏览器存储"}`
      : `IndexedDB 暂不可用，当前使用兼容存储模式。${stats.error || ""}`;
  };
  storageBlock.append(storageStatus);
  storageBlock.append(el("div", { className: "inline-actions storage-actions" }, [
    el("button", {
      className: "button button-ghost button-small",
      type: "button",
      text: "申请持久存储",
      onClick: async () => {
        const granted = await requestPersistentImageStorage();
        showToast(granted ? "浏览器已允许持久保存本地图片。" : "浏览器未授予持久存储；图片仍会正常保存在本站数据中。", granted ? "success" : "info", 4200);
        refreshStorageStatus();
      }
    }),
    el("button", {
      className: "button button-ghost button-small",
      type: "button",
      text: "清理未使用图片",
      onClick: async () => {
        const confirmed = await confirmDialog({
          title: "清理未使用图片？",
          message: "将删除当前项目未引用的旧图片和已替换图片，并清空撤销记录，避免撤销到已经删除的图片。当前使用中的图片不会受影响。",
          confirmText: "开始清理"
        });
        if (!confirmed) return;
        try {
          const result = await cleanupUnusedImages(getProject());
          clearHistory();
          showToast(`已清理 ${result.removed} 张图片，释放 ${formatStorageBytes(result.bytes)}。`, "success");
          refreshStorageStatus();
        } catch (error) {
          showToast(`清理失败：${error.message}`, "error", 4200);
        }
      }
    })
  ]));
  root.append(storageBlock);
  refreshStorageStatus();

  const projectBlock = editorBlock("项目维护", "PROJECT");
  projectBlock.append(el("p", {
    className: "editor-help",
    text: "“一键清空”会保留当前主题和画布尺寸，但移除全部人物、头图文字、事件与尾图内容。"
  }));
  projectBlock.append(el("div", { className: "project-maintenance-actions" }, [
    el("button", {
      className: "button button-danger-soft",
      type: "button",
      text: "一键清空全部内容",
      onClick: async () => {
        const confirmed = await confirmDialog({
          title: "清空全部内容？",
          message: "全部人物、头图文字、事件和尾图内容都会被清除，且无法通过撤销恢复。当前主题与画布设置会保留。",
          confirmText: "确认清空",
          danger: true
        });
        if (!confirmed) return;
        const currentProject = getProject();
        const blank = createBlankProject();
        blank.header.fields.title = "";
        blank.header.fields.foreignTitle = "";
        blank.theme = { ...currentProject.theme };
        blank.canvas = { ...currentProject.canvas };
        replaceProject(blank, { source: "clear-project" });
        showToast("已清空全部内容，主题与画布设置已保留。", "success");
      }
    }),
    el("button", {
      className: "button button-ghost",
      type: "button",
      text: "恢复默认示例",
      onClick: async () => {
        const confirmed = await confirmDialog({
          title: "恢复默认示例？",
          message: "当前内容会被该类型的默认示例替换。建议先导出 JSON 备份。",
          confirmText: "恢复示例",
          danger: true
        });
        if (!confirmed) return;
        const currentProject = getProject();
        const example = createDefaultExample(currentProject.header.type);
        example.theme = { ...currentProject.theme };
        example.canvas = { ...currentProject.canvas };
        replaceProject(example, { source: "restore-type-example" });
        showToast("已恢复当前内容类型的默认示例。", "success");
      }
    })
  ]));
  root.append(projectBlock);
}








