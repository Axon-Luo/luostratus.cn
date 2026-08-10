/* ==========================================================================
   OC 设定卡工坊 (OC CARD LAB) - app.js
   00. 工具函数与图标库
   01. 模板信息 / 默认配色 / 模板专属字段 schema
   02. 默认状态与 normalize
   03. 状态存取 / 历史 / 提示
   04. 图形引擎 (分段条 / 细线条 / 爱心 / 雷达图)
   05. 四套模板画布渲染
   06. 编辑面板渲染 (共通列表 + schema 驱动专属字段)
   07. 贴纸系统 (创建 / 预设 / 变换 / 图层)
   08. 主形象裁切 (原图一次入库, 每模板裁切参数)
   09. 导出链路 (完整设定卡 / 仅贴纸透明 PNG)
   10. JSON 保存与导入 (含旧 Base64 迁移)
   11. 移动端分屏 / 教程 / 事件绑定 / 初始化
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     00. 工具函数
     ------------------------------------------------------------------------ */
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const STORAGE_KEY = "oc-card-lab-state-v1";
  const MOBILE_SPLIT_KEY = "oc-card-lab-mobile-preview-ratio";
  const IMAGE_UPLOAD_LIMIT = 18 * 1024 * 1024;
  const IMAGE_PREP_LIMITS = {
    portrait: { maxEdge: 3200, maxPixels: 8_000_000 },
    supporting: { maxEdge: 2200, maxPixels: 4_000_000 }
  };
  const imageStore = window.OCImageStore?.create({
    databaseName: "oc-card-lab-images-v1",
    storeName: "images",
    referencePrefix: "oc-card-lab-image:"
  });
  const canvas = $("#oc-canvas");
  const viewport = $("#preview-viewport");
  const stage = $("#preview-stage");

  const clone = value => JSON.parse(JSON.stringify(value));
  const uid = prefix => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const esc = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);
  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, Number(value) || 0));
  const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const getPath = (object, path) => String(path).split(".").reduce((value, key) => value?.[key], object);
  const setPath = (object, path, value) => {
    const keys = String(path).split(".");
    const finalKey = keys.pop();
    const target = keys.reduce((entry, key) => entry[key] ??= {}, object);
    target[finalKey] = value;
  };
  const validHex = value => /^#[0-9a-f]{6}$/i.test(String(value || ""));
  const splitTokens = value => String(value || "").split(/[\n,，、;；/]+/).map(item => item.trim()).filter(Boolean);
  const escBr = value => esc(value).replace(/\n/g, "<br>");
  const imageUrl = reference => imageStore?.resolve(reference) || "";

  const FONT_MAP = {
    sans: '"OC Noto Sans SC","Noto Sans SC","PingFang SC",sans-serif',
    serif: '"OC Noto Serif SC","Noto Serif SC","Songti SC",serif',
    display: 'Georgia,"Times New Roman","OC Noto Serif SC",serif',
    mono: 'Consolas,"Courier New","Liberation Mono",monospace',
    typewriter: '"Courier New",Consolas,"OC Noto Sans SC",monospace'
  };
  const FONT_LABELS = {
    sans: "Noto Sans SC 黑体",
    serif: "Noto Serif SC 宋体",
    display: "西文衬线 Georgia",
    mono: "等宽 Consolas",
    typewriter: "打字机 Courier"
  };

  /* 内联 SVG 图标库 (替代样稿的 Remixicon CDN 图标) */
  const ICON_PATHS = {
    eye: "M12 5C6.5 5 2.6 9.6 1.6 11.5a1 1 0 0 0 0 1C2.6 14.4 6.5 19 12 19s9.4-4.6 10.4-6.5a1 1 0 0 0 0-1C21.4 9.6 17.5 5 12 5Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-2a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
    flash: "M13.2 2 4.5 13.5h5.6L9 22l8.7-11.5h-5.6L13.2 2Z",
    sword: "M19.2 3 21 4.8 10.6 15.2l1.4 1.4-1.4 1.4-1.8-1.7-3.4 3.4a1 1 0 0 1-1.4 0l-1.1-1.1a1 1 0 0 1 0-1.4l3.4-3.4-1.7-1.8 1.4-1.4 1.4 1.4L19.2 3Z",
    shield: "M12 2l8 3.2v5.6c0 4.9-3.3 9.2-8 11.2-4.7-2-8-6.3-8-11.2V5.2L12 2Zm0 2.2L6 6.6v4.2c0 3.9 2.5 7.4 6 9.1 3.5-1.7 6-5.2 6-9.1V6.6l-6-2.4Z",
    gem: "M7 3h10l4 6-9 12L3 9l4-6Zm1.6 2L6 8.6h4L8.6 5Zm3.9 0L14 8.6h4L15.4 5h-2.9ZM7 10.6l4 7.2v-7.2H7Zm6 0v7.2l4-7.2h-4Z",
    pencil: "M3 17.7V21h3.3L18.8 8.5l-3.3-3.3L3 17.7ZM20.7 6.6a1.1 1.1 0 0 0 0-1.6l-1.7-1.7a1.1 1.1 0 0 0-1.6 0l-1.5 1.5 3.3 3.3 1.5-1.5Z",
    tshirt: "M8.2 3 3 6.2l1.8 3.6 2-1V21h10.4V8.8l2 1L21 6.2 15.8 3a3.8 3.8 0 0 1-7.6 0Z",
    camera: "M9 4 7.6 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3.6L15 4H9Zm3 13.2a4.2 4.2 0 1 1 0-8.4 4.2 4.2 0 0 1 0 8.4Zm0-2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z",
    wind: "M3 7.5h10.2a3.3 3.3 0 1 0-3.3-3.3h2a1.3 1.3 0 1 1 1.3 1.3H3v2Zm0 4h15.2a1.3 1.3 0 1 1-1.3 1.3h-2a3.3 3.3 0 1 0 3.3-3.3H3v2Zm0 6h8.2a1.3 1.3 0 1 1-1.3 1.3h-2a3.3 3.3 0 1 0 3.3-3.3H3v2Z",
    ring: "M12 8.5a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4Zm0 2.2a4 4 0 1 1 0 8 4 4 0 0 1 0-8ZM9.8 2h4.4l1.2 3-2.9 2.2h-1L8.6 5l1.2-3Z",
    scissors: "M6 8.6a3.1 3.1 0 1 1 2-.8l3.2 2.7L20 4l-6.6 7.2L20 18.4l-8.8-6.5L8 14.6a3.1 3.1 0 1 1-2-.9c.5 0 1 .1 1.4.3l2.5-2-2.5-2.1c-.4.2-.9.3-1.4.3ZM6 4.4a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8Zm0 11a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8Z",
    bear: "M6.6 4a3 3 0 0 1 3 2 7 7 0 0 1 4.8 0 3 3 0 1 1 4 3.5A7.5 7.5 0 1 1 4.5 11a7.6 7.6 0 0 1-.9-1.5A3 3 0 0 1 6.6 4Zm3 7.5a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Zm4.8 0a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4ZM12 17a2.4 2.4 0 0 0 2.4-2.4H9.6A2.4 2.4 0 0 0 12 17Z",
    bag: "M8.2 7V6a3.8 3.8 0 1 1 7.6 0v1H19l1.2 14H3.8L5 7h3.2Zm2 0h3.6V6a1.8 1.8 0 1 0-3.6 0v1Z",
    heartFill: "M12 21C7.1 16.7 2 12.9 2 8.7 2 5.6 4.4 3.5 7 3.5c1.9 0 3.7 1 5 2.8 1.3-1.8 3.1-2.8 5-2.8 2.6 0 5 2.1 5 5.2 0 4.2-5.1 8-10 12.3Z",
    heartLine: "M12 21C7.1 16.7 2 12.9 2 8.7 2 5.6 4.4 3.5 7 3.5c1.9 0 3.7 1 5 2.8 1.3-1.8 3.1-2.8 5-2.8 2.6 0 5 2.1 5 5.2 0 4.2-5.1 8-10 12.3Zm0-2.7c4-3.6 8-6.8 8-9.6 0-2-1.5-3.2-3-3.2-1.3 0-2.7.8-3.5 2.4L12 9.7l-1.5-1.8C9.7 6.3 8.3 5.5 7 5.5c-1.5 0-3 1.2-3 3.2 0 2.8 4 6 8 9.6Z",
    star: "M12 2l2.9 6.2 6.8.8-5 4.6 1.3 6.7L12 17l-6 3.3 1.3-6.7-5-4.6 6.8-.8L12 2Z",
    file: "M6 2h8l4 4v16H6V2Zm7.5 1.5V7H17l-3.5-3.5ZM8 11h8v1.6H8V11Zm0 3.4h8V16H8v-1.6Z",
    palette: "M12 3a9 9 0 0 0 0 18c1.4 0 2.2-.9 2.2-2 0-.6-.3-1-.6-1.4-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h1.7A5.2 5.2 0 0 0 22 9.2C22 5.6 17.5 3 12 3ZM7 12.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3-4.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm2.5 4.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z",
    chart: "M4 20v-9h3.4v9H4Zm6.3 0V4h3.4v16h-3.4ZM16.6 20v-6h3.4v6h-3.4Z",
    scroll: "M7 2h11a3 3 0 0 1 3 3v2h-4v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-2h12v2a1 1 0 0 0 2 0V5a3 3 0 0 1 .2-1H7a1 1 0 0 0-1 1v10H4V5a3 3 0 0 1 3-3Z",
    link: "M10.6 13.4a4.5 4.5 0 0 0 6.4 0l3.2-3.2a4.5 4.5 0 1 0-6.4-6.4l-1.8 1.8L13.4 7l1.8-1.8a2.5 2.5 0 1 1 3.6 3.6l-3.2 3.2a2.5 2.5 0 0 1-3.6 0l-1.4 1.4Zm2.8-2.8a4.5 4.5 0 0 0-6.4 0l-3.2 3.2a4.5 4.5 0 1 0 6.4 6.4l1.8-1.8L10.6 17l-1.8 1.8a2.5 2.5 0 1 1-3.6-3.6l3.2-3.2a2.5 2.5 0 0 1 3.6 0l1.4-1.4Z",
    flag: "M5 3v18h2v-7h12.5l-2.3-4.5L19.5 5H7V3H5Z",
    quill: "M20.5 3.5c-6.5-.3-11.6 2.6-13.8 8.8L4 19l1.9.7 1.1-3c6.4.9 12-3.6 13.5-13.2ZM8 15l.8-2.2c1.7-4.7 5.2-7.2 9.8-7.4-1.7 6.9-6 10.2-10.6 9.6Z",
    starSmile: "M12 2l2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 15l-5.1 2.7 1.1-5.7-4.3-4 5.8-.7L12 2Zm-2.2 8.8a.9.9 0 1 0 0-1.8.9.9 0 0 0 0 1.8Zm4.4 0a.9.9 0 1 0 0-1.8.9.9 0 0 0 0 1.8Zm-4 1.6a2.6 2.6 0 0 0 3.6 0l-.9-.9a1.3 1.3 0 0 1-1.8 0l-.9.9Z",
    map: "M9.5 2.8 3 5v16.2l6.5-2.2 5 2.2L21 19V2.8l-6.5 2.2-5-2.2Zm.9 2.6 3.2 1.4v12.8l-3.2-1.4V5.4Z",
    diamondMark: "M12 3l4 4.5L12 21 8 7.5 12 3Zm0 3-1.6 1.8L12 15l1.6-7.2L12 6Z"
  };
  const icon = (name, className = "") => `<svg class="oc-ic ${className}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICON_PATHS[name] || ICON_PATHS.star}"/></svg>`;

  const SILHOUETTE = '<svg viewBox="0 0 120 140" class="oc-silhouette" aria-hidden="true"><circle cx="60" cy="42" r="26"/><path d="M14 140 C14 96 40 84 60 84 C80 84 106 96 106 140 Z"/></svg>';

  const DETAIL_ICONS = {
    dossier: ["eye", "flash", "sword", "shield"],
    magazine: ["gem", "pencil", "tshirt", "camera"],
    rpg: ["shield", "sword", "wind", "ring"],
    scrap: ["scissors", "bear", "bag", "camera"]
  };

  /* ------------------------------------------------------------------------
     01. 模板信息 / 默认配色 / 模板专属字段 schema
     ------------------------------------------------------------------------ */
  const TEMPLATE_INFO = {
    dossier: { name: "机密档案卷宗", sub: "CONFIDENTIAL DOSSIER", swatch: ["#f7f5ef", "#7a7264", "#1c1813"] },
    magazine: { name: "时尚杂志内页", sub: "EDITORIAL MAGAZINE", swatch: ["#faf7f1", "#8c6a4f", "#221d18"] },
    rpg: { name: "RPG 角色面板", sub: "FANTASY GAME PANEL", swatch: ["#1b1524", "#c9a86a", "#cfc4b0"] },
    scrap: { name: "手帐拼贴日记", sub: "SCRAPBOOK JOURNAL", swatch: ["#fbf8f0", "#d98e4a", "#5f5142"] }
  };
  const TEMPLATE_IDS = Object.keys(TEMPLATE_INFO);

  const DEFAULT_COLORS = {
    dossier: { paper: "#f7f5ef", ink: "#1c1813", accent: "#8f2f2f", muted: "#7a7264", line: "#d9d2c2" },
    magazine: { paper: "#faf7f1", ink: "#221d18", accent: "#8c6a4f", muted: "#a4988a", line: "#ddd5c8" },
    rpg: { paper: "#1b1524", ink: "#cfc4b0", accent: "#c9a86a", muted: "#8d7f68", line: "#6d5a35" },
    scrap: { paper: "#fbf8f0", ink: "#5f5142", accent: "#d98e4a", muted: "#9c8d77", line: "#e0d3ba" }
  };

  const DEFAULT_TEMPLATE_DATA = {
    dossier: {
      agencyName: "CHARACTER ARCHIVE",
      agencySub: "示例人物 · 角色档案",
      fileNo: "#EXAMPLE-001",
      clearance: "SAMPLE",
      updated: "YYYY-MM-DD",
      subjectId: "SUBJECT ID: EXAMPLE CHARACTER",
      stampText: "SAMPLE",
      photoTag: "PORTRAIT / 角色形象",
      sectionPrefix: "//",
      footerWarning: "CARD LAB · 此处可填写页脚文字"
    },
    magazine: {
      masthead: "PERSONA · CHARACTER ISSUE",
      issueNo: "No.01 / SAMPLE ISSUE",
      role: "此处可填写人物身份",
      quoteBreak: true,
      photoCaption: "此处可填写照片说明",
      pageNo: "001",
      seasonCode: "SAMPLE"
    },
    rpg: {
      level: "LV.01",
      className: "示例职业 CLASS",
      rarity: 3,
      titleBadge: "示例称号",
      likePlusLabel: "好感倾向 AFFINITY",
      guildLine: "此处可填写所属或阵营信息",
      showRadar: true
    },
    scrap: {
      diaryTitle: "示例人物的观察日记",
      headerSub: "PROFILE · 手帐版设定卡",
      polaroidCaption: "此处可填写照片说明",
      recorder: "记录人",
      dateLine: "YYYY.MM.DD",
      heartMax: 5
    }
  };

  const TEMPLATE_SCHEMAS = {
    dossier: [
      { key: "agencyName", label: "机构名（英文）", type: "text" },
      { key: "agencySub", label: "机构副标（中文）", type: "text" },
      { key: "fileNo", label: "档案编号 FILE NO.", type: "text" },
      { key: "clearance", label: "密级 CLEARANCE", type: "text" },
      { key: "updated", label: "更新日期 UPDATED", type: "text" },
      { key: "subjectId", label: "SUBJECT ID 条文字", type: "text" },
      { key: "stampText", label: "印章文字", type: "text" },
      { key: "photoTag", label: "存档照标签", type: "text" },
      { key: "sectionPrefix", label: "小节标题前缀", type: "text" },
      { key: "footerWarning", label: "页脚警示文字", type: "text" }
    ],
    magazine: [
      { key: "masthead", label: "刊头", type: "text" },
      { key: "issueNo", label: "期号 / 卷号", type: "text" },
      { key: "role", label: "职业 / 身份展示行", type: "text" },
      { key: "photoCaption", label: "照片图注", type: "text" },
      { key: "pageNo", label: "页码", type: "text" },
      { key: "seasonCode", label: "季别代码", type: "text" },
      { key: "quoteBreak", label: "引语在标点处自动分行", type: "checkbox" }
    ],
    rpg: [
      { key: "level", label: "等级（如 LV.62）", type: "text" },
      { key: "className", label: "职业", type: "text" },
      { key: "rarity", label: "星级 (0-5)", type: "number", min: 0, max: 5 },
      { key: "titleBadge", label: "称号徽章", type: "text" },
      { key: "likePlusLabel", label: "好感区标题", type: "text" },
      { key: "guildLine", label: "公会页脚行", type: "text" },
      { key: "showRadar", label: "显示六维雷达图", type: "checkbox" }
    ],
    scrap: [
      { key: "diaryTitle", label: "日记标题", type: "text" },
      { key: "headerSub", label: "标题副行", type: "text" },
      { key: "polaroidCaption", label: "拍立得图注", type: "text" },
      { key: "recorder", label: "记录人", type: "text" },
      { key: "dateLine", label: "日期", type: "text" },
      { key: "heartMax", label: "爱心上限", type: "select", options: [{ value: 3, label: "3 颗" }, { value: 4, label: "4 颗" }, { value: 5, label: "5 颗" }] }
    ]
  };

  /* 画布只定宽不定高: 竖版 430px / 横版 900px (与 pho/oc-cards.css 原稿一致), 高度由内容自然撑开 */
  const CANVAS_WIDTH = { portrait: 430, landscape: 900 };
  const LIMITS = { infoRows: 6, palette: 6, details: 4, stats: 6, relations: 6 };

  /* ------------------------------------------------------------------------
     02. 默认状态与 normalize
     ------------------------------------------------------------------------ */
  function defaultCrops() {
    const crops = {};
    TEMPLATE_IDS.forEach(id => { crops[id] = { image: "", zoom: 1, x: 0, y: 0 }; });
    return crops;
  }

  function defaultState() {
    return {
      version: 1,
      projectName: "示例人物设定卡",
      template: "dossier",
      canvasMode: "portrait",
      exportScale: 2,
      common: {
        name: "示例人物",
        nameEn: "EXAMPLE CHARACTER",
        alias: "示例称号",
        age: "",
        birthday: "",
        height: "",
        infoRows: [
          { id: uid("info"), label: "身份", value: "此处可填写人物身份" },
          { id: uid("info"), label: "所属", value: "此处可填写所属信息" }
        ],
        likes: "此处可填写喜欢的事物",
        dislikes: "此处可填写不喜欢的事物",
        motto: "此处可填写人物台词",
        palette: [
          { id: uid("color"), hex: "#1a1d24", label: "主色" },
          { id: uid("color"), hex: "#2e3a4a", label: "发色" },
          { id: uid("color"), hex: "#6e2f2f", label: "瞳色" },
          { id: uid("color"), hex: "#9aa5b1", label: "服装" },
          { id: uid("color"), hex: "#e5ded2", label: "肤色" }
        ],
        details: [
          { id: uid("detail"), image: "", caption: "细节图一", sub: "此处可填写说明" },
          { id: uid("detail"), image: "", caption: "细节图二", sub: "此处可填写说明" },
          { id: uid("detail"), image: "", caption: "细节图三", sub: "此处可填写说明" },
          { id: uid("detail"), image: "", caption: "细节图四", sub: "此处可填写说明" }
        ],
        stats: [
          { id: uid("stat"), label: "能力一", labelEn: "ATTRIBUTE 1", value: 8 },
          { id: uid("stat"), label: "能力二", labelEn: "ATTRIBUTE 2", value: 7 },
          { id: uid("stat"), label: "能力三", labelEn: "ATTRIBUTE 3", value: 6 },
          { id: uid("stat"), label: "能力四", labelEn: "ATTRIBUTE 4", value: 8 },
          { id: uid("stat"), label: "能力五", labelEn: "ATTRIBUTE 5", value: 5 },
          { id: uid("stat"), label: "能力六", labelEn: "ATTRIBUTE 6", value: 7 }
        ],
        bio: "此处可填写人物小传。",
        relations: [
          { id: uid("rel"), name: "关系人物一", desc: "此处可填写人物关系" },
          { id: uid("rel"), name: "关系人物二", desc: "此处可填写人物关系" },
          { id: uid("rel"), name: "关系人物三", desc: "此处可填写人物关系" }
        ],
        portraitImage: "",
        footerText: "CARD LAB · PERSONAL USE ONLY"
      },
      templateData: clone(DEFAULT_TEMPLATE_DATA),
      templateColors: clone(DEFAULT_COLORS),
      crops: defaultCrops(),
      stickers: [],
      selectedStickerId: ""
    };
  }

  function normalizeGeo(raw, fallback) {
    const base = fallback || { x: 50, y: 22, width: 130, height: 52, rotation: 0 };
    return {
      x: clamp(raw?.x ?? base.x, 0, 100),
      y: clamp(raw?.y ?? base.y, 0, 100),
      width: clamp(raw?.width ?? base.width, 24, 900),
      height: clamp(raw?.height ?? base.height, 16, 900),
      rotation: clamp(raw?.rotation ?? base.rotation, -360, 360)
    };
  }

  function normalizeSticker(item) {
    const legacy = normalizeGeo(item);
    return {
      id: String(item?.id || uid("sticker")),
      type: item?.type === "image" ? "image" : "text",
      text: String(item?.text ?? "角色批注"),
      image: imageStore?.normalize(item?.image) || "",
      geo: {
        portrait: normalizeGeo(item?.geo?.portrait, legacy),
        landscape: normalizeGeo(item?.geo?.landscape, legacy)
      },
      font: FONT_MAP[item?.font] ? item.font : "serif",
      fontSize: clamp(item?.fontSize || 15, 8, 120),
      weight: item?.weight === "700" ? "700" : "400",
      lineHeight: clamp(item?.lineHeight || 1.35, .9, 2.4),
      letterSpacing: clamp(item?.letterSpacing || 0, -3, 24),
      align: ["left", "center", "right"].includes(item?.align) ? item.align : "center",
      color: validHex(item?.color) ? item.color : "#3e3e48",
      bgColor: validHex(item?.bgColor) ? item.bgColor : "#f7f6f3",
      backgroundEnabled: Boolean(item?.backgroundEnabled),
      padding: clamp(item?.padding ?? 8, 0, 60),
      border: clamp(item?.border ?? 0, 0, 12),
      opacity: clamp(item?.opacity ?? 1, .1, 1),
      fit: ["contain", "cover", "stretch"].includes(item?.fit) ? item.fit : "contain",
      preserveRatio: item?.preserveRatio !== false,
      locked: Boolean(item?.locked),
      hidden: Boolean(item?.hidden)
    };
  }

  function normalizeListItem(name, item) {
    if (name === "infoRows") return { id: String(item?.id || uid("info")), label: String(item?.label ?? ""), value: String(item?.value ?? "") };
    if (name === "palette") return { id: String(item?.id || uid("color")), hex: validHex(item?.hex) ? item.hex : "#9aa5b1", label: String(item?.label ?? "") };
    if (name === "details") return { id: String(item?.id || uid("detail")), image: imageStore?.normalize(item?.image) || "", caption: String(item?.caption ?? ""), sub: String(item?.sub ?? "") };
    if (name === "stats") return { id: String(item?.id || uid("stat")), label: String(item?.label ?? ""), labelEn: String(item?.labelEn ?? ""), value: clamp(item?.value ?? 5, 0, 10) };
    return { id: String(item?.id || uid("rel")), name: String(item?.name ?? ""), desc: String(item?.desc ?? "") };
  }

  function normalize(raw) {
    const base = defaultState();
    const next = { ...base, ...(raw || {}) };
    next.version = 1;
    next.projectName = String(next.projectName || base.projectName);
    next.template = TEMPLATE_INFO[next.template] ? next.template : "dossier";
    next.canvasMode = CANVAS_WIDTH[next.canvasMode] ? next.canvasMode : "portrait";
    next.exportScale = clamp(next.exportScale || 2, 2, 4);

    const rawCommon = raw?.common || {};
    next.common = { ...base.common, ...rawCommon };
    ["name", "nameEn", "alias", "age", "birthday", "height", "likes", "dislikes", "motto", "bio", "footerText"].forEach(key => {
      next.common[key] = String(next.common[key] ?? "");
    });
    Object.keys(LIMITS).forEach(name => {
      const source = Array.isArray(rawCommon[name]) ? rawCommon[name] : base.common[name];
      next.common[name] = source.slice(0, LIMITS[name]).map(item => normalizeListItem(name, item));
    });
    next.common.portraitImage = imageStore?.normalize(next.common.portraitImage) || "";

    next.templateData = {};
    TEMPLATE_IDS.forEach(id => {
      const defaults = DEFAULT_TEMPLATE_DATA[id];
      const saved = raw?.templateData?.[id] || {};
      const merged = {};
      Object.keys(defaults).forEach(key => {
        const fallback = defaults[key];
        const value = saved[key];
        if (typeof fallback === "boolean") merged[key] = value === undefined ? fallback : Boolean(value);
        else if (typeof fallback === "number") merged[key] = clamp(value ?? fallback, 0, key === "heartMax" ? 5 : key === "rarity" ? 5 : 99);
        else merged[key] = String(value ?? fallback);
      });
      if (id === "scrap") merged.heartMax = clamp(merged.heartMax || 5, 3, 5);
      next.templateData[id] = merged;
    });

    next.templateColors = {};
    TEMPLATE_IDS.forEach(id => {
      const saved = raw?.templateColors?.[id] || {};
      next.templateColors[id] = { ...DEFAULT_COLORS[id] };
      Object.keys(DEFAULT_COLORS[id]).forEach(key => {
        if (validHex(saved[key])) next.templateColors[id][key] = saved[key];
      });
    });

    next.crops = defaultCrops();
    TEMPLATE_IDS.forEach(id => {
      const saved = raw?.crops?.[id] || {};
      next.crops[id] = {
        image: imageStore?.normalize(saved.image) || "",
        zoom: clamp(saved.zoom || 1, 1, 4),
        x: clamp(saved.x || 0, -2, 2),
        y: clamp(saved.y || 0, -2, 2)
      };
    });

    next.stickers = Array.isArray(raw?.stickers) ? raw.stickers.map(normalizeSticker) : [];
    next.selectedStickerId = next.stickers.some(item => item.id === raw?.selectedStickerId) ? raw.selectedStickerId : "";
    return next;
  }

  /* ------------------------------------------------------------------------
     03. 状态存取 / 历史 / 提示
     ------------------------------------------------------------------------ */
  let state = loadState();
  let history = [];
  let future = [];
  let saveTimer = 0;
  let toastTimer = 0;
  let inputCheckpoint = null;
  let previewZoom = 1;
  let transformSession = null;
  let cropSession = null;
  let cropDrag = null;
  let cropReturnState = null;
  let pendingFileReturnState = null;
  let tourIndex = 0;
  let draggedStickerId = "";

  function loadState() {
    try { return normalize(JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || defaultState()); }
    catch { return defaultState(); }
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    $("#save-state").textContent = "保存中";
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        $("#save-state").textContent = "已保存";
      } catch {
        $("#save-state").textContent = "仅保留当前编辑";
      }
    }, 200);
  }

  function pushHistory(snapshot = clone(state)) {
    history.push(snapshot);
    if (history.length > 60) history.shift();
    future = [];
    updateHistoryButtons();
  }

  function updateHistoryButtons() {
    $("#undo").disabled = !history.length;
    $("#redo").disabled = !future.length;
  }

  function undo() {
    if (!history.length) return;
    future.push(clone(state));
    state = normalize(history.pop());
    renderAll();
    scheduleSave();
  }

  function redo() {
    if (!future.length) return;
    history.push(clone(state));
    state = normalize(future.pop());
    renderAll();
    scheduleSave();
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1900);
  }

  function selectedSticker() {
    return state.stickers.find(item => item.id === state.selectedStickerId) || null;
  }

  function activeColors() {
    return state.templateColors[state.template] || DEFAULT_COLORS[state.template];
  }

  function activeTemplateData() {
    return state.templateData[state.template];
  }

  function stickerGeo(item) {
    return item.geo[state.canvasMode] || item.geo.portrait;
  }

  /* ------------------------------------------------------------------------
     04. 图形引擎 (从样稿 oc-cards.js 参数化移植)
     ------------------------------------------------------------------------ */
  function segbarMarkup(value) {
    const filled = Math.round(clamp(value, 0, 10));
    let segments = "";
    for (let index = 0; index < 10; index += 1) segments += `<span class="seg${index < filled ? " on" : ""}"></span>`;
    return `<div class="ds-segbar">${segments}</div>`;
  }

  function lineMarkup(value) {
    const percent = Math.min(100, clamp(value, 0, 10) * 10);
    return `<div class="mg-line"><span class="mg-fill" style="width:${percent}%"></span></div>`;
  }

  function heartsMarkup(value, max) {
    const filled = Math.min(max, Math.round(clamp(value, 0, 10) / 2));
    let hearts = "";
    for (let index = 0; index < max; index += 1) {
      hearts += index < filled ? icon("heartFill") : icon("heartLine", "empty");
    }
    return `<div class="sb-hearts">${hearts}</div>`;
  }

  /* 六维雷达图: 逐参照搬 pho/oc-cards.js renderRadar (size 220 / radius 78 / 标签 radius+17 / 字号 11),
     仅把硬编码颜色换成模板 CSS 变量 (默认值即原稿色) */
  function radarMarkup(stats) {
    if (stats.length < 3) return "";
    const size = 220;
    const cx = size / 2;
    const cy = size / 2;
    const radius = 78;
    const count = stats.length;
    const angleAt = index => (Math.PI * 2 * index / count) - Math.PI / 2;
    const px = (index, r) => (cx + r * Math.cos(angleAt(index))).toFixed(1);
    const py = (index, r) => (cy + r * Math.sin(angleAt(index))).toFixed(1);
    /* 原稿网格色 #453a2a ≈ 边线色与纸张色的中间调 */
    const gridStroke = "color-mix(in srgb, var(--oc-line) 62%, var(--oc-paper))";
    let svg = `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`;
    [1 / 3, 2 / 3, 1].forEach(ratio => {
      const points = stats.map((_, index) => `${px(index, radius * ratio)},${py(index, radius * ratio)}`).join(" ");
      svg += `<polygon points="${points}" fill="none" style="stroke:${gridStroke}" stroke-width="1"/>`;
    });
    stats.forEach((_, index) => {
      svg += `<line x1="${cx}" y1="${cy}" x2="${px(index, radius)}" y2="${py(index, radius)}" style="stroke:${gridStroke}" stroke-width="1"/>`;
    });
    const valuePoints = stats.map((stat, index) => `${px(index, radius * clamp(stat.value, 0, 10) / 10)},${py(index, radius * clamp(stat.value, 0, 10) / 10)}`).join(" ");
    svg += `<polygon points="${valuePoints}" style="fill:color-mix(in srgb, var(--oc-accent) 28%, transparent);stroke:var(--oc-accent)" stroke-width="2" stroke-linejoin="round"/>`;
    stats.forEach((stat, index) => {
      const r = radius * clamp(stat.value, 0, 10) / 10;
      svg += `<circle cx="${px(index, r)}" cy="${py(index, r)}" r="2.6" style="fill:color-mix(in srgb, var(--oc-ink) 55%, #fff)"/>`;
    });
    stats.forEach((stat, index) => {
      const label = String(stat.labelEn || stat.label || "").slice(0, 6);
      svg += `<text x="${px(index, radius + 17)}" y="${(Number(py(index, radius + 17)) + 3).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" style="fill:var(--oc-muted)" font-family="Consolas, 'Courier New', monospace">${esc(label)}</text>`;
    });
    svg += "</svg>";
    return svg;
  }

  /* ------------------------------------------------------------------------
     05. 画布渲染: 数据装配
     ------------------------------------------------------------------------ */
  function visibleStats() {
    return state.common.stats.filter(item => String(item.label || item.labelEn).trim()).slice(0, 6);
  }

  function visibleDetails() {
    return state.common.details.filter(item => item.image || String(item.caption).trim()).slice(0, 4);
  }

  function visiblePalette() {
    return state.common.palette.filter(item => validHex(item.hex)).slice(0, 6);
  }

  function visibleRelations() {
    return state.common.relations.filter(item => String(item.name || item.desc).trim()).slice(0, 6);
  }

  function baseInfoEntries(includeName) {
    const c = state.common;
    const entries = [];
    if (includeName && (c.name || c.nameEn)) entries.push(["姓名 NAME", [c.name, c.nameEn].filter(Boolean).join(" / ")]);
    if (includeName && c.alias) entries.push(["代号 ALIAS", c.alias]);
    if (c.age) entries.push(["年龄 AGE", c.age]);
    if (c.birthday) entries.push(["生日 D.O.B", c.birthday]);
    if (c.height) entries.push(["身高 HGT", c.height]);
    c.infoRows.forEach(row => {
      if (String(row.label || row.value).trim()) entries.push([row.label || "备注", row.value]);
    });
    return entries;
  }

  function simpleInfoEntries(nameLabel) {
    const c = state.common;
    const entries = [];
    if (nameLabel && c.name) entries.push([nameLabel, c.name]);
    if (c.age) entries.push(["年龄", c.age]);
    if (c.birthday) entries.push(["生日", c.birthday]);
    if (c.height) entries.push(["身高", c.height]);
    c.infoRows.forEach(row => {
      if (String(row.label || row.value).trim()) entries.push([row.label || "备注", row.value]);
    });
    return entries;
  }

  function portraitSource() {
    const crop = state.crops[state.template];
    return imageUrl(crop?.image) || imageUrl(state.common.portraitImage);
  }

  function portraitImageMarkup() {
    const url = portraitSource();
    return url ? `<img class="oc-portrait-img" src="${esc(url)}" alt="${esc(state.common.name || "角色")}形象">` : SILHOUETTE;
  }

  /* 细节格内部与原稿一致: 无图时图标为盒子的直接子元素, 有图时以 .d-img 填充盒子上部 */
  function detailMediaMarkup(item, template, index) {
    const url = imageUrl(item.image);
    if (url) return `<img class="d-img" src="${esc(url)}" alt="${esc(item.caption || "细节图")}">`;
    const icons = DETAIL_ICONS[template];
    return icon(icons[index % icons.length]);
  }

  function paletteMarkup(shapeClass) {
    return visiblePalette().map(item => {
      const hex = item.hex.toUpperCase();
      return `<button class="swatch ${shapeClass}" type="button" data-hex="${esc(item.hex)}" style="--sw:${esc(item.hex)}"><i>${esc(hex)}</i>${item.label ? `<b>${esc(item.label)}</b>` : ""}</button>`;
    }).join("");
  }

  /* ---- 模板 01: 机密档案卷宗 ---- */
  function dossierMarkup() {
    const c = state.common;
    const t = state.templateData.dossier;
    const prefix = t.sectionPrefix ? `${t.sectionPrefix} ` : "";
    const sec = label => `<div class="ds-sec-title">${esc(prefix)}${esc(label)}</div>`;
    const meta = [["FILE NO.", t.fileNo], ["CLEARANCE", t.clearance], ["UPDATED", t.updated]]
      .filter(([, value]) => String(value).trim())
      .map(([label, value]) => `<div class="ds-meta-row"><span>${esc(label)}</span><em>${esc(value)}</em></div>`).join("");
    const infoRows = baseInfoEntries(true)
      .map(([label, value]) => `<div class="ds-row"><span class="ds-lbl">${esc(label)}</span><span class="ds-val">${esc(value)}</span></div>`).join("");
    const details = visibleDetails();
    const exhibits = ["A", "B", "C", "D"];
    const stats = visibleStats();
    const palette = visiblePalette();
    const relations = visibleRelations();
    return `
      <div class="ds-header">
        <div class="ds-agency">
          <span class="ds-agency-seal">${icon("eye")}</span>
          <div class="ds-agency-txt">
            ${t.agencyName ? `<strong>${esc(t.agencyName)}</strong>` : ""}
            ${t.agencySub ? `<span>${esc(t.agencySub)}</span>` : ""}
          </div>
        </div>
        ${meta ? `<div class="ds-file-meta">${meta}</div>` : ""}
      </div>
      <div class="ds-idbar"><span>${esc(t.subjectId || `SUBJECT: ${c.name || "UNNAMED"}`)}</span>${t.stampText ? `<span class="ds-stamp">${esc(t.stampText)}</span>` : ""}</div>
      <div class="ds-photo">
        <div class="ds-photo-frame">
          ${portraitImageMarkup()}
          ${t.photoTag ? `<span class="ds-photo-tag">${esc(t.photoTag)}</span>` : ""}
        </div>
      </div>
      <div class="ds-info">${sec("BASIC DATA 基本信息")}${infoRows}</div>
      ${c.likes || c.dislikes ? `<div class="ds-likes">${sec("PREFERENCE 喜好备注")}
        ${c.likes ? `<p class="ds-like-line"><strong># LIKES</strong> ${esc(c.likes)}</p>` : ""}
        ${c.dislikes ? `<p class="ds-like-line dislike"><strong># DISLIKES</strong> ${esc(c.dislikes)}</p>` : ""}
      </div>` : '<div class="ds-likes"></div>'}
      ${c.motto ? `<div class="ds-quote"><span class="ds-quote-lbl">MOTTO</span><span class="ds-quote-txt">“${escBr(c.motto)}”</span></div>` : '<div class="ds-quote" style="display:none"></div>'}
      ${palette.length ? `<div class="ds-palette">${sec("COLOR CODE 色卡")}<div class="ds-swatch-row">${paletteMarkup("")}</div></div>` : '<div class="ds-palette"></div>'}
      ${details.length ? `<div class="ds-details">${sec("EVIDENCE 细节图板块")}<div class="ds-detail-grid">${details.map((item, index) => `<figure class="ds-detail-box">${detailMediaMarkup(item, "dossier", index)}<figcaption>${esc(item.caption)}<small>${esc(item.sub || `EXHIBIT ${exhibits[index] || index + 1}`)}</small></figcaption></figure>`).join("")}</div></div>` : '<div class="ds-details"></div>'}
      ${stats.length ? `<div class="ds-stats">${sec("EVALUATION 基础能力评估")}${stats.map(stat => `<div class="ds-stat-row"><span>${esc([stat.label, stat.labelEn].filter(Boolean).join(" "))}</span>${segbarMarkup(stat.value)}<em>${Math.round(clamp(stat.value, 0, 10))}</em></div>`).join("")}</div>` : '<div class="ds-stats"></div>'}
      <div class="oc-duo ds-duo">
        <div class="ds-bio">${sec("BIOGRAPHY 个人小传")}${c.bio ? `<p class="ds-bio-txt">${esc(c.bio)}</p>` : ""}</div>
        <div class="ds-rel">${sec("RELATIONS 人物关系")}${relations.map(item => `<div class="ds-rel-row"><b>${esc(item.name)}</b><span>${esc(item.desc)}</span></div>`).join("")}</div>
      </div>
      <div class="ds-footer">${esc(t.footerWarning || c.footerText)}</div>`;
  }

  /* ---- 模板 02: 时尚杂志内页 ---- */
  function magazineQuote(text, autoBreak) {
    let html = escBr(text);
    if (autoBreak && !text.includes("\n")) {
      html = html.replace(/([，,。；;])/, "$1<br>");
    }
    return html;
  }

  function magazineMarkup() {
    const c = state.common;
    const t = state.templateData.magazine;
    const info = simpleInfoEntries("")
      .map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join("");
    const likes = splitTokens(c.likes);
    const dislikes = splitTokens(c.dislikes);
    const details = visibleDetails();
    const stats = visibleStats();
    const palette = visiblePalette();
    const relations = visibleRelations();
    return `
      <div class="mg-masthead"><span>${esc(t.masthead)}</span><span>${esc(t.issueNo)}</span></div>
      <div class="mg-name">
        <h2>${esc(c.name || "未命名")}</h2>
        <div class="mg-name-sub">
          ${c.nameEn ? `<span class="mg-en">${esc(c.nameEn)}</span>` : ""}
          ${t.role ? `<span class="mg-role">${esc(t.role)}</span>` : ""}
        </div>
      </div>
      <div class="mg-photo">
        <div class="mg-photo-frame">${portraitImageMarkup()}</div>
        ${t.photoCaption ? `<figcaption>${esc(t.photoCaption)}</figcaption>` : ""}
      </div>
      ${c.motto ? `<div class="mg-quote">“${magazineQuote(c.motto, t.quoteBreak)}”</div>` : '<div class="mg-quote" style="display:none"></div>'}
      <div class="mg-info"><div class="mg-sec-title">PROFILE 基本信息</div><dl>${info}</dl></div>
      <div class="mg-likes">
        ${likes.length ? `<div class="mg-like-col"><div class="mg-sec-title">LOVES 心头好</div><ul>${likes.map(item => `<li>${esc(item)}</li>`).join("")}</ul></div>` : ""}
        ${dislikes.length ? `<div class="mg-like-col"><div class="mg-sec-title">HATES 拒绝往来</div><ul>${dislikes.map(item => `<li>${esc(item)}</li>`).join("")}</ul></div>` : ""}
      </div>
      ${palette.length ? `<div class="mg-palette"><div class="mg-sec-title">PALETTE 色卡</div><div class="mg-swatch-row">${paletteMarkup("round")}</div></div>` : '<div class="mg-palette"></div>'}
      ${details.length ? `<div class="mg-details"><div class="mg-sec-title">DETAILS 细节图板块</div><div class="mg-detail-grid">${details.map((item, index) => `<figure class="mg-detail-box">${detailMediaMarkup(item, "magazine", index)}<figcaption>${esc(item.caption)}${item.sub ? `<small>${esc(item.sub)}</small>` : ""}</figcaption></figure>`).join("")}</div></div>` : '<div class="mg-details"></div>'}
      ${stats.length ? `<div class="mg-stats"><div class="mg-sec-title">INDEX 基础能力</div>${stats.map(stat => `<div class="mg-stat-row"><span>${esc(stat.label || stat.labelEn)}</span>${lineMarkup(stat.value)}<em>${clamp(stat.value, 0, 10).toFixed(1)}</em></div>`).join("")}</div>` : '<div class="mg-stats"></div>'}
      <div class="oc-duo mg-duo">
        <div class="mg-bio"><div class="mg-sec-title">BIOGRAPHY 个人小传</div>${c.bio ? `<p class="mg-bio-txt">${esc(c.bio)}</p>` : ""}</div>
        <div class="mg-rel"><div class="mg-sec-title">RELATIONS 人物关系</div>${relations.map(item => `<div class="mg-rel-row"><b>${esc(item.name)}</b><span>${esc(item.desc)}</span></div>`).join("")}</div>
      </div>
      <div class="mg-footer"><span>${esc(t.pageNo)}</span><span>${esc(c.footerText)}</span><span>${esc(t.seasonCode)}</span></div>`;
  }

  /* ---- 模板 03: RPG 角色面板 ---- */
  function rpgMarkup() {
    const c = state.common;
    const t = state.templateData.rpg;
    const sec = (name, label) => `<div class="rpg-sec-title">${icon(name)} ${esc(label)}</div>`;
    const info = simpleInfoEntries("")
      .map(([label, value]) => `<div class="rpg-slot-row"><span>${esc(label)}</span><em>${esc(value)}</em></div>`).join("");
    const likes = splitTokens(c.likes);
    const dislikes = splitTokens(c.dislikes);
    const details = visibleDetails();
    const stats = visibleStats();
    const palette = visiblePalette();
    const relations = visibleRelations();
    const rarity = Math.round(clamp(t.rarity, 0, 5));
    const statsInner = t.showRadar && stats.length >= 3
      ? `<div class="rpg-stats-flex"><div class="rpg-radar-box">${radarMarkup(stats)}</div><ul class="rpg-stat-list">${stats.map(stat => `<li><span>${esc([stat.label, stat.labelEn].filter(Boolean).join(" "))}</span><em>${Math.round(clamp(stat.value, 0, 10))}</em></li>`).join("")}</ul></div>`
      : `<ul class="rpg-stat-list">${stats.map(stat => `<li><span>${esc([stat.label, stat.labelEn].filter(Boolean).join(" "))}</span><em>${Math.round(clamp(stat.value, 0, 10))}</em></li>`).join("")}</ul>`;
    return `
      <div class="rpg-top">
        ${t.level ? `<span class="rpg-lv">${esc(t.level)}</span>` : "<span></span>"}
        ${t.className ? `<span class="rpg-class">${icon("shield")} ${esc(t.className)}</span>` : "<span></span>"}
        ${rarity ? `<span class="rpg-rarity">${"★".repeat(rarity)}</span>` : "<span></span>"}
      </div>
      <div class="rpg-portrait"><div class="rpg-portrait-frame">${portraitImageMarkup()}</div></div>
      <div class="rpg-nameplate">
        <h2>${esc(c.name || "未命名")}</h2>
        ${c.nameEn ? `<span class="rpg-en">${esc(c.nameEn)}</span>` : ""}
        ${t.titleBadge || c.alias ? `<span class="rpg-title-badge">${esc(t.titleBadge || c.alias)}</span>` : ""}
      </div>
      <div class="rpg-info">${sec("file", "基本信息 PROFILE")}${info}</div>
      <div class="rpg-likes">${sec("heartFill", t.likePlusLabel || "好感倾向 AFFINITY")}
        ${likes.length ? `<div class="rpg-like-row plus"><b>+</b> ${likes.map(esc).join(" · ")}</div>` : ""}
        ${dislikes.length ? `<div class="rpg-like-row minus"><b>−</b> ${dislikes.map(esc).join(" · ")}</div>` : ""}
      </div>
      ${c.motto ? `<div class="rpg-quote">「${escBr(c.motto)}」</div>` : '<div class="rpg-quote" style="display:none"></div>'}
      ${palette.length ? `<div class="rpg-palette">${sec("palette", "配色矿石 PALETTE")}<div class="rpg-swatch-row">${paletteMarkup("gem")}</div></div>` : '<div class="rpg-palette"></div>'}
      ${details.length ? `<div class="rpg-details">${sec("map", "装备细节 EQUIPMENT")}<div class="rpg-detail-grid">${details.map((item, index) => `<figure class="rpg-detail-box">${detailMediaMarkup(item, "rpg", index)}<figcaption>${esc(item.caption)}${item.sub ? `<small>${esc(item.sub)}</small>` : ""}</figcaption></figure>`).join("")}</div></div>` : '<div class="rpg-details"></div>'}
      ${stats.length ? `<div class="rpg-stats">${sec("chart", "基础能力 BASE STATUS")}${statsInner}</div>` : '<div class="rpg-stats"></div>'}
      <div class="oc-duo rpg-duo">
        <div class="rpg-bio">${sec("scroll", "背景残卷 LORE")}${c.bio ? `<p class="rpg-bio-txt">${esc(c.bio)}</p>` : ""}</div>
        <div class="rpg-rel">${sec("link", "羁绊 BONDS")}${relations.map(item => `<div class="rpg-rel-row"><b>${esc(item.name)}</b><span>${esc(item.desc)}</span></div>`).join("")}</div>
      </div>
      <div class="rpg-footer">${icon("flag")} ${esc(t.guildLine || c.footerText)}</div>`;
  }

  /* ---- 模板 04: 手帐拼贴日记 ---- */
  function scrapMarkup() {
    const c = state.common;
    const t = state.templateData.scrap;
    const info = simpleInfoEntries("全名")
      .map(([label, value]) => `<li><span>${esc(label)}</span>${esc(value)}</li>`).join("");
    const likes = splitTokens(c.likes);
    const dislikes = splitTokens(c.dislikes);
    const details = visibleDetails();
    const stats = visibleStats();
    const palette = visiblePalette();
    const relations = visibleRelations();
    const heartMax = clamp(t.heartMax || 5, 3, 5);
    const rotations = ["r-left", "r-right", "r-left2", "r-right2"];
    const footerParts = [t.dateLine, t.recorder ? `记录人: ${t.recorder}` : ""].filter(Boolean).join(" · ");
    return `
      <div class="sb-header">
        <span class="sb-tape tape-a"></span>
        <h2>${esc(t.diaryTitle || `${c.name || "TA"}的观察日记`)} ${icon("starSmile")}</h2>
        ${t.headerSub ? `<span class="sb-header-sub">${esc(t.headerSub)}</span>` : ""}
      </div>
      <div class="sb-photo">
        <figure class="sb-polaroid">
          <span class="sb-tape tape-b"></span>
          <div class="sb-polaroid-img">${portraitImageMarkup()}</div>
          ${t.polaroidCaption ? `<figcaption>${esc(t.polaroidCaption)}</figcaption>` : ""}
        </figure>
      </div>
      <div class="sb-info"><div class="sb-sec-title">基本情报 memo ✎</div><ul class="sb-info-list">${info}</ul></div>
      ${c.motto ? `<div class="sb-quote"><span class="sb-tape tape-c"></span>“${escBr(c.motto)}”</div>` : '<div class="sb-quote" style="display:none"></div>'}
      <div class="sb-likes">
        ${likes.length ? `<div class="sb-sec-title">喜欢的东西 ♡</div><div class="sb-sticker-row">${likes.map(item => `<span class="sb-sticker">${esc(item)}</span>`).join("")}</div>` : ""}
        ${dislikes.length ? `<div class="sb-sec-title dislike">害怕的东西 ✗</div><div class="sb-sticker-row">${dislikes.map(item => `<span class="sb-sticker no">${esc(item)}</span>`).join("")}</div>` : ""}
      </div>
      ${palette.length ? `<div class="sb-palette"><div class="sb-sec-title">专属色卡 🎨</div><div class="sb-swatch-row">${paletteMarkup("blob")}</div></div>` : '<div class="sb-palette"></div>'}
      ${details.length ? `<div class="sb-details"><div class="sb-sec-title">细节收藏夹 📎</div><div class="sb-detail-grid">${details.map((item, index) => `<figure class="sb-mini-polaroid ${rotations[index % 4]}"><div class="sb-mini-img">${imageUrl(item.image) ? `<img src="${esc(imageUrl(item.image))}" alt="${esc(item.caption || "细节图")}">` : icon(DETAIL_ICONS.scrap[index % 4])}</div><figcaption>${esc(item.caption)}${item.sub ? `<small>${esc(item.sub)}</small>` : ""}</figcaption></figure>`).join("")}</div></div>` : '<div class="sb-details"></div>'}
      ${stats.length ? `<div class="sb-stats"><div class="sb-sec-title">能力小雷达 ☆</div>${stats.map(stat => `<div class="sb-stat-row"><span>${esc(stat.label || stat.labelEn)}</span>${heartsMarkup(stat.value, heartMax)}</div>`).join("")}</div>` : '<div class="sb-stats"></div>'}
      <div class="oc-duo sb-duo">
        <div class="sb-bio"><div class="sb-sec-title">关于${esc(c.name || "TA")} 📖</div>${c.bio ? `<p class="sb-bio-txt">${esc(c.bio)}</p>` : ""}</div>
        <div class="sb-rel"><div class="sb-sec-title">身边的人 ♥</div>${relations.map(item => `<div class="sb-rel-row"><b>${esc(item.name)}</b><span>${esc(item.desc)}</span></div>`).join("")}</div>
      </div>
      <div class="sb-footer">${esc(footerParts || c.footerText)} ${icon("quill")}</div>`;
  }

  const TEMPLATE_MARKUP = { dossier: dossierMarkup, magazine: magazineMarkup, rpg: rpgMarkup, scrap: scrapMarkup };

  /* ---- 贴纸标记 ---- */
  function stickerMarkup(item) {
    const selected = item.id === state.selectedStickerId;
    const geo = stickerGeo(item);
    const style = [
      `--sticker-x:${geo.x}%`, `--sticker-y:${geo.y}%`, `--sticker-width:${geo.width}px`, `--sticker-height:${geo.height}px`, `--sticker-rotation:${geo.rotation}deg`
    ].join(";");
    const bodyStyle = [
      `font-family:${FONT_MAP[item.font]}`, `font-size:${item.fontSize}px`, `font-weight:${item.weight}`, `line-height:${item.lineHeight}`,
      `letter-spacing:${item.letterSpacing}px`, `text-align:${item.align}`, `justify-content:${item.align === "left" ? "flex-start" : item.align === "right" ? "flex-end" : "center"}`,
      `color:${item.color}`, `background:${item.backgroundEnabled ? item.bgColor : "transparent"}`, `padding:${item.padding}px`,
      item.border ? `border:${item.border}px solid ${item.color}` : "border:0", `opacity:${item.opacity}`
    ].join(";");
    const fitClass = item.fit === "cover" ? "fit-cover" : item.fit === "stretch" ? "fit-stretch" : "";
    const content = item.type === "image"
      ? (imageUrl(item.image) ? `<img src="${esc(imageUrl(item.image))}" alt="图片贴纸">` : "")
      : esc(item.text);
    return `<div class="canvas-sticker ${item.type}-sticker ${selected ? "is-selected" : ""} ${item.locked ? "is-locked" : ""} ${item.hidden ? "is-hidden" : ""}" data-sticker-id="${esc(item.id)}" style="${style}"><div class="sticker-body ${fitClass}" style='${bodyStyle}'>${content}</div><span class="sticker-handle resize-handle" data-sticker-handle="resize" aria-hidden="true"></span><span class="sticker-handle rotate-handle" data-sticker-handle="rotate" aria-hidden="true"></span></div>`;
  }

  function renderCanvas() {
    const colors = activeColors();
    canvas.dataset.template = state.template;
    canvas.dataset.mode = state.canvasMode;
    canvas.style.setProperty("--oc-paper", colors.paper);
    canvas.style.setProperty("--oc-ink", colors.ink);
    canvas.style.setProperty("--oc-accent", colors.accent);
    canvas.style.setProperty("--oc-muted", colors.muted);
    canvas.style.setProperty("--oc-line", colors.line);
    canvas.innerHTML = `<div class="oc-page">${TEMPLATE_MARKUP[state.template]()}</div><div class="sticker-layer">${state.stickers.map(stickerMarkup).join("")}</div>`;
    requestAnimationFrame(fitCanvas);
  }

  /* 预览缩放: 画布只定宽不定高, 按宽度适配外层 stage, 高度随内容变化 */
  function fitCanvas() {
    if (!canvas || !viewport) return;
    canvas.style.transform = "none";
    const width = CANVAS_WIDTH[state.canvasMode];
    const mobile = matchMedia("(max-width: 900px)").matches;
    const padding = mobile ? 0 : 54;
    const widthScale = Math.max(1, viewport.clientWidth - padding) / width;
    const base = mobile ? widthScale : Math.min(widthScale, 1);
    const scale = clamp(base * previewZoom, .1, 2);
    canvas.style.transform = `scale(${scale})`;
    stage.style.width = `${Math.ceil(width * scale)}px`;
    stage.style.height = `${Math.ceil(canvas.offsetHeight * scale)}px`;
  }

  /* ------------------------------------------------------------------------
     06. 编辑面板渲染
     ------------------------------------------------------------------------ */
  function renderThemeGrid() {
    $("#theme-grid").innerHTML = TEMPLATE_IDS.map(id => {
      const info = TEMPLATE_INFO[id];
      return `<button class="theme-button ${state.template === id ? "active" : ""}" data-template="${id}" type="button"><i class="theme-swatch" style="--swatch-a:${info.swatch[0]};--swatch-b:${info.swatch[1]};--swatch-c:${info.swatch[2]}"></i><span><b>${esc(info.name)}</b><small>${esc(info.sub)}</small></span></button>`;
    }).join("");
  }

  function renderTemplateFields() {
    const schema = TEMPLATE_SCHEMAS[state.template];
    const data = activeTemplateData();
    $("#template-fields-title").textContent = `本模板专属 · ${TEMPLATE_INFO[state.template].name}`;
    $("#template-fields").innerHTML = schema.map(field => {
      const value = data[field.key];
      if (field.type === "checkbox") {
        return `<label class="check-field"><input type="checkbox" data-tfield="${field.key}" ${value ? "checked" : ""}> ${esc(field.label)}</label>`;
      }
      if (field.type === "select") {
        return `<label class="field"><span>${esc(field.label)}</span><select data-tfield="${field.key}">${field.options.map(option => `<option value="${option.value}" ${String(value) === String(option.value) ? "selected" : ""}>${esc(option.label)}</option>`).join("")}</select></label>`;
      }
      if (field.type === "number") {
        return `<label class="field"><span>${esc(field.label)}</span><input type="number" min="${field.min ?? 0}" max="${field.max ?? 99}" step="1" data-tfield="${field.key}" value="${esc(value)}"></label>`;
      }
      return `<label class="field"><span>${esc(field.label)}</span><input data-tfield="${field.key}" value="${esc(value)}"></label>`;
    }).join("");
  }

  function rowActions(list, id, index, total) {
    return `<div class="row-actions"><button data-list-action="up" data-list="${list}" data-id="${esc(id)}" ${index === 0 ? "disabled" : ""} type="button">↑</button><button data-list-action="down" data-list="${list}" data-id="${esc(id)}" ${index === total - 1 ? "disabled" : ""} type="button">↓</button><button data-list-action="delete" data-list="${list}" data-id="${esc(id)}" type="button">×</button></div>`;
  }

  function renderInfoRows() {
    const rows = state.common.infoRows;
    $("#info-row-list").innerHTML = rows.length ? rows.map((item, index) => `<article class="dynamic-row"><div class="row-head"><b>信息行 ${index + 1}</b>${rowActions("infoRows", item.id, index, rows.length)}</div><div class="field-grid"><label class="field"><span>标签</span><input data-list="infoRows" data-id="${esc(item.id)}" data-key="label" value="${esc(item.label)}"></label><label class="field"><span>内容</span><input data-list="infoRows" data-id="${esc(item.id)}" data-key="value" value="${esc(item.value)}"></label></div></article>`).join("") : '<p class="empty-note">尚未添加附加信息行。</p>';
  }

  function renderPaletteList() {
    const rows = state.common.palette;
    $("#palette-list").innerHTML = rows.length ? rows.map((item, index) => `<article class="dynamic-row"><div class="row-head"><b>色票 ${index + 1}</b>${rowActions("palette", item.id, index, rows.length)}</div><div class="palette-hex-field"><label class="field"><span>色值</span><input type="color" data-list="palette" data-id="${esc(item.id)}" data-key="hex" value="${esc(item.hex)}"></label><label class="field"><span>名称</span><input data-list="palette" data-id="${esc(item.id)}" data-key="label" value="${esc(item.label)}" placeholder="发色 / 瞳色"></label></div></article>`).join("") : '<p class="empty-note">尚未添加色卡。</p>';
    window.OCColorPicker?.refresh?.($("#palette-list"));
  }

  function renderDetailList() {
    const rows = state.common.details;
    $("#detail-list").innerHTML = rows.length ? rows.map((item, index) => `<article class="dynamic-row"><div class="row-head"><b>细节 ${index + 1}</b>${rowActions("details", item.id, index, rows.length)}</div><div class="field-grid"><label class="field"><span>名称</span><input data-list="details" data-id="${esc(item.id)}" data-key="caption" value="${esc(item.caption)}"></label><label class="field"><span>小字备注</span><input data-list="details" data-id="${esc(item.id)}" data-key="sub" value="${esc(item.sub)}" placeholder="EXHIBIT A"></label></div><div class="detail-upload"><span class="detail-thumb">${imageUrl(item.image) ? `<img src="${esc(imageUrl(item.image))}" alt="细节图">` : "无图"}</span><label class="button compact file-button">上传图片<input type="file" accept="image/*" data-detail-image="${esc(item.id)}"></label>${item.image ? `<button class="text-button" data-detail-recrop="${esc(item.id)}" type="button">重新裁切</button><button class="text-button" data-detail-remove="${esc(item.id)}" type="button">移除图片</button>` : ""}</div></article>`).join("") : '<p class="empty-note">尚未添加细节图。</p>';
  }

  function renderStatList() {
    const rows = state.common.stats;
    $("#stat-list").innerHTML = rows.length ? rows.map((item, index) => `<article class="dynamic-row"><div class="row-head"><b>能力 ${index + 1}</b>${rowActions("stats", item.id, index, rows.length)}</div><div class="field-grid"><label class="field"><span>名称</span><input data-list="stats" data-id="${esc(item.id)}" data-key="label" value="${esc(item.label)}"></label><label class="field"><span>英文标签</span><input data-list="stats" data-id="${esc(item.id)}" data-key="labelEn" value="${esc(item.labelEn)}" placeholder="STR"></label></div><div class="stat-value-row"><label class="range-field"><span>数值 <output>${item.value}</output></span><input type="range" min="0" max="10" step=".5" data-list="stats" data-id="${esc(item.id)}" data-key="value" value="${esc(item.value)}"></label><label class="field"><span>分值</span><input type="number" min="0" max="10" step=".5" data-list="stats" data-id="${esc(item.id)}" data-key="value" value="${esc(item.value)}"></label></div></article>`).join("") : '<p class="empty-note">尚未添加能力值。</p>';
  }

  function renderRelationList() {
    const rows = state.common.relations;
    $("#relation-list").innerHTML = rows.length ? rows.map((item, index) => `<article class="dynamic-row"><div class="row-head"><b>关系 ${index + 1}</b>${rowActions("relations", item.id, index, rows.length)}</div><div class="field-grid"><label class="field"><span>姓名</span><input data-list="relations" data-id="${esc(item.id)}" data-key="name" value="${esc(item.name)}"></label><label class="field"><span>关系说明</span><input data-list="relations" data-id="${esc(item.id)}" data-key="desc" value="${esc(item.desc)}"></label></div></article>`).join("") : '<p class="empty-note">尚未添加人物关系。</p>';
  }

  function renderPortraitPreview() {
    const url = portraitSource();
    $("#portrait-preview").innerHTML = url ? `<img src="${esc(url)}" alt="主形象预览">` : "<span>形象</span>";
  }

  function stickerLabel(item) {
    return item.type === "image" ? "图片贴纸" : String(item.text || "文字贴纸").replace(/\s+/g, " ").slice(0, 18) || "文字贴纸";
  }

  function renderStickerList() {
    $("#sticker-list").innerHTML = state.stickers.length ? state.stickers.map((item, index) => `<article class="sticker-row ${item.id === state.selectedStickerId ? "active" : ""}" draggable="true" data-sticker-row="${esc(item.id)}"><div class="row-copy" data-select-sticker="${esc(item.id)}"><b>${esc(stickerLabel(item))}</b><small>${item.type === "image" ? "IMAGE" : "TEXT"}${item.locked ? " / LOCKED" : ""}${item.hidden ? " / HIDDEN" : ""}</small></div><div class="row-actions"><button data-sticker-action="down" data-id="${esc(item.id)}" ${index === 0 ? "disabled" : ""} type="button">↓</button><button data-sticker-action="up" data-id="${esc(item.id)}" ${index === state.stickers.length - 1 ? "disabled" : ""} type="button">↑</button><button data-sticker-action="copy" data-id="${esc(item.id)}" type="button">＋</button></div></article>`).join("") : '<p class="empty-note">尚未添加贴纸。</p>';
  }

  function renderStickerEditor() {
    const item = selectedSticker();
    if (!item) {
      $("#sticker-editor").innerHTML = '<p class="empty-note">请新建或选择一个贴纸。</p>';
      return;
    }
    const geo = stickerGeo(item);
    const textFields = item.type === "text" ? `
      <label class="field"><span>文字内容</span><textarea rows="3" data-sticker-field="text">${esc(item.text)}</textarea></label>
      <label class="field"><span>字体</span><select data-sticker-field="font">${Object.keys(FONT_MAP).map(key => `<option value="${key}">${esc(FONT_LABELS[key])}</option>`).join("")}</select></label>
      <div class="field-grid"><label class="field"><span>字号</span><input type="number" min="8" max="120" data-sticker-field="fontSize"></label><label class="field"><span>行高</span><input type="number" min=".9" max="2.4" step=".05" data-sticker-field="lineHeight"></label></div>
      <label class="field"><span>字间距</span><input type="number" min="-3" max="24" step=".5" data-sticker-field="letterSpacing"></label>
      <div class="align-switch"><button data-sticker-align="left" type="button">居左</button><button data-sticker-align="center" type="button">居中</button><button data-sticker-align="right" type="button">居右</button></div>` : `
      <label class="field"><span>图片适配</span><select data-sticker-field="fit"><option value="contain">完整显示 contain</option><option value="cover">填满裁切 cover</option><option value="stretch">自由拉伸</option></select></label>`;
    $("#sticker-editor").innerHTML = `${textFields}
      <div class="field-grid"><label class="field"><span>宽度</span><input type="number" min="24" max="900" data-sticker-field="width"></label><label class="field"><span>高度</span><input type="number" min="16" max="900" data-sticker-field="height"></label></div>
      <div class="field-grid"><label class="field"><span>横向位置 %</span><input type="number" min="0" max="100" step=".1" data-sticker-field="x"></label><label class="field"><span>纵向位置 %</span><input type="number" min="0" max="100" step=".1" data-sticker-field="y"></label></div>
      <label class="field"><span>旋转角度</span><input type="number" min="-360" max="360" data-sticker-field="rotation"></label>
      <div class="color-grid"><label class="color-field"><span>文字 / 边框</span><input type="color" data-sticker-field="color" value="${esc(item.color)}"></label><label class="color-field"><span>背景</span><input type="color" data-sticker-field="bgColor" value="${esc(item.bgColor)}"></label></div>
      <div class="field-grid"><label class="field"><span>内边距</span><input type="number" min="0" max="60" data-sticker-field="padding"></label><label class="field"><span>边框</span><input type="number" min="0" max="12" data-sticker-field="border"></label></div>
      <label class="range-field"><span>不透明度 <output>${Math.round(item.opacity * 100)}%</output></span><input type="range" min=".1" max="1" step=".05" data-sticker-field="opacity"></label>
      <div class="check-row"><label><input type="checkbox" data-sticker-field="backgroundEnabled"> 显示背景</label><label><input type="checkbox" data-sticker-field="weight"> 粗体</label><label><input type="checkbox" data-sticker-field="preserveRatio"> 保持比例</label><label><input type="checkbox" data-sticker-field="locked"> 锁定</label><label><input type="checkbox" data-sticker-field="hidden"> 隐藏</label></div>
      <div class="sticker-editor-actions"><button data-sticker-action="down" data-id="${esc(item.id)}" type="button">下移一层</button><button data-sticker-action="up" data-id="${esc(item.id)}" type="button">上移一层</button><button data-sticker-action="copy" data-id="${esc(item.id)}" type="button">复制</button><button data-sticker-action="delete" data-id="${esc(item.id)}" type="button">删除</button></div>`;
    $$('[data-sticker-field]', $("#sticker-editor")).forEach(control => {
      const key = control.dataset.stickerField;
      if (key === "weight") control.checked = item.weight === "700";
      else if (control.type === "checkbox") control.checked = Boolean(item[key]);
      else if (["x", "y", "width", "height", "rotation"].includes(key)) control.value = geo[key];
      else if (key !== "color" && key !== "bgColor") control.value = item[key];
    });
    $$('[data-sticker-align]', $("#sticker-editor")).forEach(button => button.classList.toggle("active", button.dataset.stickerAlign === item.align));
    window.OCColorPicker?.refresh?.($("#sticker-editor"));
  }

  function syncStaticInputs() {
    $$('[data-path]').forEach(control => {
      if (document.activeElement === control) return;
      const value = getPath(state, control.dataset.path);
      if (control.type === "checkbox") control.checked = Boolean(value);
      else control.value = value ?? "";
    });
    $$('[data-canvas-mode]').forEach(button => button.classList.toggle("active", button.dataset.canvasMode === state.canvasMode));
    const colors = activeColors();
    $$('[data-template-color]').forEach(control => { control.value = colors[control.dataset.templateColor]; });
    window.OCColorPicker?.refresh?.($("#colors-card"));
    window.OCColorPicker?.sync?.();
  }

  function renderAll() {
    syncStaticInputs();
    renderThemeGrid();
    renderTemplateFields();
    renderInfoRows();
    renderPaletteList();
    renderDetailList();
    renderStatList();
    renderRelationList();
    renderPortraitPreview();
    renderStickerList();
    renderStickerEditor();
    renderCanvas();
    updateHistoryButtons();
  }

  /* ------------------------------------------------------------------------
     07. 贴纸系统
     ------------------------------------------------------------------------ */
  function selectSticker(id, renderEditor = true) {
    if (!state.stickers.some(item => item.id === id)) return;
    state.selectedStickerId = id;
    if (renderEditor) {
      renderStickerList();
      renderStickerEditor();
    }
    $$(".canvas-sticker", canvas).forEach(node => node.classList.toggle("is-selected", node.dataset.stickerId === id));
    scheduleSave();
  }

  function stickerAction(action, id = state.selectedStickerId) {
    const index = state.stickers.findIndex(item => item.id === id);
    if (index < 0) return;
    pushHistory();
    const item = state.stickers[index];
    if (action === "up" && index < state.stickers.length - 1) [state.stickers[index], state.stickers[index + 1]] = [state.stickers[index + 1], state.stickers[index]];
    if (action === "down" && index > 0) [state.stickers[index], state.stickers[index - 1]] = [state.stickers[index - 1], state.stickers[index]];
    if (action === "copy") {
      const copy = normalizeSticker({ ...clone(item), id: uid("sticker") });
      ["portrait", "landscape"].forEach(mode => {
        copy.geo[mode].x = clamp(copy.geo[mode].x + 3, 0, 100);
        copy.geo[mode].y = clamp(copy.geo[mode].y + 3, 0, 100);
      });
      state.stickers.splice(index + 1, 0, copy);
      state.selectedStickerId = copy.id;
    }
    if (action === "delete") {
      state.stickers.splice(index, 1);
      state.selectedStickerId = state.stickers[Math.min(index, state.stickers.length - 1)]?.id || "";
    }
    renderStickerList();
    renderStickerEditor();
    renderCanvas();
    scheduleSave();
  }

  function createSticker(preset) {
    pushHistory();
    const item = normalizeSticker({ id: uid("sticker"), preserveRatio: false, ...preset });
    if (preset.x !== undefined || preset.width !== undefined) {
      const geo = normalizeGeo(preset);
      item.geo = { portrait: clone(geo), landscape: clone(geo) };
    }
    state.stickers.push(item);
    state.selectedStickerId = item.id;
    renderStickerList();
    renderStickerEditor();
    renderCanvas();
    scheduleSave();
    return item;
  }

  function addTextSticker() {
    const text = $("#new-sticker-text").value.trim() || "角色批注";
    createSticker({ type: "text", text, x: 52, y: 22, width: 150, height: 56, fontSize: 15, font: "serif", color: activeColors().ink, bgColor: activeColors().paper });
    $("#new-sticker-text").value = "";
  }

  /* 预设贴纸几何按 430px 宽画布标定 */
  const STICKER_PRESETS = {
    topsecret: { type: "text", text: "TOP SECRET", font: "typewriter", fontSize: 19, weight: "700", color: "#8f2f2f", border: 2, padding: 6, letterSpacing: 3, x: 66, y: 14, width: 158, height: 40, rotation: -8, opacity: .92 },
    approved: { type: "text", text: "APPROVED", font: "typewriter", fontSize: 17, weight: "700", color: "#3f6d4e", border: 2, padding: 6, letterSpacing: 2, x: 34, y: 16, width: 138, height: 38, rotation: 6, opacity: .9 },
    tape: { type: "text", text: " ", font: "sans", fontSize: 12, color: "#c79b56", backgroundEnabled: true, bgColor: "#e8c17a", opacity: .6, border: 0, padding: 0, x: 50, y: 8, width: 110, height: 22, rotation: -4 },
    star: { type: "text", text: "☆ 今日最推 ☆", font: "sans", fontSize: 13, weight: "700", color: "#b0793d", backgroundEnabled: true, bgColor: "#fdf3e4", padding: 5, x: 50, y: 30, width: 128, height: 32, rotation: -3 },
    heart: { type: "text", text: "♥ 心动瞬间", font: "serif", fontSize: 13, weight: "700", color: "#a4535f", backgroundEnabled: true, bgColor: "#f8e7ea", padding: 5, x: 46, y: 40, width: 116, height: 32, rotation: 2 },
    memo: { type: "text", text: "今天也要好好记录！", font: "serif", fontSize: 12, color: "#5f5142", backgroundEnabled: true, bgColor: "#fffdf5", padding: 9, border: 1, x: 58, y: 52, width: 140, height: 58, rotation: -2 }
  };

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("image decode failed"));
      image.src = dataUrl;
    });
  }

  /* 手机相册图片常有数千万像素。先缩到制卡所需尺寸，避免 Base64、解码位图和
     裁切画布同时驻留内存时触发浏览器白屏。 */
  async function fileToDataUrl(file, limits = IMAGE_PREP_LIMITS.supporting) {
    if (!file || !file.type.startsWith("image/") || file.size > IMAGE_UPLOAD_LIMIT) throw new Error("invalid image");

    let drawable;
    let width = 0;
    let height = 0;
    let rawDataUrl = "";
    let bitmap = null;

    if (typeof createImageBitmap === "function") {
      const bitmapOptions = { imageOrientation: "from-image" };
      /* 对手机相册的大文件直接要求解码器生成较小位图，避免先展开原始数千万像素。 */
      if (file.size > 2 * 1024 * 1024) {
        bitmapOptions.resizeWidth = Math.min(limits.maxEdge, limits.maxPixels <= 4_000_000 ? 1500 : 2200);
        bitmapOptions.resizeQuality = "high";
      }
      try {
        bitmap = await createImageBitmap(file, bitmapOptions);
        drawable = bitmap;
        width = bitmap.width;
        height = bitmap.height;
      } catch {
        try {
          const fallbackOptions = bitmapOptions.resizeWidth ? { resizeWidth: bitmapOptions.resizeWidth, resizeQuality: "high" } : undefined;
          bitmap = await createImageBitmap(file, fallbackOptions);
          drawable = bitmap;
          width = bitmap.width;
          height = bitmap.height;
        } catch { /* 个别旧浏览器与图片格式走 Image 回退。 */ }
      }
    }

    if (!drawable) {
      rawDataUrl = await readFileAsDataUrl(file);
      drawable = await loadImage(rawDataUrl);
      width = drawable.naturalWidth;
      height = drawable.naturalHeight;
    }

    if (!width || !height) {
      bitmap?.close?.();
      throw new Error("empty image");
    }

    const scale = Math.min(1, limits.maxEdge / Math.max(width, height), Math.sqrt(limits.maxPixels / (width * height)));
    const needsTranscode = scale < .999 || file.size > 4 * 1024 * 1024;
    if (!needsTranscode) {
      bitmap?.close?.();
      return rawDataUrl || readFileAsDataUrl(file);
    }

    const workCanvas = document.createElement("canvas");
    workCanvas.width = Math.max(1, Math.round(width * scale));
    workCanvas.height = Math.max(1, Math.round(height * scale));
    const context = workCanvas.getContext("2d", { alpha: true });
    if (!context) {
      bitmap?.close?.();
      throw new Error("canvas unavailable");
    }
    context.drawImage(drawable, 0, 0, workCanvas.width, workCanvas.height);
    bitmap?.close?.();
    const prepared = workCanvas.toDataURL("image/webp", .9);
    workCanvas.width = 1;
    workCanvas.height = 1;
    return prepared;
  }

  async function addImageSticker(file) {
    try {
      const reference = await imageStore.storeDataUrl(await fileToDataUrl(file, IMAGE_PREP_LIMITS.supporting));
      await imageStore.preload([reference]);
      createSticker({ type: "image", image: reference, x: 50, y: 24, width: 140, height: 105, padding: 0, preserveRatio: true });
    } catch {
      showToast("请选择 18MB 以内的图片");
    }
  }

  function beginStickerTransform(event, kind, id) {
    const item = state.stickers.find(entry => entry.id === id);
    const node = event.target.closest(".canvas-sticker");
    if (!item || !node) return;
    selectSticker(id);
    if (item.locked) return;
    event.preventDefault();
    const geo = stickerGeo(item);
    const rect = canvas.getBoundingClientRect();
    const visualScale = rect.width / canvas.offsetWidth;
    const centerX = rect.left + geo.x / 100 * rect.width;
    const centerY = rect.top + geo.y / 100 * rect.height;
    transformSession = { pointerId: event.pointerId, kind, item, geo, node, before: clone(state), startX: event.clientX, startY: event.clientY, x: geo.x, y: geo.y, width: geo.width, height: geo.height, rotation: geo.rotation, ratio: geo.width / geo.height, centerX, centerY, visualScale, rect };
    try { node.setPointerCapture(event.pointerId); } catch { }
  }

  function moveStickerTransform(event) {
    const session = transformSession;
    if (!session || session.pointerId !== event.pointerId) return;
    event.preventDefault();
    const { geo, node } = session;
    if (session.kind === "drag") {
      geo.x = clamp(session.x + (event.clientX - session.startX) / session.rect.width * 100, 0, 100);
      geo.y = clamp(session.y + (event.clientY - session.startY) / session.rect.height * 100, 0, 100);
      node.style.setProperty("--sticker-x", `${geo.x}%`);
      node.style.setProperty("--sticker-y", `${geo.y}%`);
    } else if (session.kind === "resize") {
      const nextWidth = clamp(session.width + (event.clientX - session.startX) / session.visualScale, 24, 900);
      const freeHeight = clamp(session.height + (event.clientY - session.startY) / session.visualScale, 16, 900);
      geo.width = nextWidth;
      geo.height = session.item.preserveRatio ? clamp(nextWidth / session.ratio, 16, 900) : freeHeight;
      node.style.setProperty("--sticker-width", `${geo.width}px`);
      node.style.setProperty("--sticker-height", `${geo.height}px`);
    } else {
      const startAngle = Math.atan2(session.startY - session.centerY, session.startX - session.centerX);
      const currentAngle = Math.atan2(event.clientY - session.centerY, event.clientX - session.centerX);
      geo.rotation = Math.round(session.rotation + (currentAngle - startAngle) * 180 / Math.PI);
      node.style.setProperty("--sticker-rotation", `${geo.rotation}deg`);
    }
  }

  function endStickerTransform(event) {
    if (!transformSession || transformSession.pointerId !== event.pointerId) return;
    pushHistory(transformSession.before);
    transformSession = null;
    renderStickerList();
    renderStickerEditor();
    renderCanvas();
    scheduleSave();
  }

  function changeStickerField(control) {
    const item = selectedSticker();
    if (!item) return;
    const key = control.dataset.stickerField;
    if ((key === "color" || key === "bgColor") && !validHex(control.value)) return;
    if (["x", "y", "width", "height", "rotation"].includes(key)) {
      const geo = stickerGeo(item);
      geo[key] = number(control.value, geo[key]);
      const bounds = { x: [0, 100], y: [0, 100], width: [24, 900], height: [16, 900], rotation: [-360, 360] }[key];
      geo[key] = clamp(geo[key], bounds[0], bounds[1]);
      renderCanvas();
      scheduleSave();
      return;
    }
    let value;
    if (key === "weight") value = control.checked ? "700" : "400";
    else if (control.type === "checkbox") value = control.checked;
    else if (["text", "font", "color", "bgColor", "fit"].includes(key)) value = control.value;
    else value = number(control.value, item[key]);
    item[key] = value;
    if (key === "bgColor") {
      item.backgroundEnabled = true;
      const backgroundToggle = $('[data-sticker-field="backgroundEnabled"]', $("#sticker-editor"));
      if (backgroundToggle) backgroundToggle.checked = true;
    }
    renderCanvas();
    if (["text", "locked", "hidden"].includes(key)) renderStickerList();
    scheduleSave();
  }

  /* ------------------------------------------------------------------------
     08. 主形象裁切
     ------------------------------------------------------------------------ */
  function portraitSlotAspect() {
    const selectors = {
      dossier: ".ds-photo-frame",
      magazine: ".mg-photo-frame",
      rpg: ".rpg-portrait-frame",
      scrap: ".sb-polaroid-img"
    };
    const slot = $(selectors[state.template], canvas);
    if (slot?.offsetWidth && slot?.offsetHeight) return clamp(slot.offsetWidth / slot.offsetHeight, .3, 3);
    /* 兜底比例按原稿各模板照片框在 430px 竖版下的真实长宽比估算 */
    const fallback = { dossier: .8, magazine: 2.05, rpg: 2.3, scrap: 1.03 };
    return fallback[state.template];
  }

  function setupCropCanvas(aspect = portraitSlotAspect()) {
    const cropCanvas = $("#crop-canvas");
    if (aspect >= 1) { cropCanvas.width = 1200; cropCanvas.height = Math.round(1200 / aspect); }
    else { cropCanvas.height = 1200; cropCanvas.width = Math.round(1200 * aspect); }
  }

  function captureWorkspaceView(trigger = null) {
    return {
      trigger,
      panels: $$(".panel-scroll").map(panel => ({ panel, top: panel.scrollTop, left: panel.scrollLeft })),
      previewTop: viewport.scrollTop,
      previewLeft: viewport.scrollLeft
    };
  }

  function restoreWorkspaceView(snapshot, restoreFocus = false) {
    if (!snapshot) return;
    const restore = () => {
      fitCanvas();
      snapshot.panels.forEach(({ panel, top, left }) => {
        if (panel.isConnected) panel.scrollTo({ top, left, behavior: "auto" });
      });
      viewport.scrollTo({ top: snapshot.previewTop, left: snapshot.previewLeft, behavior: "auto" });
    };
    restore();
    requestAnimationFrame(() => requestAnimationFrame(restore));
    setTimeout(restore, 180);
    if (restoreFocus && snapshot.trigger?.isConnected && snapshot.trigger.matches("button,[href],[tabindex]")) {
      try { snapshot.trigger.focus({ preventScroll: true }); } catch { }
    }
  }

  function openCropModal(image, isNewSource, sourceDataUrl, returnState = null, options = {}) {
    const kind = options.kind || "portrait";
    setupCropCanvas(kind === "detail" ? 1 : portraitSlotAspect());
    const cropCanvas = $("#crop-canvas");
    const saved = kind === "portrait" ? state.crops[state.template] : { zoom: 1, x: 0, y: 0 };
    const zoom = isNewSource ? 1 : clamp(saved.zoom || 1, 1, 4);
    cropSession = {
      kind,
      detailId: options.detailId || "",
      image,
      isNewSource,
      sourceDataUrl: sourceDataUrl || "",
      zoom,
      x: isNewSource ? 0 : (saved.x || 0) * cropCanvas.width,
      y: isNewSource ? 0 : (saved.y || 0) * cropCanvas.height
    };
    $("#crop-zoom").value = String(zoom);
    if (kind === "detail") {
      const item = state.common.details.find(entry => entry.id === options.detailId);
      $("#crop-title").textContent = `裁切细节图${item?.caption ? ` · ${item.caption}` : ""}`;
      $("#crop-hint").textContent = "拖动图片调整构图。细节图使用通用方形裁切，四套模板会自动适配各自的小图框。";
    } else {
      $("#crop-title").textContent = `裁切主形象 · ${TEMPLATE_INFO[state.template].name}`;
      $("#crop-hint").textContent = "拖动图片调整构图。裁切框比例来自当前模板与画布方向的真实槽位。";
    }
    cropReturnState = returnState || captureWorkspaceView(document.activeElement);
    $("#crop-modal").hidden = false;
    document.body.classList.add("crop-open");
    drawCrop();
    requestAnimationFrame(() => $("#apply-crop").focus({ preventScroll: true }));
  }

  async function openCropForFile(file, returnState = null) {
    try {
      restoreWorkspaceView(returnState);
      const source = await fileToDataUrl(file, IMAGE_PREP_LIMITS.portrait);
      const image = await loadImage(source);
      openCropModal(image, true, source, returnState);
    } catch {
      showToast("请选择 18MB 以内的图片");
    }
  }

  async function openCropForExisting(returnState = null) {
    if (!state.common.portraitImage) return showToast("请先上传主形象图");
    try {
      const source = await imageStore.toDataUrl(state.common.portraitImage);
      if (!source) return showToast("原图已不可用，请重新上传");
      const image = new Image();
      image.onload = () => openCropModal(image, false, "", returnState);
      image.onerror = () => showToast("图片读取失败");
      image.src = source;
    } catch {
      showToast("原图读取失败，请重新上传");
    }
  }

  function drawCrop() {
    if (!cropSession) return;
    const output = $("#crop-canvas");
    const context = output.getContext("2d");
    const image = cropSession.image;
    const scale = Math.max(output.width / image.naturalWidth, output.height / image.naturalHeight) * cropSession.zoom;
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, output.width, output.height);
    context.drawImage(image, (output.width - width) / 2 + cropSession.x, (output.height - height) / 2 + cropSession.y, width, height);
  }

  function closeCrop() {
    const returnState = cropReturnState;
    if ($("#crop-modal").contains(document.activeElement)) document.activeElement.blur();
    cropSession = null;
    cropDrag = null;
    cropReturnState = null;
    $("#crop-modal").hidden = true;
    document.body.classList.remove("crop-open");
    restoreWorkspaceView(returnState, true);
  }

  async function applyCrop() {
    if (!cropSession) return;
    try {
      pushHistory();
      const output = $("#crop-canvas");
      const reference = await imageStore.storeDataUrl(output.toDataURL("image/webp", .93));
      await imageStore.preload([reference]);
      if (cropSession.kind === "detail") {
        const item = state.common.details.find(entry => entry.id === cropSession.detailId);
        if (!item) throw new Error("detail missing");
        item.image = reference;
        closeCrop();
        renderDetailList();
        renderCanvas();
        scheduleSave();
        showToast("细节图裁切已保存");
        return;
      }
      if (cropSession.isNewSource && cropSession.sourceDataUrl) {
        state.common.portraitImage = await imageStore.storeDataUrl(cropSession.sourceDataUrl);
        TEMPLATE_IDS.forEach(id => { state.crops[id] = { image: "", zoom: 1, x: 0, y: 0 }; });
      }
      await imageStore.preload([reference, state.common.portraitImage].filter(Boolean));
      state.crops[state.template] = {
        image: reference,
        zoom: cropSession.zoom,
        x: cropSession.x / output.width,
        y: cropSession.y / output.height
      };
      closeCrop();
      renderPortraitPreview();
      renderCanvas();
      scheduleSave();
      showToast(`已保存 ${TEMPLATE_INFO[state.template].name} 的裁切`);
    } catch {
      showToast("裁切图片保存失败");
    }
  }

  async function openDetailCropForFile(id, file, returnState = null) {
    try {
      restoreWorkspaceView(returnState);
      const source = await fileToDataUrl(file, IMAGE_PREP_LIMITS.supporting);
      const image = await loadImage(source);
      openCropModal(image, true, source, returnState, { kind: "detail", detailId: id });
    } catch {
      showToast("请选择 18MB 以内的图片");
    }
  }

  async function openDetailCropForExisting(id, returnState = null) {
    const item = state.common.details.find(entry => entry.id === id);
    if (!item?.image) return showToast("请先上传细节图");
    try {
      const source = await imageStore.toDataUrl(item.image);
      const image = await loadImage(source);
      openCropModal(image, false, "", returnState, { kind: "detail", detailId: id });
    } catch {
      showToast("细节图读取失败，请重新上传");
    }
  }

  /* ------------------------------------------------------------------------
     09. 导出链路
     ------------------------------------------------------------------------ */
  function collectImageReferences(targetState = state) {
    const references = [targetState.common?.portraitImage];
    TEMPLATE_IDS.forEach(id => references.push(targetState.crops?.[id]?.image));
    (targetState.common?.details || []).forEach(item => references.push(item.image));
    (targetState.stickers || []).forEach(item => references.push(item.image));
    return references.filter(Boolean);
  }

  async function preloadImages() {
    await imageStore?.preload(collectImageReferences());
  }

  function waitForImages(root) {
    return Promise.all($$("img", root).map(image => image.complete ? image.decode?.().catch(() => { }) : new Promise(resolve => { image.onload = resolve; image.onerror = resolve; })));
  }

  function downloadBlob(blob, filename) {
    if (!(blob instanceof Blob)) throw new Error("PNG blob export failed");
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  async function exportImage(target) {
    const stickersOnly = target === "stickers";
    const label = stickersOnly ? "贴纸透明图" : "完整设定卡";
    const previousTransform = canvas.style.transform;
    try {
      canvas.classList.add("is-exporting");
      if (stickersOnly) canvas.classList.add("stickers-only");
      canvas.style.transform = "none";
      await preloadImages();
      await waitForImages(canvas);
      await document.fonts?.ready;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      /* 宽度固定 430/900, 高度取节点真实内容高度 */
      const width = Math.ceil(Math.max(canvas.scrollWidth, canvas.offsetWidth, CANVAS_WIDTH[state.canvasMode]));
      const height = Math.ceil(Math.max(canvas.scrollHeight, canvas.offsetHeight));
      const scale = Number(state.exportScale);
      if (width * height * scale * scale > 95_000_000) return showToast("当前倍率超过浏览器安全尺寸，请降低倍率");
      const fontEmbedCSS = await window.OCExportFonts?.getFontEmbedCSS(canvas);
      const options = {
        width,
        height,
        pixelRatio: scale,
        cacheBust: false,
        skipFonts: true,
        fontEmbedCSS: fontEmbedCSS || "",
        style: { transform: "none", transformOrigin: "top left", boxShadow: "none" }
      };
      if (!stickersOnly) options.backgroundColor = activeColors().paper;
      const blob = await window.htmlToImage.toBlob(canvas, options);
      downloadBlob(blob, `${state.projectName || "设定卡"}-${label}.png`);
      showToast(`${label}已导出`);
    } catch (error) {
      console.error(error);
      showToast("导出失败，请检查图片与字体资源");
    } finally {
      canvas.classList.remove("is-exporting", "stickers-only");
      canvas.style.transform = previousTransform;
      requestAnimationFrame(fitCanvas);
    }
  }

  /* ------------------------------------------------------------------------
     10. JSON 保存与导入
     ------------------------------------------------------------------------ */
  async function saveJson() {
    const backup = clone(state);
    try {
      if (backup.common.portraitImage) backup.common.portraitImage = await imageStore.toDataUrl(backup.common.portraitImage);
      for (const id of TEMPLATE_IDS) {
        if (backup.crops[id]?.image) backup.crops[id].image = await imageStore.toDataUrl(backup.crops[id].image);
      }
      for (const item of backup.common.details) if (item.image) item.image = await imageStore.toDataUrl(item.image);
      for (const sticker of backup.stickers) if (sticker.image) sticker.image = await imageStore.toDataUrl(sticker.image);
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${state.projectName || "设定卡"}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast("项目 JSON 已保存");
    } catch {
      showToast("项目保存失败");
    }
  }

  async function migrateEmbeddedImages(next) {
    if (imageStore?.isDataImage(next.common.portraitImage)) next.common.portraitImage = await imageStore.storeDataUrl(next.common.portraitImage);
    for (const id of TEMPLATE_IDS) {
      if (imageStore?.isDataImage(next.crops[id]?.image)) next.crops[id].image = await imageStore.storeDataUrl(next.crops[id].image);
    }
    for (const item of next.common.details) {
      if (imageStore?.isDataImage(item.image)) item.image = await imageStore.storeDataUrl(item.image);
    }
    for (const sticker of next.stickers) {
      if (imageStore?.isDataImage(sticker.image)) sticker.image = await imageStore.storeDataUrl(sticker.image);
    }
    return next;
  }

  async function importJson(file) {
    try {
      const raw = JSON.parse(await file.text());
      pushHistory();
      state = await migrateEmbeddedImages(normalize(raw));
      await preloadImages();
      renderAll();
      scheduleSave();
      showToast("项目已导入");
    } catch (error) {
      console.error(error);
      showToast("无法读取这个项目文件");
    }
  }

  function newProject() {
    if (!confirm("新建项目会替换当前编辑内容。建议先保存 JSON。")) return;
    pushHistory();
    state = defaultState();
    renderAll();
    scheduleSave();
    showToast("已新建设定卡");
  }

  /* ------------------------------------------------------------------------
     11. 移动端分屏 / 教程 / 事件 / 初始化
     ------------------------------------------------------------------------ */
  function setupMobileResizer() {
    const workspace = $("#workspace");
    const resizer = $("#mobile-resizer");
    const query = matchMedia("(max-width: 900px)");
    let ratio = .4;
    let activePointer = null;
    try {
      const saved = Number(localStorage.getItem(MOBILE_SPLIT_KEY));
      if (saved >= .22 && saved <= .72) ratio = saved;
    } catch { }
    const applyHeight = (height, persist = true) => {
      if (!query.matches) return;
      const available = Math.max(1, workspace.clientHeight);
      const minimum = Math.max(116, available * .22);
      const maximum = Math.max(minimum, Math.min(available * .72, available - 196));
      const next = clamp(height, minimum, maximum);
      if (persist) ratio = next / available;
      workspace.style.setProperty("--mobile-preview-height", `${next}px`);
      resizer.setAttribute("aria-valuenow", String(Math.round(next / available * 100)));
      if (persist) try { localStorage.setItem(MOBILE_SPLIT_KEY, String(ratio)); } catch { }
      requestAnimationFrame(fitCanvas);
    };
    const fromPointer = event => applyHeight(event.clientY - workspace.getBoundingClientRect().top);
    resizer.addEventListener("pointerdown", event => {
      if (!query.matches || event.isPrimary === false) return;
      event.preventDefault();
      activePointer = event.pointerId;
      try { resizer.setPointerCapture(event.pointerId); } catch { }
      fromPointer(event);
    });
    window.addEventListener("pointermove", event => { if (activePointer === event.pointerId) fromPointer(event); }, { passive: false });
    const stop = event => {
      if (activePointer !== event.pointerId) return;
      activePointer = null;
      try { resizer.releasePointerCapture(event.pointerId); } catch { }
    };
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    resizer.addEventListener("touchstart", event => event.preventDefault(), { passive: false });
    resizer.addEventListener("touchmove", event => event.preventDefault(), { passive: false });
    resizer.addEventListener("keydown", event => {
      if (!["ArrowUp", "ArrowDown"].includes(event.key)) return;
      event.preventDefault();
      applyHeight(workspace.clientHeight * ratio + (event.key === "ArrowDown" ? 24 : -24));
    });
    resizer.addEventListener("dblclick", () => applyHeight(workspace.clientHeight * .4));
    const applyRatio = () => query.matches ? applyHeight(workspace.clientHeight * ratio, false) : workspace.style.removeProperty("--mobile-preview-height");
    window.addEventListener("resize", applyRatio);
    let viewportTimer = 0;
    const settleViewport = () => {
      clearTimeout(viewportTimer);
      viewportTimer = setTimeout(applyRatio, 120);
    };
    window.visualViewport?.addEventListener("resize", settleViewport);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") settleViewport(); });
    query.addEventListener?.("change", applyRatio);
    requestAnimationFrame(applyRatio);
  }

  const TOUR_STEPS = [
    { selector: "#identity-card", panel: "content", title: "填写角色共通资料", copy: "姓名、基本信息、喜好和代表台词在四套模板间共通保存，切换模板不会丢失。" },
    { selector: "#portrait-card", panel: "content", title: "上传主形象并按模板裁切", copy: "原图只保存一次，每套模板的槽位比例不同，可分别裁切；色卡与细节图也在下方编辑。" },
    { selector: "#stats-card", panel: "content", title: "填写能力值", copy: "同一份 0-10 能力值，在档案里是分段方块条、杂志里是细线条、RPG 里是雷达图、手帐里是爱心。" },
    { selector: "#template-fields-card", panel: "content", title: "认识本模板专属字段", copy: "档案编号、刊头页码、等级星级、记录人日期等专属字段按模板整组切换，数据互不覆盖。" },
    { selector: "#colors-card", panel: "style", title: "调整模板配色", copy: "纸张、文字、重点、辅助和边线五种颜色按模板独立保存，可随时恢复样稿默认配色。" },
    { selector: "#add-sticker-card", panel: "style", title: "添加自由贴纸", copy: "文字、图片和预设印章贴纸都能拖动、缩放、旋转；横竖版分别记忆位置。" },
    { selector: "#export-card", panel: "style", title: "切换横竖版并导出", copy: "预览工具栏可切换 430px 竖版与 900px 横版，高度随内容自然延伸；分别微调后导出 PNG 或仅贴纸透明图。" }
  ];

  function closeTour() {
    $("#tour-overlay").hidden = true;
  }

  function positionTour() {
    const step = TOUR_STEPS[tourIndex];
    document.body.dataset.mobilePanel = step.panel;
    syncMobileTabs();
    requestAnimationFrame(() => {
      const target = $(step.selector);
      if (!target) return closeTour();
      target.scrollIntoView({ block: "center", behavior: "smooth" });
      requestAnimationFrame(() => {
        const rect = target.getBoundingClientRect();
        const focus = $("#tour-focus");
        const margin = 6;
        focus.style.left = `${Math.max(4, rect.left - margin)}px`;
        focus.style.top = `${Math.max(4, rect.top - margin)}px`;
        focus.style.width = `${Math.min(innerWidth - 8, rect.width + margin * 2)}px`;
        focus.style.height = `${Math.min(innerHeight - 8, rect.height + margin * 2)}px`;
        const card = $("#tour-card");
        if (matchMedia("(max-width: 900px)").matches) {
          card.style.left = "12px";
          card.style.right = "12px";
          card.style.top = "auto";
        } else {
          card.style.left = `${Math.min(innerWidth - 380, Math.max(12, rect.right + 16))}px`;
          card.style.top = `${Math.min(innerHeight - 250, Math.max(12, rect.top))}px`;
          card.style.right = "auto";
          card.style.bottom = "auto";
        }
      });
    });
    $("#tour-progress").textContent = `${tourIndex + 1} / ${TOUR_STEPS.length}`;
    $("#tour-title").textContent = step.title;
    $("#tour-copy").textContent = step.copy;
    $("#tour-prev").disabled = tourIndex === 0;
    $("#tour-next").textContent = tourIndex === TOUR_STEPS.length - 1 ? "完成" : "下一步";
  }

  function startTour() {
    tourIndex = 0;
    $("#tour-overlay").hidden = false;
    positionTour();
  }

  function syncMobileTabs() {
    $$(".mobile-main-tabs [data-mobile-panel]").forEach(button => button.classList.toggle("active", button.dataset.mobilePanel === document.body.dataset.mobilePanel));
  }

  const LIST_DEFS = {
    infoRows: { render: renderInfoRows, blank: () => ({ id: uid("info"), label: "", value: "" }) },
    palette: { render: renderPaletteList, blank: () => ({ id: uid("color"), hex: "#9aa5b1", label: "" }) },
    details: { render: renderDetailList, blank: () => ({ id: uid("detail"), image: "", caption: "", sub: "" }) },
    stats: { render: renderStatList, blank: () => ({ id: uid("stat"), label: "", labelEn: "", value: 5 }) },
    relations: { render: renderRelationList, blank: () => ({ id: uid("rel"), name: "", desc: "" }) }
  };
  const ADD_BUTTON_MAP = {
    "add-info-row": "infoRows",
    "add-palette": "palette",
    "add-detail": "details",
    "add-stat": "stats",
    "add-relation": "relations"
  };

  function addListItem(name) {
    const list = state.common[name];
    if (list.length >= LIMITS[name]) return showToast(`最多 ${LIMITS[name]} 项`);
    pushHistory();
    list.push(LIST_DEFS[name].blank());
    LIST_DEFS[name].render();
    renderCanvas();
    scheduleSave();
  }

  function editListField(control) {
    const name = control.dataset.list;
    const list = state.common[name];
    if (!list) return false;
    const item = list.find(entry => entry.id === control.dataset.id);
    if (!item) return false;
    const key = control.dataset.key;
    if (name === "stats" && key === "value") {
      item.value = clamp(control.value, 0, 10);
      const row = control.closest(".dynamic-row");
      $$('[data-key="value"]', row).forEach(other => { if (other !== control) other.value = item.value; });
      const output = $("output", row);
      if (output) output.textContent = item.value;
    } else if (name === "palette" && key === "hex") {
      if (!validHex(control.value)) return true;
      item.hex = control.value;
    } else {
      item[key] = control.value;
    }
    renderCanvas();
    scheduleSave();
    return true;
  }

  function handleListAction(button) {
    const name = button.dataset.list;
    const list = state.common[name];
    if (!list) return;
    const index = list.findIndex(entry => entry.id === button.dataset.id);
    if (index < 0) return;
    pushHistory();
    const action = button.dataset.listAction;
    if (action === "delete") list.splice(index, 1);
    if (action === "up" && index > 0) [list[index], list[index - 1]] = [list[index - 1], list[index]];
    if (action === "down" && index < list.length - 1) [list[index], list[index + 1]] = [list[index + 1], list[index]];
    LIST_DEFS[name].render();
    renderCanvas();
    scheduleSave();
  }

  function editTemplateField(control) {
    const key = control.dataset.tfield;
    const schema = TEMPLATE_SCHEMAS[state.template].find(field => field.key === key);
    if (!schema) return;
    const data = activeTemplateData();
    if (schema.type === "checkbox") data[key] = control.checked;
    else if (schema.type === "number") data[key] = clamp(control.value, schema.min ?? 0, schema.max ?? 99);
    else if (schema.type === "select") data[key] = number(control.value, data[key]);
    else data[key] = control.value;
    renderCanvas();
    scheduleSave();
  }

  function copySwatch(button) {
    const hex = button.getAttribute("data-hex");
    if (!hex) return;
    const message = `色值 ${hex.toUpperCase()} 已复制到剪贴板`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(hex).then(() => showToast(message)).catch(() => showToast(`色值: ${hex.toUpperCase()}`));
    } else {
      showToast(`色值: ${hex.toUpperCase()}`);
    }
  }

  function setupEvents() {
    document.addEventListener("pointerdown", event => {
      const fileButton = event.target.closest(".file-button");
      if (fileButton) pendingFileReturnState = captureWorkspaceView(fileButton);
    });

    document.addEventListener("focusin", event => {
      if (event.target.matches("input,textarea,select") && !inputCheckpoint) inputCheckpoint = clone(state);
    });
    document.addEventListener("focusout", event => {
      if (!event.target.matches("input,textarea,select") || !inputCheckpoint) return;
      if (JSON.stringify(inputCheckpoint) !== JSON.stringify(state)) pushHistory(inputCheckpoint);
      inputCheckpoint = null;
    });

    document.addEventListener("input", event => {
      const pathControl = event.target.closest("[data-path]");
      if (pathControl) {
        const current = getPath(state, pathControl.dataset.path);
        const value = pathControl.type === "number" || pathControl.type === "range" ? number(pathControl.value, current) : pathControl.value;
        setPath(state, pathControl.dataset.path, value);
        renderCanvas();
        scheduleSave();
        return;
      }
      const templateField = event.target.closest("[data-tfield]");
      if (templateField) { editTemplateField(templateField); return; }
      const stickerField = event.target.closest("[data-sticker-field]");
      if (stickerField) { changeStickerField(stickerField); return; }
      const color = event.target.closest("[data-template-color]");
      if (color && validHex(color.value)) {
        activeColors()[color.dataset.templateColor] = color.value;
        renderCanvas();
        scheduleSave();
        return;
      }
      const listControl = event.target.closest("[data-list][data-key]");
      if (listControl) editListField(listControl);
    });

    document.addEventListener("change", event => {
      const pathControl = event.target.closest("[data-path]");
      if (pathControl) {
        const current = getPath(state, pathControl.dataset.path);
        const value = pathControl.type === "number" || pathControl.type === "range" || (pathControl.tagName === "SELECT" && pathControl.dataset.path === "exportScale") ? number(pathControl.value, current) : pathControl.value;
        setPath(state, pathControl.dataset.path, value);
        renderCanvas();
        scheduleSave();
      }
      const templateField = event.target.closest("[data-tfield]");
      if (templateField) editTemplateField(templateField);
      const stickerField = event.target.closest("[data-sticker-field]");
      if (stickerField) changeStickerField(stickerField);
      const color = event.target.closest("[data-template-color]");
      if (color && validHex(color.value)) {
        activeColors()[color.dataset.templateColor] = color.value;
        renderCanvas();
        scheduleSave();
      }
      const listControl = event.target.closest("[data-list][data-key]");
      if (listControl) editListField(listControl);
      const detailInput = event.target.closest("[data-detail-image]");
      if (detailInput) {
        const returnState = pendingFileReturnState || captureWorkspaceView(detailInput.closest(".file-button"));
        pendingFileReturnState = null;
        detailInput.blur();
        restoreWorkspaceView(returnState);
        if (detailInput.files[0]) openDetailCropForFile(detailInput.dataset.detailImage, detailInput.files[0], returnState);
        detailInput.value = "";
      }
    });

    document.addEventListener("click", event => {
      const template = event.target.closest("[data-template]");
      if (template?.dataset.template && TEMPLATE_INFO[template.dataset.template] && template.closest("#theme-grid")) {
        pushHistory();
        state.template = template.dataset.template;
        renderAll();
        scheduleSave();
        return;
      }
      const mode = event.target.closest("[data-canvas-mode]");
      if (mode) { pushHistory(); state.canvasMode = mode.dataset.canvasMode; renderAll(); scheduleSave(); return; }
      const mobilePanel = event.target.closest("[data-mobile-panel]");
      if (mobilePanel?.tagName === "BUTTON") { document.body.dataset.mobilePanel = mobilePanel.dataset.mobilePanel; syncMobileTabs(); requestAnimationFrame(fitCanvas); return; }
      const swatch = event.target.closest(".swatch[data-hex]");
      if (swatch && canvas.contains(swatch)) { copySwatch(swatch); return; }
      const listAction = event.target.closest("[data-list-action]");
      if (listAction) { handleListAction(listAction); return; }
      const addButton = event.target.closest("#add-info-row, #add-palette, #add-detail, #add-stat, #add-relation");
      if (addButton) { addListItem(ADD_BUTTON_MAP[addButton.id]); return; }
      const detailRemove = event.target.closest("[data-detail-remove]");
      if (detailRemove) {
        const item = state.common.details.find(entry => entry.id === detailRemove.dataset.detailRemove);
        if (item) { pushHistory(); item.image = ""; renderDetailList(); renderCanvas(); scheduleSave(); }
        return;
      }
      const detailRecrop = event.target.closest("[data-detail-recrop]");
      if (detailRecrop) {
        openDetailCropForExisting(detailRecrop.dataset.detailRecrop, captureWorkspaceView(detailRecrop));
        return;
      }
      const preset = event.target.closest("[data-sticker-preset]");
      if (preset) { createSticker(clone(STICKER_PRESETS[preset.dataset.stickerPreset] || STICKER_PRESETS.memo)); return; }
      const select = event.target.closest("[data-select-sticker]");
      if (select) { selectSticker(select.dataset.selectSticker); return; }
      const stickerButton = event.target.closest("[data-sticker-action]");
      if (stickerButton) { stickerAction(stickerButton.dataset.stickerAction, stickerButton.dataset.id); return; }
      const alignButton = event.target.closest("[data-sticker-align]");
      if (alignButton) {
        const item = selectedSticker();
        if (item) { pushHistory(); item.align = alignButton.dataset.stickerAlign; renderStickerEditor(); renderCanvas(); scheduleSave(); }
        return;
      }
      const exportButton = event.target.closest("[data-export-target]");
      if (exportButton) { exportImage(exportButton.dataset.exportTarget); return; }
      if (event.target.closest("#add-text-sticker")) { addTextSticker(); return; }
      if (event.target.closest("#reset-colors")) { pushHistory(); state.templateColors[state.template] = clone(DEFAULT_COLORS[state.template]); syncStaticInputs(); renderCanvas(); scheduleSave(); return; }
      const recropButton = event.target.closest("#recrop-portrait");
      if (recropButton) { openCropForExisting(captureWorkspaceView(recropButton)); return; }
      if (event.target.closest("#remove-portrait")) {
        pushHistory();
        state.common.portraitImage = "";
        TEMPLATE_IDS.forEach(id => { state.crops[id] = { image: "", zoom: 1, x: 0, y: 0 }; });
        renderPortraitPreview();
        renderCanvas();
        scheduleSave();
        return;
      }
      if (event.target.closest("#undo")) { undo(); return; }
      if (event.target.closest("#redo")) { redo(); return; }
      if (event.target.closest("#new-project")) { newProject(); return; }
      if (event.target.closest("#save-json")) { saveJson(); return; }
      if (event.target.closest("#export-full-top")) { exportImage("full"); return; }
      if (event.target.closest("#fit-canvas")) { previewZoom = 1; fitCanvas(); return; }
      if (event.target.closest("#start-tour")) { startTour(); return; }
      if (event.target.closest("[data-close-tour]")) { closeTour(); return; }
      if (event.target.closest("#tour-prev")) { tourIndex = Math.max(0, tourIndex - 1); positionTour(); return; }
      if (event.target.closest("#tour-next")) { if (tourIndex >= TOUR_STEPS.length - 1) closeTour(); else { tourIndex += 1; positionTour(); } return; }
      if (event.target.closest("[data-crop-close]")) { closeCrop(); return; }
      if (event.target.closest("#apply-crop")) { applyCrop(); }
    });

    $("#portrait-input").addEventListener("change", event => {
      const returnState = pendingFileReturnState || captureWorkspaceView(event.target.closest(".file-button"));
      const file = event.target.files[0];
      pendingFileReturnState = null;
      event.target.value = "";
      event.target.blur();
      restoreWorkspaceView(returnState);
      if (file) openCropForFile(file, returnState);
    });
    $("#sticker-image-input").addEventListener("change", event => {
      const returnState = pendingFileReturnState || captureWorkspaceView(event.target.closest(".file-button"));
      const file = event.target.files[0];
      pendingFileReturnState = null;
      event.target.value = "";
      event.target.blur();
      restoreWorkspaceView(returnState);
      if (file) addImageSticker(file);
    });
    $("#import-json").addEventListener("change", event => {
      const returnState = pendingFileReturnState || captureWorkspaceView(event.target.closest(".file-button"));
      const file = event.target.files[0];
      pendingFileReturnState = null;
      event.target.value = "";
      event.target.blur();
      restoreWorkspaceView(returnState);
      if (file) importJson(file);
    });

    canvas.addEventListener("pointerdown", event => {
      const sticker = event.target.closest(".canvas-sticker");
      if (!sticker) {
        if (state.selectedStickerId) {
          state.selectedStickerId = "";
          renderStickerList();
          renderStickerEditor();
          $$(".canvas-sticker", canvas).forEach(node => node.classList.remove("is-selected"));
        }
        return;
      }
      const handle = event.target.closest("[data-sticker-handle]");
      beginStickerTransform(event, handle?.dataset.stickerHandle || "drag", sticker.dataset.stickerId);
    });
    window.addEventListener("pointermove", moveStickerTransform, { passive: false });
    window.addEventListener("pointerup", endStickerTransform);
    window.addEventListener("pointercancel", endStickerTransform);

    const cropSurface = $("#crop-canvas");
    cropSurface.addEventListener("pointerdown", event => {
      if (!cropSession) return;
      cropDrag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x: cropSession.x, y: cropSession.y };
      try { cropSurface.setPointerCapture(event.pointerId); } catch { }
    });
    cropSurface.addEventListener("pointermove", event => {
      if (!cropDrag || cropDrag.pointerId !== event.pointerId || !cropSession) return;
      event.preventDefault();
      const scaleX = cropSurface.width / cropSurface.clientWidth;
      const scaleY = cropSurface.height / cropSurface.clientHeight;
      cropSession.x = cropDrag.x + (event.clientX - cropDrag.startX) * scaleX;
      cropSession.y = cropDrag.y + (event.clientY - cropDrag.startY) * scaleY;
      drawCrop();
    });
    const endCropDrag = event => { if (cropDrag?.pointerId === event.pointerId) cropDrag = null; };
    cropSurface.addEventListener("pointerup", endCropDrag);
    cropSurface.addEventListener("pointercancel", endCropDrag);
    $("#crop-zoom").addEventListener("input", event => { if (cropSession) { cropSession.zoom = number(event.target.value, 1); drawCrop(); } });

    $("#sticker-list").addEventListener("dragstart", event => {
      const row = event.target.closest("[data-sticker-row]");
      if (!row) return;
      draggedStickerId = row.dataset.stickerRow;
      row.classList.add("is-dragging");
      event.dataTransfer.effectAllowed = "move";
    });
    $("#sticker-list").addEventListener("dragover", event => event.preventDefault());
    $("#sticker-list").addEventListener("drop", event => {
      event.preventDefault();
      const targetRow = event.target.closest("[data-sticker-row]");
      if (!draggedStickerId || !targetRow || draggedStickerId === targetRow.dataset.stickerRow) return;
      pushHistory();
      const from = state.stickers.findIndex(item => item.id === draggedStickerId);
      const to = state.stickers.findIndex(item => item.id === targetRow.dataset.stickerRow);
      const [item] = state.stickers.splice(from, 1);
      state.stickers.splice(to, 0, item);
      renderStickerList();
      renderCanvas();
      scheduleSave();
    });
    $("#sticker-list").addEventListener("dragend", () => { draggedStickerId = ""; renderStickerList(); });

    window.addEventListener("resize", () => { fitCanvas(); if (!$("#tour-overlay").hidden) positionTour(); });
    window.visualViewport?.addEventListener("resize", fitCanvas);
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        if (!$("#crop-modal").hidden) closeCrop();
        else if (!$("#tour-overlay").hidden) closeTour();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        if (event.target.matches("input,textarea")) return;
        event.preventDefault();
        event.shiftKey ? redo() : undo();
      }
    });
  }

  async function init() {
    setupEvents();
    setupMobileResizer();
    await preloadImages();
    renderAll();
    syncMobileTabs();
  }

  init();
})();
