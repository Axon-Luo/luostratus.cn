(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const STORAGE_KEY = "oc-desktop-moodboard-v1";
  const MOBILE_SPLIT_KEY = "oc-desktop-moodboard-mobile-preview-ratio";
  const TUTORIAL_KEY = "oc-desktop-moodboard-tutorial-v1";
  const TRANSPARENT_IMAGE = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
  const imageStore = window.OCImageStore.create({ databaseName:"oc-desktop-moodboard-assets-v1" });
  const canvas = $("#desktop-canvas");
  const stage = $("#preview-stage");
  const viewport = $("#preview-viewport");
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const clamp = (value,min,max) => Math.min(max,Math.max(min,Number(value) || 0));
  const number = (value,fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const uid = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  const escapeHtml = (value) => String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");

  const THEMES = {
    win95: { name:"Windows 95", english:"CLASSIC DESKTOP", desktop:"#2f7c7b", taskbar:"#c0c0c0", accent:"#000080", frame:"win95" },
    luna: { name:"Luna 蓝色", english:"FRIENDLY SYSTEM", desktop:"#6692bd", taskbar:"#245ac4", accent:"#2e65d2", frame:"luna" },
    aero: { name:"Aero 玻璃", english:"GLASS ARCHIVE", desktop:"#7595a4", taskbar:"#263b46", accent:"#6aa5bd", frame:"aero" },
    modern: { name:"现代系统", english:"MODERN DESKTOP", desktop:"#3d4654", taskbar:"#171c22", accent:"#5b8fa1", frame:"modern" },
    mac: { name:"Classic Mac", english:"MACINTOSH MOOD", desktop:"#b7b6ad", taskbar:"#edede8", accent:"#4e6f82", frame:"mac" },
    editorial: { name:"Editorial 黑白", english:"FLAT MONO", desktop:"#f2f0e9", taskbar:"#111111", accent:"#111111", frame:"editorial" }
  };

  const FRAME_NAMES = {
    system:"跟随系统", win95:"Windows 95", luna:"Luna 蓝色", aero:"Aero 玻璃", modern:"现代扁平", mac:"Classic Macintosh", editorial:"Editorial 黑白"
  };

  const FONT_MAP = {
    sans:"'Noto Sans SC','Microsoft YaHei',sans-serif",
    serif:"'Noto Serif SC','SimSun',serif",
    xiaowei:"'ZCOOL XiaoWei','Noto Serif SC',serif",
    wenkai:"'LXGW WenKai','KaiTi',serif",
    handwriting:"'Ma Shan Zheng','KaiTi',cursive",
    pixel:"'PoxiaoPixel',monospace",
    bodoni:"'Bodoni Moda Local',Georgia,serif",
    cormorant:"'Cormorant Garamond Local',Georgia,serif",
    inter:"'Inter Local',Arial,sans-serif",
    typewriter:"'Special Elite Local','Courier New',monospace",
    meddon:"'Meddon Local',cursive"
  };


  function createDefaultState() {
    const titleId = uid("asset");
    const noteId = uid("asset");
    const terminalId = uid("asset");
    return {
      version:1,
      projectName:"夜航角色桌面",
      exportScale:2,
      selectedItemId:noteId,
      nextZ:50,
      character:{
        avatar:"",
        name:"林照夜",
        alias:"NIGHT_ARCHIVE",
        status:"ONLINE · DO NOT DISTURB",
        role:"档案修复师",
        location:"东岸区 / 23:17",
        quote:"“所有丢失的东西，都会以另一种格式回来。”",
        summary:"负责修复被损坏的私人档案。习惯把关系、记忆与未寄出的信件保存在离线电脑里。",
        tags:"旧磁盘、夜航、红茶、失物、雨天"
      },
      desktop:{
        theme:"aero",
        frameStyle:"system",
        wallpaperColor:"#657f8d",
        wallpaperImage:"",
        accent:"#6aa5bd",
        showGrid:false,
        showIconLabels:true,
        clock:"23:17",
        date:"2026 / 07 / 29",
        taskbarStatus:"LOCAL ARCHIVE · OFFLINE"
      },
      windows:{
        explorer:{ open:true,minimized:false,x:390,y:104,width:650,height:390,z:31 },
        settings:{ open:false,minimized:false,x:730,y:150,width:520,height:360,z:32 },
        start:{ open:true,minimized:false,z:35 }
      },
      items:[
        {
          id:titleId,type:"text",title:"desktop-title.txt",text:"NIGHT\nARCHIVE",image:"",
          style:"plain",frame:false,frameStyle:"system",x:895,y:54,width:430,height:155,rotation:0,opacity:1,
          color:"#f2f7f8",fontSize:58,textAlign:"left",font:"serif",z:12
        },
        {
          id:noteId,type:"text",title:"remember.txt",text:"REMEMBER:\n01. return the borrowed tape\n02. archive the rain recording\n03. do not open folder 07",image:"",
          style:"note",frame:false,frameStyle:"system",x:1080,y:220,width:270,height:176,rotation:3,opacity:.96,
          color:"#493d27",backgroundColor:"#f4dc86",fontSize:17,textAlign:"left",font:"serif",z:14
        },
        {
          id:terminalId,type:"text",title:"character_log.exe",text:"> USER: NIGHT_ARCHIVE\n> STATUS: ONLINE\n> LAST BACKUP: 23:07\n\nC:\\CHARACTER\\MEMORY\\_",image:"",
          style:"terminal",frame:true,frameStyle:"system",x:940,y:530,width:400,height:220,rotation:-1,opacity:.98,
          color:"#c4efcc",fontSize:16,textAlign:"left",font:"typewriter",z:13
        }
      ]
    };
  }

  function normalizeState(raw) {
    const base = createDefaultState();
    if (!raw || typeof raw !== "object") return base;
    const next = {
      ...base,
      ...raw,
      character:{ ...base.character,...(raw.character || {}) },
      desktop:{ ...base.desktop,...(raw.desktop || {}) },
      windows:{
        explorer:{ ...base.windows.explorer,...(raw.windows?.explorer || {}) },
        settings:{ ...base.windows.settings,...(raw.windows?.settings || {}) },
        start:{ ...base.windows.start,...(raw.windows?.start || {}) }
      }
    };
    next.character.avatar = imageStore.normalize(next.character.avatar);
    next.desktop.wallpaperImage = imageStore.normalize(next.desktop.wallpaperImage);
    next.desktop.theme = THEMES[next.desktop.theme] ? next.desktop.theme : "aero";
    next.desktop.frameStyle = FRAME_NAMES[next.desktop.frameStyle] ? next.desktop.frameStyle : "system";
    next.desktop.wallpaperColor = String(next.desktop.wallpaperColor || THEMES[next.desktop.theme].desktop);
    next.desktop.accent = String(next.desktop.accent || THEMES[next.desktop.theme].accent);
    next.desktop.showGrid = Boolean(next.desktop.showGrid);
    next.desktop.showIconLabels = next.desktop.showIconLabels !== false;
    next.exportScale = [2,3].includes(Number(next.exportScale)) ? Number(next.exportScale) : 2;
    next.items = Array.isArray(raw.items) ? raw.items.map((item,index) => ({
      id:String(item?.id || uid("asset")),
      type:item?.type === "image" ? "image" : "text",
      title:String(item?.title || `素材 ${index + 1}`),
      text:String(item?.text || ""),
      image:imageStore.normalize(item?.image),
      style:["note","terminal","plain","document"].includes(item?.style) ? item.style : "plain",
      frame:Boolean(item?.frame),
      frameStyle:FRAME_NAMES[item?.frameStyle] ? item.frameStyle : "system",
      x:clamp(item?.x ?? 200,-300,1380),
      y:clamp(item?.y ?? 150,-300,840),
      width:clamp(item?.width || 320,80,1100),
      height:item?.type === "image" ? null : clamp(item?.height || (item?.style === "terminal" ? 220 : item?.style === "note" ? 170 : item?.style === "document" ? 180 : 125),60,760),
      rotation:clamp(item?.rotation || 0,-180,180),
      opacity:clamp(item?.opacity ?? 1,.1,1),
      color:String(item?.color || "#ffffff"),
      backgroundColor:String(item?.backgroundColor || "#f4dc86"),
      fontSize:clamp(item?.fontSize || 20,8,120),
      textAlign:["left","center","right"].includes(item?.textAlign) ? item.textAlign : "left",
      font:FONT_MAP[item?.font] ? item.font : (item?.style === "terminal" ? "typewriter" : "serif"),
      z:number(item?.z,index + 10)
    })) : base.items;
    next.selectedItemId = next.items.some((item) => item.id === raw.selectedItemId) ? raw.selectedItemId : next.items[0]?.id || "";
    next.nextZ = Math.max(number(raw.nextZ,50),...next.items.map((item) => item.z + 1),40);
    ["explorer","settings"].forEach((id) => {
      const win = next.windows[id];
      win.open = Boolean(win.open);
      win.minimized = Boolean(win.minimized);
      win.x = clamp(win.x,0,1260);
      win.y = clamp(win.y,0,790);
      win.width = clamp(win.width,360,900);
      win.height = clamp(win.height,250,650);
      win.z = number(win.z,30);
    });
    next.windows.start.open = Boolean(next.windows.start.open);
    next.windows.start.z = number(next.windows.start.z,35);
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
  let windowDragSession = null;
  let layerDragSession = null;
  let suppressLayerClick = false;
  const avatarCrop = {
    source:"",naturalWidth:0,naturalHeight:0,baseScale:1,zoom:1,x:0,y:0,
    dragging:false,startX:0,startY:0,originX:0,originY:0
  };
  const TOUR_STEPS = [
    { target:"#character-editor-card",panel:"content",title:"建立角色档案",copy:"先填写姓名、代号、状态、身份、地点、引言与简介。上传头像后会打开裁切窗口，可以拖动和缩放取景。" },
    { target:"#asset-add-card",panel:"content",title:"添加桌面素材",copy:"输入文字可以建立便签、终端、无框标题或文本文档；也可以上传多张图片作为桌面贴纸。" },
    { target:"#selected-asset-card",panel:"content",title:"编辑当前素材",copy:"选中素材后可调整文字、字体、颜色、对齐、便签背景、外框、位置、宽高、旋转与透明度，也能复制或改变图层。" },
    { target:".preview-toolbar",title:"在画布上直接操作",copy:"拖动素材主体可以移动；右下角手柄控制宽高，顶部手柄负责旋转。资源管理器、设置和开始菜单也能直接打开。" },
    { target:"#theme-grid",panel:"style",title:"选择电脑系统模板",copy:"六套桌面模板会同时改变桌面、窗口与任务栏；壁纸、强调色和窗口外框仍可继续单独调整。" },
    { target:"#focus-mode",title:"使用专注模式截图",copy:"专注模式会隐藏编辑界面并让桌面适配整个屏幕，选框与手柄也会消失。等待右上角控制条隐藏后即可截图。" },
    { target:"#export-card",panel:"style",title:"高清导出与自动保存",copy:"选择 2× 或 3× 倍率后导出完整 PNG。项目会自动保存到当前浏览器，JSON 适合备份或换设备迁移。" },
    { target:"#export-full",title:"完成你的角色桌面",copy:"顶部按钮可以随时导出，教程按钮可以重新打开本引导。之后继续添加素材，桌面档案区也会自动更新。" }
  ];
  let tourIndex = -1;
  let tourPreviousMobilePanel = "content";

  function selectedItem() { return state.items.find((item) => item.id === state.selectedItemId) || null; }
  function getPath(path) { return path.split(".").reduce((value,key) => value?.[key],state); }
  function setPath(path,value) {
    const keys = path.split(".");
    const last = keys.pop();
    const target = keys.reduce((object,key) => object[key],state);
    target[last] = value;
  }
  function currentFrameStyle(item = null) {
    const selected = item?.frameStyle || state.desktop.frameStyle;
    if (selected && selected !== "system") return selected;
    return THEMES[state.desktop.theme].frame;
  }
  function tags() {
    return String(state.character.tags || "").split(/[、,，]/).map((item) => item.trim()).filter(Boolean).slice(0,12);
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"),2200);
  }

  function tutorialSeen() {
    try { return localStorage.getItem(TUTORIAL_KEY) === "1"; } catch { return false; }
  }

  function markTutorialSeen() {
    try { localStorage.setItem(TUTORIAL_KEY,"1"); } catch {}
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
    focus.style.left = Math.max(4,rect.left - margin) + "px";
    focus.style.top = Math.max(4,rect.top - margin) + "px";
    focus.style.width = Math.min(window.innerWidth - 8,rect.width + margin * 2) + "px";
    focus.style.height = Math.min(window.innerHeight - 8,rect.height + margin * 2) + "px";
    if (window.matchMedia("(max-width:900px)").matches) {
      card.style.left = "";
      card.style.top = "";
      card.style.width = "";
      card.style.right = "";
      card.style.bottom = "";
      return;
    }
    card.style.right = "auto";
    card.style.bottom = "auto";
    card.style.width = Math.min(350,window.innerWidth - 24) + "px";
    const cardRect = card.getBoundingClientRect();
    const gap = 16;
    const left = clamp(rect.left,12,window.innerWidth - cardRect.width - 12);
    let top = rect.bottom + gap;
    if (top + cardRect.height > window.innerHeight - 12) top = rect.top - cardRect.height - gap;
    card.style.left = left + "px";
    card.style.top = Math.max(12,top) + "px";
  }

  function renderTourStep() {
    const step = TOUR_STEPS[tourIndex];
    if (!step) return closeTour();
    if (window.matchMedia("(max-width:900px)").matches && step.panel) setMobilePanel(step.panel);
    $("#tour-progress").textContent = String(tourIndex + 1).padStart(2,"0") + " / " + String(TOUR_STEPS.length).padStart(2,"0");
    $("#tour-title").textContent = step.title;
    $("#tour-copy").textContent = step.copy;
    $("#tour-prev").disabled = tourIndex === 0;
    $("#tour-next").textContent = tourIndex === TOUR_STEPS.length - 1 ? "完成" : "下一步";
    requestAnimationFrame(() => {
      const target = $(step.target);
      target?.scrollIntoView({ behavior:"smooth",block:"center",inline:"nearest" });
      requestAnimationFrame(positionTour);
    });
  }

  function openTour() {
    if (tourIndex >= 0) return;
    markTutorialSeen();
    tourPreviousMobilePanel = document.body.dataset.mobilePanel || "content";
    tourIndex = 0;
    $("#tour-overlay").hidden = false;
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
    $$("[data-close-tour]").forEach((button) => button.addEventListener("click",closeTour));
    $("#tour-prev")?.addEventListener("click",() => {
      if (tourIndex <= 0) return;
      tourIndex -= 1;
      renderTourStep();
    });
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
  function imageBindings(project) {
    const bindings = [];
    if (project.character?.avatar) bindings.push({ container:project.character,key:"avatar" });
    if (project.desktop?.wallpaperImage) bindings.push({ container:project.desktop,key:"wallpaperImage" });
    (project.items || []).filter((item) => item.type === "image" && item.image)
      .forEach((item) => bindings.push({ container:item,key:"image" }));
    return bindings;
  }

  async function migrateImages(project) {
    for (const binding of imageBindings(project)) {
      if (imageStore.isDataImage(binding.container[binding.key])) {
        binding.container[binding.key] = await imageStore.storeDataUrl(binding.container[binding.key]);
      }
    }
  }

  async function portableState() {
    const portable = clone(state);
    for (const binding of imageBindings(portable)) {
      binding.container[binding.key] = await imageStore.toDataUrl(binding.container[binding.key]);
    }
    return portable;
  }

  async function saveState() {
    try {
      await migrateImages(state);
      localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
    } catch {
      showToast("浏览器存储失败，请保存 JSON 备份");
    }
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveState,180);
  }

  function pushSnapshot(snapshot = clone(state)) {
    history.push(snapshot);
    if (history.length > 60) history.shift();
    future = [];
  }

  function applyHistory(source,target) {
    if (!source.length) return;
    target.push(clone(state));
    state = normalizeState(source.pop());
    renderAll();
    scheduleSave();
  }

  function renderThemes() {
    $("#theme-grid").innerHTML = Object.entries(THEMES).map(([id,theme]) => `
      <button class="theme-button ${id === state.desktop.theme ? "active" : ""}" data-theme="${id}" type="button">
        <span class="theme-swatch" style="--swatch-desktop:${theme.desktop};--swatch-bar:${theme.taskbar}"></span>
        <span><strong>${theme.name}</strong><small>${theme.english}</small></span>
      </button>`).join("");
  }

  function assetLabel(item) {
    if (item.type === "image") return "IMAGE";
    return { note:"NOTE",terminal:"TERMINAL",plain:"TEXT",document:"DOCUMENT" }[item.style] || "TEXT";
  }

  function layerEntries() {
    const systemLayers = [
      { key:"window:start",kind:"window",id:"start",title:"开始菜单",label:"MENU",z:number(state.windows.start.z,35),open:state.windows.start.open },
      { key:"window:explorer",kind:"window",id:"explorer",title:"资源管理器",label:"WINDOW",z:number(state.windows.explorer.z,31),open:state.windows.explorer.open && !state.windows.explorer.minimized }
    ];
    const itemLayers = state.items.map((item) => ({ key:`item:${item.id}`,kind:"item",id:item.id,item,z:number(item.z,10) }));
    return [...systemLayers,...itemLayers].sort((a,b) => b.z - a.z);
  }

  function setLayerZ(key,z) {
    if (key.startsWith("item:")) {
      const item = state.items.find((entry) => entry.id === key.slice(5));
      if (item) item.z = z;
      return;
    }
    const id = key.slice(7);
    if (state.windows[id]) state.windows[id].z = z;
  }

  function applyLayerOrder(keys) {
    const total = keys.length;
    keys.forEach((key,index) => setLayerZ(key,20 + (total - index) * 2));
    state.nextZ = Math.max(50,state.windows.settings.z + 1,...state.items.map((item) => item.z + 1),state.windows.explorer.z + 1,state.windows.start.z + 1);
  }

  function renderAssetList() {
    const entries = layerEntries();
    $("#asset-list").innerHTML = entries.map((entry) => {
      if (entry.kind === "window") {
        return `<article class="asset-row system-layer" data-layer-key="${entry.key}" data-layer-window="${entry.id}">
          <button class="layer-drag-handle" data-layer-drag type="button" aria-label="拖动排列 ${entry.title}"><span></span><span></span><span></span></button>
          <div class="asset-thumb system-thumb">${entry.label}</div>
          <div><strong>${entry.title}</strong><span>${entry.open ? "正在显示" : "当前隐藏"} · 系统图层</span></div>
          <span class="layer-rank" aria-hidden="true">${Math.round(entry.z)}</span>
        </article>`;
      }
      const item = entry.item;
      const source = item.type === "image" ? imageStore.resolve(item.image) : "";
      return `<article class="asset-row ${item.id === state.selectedItemId ? "active" : ""}" data-layer-key="${entry.key}" data-select-asset="${item.id}">
        <button class="layer-drag-handle" data-layer-drag type="button" aria-label="拖动排列 ${escapeHtml(item.title)}"><span></span><span></span><span></span></button>
        <div class="asset-thumb">${source ? `<img src="${escapeHtml(source)}" alt="">` : escapeHtml(assetLabel(item))}</div>
        <div><strong>${escapeHtml(item.title)}</strong><span>${assetLabel(item)} · ${Math.round(item.width)}${item.type === "text" ? ` × ${Math.round(item.height)}` : ""}PX · ${Math.round(item.rotation)}°</span></div>
        <div class="row-actions">
          <button data-asset-action="copy" data-id="${item.id}" type="button" aria-label="复制">＋</button>
          <button data-asset-action="delete" data-id="${item.id}" type="button" aria-label="删除">×</button>
        </div>
      </article>`;
    }).join("");
  }
  function renderSelectedAsset() {
    const item = selectedItem();
    if (!item) {
      $("#selected-asset-editor").innerHTML = '<p class="empty-note">请先选择一个桌面素材。</p>';
      return;
    }
    $("#selected-asset-editor").innerHTML = `
      <label class="field"><span>文件 / 窗口名称</span><input data-item-field="title"></label>
      ${item.type === "text" ? `
        <label class="field"><span>文字内容</span><textarea data-item-field="text" rows="5"></textarea></label>
        <label class="field"><span>字体</span><select data-item-field="font">
          <optgroup label="中文字体">
            <option value="sans">Noto Sans SC / 黑体</option><option value="serif">Noto Serif SC / 宋体</option>
            <option value="xiaowei">ZCOOL 小薇</option><option value="wenkai">霞鹜文楷</option>
            <option value="handwriting">马善政毛笔体</option><option value="pixel">本地像素字体</option>
          </optgroup>
          <optgroup label="English Fonts">
            <option value="bodoni">Bodoni Moda</option><option value="cormorant">Cormorant Garamond · Serif</option>
            <option value="inter">Inter · Sans Serif</option><option value="typewriter">Special Elite · Typewriter</option>
            <option value="meddon">Meddon · Script</option>
          </optgroup>
        </select></label>
        <div class="field-grid">
          <label class="field"><span>文字样式</span><select data-item-field="style">
            <option value="note">便签</option><option value="terminal">终端</option>
            <option value="plain">无框文字</option><option value="document">文本文档</option>
          </select></label>
          <label class="field"><span>文字颜色</span><input data-item-field="color" type="color"></label>
        </div>
        ${item.style === "note" ? '<label class="field"><span>便签背景颜色</span><input data-item-field="backgroundColor" type="color"></label>' : ""}
        <div class="field-grid">
          <label class="field"><span>文字对齐</span><select data-item-field="textAlign"><option value="left">居左</option><option value="center">居中</option><option value="right">居右</option></select></label>
          <label class="field"><span>字号</span><input data-item-field="fontSize" type="range" min="8" max="120" step="1"></label>
        </div>` : ""}
      <label class="check-field"><input data-item-field="frame" type="checkbox"><span>使用电脑程序外框</span></label>
      <label class="field"><span>外框样式</span><select data-item-field="frameStyle">
        ${Object.entries(FRAME_NAMES).map(([id,name]) => `<option value="${id}">${name}</option>`).join("")}
      </select></label>
      <div class="field-grid">
        <label class="field"><span>X 位置</span><input data-item-field="x" type="number"></label>
        <label class="field"><span>Y 位置</span><input data-item-field="y" type="number"></label>
      </div>
      <div class="field-grid">
        <label class="field"><span>宽度</span><input data-item-field="width" type="number" min="80" max="1100"></label>
        ${item.type === "text" ? '<label class="field"><span>高度</span><input data-item-field="height" type="number" min="60" max="760"></label>' : '<label class="field"><span>旋转</span><input data-item-field="rotation" type="number" min="-180" max="180"></label>'}
      </div>
      ${item.type === "text" ? '<label class="field"><span>旋转</span><input data-item-field="rotation" type="number" min="-180" max="180"></label>' : ""}
      <label class="field"><span>透明度</span><input data-item-field="opacity" type="range" min=".1" max="1" step=".05"></label>
      <div class="window-buttons">
        <button class="button compact" data-asset-action="back" data-id="${item.id}" type="button">下移一层</button>
        <button class="button compact" data-asset-action="front" data-id="${item.id}" type="button">置于顶层</button>
        <button class="button compact" data-asset-action="copy" data-id="${item.id}" type="button">复制</button>
        <button class="button compact" data-asset-action="delete" data-id="${item.id}" type="button">删除</button>
      </div>`;
  }

  function characterAvatarMarkup() {
    const source = imageStore.resolve(state.character.avatar);
    return source ? `<img src="${escapeHtml(source)}" alt="">` : escapeHtml(state.character.name.slice(0,1) || "我");
  }

  function startMenuMarkup() {
    if (!state.windows.start.open) return "";
    const recentItems = state.items.slice(0,3);
    return `<section class="start-menu" style="--window-z:${number(state.windows.start.z,35)}">
      <div class="start-profile">
        <div class="start-avatar">${characterAvatarMarkup()}</div>
        <div class="start-profile-copy">
          <span>${escapeHtml(state.character.status)}</span>
          <h2>${escapeHtml(state.character.name)}</h2>
          <strong>@${escapeHtml(state.character.alias)}</strong>
          <p>${escapeHtml(state.character.quote)}</p>
        </div>
      </div>
      <div class="start-content">
        <p class="character-summary">${escapeHtml(state.character.summary)}</p>
        <div class="character-facts">
          <div class="character-fact"><span>ROLE</span><b>${escapeHtml(state.character.role)}</b></div>
          <div class="character-fact"><span>LOCATION</span><b>${escapeHtml(state.character.location)}</b></div>
          <div class="character-fact"><span>USER DIRECTORY</span><b>C:\\USERS\\${escapeHtml(state.character.alias)}</b></div>
        </div>
        <div class="character-tags">${tags().map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
      </div>
      <div class="start-archive">
        <div class="start-archive-head"><span>RECENT ARCHIVE</span><b>${state.items.length} RECORDS</b></div>
        <div class="start-recent-list">${recentItems.length ? recentItems.map((item,index) => `<div><span>0${index + 1}</span><b>${escapeHtml(item.title)}</b><em>${assetLabel(item)}</em></div>`).join("") : '<div><span>00</span><b>ARCHIVE IS EMPTY</b><em>OFFLINE</em></div>'}</div>
        <div class="start-system-strip">
          <span><small>LAST LOGIN</small><b>${escapeHtml(state.desktop.clock)}</b></span>
          <span><small>ACTIVE USER</small><b>${escapeHtml(state.character.alias)}</b></span>
          <span><small>BACKUP</small><b>LOCAL ONLY</b></span>
        </div>
      </div>
      <footer class="start-footer"><span>CHARACTER PROFILE</span><span>LOCAL ACCOUNT</span></footer>
    </section>`;
  }

  function windowControls(id) {
    return `<div class="window-controls">
      <button data-window-action="minimize" data-window-id="${id}" type="button" aria-label="最小化">—</button>
      <button data-window-action="maximize" data-window-id="${id}" type="button" aria-label="最大化">□</button>
      <button data-window-action="close" data-window-id="${id}" type="button" aria-label="关闭">×</button>
    </div>`;
  }

  function explorerMarkup(frameStyle) {
    const win = state.windows.explorer;
    if (!win.open || win.minimized) return "";
    return `<section class="os-window window-explorer frame-${frameStyle}" data-window-id="explorer" style="left:${win.x}px;top:${win.y}px;width:${win.width}px;height:${win.height}px;--window-z:${win.z}">
      <header class="window-titlebar"><i>F</i><strong>资源管理器 · Character Files</strong>${windowControls("explorer")}</header>
      <div class="window-body">
        <aside class="explorer-sidebar"><b>QUICK ACCESS</b><span>桌面</span><span>角色档案</span><span>图片</span><span>文本记录</span><span>离线备份</span></aside>
        <div class="explorer-content">
          <div class="explorer-heading"><strong>桌面素材</strong><span>${state.items.length} ITEMS</span></div>
          <div class="explorer-files">${state.items.length ? state.items.map((item) => {
            const source = item.type === "image" ? imageStore.resolve(item.image) : "";
            return `<button class="explorer-file ${item.id === state.selectedItemId ? "active" : ""}" data-explorer-select="${item.id}" type="button">
              <i>${source ? `<img src="${escapeHtml(source)}" alt="">` : escapeHtml(assetLabel(item))}</i>
              <span>${escapeHtml(item.title)}</span>
            </button>`;
          }).join("") : '<div class="explorer-empty">此文件夹为空</div>'}</div>
        </div>
      </div>
    </section>`;
  }

  function settingsMarkup(frameStyle) {
    const win = state.windows.settings;
    if (!win.open || win.minimized) return "";
    return `<section class="os-window window-settings frame-${frameStyle}" data-window-id="settings" style="left:${win.x}px;top:${win.y}px;width:${win.width}px;height:${win.height}px;--window-z:${win.z}">
      <header class="window-titlebar"><i>S</i><strong>系统设置 · Personalization</strong>${windowControls("settings")}</header>
      <div class="window-body">
        <h2 class="settings-title">选择电脑模板</h2>
        <div class="settings-theme-grid">${Object.entries(THEMES).map(([id,theme]) => `
          <button class="settings-theme ${id === state.desktop.theme ? "active" : ""}" data-canvas-theme="${id}" type="button">
            <i style="--setting-color:${theme.desktop}"></i><span>${theme.name}</span>
          </button>`).join("")}</div>
        <div class="settings-frame-row"><b>WINDOW FRAME · ${escapeHtml(FRAME_NAMES[state.desktop.frameStyle])}</b>
          <p>完整设置位于画布右侧。系统模板会改变桌面、任务栏和窗口；素材外框也可以单独指定。</p></div>
      </div>
    </section>`;
  }

  function itemMarkup(item) {
    const source = item.type === "image" ? imageStore.resolve(item.image) : "";
    const frame = currentFrameStyle(item);
    const content = item.type === "image"
      ? (source ? `<img src="${escapeHtml(source)}" alt="">` : "")
      : escapeHtml(item.text);
    return `<article class="desktop-item ${item.type}-item style-${item.style} ${item.frame ? `frame-${frame}` : "no-frame"} ${item.id === state.selectedItemId ? "is-selected" : ""}"
      data-item-id="${item.id}" style="--item-x:${item.x}px;--item-y:${item.y}px;--item-width:${item.width}px;--item-height:${item.height ? `${item.height}px` : "auto"};--item-rotation:${item.rotation}deg;--item-opacity:${item.opacity};--item-z:${item.z};--item-color:${item.color};--item-background:${item.backgroundColor || "#f4dc86"};--item-font-size:${item.fontSize}px;--item-text-align:${item.textAlign || "left"};--item-font:${FONT_MAP[item.font] || FONT_MAP.serif};--item-font-weight:${["meddon","typewriter"].includes(item.font) ? 400 : 700}">
      <div class="item-frame">
        <header class="item-titlebar"><strong>${escapeHtml(item.title)}</strong><div class="item-controls"><i class="fake-control">—</i><i class="fake-control">□</i><i class="fake-control">×</i></div></header>
        <div class="item-content">${content}</div>
      </div>
      <button class="transform-handle rotate-handle" data-transform="rotate" type="button" aria-label="旋转素材"></button>
      <button class="transform-handle resize-handle" data-transform="resize" type="button" aria-label="缩放素材"></button>
    </article>`;
  }

  function taskbarMarkup() {
    const tasks = ["explorer","settings"].filter((id) => state.windows[id].open);
    const labels = { explorer:"资源管理器",settings:"设置" };
    return `<footer class="taskbar">
      <button class="start-button ${state.windows.start.open ? "active" : ""}" data-window-toggle="start" type="button">
        <span class="start-logo"><i></i><i></i><i></i><i></i></span><span>开始</span>
      </button>
      <div class="task-list">${tasks.map((id) => `<button class="task-button ${!state.windows[id].minimized ? "active" : ""}" data-window-task="${id}" type="button">${labels[id]}</button>`).join("")}</div>
      <span class="taskbar-spacer"></span>
      <span class="task-status">${escapeHtml(state.desktop.taskbarStatus)}</span>
      <div class="task-clock"><b>${escapeHtml(state.desktop.clock)}</b><span>${escapeHtml(state.desktop.date)}</span></div>
    </footer>`;
  }

  function renderCanvas() {
    const theme = THEMES[state.desktop.theme];
    const wallpaper = imageStore.resolve(state.desktop.wallpaperImage);
    const frameStyle = currentFrameStyle();
    canvas.dataset.theme = state.desktop.theme;
    canvas.classList.toggle("show-icon-labels",state.desktop.showIconLabels);
    canvas.style.setProperty("--os-accent",state.desktop.accent);
    canvas.innerHTML = `
      <div class="desktop-wallpaper"></div>
      ${state.desktop.showGrid ? '<div class="desktop-grid"></div>' : ""}
      <div class="desktop-icons">
        <button class="desktop-icon folder" data-desktop-open="explorer" type="button"><i></i><span>资源管理器</span></button>
        <button class="desktop-icon settings" data-desktop-open="settings" type="button"><i>⚙</i><span>设置</span></button>
      </div>
      <div class="desktop-assets">${state.items.map(itemMarkup).join("")}</div>
      ${explorerMarkup(frameStyle)}
      ${settingsMarkup(frameStyle)}
      ${startMenuMarkup()}
      ${taskbarMarkup()}`;
    const wallpaperNode = $(".desktop-wallpaper",canvas);
    wallpaperNode.style.backgroundColor = state.desktop.wallpaperColor || theme.desktop;
    wallpaperNode.style.backgroundImage = wallpaper ? `url("${wallpaper.replaceAll('"','%22')}")` : "none";
    requestAnimationFrame(updateCanvasScale);
  }

  function renderImagePreviews() {
    const avatar = imageStore.resolve(state.character.avatar);
    $("#avatar-preview").innerHTML = avatar ? `<img src="${escapeHtml(avatar)}" alt="角色头像预览">` : "<span>头像</span>";
    $("#remove-avatar").disabled = !state.character.avatar;
    const wallpaper = imageStore.resolve(state.desktop.wallpaperImage);
    $("#wallpaper-preview").innerHTML = wallpaper ? `<img src="${escapeHtml(wallpaper)}" alt="壁纸预览">` : "<span>壁纸</span>";
    $("#remove-wallpaper").disabled = !state.desktop.wallpaperImage;
  }

  function syncControls(root = document) {
    $$("[data-path]",root).forEach((control) => {
      const value = getPath(control.dataset.path);
      if (control.type === "checkbox") control.checked = Boolean(value);
      else control.value = value ?? "";
    });
    const item = selectedItem();
    if (item) {
      $$("[data-item-field]").forEach((control) => {
        const value = item[control.dataset.itemField];
        if (control.type === "checkbox") control.checked = Boolean(value);
        else control.value = value ?? "";
      });
    }
    $("#undo").disabled = !history.length;
    $("#redo").disabled = !future.length;
  }

  function renderAll() {
    renderThemes();
    renderAssetList();
    renderSelectedAsset();
    renderImagePreviews();
    renderCanvas();
    syncControls();
  }

  function updateCanvasScale() {
    if (!canvas.offsetWidth || !viewport.clientWidth) return;
    const focusMode = document.body.classList.contains("focus-mode");
    const padding = focusMode || window.matchMedia("(max-width:900px)").matches ? 0 : 36;
    const widthScale = (viewport.clientWidth - padding) / 1440;
    const heightScale = focusMode ? viewport.clientHeight / 900 : 1;
    const scale = Math.min(focusMode ? 2 : 1,Math.max(.08,Math.min(widthScale,heightScale)));
    canvas.style.transformOrigin = "top left";
    canvas.style.transform = `scale(${scale})`;
    stage.style.width = `${1440 * scale}px`;
    stage.style.height = `${900 * scale}px`;
  }

  let focusControlsTimer = 0;
  function showFocusControls() {
    if (!document.body.classList.contains("focus-mode")) return;
    document.body.classList.add("focus-controls-visible");
    clearTimeout(focusControlsTimer);
    focusControlsTimer = setTimeout(() => document.body.classList.remove("focus-controls-visible"),1800);
  }

  function setFocusMode(enabled,manageFullscreen = true) {
    document.body.classList.toggle("focus-mode",enabled);
    document.body.classList.toggle("focus-controls-visible",enabled);
    $("#focus-mode").setAttribute("aria-pressed",String(enabled));
    clearTimeout(focusControlsTimer);
    if (enabled) {
      showFocusControls();
      if (manageFullscreen && !document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      document.body.classList.remove("focus-controls-visible");
      if (manageFullscreen && document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
    }
    requestAnimationFrame(updateCanvasScale);
  }

  function setMobilePanel(panel) {
    document.body.dataset.mobilePanel = panel;
    $$("[data-mobile-tab]").forEach((button) => button.classList.toggle("active",button.dataset.mobileTab === panel));
    requestAnimationFrame(updateCanvasScale);
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

  async function readImageData(file) {
    if (!file?.type.startsWith("image/") || file.size > 15 * 1024 * 1024) throw new Error("invalid");
    return new Promise((resolve,reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function readImage(file) {
    return imageStore.storeDataUrl(await readImageData(file));
  }

  function updateAvatarCropTransform() {
    const stageNode = $("#avatar-crop-stage");
    const image = $("#avatar-crop-image");
    if (!avatarCrop.naturalWidth || !stageNode.clientWidth) return;
    const size = stageNode.clientWidth;
    const scaledWidth = avatarCrop.naturalWidth * avatarCrop.baseScale * avatarCrop.zoom;
    const scaledHeight = avatarCrop.naturalHeight * avatarCrop.baseScale * avatarCrop.zoom;
    const maxX = Math.max(0,(scaledWidth - size) / 2);
    const maxY = Math.max(0,(scaledHeight - size) / 2);
    avatarCrop.x = clamp(avatarCrop.x,-maxX,maxX);
    avatarCrop.y = clamp(avatarCrop.y,-maxY,maxY);
    image.style.width = avatarCrop.naturalWidth * avatarCrop.baseScale + "px";
    image.style.height = avatarCrop.naturalHeight * avatarCrop.baseScale + "px";
    image.style.transform = "translate(-50%,-50%) translate(" + avatarCrop.x + "px," + avatarCrop.y + "px) scale(" + avatarCrop.zoom + ")";
    $("#avatar-crop-zoom-output").textContent = Math.round(avatarCrop.zoom * 100) + "%";
  }

  function resetAvatarCrop() {
    const image = $("#avatar-crop-image");
    const size = $("#avatar-crop-stage").clientWidth || 320;
    if (!image.naturalWidth) return;
    avatarCrop.naturalWidth = image.naturalWidth;
    avatarCrop.naturalHeight = image.naturalHeight;
    avatarCrop.baseScale = Math.max(size / image.naturalWidth,size / image.naturalHeight);
    avatarCrop.zoom = 1;
    avatarCrop.x = 0;
    avatarCrop.y = 0;
    $("#avatar-crop-zoom").value = "1";
    updateAvatarCropTransform();
  }

  function openAvatarCrop(source) {
    const image = $("#avatar-crop-image");
    avatarCrop.source = source;
    avatarCrop.naturalWidth = 0;
    avatarCrop.naturalHeight = 0;
    avatarCrop.dragging = false;
    $("#avatar-crop-modal").hidden = false;
    document.body.classList.add("avatar-crop-open");
    image.onload = resetAvatarCrop;
    image.src = source;
    $("#apply-avatar-crop").focus();
  }

  function closeAvatarCrop() {
    $("#avatar-crop-modal").hidden = true;
    document.body.classList.remove("avatar-crop-open");
    avatarCrop.source = "";
    avatarCrop.dragging = false;
    $("#avatar-crop-image").removeAttribute("src");
  }

  async function applyAvatarCrop() {
    const image = $("#avatar-crop-image");
    const stageNode = $("#avatar-crop-stage");
    const button = $("#apply-avatar-crop");
    if (!avatarCrop.source || !avatarCrop.naturalWidth) return;
    button.disabled = true;
    try {
      const size = stageNode.clientWidth || 320;
      const scale = avatarCrop.baseScale * avatarCrop.zoom;
      const displayedWidth = avatarCrop.naturalWidth * scale;
      const displayedHeight = avatarCrop.naturalHeight * scale;
      const imageLeft = size / 2 + avatarCrop.x - displayedWidth / 2;
      const imageTop = size / 2 + avatarCrop.y - displayedHeight / 2;
      const sourceSize = size / scale;
      const sourceX = clamp(-imageLeft / scale,0,Math.max(0,avatarCrop.naturalWidth - sourceSize));
      const sourceY = clamp(-imageTop / scale,0,Math.max(0,avatarCrop.naturalHeight - sourceSize));
      const output = document.createElement("canvas");
      output.width = 640;
      output.height = 640;
      output.getContext("2d").drawImage(image,sourceX,sourceY,sourceSize,sourceSize,0,0,640,640);
      const reference = await imageStore.storeDataUrl(output.toDataURL("image/png"));
      pushSnapshot();
      state.character.avatar = reference;
      await imageStore.preload([reference]);
      closeAvatarCrop();
      renderAll();
      scheduleSave();
      showToast("角色头像裁切已完成");
    } catch {
      showToast("头像裁切失败，请重新选择图片");
    } finally {
      button.disabled = false;
    }
  }

  function setupAvatarCrop() {
    const stageNode = $("#avatar-crop-stage");
    const zoom = $("#avatar-crop-zoom");
    stageNode.addEventListener("pointerdown",(event) => {
      if (!avatarCrop.naturalWidth) return;
      avatarCrop.dragging = true;
      avatarCrop.startX = event.clientX;
      avatarCrop.startY = event.clientY;
      avatarCrop.originX = avatarCrop.x;
      avatarCrop.originY = avatarCrop.y;
      stageNode.setPointerCapture?.(event.pointerId);
    });
    stageNode.addEventListener("pointermove",(event) => {
      if (!avatarCrop.dragging) return;
      avatarCrop.x = avatarCrop.originX + event.clientX - avatarCrop.startX;
      avatarCrop.y = avatarCrop.originY + event.clientY - avatarCrop.startY;
      updateAvatarCropTransform();
    });
    const stop = () => { avatarCrop.dragging = false; };
    stageNode.addEventListener("pointerup",stop);
    stageNode.addEventListener("pointercancel",stop);
    zoom.addEventListener("input",() => {
      avatarCrop.zoom = number(zoom.value,1);
      updateAvatarCropTransform();
    });
    $$("[data-close-avatar-crop]").forEach((button) => button.addEventListener("click",closeAvatarCrop));
    $("#reset-avatar-crop").addEventListener("click",resetAvatarCrop);
    $("#apply-avatar-crop").addEventListener("click",applyAvatarCrop);
    document.addEventListener("keydown",(event) => {
      if (event.key === "Escape" && !$("#avatar-crop-modal").hidden) closeAvatarCrop();
    });
  }
  async function setSingleImage(file,target,key,label) {
    try {
      const source = await readImage(file);
      pushSnapshot();
      target[key] = source;
      await imageStore.preload([source]);
      renderAll();
      scheduleSave();
      showToast(`${label}已更新`);
    } catch {
      showToast("请选择 15MB 以内的图片");
    }
  }

  async function addImageAssets(files) {
    const valid = [...(files || [])].filter((file) => file.type.startsWith("image/") && file.size <= 15 * 1024 * 1024);
    if (!valid.length) return showToast("请选择 15MB 以内的图片");
    pushSnapshot();
    const sources = [];
    for (const [index,file] of valid.entries()) {
      try {
        const source = await readImage(file);
        sources.push(source);
        const item = {
          id:uid("asset"),type:"image",title:file.name || `图片 ${state.items.length + 1}`,text:"",image:source,
          style:"plain",frame:true,frameStyle:"system",x:300 + index * 36,y:170 + index * 28,width:360,
          rotation:0,opacity:1,color:"#ffffff",fontSize:20,z:state.nextZ++
        };
        state.items.push(item);
        state.selectedItemId = item.id;
      } catch {}
    }
    await imageStore.preload(sources);
    renderAll();
    scheduleSave();
    showToast(`已添加 ${sources.length} 张图片`);
  }

  function addTextAsset() {
    const text = $("#new-text").value.trim();
    if (!text) return showToast("请先输入文字内容");
    const style = $("#new-text-style").value;
    const frameChoice = $("#new-text-frame").value;
    const autoFrame = ["terminal","document"].includes(style);
    const frame = frameChoice === "window" || frameChoice === "auto" && autoFrame;
    pushSnapshot();
    const item = {
      id:uid("asset"),type:"text",title:style === "terminal" ? "terminal.exe" : style === "note" ? "note.txt" : "text.txt",
      text,image:"",style,frame,frameStyle:"system",x:520,y:200,width:style === "plain" ? 420 : 320,
      height:style === "terminal" ? 220 : style === "note" ? 170 : style === "document" ? 180 : 125,
      rotation:0,opacity:1,color:style === "plain" ? "#ffffff" : style === "terminal" ? "#c4efcc" : "#493d27",
      backgroundColor:"#f4dc86",fontSize:style === "plain" ? 42 : 18,textAlign:"left",font:style === "terminal" ? "typewriter" : "serif",z:state.nextZ++
    };
    state.items.push(item);
    state.selectedItemId = item.id;
    $("#new-text").value = "";
    renderAll();
    scheduleSave();
  }

  function beginLayerDrag(event) {
    const handle = event.target.closest("[data-layer-drag]");
    const row = handle?.closest("[data-layer-key]");
    if (!row) return;
    event.preventDefault();
    layerDragSession = {
      pointerId:event.pointerId,
      handle,
      row,
      before:clone(state),
      moved:false
    };
    row.classList.add("is-layer-dragging");
    handle.setPointerCapture?.(event.pointerId);
  }

  function moveLayerDrag(event) {
    const session = layerDragSession;
    if (!session || event.pointerId !== session.pointerId) return;
    event.preventDefault();
    session.row.style.pointerEvents = "none";
    const target = document.elementFromPoint(event.clientX,event.clientY)?.closest?.("#asset-list [data-layer-key]");
    session.row.style.pointerEvents = "";
    if (!target || target === session.row) return;
    const beforeTarget = event.clientY < target.getBoundingClientRect().top + target.offsetHeight / 2;
    if (beforeTarget) target.before(session.row);
    else target.after(session.row);
    session.moved = true;
  }

  function endLayerDrag(event) {
    const session = layerDragSession;
    if (!session || event.pointerId !== session.pointerId) return;
    if (session.handle.hasPointerCapture?.(event.pointerId)) session.handle.releasePointerCapture(event.pointerId);
    session.row.classList.remove("is-layer-dragging");
    session.row.style.pointerEvents = "";
    layerDragSession = null;
    if (!session.moved) return;
    const keys = $$("#asset-list [data-layer-key]").map((row) => row.dataset.layerKey);
    applyLayerOrder(keys);
    pushSnapshot(session.before);
    suppressLayerClick = true;
    setTimeout(() => { suppressLayerClick = false; },0);
    renderAll();
    scheduleSave();
  }
  function selectItem(id) {
    state.selectedItemId = state.items.some((item) => item.id === id) ? id : "";
    renderAssetList();
    renderSelectedAsset();
    renderCanvas();
    syncControls($("#selected-asset-card"));
    scheduleSave();
  }

  function assetAction(action,id) {
    const index = state.items.findIndex((item) => item.id === id);
    if (index < 0) return;
    pushSnapshot();
    const item = state.items[index];
    if (action === "delete") {
      state.items.splice(index,1);
      state.selectedItemId = state.items[Math.min(index,state.items.length - 1)]?.id || "";
    } else if (action === "copy") {
      const copy = { ...clone(item),id:uid("asset"),title:`${item.title} · 副本`,x:item.x + 28,y:item.y + 28,z:state.nextZ++ };
      state.items.splice(index + 1,0,copy);
      state.selectedItemId = copy.id;
    } else if (action === "front") {
      item.z = state.nextZ++;
      state.selectedItemId = item.id;
    } else if (action === "back") {
      item.z = Math.min(...state.items.map((entry) => entry.z),10) - 1;
      state.selectedItemId = item.id;
    }
    renderAll();
    scheduleSave();
  }

  function beginItemTransform(event,itemNode,kind) {
    const item = state.items.find((entry) => entry.id === itemNode.dataset.itemId);
    if (!item) return;
    event.preventDefault();
    state.selectedItemId = item.id;
    $$(".desktop-item",canvas).forEach((node) => node.classList.toggle("is-selected",node === itemNode));
    renderAssetList();
    renderSelectedAsset();
    syncControls($("#selected-asset-card"));
    const canvasRect = canvas.getBoundingClientRect();
    const visualScale = canvasRect.width / 1440;
    const nodeRect = itemNode.getBoundingClientRect();
    const centerX = nodeRect.left + nodeRect.width / 2;
    const centerY = nodeRect.top + nodeRect.height / 2;
    transformSession = {
      pointerId:event.pointerId,item,node:itemNode,kind,before:clone(state),visualScale,
      startX:event.clientX,startY:event.clientY,x:item.x,y:item.y,width:item.width,height:item.height || itemNode.offsetHeight,rotation:item.rotation,
      distance:Math.max(1,Math.hypot(event.clientX - centerX,event.clientY - centerY)),
      angle:Math.atan2(event.clientY - centerY,event.clientX - centerX) * 180 / Math.PI,
      centerX,centerY
    };
    const captureNode = event.target instanceof Element ? event.target : itemNode;
    transformSession.captureNode = captureNode;
    captureNode.setPointerCapture?.(event.pointerId);
  }

  function moveItemTransform(event) {
    const session = transformSession;
    if (!session || event.pointerId !== session.pointerId) return;
    event.preventDefault();
    const { item,node } = session;
    if (session.kind === "drag") {
      item.x = clamp(session.x + (event.clientX - session.startX) / session.visualScale,-item.width * .75,1400);
      item.y = clamp(session.y + (event.clientY - session.startY) / session.visualScale,-200,850);
      node.style.setProperty("--item-x",`${item.x}px`);
      node.style.setProperty("--item-y",`${item.y}px`);
    } else if (session.kind === "resize") {
      if (item.type === "text") {
        const dx = (event.clientX - session.startX) / session.visualScale;
        const dy = (event.clientY - session.startY) / session.visualScale;
        const radians = session.rotation * Math.PI / 180;
        const localX = dx * Math.cos(radians) + dy * Math.sin(radians);
        const localY = -dx * Math.sin(radians) + dy * Math.cos(radians);
        item.width = clamp(session.width + localX,80,1100);
        item.height = clamp(session.height + localY,60,760);
        node.style.setProperty("--item-width",`${item.width}px`);
        node.style.setProperty("--item-height",`${item.height}px`);
      } else {
        const distance = Math.max(1,Math.hypot(event.clientX - session.centerX,event.clientY - session.centerY));
        item.width = clamp(session.width * distance / session.distance,80,1100);
        node.style.setProperty("--item-width",`${item.width}px`);
      }
    } else {
      const angle = Math.atan2(event.clientY - session.centerY,event.clientX - session.centerX) * 180 / Math.PI;
      item.rotation = Math.round(session.rotation + angle - session.angle);
      node.style.setProperty("--item-rotation",`${item.rotation}deg`);
    }
  }

  function endItemTransform(event) {
    if (!transformSession || event.pointerId !== transformSession.pointerId) return;
    if (transformSession.captureNode?.hasPointerCapture?.(event.pointerId)) {
      transformSession.captureNode.releasePointerCapture(event.pointerId);
    }
    pushSnapshot(transformSession.before);
    transformSession = null;
    renderAll();
    scheduleSave();
  }

  function bringWindowForward(id) {
    const win = state.windows[id];
    if (!win) return;
    win.z = state.nextZ++;
  }

  function beginWindowDrag(event,windowNode) {
    if (event.target.closest(".window-controls")) return;
    const id = windowNode.dataset.windowId;
    const win = state.windows[id];
    if (!win) return;
    event.preventDefault();
    bringWindowForward(id);
    const visualScale = canvas.getBoundingClientRect().width / 1440;
    windowDragSession = {
      pointerId:event.pointerId,id,win,node:windowNode,before:clone(state),visualScale,
      startX:event.clientX,startY:event.clientY,x:win.x,y:win.y
    };
    windowNode.style.setProperty("--window-z",win.z);
    windowNode.setPointerCapture?.(event.pointerId);
  }

  function moveWindow(event) {
    const session = windowDragSession;
    if (!session || event.pointerId !== session.pointerId) return;
    event.preventDefault();
    session.win.x = clamp(session.x + (event.clientX - session.startX) / session.visualScale,0,1440 - session.win.width);
    session.win.y = clamp(session.y + (event.clientY - session.startY) / session.visualScale,0,842 - 42);
    session.node.style.left = `${session.win.x}px`;
    session.node.style.top = `${session.win.y}px`;
  }

  function endWindowDrag(event) {
    if (!windowDragSession || event.pointerId !== windowDragSession.pointerId) return;
    pushSnapshot(windowDragSession.before);
    windowDragSession = null;
    renderAll();
    scheduleSave();
  }

  function openWindow(id) {
    if (id === "start") {
      state.windows.start.open = true;
    } else if (state.windows[id]) {
      state.windows[id].open = true;
      state.windows[id].minimized = false;
      bringWindowForward(id);
    }
    renderCanvas();
    renderAssetList();
    scheduleSave();
  }

  function toggleWindow(id) {
    pushSnapshot();
    if (id === "start") {
      state.windows.start.open = !state.windows.start.open;
    } else if (state.windows[id]) {
      const win = state.windows[id];
      if (!win.open) { win.open = true; win.minimized = false; }
      else if (win.minimized) win.minimized = false;
      else win.open = false;
      bringWindowForward(id);
    }
    renderCanvas();
    renderAssetList();
    scheduleSave();
  }

  function windowAction(action,id) {
    const win = state.windows[id];
    if (!win) return;
    pushSnapshot();
    if (action === "close") win.open = false;
    if (action === "minimize") win.minimized = true;
    if (action === "maximize") {
      const maximized = win.x === 18 && win.y === 18 && win.width === 1404;
      if (maximized) {
        Object.assign(win,id === "explorer" ? { x:390,y:104,width:650,height:390 } : { x:730,y:150,width:520,height:360 });
      } else {
        Object.assign(win,{ x:18,y:18,width:1404,height:806 });
      }
    }
    renderCanvas();
    renderAssetList();
    scheduleSave();
  }

  function setTheme(id) {
    if (!THEMES[id] || id === state.desktop.theme) return;
    pushSnapshot();
    state.desktop.theme = id;
    state.desktop.wallpaperColor = THEMES[id].desktop;
    state.desktop.accent = THEMES[id].accent;
    renderAll();
    scheduleSave();
  }

  function downloadBlob(blob,name) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url),1000);
  }

  function wrapStickerText(context,text,maxWidth) {
    const lines = [];
    String(text || "").replaceAll("\r","").split("\n").forEach((paragraph) => {
      if (!paragraph) {
        lines.push("");
        return;
      }
      let line = "";
      for (const character of paragraph) {
        const candidate = line + character;
        if (line && context.measureText(candidate).width > maxWidth) {
          lines.push(line);
          line = character;
        } else {
          line = candidate;
        }
      }
      lines.push(line);
    });
    return lines;
  }

  function rasterizeStickerText() {
    const restore = [];
    $$(".desktop-item.text-item .item-content",canvas).forEach((node) => {
      const width = Math.max(1,node.clientWidth);
      const height = Math.max(1,node.clientHeight);
      const style = getComputedStyle(node);
      const ratio = 2;
      const raster = document.createElement("canvas");
      raster.width = Math.ceil(width * ratio);
      raster.height = Math.ceil(height * ratio);
      raster.style.width = `${width}px`;
      raster.style.height = `${height}px`;
      raster.style.display = "block";
      const context = raster.getContext("2d");
      if (!context) return;
      context.scale(ratio,ratio);
      context.font = `${style.fontStyle} ${style.fontVariant} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      context.fillStyle = style.color;
      context.textBaseline = "top";
      context.textAlign = style.textAlign;
      context.direction = style.direction;
      const fontSize = parseFloat(style.fontSize) || 16;
      const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.55;
      const left = parseFloat(style.paddingLeft) || 0;
      const right = parseFloat(style.paddingRight) || 0;
      const top = parseFloat(style.paddingTop) || 0;
      const bottom = parseFloat(style.paddingBottom) || 0;
      const textWidth = Math.max(1,width - left - right);
      const x = style.textAlign === "center" ? left + textWidth / 2 : style.textAlign === "right" ? width - right : left;
      const lines = wrapStickerText(context,node.textContent,textWidth);
      lines.forEach((line,index) => {
        const y = top + index * lineHeight;
        if (y + lineHeight > height - bottom + .5) return;
        context.fillText(line,x,y,textWidth);
      });
      const originalNodes = [...node.childNodes];
      node.replaceChildren(raster);
      restore.push(() => node.replaceChildren(...originalNodes));
    });
    return () => restore.reverse().forEach((callback) => callback());
  }

  async function prepareExportImages() {
    const sourceMap = new Map();
    for (const binding of imageBindings(state)) {
      const storedSource = binding.container[binding.key];
      const resolvedSource = imageStore.resolve(storedSource);
      try {
        const dataSource = await imageStore.toDataUrl(storedSource);
        if (resolvedSource && dataSource) sourceMap.set(resolvedSource,dataSource);
      } catch {
        if (resolvedSource) sourceMap.set(resolvedSource,TRANSPARENT_IMAGE);
      }
    }
    const restore = [];
    const pendingImages = [];
    $$("img",canvas).forEach((image) => {
      const original = image.getAttribute("src") || "";
      const replacement = sourceMap.get(original) || sourceMap.get(image.src);
      if (!replacement) return;
      restore.push(() => image.setAttribute("src",original));
      image.setAttribute("src",replacement);
      if (image.decode) pendingImages.push(image.decode().catch(() => {}));
    });
    const wallpaper = $(".desktop-wallpaper",canvas);
    const resolvedWallpaper = imageStore.resolve(state.desktop.wallpaperImage);
    const wallpaperSource = sourceMap.get(resolvedWallpaper);
    if (wallpaper && wallpaperSource) {
      const originalBackground = wallpaper.style.backgroundImage;
      restore.push(() => { wallpaper.style.backgroundImage = originalBackground; });
      wallpaper.style.backgroundImage = `url("${wallpaperSource}")`;
    }
    await Promise.all(pendingImages);
    return () => restore.reverse().forEach((callback) => callback());
  }
  async function exportDesktop() {
    let restoreStickerText = () => {};
    let restoreImages = () => {};
    try {
      canvas.classList.add("is-exporting");
      await imageStore.preload(imageBindings(state).map((binding) => binding.container[binding.key]));
      restoreImages = await prepareExportImages();
      await document.fonts?.ready;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      restoreStickerText = rasterizeStickerText();
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const dataUrl = await window.htmlToImage.toPng(canvas,{
        pixelRatio:Number(state.exportScale),
        width:1440,
        height:900,
        cacheBust:false,
        imagePlaceholder:TRANSPARENT_IMAGE,
        onImageErrorHandler:() => null,
        fontEmbedCSS:"",
        skipFonts:true,
        style:{ transform:"none",transformOrigin:"top left",width:"1440px",height:"900px",boxShadow:"none" },
        backgroundColor:state.desktop.wallpaperColor
      });
      const response = await fetch(dataUrl);
      downloadBlob(await response.blob(),`${state.projectName}-桌面情绪板.png`);
      showToast("完整桌面已导出");
    } catch (error) {
      console.error(error);
      showToast("导出失败，请稍后重试");
    } finally {
      restoreStickerText();
      restoreImages();
      canvas.classList.remove("is-exporting");
    }
  }
  document.addEventListener("focusin",(event) => {
    if (event.target.matches("[data-path],[data-item-field]")) inputBefore = clone(state);
  });

  document.addEventListener("input",(event) => {
    const target = event.target;
    if (target.matches("[data-path]")) {
      const value = target.type === "checkbox" ? target.checked : target.type === "number" || target.type === "range" || target.tagName === "SELECT" && target.dataset.path === "exportScale" ? number(target.value) : target.value;
      setPath(target.dataset.path,value);
    } else if (target.matches("[data-item-field]")) {
      const item = selectedItem();
      if (!item) return;
      const key = target.dataset.itemField;
      item[key] = target.type === "checkbox" ? target.checked : target.type === "number" || target.type === "range" ? number(target.value) : target.value;
    } else return;
    renderCanvas();
    renderAssetList();
    scheduleSave();
  });

  document.addEventListener("change",(event) => {
    if (!event.target.matches("[data-path],[data-item-field]")) return;
    if (inputBefore) pushSnapshot(inputBefore);
    inputBefore = null;
    renderAll();
    scheduleSave();
  });

  document.addEventListener("click",(event) => {
    const mobile = event.target.closest("[data-mobile-tab]");
    if (mobile) return setMobilePanel(mobile.dataset.mobileTab);
    const theme = event.target.closest("[data-theme],[data-canvas-theme]");
    if (theme) return setTheme(theme.dataset.theme || theme.dataset.canvasTheme);
    const assetActionButton = event.target.closest("[data-asset-action]");
    if (assetActionButton) return assetAction(assetActionButton.dataset.assetAction,assetActionButton.dataset.id);
    const layerWindow = event.target.closest("[data-layer-window]");
    if (layerWindow) {
      if (suppressLayerClick) return;
      return openWindow(layerWindow.dataset.layerWindow);
    }
    const assetRow = event.target.closest("[data-select-asset],[data-explorer-select]");
    if (assetRow) return selectItem(assetRow.dataset.selectAsset || assetRow.dataset.explorerSelect);
    const desktopOpen = event.target.closest("[data-desktop-open]");
    if (desktopOpen) return openWindow(desktopOpen.dataset.desktopOpen);
    const toggle = event.target.closest("[data-window-toggle]");
    if (toggle) return toggleWindow(toggle.dataset.windowToggle);
    const task = event.target.closest("[data-window-task]");
    if (task) {
      const id = task.dataset.windowTask;
      pushSnapshot();
      state.windows[id].minimized = !state.windows[id].minimized;
      bringWindowForward(id);
      renderCanvas();
      renderAssetList();
      scheduleSave();
      return;
    }
    const action = event.target.closest("[data-window-action]");
    if (action) return windowAction(action.dataset.windowAction,action.dataset.windowId);
  });

  $("#asset-list").addEventListener("pointerdown",beginLayerDrag);

  canvas.addEventListener("pointerdown",(event) => {
    const itemNode = event.target.closest(".desktop-item");
    if (itemNode) return beginItemTransform(event,itemNode,event.target.closest("[data-transform]")?.dataset.transform || "drag");
    const windowNode = event.target.closest(".os-window[data-window-id]");
    if (windowNode && event.target.closest(".window-titlebar")) return beginWindowDrag(event,windowNode);
    if (!event.target.closest(".start-menu,.taskbar,.desktop-icons")) selectItem("");
  });
  document.addEventListener("pointermove",(event) => {
    moveItemTransform(event);
    moveWindow(event);
    moveLayerDrag(event);
  },{ passive:false });
  document.addEventListener("pointerup",(event) => {
    endItemTransform(event);
    endWindowDrag(event);
    endLayerDrag(event);
  });
  document.addEventListener("pointercancel",(event) => {
    endItemTransform(event);
    endWindowDrag(event);
    endLayerDrag(event);
  });

  $("#add-text").addEventListener("click",addTextAsset);
  $("#asset-image-input").addEventListener("change",(event) => {
    addImageAssets(event.target.files);
    event.target.value = "";
  });
  $("#avatar-input").addEventListener("change",async (event) => {
    try {
      openAvatarCrop(await readImageData(event.target.files?.[0]));
    } catch {
      showToast("请选择 15MB 以内的图片");
    }
    event.target.value = "";
  });
  $("#wallpaper-input").addEventListener("change",(event) => {
    setSingleImage(event.target.files?.[0],state.desktop,"wallpaperImage","壁纸");
    event.target.value = "";
  });
  $("#remove-avatar").addEventListener("click",() => {
    if (!state.character.avatar) return;
    pushSnapshot();
    state.character.avatar = "";
    renderAll();
    scheduleSave();
  });
  $("#remove-wallpaper").addEventListener("click",() => {
    if (!state.desktop.wallpaperImage) return;
    pushSnapshot();
    state.desktop.wallpaperImage = "";
    renderAll();
    scheduleSave();
  });
  $("#undo").addEventListener("click",() => applyHistory(history,future));
  $("#redo").addEventListener("click",() => applyHistory(future,history));
  $("#focus-mode").addEventListener("click",() => setFocusMode(true));
  $("#focus-exit").addEventListener("click",() => setFocusMode(false));
  $("#export-full").addEventListener("click",exportDesktop);
  $("#export-long").addEventListener("click",exportDesktop);
  $("#save-json").addEventListener("click",async () => {
    const data = JSON.stringify(await portableState(),null,2);
    downloadBlob(new Blob([data],{ type:"application/json" }),`${state.projectName}.json`);
    showToast("JSON 备份已保存");
  });
  $("#import-json").addEventListener("change",async (event) => {
    try {
      const imported = normalizeState(JSON.parse(await event.target.files?.[0]?.text()));
      pushSnapshot();
      state = imported;
      await migrateImages(state);
      await imageStore.preload(imageBindings(state).map((binding) => binding.container[binding.key]));
      renderAll();
      scheduleSave();
      showToast("项目已导入");
    } catch {
      showToast("无法读取这个 JSON 文件");
    }
    event.target.value = "";
  });
  $("#new-project").addEventListener("click",() => {
    if (!confirm("新建项目会替换当前内容，建议先保存 JSON。继续吗？")) return;
    pushSnapshot();
    state = createDefaultState();
    renderAll();
    scheduleSave();
    showToast("已新建桌面项目");
  });

  document.addEventListener("pointermove",showFocusControls);
  document.addEventListener("keydown",(event) => {
    if (event.key === "Escape" && document.body.classList.contains("focus-mode")) setFocusMode(false);
  });
  document.addEventListener("fullscreenchange",() => {
    if (!document.fullscreenElement && document.body.classList.contains("focus-mode")) setFocusMode(false,false);
  });
  window.addEventListener("resize",updateCanvasScale);
  if ("ResizeObserver" in window) new ResizeObserver(() => requestAnimationFrame(updateCanvasScale)).observe(canvas);
  setupTour();
  setupAvatarCrop();
  setupMobileResizer();
  renderAll();
  if (!tutorialSeen()) window.setTimeout(openTour,650);
  (async () => {
    await migrateImages(state);
    await imageStore.preload(imageBindings(state).map((binding) => binding.container[binding.key]));
    renderAll();
    scheduleSave();
  })();
})();
