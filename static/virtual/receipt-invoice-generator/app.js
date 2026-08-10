(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const STORAGE_KEY = "oc-receipt-invoice-generator-v1";
  const MOBILE_SPLIT_KEY = "oc-receipt-invoice-mobile-preview-ratio";
  const TUTORIAL_KEY = "oc-receipt-invoice-tutorial-v1";
  const imageStore = window.OCImageStore.create({ databaseName: "oc-receipt-invoice-assets-v1" });
  const canvas = $("#document-canvas");
  const stage = $("#preview-stage");
  const viewport = $("#preview-viewport");
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));
  const uid = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
  const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const escapeHtml = (value) => String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");

  const TEMPLATES = {
    receipt: {
      thermal: { name: "标准热敏", english: "THERMAL BASIC", colors: { accent:"#38343a", paper:"#fffefa", ink:"#242126", muted:"#716b73", line:"#cfc8ce" } },
      cafe: { name: "咖啡小票", english: "CAFE COUNTER", colors: { accent:"#8b5d47", paper:"#fffaf0", ink:"#322721", muted:"#806f66", line:"#d8c6b8" } },
      retail: { name: "复古零售", english: "RETAIL REGISTER", colors: { accent:"#a33c48", paper:"#f7f0df", ink:"#29231f", muted:"#74685e", line:"#bfb09e" } },
      pixel: { name: "像素小票", english: "PIXEL RECEIPT", colors: { accent:"#71805d", paper:"#f3f0dc", ink:"#252b22", muted:"#697061", line:"#929b82" } }
    },
    invoice: {
      classic: { name: "经典企业", english: "CLASSIC OFFICE", colors: { accent:"#5c657f", paper:"#fffefa", ink:"#242731", muted:"#747986", line:"#d0d2d9" } },
      editorial: { name: "编辑部", english: "EDITORIAL BILL", colors: { accent:"#9c604d", paper:"#fffaf3", ink:"#2d2725", muted:"#7c706b", line:"#d7ccc6" } },
      ledger: { name: "会计账册", english: "LEDGER GRID", colors: { accent:"#506963", paper:"#fbfaf5", ink:"#26302e", muted:"#6f7a77", line:"#b9c3bf" } },
      pixel: { name: "像素 Invoice", english: "PIXEL INVOICE", colors: { accent:"#4f6f8b", paper:"#f4f6f4", ink:"#242b31", muted:"#68757d", line:"#9eabb3" } }
    }
  };

  const LEGACY_TEMPLATE_COLORS = {
    invoice: {
      ledger: { accent:"#3f6d68", paper:"#f5f1df", ink:"#23302d", muted:"#66736f", line:"#899b96" },
      pixel: { accent:"#75618d", paper:"#efecda", ink:"#27232c", muted:"#6c6670", line:"#8f8498" }
    }
  };
  const FONT_MAP = {
    sans: "'Noto Sans SC','Microsoft YaHei',sans-serif",
    serif: "'Noto Serif SC','SimSun',serif",
    xiaowei: "'ZCOOL XiaoWei','Noto Serif SC',serif",
    wenkai: "'LXGW WenKai','KaiTi',serif",
    handwriting: "'Ma Shan Zheng','KaiTi',cursive",
    pixel: "'PoxiaoPixel',monospace"
  };

  const ASCII_PRESETS = {
    none: { name:"不显示", art:"" },
    thankyou: { name:"感谢牌", art:String.raw`+---------------------+
|  * * THANK YOU * *  |
|  PLEASE COME AGAIN  |
+---------------------+` },
    cat: { name:"柜台小猫", art:String.raw`       /\_/\
  ____/ o o \
 /~____  =^= /
(______)__m_m)` },
    coffee: { name:"热咖啡", art:String.raw`       (  (
        )  )
     .--------.
     |        |]
     |  CAFE  |]
     '--------'
       \____/` },
    parcel: { name:"商店门面", art:String.raw`    ______________
   /_/_/_/_/_/_/_/\
  /_/_/_/_/_/_/_/  \
  |               |
  |  []   __   [] |
  |______|__|_____|` },
    stars: { name:"花束", art:String.raw`       .-.-.
    .-(  :  )-.
   (___.:.___)
       \ | /
     --- * ---
       / | \
        /\
       [__]` },
    barcode: { name:"复古收银机", art:String.raw`    .------------.
   /  TOTAL 88  /|
  +------------+ |
  | [7][8][9]  | |
  | [4][5][6]  | /
  | [1][2][3]  |/
  '------------'` },
    doubleowls: { name:"双猫头鹰", art:String.raw`  ___     ___
 (o o)   (o o)
(  v  ) (  v  )
/--m-m- /--m-m-` },
    ostriches: { name:"高低鸵鸟", art:String.raw`         \\
  \\      (o>
  (o>     //\
  (()     V /
__||______||____
  ||      ||
          ||` },
    lyingcat: { name:"横卧猫", art:"|\\__/,|   (`\\\n_.|o o  |_   ) )\n-(((---(((--------" },
    whale: { name:"猫与鲸鱼", art:" __   __\n              __ \\ / __\n             /  \\ | /  \\\n                 \\|/\n            *,.---v---.*\n   /\\__/\\  /            \\\n   \\_  _/ /              \\\n     \\ \\_|           @ __|\n      \\                \\_\n       \\     ,__/       /\n     ~~~`~~~~~~~~~~~~~~/~~~~" },
    bigthanks: { name:"大型 THANK YOU", art:" ______  __                       __          __    __\n/\\__  _\\/\\ \\                     /\\ \\        /\\ \\  /\\ \\\n\\/_/\\ \\/\\ \\ \\___      __      ___\\ \\ \\/'\\    \\ `\\`\\\\/'/ ___   __  __\n   \\ \\ \\ \\ \\  _ `\\  /'__`\\  /' _ `\\ \\ , <     `\\ `\\ /' / __`\\/\\ \\/\\ \\\n    \\ \\ \\ \\ \\ \\ \\ \\/\\ \\L\\.\\_/\\ \\/\\ \\ \\ \\\\`\\     `\\ \\ \\/\\ \\L\\ \\ \\ \\_\\ \\\n     \\ \\_\\ \\ \\_\\ \\_\\ \\__/.\\_\\ \\_\\ \\_\\ \\_\\ \\_\\     \\ \\_\\ \\____/\\ \\____/\n      \\/*/  \\\\/*/\\/*/\\\\/\\_\\_/\\\\/*/\\/*/\\\\/*/\\/*/\\\\/*/      \\/_/\\/***/  \\\\/***/" },
    custom: { name:"自定义", art:"" }
  };

  const ASCII_PRESET_SIZE = { thankyou:9, cat:8, coffee:8, parcel:7, stars:8, barcode:8, doubleowls:8, ostriches:8, lyingcat:8, whale:7, bigthanks:5 };

  function createDefaultState() {
    const first = uid("item");
    const second = uid("item");
    return {
      version: 1,
      projectName: "雾紫商店票据档案",
      mode: "receipt",
      selectedItemId: first,
      selectedStickerId: "",
      business: {
        logo: "",
        name: "雾紫商店", subtitle: "OBJECTS · PAPER · DAILY GOODS",
        address: "南港区旧码头路 24 号\nNo. 24, Old Pier Road", phone: "+86 021 5820 0617",
        email: "hello@mistviolet.example", taxId: "CN-OC-2048-0716"
      },
      receipt: {
        orderNo: "R-20260728-0048", date: "2026-07-28 16:42", cashier: "收银员 07",
        payment: "银行卡 / CARD", footer: "THANK YOU FOR VISITING\n商品售出后请保留小票"
      },
      invoice: {
        invoiceNo: "INV-2026-0728", issueDate: "2026-07-28", dueDate: "2026-08-11",
        clientName: "岬角编辑室", clientAddress: "东岸区航标街 18 号\naccounts@cape-editorial.example",
        terms: "请于到期日前完成付款。\n银行信息：OC BANK · 0628 2048 0716", notes: "感谢您的委托。"
      },
      items: [
        { id:first, name:"黄铜票据夹", description:"BRASS · 80 MM", quantity:2, price:36 },
        { id:second, name:"档案标签纸", description:"WARM GREY · 24 PCS", quantity:1, price:28 }
      ],
      pricing: { currency:"¥", discount:8, taxRate:6, shipping:0 },
      ascii: { preset:"thankyou", custom:"", align:"center", size:10 },
      style: {
        templates:{ receipt:"thermal", invoice:"classic" }, receiptWidth:380, invoiceWidth:794,
        documentFont:"sans", fontScale:1, exportScale:2,
        colors:{
          receipt:clone(TEMPLATES.receipt.thermal.colors),
          invoice:clone(TEMPLATES.invoice.classic.colors)
        }
      },
      stickers: []
    };
  }

  function normalizeState(raw) {
    const base = createDefaultState();
    if (!raw || typeof raw !== "object") return base;
    const next = {
      ...base, ...raw,
      business:{ ...base.business, ...(raw.business || {}) },
      receipt:{ ...base.receipt, ...(raw.receipt || {}) },
      invoice:{ ...base.invoice, ...(raw.invoice || {}) },
      pricing:{ ...base.pricing, ...(raw.pricing || {}) },
      ascii:{ ...base.ascii, ...(raw.ascii || {}) },
      style:{ ...base.style, ...(raw.style || {}), templates:{ ...base.style.templates, ...(raw.style?.templates || {}) }, colors:{ ...base.style.colors, ...(raw.style?.colors || {}) } }
    };
    next.mode = ["receipt","invoice"].includes(next.mode) ? next.mode : "receipt";
    next.business.logo = imageStore.normalize(next.business.logo);
    next.items = Array.isArray(raw.items) && raw.items.length ? raw.items.map((item,index) => ({
      id:String(item?.id || uid("item")), name:String(item?.name || `商品 ${index + 1}`),
      description:String(item?.description || ""), quantity:Math.max(1,number(item?.quantity,1)), price:Math.max(0,number(item?.price))
    })) : base.items;
    next.selectedItemId = next.items.some((item) => item.id === raw.selectedItemId) ? raw.selectedItemId : next.items[0].id;
    next.stickers = Array.isArray(raw.stickers) ? raw.stickers.map((sticker) => ({
      id:String(sticker?.id || uid("sticker")), mode:["receipt","invoice"].includes(sticker?.mode) ? sticker.mode : next.mode,
      type:sticker?.type === "image" ? "image" : "text", text:String(sticker?.text || "TEXT"),
      image:imageStore.normalize(sticker?.image), x:number(sticker?.x,100), y:number(sticker?.y,100),
      width:clamp(sticker?.width || 150,40,500), scale:clamp(sticker?.scale || 1,.2,5),
      rotation:number(sticker?.rotation), align:["left","center","right"].includes(sticker?.align) ? sticker.align : "center",
      font:FONT_MAP[sticker?.font] ? sticker.font : "sans", fontSize:clamp(sticker?.fontSize || 24,8,120),
      color:String(sticker?.color || "#6e5a7e"), weight:sticker?.weight === "700" ? "700" : "400", lineHeight:clamp(sticker?.lineHeight || 1.25,.8,2)
    })) : [];
    next.selectedStickerId = next.stickers.some((item) => item.id === raw.selectedStickerId && item.mode === next.mode) ? raw.selectedStickerId : "";
    next.ascii.preset = ASCII_PRESETS[next.ascii.preset] ? next.ascii.preset : "thankyou";
    next.ascii.align = ["left","center","right"].includes(next.ascii.align) ? next.ascii.align : "center";
    next.ascii.size = clamp(next.ascii.size || 10,5,16);
    next.style.templates.receipt = TEMPLATES.receipt[next.style.templates.receipt] ? next.style.templates.receipt : "thermal";
    next.style.templates.invoice = TEMPLATES.invoice[next.style.templates.invoice] ? next.style.templates.invoice : "classic";
    next.style.receiptWidth = [320,380,440].includes(Number(next.style.receiptWidth)) ? Number(next.style.receiptWidth) : 380;
    next.style.invoiceWidth = [720,794,860].includes(Number(next.style.invoiceWidth)) ? Number(next.style.invoiceWidth) : 794;
    next.style.documentFont = FONT_MAP[next.style.documentFont] ? next.style.documentFont : "sans";
    next.style.fontScale = clamp(next.style.fontScale || 1,.82,1.28);
    next.style.exportScale = [2,3].includes(Number(next.style.exportScale)) ? Number(next.style.exportScale) : 2;
    ["receipt","invoice"].forEach((mode) => {
      const preset = TEMPLATES[mode][next.style.templates[mode]].colors;
      const current = next.style.colors[mode] || {};
      const legacy = LEGACY_TEMPLATE_COLORS[mode]?.[next.style.templates[mode]];
      const usesLegacyDefault = legacy && Object.entries(legacy).every(([key,value]) => current[key] === value);
      next.style.colors[mode] = usesLegacyDefault ? clone(preset) : { ...preset, ...current };
    });
    return next;
  }

  function loadState() {
    try { return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY) || "null")); }
    catch { return createDefaultState(); }
  }

  let state = loadState();
  let history = [];
  let future = [];
  let saveTimer = 0;
  let toastTimer = 0;
  let inputBefore = null;
  let transformSession = null;

  const TOUR_STEPS = [
    { target:"#mode-card", panel:"content", title:"选择票据类型", copy:"先选择机打小票或 Invoice。两种模式分别保留自己的模板与贴纸，商品和商家资料可以共用。" },
    { target:"#business-card", panel:"content", title:"填写商家资料", copy:"上传 Logo，并填写名称、副标题、地址和联系方式。Logo 会显示在商店名称上方，也会随 JSON 备份保存。" },
    { target:"#mode-fields-card", panel:"content", title:"补充票据信息", copy:"小票模式可填写交易编号、时间和支付方式；Invoice 模式可填写客户、日期、付款条款与备注。" },
    { target:"#items-card", panel:"content", title:"编辑商品与金额", copy:"新增商品后，在列表中选择条目并填写名称、规格、数量和单价。下方可设置折扣、税率和服务费。" },
    { target:"#ascii-card", panel:"content", title:"加入 ASCII 图案", copy:"在 Total 下方选择内置图案或输入自定义字符画，并调整对齐方式与字号。" },
    { target:".preview-toolbar", title:"检查并分区导出", copy:"中间画布会实时更新。预览栏可单独导出票头、商品明细、合计区或贴纸层。" },
    { target:"#templates-card", panel:"style", title:"选择模板与排版", copy:"切换小票或 Invoice 模板，再调整字体、字号、纸张和文字颜色。每种模式会保留自己的模板色板。" },
    { target:"#stickers-card", panel:"style", title:"添加贴纸并完成导出", copy:"文字和图片贴纸可以在画布中拖动、缩放和旋转。完成后选择导出倍率，保存完整 PNG；JSON 用于备份和迁移。" }
  ];
  let tourIndex = -1;
  let tourPreviousMobilePanel = "content";

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"),2200);
  }

  function imageBindings(project) {
    const bindings = [];
    if (project.business?.logo) bindings.push({ container:project.business,key:"logo" });
    return bindings.concat(project.stickers.filter((item) => item.type === "image").map((item) => ({ container:item,key:"image" })));
  }
  async function migrateImages(project) {
    for (const binding of imageBindings(project)) {
      if (imageStore.isDataImage(binding.container[binding.key])) binding.container[binding.key] = await imageStore.storeDataUrl(binding.container[binding.key]);
    }
  }

  async function portableState() {
    const portable = clone(state);
    for (const binding of imageBindings(portable)) binding.container[binding.key] = await imageStore.toDataUrl(binding.container[binding.key]);
    return portable;
  }

  async function saveState() {
    try {
      await migrateImages(state);
      localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
    } catch { showToast("浏览器存储失败，请保存 JSON 备份"); }
  }

  function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(saveState,180); }
  function pushSnapshot(snapshot = clone(state)) { history.push(snapshot); if (history.length > 60) history.shift(); future = []; }
  function applyHistory(source,target) {
    if (!source.length) return;
    target.push(clone(state));
    state = normalizeState(source.pop());
    renderAll();
    scheduleSave();
  }

  function getPath(path) { return path.split(".").reduce((value,key) => value?.[key],state); }
  function setPath(path,value) {
    const keys = path.split(".");
    const last = keys.pop();
    const target = keys.reduce((object,key) => object[key],state);
    target[last] = value;
  }
  function selectedItem() { return state.items.find((item) => item.id === state.selectedItemId) || null; }
  function activeStickers() { return state.stickers.filter((item) => item.mode === state.mode); }
  function selectedSticker() { return state.stickers.find((item) => item.id === state.selectedStickerId && item.mode === state.mode) || null; }
  function currentTemplate() { return state.style.templates[state.mode]; }
  function currentColors() { return state.style.colors[state.mode]; }
  function money(value) { return `${state.pricing.currency}${Math.max(0,number(value)).toFixed(2)}`; }
  function totals() {
    const subtotal = state.items.reduce((sum,item) => sum + item.quantity * item.price,0);
    const discount = Math.min(subtotal,Math.max(0,number(state.pricing.discount)));
    const taxable = Math.max(0,subtotal - discount);
    const tax = taxable * Math.max(0,number(state.pricing.taxRate)) / 100;
    return { subtotal,discount,tax,total:taxable + tax + Math.max(0,number(state.pricing.shipping)) };
  }

  function renderModeFields() {
    const receipt = state.mode === "receipt";
    $("#mode-fields-title").textContent = receipt ? "小票资料" : "Invoice 资料";
    $("#mode-fields-copy").textContent = receipt ? "交易编号、时间与页尾。" : "客户、日期、条款与备注。";
    $("#mode-fields").innerHTML = receipt ? `
      <div class="field-grid">
        <label class="field"><span>交易编号</span><input data-path="receipt.orderNo"></label>
        <label class="field"><span>交易时间</span><input data-path="receipt.date"></label>
      </div>
      <div class="field-grid">
        <label class="field"><span>收银员</span><input data-path="receipt.cashier"></label>
        <label class="field"><span>支付方式</span><input data-path="receipt.payment"></label>
      </div>
      <label class="field"><span>页尾文字</span><textarea data-path="receipt.footer" rows="3"></textarea></label>` : `
      <div class="field-grid">
        <label class="field"><span>Invoice 编号</span><input data-path="invoice.invoiceNo"></label>
        <label class="field"><span>开票日期</span><input data-path="invoice.issueDate"></label>
      </div>
      <label class="field"><span>到期日期</span><input data-path="invoice.dueDate"></label>
      <label class="field"><span>客户名称</span><input data-path="invoice.clientName"></label>
      <label class="field"><span>客户地址 / 联系方式</span><textarea data-path="invoice.clientAddress" rows="3"></textarea></label>
      <label class="field"><span>付款条款</span><textarea data-path="invoice.terms" rows="3"></textarea></label>
      <label class="field"><span>备注</span><textarea data-path="invoice.notes" rows="2"></textarea></label>`;
  }

  function renderBusinessLogoEditor() {
    const preview = $("#business-logo-preview");
    const source = imageStore.resolve(state.business.logo);
    preview.innerHTML = source ? `<img src="${escapeHtml(source)}" alt="当前商家 Logo">` : "<span>LOGO</span>";
    preview.classList.toggle("has-image",Boolean(source));
    $("#remove-business-logo").disabled = !state.business.logo;
  }
  function renderItemList() {
    $("#item-list").innerHTML = state.items.map((item,index) => `
      <article class="item-row ${item.id === state.selectedItemId ? "active" : ""}" data-select-item="${escapeHtml(item.id)}">
        <div><strong>${escapeHtml(item.name)}</strong><span>${item.quantity} × ${money(item.price)}</span></div>
        <div class="row-actions">
          <button data-item-action="up" data-id="${item.id}" type="button" aria-label="上移">↑</button>
          <button data-item-action="copy" data-id="${item.id}" type="button" aria-label="复制">＋</button>
          <button data-item-action="delete" data-id="${item.id}" type="button" aria-label="删除">×</button>
        </div>
      </article>`).join("");
  }

  function renderSelectedItem() {
    const item = selectedItem();
    $("#selected-item-editor").innerHTML = item ? `
      <label class="field"><span>商品名称</span><input data-item-field="name"></label>
      <label class="field"><span>描述 / 规格</span><input data-item-field="description"></label>
      <div class="field-grid">
        <label class="field"><span>数量</span><input data-item-field="quantity" type="number" min="1" step="1"></label>
        <label class="field"><span>单价</span><input data-item-field="price" type="number" min="0" step=".01"></label>
      </div>` : '<p class="empty-note">请先新增商品。</p>';
  }

  function renderThemes() {
    $("#template-copy").textContent = state.mode === "receipt" ? "四套长条小票，包含像素小票。" : "四套 Invoice 排版，包含像素 Invoice。";
    $("#theme-grid").innerHTML = Object.entries(TEMPLATES[state.mode]).map(([id,template]) => `
      <button class="theme-button ${id === currentTemplate() ? "active" : ""}" data-theme="${id}" type="button">
        <span class="theme-swatch" style="--swatch-a:${template.colors.accent};--swatch-b:${template.colors.paper}"></span>
        <span><strong>${template.name}</strong><small>${template.english}</small></span>
      </button>`).join("");
  }

  function renderSizeControl() {
    $("#document-size-control").innerHTML = state.mode === "receipt" ? `
      <label class="field"><span>小票宽度</span><select data-path="style.receiptWidth">
        <option value="320">58mm 窄票</option><option value="380">80mm 标准</option><option value="440">80mm 宽松</option>
      </select></label>` : `
      <label class="field"><span>Invoice 画布</span><select data-path="style.invoiceWidth">
        <option value="720">紧凑 A4</option><option value="794">标准 A4</option><option value="860">宽版文档</option>
      </select></label>`;
  }

  function renderAsciiEditor() {
    $("#ascii-editor").innerHTML = `
      <label class="field"><span>预设图案</span><select data-path="ascii.preset">
        ${Object.entries(ASCII_PRESETS).map(([id,preset]) => `<option value="${id}">${preset.name}</option>`).join("")}
      </select></label>
      ${state.ascii.preset === "custom" ? `<label class="field"><span>自定义 ASCII</span><textarea data-path="ascii.custom" rows="6" spellcheck="false" placeholder="使用等宽字符输入图案…"></textarea></label>` : ""}
      <div class="field-grid">
        <label class="field"><span>对齐</span><select data-path="ascii.align"><option value="left">居左</option><option value="center">居中</option><option value="right">居右</option></select></label>
        <label class="field"><span>字号</span><input data-path="ascii.size" type="number" min="5" max="16" step="1"></label>
      </div>`;
  }

  function asciiMarkup() {
    const art = state.ascii.preset === "custom" ? state.ascii.custom : ASCII_PRESETS[state.ascii.preset]?.art;
    if (!art) return "";
    const justify = { left:"flex-start", center:"center", right:"flex-end" }[state.ascii.align] || "center";
    return `<section class="ascii-block" style="--ascii-justify:${justify}"><pre style="--ascii-size:${state.ascii.size}px">${escapeHtml(art)}</pre></section>`;
  }
  function stickerLabel(sticker) { return sticker.type === "image" ? "图片贴纸" : (sticker.text.trim().split("\n")[0] || "文字贴纸"); }
  function renderStickerList() {
    const stickers = activeStickers();
    $("#sticker-list").innerHTML = stickers.length ? stickers.map((sticker,index) => `
      <article class="sticker-row ${sticker.id === state.selectedStickerId ? "active" : ""}" data-select-sticker="${sticker.id}">
        <div><strong>${escapeHtml(stickerLabel(sticker))}</strong><span>${sticker.type === "image" ? "IMAGE" : "TEXT"} · ${Math.round(sticker.rotation)}°</span></div>
        <div class="row-actions">
          <button data-sticker-action="down" data-id="${sticker.id}" type="button" aria-label="下移图层">↓</button>
          <button data-sticker-action="up" data-id="${sticker.id}" type="button" aria-label="上移图层">↑</button>
          <button data-sticker-action="copy" data-id="${sticker.id}" type="button" aria-label="复制">＋</button>
        </div>
      </article>`).join("") : '<p class="empty-note">当前票据还没有贴纸。</p>';
  }

  function renderSelectedSticker() {
    const sticker = selectedSticker();
    if (!sticker) {
      $("#selected-sticker-editor").innerHTML = '<p class="empty-note">在画布或图层列表中选择一个贴纸。</p>';
      return;
    }
    $("#selected-sticker-editor").innerHTML = `
      ${sticker.type === "text" ? `
        <label class="field"><span>文字</span><textarea data-sticker-field="text" rows="3"></textarea></label>
        <label class="field"><span>字体</span><select data-sticker-field="font">
          <option value="sans">Noto Sans SC</option><option value="serif">Noto Serif SC</option>
          <option value="xiaowei">ZCOOL 小薇</option><option value="wenkai">霞鹜文楷</option>
          <option value="handwriting">马善政毛笔体</option><option value="pixel">本地像素字体</option>
        </select></label>
        <div class="align-switch">
          <button class="${sticker.align === "left" ? "active" : ""}" data-align="left" type="button">左对齐</button>
          <button class="${sticker.align === "center" ? "active" : ""}" data-align="center" type="button">居中</button>
          <button class="${sticker.align === "right" ? "active" : ""}" data-align="right" type="button">右对齐</button>
        </div>
        <div class="sticker-controls-grid">
          <label class="field"><span>字号</span><input data-sticker-field="fontSize" type="number" min="8" max="120"></label>
          <label class="field"><span>颜色</span><input data-sticker-field="color" type="color"></label>
        </div>` : ""}
      <div class="sticker-controls-grid">
        <label class="field"><span>X 位置</span><input data-sticker-field="x" type="number"></label>
        <label class="field"><span>Y 位置</span><input data-sticker-field="y" type="number"></label>
        <label class="field"><span>基础宽度</span><input data-sticker-field="width" type="number" min="40" max="500"></label>
        <label class="field"><span>缩放</span><input data-sticker-field="scale" type="number" min=".2" max="5" step=".05"></label>
        <label class="field"><span>旋转角度</span><input data-sticker-field="rotation" type="number" step="1"></label>
      </div>
      <div class="layer-buttons">
        <button class="button compact" data-sticker-action="down" data-id="${sticker.id}" type="button">下移一层</button>
        <button class="button compact" data-sticker-action="up" data-id="${sticker.id}" type="button">上移一层</button>
        <button class="button compact" data-sticker-action="copy" data-id="${sticker.id}" type="button">复制贴纸</button>
        <button class="button compact danger-button" data-sticker-action="delete" data-id="${sticker.id}" type="button">删除贴纸</button>
      </div>`;
  }

  function receiptMarkup(sum) {
    return `<div class="document-content receipt-document">
      <header class="receipt-header" id="export-header">
        ${businessLogoMarkup()}
        <h1>${escapeHtml(state.business.name)}</h1><p class="subtitle">${escapeHtml(state.business.subtitle)}</p>
        <address>${escapeHtml(state.business.address).replaceAll("\n","<br>")}<br>${escapeHtml(state.business.phone)}</address>
      </header>
      <section class="receipt-meta">
        <span>ORDER</span><span>${escapeHtml(state.receipt.orderNo)}</span>
        <span>DATE</span><span>${escapeHtml(state.receipt.date)}</span>
        <span>${escapeHtml(state.receipt.cashier)}</span><span>${escapeHtml(state.receipt.payment)}</span>
      </section>
      <section class="receipt-items" id="export-items">${state.items.map((item) => `
        <div class="receipt-item"><strong>${escapeHtml(item.name)}</strong><span>${money(item.quantity * item.price)}</span>
        <small>${escapeHtml(item.description)} · ${item.quantity} × ${money(item.price)}</small></div>`).join("")}</section>
      <section class="receipt-totals" id="export-totals">
        <div class="receipt-total-row"><span>SUBTOTAL</span><span>${money(sum.subtotal)}</span></div>
        <div class="receipt-total-row"><span>DISCOUNT</span><span>− ${money(sum.discount)}</span></div>
        <div class="receipt-total-row"><span>TAX ${number(state.pricing.taxRate)}%</span><span>${money(sum.tax)}</span></div>
        <div class="receipt-total-row"><span>SHIPPING</span><span>${money(state.pricing.shipping)}</span></div>
        <div class="receipt-total-row grand"><span>TOTAL</span><strong>${money(sum.total)}</strong></div>
        ${asciiMarkup()}
      </section>
      <footer class="receipt-footer">${escapeHtml(state.receipt.footer)}</footer>
    </div>`;
  }

  function invoiceMarkup(sum) {
    return `<div class="document-content invoice-document">
      <header class="invoice-header" id="export-header">
        <div class="invoice-brand">${businessLogoMarkup("invoice-logo")}<h1>${escapeHtml(state.business.name)}</h1><p>${escapeHtml(state.business.subtitle)}</p></div>
        <div class="invoice-title"><b>Invoice</b><span>NO. ${escapeHtml(state.invoice.invoiceNo)}<br>ISSUED ${escapeHtml(state.invoice.issueDate)}<br>DUE ${escapeHtml(state.invoice.dueDate)}</span></div>
      </header>
      <section class="invoice-parties">
        <div class="invoice-party"><label>ISSUED BY</label><h2>${escapeHtml(state.business.name)}</h2><p>${escapeHtml(state.business.address)}\n${escapeHtml(state.business.email)}\nTAX ID ${escapeHtml(state.business.taxId)}</p></div>
        <div class="invoice-party"><label>BILL TO</label><h2>${escapeHtml(state.invoice.clientName)}</h2><p>${escapeHtml(state.invoice.clientAddress)}</p></div>
      </section>
      <table class="invoice-items" id="export-items"><thead><tr><th>DESCRIPTION</th><th>QTY</th><th>RATE</th><th>AMOUNT</th></tr></thead>
        <tbody>${state.items.map((item) => `<tr><td><b>${escapeHtml(item.name)}</b><small>${escapeHtml(item.description)}</small></td><td>${item.quantity}</td><td>${money(item.price)}</td><td>${money(item.quantity * item.price)}</td></tr>`).join("")}</tbody>
      </table>
      <section class="invoice-bottom">
        <div class="invoice-notes"><h3>Payment & Notes</h3><p>${escapeHtml(state.invoice.terms)}\n\n${escapeHtml(state.invoice.notes)}</p></div>
        <div class="invoice-totals" id="export-totals">
          <div class="invoice-total-row"><span>Subtotal</span><span>${money(sum.subtotal)}</span></div>
          <div class="invoice-total-row"><span>Discount</span><span>− ${money(sum.discount)}</span></div>
          <div class="invoice-total-row"><span>Tax ${number(state.pricing.taxRate)}%</span><span>${money(sum.tax)}</span></div>
          <div class="invoice-total-row"><span>Shipping</span><span>${money(state.pricing.shipping)}</span></div>
          <div class="invoice-total-row grand"><span>Total Due</span><strong>${money(sum.total)}</strong></div>
          ${asciiMarkup()}
        </div>
      </section>
      <footer class="invoice-footer"><span>${escapeHtml(state.business.email)}</span><span>${escapeHtml(state.business.phone)}</span></footer>
    </div>`;
  }

  function businessLogoMarkup(extraClass = "") {
    const source = imageStore.resolve(state.business.logo);
    return source ? `<img class="business-logo ${extraClass}" src="${escapeHtml(source)}" alt="">` : "";
  }
  function stickerMarkup(sticker,index) {
    const content = sticker.type === "image"
      ? `<img src="${escapeHtml(imageStore.resolve(sticker.image))}" alt="">`
      : escapeHtml(sticker.text);
    return `<div class="canvas-sticker ${sticker.type}-sticker ${sticker.id === state.selectedStickerId ? "is-selected" : ""}" data-sticker-id="${sticker.id}" style="
      left:${sticker.x}px;top:${sticker.y}px;--sticker-z:${index + 1};--sticker-width:${sticker.width}px;--sticker-scale:${sticker.scale};
      --sticker-rotation:${sticker.rotation}deg;--sticker-align:${sticker.align};--sticker-font:${FONT_MAP[sticker.font]};
      --sticker-font-size:${sticker.fontSize}px;--sticker-color:${sticker.color};--sticker-weight:${sticker.weight};--sticker-line-height:${sticker.lineHeight}">
      <div class="sticker-content">${content}</div>
      <button class="sticker-handle sticker-rotate" data-transform="rotate" type="button" aria-label="旋转贴纸"></button>
      <button class="sticker-handle sticker-resize" data-transform="resize" type="button" aria-label="缩放贴纸"></button>
    </div>`;
  }

  function renderCanvas() {
    const colors = currentColors();
    const width = state.mode === "receipt" ? state.style.receiptWidth : state.style.invoiceWidth;
    canvas.dataset.mode = state.mode;
    canvas.dataset.template = currentTemplate();
    canvas.dataset.font = state.style.documentFont;
    canvas.style.cssText = `--doc-width:${width}px;--doc-accent:${colors.accent};--doc-paper:${colors.paper};--doc-ink:${colors.ink};--doc-muted:${colors.muted};--doc-line:${colors.line || colors.muted};--doc-font-scale:${state.style.fontScale}`;
    const sum = totals();
    const stickers = activeStickers();
    canvas.innerHTML = (state.mode === "receipt" ? receiptMarkup(sum) : invoiceMarkup(sum)) +
      `<div class="sticker-layer" id="export-stickers">${stickers.map(stickerMarkup).join("")}</div>`;
    requestAnimationFrame(updateCanvasScale);
  }

  function syncControls(root = document) {
    $$("[data-path]",root).forEach((control) => {
      const value = getPath(control.dataset.path);
      if (control.type === "checkbox") control.checked = Boolean(value);
      else control.value = value ?? "";
    });
    const item = selectedItem();
    if (item) $$("[data-item-field]").forEach((control) => { control.value = item[control.dataset.itemField] ?? ""; });
    const sticker = selectedSticker();
    if (sticker) $$("[data-sticker-field]").forEach((control) => { control.value = sticker[control.dataset.stickerField] ?? ""; });
    $$("[data-color]").forEach((input) => { input.value = currentColors()[input.dataset.color]; });
    $("#font-scale-output").textContent = `${Math.round(state.style.fontScale * 100)}%`;
    $$("[data-mode]").forEach((button) => button.classList.toggle("active",button.dataset.mode === state.mode));
    $("#undo").disabled = !history.length;
    $("#redo").disabled = !future.length;
  }

  function renderAll() {
    renderBusinessLogoEditor();
    renderModeFields();
    renderItemList();
    renderSelectedItem();
    renderThemes();
    renderSizeControl();
    renderAsciiEditor();
    renderStickerList();
    renderSelectedSticker();
    renderCanvas();
    syncControls();
  }

  function updateCanvasScale() {
    if (!canvas.offsetWidth || !viewport.clientWidth) return;
    const padding = window.matchMedia("(max-width:900px)").matches ? 0 : 36;
    const scale = Math.min(1,Math.max(.1,(viewport.clientWidth - padding) / canvas.offsetWidth));
    canvas.style.transformOrigin = "top left";
    canvas.style.transform = `scale(${scale})`;
    stage.style.width = `${canvas.offsetWidth * scale}px`;
    stage.style.height = `${canvas.scrollHeight * scale}px`;
  }

  function setMobilePanel(panel) {
    document.body.dataset.mobilePanel = panel;
    $$("[data-mobile-tab]").forEach((button) => button.classList.toggle("active",button.dataset.mobileTab === panel));
    requestAnimationFrame(updateCanvasScale);
  }

  function tutorialSeen() {
    try { return localStorage.getItem(TUTORIAL_KEY) === "1"; } catch { return false; }
  }

  function markTutorialSeen() {
    try { localStorage.setItem(TUTORIAL_KEY,"1"); } catch { /* tutorial remains available for this session */ }
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
    focus.style.left = `${Math.max(4,rect.left - margin)}px`;
    focus.style.top = `${Math.max(4,rect.top - margin)}px`;
    focus.style.width = `${Math.min(window.innerWidth - 8,rect.width + margin * 2)}px`;
    focus.style.height = `${Math.min(window.innerHeight - 8,rect.height + margin * 2)}px`;
    if (window.matchMedia("(max-width:900px)").matches) {
      card.style.left = ""; card.style.top = ""; card.style.width = ""; card.style.right = ""; card.style.bottom = "";
      return;
    }
    card.style.right = "auto";
    card.style.bottom = "auto";
    card.style.width = `${Math.min(340,window.innerWidth - 24)}px`;
    const cardRect = card.getBoundingClientRect();
    const gap = 16;
    const left = clamp(rect.left,12,window.innerWidth - cardRect.width - 12);
    let top = rect.bottom + gap;
    if (top + cardRect.height > window.innerHeight - 12) top = rect.top - cardRect.height - gap;
    card.style.left = `${left}px`;
    card.style.top = `${Math.max(12,top)}px`;
  }

  function renderTourStep() {
    const step = TOUR_STEPS[tourIndex];
    if (!step) return closeTour();
    if (window.matchMedia("(max-width:900px)").matches && step.panel) setMobilePanel(step.panel);
    $("#tour-progress").textContent = `${String(tourIndex + 1).padStart(2,"0")} / ${String(TOUR_STEPS.length).padStart(2,"0")}`;
    $("#tour-title").textContent = step.title;
    $("#tour-copy").textContent = step.copy;
    $("#tour-prev").disabled = tourIndex === 0;
    $("#tour-next").textContent = tourIndex === TOUR_STEPS.length - 1 ? "完成" : "下一步";
    requestAnimationFrame(() => {
      $(step.target)?.scrollIntoView({ behavior:"smooth",block:"center",inline:"nearest" });
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
    if (window.matchMedia("(max-width:900px)").matches) setMobilePanel(tourPreviousMobilePanel);
    $("#start-tour")?.focus();
  }

  function setupTour() {
    $("#start-tour")?.addEventListener("click",openTour);
    $$('[data-close-tour]').forEach((button) => button.addEventListener("click",closeTour));
    $("#tour-prev")?.addEventListener("click",() => { if (tourIndex > 0) { tourIndex -= 1; renderTourStep(); } });
    $("#tour-next")?.addEventListener("click",() => {
      if (tourIndex === TOUR_STEPS.length - 1) return closeTour();
      tourIndex += 1;
      renderTourStep();
    });
    document.addEventListener("keydown",(event) => {
      if (tourIndex < 0) return;
      if (event.key === "Escape") closeTour();
      if (event.key === "ArrowRight") $("#tour-next")?.click();
      if (event.key === "ArrowLeft") $("#tour-prev")?.click();
    });
    window.addEventListener("resize",positionTour);
    window.addEventListener("scroll",positionTour,true);
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

  function selectSticker(id,renderEditor = true) {
    state.selectedStickerId = id;
    $$(".canvas-sticker").forEach((node) => node.classList.toggle("is-selected",node.dataset.stickerId === id));
    if (renderEditor) { renderStickerList(); renderSelectedSticker(); syncControls($("#selected-sticker-card")); }
    scheduleSave();
  }

  function beginTransform(event,kind,id) {
    const sticker = state.stickers.find((item) => item.id === id);
    const node = event.target.closest(".canvas-sticker");
    if (!sticker || !node) return;
    event.preventDefault();
    selectSticker(id);
    const rect = canvas.getBoundingClientRect();
    const visualScale = rect.width / canvas.offsetWidth;
    const centerX = rect.left + sticker.x * visualScale;
    const centerY = rect.top + sticker.y * visualScale;
    transformSession = {
      pointerId:event.pointerId, kind, sticker, node, before:clone(state),
      startX:event.clientX, startY:event.clientY, x:sticker.x, y:sticker.y, scale:sticker.scale, rotation:sticker.rotation,
      distance:Math.max(1,Math.hypot(event.clientX - centerX,event.clientY - centerY)),
      angle:Math.atan2(event.clientY - centerY,event.clientX - centerX) * 180 / Math.PI,
      centerX,centerY,visualScale
    };
    node.setPointerCapture?.(event.pointerId);
  }

  function moveTransform(event) {
    const session = transformSession;
    if (!session || event.pointerId !== session.pointerId) return;
    event.preventDefault();
    const { sticker,node } = session;
    if (session.kind === "drag") {
      sticker.x = clamp(session.x + (event.clientX - session.startX) / session.visualScale,0,canvas.offsetWidth);
      sticker.y = clamp(session.y + (event.clientY - session.startY) / session.visualScale,0,canvas.scrollHeight);
      node.style.left = `${sticker.x}px`; node.style.top = `${sticker.y}px`;
    } else if (session.kind === "resize") {
      const distance = Math.max(1,Math.hypot(event.clientX - session.centerX,event.clientY - session.centerY));
      sticker.scale = clamp(session.scale * distance / session.distance,.2,5);
      node.style.setProperty("--sticker-scale",sticker.scale);
    } else {
      const angle = Math.atan2(event.clientY - session.centerY,event.clientX - session.centerX) * 180 / Math.PI;
      sticker.rotation = Math.round(session.rotation + angle - session.angle);
      node.style.setProperty("--sticker-rotation",`${sticker.rotation}deg`);
    }
  }

  function endTransform(event) {
    if (!transformSession || event.pointerId !== transformSession.pointerId) return;
    pushSnapshot(transformSession.before);
    transformSession = null;
    renderAll();
    scheduleSave();
  }

  function itemAction(action,id) {
    const index = state.items.findIndex((item) => item.id === id);
    if (index < 0) return;
    pushSnapshot();
    if (action === "up" && index > 0) [state.items[index - 1],state.items[index]] = [state.items[index],state.items[index - 1]];
    if (action === "copy") {
      const copy = { ...clone(state.items[index]), id:uid("item"), name:`${state.items[index].name} · 副本` };
      state.items.splice(index + 1,0,copy); state.selectedItemId = copy.id;
    }
    if (action === "delete") {
      state.items.splice(index,1);
      state.selectedItemId = state.items[Math.min(index,state.items.length - 1)]?.id || "";
    }
    renderAll(); scheduleSave();
  }

  function stickerAction(action,id) {
    const modeItems = activeStickers();
    const item = state.stickers.find((sticker) => sticker.id === id);
    if (!item) return;
    pushSnapshot();
    if (action === "copy") {
      const copy = { ...clone(item),id:uid("sticker"),x:item.x + 18,y:item.y + 18 };
      state.stickers.splice(state.stickers.indexOf(item) + 1,0,copy); state.selectedStickerId = copy.id;
    } else if (action === "delete") {
      state.stickers.splice(state.stickers.indexOf(item),1);
      state.selectedStickerId = activeStickers()[0]?.id || "";
    } else {
      const modeIndex = modeItems.findIndex((sticker) => sticker.id === id);
      const targetModeIndex = action === "up" ? Math.min(modeItems.length - 1,modeIndex + 1) : Math.max(0,modeIndex - 1);
      const swap = modeItems[targetModeIndex];
      if (swap && swap !== item) {
        const a = state.stickers.indexOf(item), b = state.stickers.indexOf(swap);
        [state.stickers[a],state.stickers[b]] = [state.stickers[b],state.stickers[a]];
      }
    }
    renderAll(); scheduleSave();
  }

  async function readImage(file) {
    if (!file?.type.startsWith("image/") || file.size > 15 * 1024 * 1024) throw new Error("invalid");
    const data = await new Promise((resolve,reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    return imageStore.storeDataUrl(data);
  }

  function addTextSticker() {
    const text = $("#new-sticker-text").value.trim() || "PAID";
    pushSnapshot();
    const width = state.mode === "receipt" ? 150 : 220;
    const sticker = { id:uid("sticker"),mode:state.mode,type:"text",text,image:"",x:(state.mode === "receipt" ? state.style.receiptWidth : state.style.invoiceWidth) / 2,y:120,width,scale:1,rotation:0,align:"center",font:"xiaowei",fontSize:28,color:currentColors().accent,weight:"400",lineHeight:1.25 };
    state.stickers.push(sticker); state.selectedStickerId = sticker.id;
    $("#new-sticker-text").value = "";
    renderAll(); scheduleSave();
  }

  async function addImageSticker(file) {
    try {
      const source = await readImage(file);
      pushSnapshot();
      const width = state.mode === "receipt" ? 120 : 180;
      const sticker = { id:uid("sticker"),mode:state.mode,type:"image",text:"",image:source,x:(state.mode === "receipt" ? state.style.receiptWidth : state.style.invoiceWidth) / 2,y:140,width,scale:1,rotation:0,align:"center",font:"sans",fontSize:24,color:"#000000",weight:"400",lineHeight:1.25 };
      state.stickers.push(sticker); state.selectedStickerId = sticker.id;
      await imageStore.preload([source]);
      renderAll(); scheduleSave();
    } catch { showToast("请选择 15MB 以内的图片"); }
  }

  async function setBusinessLogo(file) {
    try {
      const source = await readImage(file);
      pushSnapshot();
      state.business.logo = source;
      await imageStore.preload([source]);
      renderAll();
      scheduleSave();
    } catch { showToast("请选择 15MB 以内的图片"); }
  }
  function downloadBlob(blob,name) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = name; link.click();
    setTimeout(() => URL.revokeObjectURL(url),1000);
  }

  async function exportNode(node,label) {
    if (!node) return showToast("当前部件不存在");
    try {
      canvas.classList.add("is-exporting");
      await document.fonts?.load('700 48px "Bodoni Moda Local"');
      await document.fonts?.ready;
      const dataUrl = await window.htmlToImage.toPng(node,{
        pixelRatio:Number(state.style.exportScale),
        cacheBust:true,
        fontEmbedCSS:window.OC_BODONI_FONT_CSS || "",
        skipFonts:true,
        backgroundColor:node === $("#export-stickers") ? "transparent" : currentColors().paper
      });
      const response = await fetch(dataUrl);
      downloadBlob(await response.blob(),`${state.projectName}-${label}.png`);
      showToast(`${label}已导出`);
    } catch { showToast("导出失败，请稍后重试"); }
    finally { canvas.classList.remove("is-exporting"); }
  }

  document.addEventListener("focusin",(event) => {
    if (event.target.matches("[data-path],[data-item-field],[data-sticker-field],[data-color]")) inputBefore = clone(state);
  });

  document.addEventListener("input",(event) => {
    const target = event.target;
    if (target.matches("[data-path]")) {
      const value = target.type === "number" || target.type === "range" || target.tagName === "SELECT" && ["style.receiptWidth","style.invoiceWidth","style.exportScale"].includes(target.dataset.path) ? number(target.value) : target.value;
      setPath(target.dataset.path,value);
      if (target.dataset.path === "ascii.preset" && ASCII_PRESET_SIZE[value]) state.ascii.size = ASCII_PRESET_SIZE[value];
    } else if (target.matches("[data-item-field]")) {
      const item = selectedItem(); if (!item) return;
      item[target.dataset.itemField] = target.type === "number" ? number(target.value) : target.value;
    } else if (target.matches("[data-sticker-field]")) {
      const sticker = selectedSticker(); if (!sticker) return;
      sticker[target.dataset.stickerField] = target.type === "number" ? number(target.value) : target.value;
    } else if (target.matches("[data-color]")) {
      currentColors()[target.dataset.color] = target.value;
    } else return;
    renderCanvas();
    $("#font-scale-output").textContent = `${Math.round(state.style.fontScale * 100)}%`;
    scheduleSave();
  });

  document.addEventListener("change",(event) => {
    if (!event.target.matches("[data-path],[data-item-field],[data-sticker-field],[data-color]")) return;
    if (inputBefore) pushSnapshot(inputBefore);
    inputBefore = null;
    renderAll();
    scheduleSave();
  });

  document.addEventListener("click",(event) => {
    const mobile = event.target.closest("[data-mobile-tab]");
    if (mobile) return setMobilePanel(mobile.dataset.mobileTab);
    const mode = event.target.closest("[data-mode]");
    if (mode) {
      if (mode.dataset.mode === state.mode) return;
      pushSnapshot(); state.mode = mode.dataset.mode;
      state.selectedStickerId = activeStickers()[0]?.id || "";
      renderAll(); scheduleSave(); return;
    }
    const theme = event.target.closest("[data-theme]");
    if (theme) {
      pushSnapshot(); state.style.templates[state.mode] = theme.dataset.theme;
      state.style.colors[state.mode] = clone(TEMPLATES[state.mode][theme.dataset.theme].colors);
      renderAll(); scheduleSave(); return;
    }

    const itemActionButton = event.target.closest("[data-item-action]");
    if (itemActionButton) return itemAction(itemActionButton.dataset.itemAction,itemActionButton.dataset.id);
    const stickerActionButton = event.target.closest("[data-sticker-action]");
    if (stickerActionButton) return stickerAction(stickerActionButton.dataset.stickerAction,stickerActionButton.dataset.id);
    const itemRow = event.target.closest("[data-select-item]");
    if (itemRow) { state.selectedItemId = itemRow.dataset.selectItem; renderItemList(); renderSelectedItem(); syncControls($("#selected-item-card")); scheduleSave(); return; }
    const stickerRow = event.target.closest("[data-select-sticker]");
    if (stickerRow) return selectSticker(stickerRow.dataset.selectSticker);
    const align = event.target.closest("[data-align]");
    if (align) {
      const sticker = selectedSticker(); if (!sticker) return;
      pushSnapshot(); sticker.align = align.dataset.align; renderAll(); scheduleSave(); return;
    }
  });

  canvas.addEventListener("pointerdown",(event) => {
    const stickerNode = event.target.closest(".canvas-sticker");
    if (!stickerNode) { selectSticker(""); return; }
    const control = event.target.closest("[data-transform]");
    beginTransform(event,control?.dataset.transform || "drag",stickerNode.dataset.stickerId);
  });
  document.addEventListener("pointermove",moveTransform,{ passive:false });
  document.addEventListener("pointerup",endTransform);
  document.addEventListener("pointercancel",endTransform);

  $("#add-item").addEventListener("click",() => {
    pushSnapshot();
    const item = { id:uid("item"),name:"新商品",description:"规格 / 说明",quantity:1,price:0 };
    state.items.push(item); state.selectedItemId = item.id; renderAll(); scheduleSave();
  });
  $("#add-text-sticker").addEventListener("click",addTextSticker);
  $("#sticker-image-input").addEventListener("change",(event) => { addImageSticker(event.target.files?.[0]); event.target.value = ""; });
  $("#business-logo-input").addEventListener("change",(event) => { setBusinessLogo(event.target.files?.[0]); event.target.value = ""; });
  $("#remove-business-logo").addEventListener("click",() => {
    if (!state.business.logo) return;
    pushSnapshot();
    state.business.logo = "";
    renderAll();
    scheduleSave();
  });
  $("#reset-colors").addEventListener("click",() => {
    pushSnapshot(); state.style.colors[state.mode] = clone(TEMPLATES[state.mode][currentTemplate()].colors); renderAll(); scheduleSave();
  });
  $("#undo").addEventListener("click",() => applyHistory(history,future));
  $("#redo").addEventListener("click",() => applyHistory(future,history));
  $("#export-full").addEventListener("click",() => exportNode(canvas,"完整票据"));
  $("#export-long").addEventListener("click",() => exportNode(canvas,"完整票据"));
  $$("[data-export-section]").forEach((button) => button.addEventListener("click",() => exportNode($(`#export-${button.dataset.exportSection}`),button.textContent.trim())));

  $("#save-json").addEventListener("click",async () => {
    const data = JSON.stringify(await portableState(),null,2);
    downloadBlob(new Blob([data],{ type:"application/json" }),`${state.projectName}.json`);
    showToast("JSON 备份已保存");
  });
  $("#import-json").addEventListener("change",async (event) => {
    try {
      const imported = normalizeState(JSON.parse(await event.target.files?.[0]?.text()));
      pushSnapshot(); state = imported; await migrateImages(state);
      await imageStore.preload(imageBindings(state).map((item) => item.container[item.key]));
      renderAll(); scheduleSave(); showToast("项目已导入");
    } catch { showToast("无法读取这个 JSON 文件"); }
    event.target.value = "";
  });
  $("#new-project").addEventListener("click",() => {
    if (!confirm("新建项目会替换当前内容，建议先保存 JSON。继续吗？")) return;
    pushSnapshot(); state = createDefaultState(); renderAll(); scheduleSave(); showToast("已新建票据项目");
  });

  window.addEventListener("resize",updateCanvasScale);
  if ("ResizeObserver" in window) new ResizeObserver(() => requestAnimationFrame(updateCanvasScale)).observe(canvas);
  setupTour();
  setupMobileResizer();
  renderAll();
  if (!tutorialSeen()) window.setTimeout(openTour,650);
  (async () => {
    await migrateImages(state);
    await imageStore.preload(imageBindings(state).map((item) => item.container[item.key]));
    renderAll();
    scheduleSave();
  })();
})();
