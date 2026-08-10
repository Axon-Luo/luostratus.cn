(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const STORAGE_KEY = "oc-cart-generator-v1";
  const MOBILE_SPLIT_KEY = "oc-cart-mobile-preview-ratio";
  const TUTORIAL_KEY = "oc-cart-generator-tutorial-v1";
  const IMAGE_DATABASE_NAME = "oc-cart-generator-assets-v1";
  const imageStore = window.OCImageStore.create({ databaseName: IMAGE_DATABASE_NAME });
  const canvas = $("#cart-canvas");
  const stage = $("#preview-stage");
  const viewport = $("#preview-viewport");

  const THEMES = {
    editorial: {
      name: "编辑部购物车",
      english: "EDITORIAL RETAIL",
      colors: { accent: "#c79a24", background: "#ece8dc", surface: "#fffdf5", ink: "#29271f", muted: "#777164", line: "#d7cfbd" }
    },
    clean: {
      name: "清爽商城",
      english: "CLEAR MARKET",
      colors: { accent: "#607f87", background: "#e9edec", surface: "#fbfcfb", ink: "#2e3839", muted: "#788180", line: "#d2d9d7" }
    },
    retro: {
      name: "复古百货",
      english: "DEPARTMENT STORE",
      colors: { accent: "#a65f32", background: "#ddd3bf", surface: "#fff8e8", ink: "#34281f", muted: "#7b6c5e", line: "#c9b99e" }
    },
    pixel: {
      name: "像素商店",
      english: "PIXEL MART",
      colors: { accent: "#7a8461", background: "#dedfd3", surface: "#f5f4e9", ink: "#34362d", muted: "#77786d", line: "#c2c2b4" }
    },
    luxury: {
      name: "暗色精品店",
      english: "LUXURY CHECKOUT",
      colors: { accent: "#c9ab67", background: "#171817", surface: "#252624", ink: "#f3ede1", muted: "#aaa397", line: "#474840" }
    }
  };

  const LEGACY_THEME_COLORS = {
    clean: { accent: "#16858d", background: "#e8f0f0", surface: "#ffffff", ink: "#203336", muted: "#708083", line: "#ccdada" },
    pixel: { accent: "#a9c824", background: "#dce3ce", surface: "#f8faee", ink: "#273026", muted: "#6d7969", line: "#aebaa1" }
  };

  const uid = (prefix = "item") => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));
  const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const imageSource = (value = "") => imageStore.resolve(value);

  function createDefaultState() {
    const firstId = uid("product");
    const secondId = uid("product");
    const thirdId = uid("product");
    return {
      version: 1,
      projectName: "秋日百货购物车",
      selectedItemId: firstId,
      account: {
        name: "许澄",
        handle: "@orange_archive",
        contact: "cheng@example.com",
        level: "金叶会员",
        points: "2,480 积分",
        avatar: ""
      },
      shipping: {
        receiver: "许澄",
        phone: "138 **** 0612",
        region: "南港区 · 灯塔街道",
        address: "秋潮路 26 号 北楼 4 层",
        method: "标准配送",
        arrival: "预计明日 18:00 前",
        note: "请放在前台，不要电话联系。"
      },
      items: [
        {
          id: firstId,
          selected: true,
          store: "纸岸生活馆",
          name: "黄铜夹边硬壳笔记本",
          variant: "A5 · 暖灰色 · 方格内页",
          price: 58,
          originalPrice: 72,
          quantity: 2,
          stock: "现货 · 48 小时内发货",
          badge: "会员价",
          image: ""
        },
        {
          id: secondId,
          selected: true,
          store: "北窗织物社",
          name: "秋季羊毛混纺披肩",
          variant: "烟褐色 · 180 × 65 cm",
          price: 168,
          originalPrice: 198,
          quantity: 1,
          stock: "库存 7 件",
          badge: "限时折扣",
          image: ""
        },
        {
          id: thirdId,
          selected: false,
          store: "旧港器物",
          name: "手工釉面早餐杯",
          variant: "海盐蓝 · 320 ml",
          price: 86,
          originalPrice: 86,
          quantity: 1,
          stock: "预售 · 7 月 31 日发货",
          badge: "预售",
          image: ""
        }
      ],
      pricing: {
        currency: "¥",
        discount: 20,
        coupon: 15,
        shipping: 0,
        service: 3,
        tax: 0,
        checkoutLabel: "去结算"
      },
      style: {
        theme: "editorial",
        device: "phone",
        fontScale: 1,
        radius: 14,
        density: "normal",
        showOriginalPrice: true,
        showStock: true,
        showMockup: true,
        exportScale: 2,
        colors: clone(THEMES.editorial.colors)
      }
    };
  }

  function safeImageSource(value) {
    return imageStore.normalize(value);
  }

  function normalizeState(raw) {
    const base = createDefaultState();
    if (!raw || typeof raw !== "object") return base;
    const next = {
      ...base,
      ...raw,
      account: { ...base.account, ...(raw.account || {}) },
      shipping: { ...base.shipping, ...(raw.shipping || {}) },
      pricing: { ...base.pricing, ...(raw.pricing || {}) },
      style: { ...base.style, ...(raw.style || {}) }
    };
    next.version = 1;
    next.account.avatar = safeImageSource(next.account.avatar);
    next.items = Array.isArray(raw.items)
      ? raw.items.map((item, index) => ({
        id: String(item?.id || uid("product")),
        selected: item?.selected !== false,
        store: String(item?.store || `店铺 ${index + 1}`),
        name: String(item?.name || `商品 ${index + 1}`),
        variant: String(item?.variant || ""),
        price: Math.max(0, number(item?.price)),
        originalPrice: Math.max(0, number(item?.originalPrice)),
        quantity: Math.max(1, Math.round(number(item?.quantity, 1))),
        stock: String(item?.stock || ""),
        badge: String(item?.badge || ""),
        image: safeImageSource(item?.image)
      }))
      : base.items;
    next.selectedItemId = next.items.some((item) => item.id === raw.selectedItemId)
      ? raw.selectedItemId
      : next.items[0]?.id || "";
    ["discount", "coupon", "shipping", "service", "tax"].forEach((key) => {
      next.pricing[key] = Math.max(0, number(next.pricing[key]));
    });
    next.pricing.currency = String(next.pricing.currency || "¥").slice(0, 4);
    next.pricing.checkoutLabel = String(next.pricing.checkoutLabel || "去结算");
    next.style.theme = THEMES[next.style.theme] ? next.style.theme : "editorial";
    next.style.device = ["phone", "desktop"].includes(next.style.device) ? next.style.device : "phone";
    next.style.density = ["compact", "normal", "relaxed"].includes(next.style.density) ? next.style.density : "normal";
    next.style.fontScale = clamp(next.style.fontScale || 1, .86, 1.24);
    next.style.radius = clamp(next.style.radius, 0, 28);
    next.style.exportScale = [2, 3].includes(Number(next.style.exportScale)) ? Number(next.style.exportScale) : 2;
    next.style.showOriginalPrice = next.style.showOriginalPrice !== false;
    next.style.showStock = next.style.showStock !== false;
    next.style.showMockup = next.style.showMockup !== false;
    const storedColors = raw.style?.colors || {};
    const legacyColors = LEGACY_THEME_COLORS[next.style.theme];
    const usesLegacyPreset = legacyColors
      && Object.entries(legacyColors).every(([key, value]) => storedColors[key] === value);
    next.style.colors = usesLegacyPreset
      ? clone(THEMES[next.style.theme].colors)
      : { ...THEMES[next.style.theme].colors, ...storedColors };
    return next;
  }

  function imageBindings(project) {
    return [
      { container: project.account, key: "avatar" },
      ...project.items.map((item) => ({ container: item, key: "image" }))
    ];
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
      return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"));
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
    { target: "#account-editor-card", panel: "content", title: "填写账户信息", copy: "先录入姓名、账户名、联系方式与会员资料。头像上传后会进入裁切窗口，没有图片时画布保持简洁。" },
    { target: "#shipping-editor-card", panel: "content", title: "设置收货与配送", copy: "填写收货人、电话、地区、详细地址、配送方式和备注，这些内容会组成结算页的地址卡。" },
    { target: "#cart-items-editor-card", panel: "content", title: "管理购物车商品", copy: "新增商品后，可在列表中选择、排序、复制或删除；每个条目都能独立设置是否参与结算。" },
    { target: "#selected-item-card", panel: "content", title: "编辑当前商品", copy: "上传并裁切商品图，填写店铺、商品名、规格、现价、原价、数量、库存与角标。" },
    { target: ".preview-toolbar", title: "检查实时画布", copy: "中间画布会即时计算选中商品和结算金额。预览栏可分别导出账户、商品、结算或固定屏幕。" },
    { target: "#theme-grid", panel: "style", title: "选择购物模板", copy: "切换五套视觉模板，并调整设备、字号、圆角、密度、显示项目与自定义配色。" },
    { target: "#export-long", panel: "style", title: "保存与导出", copy: "导出完整购物车 PNG，或从预览栏只导出某个部件。浏览器会自动保存，JSON 适合备份和换设备继续编辑。" }
  ];
  let tourIndex = -1;
  let tourPreviousMobilePanel = "content";

  const CROP_CONFIGS = {
    avatar: { title: "裁切账户头像", label: "1:1 方形头像", output: 512, quality: .9 },
    product: { title: "裁切商品图片", label: "1:1 方形商品图", output: 1000, quality: .88 }
  };
  const crop = {
    source: "", type: "product", itemId: "", naturalWidth: 0, naturalHeight: 0,
    baseScale: 1, zoom: 1, x: 0, y: 0, dragging: false,
    startX: 0, startY: 0, originX: 0, originY: 0
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function initials(value) {
    return [...String(value || "购").trim()].slice(0, 2).join("");
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
  }

  function getSelectedItem() {
    return state.items.find((item) => item.id === state.selectedItemId) || null;
  }

  function totals() {
    const selected = state.items.filter((item) => item.selected);
    const subtotal = selected.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const original = selected.reduce((sum, item) => sum + Math.max(item.originalPrice, item.price) * item.quantity, 0);
    const deductions = state.pricing.discount + state.pricing.coupon;
    const additions = state.pricing.shipping + state.pricing.service + state.pricing.tax;
    return {
      selected,
      subtotal,
      original,
      total: Math.max(0, subtotal - deductions + additions)
    };
  }

  function money(value) {
    const amount = number(value);
    const formatted = Number.isInteger(amount)
      ? amount.toLocaleString("zh-CN")
      : amount.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${state.pricing.currency}${formatted}`;
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
    saveTimer = setTimeout(saveState, 240);
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

  function renderThemeGrid() {
    $("#theme-grid").innerHTML = Object.entries(THEMES).map(([id, theme]) => `
      <button class="theme-button ${state.style.theme === id ? "active" : ""}" type="button" data-theme="${id}">
        <span class="theme-swatch" style="--swatch-a:${theme.colors.accent};--swatch-b:${theme.colors.surface}"></span>
        <span><strong>${theme.name}</strong><small>${theme.english}</small></span>
      </button>
    `).join("");
  }

  function renderItemList() {
    const list = $("#item-editor-list");
    if (!state.items.length) {
      list.innerHTML = '<p class="selected-item-empty">购物车暂时没有商品。</p>';
      return;
    }
    list.innerHTML = state.items.map((item, index) => `
      <article class="item-editor-row ${item.id === state.selectedItemId ? "active" : ""}" data-select-item="${escapeHtml(item.id)}">
        <input type="checkbox" data-item-selected="${escapeHtml(item.id)}" ${item.selected ? "checked" : ""} aria-label="选择 ${escapeHtml(item.name)}">
        <div><strong>${escapeHtml(item.name || `商品 ${index + 1}`)}</strong><span>${escapeHtml(item.store)} · ${money(item.price)} × ${item.quantity}</span></div>
        <div class="item-actions">
          <button type="button" data-item-action="up" data-item-id="${escapeHtml(item.id)}" aria-label="上移">↑</button>
          <button type="button" data-item-action="down" data-item-id="${escapeHtml(item.id)}" aria-label="下移">↓</button>
          <button type="button" data-item-action="copy" data-item-id="${escapeHtml(item.id)}" aria-label="复制">⧉</button>
          <button type="button" data-item-action="delete" data-item-id="${escapeHtml(item.id)}" aria-label="删除">×</button>
        </div>
      </article>
    `).join("");
  }

  function renderSelectedItemEditor() {
    const item = getSelectedItem();
    const container = $("#selected-item-editor");
    if (!item) {
      container.innerHTML = '<p class="selected-item-empty">请先新增或选择一个商品。</p>';
      return;
    }
    const source = imageSource(item.image);
    container.innerHTML = `
      <div class="item-image-editor">
        <div class="image-preview product-preview">${source ? `<img src="${escapeHtml(source)}" alt="">` : "商品图"}</div>
        <div class="image-actions">
          <label class="button compact file-button">上传图片<input type="file" accept="image/*" data-product-image="${escapeHtml(item.id)}"></label>
          <button class="text-button" type="button" data-remove-product-image="${escapeHtml(item.id)}">移除</button>
        </div>
      </div>
      <label class="field"><span>店铺名称</span><input data-item-field="store" data-item-id="${escapeHtml(item.id)}" value="${escapeHtml(item.store)}"></label>
      <label class="field"><span>商品名称</span><input data-item-field="name" data-item-id="${escapeHtml(item.id)}" value="${escapeHtml(item.name)}"></label>
      <label class="field"><span>规格</span><input data-item-field="variant" data-item-id="${escapeHtml(item.id)}" value="${escapeHtml(item.variant)}"></label>
      <div class="field-grid">
        <label class="field"><span>现价</span><input data-item-field="price" data-item-id="${escapeHtml(item.id)}" type="number" min="0" step=".01" value="${item.price}"></label>
        <label class="field"><span>原价</span><input data-item-field="originalPrice" data-item-id="${escapeHtml(item.id)}" type="number" min="0" step=".01" value="${item.originalPrice}"></label>
      </div>
      <div class="field-grid">
        <label class="field"><span>数量</span><input data-item-field="quantity" data-item-id="${escapeHtml(item.id)}" type="number" min="1" step="1" value="${item.quantity}"></label>
        <label class="field"><span>状态标签</span><input data-item-field="badge" data-item-id="${escapeHtml(item.id)}" value="${escapeHtml(item.badge)}"></label>
      </div>
      <label class="field"><span>库存 / 发货信息</span><input data-item-field="stock" data-item-id="${escapeHtml(item.id)}" value="${escapeHtml(item.stock)}"></label>
    `;
  }

  function syncEditors() {
    $("#project-name").value = state.projectName;
    $$("[data-account-field]").forEach((input) => { input.value = state.account[input.dataset.accountField] ?? ""; });
    $$("[data-shipping-field]").forEach((input) => { input.value = state.shipping[input.dataset.shippingField] ?? ""; });
    $$("[data-pricing-field]").forEach((input) => { input.value = state.pricing[input.dataset.pricingField] ?? ""; });
    $$("[data-style-field]").forEach((input) => {
      const value = state.style[input.dataset.styleField];
      if (input.type === "checkbox") input.checked = Boolean(value);
      else input.value = value;
    });
    $$("[data-color-field]").forEach((input) => { input.value = state.style.colors[input.dataset.colorField]; });
    $("#font-scale-output").textContent = `${Math.round(state.style.fontScale * 100)}%`;
    $("#radius-output").textContent = `${state.style.radius}px`;
    const avatar = imageSource(state.account.avatar);
    $("#account-avatar-preview").innerHTML = avatar ? `<img src="${escapeHtml(avatar)}" alt="">` : escapeHtml(initials(state.account.name));
  }

  function renderProductRows() {
    if (!state.items.length) return '<div class="cart-empty">购物车是空的</div>';
    let previousStore = "";
    return state.items.map((item) => {
      const store = item.store !== previousStore
        ? `<div class="cart-store"><i></i>${escapeHtml(item.store)}</div>`
        : "";
      previousStore = item.store;
      const source = imageSource(item.image);
      return `${store}
        <article class="cart-item ${source ? "has-image" : ""}">
          <button class="cart-check ${item.selected ? "is-selected" : ""}" type="button" data-canvas-toggle="${escapeHtml(item.id)}" aria-label="${item.selected ? "取消选择" : "选择"} ${escapeHtml(item.name)}"></button>
          ${source ? `<div class="cart-product-image"><img src="${escapeHtml(source)}" alt=""></div>` : ""}
          <div class="cart-product-copy">
            <h3>${escapeHtml(item.name)}</h3>
            <span class="cart-variant">${escapeHtml(item.variant)}${item.badge ? `<b class="cart-badge">${escapeHtml(item.badge)}</b>` : ""}</span>
            <div class="cart-product-bottom">
              <div class="cart-price">
                <strong>${money(item.price)}</strong>
                ${state.style.showOriginalPrice && item.originalPrice > item.price ? `<del>${money(item.originalPrice)}</del>` : ""}
                ${state.style.showStock && item.stock ? `<span class="cart-stock">${escapeHtml(item.stock)}</span>` : ""}
              </div>
              <div class="cart-quantity">
                <button type="button" data-canvas-quantity="-1" data-item-id="${escapeHtml(item.id)}">−</button>
                <span>${item.quantity}</span>
                <button type="button" data-canvas-quantity="1" data-item-id="${escapeHtml(item.id)}">＋</button>
              </div>
            </div>
          </div>
        </article>`;
    }).join("");
  }

  function renderCanvas() {
    const sum = totals();
    const accountAvatar = imageSource(state.account.avatar);
    const selectedCount = sum.selected.reduce((count, item) => count + item.quantity, 0);
    const colors = state.style.colors;
    canvas.dataset.device = state.style.device;
    canvas.dataset.theme = state.style.theme;
    canvas.dataset.density = state.style.density;
    canvas.style.cssText = [
      `--cart-accent:${colors.accent}`,
      `--cart-bg:${colors.background}`,
      `--cart-surface:${colors.surface}`,
      `--cart-ink:${colors.ink}`,
      `--cart-muted:${colors.muted}`,
      `--cart-line:${colors.line}`,
      `--cart-radius:${state.style.radius}px`,
      `--cart-font:${state.style.fontScale}`
    ].join(";");
    canvas.innerHTML = `
      <header class="cart-appbar">
        <span class="cart-back-icon">←</span><b>购物车</b>
      </header>
      ${state.style.showMockup ? '<div class="cart-mockup">MOCKUP / FICTIONAL CART</div>' : ""}
      <main class="cart-content">
        <section class="cart-profile" id="cart-account-block">
          <div class="cart-avatar">${accountAvatar ? `<img src="${escapeHtml(accountAvatar)}" alt="">` : escapeHtml(initials(state.account.name))}</div>
          <div class="cart-profile-copy"><strong>${escapeHtml(state.account.name)}</strong><span>${escapeHtml(state.account.handle)} · ${escapeHtml(state.account.contact)}</span><span>${escapeHtml(state.account.points)}</span></div>
          <span class="cart-member">${escapeHtml(state.account.level)}</span>
        </section>
        <section class="cart-address">
          <span class="cart-address-icon">⌂</span>
          <div><strong>${escapeHtml(state.shipping.receiver)}　${escapeHtml(state.shipping.phone)}</strong><p>${escapeHtml(state.shipping.region)}<br>${escapeHtml(state.shipping.address)}</p></div>
          <small>${escapeHtml(state.shipping.method)}<br>${escapeHtml(state.shipping.arrival)}</small>
        </section>
        <section class="cart-items" id="cart-items-block">
          <header class="cart-section-head"><h2>购物清单</h2><span>已选 ${selectedCount} 件 / 共 ${state.items.length} 项</span></header>
          ${renderProductRows()}
        </section>
        <section class="cart-summary" id="cart-summary-block">
          <div class="cart-summary-row"><span>商品小计</span><strong>${money(sum.subtotal)}</strong></div>
          ${sum.original > sum.subtotal ? `<div class="cart-summary-row"><span>原价合计</span><strong><del>${money(sum.original)}</del></strong></div>` : ""}
          <div class="cart-summary-row discount"><span>店铺优惠</span><strong>− ${money(state.pricing.discount)}</strong></div>
          <div class="cart-summary-row discount"><span>优惠券</span><strong>− ${money(state.pricing.coupon)}</strong></div>
          <div class="cart-summary-row"><span>运费</span><strong>${state.pricing.shipping ? money(state.pricing.shipping) : "免运费"}</strong></div>
          ${state.pricing.service ? `<div class="cart-summary-row"><span>服务费</span><strong>${money(state.pricing.service)}</strong></div>` : ""}
          ${state.pricing.tax ? `<div class="cart-summary-row"><span>税费</span><strong>${money(state.pricing.tax)}</strong></div>` : ""}
          ${state.shipping.note ? `<p class="cart-note"><b>订单备注</b><br>${escapeHtml(state.shipping.note)}</p>` : ""}
          <div class="cart-total"><span>合计 · ${selectedCount} 件</span><strong>${money(sum.total)}</strong></div>
          <button class="cart-checkout" type="button" data-canvas-checkout>${escapeHtml(state.pricing.checkoutLabel)} · ${money(sum.total)}</button>
        </section>
      </main>
    `;
    requestAnimationFrame(updateCanvasScale);
  }

  function renderAll() {
    renderThemeGrid();
    renderItemList();
    renderSelectedItemEditor();
    syncEditors();
    renderCanvas();
    updateHistoryButtons();
  }

  function addItem() {
    pushHistory();
    const item = {
      id: uid("product"),
      selected: true,
      store: "新店铺",
      name: "新商品",
      variant: "默认规格",
      price: 0,
      originalPrice: 0,
      quantity: 1,
      stock: "现货",
      badge: "",
      image: ""
    };
    state.items.push(item);
    state.selectedItemId = item.id;
    renderAll();
    scheduleSave();
    requestAnimationFrame(() => $("#selected-item-card")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function itemAction(action, itemId) {
    const index = state.items.findIndex((item) => item.id === itemId);
    if (index < 0) return;
    pushHistory();
    if (action === "up" && index > 0) {
      [state.items[index - 1], state.items[index]] = [state.items[index], state.items[index - 1]];
    } else if (action === "down" && index < state.items.length - 1) {
      [state.items[index + 1], state.items[index]] = [state.items[index], state.items[index + 1]];
    } else if (action === "copy") {
      const copy = { ...clone(state.items[index]), id: uid("product"), name: `${state.items[index].name} 副本` };
      state.items.splice(index + 1, 0, copy);
      state.selectedItemId = copy.id;
    } else if (action === "delete") {
      state.items.splice(index, 1);
      state.selectedItemId = state.items[Math.min(index, state.items.length - 1)]?.id || "";
    }
    renderAll();
    scheduleSave();
  }

  function safeSetStorage(key, value) {
    try { localStorage.setItem(key, value); } catch { /* layout preference may stay session-only */ }
  }

  function updateCanvasScale() {
    if (!canvas || !stage || !viewport) return;
    const availableWidth = Math.max(1, viewport.clientWidth - (matchMedia("(max-width: 900px)").matches ? 0 : 36));
    const scale = Math.min(1, availableWidth / canvas.offsetWidth);
    canvas.style.transform = `scale(${scale})`;
    stage.style.width = `${canvas.offsetWidth * scale}px`;
    stage.style.height = `${Math.max(canvas.scrollHeight, canvas.offsetHeight) * scale}px`;
  }

  function setMobilePanel(panel) {
    document.body.dataset.mobilePanel = panel;
    $$("[data-mobile-tab]").forEach((button) => button.classList.toggle("active", button.dataset.mobileTab === panel));
    requestAnimationFrame(updateCanvasScale);
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

  function updateCropTransform() {
    const cropStage = $("#image-crop-stage");
    const image = $("#image-crop-image");
    if (!crop.naturalWidth || !cropStage.clientWidth) return;
    const size = cropStage.clientWidth;
    const scaledWidth = crop.naturalWidth * crop.baseScale * crop.zoom;
    const scaledHeight = crop.naturalHeight * crop.baseScale * crop.zoom;
    const maxX = Math.max(0, (scaledWidth - size) / 2);
    const maxY = Math.max(0, (scaledHeight - size) / 2);
    crop.x = Math.min(maxX, Math.max(-maxX, crop.x));
    crop.y = Math.min(maxY, Math.max(-maxY, crop.y));
    image.style.width = `${crop.naturalWidth * crop.baseScale}px`;
    image.style.height = `${crop.naturalHeight * crop.baseScale}px`;
    image.style.transform = `translate(-50%, -50%) translate(${crop.x}px, ${crop.y}px) scale(${crop.zoom})`;
    $("#image-crop-zoom-output").textContent = `${Math.round(crop.zoom * 100)}%`;
  }

  function openCrop(source, target) {
    const config = CROP_CONFIGS[target.type];
    const modal = $("#image-crop-modal");
    const image = $("#image-crop-image");
    crop.source = source;
    crop.type = target.type;
    crop.itemId = target.itemId || "";
    crop.zoom = 1;
    crop.x = 0;
    crop.y = 0;
    crop.naturalWidth = 0;
    crop.naturalHeight = 0;
    modal.dataset.cropType = crop.type;
    $("#image-crop-title").textContent = config.title;
    $("#image-crop-ratio").textContent = config.label;
    $("#image-crop-zoom").value = "1";
    $("#image-crop-zoom-output").textContent = "100%";
    modal.hidden = false;
    document.body.classList.add("image-crop-open");
    image.onload = () => {
      const size = $("#image-crop-stage").clientWidth || 320;
      crop.naturalWidth = image.naturalWidth;
      crop.naturalHeight = image.naturalHeight;
      crop.baseScale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
      updateCropTransform();
    };
    image.src = source;
    $("#apply-image-crop").focus();
  }

  function closeCrop() {
    $("#image-crop-modal").hidden = true;
    document.body.classList.remove("image-crop-open");
    crop.source = "";
    crop.dragging = false;
    $("#image-crop-image").removeAttribute("src");
  }

  async function applyCrop() {
    const config = CROP_CONFIGS[crop.type];
    const image = $("#image-crop-image");
    const cropStage = $("#image-crop-stage");
    const button = $("#apply-image-crop");
    if (!config || !crop.source || !crop.naturalWidth) return;
    button.disabled = true;
    try {
      const size = cropStage.clientWidth || 320;
      const scale = crop.baseScale * crop.zoom;
      const displayedWidth = crop.naturalWidth * scale;
      const displayedHeight = crop.naturalHeight * scale;
      const imageLeft = size / 2 + crop.x - displayedWidth / 2;
      const imageTop = size / 2 + crop.y - displayedHeight / 2;
      const sourceSize = size / scale;
      const sourceX = Math.max(0, Math.min(crop.naturalWidth - sourceSize, -imageLeft / scale));
      const sourceY = Math.max(0, Math.min(crop.naturalHeight - sourceSize, -imageTop / scale));
      const output = document.createElement("canvas");
      output.width = config.output;
      output.height = config.output;
      const context = output.getContext("2d");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, output.width, output.height);
      context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, output.width, output.height);
      const reference = await imageStore.storeDataUrl(output.toDataURL("image/jpeg", config.quality));
      pushHistory();
      if (crop.type === "avatar") {
        state.account.avatar = reference;
      } else {
        const item = state.items.find((entry) => entry.id === crop.itemId);
        if (!item) throw new Error("item-missing");
        item.image = reference;
      }
      const completed = crop.type;
      closeCrop();
      renderAll();
      scheduleSave();
      showToast(completed === "avatar" ? "账户头像裁切已完成" : "商品图片裁切已完成");
    } catch {
      showToast("图片裁切失败，请重新选择图片");
    } finally {
      button.disabled = false;
    }
  }

  function setupCrop() {
    const cropStage = $("#image-crop-stage");
    const zoom = $("#image-crop-zoom");
    cropStage.addEventListener("pointerdown", (event) => {
      crop.dragging = true;
      crop.startX = event.clientX;
      crop.startY = event.clientY;
      crop.originX = crop.x;
      crop.originY = crop.y;
      cropStage.setPointerCapture(event.pointerId);
    });
    cropStage.addEventListener("pointermove", (event) => {
      if (!crop.dragging) return;
      crop.x = crop.originX + event.clientX - crop.startX;
      crop.y = crop.originY + event.clientY - crop.startY;
      updateCropTransform();
    });
    cropStage.addEventListener("pointerup", () => { crop.dragging = false; });
    cropStage.addEventListener("pointercancel", () => { crop.dragging = false; });
    zoom.addEventListener("input", () => {
      crop.zoom = Number(zoom.value);
      updateCropTransform();
    });
    $$("[data-close-image-crop]").forEach((button) => button.addEventListener("click", closeCrop));
    $("#apply-image-crop").addEventListener("click", applyCrop);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !$("#image-crop-modal").hidden) closeCrop();
    });
    window.addEventListener("resize", () => {
      if ($("#image-crop-modal").hidden || !crop.naturalWidth) return;
      const size = cropStage.clientWidth || 320;
      crop.baseScale = Math.max(size / crop.naturalWidth, size / crop.naturalHeight);
      crop.x = 0;
      crop.y = 0;
      updateCropTransform();
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
    return String(value || "oc-cart").replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "-").slice(0, 80);
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
      showToast("购物车项目已导入");
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
      const height = state.style.device === "phone" ? 844 : 760;
      canvas.classList.add("export-fixed");
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
      showToast(`${suffix} PNG 已导出`);
    } catch {
      showToast("导出失败，请减少图片尺寸后重试");
    } finally {
      canvas.style.transform = previousTransform;
      canvas.style.height = previousHeight;
      canvas.style.minHeight = previousMinHeight;
      canvas.style.overflow = previousOverflow;
      canvas.classList.remove("is-exporting", "export-fixed");
      exporting = false;
      updateCanvasScale();
    }
  }

  function exportSection(section) {
    if (section === "fixed") return exportNode(canvas, "固定屏幕", true);
    const targets = {
      account: [$("#cart-account-block"), "账户卡"],
      items: [$("#cart-items-block"), "商品列表"],
      summary: [$("#cart-summary-block"), "结算卡"]
    };
    const target = targets[section];
    if (!target?.[0]) return showToast("当前没有可导出的内容");
    exportNode(target[0], target[1]);
  }

  function applyControl(target) {
    if (target.id === "project-name") {
      state.projectName = target.value;
      scheduleSave();
      return true;
    }
    if (target.dataset.accountField) {
      state.account[target.dataset.accountField] = target.value;
      renderCanvas();
      if (target.dataset.accountField === "name" && !state.account.avatar) {
        $("#account-avatar-preview").textContent = initials(state.account.name);
      }
      scheduleSave();
      return true;
    }
    if (target.dataset.shippingField) {
      state.shipping[target.dataset.shippingField] = target.value;
      renderCanvas();
      scheduleSave();
      return true;
    }
    if (target.dataset.pricingField) {
      const field = target.dataset.pricingField;
      state.pricing[field] = target.type === "number" ? Math.max(0, number(target.value)) : target.value;
      renderItemList();
      renderCanvas();
      scheduleSave();
      return true;
    }
    if (target.dataset.itemField) {
      const item = state.items.find((entry) => entry.id === target.dataset.itemId);
      if (!item) return true;
      const field = target.dataset.itemField;
      if (["price", "originalPrice"].includes(field)) item[field] = Math.max(0, number(target.value));
      else if (field === "quantity") item.quantity = Math.max(1, Math.round(number(target.value, 1)));
      else item[field] = target.value;
      renderItemList();
      renderCanvas();
      scheduleSave();
      return true;
    }
    if (target.dataset.styleField) {
      const field = target.dataset.styleField;
      state.style[field] = target.type === "checkbox"
        ? target.checked
        : target.type === "range"
          ? Number(target.value)
          : target.value;
      syncEditors();
      renderCanvas();
      scheduleSave();
      return true;
    }
    if (target.dataset.colorField) {
      state.style.colors[target.dataset.colorField] = target.value;
      renderCanvas();
      scheduleSave();
      return true;
    }
    return false;
  }

  document.addEventListener("focusin", (event) => {
    if (event.target.matches("input, textarea, select") && !event.target.closest(".top-actions")) {
      inputCheckpoint = clone(state);
    }
  });

  document.addEventListener("input", (event) => {
    applyControl(event.target);
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
    if (target === $("#account-avatar-input") && target.files?.[0]) {
      const file = target.files[0];
      target.value = "";
      readImageFile(file).then((source) => openCrop(source, { type: "avatar" })).catch(() => showToast("头像无法读取或超过 15MB"));
      return;
    }
    if (target.matches("[data-product-image]") && target.files?.[0]) {
      const file = target.files[0];
      const itemId = target.dataset.productImage;
      target.value = "";
      readImageFile(file).then((source) => openCrop(source, { type: "product", itemId })).catch(() => showToast("商品图片无法读取或超过 15MB"));
      return;
    }
    if (target.dataset.itemSelected) {
      const item = state.items.find((entry) => entry.id === target.dataset.itemSelected);
      if (item) {
        pushHistory();
        item.selected = target.checked;
      }
      renderItemList();
      renderCanvas();
      scheduleSave();
      return;
    }
    if (target.matches("select, input[type='checkbox']")) applyControl(target);
  });

  document.addEventListener("click", (event) => {
    const mobileTab = event.target.closest("[data-mobile-tab]");
    if (mobileTab) return setMobilePanel(mobileTab.dataset.mobileTab);

    const themeButton = event.target.closest("[data-theme]");
    if (themeButton) {
      pushHistory();
      state.style.theme = themeButton.dataset.theme;
      state.style.colors = clone(THEMES[state.style.theme].colors);
      renderAll();
      scheduleSave();
      return;
    }

    const actionButton = event.target.closest("[data-item-action]");
    if (actionButton) {
      itemAction(actionButton.dataset.itemAction, actionButton.dataset.itemId);
      return;
    }

    const selected = event.target.closest("[data-select-item]");
    if (selected && !event.target.matches("input, button")) {
      state.selectedItemId = selected.dataset.selectItem;
      renderItemList();
      renderSelectedItemEditor();
      return;
    }

    const removeProduct = event.target.closest("[data-remove-product-image]");
    if (removeProduct) {
      const item = state.items.find((entry) => entry.id === removeProduct.dataset.removeProductImage);
      if (!item?.image) return;
      pushHistory();
      item.image = "";
      renderAll();
      scheduleSave();
      return;
    }

    const toggle = event.target.closest("[data-canvas-toggle]");
    if (toggle) {
      const item = state.items.find((entry) => entry.id === toggle.dataset.canvasToggle);
      if (!item) return;
      pushHistory();
      item.selected = !item.selected;
      renderAll();
      scheduleSave();
      return;
    }

    const quantity = event.target.closest("[data-canvas-quantity]");
    if (quantity) {
      const item = state.items.find((entry) => entry.id === quantity.dataset.itemId);
      if (!item) return;
      pushHistory();
      item.quantity = Math.max(1, item.quantity + Number(quantity.dataset.canvasQuantity));
      renderAll();
      scheduleSave();
      return;
    }

    if (event.target.closest("[data-canvas-checkout]")) {
      showToast("这是虚构结算按钮，不会产生真实订单");
      return;
    }

    const exportButton = event.target.closest("[data-export-section]");
    if (exportButton) return exportSection(exportButton.dataset.exportSection);
  });

  $("#add-item").addEventListener("click", addItem);
  $("#undo").addEventListener("click", undo);
  $("#redo").addEventListener("click", redo);
  $("#save-json").addEventListener("click", exportJson);
  $("#export-full").addEventListener("click", () => exportNode(canvas, "完整购物车"));
  $("#export-long").addEventListener("click", () => exportNode(canvas, "完整购物车"));
  $("#remove-account-avatar").addEventListener("click", () => {
    if (!state.account.avatar) return;
    pushHistory();
    state.account.avatar = "";
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
    showToast("已新建购物车项目");
  });

  window.addEventListener("resize", updateCanvasScale);
  canvas.addEventListener("load", () => requestAnimationFrame(updateCanvasScale), true);
  if ("ResizeObserver" in window) new ResizeObserver(() => requestAnimationFrame(updateCanvasScale)).observe(canvas);
  setupCrop();
  setupTour();
  setupMobileResizer();
  renderAll();
  if (!tutorialSeen()) window.setTimeout(openTour, 650);
  initializeImageStorage();
})();




