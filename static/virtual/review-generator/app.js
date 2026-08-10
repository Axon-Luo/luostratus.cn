(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const canvas = $("#review-canvas");
  const stage = $("#preview-stage");
  const viewport = $("#preview-viewport");
  const STORAGE_KEY = "oc-review-generator-v1";
  const MOBILE_SPLIT_KEY = "oc-review-mobile-preview-ratio";
  const TUTORIAL_KEY = "oc-review-generator-tutorial-v1";
  const IMAGE_DATABASE_NAME = "oc-review-generator-assets-v1";
  const imageStore = window.OCImageStore.create({ databaseName: IMAGE_DATABASE_NAME });
  const imageSource = (value = "") => imageStore.resolve(value);

  const THEMES = {
    city: {
      name: "城市食评",
      english: "CORAL CITY",
      colors: { accent: "#e65343", background: "#f5f0e9", surface: "#fffdf9", ink: "#27313e", muted: "#757b84", rating: "#f2a93b" }
    },
    corporate: {
      name: "蓝白消费",
      english: "CLEAR COMMERCE",
      colors: { accent: "#2878c7", background: "#eef4fa", surface: "#ffffff", ink: "#22364d", muted: "#738396", rating: "#ff9f2f" }
    },
    editorial: {
      name: "编辑部",
      english: "REVIEW JOURNAL",
      colors: { accent: "#b43b31", background: "#eee9df", surface: "#fffef9", ink: "#211f1b", muted: "#777168", rating: "#b88932" }
    },
    retro: {
      name: "复古论坛",
      english: "WEB DIRECTORY",
      colors: { accent: "#a64b38", background: "#ded6c4", surface: "#fff9e8", ink: "#2e2923", muted: "#766d61", rating: "#d19a36" }
    },
    pixel: {
      name: "像素点评",
      english: "PIXEL SCORE",
      colors: { accent: "#147a8c", background: "#dbe9ea", surface: "#f8ffff", ink: "#20353f", muted: "#6e7d82", rating: "#f2a23a" }
    }
  };

  const LEGACY_THEME_COLORS = {
    retro: { accent: "#8c2d65", background: "#ddd7c7", surface: "#fffbed", ink: "#26241f", muted: "#6d695f", rating: "#c47719" },
    pixel: { accent: "#7652c9", background: "#ddd9ef", surface: "#fdfaff", ink: "#292343", muted: "#716b83", rating: "#e7863b" }
  };

  const TYPE_META = {
    restaurant: { kicker: "CITY DINING", price: "人均", address: "地址", hours: "营业" },
    dish: { kicker: "DISH REVIEW", price: "价格", address: "所属", hours: "供应" },
    product: { kicker: "PRODUCT FILE", price: "价格", address: "来源", hours: "状态" },
    service: { kicker: "SERVICE NOTE", price: "费用", address: "地点", hours: "时段" },
    custom: { kicker: "REVIEW ARCHIVE", price: "价格", address: "信息", hours: "状态" }
  };

  const uid = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));

  function createDefaultState() {
    const firstId = uid("review");
    const secondId = uid("review");
    const thirdId = uid("review");
    return {
      version: 2,
      projectName: "海风食堂点评档案",
      item: {
        platformName: "OC 点评",
        type: "restaurant",
        category: "海边料理 · 家常菜",
        name: "海风食堂",
        subtitle: "旧港口旁的小餐馆，主打当日渔获与季节菜单。",
        price: "¥86",
        meta: "本月收藏 1,284",
        address: "南港区灯塔路 17 号",
        hours: "11:30—21:30",
        tags: "海景座位、当日渔获、适合约会、需要预约",
        cover: "",
        coverPosition: 50,
        score: 4.7,
        reviewCount: "327 条点评",
        metrics: [
          { label: "口味", value: "4.8" },
          { label: "环境", value: "4.6" },
          { label: "服务", value: "4.5" }
        ],
        distribution: [72, 19, 6, 2, 1]
      },
      reviews: [
        {
          id: firstId,
          name: "周桐",
          badge: "资深食客 · Lv.7",
          avatar: "",
          rating: 5,
          date: "2026.07.21",
          context: "晚餐 · 双人用餐",
          title: "海风和炭火味道都留在了这顿晚餐里",
          body: "傍晚坐在靠窗的位置，能看见渔船慢慢回港。炭烤鲭鱼外皮很脆，鱼肉仍然湿润；柚子盐让油脂显得更轻。服务节奏不快，但每道菜之间衔接得很舒服。",
          tags: "炭烤鲭鱼、靠窗座位",
          photo: "",
          likes: "赞 128",
          comments: "回复 14",
          merchantReply: "谢谢你记录下傍晚的海风。鲭鱼来自当天清晨的第一批渔获，期待下次见。",
          followup: ""
        },
        {
          id: secondId,
          name: "林真",
          badge: "城市漫游者 · Lv.4",
          avatar: "",
          rating: 4,
          date: "2026.07.18",
          context: "午餐 · 单人用餐",
          title: "午间套餐很安静，甜点意外地出色",
          body: "工作日中午人不算多。海盐布丁的焦糖略苦，正好压住甜味。主菜分量对我来说稍小，但套餐的完整度不错。",
          tags: "海盐布丁、午间套餐",
          photo: "",
          likes: "赞 76",
          comments: "回复 8",
          merchantReply: "",
          followup: "二次到店：换了季节菜单，南瓜浓汤比上次更喜欢。"
        },
        {
          id: thirdId,
          name: "阿渡",
          badge: "新用户 · Lv.2",
          avatar: "",
          rating: 5,
          date: "2026.07.12",
          context: "晚餐 · 朋友聚餐",
          title: "会愿意专程再来的一家小店",
          body: "菜单不长，但我们点到的几道都很稳定。店员对食材来源讲得很清楚，也主动帮我们调整了上菜顺序。",
          tags: "服务细致、季节菜单",
          photo: "",
          likes: "赞 43",
          comments: "回复 3",
          merchantReply: "很高兴这次聚餐让你们满意，我们会继续认真准备每一份季节菜单。",
          followup: ""
        }
      ],
      selectedReviewId: firstId,
      style: {
        theme: "city",
        device: "phone",
        fontScale: 1,
        radius: 16,
        density: "normal",
        showWatermark: true,
        exportScale: 2,
        colors: clone(THEMES.city.colors)
      }
    };
  }

  function normalizeState(raw) {
    const base = createDefaultState();
    if (!raw || typeof raw !== "object") return base;
    const result = clone(base);
    result.projectName = String(raw.projectName || base.projectName);
    result.item = { ...base.item, ...(raw.item || {}) };
    result.item.type = TYPE_META[result.item.type] ? result.item.type : "custom";
    result.item.cover = safeImageSource(result.item.cover);
    result.item.coverPosition = clamp(result.item.coverPosition, 0, 100);
    result.item.score = clamp(result.item.score, 0, 5);
    result.item.metrics = Array.isArray(raw.item?.metrics)
      ? raw.item.metrics.slice(0, 3).map((metric, index) => ({
        label: String(metric?.label || base.item.metrics[index]?.label || `分项${index + 1}`),
        value: String(metric?.value ?? base.item.metrics[index]?.value ?? "0")
      }))
      : base.item.metrics;
    while (result.item.metrics.length < 3) result.item.metrics.push(clone(base.item.metrics[result.item.metrics.length]));
    result.item.distribution = Array.isArray(raw.item?.distribution)
      ? raw.item.distribution.slice(0, 5).map((value) => clamp(value, 0, 100))
      : base.item.distribution;
    while (result.item.distribution.length < 5) result.item.distribution.push(0);
    result.reviews = Array.isArray(raw.reviews)
      ? raw.reviews.map((review) => ({
        id: String(review?.id || uid("review")),
        name: String(review?.name || "匿名用户"),
        badge: String(review?.badge || ""),
        avatar: safeImageSource(review?.avatar),
        rating: clamp(review?.rating, 0, 5),
        date: String(review?.date || ""),
        context: String(review?.context || ""),
        title: String(review?.title || ""),
        body: String(review?.body || ""),
        tags: String(review?.tags || ""),
        photo: safeImageSource(review?.photo),
        likes: String(review?.likes || ""),
        comments: String(review?.comments || ""),
        merchantReply: String(review?.merchantReply || ""),
        followup: String(review?.followup || "")
      }))
      : base.reviews;
    result.selectedReviewId = result.reviews.some((review) => review.id === raw.selectedReviewId)
      ? raw.selectedReviewId
      : result.reviews[0]?.id || "";
    const requestedTheme = THEMES[raw.style?.theme] ? raw.style.theme : base.style.theme;
    result.style = { ...base.style, ...(raw.style || {}), theme: requestedTheme };
    result.style.device = ["phone", "desktop"].includes(result.style.device) ? result.style.device : "phone";
    result.style.density = ["compact", "normal", "relaxed"].includes(result.style.density) ? result.style.density : "normal";
    result.style.fontScale = clamp(result.style.fontScale || 1, .85, 1.25);
    result.style.radius = clamp(result.style.radius, 0, 28);
    result.style.exportScale = [2, 3].includes(Number(result.style.exportScale)) ? Number(result.style.exportScale) : 2;
    result.style.showWatermark = result.style.showWatermark !== false;
    const storedColors = raw.style?.colors || {};
    const legacyColors = LEGACY_THEME_COLORS[requestedTheme];
    const usesLegacyPreset = legacyColors
      && Object.entries(legacyColors).every(([key, value]) => storedColors[key] === value);
    result.style.colors = usesLegacyPreset
      ? clone(THEMES[requestedTheme].colors)
      : { ...THEMES[requestedTheme].colors, ...storedColors };
    return result;
  }

  function safeImageSource(value) {
    return imageStore.normalize(value);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function listFromText(value) {
    return String(value || "").split(/[、,，\n]/).map((item) => item.trim()).filter(Boolean);
  }

  function initials(value) {
    const text = String(value || "评").trim();
    return [...text].slice(0, 2).join("");
  }

  function stars(value) {
    const count = Math.round(clamp(value, 0, 5));
    return `${"★".repeat(count)}${"☆".repeat(5 - count)}`;
  }

  function getSelectedReview() {
    return state.reviews.find((review) => review.id === state.selectedReviewId) || null;
  }

  function imageBindings(project) {
    const bindings = [{ container: project.item, key: "cover" }];
    project.reviews.forEach((review) => {
      bindings.push({ container: review, key: "avatar" });
      bindings.push({ container: review, key: "photo" });
    });
    return bindings;
  }

  function imageValues(project) {
    return imageBindings(project).map(({ container, key }) => container[key]).filter(Boolean);
  }

  async function migrateStateImages(project) {
    let migrated = 0;
    for (const { container, key } of imageBindings(project)) {
      const current = container[key];
      if (!imageStore.isDataImage(current)) continue;
      const next = await imageStore.storeDataUrl(current);
      if (next !== current) {
        container[key] = next;
        migrated += 1;
      }
    }
    return migrated;
  }

  async function createPortableState(project) {
    const portable = clone(project);
    for (const { container, key } of imageBindings(portable)) {
      container[key] = await imageStore.toDataUrl(container[key]);
    }
    return portable;
  }

  function loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? normalizeState(JSON.parse(stored)) : createDefaultState();
    } catch {
      return createDefaultState();
    }
  }

  let state = loadState();
  let history = [];
  let future = [];
  let saveTimer = 0;
  let toastTimer = 0;
  let inputCheckpoint = null;
  let exporting = false;
  const TOUR_STEPS = [
    { target: "#review-object-card", panel: "content", title: "建立点评对象", copy: "先填写平台名、对象类型、名称与基础资料；封面图上传后可以裁切，右侧画布会即时更新。" },
    { target: "#rating-editor-card", panel: "content", title: "设置评分概览", copy: "在这里调整综合分、点评数量、三个分项与星级分布，适合快速搭建一份可信的评分档案。" },
    { target: "#review-list-card", panel: "content", title: "管理点评条目", copy: "新增点评后，可在列表中选择、排序、复制或删除；选中的条目会进入下一张编辑卡。" },
    { target: "#selected-review-card", panel: "content", title: "编辑当前点评", copy: "填写作者、正文、点赞与回复，也能上传头像和点评配图，并补充追评或商家回复。" },
    { target: ".preview-toolbar", title: "检查实时画布", copy: "中间是最终页面预览。上方按钮可单独导出资料卡、评分、当前点评或固定屏幕；手机上还能拖动分隔条调整高度。" },
    { target: "#theme-grid", panel: "style", title: "选择页面模板", copy: "切换不同模板，再继续调整设备、字号、圆角、内容密度与自定义颜色；已填写的内容不会丢失。" },
    { target: "#export-long", panel: "style", title: "保存与导出", copy: "可导出完整长页 PNG，也可从预览栏导出局部。项目会自动保存在浏览器中，建议另存 JSON 作为可迁移备份。" }
  ];
  let tourIndex = -1;
  let tourPreviousMobilePanel = "content";
  const CROP_CONFIGS = {
    cover: { title: "裁切封面", ratioLabel: "16:9 横向封面", aspectRatio: 16 / 9, outputWidth: 1600, outputHeight: 900, quality: .9 },
    avatar: { title: "裁切用户头像", ratioLabel: "1:1 方形头像", aspectRatio: 1, outputWidth: 512, outputHeight: 512, quality: .9 },
    photo: { title: "裁切点评配图", ratioLabel: "4:3 点评配图", aspectRatio: 4 / 3, outputWidth: 1400, outputHeight: 1050, quality: .88 }
  };
  const imageCrop = {
    source: "", type: "cover", reviewId: "", naturalWidth: 0, naturalHeight: 0,
    baseScale: 1, zoom: 1, x: 0, y: 0, dragging: false,
    startX: 0, startY: 0, originX: 0, originY: 0
  };

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  async function saveState() {
    try {
      await migrateStateImages(state);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      showToast("浏览器存储失败，请保存 JSON 备份");
    }
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveState, 180);
  }

  async function initializeImageStorage() {
    try {
      const migrated = await migrateStateImages(state);
      const preload = await imageStore.preload(imageValues(state));
      if (migrated) await saveState();
      renderAll();
      if (preload.missing.length) showToast("部分本地图片已丢失，请重新上传");
      imageStore.cleanup(imageValues(state)).catch(() => {});
    } catch {
      renderAll();
    }
  }

  function pushHistory(snapshot = state) {
    history.push(clone(snapshot));
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
    state = normalizeState(history.pop());
    renderAll();
    scheduleSave();
  }

  function redo() {
    if (!future.length) return;
    history.push(clone(state));
    state = normalizeState(future.pop());
    renderAll();
    scheduleSave();
  }

  function renderMetricsEditor() {
    $("#metric-editor").innerHTML = state.item.metrics.map((metric, index) => `
      <div class="metric-row">
        <input data-metric-index="${index}" data-metric-field="label" value="${escapeHtml(metric.label)}" aria-label="分项名称 ${index + 1}">
        <input data-metric-index="${index}" data-metric-field="value" value="${escapeHtml(metric.value)}" aria-label="分项评分 ${index + 1}">
      </div>
    `).join("");
  }

  function renderDistributionEditor() {
    $("#distribution-editor").innerHTML = state.item.distribution.map((value, index) => `
      <label class="distribution-row">
        <span>${5 - index} 星</span>
        <input data-distribution-index="${index}" type="range" min="0" max="100" value="${value}">
        <output>${value}%</output>
      </label>
    `).join("");
  }

  function renderReviewListEditor() {
    const container = $("#review-editor-list");
    if (!state.reviews.length) {
      container.innerHTML = '<p class="selected-review-empty">还没有点评，点击“＋ 点评”建立第一条。</p>';
      return;
    }
    container.innerHTML = state.reviews.map((review, index) => `
      <article class="review-editor-item ${review.id === state.selectedReviewId ? "active" : ""}" data-select-review="${escapeHtml(review.id)}">
        <div><strong>${escapeHtml(review.name || `点评 ${index + 1}`)}</strong><span>${escapeHtml(review.title || "未命名点评")}</span></div>
        <div class="item-actions">
          <button type="button" data-review-action="up" data-review-id="${escapeHtml(review.id)}" aria-label="上移">↑</button>
          <button type="button" data-review-action="down" data-review-id="${escapeHtml(review.id)}" aria-label="下移">↓</button>
          <button type="button" data-review-action="copy" data-review-id="${escapeHtml(review.id)}" aria-label="复制">⧉</button>
          <button type="button" data-review-action="delete" data-review-id="${escapeHtml(review.id)}" aria-label="删除">×</button>
        </div>
      </article>
    `).join("");
  }

  function imagePreview(source, fallback, className = "") {
    const resolved = imageSource(source);
    return resolved
      ? `<div class="image-preview ${className}"><img src="${escapeHtml(resolved)}" alt=""></div>`
      : `<div class="image-preview ${className}">${escapeHtml(fallback)}</div>`;
  }

  function renderSelectedReviewEditor() {
    const review = getSelectedReview();
    const container = $("#selected-review-editor");
    if (!review) {
      container.innerHTML = '<p class="selected-review-empty">请先新增或选择一条点评。</p>';
      return;
    }
    container.innerHTML = `
      <div class="review-image-row">
        ${imagePreview(review.avatar, initials(review.name), "avatar-preview")}
        <div>
          <label class="button compact file-button">上传头像<input type="file" accept="image/*" data-review-image="avatar" data-review-id="${escapeHtml(review.id)}"></label>
          <button class="text-button" type="button" data-remove-review-image="avatar" data-review-id="${escapeHtml(review.id)}">移除头像</button>
        </div>
      </div>
      <div class="field-grid">
        <label class="field"><span>昵称</span><input data-review-id="${escapeHtml(review.id)}" data-review-field="name" value="${escapeHtml(review.name)}"></label>
        <label class="field"><span>身份 / 等级</span><input data-review-id="${escapeHtml(review.id)}" data-review-field="badge" value="${escapeHtml(review.badge)}"></label>
      </div>
      <div class="field-grid">
        <label class="field"><span>星级</span><input data-review-id="${escapeHtml(review.id)}" data-review-field="rating" type="number" min="0" max="5" step=".5" value="${review.rating}"></label>
        <label class="field"><span>日期</span><input data-review-id="${escapeHtml(review.id)}" data-review-field="date" value="${escapeHtml(review.date)}"></label>
      </div>
      <label class="field"><span>消费 / 购买信息</span><input data-review-id="${escapeHtml(review.id)}" data-review-field="context" value="${escapeHtml(review.context)}"></label>
      <label class="field"><span>点评标题</span><input data-review-id="${escapeHtml(review.id)}" data-review-field="title" value="${escapeHtml(review.title)}"></label>
      <label class="field"><span>点评正文</span><textarea data-review-id="${escapeHtml(review.id)}" data-review-field="body" rows="6">${escapeHtml(review.body)}</textarea></label>
      <label class="field"><span>提及项目 / 标签</span><input data-review-id="${escapeHtml(review.id)}" data-review-field="tags" value="${escapeHtml(review.tags)}"></label>
      <div class="review-image-row">
        ${imagePreview(review.photo, "点评配图", "review-photo-preview")}
        <div>
          <label class="button compact file-button">上传配图<input type="file" accept="image/*" data-review-image="photo" data-review-id="${escapeHtml(review.id)}"></label>
          <button class="text-button" type="button" data-remove-review-image="photo" data-review-id="${escapeHtml(review.id)}">移除配图</button>
        </div>
      </div>
      <div class="field-grid">
        <label class="field"><span>点赞文字</span><input data-review-id="${escapeHtml(review.id)}" data-review-field="likes" value="${escapeHtml(review.likes)}"></label>
        <label class="field"><span>回复文字</span><input data-review-id="${escapeHtml(review.id)}" data-review-field="comments" value="${escapeHtml(review.comments)}"></label>
      </div>
      <div class="subsection-label">FOLLOW-UP · 追评</div>
      <label class="field"><span>追评内容（留空隐藏）</span><textarea data-review-id="${escapeHtml(review.id)}" data-review-field="followup" rows="3">${escapeHtml(review.followup)}</textarea></label>
      <div class="subsection-label">MERCHANT · 商家回复</div>
      <label class="field"><span>商家回复（留空隐藏）</span><textarea data-review-id="${escapeHtml(review.id)}" data-review-field="merchantReply" rows="4">${escapeHtml(review.merchantReply)}</textarea></label>
    `;
  }

  function renderThemeGrid() {
    $("#theme-grid").innerHTML = Object.entries(THEMES).map(([id, theme]) => `
      <button class="theme-button ${state.style.theme === id ? "active" : ""}" data-theme="${id}" type="button">
        <span class="theme-swatch" style="--swatch-a:${theme.colors.accent};--swatch-b:${theme.colors.background}"></span>
        <span><strong>${theme.name}</strong><small>${theme.english}</small></span>
      </button>
    `).join("");
  }

  function syncStaticEditors() {
    $("#project-name").value = state.projectName;
    $$("[data-item-field]").forEach((input) => {
      input.value = state.item[input.dataset.itemField] ?? "";
    });
    const coverPreview = $("#cover-preview");
    coverPreview.innerHTML = imageSource(state.item.cover) ? `<img src="${escapeHtml(imageSource(state.item.cover))}" alt="">` : "封面";
    const coverImage = $("img", coverPreview);
    if (coverImage) coverImage.style.objectPosition = `50% ${state.item.coverPosition}%`;
    $("#cover-position-output").textContent = `${state.item.coverPosition}%`;
    $$("[data-style-field]").forEach((input) => {
      const value = state.style[input.dataset.styleField];
      if (input.type === "checkbox") input.checked = Boolean(value);
      else input.value = value;
    });
    $$("[data-color-field]").forEach((input) => {
      input.value = state.style.colors[input.dataset.colorField];
    });
    $("#font-scale-output").textContent = `${Math.round(state.style.fontScale * 100)}%`;
    $("#radius-output").textContent = `${state.style.radius}px`;
  }

  function renderReviewCard(review) {
    const tags = listFromText(review.tags);
    return `
      <article class="rv-review" id="review-${escapeHtml(review.id)}">
        <div class="rv-review-head">
          <div class="rv-avatar">${imageSource(review.avatar) ? `<img src="${escapeHtml(imageSource(review.avatar))}" alt="">` : escapeHtml(initials(review.name))}</div>
          <div class="rv-user"><strong>${escapeHtml(review.name)}</strong><span>${escapeHtml(review.badge)}</span></div>
          <div class="rv-review-rating">${stars(review.rating)}<small>${escapeHtml(review.date)}</small></div>
        </div>
        <h3>${escapeHtml(review.title)}</h3>
        <p class="rv-review-body">${escapeHtml(review.body)}</p>
        ${tags.length ? `<div class="rv-review-tags">${tags.map((tag) => `<span># ${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
        ${imageSource(review.photo) ? `<img class="rv-review-photo" src="${escapeHtml(imageSource(review.photo))}" alt="">` : ""}
        ${review.followup ? `<div class="rv-followup"><strong>追评：</strong>${escapeHtml(review.followup)}</div>` : ""}
        ${review.merchantReply ? `<div class="rv-merchant-reply"><strong>商家回复：</strong>${escapeHtml(review.merchantReply)}</div>` : ""}
        <footer class="rv-review-footer"><span>${escapeHtml(review.context)}</span><span>${escapeHtml(review.likes)}　${escapeHtml(review.comments)}</span></footer>
      </article>
    `;
  }

  function renderCanvas() {
    const item = state.item;
    const typeMeta = TYPE_META[item.type] || TYPE_META.custom;
    const tags = listFromText(item.tags);
    canvas.dataset.theme = state.style.theme;
    canvas.dataset.device = state.style.device;
    canvas.dataset.density = state.style.density;
    canvas.style.setProperty("--rv-accent", state.style.colors.accent);
    canvas.style.setProperty("--rv-bg", state.style.colors.background);
    canvas.style.setProperty("--rv-surface", state.style.colors.surface);
    canvas.style.setProperty("--rv-ink", state.style.colors.ink);
    canvas.style.setProperty("--rv-muted", state.style.colors.muted);
    canvas.style.setProperty("--rv-rating", state.style.colors.rating);
    canvas.style.setProperty("--rv-radius", `${state.style.radius}px`);
    canvas.style.setProperty("--rv-font", state.style.fontScale);
    canvas.innerHTML = `
      <header class="rv-appbar">
        <div><b>${escapeHtml(item.platformName || "OC 点评")}</b> <span>· ${escapeHtml(item.category)}</span></div>
        <div class="rv-appbar-actions"><span>⌕</span><span>♡</span><span>•••</span></div>
      </header>
      ${state.style.showWatermark ? '<div class="rv-watermark">MOCKUP / FICTIONAL REVIEW</div>' : ""}
      <section class="rv-hero" id="rv-hero">
        <div class="rv-cover">
          ${imageSource(item.cover) ? `<img src="${escapeHtml(imageSource(item.cover))}" alt="" style="object-position:50% ${item.coverPosition}%">` : `<div class="rv-cover-placeholder">${escapeHtml(initials(item.name))}</div>`}
        </div>
        <div class="rv-object-info">
          <span class="rv-kicker">${escapeHtml(typeMeta.kicker)} · ${escapeHtml(item.category)}</span>
          <h1>${escapeHtml(item.name)}</h1>
          <p class="rv-subtitle">${escapeHtml(item.subtitle)}</p>
          <div class="rv-scoreline"><strong>${Number(item.score).toFixed(1)}</strong><span class="rv-stars">${stars(item.score)}</span><small>${escapeHtml(item.reviewCount)}</small></div>
          <div class="rv-facts">
            <span><b>${escapeHtml(typeMeta.price)}</b>${escapeHtml(item.price)} · ${escapeHtml(item.meta)}</span>
            <span><b>${escapeHtml(typeMeta.address)}</b>${escapeHtml(item.address)}</span>
            <span><b>${escapeHtml(typeMeta.hours)}</b>${escapeHtml(item.hours)}</span>
          </div>
          ${tags.length ? `<div class="rv-tags">${tags.map((tag) => `<span class="rv-tag">${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
        </div>
      </section>
      <div class="rv-main">
        <div class="rv-score-column">
          <section class="rv-section" id="rv-rating-section">
            <div class="rv-section-title"><h2>评分概览</h2><span>${escapeHtml(item.reviewCount)}</span></div>
            <div class="rv-rating-summary">
              <div class="rv-rating-total"><strong>${Number(item.score).toFixed(1)}</strong><span>${stars(item.score)}</span></div>
              <div class="rv-bars">${item.distribution.map((value, index) => `
                <div class="rv-bar"><span>${5 - index}星</span><div class="rv-track"><i style="width:${clamp(value, 0, 100)}%"></i></div><span>${clamp(value, 0, 100)}%</span></div>
              `).join("")}</div>
            </div>
            <div class="rv-metrics">${item.metrics.map((metric) => `
              <div class="rv-metric"><strong>${escapeHtml(metric.value)}</strong><span>${escapeHtml(metric.label)}</span></div>
            `).join("")}</div>
          </section>
          <footer class="rv-actions rv-actions-desktop"><button type="button">♡ 收藏</button><button type="button">✎ 写点评</button></footer>
        </div>
        <section class="rv-review-column">
          <div class="rv-section">
            <div class="rv-section-title"><h2>用户点评</h2><span>按时间排序</span></div>
            <div class="rv-tags">${tags.slice(0, 4).map((tag) => `<span class="rv-tag">${escapeHtml(tag)}</span>`).join("")}</div>
          </div>
          <div class="rv-review-list">${state.reviews.map(renderReviewCard).join("")}</div>
        </section>
      </div>
      <footer class="rv-actions rv-actions-mobile"><button type="button">♡ 收藏</button><button type="button">✎ 写点评</button></footer>
    `;
    requestAnimationFrame(updateCanvasScale);
  }

  function renderAll() {
    renderMetricsEditor();
    renderDistributionEditor();
    renderReviewListEditor();
    renderSelectedReviewEditor();
    renderThemeGrid();
    syncStaticEditors();
    renderCanvas();
    updateHistoryButtons();
  }

  function selectReview(reviewId) {
    if (!state.reviews.some((review) => review.id === reviewId)) return;
    state.selectedReviewId = reviewId;
    renderReviewListEditor();
    renderSelectedReviewEditor();
    renderCanvas();
    scheduleSave();
  }

  function addReview() {
    pushHistory();
    const id = uid("review");
    state.reviews.push({
      id,
      name: "新用户",
      badge: "普通用户 · Lv.1",
      avatar: "",
      rating: 5,
      date: "2026.07.28",
      context: "消费信息",
      title: "未命名点评",
      body: "在这里填写点评正文。",
      tags: "",
      photo: "",
      likes: "赞 0",
      comments: "回复 0",
      merchantReply: "",
      followup: ""
    });
    state.selectedReviewId = id;
    renderAll();
    scheduleSave();
    requestAnimationFrame(() => {
      const input = $(`[data-review-id="${id}"][data-review-field="name"]`);
      input?.focus();
      input?.select();
    });
  }

  function handleReviewAction(action, reviewId) {
    const index = state.reviews.findIndex((review) => review.id === reviewId);
    if (index < 0) return;
    pushHistory();
    if (action === "up" && index > 0) {
      [state.reviews[index - 1], state.reviews[index]] = [state.reviews[index], state.reviews[index - 1]];
    } else if (action === "down" && index < state.reviews.length - 1) {
      [state.reviews[index + 1], state.reviews[index]] = [state.reviews[index], state.reviews[index + 1]];
    } else if (action === "copy") {
      const copy = clone(state.reviews[index]);
      copy.id = uid("review");
      copy.name = `${copy.name} · 副本`;
      state.reviews.splice(index + 1, 0, copy);
      state.selectedReviewId = copy.id;
    } else if (action === "delete") {
      state.reviews.splice(index, 1);
      if (state.selectedReviewId === reviewId) {
        state.selectedReviewId = state.reviews[Math.min(index, state.reviews.length - 1)]?.id || "";
      }
    }
    renderAll();
    scheduleSave();
  }

  function updateCanvasScale() {
    if (!canvas.offsetWidth || !viewport.clientWidth) return;
    const padding = window.matchMedia("(max-width: 900px)").matches ? 0 : 32;
    const scale = Math.min(1, Math.max(.1, (viewport.clientWidth - padding) / canvas.offsetWidth));
    canvas.style.transformOrigin = "top left";
    canvas.style.transform = `scale(${scale})`;
    stage.style.width = `${canvas.offsetWidth * scale}px`;
    stage.style.height = `${canvas.scrollHeight * scale}px`;
  }

  function setMobilePanel(panel) {
    document.body.dataset.mobilePanel = panel;
    $$("[data-mobile-tab]").forEach((button) => button.classList.toggle("active", button.dataset.mobileTab === panel));
    requestAnimationFrame(updateCanvasScale);
  }

  function safeSetStorage(key, value) {
    try { localStorage.setItem(key, value); } catch { /* ignore preference storage failures */ }
  }


  function tutorialSeen() {
    try { return localStorage.getItem(TUTORIAL_KEY) === "1"; } catch { return false; }
  }

  function markTutorialSeen() {
    try { localStorage.setItem(TUTORIAL_KEY, "1"); } catch { /* tutorial can remain session-only */ }
  }

  function positionTour() {
    if (tourIndex < 0) return;
    const step = TOUR_STEPS[tourIndex];
    const target = $(step.target);
    const focus = $("#tour-focus");
    const card = $("#tour-card");
    if (!target || !focus || !card) return;
    const rect = target.getBoundingClientRect();
    const margin = 6;
    focus.style.left = `${Math.max(4, rect.left - margin)}px`;
    focus.style.top = `${Math.max(4, rect.top - margin)}px`;
    focus.style.width = `${Math.min(window.innerWidth - 8, rect.width + margin * 2)}px`;
    focus.style.height = `${Math.min(window.innerHeight - 8, rect.height + margin * 2)}px`;
    if (window.matchMedia("(max-width: 900px)").matches) {
      card.style.left = "";
      card.style.top = "";
      card.style.width = "";
      card.style.right = "";
      card.style.bottom = "";
      return;
    }
    card.style.right = "auto";
    card.style.bottom = "auto";
    card.style.width = `${Math.min(340, window.innerWidth - 24)}px`;
    const cardRect = card.getBoundingClientRect();
    const gap = 16;
    const left = clamp(rect.left, 12, window.innerWidth - cardRect.width - 12);
    let top = rect.bottom + gap;
    if (top + cardRect.height > window.innerHeight - 12) top = rect.top - cardRect.height - gap;
    card.style.left = `${left}px`;
    card.style.top = `${Math.max(12, top)}px`;
  }

  function renderTourStep() {
    const step = TOUR_STEPS[tourIndex];
    if (!step) return closeTour();
    if (window.matchMedia("(max-width: 900px)").matches && step.panel) setMobilePanel(step.panel);
    $("#tour-progress").textContent = `${String(tourIndex + 1).padStart(2, "0")} / ${String(TOUR_STEPS.length).padStart(2, "0")}`;
    $("#tour-title").textContent = step.title;
    $("#tour-copy").textContent = step.copy;
    $("#tour-prev").disabled = tourIndex === 0;
    $("#tour-next").textContent = tourIndex === TOUR_STEPS.length - 1 ? "完成" : "下一步";
    requestAnimationFrame(() => {
      const target = $(step.target);
      target?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      requestAnimationFrame(positionTour);
    });
  }

  function openTour() {
    if (tourIndex >= 0) return;
    const overlay = $("#tour-overlay");
    if (!overlay) return;
    markTutorialSeen();
    tourPreviousMobilePanel = document.body.dataset.mobilePanel || "content";
    tourIndex = 0;
    overlay.hidden = false;
    document.body.classList.add("tour-open");
    renderTourStep();
    requestAnimationFrame(() => $("#tour-next")?.focus());
  }

  function closeTour() {
    if (tourIndex < 0) return;
    tourIndex = -1;
    $("#tour-overlay").hidden = true;
    document.body.classList.remove("tour-open");
    if (window.matchMedia("(max-width: 900px)").matches) setMobilePanel(tourPreviousMobilePanel);
    $("#start-tour")?.focus();
  }

  function setupTour() {
    $("#start-tour")?.addEventListener("click", openTour);
    $$('[data-close-tour]').forEach((button) => button.addEventListener("click", closeTour));
    $("#tour-prev")?.addEventListener("click", () => {
      if (tourIndex <= 0) return;
      tourIndex -= 1;
      renderTourStep();
    });
    $("#tour-next")?.addEventListener("click", () => {
      if (tourIndex === TOUR_STEPS.length - 1) return closeTour();
      tourIndex += 1;
      renderTourStep();
    });
    document.addEventListener("keydown", (event) => {
      if (tourIndex < 0) return;
      if (event.key === "Escape") closeTour();
      if (event.key === "ArrowRight") $("#tour-next")?.click();
      if (event.key === "ArrowLeft") $("#tour-prev")?.click();
    });
    window.addEventListener("resize", positionTour);
    window.addEventListener("scroll", positionTour, true);
  }

  function setupMobileResizer() {
    const workspace = $(".workspace");
    const resizer = $("#mobile-resizer");
    const query = window.matchMedia("(max-width: 900px)");
    if (!workspace || !resizer) return;

    let ratio = .40;
    try {
      const stored = Number(localStorage.getItem(MOBILE_SPLIT_KEY));
      if (Number.isFinite(stored) && stored >= .22 && stored <= .72) ratio = stored;
    } catch { /* keep default */ }
    let resizing = false;

    const applyHeight = (height, persist = true) => {
      if (!query.matches) return;
      const available = Math.max(1, workspace.clientHeight);
      const minimum = Math.max(100, available * .22);
      const maximum = Math.max(minimum, Math.min(available * .72, available - 190));
      const nextHeight = Math.min(maximum, Math.max(minimum, Number(height) || 0));
      ratio = nextHeight / available;
      workspace.style.setProperty("--mobile-preview-height", `${nextHeight}px`);
      resizer.setAttribute("aria-valuenow", String(Math.round(ratio * 100)));
      if (persist) {
        try { localStorage.setItem(MOBILE_SPLIT_KEY, String(ratio)); } catch { /* session-only layout is acceptable */ }
      }
      requestAnimationFrame(updateCanvasScale);
    };
    const applyRatio = () => {
      if (!query.matches) {
        workspace.style.removeProperty("--mobile-preview-height");
        document.body.classList.remove("mobile-resizing");
        return;
      }
      applyHeight(workspace.clientHeight * ratio, false);
    };
    const updateFromPointer = (clientY) => {
      applyHeight(clientY - workspace.getBoundingClientRect().top);
    };

    resizer.addEventListener("pointerdown", (event) => {
      if (!query.matches) return;
      resizing = true;
      try { resizer.setPointerCapture(event.pointerId); } catch { /* keep the same interaction where capture is unavailable */ }
      document.body.classList.add("mobile-resizing");
      updateFromPointer(event.clientY);
    });
    resizer.addEventListener("pointermove", (event) => {
      if (resizing) updateFromPointer(event.clientY);
    });
    const stopResizing = (event) => {
      if (!resizing) return;
      resizing = false;
      try {
        if (resizer.hasPointerCapture?.(event.pointerId)) resizer.releasePointerCapture(event.pointerId);
      } catch { /* pointer capture may already be released */ }
      document.body.classList.remove("mobile-resizing");
    };
    resizer.addEventListener("pointerup", stopResizing);
    resizer.addEventListener("pointercancel", stopResizing);
    resizer.addEventListener("keydown", (event) => {
      if (!query.matches || !["ArrowUp", "ArrowDown"].includes(event.key)) return;
      event.preventDefault();
      const current = $(".preview-panel")?.getBoundingClientRect().height || workspace.clientHeight * ratio;
      applyHeight(current + (event.key === "ArrowDown" ? 24 : -24));
    });
    resizer.addEventListener("dblclick", () => applyHeight(workspace.clientHeight * .40));
    window.addEventListener("resize", applyRatio);
    query.addEventListener?.("change", applyRatio);
    requestAnimationFrame(applyRatio);
  }

  function readImageFile(file) {
    return new Promise((resolve, reject) => {
      if (!file?.type.startsWith("image/")) return reject(new Error("not-image"));
      if (file.size > 15 * 1024 * 1024) return reject(new Error("too-large"));
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("read-failed"));
      reader.readAsDataURL(file);
    });
  }

  function updateImageCropTransform() {
    const stage = $("#image-crop-stage");
    const image = $("#image-crop-image");
    if (!imageCrop.naturalWidth || !stage.clientWidth || !stage.clientHeight) return;
    const stageWidth = stage.clientWidth;
    const stageHeight = stage.clientHeight;
    const scaledWidth = imageCrop.naturalWidth * imageCrop.baseScale * imageCrop.zoom;
    const scaledHeight = imageCrop.naturalHeight * imageCrop.baseScale * imageCrop.zoom;
    const maxX = Math.max(0, (scaledWidth - stageWidth) / 2);
    const maxY = Math.max(0, (scaledHeight - stageHeight) / 2);
    imageCrop.x = Math.min(maxX, Math.max(-maxX, imageCrop.x));
    imageCrop.y = Math.min(maxY, Math.max(-maxY, imageCrop.y));
    image.style.width = `${imageCrop.naturalWidth * imageCrop.baseScale}px`;
    image.style.height = `${imageCrop.naturalHeight * imageCrop.baseScale}px`;
    image.style.transform = `translate(-50%, -50%) translate(${imageCrop.x}px, ${imageCrop.y}px) scale(${imageCrop.zoom})`;
    $("#image-crop-zoom-output").textContent = `${Math.round(imageCrop.zoom * 100)}%`;
  }

  function openImageCrop(source, target) {
    const config = CROP_CONFIGS[target.type] || CROP_CONFIGS.photo;
    const modal = $("#image-crop-modal");
    const stage = $("#image-crop-stage");
    const image = $("#image-crop-image");
    imageCrop.source = source;
    imageCrop.type = target.type;
    imageCrop.reviewId = target.reviewId || "";
    imageCrop.zoom = 1;
    imageCrop.x = 0;
    imageCrop.y = 0;
    imageCrop.naturalWidth = 0;
    imageCrop.naturalHeight = 0;
    modal.dataset.cropType = imageCrop.type;
    stage.style.setProperty("--crop-aspect", String(config.aspectRatio));
    $("#image-crop-title").textContent = config.title;
    $("#image-crop-ratio").textContent = config.ratioLabel;
    $("#image-crop-zoom").value = "1";
    $("#image-crop-zoom-output").textContent = "100%";
    modal.hidden = false;
    document.body.classList.add("image-crop-open");
    image.onload = () => {
      imageCrop.naturalWidth = image.naturalWidth;
      imageCrop.naturalHeight = image.naturalHeight;
      imageCrop.baseScale = Math.max(stage.clientWidth / image.naturalWidth, stage.clientHeight / image.naturalHeight);
      updateImageCropTransform();
    };
    image.src = source;
    $("#apply-image-crop").focus();
  }

  function closeImageCrop() {
    $("#image-crop-modal").hidden = true;
    document.body.classList.remove("image-crop-open");
    imageCrop.source = "";
    imageCrop.dragging = false;
    $("#image-crop-image").removeAttribute("src");
  }

  async function applyImageCrop() {
    const config = CROP_CONFIGS[imageCrop.type];
    const stage = $("#image-crop-stage");
    const image = $("#image-crop-image");
    const applyButton = $("#apply-image-crop");
    if (!config || !imageCrop.source || !imageCrop.naturalWidth) return;
    applyButton.disabled = true;
    try {
      const stageWidth = stage.clientWidth;
      const stageHeight = stage.clientHeight;
      const scale = imageCrop.baseScale * imageCrop.zoom;
      const displayedWidth = imageCrop.naturalWidth * scale;
      const displayedHeight = imageCrop.naturalHeight * scale;
      const imageLeft = stageWidth / 2 + imageCrop.x - displayedWidth / 2;
      const imageTop = stageHeight / 2 + imageCrop.y - displayedHeight / 2;
      const sourceWidth = stageWidth / scale;
      const sourceHeight = stageHeight / scale;
      const sourceX = Math.max(0, Math.min(imageCrop.naturalWidth - sourceWidth, -imageLeft / scale));
      const sourceY = Math.max(0, Math.min(imageCrop.naturalHeight - sourceHeight, -imageTop / scale));
      const output = document.createElement("canvas");
      output.width = config.outputWidth;
      output.height = config.outputHeight;
      const context = output.getContext("2d");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, output.width, output.height);
      context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, output.width, output.height);
      const reference = await imageStore.storeDataUrl(output.toDataURL("image/jpeg", config.quality));
      pushHistory();
      if (imageCrop.type === "cover") {
        state.item.cover = reference;
        state.item.coverPosition = 50;
      } else {
        const review = state.reviews.find((item) => item.id === imageCrop.reviewId);
        if (!review) throw new Error("review-missing");
        review[imageCrop.type] = reference;
      }
      const completedType = imageCrop.type;
      closeImageCrop();
      renderAll();
      scheduleSave();
      showToast(completedType === "cover" ? "封面裁切已完成" : completedType === "avatar" ? "头像裁切已完成" : "点评配图裁切已完成");
    } catch {
      showToast("图片裁切失败，请重新选择图片");
    } finally {
      applyButton.disabled = false;
    }
  }

  function setupImageCrop() {
    const stage = $("#image-crop-stage");
    const zoom = $("#image-crop-zoom");
    stage.addEventListener("pointerdown", (event) => {
      imageCrop.dragging = true;
      imageCrop.startX = event.clientX;
      imageCrop.startY = event.clientY;
      imageCrop.originX = imageCrop.x;
      imageCrop.originY = imageCrop.y;
      stage.setPointerCapture(event.pointerId);
    });
    stage.addEventListener("pointermove", (event) => {
      if (!imageCrop.dragging) return;
      imageCrop.x = imageCrop.originX + event.clientX - imageCrop.startX;
      imageCrop.y = imageCrop.originY + event.clientY - imageCrop.startY;
      updateImageCropTransform();
    });
    stage.addEventListener("pointerup", () => { imageCrop.dragging = false; });
    stage.addEventListener("pointercancel", () => { imageCrop.dragging = false; });
    zoom.addEventListener("input", () => {
      imageCrop.zoom = Number(zoom.value);
      updateImageCropTransform();
    });
    $$('[data-close-image-crop]').forEach((button) => button.addEventListener("click", closeImageCrop));
    $("#apply-image-crop").addEventListener("click", applyImageCrop);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !$("#image-crop-modal").hidden) closeImageCrop();
    });
    window.addEventListener("resize", () => {
      if ($("#image-crop-modal").hidden || !imageCrop.naturalWidth) return;
      imageCrop.baseScale = Math.max(stage.clientWidth / imageCrop.naturalWidth, stage.clientHeight / imageCrop.naturalHeight);
      imageCrop.x = 0;
      imageCrop.y = 0;
      updateImageCropTransform();
    });
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
  }

  function safeFilename(value) {
    return String(value || "oc-review").replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "-").slice(0, 80);
  }

  async function exportJson() {
    try {
      const portable = await createPortableState(state);
      const blob = new Blob([JSON.stringify(portable, null, 2)], { type: "application/json;charset=utf-8" });
      downloadBlob(blob, `${safeFilename(state.projectName)}.json`);
      showToast("项目 JSON 已保存（包含图片）");
    } catch {
      showToast("JSON 导出失败，请检查本地图片");
    }
  }

  async function importJson(file) {
    try {
      const raw = JSON.parse(await file.text());
      pushHistory();
      state = normalizeState(raw);
      await migrateStateImages(state);
      await imageStore.preload(imageValues(state));
      renderAll();
      scheduleSave();
      showToast("项目已导入");
    } catch {
      showToast("无法读取这个 JSON 文件");
    }
  }

  async function exportNode(node, suffix, fixed = false) {
    if (!node || exporting) return;
    if (!window.htmlToImage?.toPng) return showToast("导出组件未加载");
    exporting = true;
    const previousTransform = canvas.style.transform;
    const previousHeight = canvas.style.height;
    const previousMinHeight = canvas.style.minHeight;
    const previousOverflow = canvas.style.overflow;
    canvas.style.transform = "none";
    canvas.classList.add("is-exporting");
    if (fixed) {
      canvas.classList.add("export-fixed");
      const height = state.style.device === "phone" ? 844 : 760;
      canvas.style.height = `${height}px`;
      canvas.style.minHeight = `${height}px`;
      canvas.style.overflow = "hidden";
    }
    showToast("正在生成 PNG…");
    try {
      if (document.fonts?.load) {
        const exportText = ((node.textContent || "中文字体" ).slice(0, 12000));
        await Promise.all(['400 24px "OC Noto Serif SC"', '600 24px "OC Noto Serif SC"', '700 24px "OC Noto Serif SC"'].map((spec) => Promise.race([
          document.fonts.load(spec, exportText).catch(() => []),
          new Promise((resolve) => setTimeout(resolve, 4000))
        ])));
      }
      if (document.fonts?.ready) await document.fonts.ready;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const fontEmbedCSS = await window.OCExportFonts?.getFontEmbedCSS(node);
      const exportOptions = {
        pixelRatio: Number(state.style.exportScale) || 2,
        skipAutoScale: true,
        cacheBust: false,
        preferredFontFormat: "woff2",
        backgroundColor: getComputedStyle(node).backgroundColor
      };
      if (fontEmbedCSS) exportOptions.fontEmbedCSS = fontEmbedCSS;
      const dataUrl = await window.htmlToImage.toPng(node, exportOptions);
      const response = await fetch(dataUrl);
      downloadBlob(await response.blob(), `${safeFilename(state.projectName)}-${suffix}.png`);
      showToast("PNG 已导出");
    } catch {
      showToast("导出失败，请减少图片尺寸后重试");
    } finally {
      canvas.style.transform = previousTransform;
      canvas.style.height = previousHeight;
      canvas.style.minHeight = previousMinHeight;
      canvas.style.overflow = previousOverflow;
      canvas.classList.remove("is-exporting");
      canvas.classList.remove("export-fixed");
      exporting = false;
      updateCanvasScale();
    }
  }

  document.addEventListener("focusin", (event) => {
    if (event.target.matches("input, textarea, select") && !event.target.closest(".top-actions")) inputCheckpoint = clone(state);
  });

  document.addEventListener("change", (event) => {
    if (inputCheckpoint && JSON.stringify(inputCheckpoint) !== JSON.stringify(state)) pushHistory(inputCheckpoint);
    inputCheckpoint = null;
    const target = event.target;
    if (target === $("#import-json") && target.files?.[0]) {
      importJson(target.files[0]);
      target.value = "";
      return;
    }
    if (target === $("#cover-input") && target.files?.[0]) {
      const file = target.files[0];
      target.value = "";
      readImageFile(file)
        .then((source) => openImageCrop(source, { type: "cover" }))
        .catch(() => showToast("封面无法读取或超过 15MB"));
      return;
    }
    if (target.matches("[data-review-image]") && target.files?.[0]) {
      const review = state.reviews.find((item) => item.id === target.dataset.reviewId);
      const type = target.dataset.reviewImage;
      const file = target.files[0];
      target.value = "";
      if (!review || !CROP_CONFIGS[type]) return;
      readImageFile(file)
        .then((source) => openImageCrop(source, { type, reviewId: review.id }))
        .catch(() => showToast("图片无法读取或超过 15MB"));
    }
  });

  document.addEventListener("input", (event) => {
    const target = event.target;
    if (target.id === "project-name") {
      state.projectName = target.value;
      scheduleSave();
      return;
    }
    if (target.dataset.itemField) {
      const field = target.dataset.itemField;
      state.item[field] = ["score", "coverPosition"].includes(field) ? Number(target.value) : target.value;
      if (field === "coverPosition") {
        $("#cover-position-output").textContent = `${target.value}%`;
        const previewImage = $("#cover-preview img");
        if (previewImage) previewImage.style.objectPosition = `50% ${target.value}%`;
      }
      renderCanvas();
      scheduleSave();
      return;
    }
    if (target.dataset.metricField) {
      const metric = state.item.metrics[Number(target.dataset.metricIndex)];
      if (metric) metric[target.dataset.metricField] = target.value;
      renderCanvas();
      scheduleSave();
      return;
    }
    if (target.dataset.distributionIndex !== undefined) {
      state.item.distribution[Number(target.dataset.distributionIndex)] = Number(target.value);
      target.parentElement.querySelector("output").textContent = `${target.value}%`;
      renderCanvas();
      scheduleSave();
      return;
    }
    if (target.dataset.reviewField) {
      const review = state.reviews.find((item) => item.id === target.dataset.reviewId);
      if (!review) return;
      review[target.dataset.reviewField] = target.dataset.reviewField === "rating" ? Number(target.value) : target.value;
      renderReviewListEditor();
      renderCanvas();
      scheduleSave();
      return;
    }
    if (target.dataset.styleField) {
      const field = target.dataset.styleField;
      state.style[field] = target.type === "checkbox"
        ? target.checked
        : ["fontScale", "radius", "exportScale"].includes(field)
          ? Number(target.value)
          : target.value;
      syncStaticEditors();
      renderCanvas();
      scheduleSave();
      return;
    }
    if (target.dataset.colorField) {
      state.style.colors[target.dataset.colorField] = target.value;
      renderCanvas();
      scheduleSave();
    }
  });

  document.addEventListener("click", (event) => {
    const mobileTab = event.target.closest("[data-mobile-tab]");
    if (mobileTab) return setMobilePanel(mobileTab.dataset.mobileTab);
    const themeButton = event.target.closest(".theme-button[data-theme]");
    if (themeButton) {
      pushHistory();
      state.style.theme = themeButton.dataset.theme;
      state.style.colors = clone(THEMES[state.style.theme].colors);
      renderAll();
      scheduleSave();
      return;
    }
    const reviewAction = event.target.closest("[data-review-action]");
    if (reviewAction) {
      event.stopPropagation();
      handleReviewAction(reviewAction.dataset.reviewAction, reviewAction.dataset.reviewId);
      return;
    }
    const reviewItem = event.target.closest("[data-select-review]");
    if (reviewItem) return selectReview(reviewItem.dataset.selectReview);
    const removeImage = event.target.closest("[data-remove-review-image]");
    if (removeImage) {
      const review = state.reviews.find((item) => item.id === removeImage.dataset.reviewId);
      if (!review) return;
      pushHistory();
      review[removeImage.dataset.removeReviewImage] = "";
      renderAll();
      scheduleSave();
      return;
    }
    const exportButton = event.target.closest("[data-export-section]");
    if (exportButton) {
      const section = exportButton.dataset.exportSection;
      if (section === "hero") exportNode($("#rv-hero"), "资料卡");
      if (section === "rating") exportNode($("#rv-rating-section"), "评分概览");
      if (section === "review") {
        const selected = getSelectedReview();
        if (!selected) return showToast("请先选择一条点评");
        exportNode($(`#review-${CSS.escape(selected.id)}`), "当前点评");
      }
      if (section === "fixed") exportNode(canvas, "固定屏幕", true);
    }
  });

  $("#add-review").addEventListener("click", addReview);
  $("#undo").addEventListener("click", undo);
  $("#redo").addEventListener("click", redo);
  $("#save-json").addEventListener("click", exportJson);
  $("#export-full").addEventListener("click", () => exportNode(canvas, "完整长页"));
  $("#export-long").addEventListener("click", () => exportNode(canvas, "完整长页"));
  $("#remove-cover").addEventListener("click", () => {
    if (!state.item.cover) return;
    pushHistory();
    state.item.cover = "";
    renderAll();
    scheduleSave();
  });
  $("#reset-colors").addEventListener("click", () => {
    pushHistory();
    state.style.colors = clone(THEMES[state.style.theme].colors);
    renderAll();
    scheduleSave();
  });
  $("#new-project").addEventListener("click", () => {
    if (!confirm("新建项目会替换当前内容，建议先保存 JSON。继续吗？")) return;
    pushHistory();
    state = createDefaultState();
    renderAll();
    scheduleSave();
    showToast("已新建点评项目");
  });

  window.addEventListener("resize", updateCanvasScale);
  canvas.addEventListener("load", () => requestAnimationFrame(updateCanvasScale), true);
  if ("ResizeObserver" in window) {
    new ResizeObserver(() => requestAnimationFrame(updateCanvasScale)).observe(canvas);
  }
  setupImageCrop();
  setupTour();
  setupMobileResizer();
  renderAll();
  if (!tutorialSeen()) window.setTimeout(openTour, 650);
  initializeImageStorage();
})();












