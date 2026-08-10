const TUTORIAL_SEEN_KEY = "oc-timeline-tutorial-seen-v3";

const steps = [
  {
    target: "#main-tabs",
    kicker: "STEP 1 · OVERVIEW",
    title: "一张完整图片由三个部分组成",
    description: "编辑器最终生成的是一张纵向长图，按照“头图 → 时间轴 → 尾图”的顺序从上到下组合。三部分共享同一套主题与画布宽度。",
    points: [
      "头图：介绍作品标题、内容类型、时间范围、人物或事件背景。",
      "时间轴：承载按日期排列的事件节点，是长图的主要内容区域。",
      "尾图：用于引用、总结、作者水印、版权信息或后续章节提示。",
      "头图和尾图可以单独关闭；完整长图及三个分区都可以分别导出PNG。"
    ],
    prepare: () => {
      setMobilePanel("content");
      setMainTab("header");
    }
  },
  {
    target: '[data-tour="content-type"]',
    kicker: "STEP 2 · START",
    title: "选择作品的内容类型",
    description: "世界观、人物和事件拥有不同的头图字段。切换类型会载入一套可编辑的默认示例，方便你从完整内容开始理解编辑器。",
    points: [
      "世界观适合编年史、组织史和架空历史。",
      "人物适合角色生平，并可在头图展示1—4人及人物关系。",
      "事件适合战争、案件、企划或某一重大事件专题。"
    ],
    prepare: () => {
      setMobilePanel("content");
      setMainTab("header");
    }
  },
  {
    target: '[data-tour="header-layout"]',
    kicker: "STEP 3 · HEADER",
    title: "设置头图版式与图片",
    description: "头图负责交代作品名称、时间范围和核心信息。先选版式，再向下填写文字和上传人物头像、主视觉或背景图。",
    points: [
      "居中标题适合世界观总览与人物档案。",
      "左图右文适合突出人物或事件主视觉。",
      "档案封面适合组织记录、案件和历史事件。",
      "背景蒙版可开关并选择黑色或白色；上传图片后可缩放、移动和裁切。"
    ],
    prepare: () => {
      setMobilePanel("content");
      setMainTab("header");
    }
  },
  {
    target: ".theme-presets",
    kicker: "STEP 4 · THEME",
    title: "选择整体视觉主题",
    description: "主题统一控制配色、字体、纸张质感和边框。切换主题只改变外观，不会覆盖已经填写的内容。",
    points: [
      "可继续单独修改主题色、背景色、字体、字号、圆角和画布宽度。",
      "主题与头图、时间轴、事件卡片、尾图模板可以自由组合。"
    ],
    prepare: () => setMobilePanel("style")
  },
  {
    target: '[data-tour="timeline-layout"]',
    kicker: "STEP 5 · TIMELINE",
    title: "选择时间轴与事件卡片模板",
    description: "时间轴结构决定节点在画布上的排列方式，事件卡片模板决定每个节点内部的信息密度与视觉语言。",
    points: [
      "左侧日期：阅读顺序清晰，适合人物生平。",
      "左右交错：节奏感强，适合较长编年史。",
      "档案列表：强调编号与记录感。",
      "棋盘格：日期大字与事件卡片交替排列。",
      "标准、极简、档案三种卡片可与任意时间轴结构搭配。"
    ],
    prepare: () => {
      setMobilePanel("content");
      setMainTab("timeline");
    }
  },
  {
    target: '[data-tour="timeline-actions"]',
    kicker: "STEP 6 · NODES",
    title: "新增、排序和组织年份",
    description: "点击“新增节点”创建事件卡片。一个节点既可以代表单一事件，也可以把同一年发生的多件事合并在详细正文中。",
    points: [
      "按日期排序会提取年份数值；元年按0年处理。",
      "可以拖动排序，也可以在卡片底部使用上移、下移和复制。"
    ],
    prepare: () => {
      setMobilePanel("content");
      setMainTab("timeline");
    }
  },
  {
    target: '[data-tour="event-card"]',
    fallbackTarget: '[data-tour="timeline-actions"]',
    kicker: "STEP 7 · EVENT CARD",
    title: "填写一张完整的事件卡片",
    description: "事件卡片是时间轴的核心内容。日期和标题用于快速扫描，简介与正文负责讲清事件，其他字段帮助建立人物和世界关系。",
    points: [
      "日期支持年份、纪元文字和跨年范围；年龄为可选项。",
      "简介适合一句话概括，详细正文适合多条记录或完整叙述。",
      "地点、参与人物和标签用于补充检索线索。",
      "重要程度会改变节点强调效果。",
      "可上传节点图片并填写图片说明；棋盘格使用1:1图片，其他结构使用16:9。",
      "卡片右上角可隐藏或折叠，底部可复制、移动和删除。"
    ],
    prepare: () => {
      setMobilePanel("content");
      setMainTab("timeline");
    }
  },
  {
    target: '[data-tour="footer-settings"]',
    kicker: "STEP 8 · FOOTER",
    title: "用尾图结束整条时间轴",
    description: "尾图适合放结语、资料来源、作者信息或后续章节提示，也可以关闭。内容类型与视觉模板可以独立选择。",
    points: [
      "引用：展示一句核心台词、人物、出处和时间。",
      "总结：展示结语，并自动统计可见节点与首尾日期。",
      "水印：展示作者、项目名、社交账号、版权和版本信息。",
      "居中引用、档案结束页和简洁版权页是三种视觉模板。"
    ],
    prepare: () => {
      setMobilePanel("content");
      setMainTab("footer");
    }
  },
  {
    target: ".preview-workspace",
    kicker: "STEP 9 · PREVIEW",
    title: "在同一页面检查实时画布",
    description: "所有修改都会立即出现在预览中。你可以检查信息层级、图片裁切、节点顺序和整体长度。",
    points: [
      "桌面端内容、预览与样式同时显示。",
      "手机端可拖动中间分隔条调整预览高度，并在内容与样式之间切换。"
    ],
    prepare: () => {}
  },
  {
    target: "#export-all",
    kicker: "STEP 10 · EXPORT",
    title: "保存、备份并导出作品",
    description: "编辑器会自动保存在当前浏览器。完成后可以导出完整PNG，也可以分别导出头图、时间轴和尾图；手机端的三个分区按钮位于预览栏顶部。",
    points: [
      "导出JSON可备份全部文字、设置和本地图片，之后可再次导入编辑。",
      "一键清空会保留主题与画布设置；执行前会要求确认。"
    ],
    prepare: () => {}
  }
];

let currentStep = 0;
let layer = null;
let spotlight = null;
let popover = null;
let activeTarget = null;

function tutorialSeen() {
  try {
    return localStorage.getItem(TUTORIAL_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markTutorialSeen() {
  try {
    localStorage.setItem(TUTORIAL_SEEN_KEY, "1");
  } catch {
    // The tutorial still works when browser storage is unavailable.
  }
}

function setMainTab(tab) {
  const button = document.querySelector(`#main-tabs [data-tab="${tab}"]`);
  if (button && !button.classList.contains("is-active")) button.click();
}

function setMobilePanel(panel) {
  if (!window.matchMedia("(max-width: 767px)").matches) return;
  const button = document.querySelector(`#mobile-editor-tabs [data-mobile-panel="${panel}"]`);
  if (button && document.querySelector("#app")?.dataset.mobilePanel !== panel) button.click();
}

function createButton(text, className, action) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = text;
  button.addEventListener("click", action);
  return button;
}

function buildLayer() {
  layer = document.createElement("div");
  layer.className = "tutorial-layer";
  layer.setAttribute("aria-hidden", "false");

  const guard = document.createElement("div");
  guard.className = "tutorial-click-guard";

  spotlight = document.createElement("div");
  spotlight.className = "tutorial-spotlight";

  popover = document.createElement("section");
  popover.className = "tutorial-popover";
  popover.setAttribute("role", "dialog");
  popover.setAttribute("aria-modal", "true");
  popover.setAttribute("aria-labelledby", "tutorial-title");
  popover.setAttribute("aria-describedby", "tutorial-description");

  layer.append(guard, spotlight, popover);
  document.body.append(layer);
  window.addEventListener("resize", positionCurrentStep);
  document.addEventListener("keydown", handleTutorialKeys);
}

function renderPopover(step) {
  popover.replaceChildren();

  const header = document.createElement("div");
  header.className = "tutorial-popover-header";
  const kicker = document.createElement("span");
  kicker.className = "tutorial-kicker";
  kicker.textContent = step.kicker;
  const counter = document.createElement("span");
  counter.className = "tutorial-counter";
  counter.textContent = `${currentStep + 1} / ${steps.length}`;
  header.append(kicker, counter);

  const title = document.createElement("h2");
  title.id = "tutorial-title";
  title.textContent = step.title;

  const description = document.createElement("p");
  description.id = "tutorial-description";
  description.textContent = step.description;

  const pointList = document.createElement("ul");
  pointList.className = "tutorial-points";
  (step.points || []).forEach((point) => {
    const item = document.createElement("li");
    item.textContent = point;
    pointList.append(item);
  });

  const progress = document.createElement("div");
  progress.className = "tutorial-progress";
  progress.setAttribute("aria-hidden", "true");
  progress.style.setProperty("--tutorial-steps", String(steps.length));
  steps.forEach((_, index) => {
    const dot = document.createElement("span");
    if (index <= currentStep) dot.classList.add("is-active");
    progress.append(dot);
  });

  const actions = document.createElement("div");
  actions.className = "tutorial-actions";
  actions.append(createButton("跳过", "button button-ghost button-small", finishTutorial));
  const navigation = document.createElement("div");
  navigation.className = "tutorial-navigation";
  if (currentStep > 0) {
    navigation.append(createButton("上一步", "button button-ghost button-small", () => showStep(currentStep - 1)));
  }
  navigation.append(createButton(
    currentStep === steps.length - 1 ? "完成" : "下一步",
    "button button-primary button-small tutorial-next",
    () => currentStep === steps.length - 1 ? finishTutorial() : showStep(currentStep + 1)
  ));
  actions.append(navigation);

  popover.append(header, title, description);
  if (pointList.childElementCount) popover.append(pointList);
  popover.append(progress, actions);
}

function positionCurrentStep() {
  if (!layer || !activeTarget) return;
  const rect = activeTarget.getBoundingClientRect();
  const padding = 7;
  const top = Math.max(6, rect.top - padding);
  const left = Math.max(6, rect.left - padding);
  const width = Math.max(28, Math.min(window.innerWidth - left - 6, rect.width + padding * 2));
  const height = Math.max(28, Math.min(window.innerHeight - top - 6, rect.height + padding * 2));

  Object.assign(spotlight.style, {
    top: `${top}px`,
    left: `${left}px`,
    width: `${width}px`,
    height: `${height}px`
  });

  if (window.matchMedia("(max-width: 767px)").matches) {
    popover.style.removeProperty("top");
    popover.style.removeProperty("left");
    return;
  }

  const popoverRect = popover.getBoundingClientRect();
  const gap = 16;
  let popoverLeft = rect.right + gap;
  if (popoverLeft + popoverRect.width > window.innerWidth - 16) {
    popoverLeft = rect.left - popoverRect.width - gap;
  }
  if (popoverLeft < 16) {
    popoverLeft = Math.min(
      window.innerWidth - popoverRect.width - 16,
      Math.max(16, rect.left + rect.width / 2 - popoverRect.width / 2)
    );
  }
  const popoverTop = Math.min(
    window.innerHeight - popoverRect.height - 16,
    Math.max(16, rect.top)
  );
  popover.style.left = `${popoverLeft}px`;
  popover.style.top = `${popoverTop}px`;
}

function showStep(index) {
  currentStep = Math.max(0, Math.min(index, steps.length - 1));
  const step = steps[currentStep];
  step.prepare();
  renderPopover(step);

  window.requestAnimationFrame(() => {
    activeTarget = document.querySelector(step.target) || (step.fallbackTarget ? document.querySelector(step.fallbackTarget) : null);
    if (!activeTarget) {
      if (currentStep < steps.length - 1) showStep(currentStep + 1);
      else finishTutorial();
      return;
    }
    const rect = activeTarget.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth) {
      activeTarget.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }
    window.requestAnimationFrame(() => {
      positionCurrentStep();
      popover.querySelector(".tutorial-next")?.focus();
    });
  });
}

function handleTutorialKeys(event) {
  if (!layer) return;
  if (event.key === "Escape") {
    event.preventDefault();
    finishTutorial();
    return;
  }
  if (event.key === "ArrowRight") {
    event.preventDefault();
    if (currentStep < steps.length - 1) showStep(currentStep + 1);
    else finishTutorial();
    return;
  }
  if (event.key === "ArrowLeft" && currentStep > 0) {
    event.preventDefault();
    showStep(currentStep - 1);
    return;
  }
  if (event.key !== "Tab") return;
  const focusable = [...popover.querySelectorAll("button")];
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function startTutorial() {

  if (!layer) buildLayer();
  showStep(0);
}

function finishTutorial() {
  markTutorialSeen();
  layer?.remove();
  layer = null;
  spotlight = null;
  popover = null;
  activeTarget = null;
  window.removeEventListener("resize", positionCurrentStep);
  document.removeEventListener("keydown", handleTutorialKeys);
}


export function initTutorial() {
  document.querySelector("#open-tutorial")?.addEventListener("click", startTutorial);
  if (!tutorialSeen()) startTutorial();
}









