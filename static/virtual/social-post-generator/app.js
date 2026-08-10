const STORAGE_KEY = "social-post-generator-project-v1";
const TUTORIAL_KEY = "social-post-generator-tutorial-v1";
const MOBILE_RATIO_KEY = "social-post-generator-mobile-ratio";
const DB_NAME = "social-post-generator-assets";
const DB_STORE = "assets";
const MAX_HISTORY = 30;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const clone = (value) => JSON.parse(JSON.stringify(value));
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const PLATFORM_LABELS = {
  x: "X 帖子",
  instagram: "Instagram 帖子",
  tumblr: "Tumblr 帖子"
};

const DEFAULT_STATE = {
  platform: "x",
  settings: {
    canvasWidth: 620,
    fontScale: 1,
    exportScale: 2,
    mockup: true,
    mockupText: "MOCKUP / 虚构内容",
    showMetrics: true,
    customBg: "#ffffff",
    customInk: "#111111",
    customMuted: "#6c716d",
    customAccent: "#111111"
  },
  platforms: {
    x: {
      mode: "post",
      theme: "light",
      displayName: "夜航档案",
      handle: "@night_archive",
      avatarRef: "",
      avatarZoom: 1,
      avatarX: 50,
      avatarY: 50,
      coverRef: "",
      coverZoom: 1,
      coverX: 50,
      coverY: 50,
      verified: true,
      text: "凌晨两点，城市把所有未发送的句子都留在了窗边。\n\n这是一个用于原创角色与虚构企划的示例帖子。",
      hashtags: "#原创角色 #世界观 #夜航记录",
      timestamp: "2026年7月28日 · 22:14",
      source: "Web App",
      replies: "128",
      reposts: "346",
      likes: "2,491",
      views: "18.6万",
      bookmarks: "619",
      quoteEnabled: true,
      quoteName: "潮汐来信",
      quoteHandle: "@tide_letter",
      quoteText: "我们会在下一次天亮以前，重新听见那首歌。",
      thread2Text: "第一封信没有署名，只留下了潮汐到站的时间。",
      thread2Time: "22:18",
      thread3Text: "如果有人读到这里，请替我们把灯留到天亮。",
      thread3Time: "22:21",
      replyName: "旧站台",
      replyHandle: "@old_station",
      replyText: "我记得那一晚，也记得你们没有说完的话。",
      replyTime: "22:26",
      profileBio: "收集夜航、旧站台与未寄出的信。原创世界观档案。",
      profileLocation: "THE LAST STATION",
      website: "night-archive.example",
      joined: "2021年3月加入",
      postsCount: "1,284",
      following: "318",
      followers: "2.6万",
      xReplies: [],
      profilePosts: [{
        id: "x-profile-post-default",
        text: "凌晨两点，城市把所有未发送的句子都留在了窗边。",
        hashtags: "#原创角色 #世界观",
        timestamp: "置顶 · 2026年7月28日",
        source: "Web App",
        pinned: true,
        quoteEnabled: false,
        quoteName: "引用账户",
        quoteHandle: "@quoted_account",
        quoteText: "被引用的内容。",
        replies: "128",
        reposts: "346",
        likes: "2,491",
        views: "18.6万",
        bookmarks: "619",
        imageRef: "",
        imageZoom: 1,
        imageX: 50,
        imageY: 50
      }],
      images: []
    },
    instagram: {
      mode: "post",
      theme: "light",
      displayName: "夜航档案",
      username: "night.archive",
      avatarRef: "",
      avatarZoom: 1,
      avatarX: 50,
      avatarY: 50,
      verified: true,
      location: "THE LAST STATION",
      caption: "潮水退去以后，我们在旧站台交换了最后一封信。",
      hashtags: "#原创角色 #世界观 #夜航记录",
      comments: "查看全部 48 条评论\nold_station：今晚的风像一段没有写完的旁白。",
      timestamp: "2小时前",
      likes: "2,491",
      mediaRatio: "square",
      carouselPage: 1,
      storyText: "今晚的潮水会替我们保守秘密。",
      storyTime: "2小时前",
      reelAudio: "Original audio · night.archive",
      bio: "夜航、旧站台与未寄出的信\n原创世界观档案",
      website: "night-archive.example",
      profileNotificationEnabled: true,
      profileNotificationCount: "2",
      highlights: [
        { id: "ig-highlight-1", label: "夜航", imageRef: "", zoom: 1, x: 50, y: 50 },
        { id: "ig-highlight-2", label: "旧站", imageRef: "", zoom: 1, x: 50, y: 50 },
        { id: "ig-highlight-3", label: "潮汐", imageRef: "", zoom: 1, x: 50, y: 50 },
        { id: "ig-highlight-4", label: "档案", imageRef: "", zoom: 1, x: 50, y: 50 }
      ],
      postsCount: "128",
      followers: "2.6万",
      following: "318",
      images: []
    },
    tumblr: {
      mode: "post",
      theme: "light",
      blogName: "The Night Archive",
      handle: "night-archive",
      avatarRef: "",
      avatarZoom: 1,
      avatarX: 50,
      avatarY: 50,
      reblogSource: "reblogged from tide-letter",
      title: "关于那些没有寄出的信",
      text: "后来我们才知道，海并不会替任何人保存秘密。\n\n它只是一次又一次，把写过的名字送回岸边。",
      quote: "“在天亮以前，再听一遍。”",
      tags: "oc writing, worldbuilding, night notes",
      notes: "2,491 notes",
      timestamp: "Jul 28, 2026",
      reblogChain: [
        { id: "tumblr-reblog-1", blog: "tide-letter", text: "有人把信留在了旧站台的长椅上。" },
        { id: "tumblr-reblog-2", blog: "old-station", text: "然后海风替它翻到了最后一页。" }
      ],
      reblog1Blog: "tide-letter",
      reblog1Text: "有人把信留在了旧站台的长椅上。",
      reblog2Blog: "old-station",
      reblog2Text: "然后海风替它翻到了最后一页。",
      images: []
    }
  }
};

let state = normalizeState(readStoredState());
let history = [];
let future = [];
let saveTimer = null;
let toastTimer = null;
let inputSnapshotTaken = false;
let draggedXReplyId = "";
let draggedTumblrReblogId = "";
let draggedMediaId = "";
const collapsedXReplies = new Set();
const collapsedXProfilePosts = new Set();
const collapsedTumblrReblogs = new Set();
let cropSession = null;
let cropDrag = null;
let uploadScrollSnapshot = null;
let assetDbPromise = null;
const assetUrlCache = new Map();

const canvas = $("#social-canvas");
const frame = $("#canvas-frame");
const viewport = $("#preview-viewport");
const contentForm = $("#content-form");
const styleForm = $("#style-form");
const mediaEditor = $("#media-editor");

function normalizeMedia(media, limit = 4) {
  return (Array.isArray(media) ? media : []).slice(0, limit).map((item) => ({
    id: item.id || uid(),
    assetRef: String(item.assetRef || ""),
    name: String(item.name || "image"),
    zoom: clamp(number(item.zoom, 1), 1, 3),
    x: clamp(number(item.x, 50), 0, 100),
    y: clamp(number(item.y, 50), 0, 100)
  }));
}

function normalizeInstagramHighlight(item = {}, index = 0) {
  return {
    id: item.id || `ig-highlight-${index + 1}-${uid()}`,
    label: String(item.label || `精选 ${index + 1}`),
    imageRef: String(item.imageRef || ""),
    zoom: clamp(number(item.zoom, 1), 1, 3),
    x: clamp(number(item.x, 50), 0, 100),
    y: clamp(number(item.y, 50), 0, 100)
  };
}
function normalizeXReply(item = {}, index = 0) {
  return {
    id: item.id || uid(),
    avatarRef: String(item.avatarRef || ""),
    avatarZoom: clamp(number(item.avatarZoom, 1), 1, 3),
    avatarX: clamp(number(item.avatarX, 50), 0, 100),
    avatarY: clamp(number(item.avatarY, 50), 0, 100),
    displayName: String(item.displayName || `回复者 ${index + 1}`),
    handle: String(item.handle || `@reply_${index + 1}`),
    verified: Boolean(item.verified),
    text: String(item.text || "这是一条新的回复。"),
    hashtags: String(item.hashtags || ""),
    timestamp: String(item.timestamp || "刚刚"),
    source: String(item.source || "Web App"),
    quoteEnabled: Boolean(item.quoteEnabled),
    quoteName: String(item.quoteName || "引用账户"),
    quoteHandle: String(item.quoteHandle || "@quoted_account"),
    quoteText: String(item.quoteText || "被引用的内容。"),
    replies: String(item.replies || "0"),
    reposts: String(item.reposts || "0"),
    likes: String(item.likes || "0"),
    views: String(item.views || "0"),
    bookmarks: String(item.bookmarks || "0"),
    imageRef: String(item.imageRef || ""),
    imageZoom: clamp(number(item.imageZoom, 1), 1, 3),
    imageX: clamp(number(item.imageX, 50), 0, 100),
    imageY: clamp(number(item.imageY, 50), 0, 100)
  };
}

function normalizeXProfilePost(item = {}, index = 0) {
  return {
    id: item.id || uid(),
    text: String(item.text || `账户帖子 ${index + 1}`),
    hashtags: String(item.hashtags || ""),
    timestamp: String(item.timestamp || "刚刚"),
    source: String(item.source || "Web App"),
    pinned: Boolean(item.pinned),
    quoteEnabled: Boolean(item.quoteEnabled),
    quoteName: String(item.quoteName || "引用账户"),
    quoteHandle: String(item.quoteHandle || "@quoted_account"),
    quoteText: String(item.quoteText || "被引用的内容。"),
    replies: String(item.replies || "0"),
    reposts: String(item.reposts || "0"),
    likes: String(item.likes || "0"),
    views: String(item.views || "0"),
    bookmarks: String(item.bookmarks || "0"),
    imageRef: String(item.imageRef || ""),
    imageZoom: clamp(number(item.imageZoom, 1), 1, 3),
    imageX: clamp(number(item.imageX, 50), 0, 100),
    imageY: clamp(number(item.imageY, 50), 0, 100)
  };
}

function createXProfilePost(index = 0) {
  return normalizeXProfilePost({ text: "这是一条新的账户帖子。", timestamp: "刚刚" }, index);
}
function createXReply(data, index = 0) {
  return normalizeXReply({
    displayName: `回复者 ${index + 1}`,
    handle: `@reply_${index + 1}`,
    timestamp: "刚刚",
    source: data.source || "Web App"
  }, index);
}
function normalizeTumblrReblog(item = {}, index = 0) {
  return {
    id: item.id || uid(),
    blog: String(item.blog || item.blogName || `reblog-${index + 1}`),
    text: String(item.text || "这是一层新的转发内容。")
  };
}

function createTumblrReblog(index = 0) {
  return normalizeTumblrReblog({ blog: `reblog-${index + 1}`, text: "这是一层新的转发内容。" }, index);
}
function normalizeState(raw) {
  const next = clone(DEFAULT_STATE);
  if (!raw || typeof raw !== "object") return next;
  if (["x", "instagram", "tumblr"].includes(raw.platform)) next.platform = raw.platform;
  Object.assign(next.settings, raw.settings || {});
  next.settings.canvasWidth = clamp(number(next.settings.canvasWidth, 620), 480, 760);
  next.settings.fontScale = clamp(number(next.settings.fontScale, 1), .85, 1.25);
  next.settings.exportScale = [2, 3].includes(number(next.settings.exportScale, 2)) ? number(next.settings.exportScale, 2) : 2;
  next.settings.mockup = Boolean(next.settings.mockup);
  next.settings.showMetrics = Boolean(next.settings.showMetrics);
  Object.keys(next.platforms).forEach((platform) => {
    Object.assign(next.platforms[platform], raw.platforms?.[platform] || {});
    next.platforms[platform].images = normalizeMedia(raw.platforms?.[platform]?.images, platform === "instagram" ? 9 : 4);
    next.platforms[platform].avatarRef = String(next.platforms[platform].avatarRef || "");
    next.platforms[platform].avatarZoom = clamp(number(next.platforms[platform].avatarZoom, 1), 1, 3);
    next.platforms[platform].avatarX = clamp(number(next.platforms[platform].avatarX, 50), 0, 100);
    next.platforms[platform].avatarY = clamp(number(next.platforms[platform].avatarY, 50), 0, 100);
    if (platform === "x") {
      next.platforms.x.coverRef = String(next.platforms.x.coverRef || "");
      next.platforms.x.coverZoom = clamp(number(next.platforms.x.coverZoom, 1), 1, 3);
      next.platforms.x.coverX = clamp(number(next.platforms.x.coverX, 50), 0, 100);
      next.platforms.x.coverY = clamp(number(next.platforms.x.coverY, 50), 0, 100);
    }
  });
  const rawInstagram = raw.platforms?.instagram;
  if (rawInstagram && !Object.prototype.hasOwnProperty.call(rawInstagram, "hashtags")) {
    const caption = String(next.platforms.instagram.caption || "");
    const inlineTags = caption.match(/#[^\s#]+/g) || [];
    if (inlineTags.length) {
      next.platforms.instagram.hashtags = inlineTags.join(" ");
      next.platforms.instagram.caption = caption.replace(/(?:\s*#[^\s#]+)+\s*$/, "").trim();
    }
  }
  next.platforms.instagram.profileNotificationEnabled = rawInstagram?.profileNotificationEnabled === undefined ? true : Boolean(rawInstagram.profileNotificationEnabled);
  next.platforms.instagram.profileNotificationCount = String(next.platforms.instagram.profileNotificationCount || "2");
  const legacyHighlightLabels = typeof rawInstagram?.highlights === "string"
    ? rawInstagram.highlights.split(/[,，]/).map((item) => item.trim()).filter(Boolean).filter((item) => item !== "新建").slice(0, 4)
    : [];
  const rawHighlights = Array.isArray(rawInstagram?.highlights) ? rawInstagram.highlights : [];
  next.platforms.instagram.highlights = Array.from({ length: 4 }, (_, index) => normalizeInstagramHighlight(rawHighlights[index] || { label: legacyHighlightLabels[index] || ["夜航","旧站","潮汐","档案"][index] }, index));
  const rawX = raw.platforms?.x;
  if (!next.platforms.x.coverRef && rawX?.mode === "profile" && next.platforms.x.images[0]) {
    const legacyCover = next.platforms.x.images[0];
    next.platforms.x.coverRef = legacyCover.assetRef;
    next.platforms.x.coverZoom = legacyCover.zoom;
    next.platforms.x.coverX = legacyCover.x;
    next.platforms.x.coverY = legacyCover.y;
  }
  const legacyProfilePost = normalizeXProfilePost({
    text: next.platforms.x.text,
    hashtags: next.platforms.x.hashtags,
    timestamp: next.platforms.x.timestamp,
    source: next.platforms.x.source,
    pinned: true,
    replies: next.platforms.x.replies,
    reposts: next.platforms.x.reposts,
    likes: next.platforms.x.likes,
    views: next.platforms.x.views,
    bookmarks: next.platforms.x.bookmarks,
    imageRef: next.platforms.x.images[1]?.assetRef || "",
    imageZoom: next.platforms.x.images[1]?.zoom || 1,
    imageX: next.platforms.x.images[1]?.x || 50,
    imageY: next.platforms.x.images[1]?.y || 50
  }, 0);
  next.platforms.x.profilePosts = (Array.isArray(rawX?.profilePosts) ? rawX.profilePosts : [legacyProfilePost]).slice(0, 20).map(normalizeXProfilePost);
  if (Array.isArray(rawX?.xReplies)) {
    next.platforms.x.xReplies = rawX.xReplies.slice(0, 20).map(normalizeXReply);
  } else if (rawX?.mode === "thread") {
    next.platforms.x.xReplies = [
      normalizeXReply({ displayName: next.platforms.x.displayName, handle: next.platforms.x.handle, verified: next.platforms.x.verified, avatarRef: next.platforms.x.avatarRef, avatarZoom: next.platforms.x.avatarZoom, avatarX: next.platforms.x.avatarX, avatarY: next.platforms.x.avatarY, text: next.platforms.x.thread2Text, timestamp: next.platforms.x.thread2Time, source: next.platforms.x.source }, 0),
      normalizeXReply({ displayName: next.platforms.x.displayName, handle: next.platforms.x.handle, verified: next.platforms.x.verified, avatarRef: next.platforms.x.avatarRef, avatarZoom: next.platforms.x.avatarZoom, avatarX: next.platforms.x.avatarX, avatarY: next.platforms.x.avatarY, text: next.platforms.x.thread3Text, timestamp: next.platforms.x.thread3Time, source: next.platforms.x.source }, 1),
      normalizeXReply({ displayName: next.platforms.x.replyName, handle: next.platforms.x.replyHandle, text: next.platforms.x.replyText, timestamp: next.platforms.x.replyTime, source: next.platforms.x.source }, 2)
    ];
  } else {
    next.platforms.x.xReplies = [];
  }
  const rawTumblr = raw.platforms?.tumblr;
  if (Array.isArray(rawTumblr?.reblogChain)) {
    next.platforms.tumblr.reblogChain = rawTumblr.reblogChain.slice(0, 20).map(normalizeTumblrReblog);
  } else {
    next.platforms.tumblr.reblogChain = [
      normalizeTumblrReblog({ blog: next.platforms.tumblr.reblog1Blog, text: next.platforms.tumblr.reblog1Text }, 0),
      normalizeTumblrReblog({ blog: next.platforms.tumblr.reblog2Blog, text: next.platforms.tumblr.reblog2Text }, 1)
    ].filter((item) => item.blog || item.text);
  }  if (!["post", "profile"].includes(next.platforms.x.mode)) next.platforms.x.mode = "post";
  if (!["post", "story", "reel", "carousel", "profile"].includes(next.platforms.instagram.mode)) next.platforms.instagram.mode = "post";
  if (!["post", "reblog", "quote", "photo"].includes(next.platforms.tumblr.mode)) next.platforms.tumblr.mode = "post";
  next.platforms.instagram.carouselPage = clamp(number(next.platforms.instagram.carouselPage, 1), 1, 4);
  if (!["light", "dim", "black", "custom"].includes(next.platforms.x.theme)) next.platforms.x.theme = "light";
  if (!["light", "dark", "custom"].includes(next.platforms.instagram.theme)) next.platforms.instagram.theme = "light";
  if (!["light", "navy", "dark", "custom"].includes(next.platforms.tumblr.theme)) next.platforms.tumblr.theme = "light";
  if (!["square", "portrait", "landscape"].includes(next.platforms.instagram.mediaRatio)) next.platforms.instagram.mediaRatio = "square";
  return next;
}

function readStoredState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); }
  catch { return null; }
}

function saveStoredState() {
  const indicator = $("#save-state");
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (indicator) {
      indicator.classList.remove("saving");
      indicator.innerHTML = "<i></i>已保存";
    }
  } catch {
    showToast("浏览器文字存储空间不足，请先保存 JSON。", true);
  }
}

function scheduleSave() {
  clearTimeout(saveTimer);
  const indicator = $("#save-state");
  if (indicator) {
    indicator.classList.add("saving");
    indicator.innerHTML = "<i></i>保存中";
  }
  saveTimer = setTimeout(saveStoredState, 320);
}

function captureHistory() {
  history.push(clone(state));
  if (history.length > MAX_HISTORY) history.shift();
  future = [];
  updateHistoryButtons();
}

function commit(mutator, options = {}) {
  if (options.history !== false) captureHistory();
  mutator(state);
  state = normalizeState(state);
  scheduleSave();
  if (options.editor !== false) renderEditor();
  renderCanvas();
}

function undo() {
  if (!history.length) return;
  future.push(clone(state));
  state = normalizeState(history.pop());
  scheduleSave();
  renderAll();
}

function redo() {
  if (!future.length) return;
  history.push(clone(state));
  state = normalizeState(future.pop());
  scheduleSave();
  renderAll();
}

function updateHistoryButtons() {
  $("#undo-button").disabled = !history.length;
  $("#redo-button").disabled = !future.length;
}

function showToast(message, error = false) {
  const toast = $("#toast");
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.style.background = error ? "#8f2f2f" : "#111";
  toast.classList.add("show");
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function openAssetDb() {
  if (assetDbPromise) return assetDbPromise;
  assetDbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(DB_STORE)) request.result.createObjectStore(DB_STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return assetDbPromise;
}

async function putAsset(blob, id = uid(), name = "asset") {
  const db = await openAssetDb();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(DB_STORE, "readwrite");
    transaction.objectStore(DB_STORE).put({ id, blob, name });
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  const cached = assetUrlCache.get(id);
  if (cached) URL.revokeObjectURL(cached);
  assetUrlCache.delete(id);
  return id;
}

async function getAsset(id) {
  if (!id) return null;
  const db = await openAssetDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(DB_STORE, "readonly").objectStore(DB_STORE).get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function getAssetUrl(id) {
  if (!id) return "";
  if (assetUrlCache.has(id)) return assetUrlCache.get(id);
  const record = await getAsset(id);
  if (!record?.blob) return "";
  const url = URL.createObjectURL(record.blob);
  assetUrlCache.set(id, url);
  return url;
}

async function deleteAsset(id) {
  if (!id) return;
  const db = await openAssetDb();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(DB_STORE, "readwrite");
    transaction.objectStore(DB_STORE).delete(id);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  const cached = assetUrlCache.get(id);
  if (cached) URL.revokeObjectURL(cached);
  assetUrlCache.delete(id);
}

async function hydrateAssets(root = document) {
  const images = $$("img[data-asset-ref]", root);
  await Promise.all(images.map(async (image) => {
    const url = await getAssetUrl(image.dataset.assetRef);
    if (!url) return;
    image.src = url;
    try { await image.decode(); } catch { /* The loaded image can still render. */ }
  }));
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl) {
  const [header, data] = dataUrl.split(",");
  const type = /data:([^;]+)/.exec(header)?.[1] || "application/octet-stream";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type });
}

function postData() {
  return state.platforms[state.platform];
}

function field(label, key, value, options = {}) {
  const type = options.type || "text";
  const placeholder = options.placeholder ? ` placeholder="${escapeHtml(options.placeholder)}"` : "";
  if (type === "textarea") {
    return `<label class="field"><span>${escapeHtml(label)}</span><textarea data-post-field="${key}"${placeholder}>${escapeHtml(value)}</textarea></label>`;
  }
  if (type === "select") {
    const choices = options.options.map(([optionValue, text]) => `<option value="${optionValue}"${optionValue === value ? " selected" : ""}>${escapeHtml(text)}</option>`).join("");
    return `<label class="field"><span>${escapeHtml(label)}</span><select data-post-field="${key}">${choices}</select></label>`;
  }
  return `<label class="field"><span>${escapeHtml(label)}</span><input data-post-field="${key}" type="${type}" value="${escapeHtml(value)}"${placeholder}></label>`;
}

function switchRow(label, key, checked, scope = "post") {
  return `<div class="switch-row"><span>${escapeHtml(label)}</span><label class="switch"><input data-${scope}-field="${key}" type="checkbox"${checked ? " checked" : ""}><i></i></label></div>`;
}

function avatarField(data, nameKey) {
  const initial = escapeHtml(String(data[nameKey] || "A").trim().charAt(0) || "A");
  const avatar = data.avatarRef
    ? `<img data-asset-ref="${escapeHtml(data.avatarRef)}" alt="" style="object-position:${data.avatarX}% ${data.avatarY}%;transform-origin:${data.avatarX}% ${data.avatarY}%;transform:scale(${data.avatarZoom})">`
    : initial;
  return `<div class="avatar-field">
    <div class="avatar-preview">${avatar}</div>
    <div class="avatar-actions">
      <label class="button compact">上传头像<input data-avatar-input type="file" accept="image/*"></label>
      ${data.avatarRef ? '<button class="button compact ghost" data-open-crop="main-avatar" type="button">调整裁切</button>' : ""}
      <button class="button compact ghost" data-remove-avatar type="button"${data.avatarRef ? "" : " disabled"}>移除</button>
    </div>
  </div>`;
}

function xCoverField(data) {
  const preview = data.coverRef
    ? `<img data-asset-ref="${escapeHtml(data.coverRef)}" alt="" style="object-position:${data.coverX}% ${data.coverY}%;transform-origin:${data.coverX}% ${data.coverY}%;transform:scale(${data.coverZoom})">`
    : '<span>账户背景预览</span>';
  return `<section class="card x-cover-field">
    <div class="card-title"><h3>账户背景图</h3><span>COVER</span></div>
    <div class="x-cover-preview">${preview}</div>
    <div class="avatar-actions">
      <label class="button compact">上传背景<input data-x-cover-input type="file" accept="image/*"></label>
      ${data.coverRef ? '<button class="button compact ghost" data-open-crop="x-cover" type="button">调整裁切</button>' : ""}
      <button class="button compact ghost" data-remove-x-cover type="button"${data.coverRef ? "" : " disabled"}>移除</button>
    </div>
  </section>`;
}

function xReplyEditorHtml(reply, index, total) {
  const replyField = (label, key, value, options = {}) => field(label, key, value, options).replaceAll("data-post-field", "data-x-reply-field");
  const initial = escapeHtml(String(reply.displayName || "R").trim().charAt(0) || "R");
  const avatar = reply.avatarRef ? `<img data-asset-ref="${escapeHtml(reply.avatarRef)}" alt="" style="object-position:${reply.avatarX}% ${reply.avatarY}%;transform-origin:${reply.avatarX}% ${reply.avatarY}%;transform:scale(${reply.avatarZoom})">` : initial;
  const collapsed = collapsedXReplies.has(reply.id);
  const image = reply.imageRef ? `<div class="x-reply-image-editor">
    <div class="media-editor-preview"><img data-asset-ref="${escapeHtml(reply.imageRef)}" alt="" style="object-position:${reply.imageX}% ${reply.imageY}%;transform-origin:${reply.imageX}% ${reply.imageY}%;transform:scale(${reply.imageZoom})"></div>
    <div class="media-editor-fields"><div class="media-editor-head"><b>回复图片</b><button data-remove-x-reply-image type="button">×</button></div>
      <button class="button compact ghost" data-open-crop="reply-image" data-crop-id="${escapeHtml(reply.id)}" type="button">调整裁切</button>
    </div></div>` : `<label class="button compact x-reply-image-add">添加回复图片<input data-x-reply-image-input type="file" accept="image/*"></label>`;
  return `<article class="x-reply-editor${collapsed ? " collapsed" : ""}" data-x-reply-id="${escapeHtml(reply.id)}">
    <header class="x-reply-editor-head">
      <button class="x-reply-drag" draggable="true" type="button" title="拖动排序">↕ 拖动</button>
      <button class="x-reply-toggle" data-toggle-x-reply type="button" aria-expanded="${collapsed ? "false" : "true"}"><span><b>回复 ${index + 1}</b><small>${escapeHtml(reply.displayName)} · ${escapeHtml(reply.text.slice(0, 22) || "未填写正文")}</small></span><i>${collapsed ? "＋" : "－"}</i></button>
      <div><button data-move-x-reply="up" type="button"${index === 0 ? " disabled" : ""}>↑</button><button data-move-x-reply="down" type="button"${index === total - 1 ? " disabled" : ""}>↓</button><button data-remove-x-reply type="button">删除</button></div>
    </header>
    <div class="x-reply-editor-body"${collapsed ? " hidden" : ""}>
      <div class="x-reply-avatar-row"><div class="avatar-preview">${avatar}</div><div class="avatar-actions"><label class="button compact">上传头像<input data-x-reply-avatar-input type="file" accept="image/*"></label>${reply.avatarRef ? `<button class="button compact ghost" data-open-crop="reply-avatar" data-crop-id="${escapeHtml(reply.id)}" type="button">调整裁切</button>` : ""}<button class="button compact ghost" data-remove-x-reply-avatar type="button"${reply.avatarRef ? "" : " disabled"}>移除</button></div></div>
      <div class="field-grid">${replyField("昵称", "displayName", reply.displayName)}${replyField("用户名", "handle", reply.handle)}</div>
      ${switchRow("显示账户徽章", "verified", reply.verified, "x-reply")}
      ${replyField("正文", "text", reply.text, { type: "textarea" })}${replyField("Hashtag", "hashtags", reply.hashtags)}
      <div class="field-grid">${replyField("发布时间", "timestamp", reply.timestamp)}${replyField("发布来源", "source", reply.source)}</div>
      ${switchRow("显示引用帖子", "quoteEnabled", reply.quoteEnabled, "x-reply")}
      ${reply.quoteEnabled ? `<div class="field-grid">${replyField("引用昵称", "quoteName", reply.quoteName)}${replyField("引用用户名", "quoteHandle", reply.quoteHandle)}</div>${replyField("引用正文", "quoteText", reply.quoteText, { type: "textarea" })}` : ""}
      ${image}
      <div class="x-reply-metrics"><div class="field-grid">${replyField("回复", "replies", reply.replies)}${replyField("转发", "reposts", reply.reposts)}</div><div class="field-grid">${replyField("喜欢", "likes", reply.likes)}${replyField("浏览", "views", reply.views)}</div>${replyField("收藏", "bookmarks", reply.bookmarks)}</div>
    </div>
  </article>`;
}

function xProfilePostEditorHtml(post, index, total) {
  const postField = (label, key, value, options = {}) => field(label, key, value, options).replaceAll("data-post-field", "data-x-profile-post-field");
  const collapsed = collapsedXProfilePosts.has(post.id);
  const image = post.imageRef ? `<div class="x-reply-image-editor"><div class="media-editor-preview"><img data-asset-ref="${escapeHtml(post.imageRef)}" alt="" style="object-position:${post.imageX}% ${post.imageY}%;transform-origin:${post.imageX}% ${post.imageY}%;transform:scale(${post.imageZoom})"></div><div class="media-editor-fields"><div class="media-editor-head"><b>帖子图片</b><button data-remove-x-profile-post-image type="button">×</button></div><button class="button compact ghost" data-open-crop="profile-post-image" data-crop-id="${escapeHtml(post.id)}" type="button">调整裁切</button></div></div>` : `<label class="button compact x-reply-image-add">添加帖子图片<input data-x-profile-post-image-input type="file" accept="image/*"></label>`;
  return `<article class="x-reply-editor x-profile-post-editor${collapsed ? " collapsed" : ""}" data-x-profile-post-id="${escapeHtml(post.id)}">
    <header class="x-reply-editor-head"><button class="x-reply-toggle" data-toggle-x-profile-post type="button" aria-expanded="${collapsed ? "false" : "true"}"><span><b>账户帖子 ${index + 1}</b><small>${post.pinned ? "置顶 · " : ""}${escapeHtml(post.text.slice(0, 26) || "未填写正文")}</small></span><i>${collapsed ? "＋" : "－"}</i></button><div><button data-move-x-profile-post="up" type="button"${index === 0 ? " disabled" : ""}>↑</button><button data-move-x-profile-post="down" type="button"${index === total - 1 ? " disabled" : ""}>↓</button><button data-remove-x-profile-post type="button">删除</button></div></header>
    <div class="x-reply-editor-body"${collapsed ? " hidden" : ""}>
      ${postField("正文", "text", post.text, { type: "textarea" })}${postField("Hashtag", "hashtags", post.hashtags)}
      <div class="field-grid">${postField("发布时间", "timestamp", post.timestamp)}${postField("发布来源", "source", post.source)}</div>
      ${switchRow("置顶帖子", "pinned", post.pinned, "x-profile-post")}${switchRow("显示引用帖子", "quoteEnabled", post.quoteEnabled, "x-profile-post")}
      ${post.quoteEnabled ? `<div class="field-grid">${postField("引用昵称", "quoteName", post.quoteName)}${postField("引用用户名", "quoteHandle", post.quoteHandle)}</div>${postField("引用正文", "quoteText", post.quoteText, { type: "textarea" })}` : ""}
      ${image}
      <div class="x-reply-metrics"><div class="field-grid">${postField("回复", "replies", post.replies)}${postField("转发", "reposts", post.reposts)}</div><div class="field-grid">${postField("喜欢", "likes", post.likes)}${postField("浏览", "views", post.views)}</div>${postField("收藏", "bookmarks", post.bookmarks)}</div>
    </div>
  </article>`;
}
function tumblrReblogEditorHtml(item, index, total) {
  const chainField = (label, key, value, options = {}) => field(label, key, value, options).replaceAll("data-post-field", "data-tumblr-reblog-field");
  const collapsed = collapsedTumblrReblogs.has(item.id);
  return `<article class="x-reply-editor tumblr-reblog-editor${collapsed ? " collapsed" : ""}" data-tumblr-reblog-id="${escapeHtml(item.id)}">
    <header class="x-reply-editor-head">
      <button class="x-reply-drag tumblr-reblog-drag" draggable="true" type="button" title="拖动排序">↕ 拖动</button>
      <button class="x-reply-toggle" data-toggle-tumblr-reblog type="button" aria-expanded="${collapsed ? "false" : "true"}"><span><b>转发层级 ${index + 1}</b><small>@${escapeHtml(item.blog)} · ${escapeHtml(item.text.slice(0, 22) || "未填写内容")}</small></span><i>${collapsed ? "＋" : "－"}</i></button>
      <div><button data-move-tumblr-reblog="up" type="button"${index === 0 ? " disabled" : ""}>↑</button><button data-move-tumblr-reblog="down" type="button"${index === total - 1 ? " disabled" : ""}>↓</button><button data-remove-tumblr-reblog type="button">删除</button></div>
    </header>
    <div class="x-reply-editor-body"${collapsed ? " hidden" : ""}>
      ${chainField("博客用户名", "blog", item.blog)}
      ${chainField("转发内容", "text", item.text, { type: "textarea" })}
    </div>
  </article>`;
}
function instagramHighlightsEditorHtml(data) {
  return `<section class="card ig-highlights-editor-card">
    <div class="card-title"><div><h3>精选动态</h3><p>“新建”固定显示；下面四项可分别设置封面和名称。</p></div><span>HIGHLIGHTS</span></div>
    <div class="ig-highlight-editor-list">${data.highlights.map((item, index) => {
      const preview = item.imageRef ? `<img data-asset-ref="${escapeHtml(item.imageRef)}" alt="" style="object-position:${item.x}% ${item.y}%;transform-origin:${item.x}% ${item.y}%;transform:scale(${item.zoom})">` : `<span>${index + 1}</span>`;
      return `<article class="ig-highlight-editor" data-ig-highlight-id="${escapeHtml(item.id)}">
        <div class="media-editor-preview ig-highlight-editor-preview">${preview}</div>
        <div class="ig-highlight-editor-fields">
          <label class="field"><span>精选 ${index + 1} 名称</span><input data-ig-highlight-field="label" type="text" value="${escapeHtml(item.label)}"></label>
          <div class="avatar-actions"><label class="button compact">上传封面<input data-ig-highlight-image-input type="file" accept="image/*"></label>${item.imageRef ? `<button class="button compact ghost" data-open-crop="ig-highlight" data-crop-id="${escapeHtml(item.id)}" type="button">调整裁切</button><button class="button compact ghost" data-remove-ig-highlight-image type="button">移除</button>` : ""}</div>
        </div>
      </article>`;
    }).join("")}</div>
  </section>`;
}
function renderContentForm() {
  const data = postData();
  const modeOptions = state.platform === "x"
    ? [["post","帖子 / 回复链"],["profile","账户页面"]]
    : state.platform === "instagram"
      ? [["post","普通帖子"],["carousel","多页轮播"],["story","Story"],["reel","Reels"],["profile","账户页面"]]
      : [["post","普通帖子"],["reblog","多级转发链"],["quote","引用帖子"],["photo","图片帖子"]];
  const selectedMode = modeOptions.find((item) => item[0] === data.mode)?.[1] || modeOptions[0][1];
  $("#content-heading").textContent = `${PLATFORM_LABELS[state.platform]} · ${selectedMode}`;
  const modeCard = `<section class="card mode-card">
    <div class="card-title"><h3>生成类型</h3><span>FORMAT</span></div>
    ${field("页面类型", "mode", data.mode, { type: "select", options: modeOptions })}
  </section>`;
  let html = modeCard;
  if (state.platform === "x") {
    html += `<section class="card">
      <div class="card-title"><h3>主帖账户资料</h3><span>PROFILE</span></div>
      ${avatarField(data, "displayName")}
      <div class="field-grid">${field("昵称", "displayName", data.displayName)}${field("用户名", "handle", data.handle)}</div>
      ${switchRow("显示账户徽章", "verified", data.verified)}
    </section>`;
    if (data.mode === "profile") {
      html += `${xCoverField(data)}<section class="card">
        <div class="card-title"><h3>账户页面资料</h3><span>ACCOUNT</span></div>
        ${field("个人简介", "profileBio", data.profileBio, { type: "textarea" })}
        <div class="field-grid">${field("所在地", "profileLocation", data.profileLocation)}${field("网站", "website", data.website)}</div>
        <div class="field-grid">${field("加入时间", "joined", data.joined)}${field("帖子数", "postsCount", data.postsCount)}</div>
        <div class="field-grid">${field("正在关注", "following", data.following)}${field("关注者", "followers", data.followers)}</div>
      </section><section class="card x-profile-post-manager">
        <div class="card-title"><div><h3>账户帖子</h3><p>帖子会自动使用上方的账户头像、昵称和用户名。</p></div><button class="button compact" data-add-x-profile-post type="button">新增帖子</button></div>
        <div class="x-reply-editor-list">${data.profilePosts.map((post, index) => xProfilePostEditorHtml(post, index, data.profilePosts.length)).join("") || '<div class="media-empty">尚未添加账户帖子。</div>'}</div>
      </section>`;
    } else {
      html += `<section class="card">
        <div class="card-title"><h3>主帖内容</h3><span>ROOT POST</span></div>
        ${field("正文", "text", data.text, { type: "textarea" })}${field("Hashtag（空格或逗号分隔）", "hashtags", data.hashtags)}
        <div class="field-grid">${field("发布时间", "timestamp", data.timestamp)}${field("发布来源", "source", data.source)}</div>
        ${switchRow("显示引用帖子", "quoteEnabled", data.quoteEnabled)}
        ${data.quoteEnabled ? `<div class="field-grid">${field("引用昵称", "quoteName", data.quoteName)}${field("引用用户名", "quoteHandle", data.quoteHandle)}</div>${field("引用正文", "quoteText", data.quoteText, { type: "textarea" })}` : ""}
      </section><section class="card">
        <div class="card-title"><h3>主帖互动数据</h3><span>METRICS</span></div>
        <div class="field-grid">${field("回复", "replies", data.replies)}${field("转发", "reposts", data.reposts)}</div><div class="field-grid">${field("喜欢", "likes", data.likes)}${field("浏览", "views", data.views)}</div>${field("收藏", "bookmarks", data.bookmarks)}
      </section><section class="card x-replies-manager">
        <div class="card-title"><div><h3>回复链</h3><p>没有回复时显示为单条帖子；可拖动手柄排序。</p></div><button class="button compact" data-add-x-reply type="button">新增回复</button></div>
        <div class="x-reply-editor-list">${data.xReplies.map((reply, index) => xReplyEditorHtml(reply, index, data.xReplies.length)).join("") || '<div class="media-empty">尚未添加回复。</div>'}</div>
      </section>`;
    }
  } else if (state.platform === "instagram") {
    html += `<section class="card">
      <div class="card-title"><h3>账户资料</h3><span>PROFILE</span></div>
      ${avatarField(data, "username")}
      <div class="field-grid">${field("用户名", "username", data.username)}${field("显示名称", "displayName", data.displayName)}</div>
      ${field("地点", "location", data.location)}
      ${switchRow("显示账户徽章", "verified", data.verified)}
    </section>`;
    if (data.mode === "profile") {
      html += `<section class="card">
        <div class="card-title"><h3>账户页面资料</h3><span>ACCOUNT</span></div>
        ${field("个人简介", "bio", data.bio, { type: "textarea" })}${field("网站", "website", data.website)}
        <div class="field-grid">${field("帖子", "postsCount", data.postsCount)}${field("关注者", "followers", data.followers)}</div>
        ${field("正在关注", "following", data.following)}
        ${switchRow("显示右上角通知红标", "profileNotificationEnabled", data.profileNotificationEnabled)}
        ${data.profileNotificationEnabled ? field("通知数字", "profileNotificationCount", data.profileNotificationCount) : ""}
      </section>${instagramHighlightsEditorHtml(data)}`;
    } else if (data.mode === "story") {
      html += `<section class="card"><div class="card-title"><h3>Story 内容</h3><span>STORY</span></div>
        ${field("画面文字", "storyText", data.storyText, { type: "textarea" })}${field("发布时间", "storyTime", data.storyTime)}
      </section>`;
    } else {
      html += `<section class="card"><div class="card-title"><h3>${data.mode === "reel" ? "Reels 内容" : data.mode === "carousel" ? "轮播内容" : "帖子内容"}</h3><span>POST</span></div>
        ${field("正文", "caption", data.caption, { type: "textarea" })}${field("Hashtag（空格或逗号分隔）", "hashtags", data.hashtags)}
        ${data.mode === "reel" ? field("音频信息", "reelAudio", data.reelAudio) : field("评论摘要", "comments", data.comments, { type: "textarea" })}
        <div class="field-grid">${field("点赞数", "likes", data.likes)}${field("发布时间", "timestamp", data.timestamp)}</div>
        ${data.mode !== "reel" ? field("媒体比例", "mediaRatio", data.mediaRatio, { type: "select", options: [["square","方形 1:1"],["portrait","竖图 4:5"],["landscape","横图 5:4"]] }) : ""}
        ${data.mode === "carousel" ? field("当前轮播页", "carouselPage", String(data.carouselPage), { type: "select", options: [["1","第 1 页"],["2","第 2 页"],["3","第 3 页"],["4","第 4 页"]] }) : ""}
      </section>`;
    }
  } else {
    html += `<section class="card">
      <div class="card-title"><h3>博客资料</h3><span>BLOG</span></div>
      ${avatarField(data, "blogName")}
      <div class="field-grid">${field("博客名称", "blogName", data.blogName)}${field("用户名", "handle", data.handle)}</div>
      ${field("转发来源", "reblogSource", data.reblogSource)}
    </section><section class="card">
      <div class="card-title"><h3>${data.mode === "reblog" ? "当前转发内容" : data.mode === "quote" ? "引用帖子" : data.mode === "photo" ? "图片帖子" : "帖子内容"}</h3><span>POST</span></div>
      ${data.mode !== "quote" && data.mode !== "reblog" ? field("标题", "title", data.title) : ""}
      ${field(data.mode === "photo" ? "图片说明" : data.mode === "reblog" ? "当前账户附言" : "正文", "text", data.text, { type: "textarea" })}
      ${data.mode === "quote" || data.mode === "post" ? field("引用", "quote", data.quote, { type: "textarea" }) : ""}
      ${field("Hashtag（空格或逗号分隔）", "tags", data.tags)}
      <div class="field-grid">${field("Notes", "notes", data.notes)}${field("发布时间", "timestamp", data.timestamp)}</div>
    </section>${data.mode === "reblog" ? `<section class="card x-replies-manager tumblr-reblog-manager">
      <div class="card-title"><div><h3>转发链</h3><p>每一层都可展开编辑，并支持拖动调整顺序。</p></div><button class="button compact" data-add-tumblr-reblog type="button">新增层级</button></div>
      <div class="x-reply-editor-list">${data.reblogChain.map((item, index) => tumblrReblogEditorHtml(item, index, data.reblogChain.length)).join("") || '<div class="media-empty">尚未添加上游转发。</div>'}</div>
    </section>` : ""}`;
  }
  contentForm.innerHTML = html;
  requestAnimationFrame(() => hydrateAssets(contentForm));
}

function themeOptions() {
  if (state.platform === "x") return [["light","默认白色","Light",""],["dim","暗淡蓝黑","Dim","dim"],["black","纯黑","Black","dark"],["custom","自定义","Custom",""]];
  if (state.platform === "instagram") return [["light","默认白色","Light",""],["dark","深色模式","Dark","dark"],["custom","自定义","Custom",""]];
  return [["light","浅色博客","Light",""],["navy","Dashboard 深蓝","Navy","navy"],["dark","深色博客","Dark","dark"],["custom","自定义","Custom",""]];
}

function renderStyleForm() {
  const data = postData();
  $("#theme-presets").innerHTML = themeOptions().map(([value, title, subtitle, swatch], index) => `
    <button class="theme-preset${data.theme === value && !(state.platform === "instagram" && index === 3) ? " active" : ""}" data-theme-option="${value}" type="button">
      <i class="${swatch}"></i><span><b>${title}</b><small>${subtitle}</small></span>
    </button>`).join("");
  const custom = data.theme === "custom" ? `<div class="color-grid">
    <label class="color-control"><span>画布背景</span><input data-setting-field="customBg" type="color" value="${escapeHtml(state.settings.customBg)}"></label>
    <label class="color-control"><span>主要文字</span><input data-setting-field="customInk" type="color" value="${escapeHtml(state.settings.customInk)}"></label>
    <label class="color-control"><span>次要文字</span><input data-setting-field="customMuted" type="color" value="${escapeHtml(state.settings.customMuted)}"></label>
    <label class="color-control"><span>强调颜色</span><input data-setting-field="customAccent" type="color" value="${escapeHtml(state.settings.customAccent)}"></label>
  </div>` : "";
  styleForm.innerHTML = `<div class="card-title"><h3>画布设置</h3><span>CANVAS</span></div>
    <label class="range-field"><span>画布宽度 <output>${Math.round(state.settings.canvasWidth)}px</output></span><input data-setting-field="canvasWidth" type="range" min="480" max="760" step="10" value="${state.settings.canvasWidth}"></label>
    <label class="range-field"><span>内容字号 <output>${Math.round(state.settings.fontScale * 100)}%</output></span><input data-setting-field="fontScale" type="range" min=".85" max="1.25" step=".05" value="${state.settings.fontScale}"></label>
    ${field("PNG 清晰度", "exportScale", String(state.settings.exportScale), { type: "select", options: [["2", "2×（约 840px 宽）"], ["3", "3×（约 1260px 宽）"]] }).replaceAll("data-post-field", "data-setting-field")}
    ${switchRow("显示互动数据", "showMetrics", state.settings.showMetrics, "setting")}
    ${switchRow("显示虚构内容水印", "mockup", state.settings.mockup, "setting")}
    ${field("水印文字", "mockupText", state.settings.mockupText).replaceAll("data-post-field", "data-setting-field")}
    ${custom}`;
}

function mediaLimit() {
  return state.platform === "instagram" && postData().mode === "profile" ? 9 : 4;
}

function renderMediaEditor() {
  const images = postData().images;
  const limit = mediaLimit();
  const sortable = ["x", "instagram"].includes(state.platform);
  const help = $(".media-card .card-title p");
  if (help) help.textContent = limit === 9 ? "Instagram 账户页最多 9 张网格图片，可拖动排序。" : `支持 1—${limit} 张图片${sortable ? "，可拖动排序" : ""}。`;
  if (!images.length) {
    mediaEditor.innerHTML = `<div class="media-empty">尚未上传图片。${limit === 9 ? "可添加最多 9 张账户网格图片。" : "图片可用于帖子媒体、Story、Reels 和网格。"}</div>`;
    return;
  }
  mediaEditor.innerHTML = images.map((item, index) => `
    <article class="media-editor-card" data-media-id="${escapeHtml(item.id)}">
      <div class="media-editor-preview"><img data-asset-ref="${escapeHtml(item.assetRef)}" alt="" style="object-position:${item.x}% ${item.y}%;transform-origin:${item.x}% ${item.y}%;transform:scale(${item.zoom})"></div>
      <div class="media-editor-fields">
        <div class="media-editor-head">${sortable ? '<button class="media-drag" draggable="true" type="button" title="拖动排序">↕</button>' : ""}<b>图片 ${index + 1}</b><div class="media-order-actions">${sortable ? `<button data-move-media="up" type="button"${index === 0 ? " disabled" : ""}>↑</button><button data-move-media="down" type="button"${index === images.length - 1 ? " disabled" : ""}>↓</button>` : ""}<button data-remove-media type="button" aria-label="删除图片">×</button></div></div>
        <button class="button compact ghost" data-open-crop="main-media" data-crop-id="${escapeHtml(item.id)}" type="button">拖动裁切</button>
      </div>
    </article>`).join("");
  requestAnimationFrame(() => hydrateAssets(mediaEditor));
}
function renderEditor() {
  $$("[data-platform-option]").forEach((button) => button.classList.toggle("active", button.dataset.platformOption === state.platform));
  renderContentForm();
  renderStyleForm();
  renderMediaEditor();
  updateHistoryButtons();
}

function avatarHtml(ref, name, zoom = 1, x = 50, y = 50) {
  const initial = escapeHtml(String(name || "A").trim().charAt(0) || "A");
  return `<div class="post-avatar">${ref ? `<img data-asset-ref="${escapeHtml(ref)}" alt="" style="object-position:${x}% ${y}%;transform-origin:${x}% ${y}%;transform:scale(${zoom})">` : initial}</div>`;
}

function mediaGridHtml(images, platform) {
  if (!images.length && platform !== "instagram") return "";
  const visibleImages = platform === "instagram" ? images.slice(0, 1) : images;
  const cells = visibleImages.length ? visibleImages.map((item) => `
    <div class="media-cell"><img data-asset-ref="${escapeHtml(item.assetRef)}" alt="" style="object-position:${item.x}% ${item.y}%;transform-origin:${item.x}% ${item.y}%;transform:scale(${item.zoom})"></div>`).join("")
    : `<div class="media-cell"><span class="media-placeholder">UPLOAD MEDIA</span></div>`;
  return `<div class="media-grid" data-count="${Math.max(1, visibleImages.length)}">${cells}</div>`;
}

function mockupHtml() {
  return state.settings.mockup ? `<span class="mockup-label">${escapeHtml(state.settings.mockupText || "MOCKUP")}</span>` : "";
}

function socialIcon(name) {
  return `<span class="social-icon icon-${name}" aria-hidden="true"></span>`;
}

function hashtagHtml(value, className = "") {
  const tags = String(value || "").split(/[\s,，]+/).map((tag) => tag.trim().replace(/^#+/, "")).filter(Boolean);
  if (!tags.length) return "";
  return `<div class="post-hashtags ${className}">${tags.map((tag) => `<span>#${escapeHtml(tag)}</span>`).join("")}</div>`;
}

function positionedMediaHtml(item, placeholder = "UPLOAD MEDIA") {
  return item
    ? `<img data-asset-ref="${escapeHtml(item.assetRef)}" alt="" style="object-position:${item.x}% ${item.y}%;transform-origin:${item.x}% ${item.y}%;transform:scale(${item.zoom})">`
    : `<span class="media-placeholder">${escapeHtml(placeholder)}</span>`;
}

function xIdentityHtml(data, compact = false) {
  return `<div class="x-inline-identity ${compact ? "compact" : ""}">
    ${avatarHtml(data.avatarRef, data.displayName, data.avatarZoom, data.avatarX, data.avatarY)}
    <div class="x-author"><div class="x-name-line"><span class="x-name">${escapeHtml(data.displayName)}</span>${data.verified ? '<span class="verified-badge">✓</span>' : ""}</div><div class="x-handle">${escapeHtml(data.handle)}</div></div>
  </div>`;
}

function xMetricsHtml(data) {
  if (!state.settings.showMetrics) return "";
  return `<div class="x-metrics">
    <span class="metric">${socialIcon("reply")}${escapeHtml(data.replies)}</span>
    <span class="metric">${socialIcon("repost")}${escapeHtml(data.reposts)}</span>
    <span class="metric"><i class="heart-glyph">♡</i>${escapeHtml(data.likes)}</span>
    <span class="metric">${socialIcon("analytics")}${escapeHtml(data.views)}</span>
    <span class="metric">${socialIcon("bookmark")}${escapeHtml(data.bookmarks)}</span>
  </div>`;
}

function xQuoteHtml(data) {
  return data.quoteEnabled ? `<div class="x-quote">
    <div class="x-quote-author"><b>${escapeHtml(data.quoteName)}</b><span>${escapeHtml(data.quoteHandle)}</span></div>
    <p>${escapeHtml(data.quoteText)}</p>
  </div>` : "";
}

function renderXPost(data) {
  return `<section class="post-shell x-post">
    <header class="x-header">${xIdentityHtml(data)}<span class="x-more">···</span></header>
    <p class="x-text">${escapeHtml(data.text)}</p>
    ${hashtagHtml(data.hashtags, "x-hashtags")}
    ${mediaGridHtml(data.images, "x")}
    ${xQuoteHtml(data)}
    <div class="x-meta">${escapeHtml(data.timestamp)} · ${escapeHtml(data.source)}${state.settings.showMetrics ? ` · <b>${escapeHtml(data.views)}</b> 浏览` : ""}</div>
    ${xMetricsHtml(data)}
  </section>${mockupHtml()}`;
}

function renderXThread(data) {
  const replies = data.xReplies || [];
  const replyHtml = (entry) => {
    const replyMedia = entry.imageRef ? `<div class="x-reply-media">${positionedMediaHtml({ assetRef: entry.imageRef, x: entry.imageX, y: entry.imageY, zoom: entry.imageZoom })}</div>` : "";
    const actions = state.settings.showMetrics ? `<div class="x-thread-count-actions">
      <span>${socialIcon("reply")}${escapeHtml(entry.replies)}</span><span>${socialIcon("repost")}${escapeHtml(entry.reposts)}</span><span>♡ ${escapeHtml(entry.likes)}</span><span>${socialIcon("analytics")}${escapeHtml(entry.views)}</span><span>${socialIcon("bookmark")}${escapeHtml(entry.bookmarks)}</span>
    </div>` : "";
    return `<article class="x-thread-node reply-node">
      <div class="x-thread-avatar">${avatarHtml(entry.avatarRef, entry.displayName, entry.avatarZoom, entry.avatarX, entry.avatarY)}</div>
      <div class="x-thread-content"><div class="x-thread-name"><b>${escapeHtml(entry.displayName)}</b>${entry.verified ? '<span class="verified-badge">✓</span>' : ""}<span>${escapeHtml(entry.handle)} · ${escapeHtml(entry.timestamp)}</span></div>
        <p>${escapeHtml(entry.text)}</p>${hashtagHtml(entry.hashtags, "x-hashtags")}${replyMedia}${xQuoteHtml(entry)}
        <div class="x-thread-source">${escapeHtml(entry.source)}</div>${actions}
      </div>
    </article>`;
  };
  return `<section class="post-shell x-thread">
    <div class="x-thread-heading"><b>POST</b><span>${replies.length + 1} POSTS</span></div>
    <article class="x-thread-root">
      <header class="x-header">${xIdentityHtml(data)}<span class="x-more">···</span></header>
      <p class="x-text">${escapeHtml(data.text)}</p>${hashtagHtml(data.hashtags, "x-hashtags")}
      ${mediaGridHtml(data.images, "x")}${xQuoteHtml(data)}
      <div class="x-meta">${escapeHtml(data.timestamp)} · ${escapeHtml(data.source)}${state.settings.showMetrics ? ` · <b>${escapeHtml(data.views)}</b> 浏览` : ""}</div>${xMetricsHtml(data)}
    </article>
    <div class="x-thread-replies">${replies.map(replyHtml).join("")}</div>
  </section>${mockupHtml()}`;
}
function renderXProfile(data) {
  const cover = data.coverRef
    ? positionedMediaHtml({ assetRef: data.coverRef, x: data.coverX, y: data.coverY, zoom: data.coverZoom }, "PROFILE COVER")
    : positionedMediaHtml(null, "PROFILE COVER");
  const posts = (data.profilePosts || []).map((post) => `<article class="x-profile-feed-post">
    ${post.pinned ? '<small class="x-profile-pinned-label">PINNED POST</small>' : ""}
    <div class="x-profile-post-head">${xIdentityHtml(data, true)}</div>
    <div class="x-profile-post-copy"><p>${escapeHtml(post.text)}</p>${hashtagHtml(post.hashtags, "x-hashtags")}
      ${post.imageRef ? `<div class="x-profile-post-image">${positionedMediaHtml({ assetRef: post.imageRef, x: post.imageX, y: post.imageY, zoom: post.imageZoom })}</div>` : ""}
      ${xQuoteHtml(post)}<div class="x-meta">${escapeHtml(post.timestamp)} · ${escapeHtml(post.source)}</div>${xMetricsHtml(post)}
    </div>
  </article>`).join("") || '<div class="x-profile-empty">尚未发布帖子</div>';
  return `<section class="post-shell x-profile">
    <div class="x-profile-topbar"><b>账户</b><span>${escapeHtml(data.postsCount)} POSTS</span></div>
    <div class="x-profile-cover">${cover}</div>
    <div class="x-profile-main">
      <div class="x-profile-avatar-row">${avatarHtml(data.avatarRef, data.displayName, data.avatarZoom, data.avatarX, data.avatarY)}<button type="button">FOLLOW</button></div>
      <div class="x-profile-name"><div class="x-name-line"><span class="x-name">${escapeHtml(data.displayName)}</span>${data.verified ? '<span class="verified-badge">✓</span>' : ""}</div><span>${escapeHtml(data.handle)}</span></div>
      <p class="x-profile-bio">${escapeHtml(data.profileBio)}</p>
      <div class="x-profile-meta"><span>${socialIcon("location")}${escapeHtml(data.profileLocation)}</span><span>${socialIcon("link")}${escapeHtml(data.website)}</span><span>${socialIcon("joined")}${escapeHtml(data.joined)}</span></div>
      <div class="x-profile-stats"><span><b>${escapeHtml(data.following)}</b> 正在关注</span><span><b>${escapeHtml(data.followers)}</b> 关注者</span></div>
      <nav class="x-profile-nav"><b>帖子</b><span>回复</span><span>媒体</span><span>喜欢</span></nav>
      <div class="x-profile-feed">${posts}</div>
    </div>
  </section>${mockupHtml()}`;
}
function renderX(data) {
  if (data.mode === "profile") return renderXProfile(data);
  if (data.xReplies?.length) return renderXThread(data);
  return renderXPost(data);
}

function instagramMediaForPage(data) {
  const max = Math.max(1, data.images.length);
  const page = data.mode === "carousel" ? clamp(number(data.carouselPage, 1), 1, max) : 1;
  const item = data.images[page - 1] || data.images[0];
  return { page, item, total: data.images.length };
}

function renderInstagramPost(data) {
  const width = state.settings.canvasWidth;
  const { page, item, total } = instagramMediaForPage(data);
  const mediaHeight = item ? (data.mediaRatio === "portrait" ? width * 1.25 : data.mediaRatio === "landscape" ? width * .8 : width) : width * .56;
  const metrics = state.settings.showMetrics ? `<div class="ig-likes">${escapeHtml(data.likes)} 次赞</div>` : "";
  const dots = data.mode === "carousel" && total > 1 ? `<div class="ig-dots">${data.images.map((_, index) => `<i class="${index + 1 === page ? "active" : ""}"></i>`).join("")}</div>` : "";
  const media = mediaGridHtml(item ? [item] : [], "instagram");
  return `<section class="post-shell instagram-post" style="--ig-media-height:${Math.round(mediaHeight)}px">
    <header class="ig-header">
      ${avatarHtml(data.avatarRef, data.username, data.avatarZoom, data.avatarX, data.avatarY)}
      <div class="ig-account"><div class="ig-account-line"><b>${escapeHtml(data.username)}</b>${data.verified ? '<span class="verified-badge">✓</span>' : ""}</div><div class="ig-location">${escapeHtml(data.location)}</div></div><span class="ig-more">•••</span>
    </header>
    <div class="ig-media-wrap">${media}${data.mode === "carousel" && total > 1 ? `<span class="ig-page">${page}/${total}</span>` : ""}</div>
    <div class="ig-body"><div class="ig-actions"><span class="heart-glyph">♡</span>${socialIcon("reply")}${socialIcon("paper-plane")}<span class="save">${socialIcon("bookmark")}</span></div>
      ${dots}${metrics}<p class="ig-caption"><b>${escapeHtml(data.username)}</b>${escapeHtml(data.caption)}</p>${hashtagHtml(data.hashtags, "ig-hashtags")}
      <div class="ig-comments">${escapeHtml(data.comments)}</div><div class="ig-time">${escapeHtml(data.timestamp)}</div>
    </div>
  </section>${mockupHtml()}`;
}

function renderInstagramStory(data, reel = false) {
  const media = positionedMediaHtml(data.images[0], reel ? "REELS COVER" : "STORY MEDIA");
  if (reel) return `<section class="post-shell ig-vertical ig-reel">
    <div class="ig-vertical-media">${media}</div><div class="ig-vertical-shade"></div>
    <header class="ig-vertical-header"><b>Reels</b><span>•••</span></header>
    <div class="ig-reel-rail"><span>♡<small>${escapeHtml(data.likes)}</small></span>${socialIcon("reply")}${socialIcon("paper-plane")}${socialIcon("bookmark")}</div>
    <div class="ig-reel-copy"><div class="ig-reel-user">${avatarHtml(data.avatarRef, data.username, data.avatarZoom, data.avatarX, data.avatarY)}<b>${escapeHtml(data.username)}</b><button>关注</button></div><p>${escapeHtml(data.caption)}</p>${hashtagHtml(data.hashtags, "ig-hashtags")}<small>♫ ${escapeHtml(data.reelAudio)}</small></div>
  </section>${mockupHtml()}`;
  return `<section class="post-shell ig-vertical ig-story">
    <div class="ig-vertical-media">${media}</div><div class="ig-vertical-shade"></div>
    <div class="ig-story-progress"><i></i><i></i><i></i></div>
    <header class="ig-story-header">${avatarHtml(data.avatarRef, data.username, data.avatarZoom, data.avatarX, data.avatarY)}<b>${escapeHtml(data.username)}</b><span>${escapeHtml(data.storyTime)}</span><em>•••</em></header>
    <div class="ig-story-text">${escapeHtml(data.storyText)}</div><div class="ig-story-reply">发送消息… ${socialIcon("paper-plane")}</div>
  </section>${mockupHtml()}`;
}

function renderInstagramProfile(data) {
  const gridItems = Array.from({ length: 9 }, (_, index) => data.images[index] || null);
  const grid = gridItems.map((item) => `<div class="ig-profile-cell">${item ? positionedMediaHtml(item, "POST") : '<span class="ig-grid-placeholder"></span>'}</div>`).join("");
  const highlightItems = (data.highlights || []).slice(0, 4);
  const highlights = `<div class="ig-highlight"><div class="ig-highlight-ring add">${socialIcon("ins-add")}</div><span>新建</span></div>${highlightItems.map((item) => `<div class="ig-highlight"><div class="ig-highlight-ring">${item.imageRef ? positionedMediaHtml({ assetRef: item.imageRef, x: item.x, y: item.y, zoom: item.zoom }, "") : ""}</div><span>${escapeHtml(item.label)}</span></div>`).join("")}`;
  const notification = data.profileNotificationEnabled ? `<i>${escapeHtml(data.profileNotificationCount || "0")}</i>` : "";
  return `<section class="post-shell ig-profile">
    <header class="ig-profile-top"><b>${escapeHtml(data.username)}</b><div class="ig-profile-top-actions"><span class="ig-threads-action">${socialIcon("ins-threads")}${notification}</span>${socialIcon("ins-add")}<span class="ig-profile-menu" aria-hidden="true"><i></i><i></i><i></i></span></div></header>
    <div class="ig-profile-summary"><div class="ig-profile-avatar-wrap"><div class="ig-profile-avatar-ring">${avatarHtml(data.avatarRef, data.username, data.avatarZoom, data.avatarX, data.avatarY)}</div><span class="ig-avatar-add">＋</span></div><div><b>${escapeHtml(data.postsCount)}</b><span>帖子</span></div><div><b>${escapeHtml(data.followers)}</b><span>关注者</span></div><div><b>${escapeHtml(data.following)}</b><span>正在关注</span></div></div>
    <div class="ig-profile-bio"><b>${escapeHtml(data.displayName)}</b><p>${escapeHtml(data.bio)}</p><a>${escapeHtml(data.website)}</a></div>
    <div class="ig-profile-buttons"><button>编辑个人资料</button><button>分享主页</button></div>
    <div class="ig-highlights">${highlights}</div>
    <nav class="ig-profile-tabs"><b>${socialIcon("ins-grid")}</b><span>${socialIcon("ins-reels")}</span><span>${socialIcon("ins-tagged")}</span></nav>
    <div class="ig-profile-grid">${grid}</div>
  </section>${mockupHtml()}`;
}
function renderInstagram(data) {
  if (data.mode === "story") return renderInstagramStory(data, false);
  if (data.mode === "reel") return renderInstagramStory(data, true);
  if (data.mode === "profile") return renderInstagramProfile(data);
  return renderInstagramPost(data);
}

function tumblrHeaderHtml(data) {
  return `<header class="tumblr-header">${avatarHtml(data.avatarRef, data.blogName, data.avatarZoom, data.avatarX, data.avatarY)}<div class="tumblr-account"><b>${escapeHtml(data.blogName)}</b><div class="tumblr-source">${escapeHtml(data.reblogSource || `@${data.handle}`)}</div></div><span class="tumblr-follow">FOLLOW</span></header>`;
}

function tumblrFooterHtml(data) {
  const metrics = state.settings.showMetrics ? `<span class="tumblr-notes">${escapeHtml(data.notes)}</span>` : "<span></span>";
  return `<footer class="tumblr-footer"><span>${metrics}${data.timestamp ? ` · ${escapeHtml(data.timestamp)}` : ""}</span><div class="tumblr-actions">${socialIcon("repost")}<span class="heart-glyph">♡</span></div></footer>`;
}

function renderTumblr(data) {
  if (data.mode === "reblog") {
    const chain = (data.reblogChain || []).map((item) => `<div class="tumblr-reblog-level"><b>@${escapeHtml(item.blog)}</b><p>${escapeHtml(item.text)}</p></div>`).join("");
    return `<section class="post-shell tumblr-post tumblr-reblog">${tumblrHeaderHtml(data)}<div class="tumblr-body">
      ${chain}<div class="tumblr-reblog-level current"><b>@${escapeHtml(data.handle)}</b><p>${escapeHtml(data.text)}</p></div>
      ${mediaGridHtml(data.images, "tumblr")}${hashtagHtml(data.tags, "tumblr-tags")}${tumblrFooterHtml(data)}</div></section>${mockupHtml()}`;
  }
  const photoFirst = data.mode === "photo" ? (data.images.length ? mediaGridHtml(data.images, "tumblr") : `<div class="media-grid" data-count="1"><div class="media-cell">${positionedMediaHtml(null, "PHOTO")}</div></div>`) : "";
  const regularMedia = data.mode !== "photo" ? mediaGridHtml(data.images, "tumblr") : "";
  return `<section class="post-shell tumblr-post ${data.mode === "quote" ? "tumblr-quote-post" : data.mode === "photo" ? "tumblr-photo-post" : ""}">${tumblrHeaderHtml(data)}<div class="tumblr-body">
    ${photoFirst}${data.title && data.mode !== "quote" ? `<h1 class="tumblr-title">${escapeHtml(data.title)}</h1>` : ""}
    ${data.mode === "quote" ? `<blockquote class="tumblr-quote primary">${escapeHtml(data.quote)}</blockquote><p class="tumblr-text">${escapeHtml(data.text)}</p>` : `<p class="tumblr-text">${escapeHtml(data.text)}</p>${data.quote ? `<blockquote class="tumblr-quote">${escapeHtml(data.quote)}</blockquote>` : ""}`}
    ${regularMedia}${hashtagHtml(data.tags, "tumblr-tags")}${tumblrFooterHtml(data)}</div></section>${mockupHtml()}`;
}

function applyCanvasSettings() {
  const data = postData();
  canvas.dataset.platform = state.platform;
  canvas.dataset.theme = data.theme;
  canvas.dataset.mode = data.mode || "post";
  canvas.style.setProperty("--canvas-width", `${state.settings.canvasWidth}px`);
  canvas.style.setProperty("--font-scale", state.settings.fontScale);
  canvas.style.setProperty("--custom-bg", state.settings.customBg);
  canvas.style.setProperty("--custom-ink", state.settings.customInk);
  canvas.style.setProperty("--custom-muted", state.settings.customMuted);
  canvas.style.setProperty("--custom-accent", state.settings.customAccent);
}

function renderCanvas() {
  applyCanvasSettings();
  const data = postData();
  canvas.innerHTML = state.platform === "x" ? renderX(data) : state.platform === "instagram" ? renderInstagram(data) : renderTumblr(data);
  requestAnimationFrame(async () => {
    await hydrateAssets(canvas);
    fitCanvas();
  });
}

function fitCanvas() {
  if (!canvas || !frame || !viewport) return;
  const width = state.settings.canvasWidth;
  canvas.style.width = `${width}px`;
  canvas.style.transform = "none";
  const height = Math.max(320, canvas.scrollHeight);
  const style = getComputedStyle(viewport);
  const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  const paddingY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
  const rect = viewport.getBoundingClientRect();
  const availableWidth = Math.max(180, rect.width - paddingX);
  const availableHeight = Math.max(160, rect.height - paddingY);
  const focus = document.body.classList.contains("focus-mode");
  const preferredWidth = state.platform === "instagram" ? 420 : 500;
  const preferredScale = Math.min(1, preferredWidth / width);
  const scale = focus
    ? Math.min(1, availableWidth / width, availableHeight / height)
    : Math.min(preferredScale, availableWidth / width);
  canvas.style.transform = `scale(${scale})`;
  frame.style.width = `${Math.round(width * scale)}px`;
  frame.style.height = `${Math.round(height * scale)}px`;
}

function renderAll() {
  renderEditor();
  renderCanvas();
}

async function addMediaFiles(files) {
  const limit = mediaLimit();
  const remaining = Math.max(0, limit - postData().images.length);
  const selected = [...files].slice(0, remaining);
  if (!selected.length) {
    showToast(`当前页面最多添加 ${limit} 张图片。`, true);
    return;
  }
  captureHistory();
  try {
    for (const file of selected) {
      const assetRef = await putAsset(file, uid(), file.name);
      postData().images.push({ id: uid(), assetRef, name: file.name, zoom: 1, x: 50, y: 50 });
    }
    scheduleSave();
    renderAll();
    restoreUploadScroll(true);
    showToast("图片已上传，可拖动排序或点击“拖动裁切”调整取景。");
  } catch (error) {
    console.error("Image upload failed", error);
    showToast("图片上传失败，请尝试 JPG、PNG 或 WebP。", true);
    renderAll();
    restoreUploadScroll(true);
  }
}
function collectAssetRefs(project = state) {
  const refs = new Set();
  Object.values(project.platforms || {}).forEach((platform) => {
    if (platform.avatarRef) refs.add(platform.avatarRef);
    if (platform.coverRef) refs.add(platform.coverRef);
    (platform.images || []).forEach((item) => item.assetRef && refs.add(item.assetRef));
    (platform.xReplies || []).forEach((reply) => { if (reply.avatarRef) refs.add(reply.avatarRef); if (reply.imageRef) refs.add(reply.imageRef); });
    (platform.profilePosts || []).forEach((post) => post.imageRef && refs.add(post.imageRef));
    (platform.highlights || []).forEach((item) => item.imageRef && refs.add(item.imageRef));
  });
  return [...refs];
}

async function exportJson() {
  const button = $("#save-json-button");
  button.disabled = true;
  try {
    const assets = {};
    for (const ref of collectAssetRefs()) {
      const record = await getAsset(ref);
      if (record?.blob) assets[ref] = { name: record.name, data: await blobToDataUrl(record.blob) };
    }
    const payload = { format: "social-post-generator", version: 6, project: state, assets };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    downloadBlob(blob, `social-post-${state.platform}.json`);
    showToast("JSON 备份已生成。");
  } finally {
    button.disabled = false;
  }
}

async function importJson(file) {
  const payload = JSON.parse(await file.text());
  const project = payload.project || payload;
  if (payload.assets && typeof payload.assets === "object") {
    for (const [id, asset] of Object.entries(payload.assets)) {
      if (asset?.data) await putAsset(dataUrlToBlob(asset.data), id, asset.name || "asset");
    }
  }
  captureHistory();
  state = normalizeState(project);
  scheduleSave();
  renderAll();
  showToast("项目已导入。");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function exportPng() {
  if (!window.htmlToImage) {
    showToast("导出组件未加载。", true);
    return;
  }
  const buttons = [$("#export-button")].filter(Boolean);
  buttons.forEach((button) => { button.disabled = true; });
  const originalTransform = canvas.style.transform;
  const originalCarouselPage = state.platforms.instagram.carouselPage;
  const isCarouselBatch = state.platform === "instagram" && postData().mode === "carousel" && postData().images.length > 1;
  const pages = isCarouselBatch ? postData().images.map((_, index) => index + 1) : [null];
  try {
    const exportScale = [2, 3].includes(number(state.settings.exportScale, 2)) ? number(state.settings.exportScale, 2) : 2;
    await document.fonts.ready;
    for (const page of pages) {
      if (page) {
        state.platforms.instagram.carouselPage = page;
        renderCanvas();
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      }
      showToast(page ? `正在导出轮播 ${page}/${pages.length}…` : `正在准备 ${exportScale}× 图片…`);
      await hydrateAssets(canvas);
      canvas.classList.add("exporting");
      canvas.style.transform = "none";
      const width = state.settings.canvasWidth;
      const height = Math.max(320, canvas.scrollHeight);
      const exportPixelRatio = (420 * exportScale) / width;
      const blob = await window.htmlToImage.toBlob(canvas, {
        width,
        height,
        pixelRatio: exportPixelRatio,
        cacheBust: false,
        backgroundColor: getComputedStyle(canvas).getPropertyValue("--post-bg").trim() || "#ffffff"
      });
      const mode = postData().mode || "post";
      const pageSuffix = page ? `-page-${page}` : "";
      downloadBlob(blob, `${state.platform}-${mode}${pageSuffix}-${new Date().toISOString().slice(0,10)}.png`);
      canvas.classList.remove("exporting");
    }
    showToast(isCarouselBatch ? `${pages.length} 张轮播 PNG 已生成。` : "PNG 已生成。");
  } catch (error) {
    console.error(error);
    showToast("导出失败，请尝试减少图片尺寸后重试。", true);
  } finally {
    state.platforms.instagram.carouselPage = originalCarouselPage;
    canvas.classList.remove("exporting");
    canvas.style.transform = originalTransform;
    buttons.forEach((button) => { button.disabled = false; });
    renderCanvas();
  }
}

function initMobileResizer() {
  const workspace = $(".workspace");
  const resizer = $("#mobile-resizer");
  const query = window.matchMedia("(max-width: 760px)");
  let ratio = .46;
  try {
    const stored = number(localStorage.getItem(MOBILE_RATIO_KEY), .46);
    if (stored >= .22 && stored <= .72) ratio = stored;
  } catch { /* Keep the default ratio. */ }
  let resizing = false;

  const apply = (height, persist = true) => {
    if (!query.matches) return;
    const available = workspace.clientHeight;
    const min = Math.max(100, available * .22);
    const max = Math.max(min, Math.min(available * .72, available - 190));
    const next = clamp(height, min, max);
    ratio = next / Math.max(1, available);
    workspace.style.setProperty("--mobile-preview-height", `${next}px`);
    resizer.setAttribute("aria-valuenow", String(Math.round(ratio * 100)));
    if (persist) {
      try { localStorage.setItem(MOBILE_RATIO_KEY, String(ratio)); } catch { /* Session-only is acceptable. */ }
    }
    requestAnimationFrame(fitCanvas);
  };
  const reset = () => {
    if (query.matches) apply(workspace.clientHeight * ratio, false);
    else workspace.style.removeProperty("--mobile-preview-height");
  };
  const fromPointer = (clientY) => apply(clientY - workspace.getBoundingClientRect().top);
  resizer.addEventListener("pointerdown", (event) => {
    if (!query.matches) return;
    resizing = true;
    resizer.setPointerCapture(event.pointerId);
    document.body.classList.add("mobile-resizing");
    fromPointer(event.clientY);
  });
  resizer.addEventListener("pointermove", (event) => resizing && fromPointer(event.clientY));
  const stop = (event) => {
    if (!resizing) return;
    resizing = false;
    if (resizer.hasPointerCapture?.(event.pointerId)) resizer.releasePointerCapture(event.pointerId);
    document.body.classList.remove("mobile-resizing");
  };
  resizer.addEventListener("pointerup", stop);
  resizer.addEventListener("pointercancel", stop);
  resizer.addEventListener("keydown", (event) => {
    if (!["ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    apply($("#preview-panel").getBoundingClientRect().height + (event.key === "ArrowDown" ? 24 : -24));
  });
  resizer.addEventListener("dblclick", () => apply(workspace.clientHeight * .46));
  window.addEventListener("resize", reset);
  query.addEventListener?.("change", reset);
  requestAnimationFrame(reset);
}

const TUTORIAL_STEPS = [
  [".workspace", "一页完成整个帖子", "上方或左侧是实时画布，另一侧是编辑器。修改内容后，成品会立即更新。"],
  [".platform-switch", "选择平台模板", "X、Instagram 和 Tumblr 分别保存内容，切换平台不会覆盖其他平台已经填写的帖子。"],
  [".content-panel", "内容、预览与样式分栏", "桌面端左侧编辑内容，中间查看成品，右侧调整样式；手机端仍可使用两个小按钮切换。"],
  [".media-card", "上传并调整图片", "每个帖子最多使用四张图片。上传后可以分别改变缩放与取景位置。"],
  [".top-actions", "保存与导出", "项目会自动保存，也可以生成包含图片的 JSON，或者直接导出高清 PNG。"]
];

let tutorialLayer = null;
let tutorialIndex = 0;
let tutorialTarget = null;

function tutorialSeen() {
  try { return localStorage.getItem(TUTORIAL_KEY) === "1"; }
  catch { return false; }
}

function finishTutorial() {
  try { localStorage.setItem(TUTORIAL_KEY, "1"); } catch { /* Ignore storage failure. */ }
  tutorialLayer?.remove();
  tutorialLayer = null;
  tutorialTarget = null;
  window.removeEventListener("resize", positionTutorial);
}

function positionTutorial() {
  if (!tutorialLayer || !tutorialTarget) return;
  const spotlight = $(".tutorial-spotlight", tutorialLayer);
  const popover = $(".tutorial-popover", tutorialLayer);
  const rect = tutorialTarget.getBoundingClientRect();
  const pad = 7;
  const left = Math.max(6, rect.left - pad);
  const top = Math.max(6, rect.top - pad);
  const right = Math.min(innerWidth - 6, rect.right + pad);
  const bottom = Math.min(innerHeight - 6, rect.bottom + pad);
  Object.assign(spotlight.style, { left: `${left}px`, top: `${top}px`, width: `${Math.max(28,right-left)}px`, height: `${Math.max(28,bottom-top)}px` });
  if (innerWidth <= 760) {
    popover.classList.toggle("top", rect.top + rect.height / 2 > innerHeight / 2);
    popover.style.removeProperty("left");
    popover.style.removeProperty("top");
    return;
  }
  const box = popover.getBoundingClientRect();
  let x = rect.right + 16;
  if (x + box.width > innerWidth - 16) x = rect.left - box.width - 16;
  if (x < 16) x = Math.max(16, Math.min(innerWidth - box.width - 16, rect.left + rect.width / 2 - box.width / 2));
  const y = Math.max(16, Math.min(innerHeight - box.height - 16, rect.top));
  popover.style.left = `${x}px`;
  popover.style.top = `${y}px`;
}

function showTutorialStep(index) {
  tutorialIndex = clamp(index, 0, TUTORIAL_STEPS.length - 1);
  const [selector, title, description] = TUTORIAL_STEPS[tutorialIndex];
  if (selector === ".media-card") {
    $(".main-tab[data-main-tab='content']")?.click();
    $(".editor-scroll").scrollTop = $(".media-card").offsetTop - 90;
  }
  tutorialTarget = $(selector);
  if (!tutorialTarget) return finishTutorial();
  const popover = $(".tutorial-popover", tutorialLayer);
  popover.innerHTML = `<header><span>STEP ${tutorialIndex + 1}</span><span>${tutorialIndex + 1} / ${TUTORIAL_STEPS.length}</span></header>
    <h2>${title}</h2><p>${description}</p>
    <div class="tutorial-progress">${TUTORIAL_STEPS.map((_, step) => `<i class="${step <= tutorialIndex ? "active" : ""}"></i>`).join("")}</div>
    <div class="tutorial-actions"><button class="button ghost" data-tutorial-skip>跳过</button><div class="tutorial-nav">${tutorialIndex ? '<button class="button ghost" data-tutorial-prev>上一步</button>' : ""}<button class="button primary" data-tutorial-next>${tutorialIndex === TUTORIAL_STEPS.length - 1 ? "完成" : "下一步"}</button></div></div>`;
  $("[data-tutorial-skip]", popover).onclick = finishTutorial;
  $("[data-tutorial-prev]", popover)?.addEventListener("click", () => showTutorialStep(tutorialIndex - 1));
  $("[data-tutorial-next]", popover).onclick = () => tutorialIndex === TUTORIAL_STEPS.length - 1 ? finishTutorial() : showTutorialStep(tutorialIndex + 1);
  requestAnimationFrame(positionTutorial);
}

function startTutorial() {
  if (tutorialLayer) return;
  tutorialLayer = document.createElement("div");
  tutorialLayer.className = "tutorial-layer";
  tutorialLayer.innerHTML = '<div class="tutorial-guard"></div><div class="tutorial-spotlight"></div><section class="tutorial-popover" role="dialog" aria-modal="true"></section>';
  document.body.append(tutorialLayer);
  window.addEventListener("resize", positionTutorial);
  showTutorialStep(0);
}

function resolveCropTarget(type, id = "") {
  const data = postData();
  if (type === "main-avatar") return { object: data, refKey: "avatarRef", zoomKey: "avatarZoom", xKey: "avatarX", yKey: "avatarY", aspect: 1, shape: "round", title: "调整头像" };
  if (type === "x-cover" && state.platform === "x") return { object: state.platforms.x, refKey: "coverRef", zoomKey: "coverZoom", xKey: "coverX", yKey: "coverY", aspect: 3, shape: "rect", title: "调整账户背景" };
  if (type === "main-media") {
    const item = data.images.find((image) => image.id === id);
    let aspect = 16 / 9;
    if (state.platform === "instagram") {
      aspect = ["story", "reel"].includes(data.mode) ? 9 / 16 : data.mediaRatio === "portrait" ? 4 / 5 : data.mediaRatio === "landscape" ? 5 / 4 : 1;
    }
    return item ? { object: item, refKey: "assetRef", zoomKey: "zoom", xKey: "x", yKey: "y", aspect, shape: "rect", title: "调整页面图片" } : null;
  }
  if (type === "reply-avatar" || type === "reply-image") {
    const reply = state.platforms.x.xReplies.find((item) => item.id === id);
    if (!reply) return null;
    return type === "reply-avatar"
      ? { object: reply, refKey: "avatarRef", zoomKey: "avatarZoom", xKey: "avatarX", yKey: "avatarY", aspect: 1, shape: "round", title: "调整回复头像" }
      : { object: reply, refKey: "imageRef", zoomKey: "imageZoom", xKey: "imageX", yKey: "imageY", aspect: 2, shape: "rect", title: "调整回复图片" };
  }
  if (type === "profile-post-image") {
    const post = state.platforms.x.profilePosts.find((item) => item.id === id);
    return post ? { object: post, refKey: "imageRef", zoomKey: "imageZoom", xKey: "imageX", yKey: "imageY", aspect: 2, shape: "rect", title: "调整账户帖子图片" } : null;
  }
  if (type === "ig-highlight") {
    const item = state.platforms.instagram.highlights.find((highlight) => highlight.id === id);
    return item ? { object: item, refKey: "imageRef", zoomKey: "zoom", xKey: "x", yKey: "y", aspect: 1, shape: "round", title: "调整精选动态封面" } : null;
  }
  return null;
}

function updateCropPreview() {
  if (!cropSession) return;
  const image = $("#crop-image");
  image.style.objectPosition = `${cropSession.x}% ${cropSession.y}%`;
  image.style.transformOrigin = `${cropSession.x}% ${cropSession.y}%`;
  image.style.transform = `scale(${cropSession.zoom})`;
  $("#crop-zoom").value = String(cropSession.zoom);
  $("#crop-zoom-output").textContent = `${Math.round(cropSession.zoom * 100)}%`;
}

async function openCropper(type, id = "") {
  const target = resolveCropTarget(type, id);
  if (!target?.object?.[target.refKey]) return;
  const modal = $("#crop-modal");
  const stage = $("#crop-stage");
  const image = $("#crop-image");
  const title = $("#crop-title");
  if (!modal || !stage || !image || !title) {
    showToast("裁切窗口未能加载，请刷新页面后重试。", true);
    return;
  }
  try {
    const url = await getAssetUrl(target.object[target.refKey]);
    if (!url) throw new Error("Missing image asset");
    image.src = url;
    if (typeof image.decode === "function") await image.decode();
    cropSession = {
      ...target,
      type,
      id,
      zoom: number(target.object[target.zoomKey], 1),
      x: number(target.object[target.xKey], 50),
      y: number(target.object[target.yKey], 50)
    };
    title.textContent = target.title;
    stage.style.setProperty("--crop-aspect", String(target.aspect));
    stage.dataset.shape = target.shape;
    updateCropPreview();
    modal.hidden = false;
    document.body.classList.add("crop-open");
  } catch (error) {
    console.error("Crop preview failed", error);
    cropSession = null;
    modal.hidden = true;
    document.body.classList.remove("crop-open");
    showToast("这张图片无法预览，请尝试 JPG、PNG 或 WebP。", true);
  }
}
function closeCropper() {
  $("#crop-modal").hidden = true;
  document.body.classList.remove("crop-open");
  cropSession = null;
  cropDrag = null;
}

function applyCropper() {
  if (!cropSession) return;
  captureHistory();
  cropSession.object[cropSession.zoomKey] = cropSession.zoom;
  cropSession.object[cropSession.xKey] = cropSession.x;
  cropSession.object[cropSession.yKey] = cropSession.y;
  closeCropper();
  scheduleSave();
  renderAll();
}

function moveXProfilePost(id, direction) {
  const list = state.platforms.x.profilePosts;
  const from = list.findIndex((item) => item.id === id);
  const to = clamp(from + direction, 0, list.length - 1);
  if (from < 0 || from === to) return;
  captureHistory();
  list.splice(to, 0, list.splice(from, 1)[0]);
  scheduleSave();
  renderAll();
}

function rememberUploadScroll() {
  uploadScrollSnapshot = {
    preview: viewport?.scrollTop || 0,
    editor: $(".editor-scroll")?.scrollTop || 0,
    windowX: window.scrollX || 0,
    windowY: window.scrollY || 0
  };
}

function restoreUploadScroll(clearAfter = false) {
  if (!uploadScrollSnapshot) return;
  const snapshot = uploadScrollSnapshot;
  const apply = () => {
    if (viewport) viewport.scrollTop = snapshot.preview;
    const editor = $(".editor-scroll");
    if (editor) editor.scrollTop = snapshot.editor;
    window.scrollTo(snapshot.windowX, snapshot.windowY);
  };
  requestAnimationFrame(() => {
    apply();
    setTimeout(() => {
      apply();
      if (clearAfter && uploadScrollSnapshot === snapshot) uploadScrollSnapshot = null;
    }, 80);
  });
}
function bindEvents() {
  document.addEventListener("pointerdown", (event) => {
    if (event.target.matches("input[type=file]")) rememberUploadScroll();
  }, true);
  window.addEventListener("focus", () => restoreUploadScroll(false));
  $$("[data-platform-option]").forEach((button) => button.addEventListener("click", () => {
    if (button.dataset.platformOption === state.platform) return;
    captureHistory();
    state.platform = button.dataset.platformOption;
    scheduleSave();
    renderAll();
  }));
  $$(".main-tab").forEach((button) => button.addEventListener("click", () => {
    document.body.dataset.editorTab = button.dataset.mainTab;
    $$(".main-tab").forEach((item) => item.classList.toggle("active", item.dataset.mainTab === button.dataset.mainTab));
    $$(".tab-page").forEach((page) => page.classList.toggle("active", page.dataset.tabPage === button.dataset.mainTab));
    requestAnimationFrame(fitCanvas);
  }));
  document.addEventListener("focusin", (event) => {
    if (!event.target.matches("[data-post-field],[data-setting-field],[data-x-reply-field],[data-x-profile-post-field],[data-ig-highlight-field],[data-tumblr-reblog-field]")) return;
    if (!inputSnapshotTaken) {
      captureHistory();
      inputSnapshotTaken = true;
    }
  });
  document.addEventListener("focusout", (event) => {
    if (!event.target.matches("[data-post-field],[data-setting-field],[data-x-reply-field],[data-x-profile-post-field],[data-ig-highlight-field],[data-tumblr-reblog-field]")) return;
    requestAnimationFrame(() => {
      if (!document.activeElement?.matches("[data-post-field],[data-setting-field],[data-x-reply-field],[data-x-profile-post-field],[data-ig-highlight-field],[data-tumblr-reblog-field]")) inputSnapshotTaken = false;
    });
  });
  document.addEventListener("input", (event) => {
    const postInput = event.target.closest("[data-post-field]");
    if (postInput) {
      postData()[postInput.dataset.postField] = postInput.type === "checkbox" ? postInput.checked : postInput.value;
      scheduleSave();
      renderCanvas();
      return;
    }
    const xReplyInput = event.target.closest("[data-x-reply-field]");
    if (xReplyInput) {
      const card = xReplyInput.closest("[data-x-reply-id]");
      const reply = postData().xReplies.find((item) => item.id === card?.dataset.xReplyId);
      if (!reply) return;
      reply[xReplyInput.dataset.xReplyField] = xReplyInput.type === "checkbox" ? xReplyInput.checked : xReplyInput.value;
      scheduleSave();
      renderCanvas();
      return;
    }
    const xProfilePostInput = event.target.closest("[data-x-profile-post-field]");
    if (xProfilePostInput) {
      const card = xProfilePostInput.closest("[data-x-profile-post-id]");
      const post = state.platforms.x.profilePosts.find((item) => item.id === card?.dataset.xProfilePostId);
      if (!post) return;
      post[xProfilePostInput.dataset.xProfilePostField] = xProfilePostInput.type === "checkbox" ? xProfilePostInput.checked : xProfilePostInput.value;
      scheduleSave();
      renderCanvas();
      return;
    }
    const igHighlightInput = event.target.closest("[data-ig-highlight-field]");
    if (igHighlightInput) {
      const card = igHighlightInput.closest("[data-ig-highlight-id]");
      const item = state.platforms.instagram.highlights.find((highlight) => highlight.id === card?.dataset.igHighlightId);
      if (!item) return;
      item[igHighlightInput.dataset.igHighlightField] = igHighlightInput.value;
      scheduleSave();
      renderCanvas();
      return;
    }
    const tumblrReblogInput = event.target.closest("[data-tumblr-reblog-field]");
    if (tumblrReblogInput) {
      const card = tumblrReblogInput.closest("[data-tumblr-reblog-id]");
      const item = state.platforms.tumblr.reblogChain.find((entry) => entry.id === card?.dataset.tumblrReblogId);
      if (!item) return;
      item[tumblrReblogInput.dataset.tumblrReblogField] = tumblrReblogInput.value;
      scheduleSave();
      renderCanvas();
      return;
    }    const settingInput = event.target.closest("[data-setting-field]");
    if (settingInput) {
      const key = settingInput.dataset.settingField;
      state.settings[key] = settingInput.type === "checkbox" ? settingInput.checked : settingInput.type === "range" ? number(settingInput.value) : settingInput.value;
      settingInput.closest(".range-field")?.querySelector("output")?.replaceChildren(document.createTextNode(key === "fontScale" ? `${Math.round(state.settings[key] * 100)}%` : `${Math.round(state.settings[key])}px`));
      scheduleSave();
      renderCanvas();
      return;
    }
  });
  document.addEventListener("change", async (event) => {
    if (event.target.matches("[data-x-reply-avatar-input],[data-x-reply-image-input]")) {
      const file = event.target.files?.[0];
      const card = event.target.closest("[data-x-reply-id]");
      const reply = postData().xReplies.find((item) => item.id === card?.dataset.xReplyId);
      if (!file || !reply) return;
      captureHistory();
      const ref = await putAsset(file, uid(), file.name);
      if (event.target.matches("[data-x-reply-avatar-input]")) {
        reply.avatarRef = ref; reply.avatarZoom = 1; reply.avatarX = 50; reply.avatarY = 50;
      } else {
        reply.imageRef = ref; reply.imageZoom = 1; reply.imageX = 50; reply.imageY = 50;
      }
      scheduleSave();
      renderAll();
      restoreUploadScroll(true);
      showToast("图片已上传，点击“调整裁切”可修改取景。");
      return;
    }
    if (event.target.matches("[data-x-cover-input]")) {
      const file = event.target.files?.[0];
      if (!file) return;
      captureHistory();
      const data = state.platforms.x;
      data.coverRef = await putAsset(file, uid(), file.name);
      data.coverZoom = 1; data.coverX = 50; data.coverY = 50;
      scheduleSave();
      renderAll();
      restoreUploadScroll(true);
      showToast("背景图已上传，点击“调整裁切”可修改取景。");
      return;
    }
    if (event.target.matches("[data-x-profile-post-image-input]")) {
      const file = event.target.files?.[0];
      const card = event.target.closest("[data-x-profile-post-id]");
      const post = state.platforms.x.profilePosts.find((item) => item.id === card?.dataset.xProfilePostId);
      if (!file || !post) return;
      captureHistory();
      post.imageRef = await putAsset(file, uid(), file.name);
      post.imageZoom = 1; post.imageX = 50; post.imageY = 50;
      scheduleSave();
      renderAll();
      restoreUploadScroll(true);
      showToast("帖子图片已上传，点击“调整裁切”可修改取景。");
      return;
    }
    if (event.target.matches("[data-ig-highlight-image-input]")) {
      const file = event.target.files?.[0];
      const card = event.target.closest("[data-ig-highlight-id]");
      const item = state.platforms.instagram.highlights.find((highlight) => highlight.id === card?.dataset.igHighlightId);
      if (!file || !item) return;
      captureHistory();
      item.imageRef = await putAsset(file, uid(), file.name);
      item.zoom = 1; item.x = 50; item.y = 50;
      scheduleSave();
      renderAll();
      restoreUploadScroll(true);
      showToast("精选动态封面已上传，点击“调整裁切”可修改取景。");
      return;
    }    if (event.target.matches("[data-avatar-input]")) {
      const file = event.target.files?.[0];
      if (!file) return;
      captureHistory();
      postData().avatarRef = await putAsset(file, uid(), file.name);
      postData().avatarZoom = 1;
      postData().avatarX = 50;
      postData().avatarY = 50;
      scheduleSave();
      renderAll();
      restoreUploadScroll(true);
      showToast("头像已上传，点击“调整裁切”可修改取景。");
      return;
    }
    if (event.target.matches("[data-post-field='mode'],[data-post-field='quoteEnabled'],[data-post-field='verified'],[data-post-field='mediaRatio'],[data-post-field='carouselPage'],[data-post-field='profileNotificationEnabled'],[data-x-reply-field='quoteEnabled'],[data-x-profile-post-field='quoteEnabled']")) renderContentForm();
  });
  document.addEventListener("click", async (event) => {
    const replyCard = event.target.closest("[data-x-reply-id]");
    const replyId = replyCard?.dataset.xReplyId;
    const profilePostCard = event.target.closest("[data-x-profile-post-id]");
    const profilePostId = profilePostCard?.dataset.xProfilePostId;    const tumblrReblogCard = event.target.closest("[data-tumblr-reblog-id]");
    const tumblrReblogId = tumblrReblogCard?.dataset.tumblrReblogId;
    const cropButton = event.target.closest("[data-open-crop]");
    if (cropButton) {
      await openCropper(cropButton.dataset.openCrop, cropButton.dataset.cropId || "");
      return;
    }
    if (event.target.closest("[data-close-crop]")) { closeCropper(); return; }
    if (event.target.closest("#crop-apply")) { applyCropper(); return; }
    if (replyId && event.target.closest("[data-toggle-x-reply]")) {
      collapsedXReplies.has(replyId) ? collapsedXReplies.delete(replyId) : collapsedXReplies.add(replyId);
      renderContentForm();
      return;
    }
    if (tumblrReblogId && event.target.closest("[data-toggle-tumblr-reblog]")) {
      collapsedTumblrReblogs.has(tumblrReblogId) ? collapsedTumblrReblogs.delete(tumblrReblogId) : collapsedTumblrReblogs.add(tumblrReblogId);
      renderContentForm();
      return;
    }    if (profilePostId && event.target.closest("[data-toggle-x-profile-post]")) {
      collapsedXProfilePosts.has(profilePostId) ? collapsedXProfilePosts.delete(profilePostId) : collapsedXProfilePosts.add(profilePostId);
      renderContentForm();
      return;
    }
    if (event.target.closest("[data-add-x-profile-post]")) {
      const list = state.platforms.x.profilePosts;
      if (list.length >= 20) { showToast("账户帖子最多添加 20 条。", true); return; }
      captureHistory();
      const post = createXProfilePost(list.length);
      list.push(post);
      collapsedXProfilePosts.delete(post.id);
      scheduleSave();
      renderAll();
      return;
    }
    if (profilePostId && event.target.closest("[data-remove-x-profile-post]")) {
      commit((draft) => { draft.platforms.x.profilePosts = draft.platforms.x.profilePosts.filter((item) => item.id !== profilePostId); });
      collapsedXProfilePosts.delete(profilePostId);
      return;
    }
    if (profilePostId && event.target.closest("[data-move-x-profile-post]")) {
      moveXProfilePost(profilePostId, event.target.closest("[data-move-x-profile-post]").dataset.moveXProfilePost === "up" ? -1 : 1);
      return;
    }
    if (profilePostId && event.target.closest("[data-remove-x-profile-post-image]")) {
      commit((draft) => { const post = draft.platforms.x.profilePosts.find((item) => item.id === profilePostId); if (post) { post.imageRef = ""; post.imageZoom = 1; post.imageX = 50; post.imageY = 50; } });
      return;
    }
    if (event.target.closest("[data-remove-x-cover]")) {
      commit((draft) => { const data = draft.platforms.x; data.coverRef = ""; data.coverZoom = 1; data.coverX = 50; data.coverY = 50; });
      return;
    }
    if (event.target.closest("[data-add-x-reply]")) {
      if (postData().xReplies.length >= 20) { showToast("回复最多添加 20 条。", true); return; }
      commit((draft) => { const data = draft.platforms.x; data.xReplies.push(createXReply(data, data.xReplies.length)); });
      return;
    }
    if (replyId && event.target.closest("[data-remove-x-reply]")) {
      commit((draft) => { draft.platforms.x.xReplies = draft.platforms.x.xReplies.filter((item) => item.id !== replyId); });
      return;
    }
    if (replyId && event.target.closest("[data-move-x-reply]")) {
      const direction = event.target.closest("[data-move-x-reply]").dataset.moveXReply === "up" ? -1 : 1;
      commit((draft) => {
        const list = draft.platforms.x.xReplies;
        const from = list.findIndex((item) => item.id === replyId);
        const to = clamp(from + direction, 0, list.length - 1);
        if (from >= 0 && from !== to) list.splice(to, 0, list.splice(from, 1)[0]);
      });
      return;
    }
    if (replyId && event.target.closest("[data-remove-x-reply-avatar]")) {
      commit((draft) => { const reply = draft.platforms.x.xReplies.find((item) => item.id === replyId); if (reply) { reply.avatarRef = ""; reply.avatarZoom = 1; reply.avatarX = 50; reply.avatarY = 50; } });
      return;
    }
    if (replyId && event.target.closest("[data-remove-x-reply-image]")) {
      commit((draft) => { const reply = draft.platforms.x.xReplies.find((item) => item.id === replyId); if (reply) { reply.imageRef = ""; reply.imageZoom = 1; reply.imageX = 50; reply.imageY = 50; } });
      return;
    }
    if (event.target.closest("[data-add-tumblr-reblog]")) {
      const list = state.platforms.tumblr.reblogChain;
      if (list.length >= 20) { showToast("转发层级最多添加 20 条。", true); return; }
      captureHistory();
      const item = createTumblrReblog(list.length);
      list.push(item);
      collapsedTumblrReblogs.delete(item.id);
      scheduleSave();
      renderAll();
      return;
    }
    if (tumblrReblogId && event.target.closest("[data-remove-tumblr-reblog]")) {
      commit((draft) => { draft.platforms.tumblr.reblogChain = draft.platforms.tumblr.reblogChain.filter((item) => item.id !== tumblrReblogId); });
      collapsedTumblrReblogs.delete(tumblrReblogId);
      return;
    }
    if (tumblrReblogId && event.target.closest("[data-move-tumblr-reblog]")) {
      const direction = event.target.closest("[data-move-tumblr-reblog]").dataset.moveTumblrReblog === "up" ? -1 : 1;
      commit((draft) => {
        const list = draft.platforms.tumblr.reblogChain;
        const from = list.findIndex((item) => item.id === tumblrReblogId);
        const to = clamp(from + direction, 0, list.length - 1);
        if (from >= 0 && from !== to) list.splice(to, 0, list.splice(from, 1)[0]);
      });
      return;
    }    const igHighlightCard = event.target.closest("[data-ig-highlight-id]");
    const igHighlightId = igHighlightCard?.dataset.igHighlightId;
    if (igHighlightId && event.target.closest("[data-remove-ig-highlight-image]")) {
      commit((draft) => {
        const item = draft.platforms.instagram.highlights.find((highlight) => highlight.id === igHighlightId);
        if (item) { item.imageRef = ""; item.zoom = 1; item.x = 50; item.y = 50; }
      });
      return;
    }    const theme = event.target.closest("[data-theme-option]");
    if (theme) {
      commit((draft) => { draft.platforms[draft.platform].theme = theme.dataset.themeOption; });
      return;
    }
    if (event.target.closest("[data-remove-avatar]")) {
      commit((draft) => {
        const data = draft.platforms[draft.platform];
        data.avatarRef = "";
        data.avatarZoom = 1;
        data.avatarX = 50;
        data.avatarY = 50;
      });
      return;
    }
    const moveMedia = event.target.closest("[data-move-media]");
    if (moveMedia) {
      const id = moveMedia.closest("[data-media-id]")?.dataset.mediaId;
      const direction = moveMedia.dataset.moveMedia === "up" ? -1 : 1;
      commit((draft) => {
        const list = draft.platforms[draft.platform].images;
        const from = list.findIndex((item) => item.id === id);
        const to = clamp(from + direction, 0, list.length - 1);
        if (from >= 0 && from !== to) list.splice(to, 0, list.splice(from, 1)[0]);
      });
      return;
    }    const removeMedia = event.target.closest("[data-remove-media]");
    if (removeMedia) {
      const id = removeMedia.closest("[data-media-id]").dataset.mediaId;
      commit((draft) => { draft.platforms[draft.platform].images = draft.platforms[draft.platform].images.filter((image) => image.id !== id); });
    }
  });
  $("#crop-zoom").addEventListener("input", (event) => {
    if (!cropSession) return;
    cropSession.zoom = number(event.target.value, 1);
    updateCropPreview();
  });
  $("#crop-stage").addEventListener("pointerdown", (event) => {
    if (!cropSession) return;
    cropDrag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x: cropSession.x, y: cropSession.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  });
  $("#crop-stage").addEventListener("pointermove", (event) => {
    if (!cropSession || !cropDrag || cropDrag.pointerId !== event.pointerId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    cropSession.x = clamp(cropDrag.x - ((event.clientX - cropDrag.startX) / Math.max(1, rect.width)) * 100, 0, 100);
    cropSession.y = clamp(cropDrag.y - ((event.clientY - cropDrag.startY) / Math.max(1, rect.height)) * 100, 0, 100);
    updateCropPreview();
  });
  const endCropDrag = (event) => {
    if (!cropDrag || cropDrag.pointerId !== event.pointerId) return;
    cropDrag = null;
  };
  $("#crop-stage").addEventListener("pointerup", endCropDrag);
  $("#crop-stage").addEventListener("pointercancel", endCropDrag);
  document.addEventListener("dragstart", (event) => {
    const mediaHandle = event.target.closest("[data-media-id] .media-drag");
    if (mediaHandle) {
      const card = mediaHandle.closest("[data-media-id]");
      draggedMediaId = card.dataset.mediaId;
      card.classList.add("dragging");
      event.dataTransfer?.setData("text/plain", draggedMediaId);
      if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
      return;
    }
    const replyHandle = event.target.closest("[data-x-reply-id] .x-reply-drag");
    if (replyHandle) {
      draggedXReplyId = replyHandle.closest("[data-x-reply-id]").dataset.xReplyId;
      replyHandle.closest("[data-x-reply-id]").classList.add("dragging");
      event.dataTransfer?.setData("text/plain", draggedXReplyId);
      if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
      return;
    }
    const tumblrHandle = event.target.closest("[data-tumblr-reblog-id] .tumblr-reblog-drag");
    if (!tumblrHandle) return;
    draggedTumblrReblogId = tumblrHandle.closest("[data-tumblr-reblog-id]").dataset.tumblrReblogId;
    tumblrHandle.closest("[data-tumblr-reblog-id]").classList.add("dragging");
    event.dataTransfer?.setData("text/plain", draggedTumblrReblogId);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
  });
  document.addEventListener("dragover", (event) => {
    const mediaCard = event.target.closest("[data-media-id]");
    if (mediaCard && draggedMediaId) {
      event.preventDefault();
      $$(".media-editor-card.drag-over").forEach((item) => item.classList.remove("drag-over"));
      mediaCard.classList.add("drag-over");
      return;
    }
    const replyCard = event.target.closest("[data-x-reply-id]");
    if (replyCard && draggedXReplyId) {
      event.preventDefault();
      $$("[data-x-reply-id].drag-over").forEach((item) => item.classList.remove("drag-over"));
      replyCard.classList.add("drag-over");
      return;
    }
    const tumblrCard = event.target.closest("[data-tumblr-reblog-id]");
    if (!tumblrCard || !draggedTumblrReblogId) return;
    event.preventDefault();
    $$("[data-tumblr-reblog-id].drag-over").forEach((item) => item.classList.remove("drag-over"));
    tumblrCard.classList.add("drag-over");
  });
  document.addEventListener("drop", (event) => {
    const mediaCard = event.target.closest("[data-media-id]");
    if (mediaCard && draggedMediaId) {
      event.preventDefault();
      const targetId = mediaCard.dataset.mediaId;
      if (targetId !== draggedMediaId) {
        captureHistory();
        const list = postData().images;
        const from = list.findIndex((item) => item.id === draggedMediaId);
        const to = list.findIndex((item) => item.id === targetId);
        if (from >= 0 && to >= 0) list.splice(to, 0, list.splice(from, 1)[0]);
        scheduleSave();
        renderAll();
      }
      draggedMediaId = "";
      return;
    }
    const replyCard = event.target.closest("[data-x-reply-id]");
    if (replyCard && draggedXReplyId) {
      event.preventDefault();
      const targetId = replyCard.dataset.xReplyId;
      if (targetId !== draggedXReplyId) {
        captureHistory();
        const list = postData().xReplies;
        const from = list.findIndex((item) => item.id === draggedXReplyId);
        const to = list.findIndex((item) => item.id === targetId);
        if (from >= 0 && to >= 0) list.splice(to, 0, list.splice(from, 1)[0]);
        scheduleSave();
        renderAll();
      }
      draggedXReplyId = "";
      return;
    }
    const tumblrCard = event.target.closest("[data-tumblr-reblog-id]");
    if (!tumblrCard || !draggedTumblrReblogId) return;
    event.preventDefault();
    const targetId = tumblrCard.dataset.tumblrReblogId;
    if (targetId !== draggedTumblrReblogId) {
      captureHistory();
      const list = state.platforms.tumblr.reblogChain;
      const from = list.findIndex((item) => item.id === draggedTumblrReblogId);
      const to = list.findIndex((item) => item.id === targetId);
      if (from >= 0 && to >= 0) list.splice(to, 0, list.splice(from, 1)[0]);
      scheduleSave();
      renderAll();
    }
    draggedTumblrReblogId = "";
  });
  document.addEventListener("dragend", () => {
    draggedMediaId = "";
    draggedXReplyId = "";
    draggedTumblrReblogId = "";
    $$(".media-editor-card.dragging,.media-editor-card.drag-over,.x-reply-editor.dragging,.x-reply-editor.drag-over").forEach((item) => item.classList.remove("dragging", "drag-over"));
  });  $("#media-input").addEventListener("change", async (event) => {
    await addMediaFiles(event.target.files || []);
    event.target.value = "";
  });
  $("#clear-button").addEventListener("click", () => {
    if (!confirm(`确认清空当前的${PLATFORM_LABELS[state.platform]}吗？`)) return;
    commit((draft) => { draft.platforms[draft.platform] = clone(DEFAULT_STATE.platforms[draft.platform]); });
  });
  $("#undo-button").addEventListener("click", undo);
  $("#redo-button").addEventListener("click", redo);
  $("#save-json-button").addEventListener("click", exportJson);
  $("#export-button").addEventListener("click", exportPng);
  $("#import-input").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try { await importJson(file); }
    catch (error) {
      console.error(error);
      showToast("JSON 文件无法读取。", true);
    }
    event.target.value = "";
  });
  $("#focus-button").addEventListener("click", () => {
    document.body.classList.toggle("focus-mode");
    $("#focus-button").textContent = document.body.classList.contains("focus-mode") ? "×" : "⛶";
    requestAnimationFrame(fitCanvas);
  });
  $("#focus-exit-button").addEventListener("click", () => $("#focus-button").click());
  $("#tutorial-button").addEventListener("click", startTutorial);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && cropSession) closeCropper();
    else if (event.key === "Escape" && tutorialLayer) finishTutorial();
    else if (event.key === "Escape" && document.body.classList.contains("focus-mode")) $("#focus-button").click();
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      event.shiftKey ? redo() : undo();
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
      event.preventDefault();
      redo();
    }
  });
  window.addEventListener("resize", fitCanvas);
  window.visualViewport?.addEventListener("resize", fitCanvas);
  new ResizeObserver(fitCanvas).observe(viewport);
  window.addEventListener("beforeunload", saveStoredState);
}

bindEvents();
initMobileResizer();
renderAll();
if (!tutorialSeen()) setTimeout(startTutorial, 500);
