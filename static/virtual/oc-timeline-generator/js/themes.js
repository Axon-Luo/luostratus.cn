export const THEME_PRESETS = {
  minimal: {
    label: "极简现代",
    description: "留白与克制线条",
    primaryColor: "#294940",
    secondaryColor: "#9a7658",
    backgroundColor: "#fbfaf7",
    textColor: "#343733",
    titleColor: "#16251f",
    borderColor: "#b8b6ae",
    titleFont: "serif",
    bodyFont: "serif",
    borderRadius: 0,
    showTexture: false,
    showBorder: true
  },
  parchment: {
    label: "古典羊皮纸",
    description: "温暖的史书质感",
    primaryColor: "#7a4a2b",
    secondaryColor: "#b28c58",
    backgroundColor: "#eee2c5",
    textColor: "#4b3827",
    titleColor: "#3a2819",
    borderColor: "#8f7451",
    titleFont: "serif",
    bodyFont: "serif",
    borderRadius: 0,
    showTexture: true,
    showBorder: true
  },
  archive: {
    label: "机密档案",
    description: "编号、印章与虚线",
    primaryColor: "#a42f2a",
    secondaryColor: "#5f6565",
    backgroundColor: "#e9e8e2",
    textColor: "#282b2b",
    titleColor: "#151717",
    borderColor: "#555b5b",
    titleFont: "sans-serif",
    bodyFont: "sans-serif",
    borderRadius: 0,
    showTexture: true,
    showBorder: true
  },
  scifi: {
    label: "科幻终端",
    description: "深色数据界面",
    primaryColor: "#43e0bd",
    secondaryColor: "#4a8fa4",
    backgroundColor: "#101a1f",
    textColor: "#c7ded9",
    titleColor: "#edfffb",
    borderColor: "#37665d",
    titleFont: "monospace",
    bodyFont: "monospace",
    borderRadius: 2,
    showTexture: false,
    showBorder: true
  },
  ink: {
    label: "东方水墨",
    description: "宣纸、朱砂与墨色",
    primaryColor: "#8b3028",
    secondaryColor: "#77736b",
    backgroundColor: "#f2efe7",
    textColor: "#3e3c37",
    titleColor: "#1d1c19",
    borderColor: "#aaa398",
    titleFont: "serif",
    bodyFont: "serif",
    borderRadius: 0,
    showTexture: true,
    showBorder: true
  },
  gothic: {
    label: "暗夜哥特",
    description: "深酒红与古堡夜色",
    primaryColor: "#b33e5c",
    secondaryColor: "#8a7895",
    backgroundColor: "#181419",
    textColor: "#d8cdd7",
    titleColor: "#f3e8f0",
    borderColor: "#604b5d",
    titleFont: "serif",
    bodyFont: "serif",
    borderRadius: 2,
    showTexture: true,
    showBorder: true
  },
  forest: {
    label: "森境手札",
    description: "苔绿与植物标本感",
    primaryColor: "#3e6d50",
    secondaryColor: "#aa7548",
    backgroundColor: "#edf1e8",
    textColor: "#39443c",
    titleColor: "#193826",
    borderColor: "#93a493",
    titleFont: "serif",
    bodyFont: "serif",
    borderRadius: 10,
    showTexture: true,
    showBorder: true
  },
  celestial: {
    label: "星辉幻想",
    description: "靛蓝、星紫与微光",
    primaryColor: "#9d8cff",
    secondaryColor: "#5ec6c8",
    backgroundColor: "#17182b",
    textColor: "#d7d8ef",
    titleColor: "#f3efff",
    borderColor: "#4e527c",
    titleFont: "serif",
    bodyFont: "serif",
    borderRadius: 12,
    showTexture: false,
    showBorder: true
  }
};

export const TITLE_FONTS = {
  serif: {
    label: "思源宋体",
    stack: 'Georgia, "Times New Roman", "Source Han Serif SC", serif',
    weight: 700
  },
  "sans-serif": {
    label: "思源黑体",
    stack: 'Inter, Arial, "Source Han Sans SC", sans-serif',
    weight: 700
  },
  vintage: {
    label: "朝华复古",
    stack: '"IM Fell English", "ZhaohuaMinA", "Source Han Serif SC", serif',
    weight: 700
  },
  monospace: {
    label: "终端等宽",
    stack: '"Cascadia Mono", "SFMono-Regular", Consolas, "Source Han Sans SC", monospace',
    weight: 700
  }
};

export const BODY_FONTS = {
  serif: {
    label: "思源宋体",
    stack: 'Georgia, "Times New Roman", "Source Han Serif SC", serif',
    weight: 400
  },
  "sans-serif": {
    label: "思源黑体",
    stack: 'Inter, Arial, "Source Han Sans SC", sans-serif',
    weight: 400
  },
  vintage: {
    label: "朝华复古",
    stack: '"IM Fell English", "ZhaohuaTypeWriter Light", "Source Han Serif SC", serif',
    weight: 300
  },
  monospace: {
    label: "终端等宽",
    stack: '"Cascadia Mono", "SFMono-Regular", Consolas, "Source Han Sans SC", monospace',
    weight: 400
  }
};

export function applyTheme(project) {
  const canvas = document.querySelector("#timeline-canvas");
  if (!canvas) return;

  const { theme, canvas: canvasSettings } = project;
  canvas.dataset.theme = theme.preset;
  canvas.style.setProperty("--primary-color", theme.primaryColor);
  canvas.style.setProperty("--secondary-color", theme.secondaryColor);
  canvas.style.setProperty("--canvas-background", theme.backgroundColor);
  canvas.style.setProperty("--text-color", theme.textColor);
  canvas.style.setProperty("--title-color", theme.titleColor);
  canvas.style.setProperty("--border-color", theme.borderColor);
  const titleFont = TITLE_FONTS[theme.titleFont] || TITLE_FONTS.serif;
  const bodyFont = BODY_FONTS[theme.bodyFont] || BODY_FONTS.serif;
  canvas.style.setProperty("--title-font", titleFont.stack);
  canvas.style.setProperty("--body-font", bodyFont.stack);
  canvas.style.setProperty("--title-font-weight", titleFont.weight);
  canvas.style.setProperty("--body-font-weight", bodyFont.weight);
  canvas.style.setProperty("--base-font-size", `${theme.baseFontSize}px`);
  canvas.style.setProperty("--canvas-radius", `${theme.borderRadius}px`);
  canvas.style.setProperty("--canvas-padding", `${canvasSettings.padding}px`);
  canvas.style.width = `${canvasSettings.width}px`;
  canvas.classList.toggle("show-texture", theme.showTexture);
  canvas.classList.toggle("canvas-border-off", !theme.showBorder);
}


