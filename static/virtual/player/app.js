const STORAGE_KEY = "lyric-timeline-project-v2";
const MOBILE_SPLIT_KEY = "lyric-timeline-mobile-preview-ratio";
const DB_NAME = "lyric-timeline-assets";
const DB_STORE = "assets";
const MAX_HISTORY = 30;
const DEFAULT_COVER = "./cover.png";
const CANVAS_SIZES = Object.freeze({
  landscape: { width: 1080, height: 720 },
  square: { width: 560, height: 560 },
  portrait: { width: 540, height: 960 }
});
const DEFAULT_CUSTOM_PALETTE = Object.freeze({
  canvasBg: "#e8eee9",
  surface: "#f6f4ed",
  ink: "#17342e",
  muted: "#66756f",
  accent: "#275b4f",
  accent2: "#b56b4b"
});
const CUSTOM_PALETTE_PROPERTIES = Object.freeze({
  canvasBg: "--canvas-bg",
  surface: "--surface",
  ink: "--canvas-ink",
  muted: "--canvas-muted",
  accent: "--accent",
  accent2: "--accent-2"
});

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const uid = () => crypto.randomUUID?.() || `line-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const clone = (value) => globalThis.structuredClone ? structuredClone(value) : JSON.parse(JSON.stringify(value));

function createDefaultProject() {
  const playlistTracks = [
    ["凌晨四点的海", "林野", "潮汐来信", "03:42"],
    ["从月台寄出的信", "未署名歌者", "夜航记录", "04:08"],
    ["旧唱片慢慢转", "南风俱乐部", "SIDE B", "03:18"],
    ["雨停以前", "洛川", "城市回声", "02:56"],
    ["沿海公路", "黎明电台", "公路合集", "04:21"],
    ["最后一班船", "白昼梦", "夜航记录", "03:37"]
  ].map(([title, artist, album, duration]) => ({
    id: uid(), title, artist, album, duration, coverRef: "", coverName: "cover.png"
  }));
  return {
    schema: "lyric-timeline",
    version: 8,
    id: uid(),
    pageType: "lyrics",
    name: "夜航歌词档案",
    footerText: "CREATED IN BROWSER",
    title: "潮汐来信",
    artist: "未署名歌者",
    album: "夜航记录 / SIDE A",
    tags: "独立 流行 夜晚",
    description: "一封写给潮汐、夜色与未完成告别的来信。",
    duration: 228,
    currentTime: 64,
    template: "retro",
    palette: "default",
    customPalette: { ...DEFAULT_CUSTOM_PALETTE },
    ratio: "landscape",
    showTime: true,
    showTranslation: true,
    cover: { ref: "", name: "cover.png", zoom: 1, x: 50, y: 50 },
    profile: {
      name: "夜航收藏家",
      handle: "@nightvoyage",
      bio: "收集午夜、海风与旧唱片，也保存那些没有寄出的歌。",
      tags: "独立 夜航 黑胶",
      badge: "夜航策展人",
      location: "上海",
      joined: "2023年9月",
      status: "正在循环《潮汐来信》",
      statSongs: "128",
      statPlaylists: "24",
      statFollowers: "3.8K",
      stats: "",
      avatarRef: "",
      avatarName: "cover.png"
    },
    playlist: {
      title: "夜航收藏",
      subtitle: "CURATED PLAYLIST",
      description: "适合在城市灯光熄灭以后播放的六首歌。",
      tracks: playlistTracks
    },
    lyrics: [
      [0, "灯熄灭以后，城市开始说话", "After the lights fade, the city begins to speak"],
      [24, "我把名字写在车窗的雾里", "I wrote my name into the fogged glass"],
      [48, "海风穿过没有寄出的信", "The sea wind passes through unsent letters"],
      [64, "你说潮汐会替我们记得", "You said the tide would remember for us"],
      [88, "每一次靠岸，每一次离开", "Every arrival, every departure"],
      [116, "月光在旧唱片上缓慢旋转", "Moonlight turns slowly on an old record"],
      [145, "如果明天仍有微弱的回声", "If tomorrow still carries a faint echo"],
      [174, "请沿着这首歌找到我", "Follow this song and find me"],
      [208, "在天亮之前，再听一遍", "Listen once more before daybreak"]
    ].map(([time, text, translation]) => ({ id: uid(), time, text, translation }))
  };
}

function normalizeProject(value) {
  const fallback = createDefaultProject();
  const hasSource = Boolean(value && typeof value === "object");
  const source = hasSource ? value : {};
  const sourceVersion = number(source.version, 0);
  const project = { ...fallback, ...source };
  project.schema = "lyric-timeline";
  project.version = 8;
  project.id = typeof source.id === "string" && source.id ? source.id : fallback.id;
  project.pageType = source.pageType === "playlist" ? "playlist" : "lyrics";
  project.footerText = String(source.footerText ?? fallback.footerText).slice(0, 80);
  project.description = String(Object.prototype.hasOwnProperty.call(source, "description") ? source.description : (hasSource ? "" : fallback.description)).slice(0, 300);
  project.duration = clamp(number(project.duration, fallback.duration), 1, 24 * 3600);
  project.currentTime = clamp(number(project.currentTime, 0), 0, project.duration);
  project.template = ["retro", "pixel", "ins", "editorial", "classic-retro", "classic-pixel", "classic-ins", "classic-luxury"].includes(project.template) ? project.template : "retro";
  const requestedPalette = sourceVersion < 7 && source.palette === "ink" ? "default" : project.palette;
  project.palette = ["default", "jade", "rose", "blue", "ink", "custom"].includes(requestedPalette) ? requestedPalette : "default";
  project.ratio = ["landscape", "square", "portrait"].includes(project.ratio) ? project.ratio : "landscape";
  if (project.pageType === "playlist" && project.ratio === "square") project.ratio = "landscape";
  const fallbackProfile = fallback.profile;
  const sourceProfile = source.profile && typeof source.profile === "object" ? source.profile : {};
  project.profile = { ...fallbackProfile, ...sourceProfile };
  project.profile.name = String(project.profile.name || "").slice(0, 80);
  project.profile.handle = String(project.profile.handle || "").slice(0, 80);
  project.profile.bio = String(project.profile.bio || "").slice(0, 240);
  project.profile.tags = String(project.profile.tags || "").slice(0, 160);
  const optionalProfileFields = { badge: 40, location: 60, joined: 40, status: 100, statSongs: 20, statPlaylists: 20, statFollowers: 20 };
  Object.entries(optionalProfileFields).forEach(([key, limit]) => {
    const value = Object.prototype.hasOwnProperty.call(sourceProfile, key) ? sourceProfile[key] : (hasSource ? "" : fallbackProfile[key]);
    project.profile[key] = String(value || "").slice(0, limit);
  });
  project.profile.stats = String(project.profile.stats || "").slice(0, 100);
  project.profile.avatarRef = String(project.profile.avatarRef || "");
  project.profile.avatarName = String(project.profile.avatarName || "cover.png");
  const sourcePlaylist = source.playlist && typeof source.playlist === "object" ? source.playlist : {};
  project.playlist = { ...fallback.playlist, ...sourcePlaylist };
  project.playlist.title = String(project.playlist.title || "").slice(0, 100);
  project.playlist.subtitle = String(project.playlist.subtitle || "").slice(0, 100);
  project.playlist.description = String(project.playlist.description || "").slice(0, 240);
  project.playlist.tracks = Array.isArray(sourcePlaylist.tracks) ? sourcePlaylist.tracks.map((track) => ({
    id: typeof track?.id === "string" ? track.id : uid(),
    title: String(track?.title || "").slice(0, 100), artist: String(track?.artist || "").slice(0, 100),
    album: String(track?.album || "").slice(0, 100), duration: String(track?.duration || "").slice(0, 16),
    coverRef: String(track?.coverRef || ""), coverName: String(track?.coverName || "cover.png")
  })) : fallback.playlist.tracks;
  project.customPalette = Object.fromEntries(Object.entries(DEFAULT_CUSTOM_PALETTE).map(([key, fallbackColor]) => [key, sanitizeHex(source.customPalette?.[key], fallbackColor)]));
  project.showTime = project.showTime !== false;
  project.showTranslation = project.showTranslation !== false;
  project.cover = { ...fallback.cover, ...(source.cover || {}) };
  project.cover.zoom = clamp(number(project.cover.zoom, 1), 1, 3);
  project.cover.x = clamp(number(project.cover.x, 50), 0, 100);
  project.cover.y = clamp(number(project.cover.y, 50), 0, 100);
  project.lyrics = Array.isArray(source.lyrics) ? source.lyrics.map((line) => ({
    id: typeof line?.id === "string" ? line.id : uid(),
    time: clamp(number(line?.time, 0), 0, project.duration),
    text: String(line?.text || ""),
    translation: String(line?.translation || "")
  })) : fallback.lyrics;
  project.lyrics.sort((a, b) => a.time - b.time);
  delete project.coverData;
  return project;
}

function number(value, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function sanitizeHex(value, fallback) { return /^#[0-9a-f]{6}$/i.test(String(value || "")) ? String(value).toLowerCase() : fallback; }
function escapeHtml(value) { return String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]); }
function safeFileName(value) { return String(value || "歌词时间线").replace(/[\\/:*?"<>|]/g, "-").trim() || "歌词时间线"; }
function formatTime(seconds) {
  const total = Math.max(0, Math.floor(number(seconds, 0)));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return hours ? `${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}:${String(secs).padStart(2,"0")}` : `${String(minutes).padStart(2,"0")}:${String(secs).padStart(2,"0")}`;
}
function parseTime(value) {
  const parts = String(value || "").trim().split(":").map(Number);
  if (!parts.length || parts.some((part) => !Number.isFinite(part) || part < 0)) return null;
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

let state = normalizeProject(readStoredProject());
let historyPast = [];
let historyFuture = [];
let saveTimer = 0;
let toastTimer = 0;
let isPlaying = false;
let playTimer = 0;
let coverObjectUrl = "";
let playlistObjectUrls = [];
let inputSnapshotTaken = false;
let exportFontCssPromise = null;

const frame = $("#canvas-frame");
const viewport = $("#preview-viewport");
const timelineEditor = $("#timeline-editor");
const lyricCanvas = $("#player-canvas");
const playlistCanvas = $("#playlist-canvas");
const playlistEditor = $("#playlist-editor");
let canvas = lyricCanvas;

function syncActiveCanvas() {
  canvas = state.pageType === "playlist" ? playlistCanvas : lyricCanvas;
  lyricCanvas.hidden = state.pageType !== "lyrics";
  playlistCanvas.hidden = state.pageType !== "playlist";
}
function initMobileWorkspaceResizer() {
  const workspace = $(".workspace");
  const resizer = $("#mobile-workspace-resizer");
  const mobileQuery = window.matchMedia("(max-width: 680px)");
  if (!workspace || !resizer) return;

  const readRatio = () => {
    try {
      const value = Number(localStorage.getItem(MOBILE_SPLIT_KEY));
      return Number.isFinite(value) && value >= .22 && value <= .72 ? value : .5;
    } catch {
      return .5;
    }
  };

  let ratio = readRatio();
  let resizing = false;
  const applyHeight = (height, persist = true) => {
    if (!mobileQuery.matches) return;
    const available = Math.max(1, workspace.clientHeight);
    const minimum = Math.max(100, available * .22);
    const maximum = Math.max(minimum, Math.min(available * .72, available - 190));
    const nextHeight = clamp(height, minimum, maximum);
    ratio = nextHeight / available;
    workspace.style.setProperty("--mobile-preview-height", `${nextHeight}px`);
    resizer.setAttribute("aria-valuenow", String(Math.round(ratio * 100)));
    if (persist) {
      try { localStorage.setItem(MOBILE_SPLIT_KEY, String(ratio)); } catch { /* Session-only layout is acceptable. */ }
    }
    requestAnimationFrame(fitCanvas);
  };
  const applyRatio = () => {
    if (!mobileQuery.matches) {
      workspace.style.removeProperty("--mobile-preview-height");
      document.body.classList.remove("mobile-resizing");
      return;
    }
    applyHeight(workspace.clientHeight * ratio, false);
  };
  const updateFromPointer = (clientY) => {
    const top = workspace.getBoundingClientRect().top;
    applyHeight(clientY - top);
  };

  resizer.addEventListener("pointerdown", (event) => {
    if (!mobileQuery.matches) return;
    resizing = true;
    resizer.setPointerCapture(event.pointerId);
    document.body.classList.add("mobile-resizing");
    updateFromPointer(event.clientY);
  });
  resizer.addEventListener("pointermove", (event) => {
    if (resizing) updateFromPointer(event.clientY);
  });
  const stopResizing = (event) => {
    if (!resizing) return;
    resizing = false;
    if (resizer.hasPointerCapture?.(event.pointerId)) resizer.releasePointerCapture(event.pointerId);
    document.body.classList.remove("mobile-resizing");
  };
  resizer.addEventListener("pointerup", stopResizing);
  resizer.addEventListener("pointercancel", stopResizing);
  resizer.addEventListener("keydown", (event) => {
    if (!mobileQuery.matches || !["ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const current = $(".preview-panel")?.getBoundingClientRect().height || workspace.clientHeight * ratio;
    applyHeight(current + (event.key === "ArrowDown" ? 24 : -24));
  });
  resizer.addEventListener("dblclick", () => applyHeight(workspace.clientHeight * .5));
  window.addEventListener("resize", applyRatio);
  mobileQuery.addEventListener?.("change", applyRatio);
  requestAnimationFrame(applyRatio);
}
function readStoredProject() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); }
  catch { return null; }
}
function saveStoredProject() {
  const saveState = $("#save-state");
  if (saveState) { saveState.classList.remove("saving"); saveState.innerHTML = "<i></i>已保存"; }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch { showToast("浏览器存储空间不足，请先保存 JSON 备份。", true); }
}
function scheduleSave() {
  clearTimeout(saveTimer);
  const saveState = $("#save-state");
  if (saveState) { saveState.classList.add("saving"); saveState.innerHTML = "<i></i>保存中"; }
  saveTimer = window.setTimeout(saveStoredProject, 350);
}
function captureHistory() {
  historyPast.push(clone(state));
  if (historyPast.length > MAX_HISTORY) historyPast.shift();
  historyFuture = [];
  updateHistoryButtons();
}
function commit(mutator, { history = true, rebuild = false } = {}) {
  if (history) captureHistory();
  mutator(state);
  state = normalizeProject(state);
  scheduleSave();
  if (rebuild) renderEditor();
  renderCanvas();
  updateHistoryButtons();
}
function undo() {
  if (!historyPast.length) return;
  historyFuture.push(clone(state));
  state = normalizeProject(historyPast.pop());
  stopPlayback(); scheduleSave(); renderAll();
}
function redo() {
  if (!historyFuture.length) return;
  historyPast.push(clone(state));
  state = normalizeProject(historyFuture.pop());
  stopPlayback(); scheduleSave(); renderAll();
}
function updateHistoryButtons() {
  $("#undo-button").disabled = historyPast.length === 0;
  $("#redo-button").disabled = historyFuture.length === 0;
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(DB_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function setAsset(key, blob) {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).put(blob, key);
    tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
  });
  db.close();
}
async function getAsset(key) {
  if (!key) return null;
  const db = await openDb();
  const value = await new Promise((resolve, reject) => {
    const request = db.transaction(DB_STORE).objectStore(DB_STORE).get(key);
    request.onsuccess = () => resolve(request.result || null); request.onerror = () => reject(request.error);
  });
  db.close(); return value;
}
async function removeAsset(key) {
  if (!key) return;
  const db = await openDb();
  await new Promise((resolve) => {
    const tx = db.transaction(DB_STORE, "readwrite"); tx.objectStore(DB_STORE).delete(key); tx.oncomplete = resolve; tx.onerror = resolve;
  });
  db.close();
}
function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); });
}
function dataUrlToBlob(dataUrl) {
  const [meta, data] = String(dataUrl).split(",");
  const mime = meta.match(/data:(.*?);/)?.[1] || "application/octet-stream";
  const binary = atob(data); const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
async function hydrateCover() {
  if (coverObjectUrl) { URL.revokeObjectURL(coverObjectUrl); coverObjectUrl = ""; }
  try {
    const blob = await getAsset(state.cover.ref);
    if (blob) { coverObjectUrl = URL.createObjectURL(blob); $("#canvas-cover").src = coverObjectUrl; return; }
  } catch { /* IndexedDB unavailable: use bundled cover. */ }
  $("#canvas-cover").src = DEFAULT_COVER;
}
async function hydratePlaylistAssets() {
  playlistObjectUrls.forEach((url) => URL.revokeObjectURL(url));
  playlistObjectUrls = [];
  const targets = $$("[data-playlist-ref]");
  await Promise.all(targets.map(async (image) => {
    const ref = image.dataset.playlistRef;
    if (!ref) { image.src = DEFAULT_COVER; return; }
    try {
      const blob = await getAsset(ref);
      if (!blob) { image.src = DEFAULT_COVER; return; }
      const url = URL.createObjectURL(blob); playlistObjectUrls.push(url); image.src = url;
    } catch { image.src = DEFAULT_COVER; }
  }));
}

function getActiveIndex() {
  let index = -1;
  for (let i = 0; i < state.lyrics.length; i += 1) {
    if (state.lyrics[i].time <= state.currentTime) index = i; else break;
  }
  return Math.max(0, index);
}
function visibleLyrics() {
  const max = state.ratio === "landscape" ? 8 : state.ratio === "square" ? 3 : 5;
  if (state.lyrics.length <= max) return state.lyrics;
  const active = getActiveIndex();
  const start = clamp(active - Math.floor(max / 2), 0, state.lyrics.length - max);
  return state.lyrics.slice(start, start + max);
}
function applyCanvasPalette() {
  Object.entries(CUSTOM_PALETTE_PROPERTIES).forEach(([key, property]) => {
    if (state.palette === "custom") canvas.style.setProperty(property, state.customPalette[key]);
    else canvas.style.removeProperty(property);
  });
}
function renderPlaylistCanvas() {
  const profile = state.profile;
  const list = state.playlist;
  $("#playlist-avatar").dataset.playlistRef = profile.avatarRef;
  $("#playlist-profile-name").textContent = profile.name || "未署名听众";
  $("#playlist-handle").textContent = profile.handle || "@listener";
  const facts = [
    profile.badge ? `<strong>${escapeHtml(profile.badge)}</strong>` : "",
    profile.location ? `<span>所在地 · ${escapeHtml(profile.location)}</span>` : "",
    profile.joined ? `<span>加入 · ${escapeHtml(profile.joined)}</span>` : ""
  ].filter(Boolean);
  const factsNode = $("#playlist-profile-facts");
  factsNode.innerHTML = facts.join(""); factsNode.hidden = !facts.length;
  const bioNode = $("#playlist-profile-bio");
  bioNode.textContent = profile.bio; bioNode.hidden = !profile.bio.trim();
  const statusNode = $("#playlist-profile-status");
  statusNode.textContent = profile.status ? `STATUS / ${profile.status}` : ""; statusNode.hidden = !profile.status.trim();
  const tagNode = $("#playlist-profile-tags");
  const profileTags = profile.tags.split(/\s+/).filter(Boolean);
  tagNode.innerHTML = profileTags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join(""); tagNode.hidden = !profileTags.length;
  const statItems = [
    [profile.statSongs, "收藏歌曲"], [profile.statPlaylists, "播放列表"], [profile.statFollowers, "关注者"]
  ].filter(([value]) => String(value || "").trim());
  const statsNode = $("#playlist-profile-stats");
  statsNode.innerHTML = statItems.length
    ? statItems.map(([value, label]) => `<span><b>${escapeHtml(value)}</b><small>${label}</small></span>`).join("")
    : (profile.stats ? `<span class="profile-stats-legacy">${escapeHtml(profile.stats)}</span>` : "");
  statsNode.hidden = !statItems.length && !profile.stats;
  $("#playlist-title").textContent = list.title || "未命名播放列表";
  $("#playlist-subtitle").textContent = list.subtitle || "CURATED PLAYLIST";
  $("#playlist-description").textContent = list.description;
  $("#playlist-count").textContent = `${list.tracks.length} TRACKS`;
  $("#playlist-project-name").textContent = state.name || "未命名项目";
  $("#playlist-footer-text").textContent = state.footerText;
  const limit = state.ratio === "portrait" ? 8 : 7;
  const visible = list.tracks.slice(0, limit);
  $("#playlist-canvas-tracks").innerHTML = visible.map((track, index) => `<article class="playlist-track"><span class="playlist-track-index">${String(index + 1).padStart(2,"0")}</span><div class="playlist-track-cover"><img src="${DEFAULT_COVER}" data-playlist-ref="${escapeHtml(track.coverRef)}" alt=""></div><div class="playlist-track-meta"><strong>${escapeHtml(track.title || "未命名歌曲")}</strong><small>${escapeHtml([track.artist,track.album].filter(Boolean).join(" · ") || "未署名歌者")}</small></div><time>${escapeHtml(track.duration || "--:--")}</time></article>`).join("") + (list.tracks.length > limit ? `<div class="playlist-more">另有 ${list.tracks.length - limit} 首</div>` : "");
  hydratePlaylistAssets();
}

function renderCanvas() {
  syncActiveCanvas();
  canvas.dataset.template = state.template;
  canvas.dataset.palette = state.palette;
  canvas.dataset.ratio = state.ratio;
  applyCanvasPalette();
  const customPanel = $("#custom-palette-panel");
  if (customPanel) customPanel.hidden = state.palette !== "custom";
  if (state.pageType === "playlist") { renderPlaylistCanvas(); fitCanvas(); return; }
  canvas.classList.toggle("hide-time", !state.showTime);
  canvas.classList.toggle("hide-translation", !state.showTranslation);
  $("#canvas-title").textContent = state.title || "未命名歌曲";
  $("#canvas-artist").textContent = state.artist || "未署名歌者";
  $("#canvas-album").textContent = state.album || "未命名专辑";
  const description = $("#canvas-description");
  description.textContent = state.description;
  description.hidden = !state.description.trim();
  $("#canvas-project-name").textContent = state.name || "未命名歌词项目";
  $("#canvas-footer-text").textContent = state.footerText;
  $("#canvas-current").textContent = formatTime(state.currentTime);
  $("#canvas-duration").textContent = formatTime(state.duration);
  $("#canvas-line-count").textContent = `${state.lyrics.length} LINES`;
  const isLuxuryEditorial = ["editorial", "classic-luxury"].includes(state.template);
  $("#canvas-lyrics-eyebrow").textContent = isLuxuryEditorial ? "LYRIC PORTFOLIO" : "LYRIC CHRONOLOGY";
  $("#canvas-lyrics-title").innerHTML = isLuxuryEditorial ? "The <em>Lyrics</em>" : "歌词时间线";
  const tags = state.tags.split(/\s+/).filter(Boolean);
  $("#canvas-tags").innerHTML = tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
  const progress = clamp(state.currentTime / state.duration * 100, 0, 100);
  $("#canvas-progress").style.width = `${progress}%`;
  $("#canvas-progress-dot").style.left = `${progress}%`;
  const image = $("#canvas-cover");
  image.style.objectPosition = `${state.cover.x}% ${state.cover.y}%`;
  image.style.transform = `scale(${state.cover.zoom})`;
  const activeId = state.lyrics[getActiveIndex()]?.id;
  $("#canvas-lyrics").innerHTML = visibleLyrics().map((line) => {
    const index = state.lyrics.findIndex((item) => item.id === line.id);
    const distance = Math.abs(index - getActiveIndex());
    return `<article class="lyric-line${line.id === activeId ? " active" : ""}${distance <= 2 ? " is-near" : ""}" data-line-id="${line.id}"><time class="lyric-time">${formatTime(line.time)}</time><div class="lyric-copy"><strong>${escapeHtml(line.text || "（空歌词）")}</strong>${line.translation ? `<small>${escapeHtml(line.translation)}</small>` : ""}</div></article>`;
  }).join("");
  $$(".line-card", timelineEditor).forEach((card) => card.classList.toggle("active", card.dataset.lineId === activeId));
  $("#preview-play").classList.toggle("playing", isPlaying);
  fitCanvas();
}
function renderEditor() {
  const isPlaylist = state.pageType === "playlist";
  $("#lyrics-content-panel").hidden = isPlaylist;
  $("#playlist-content-panel").hidden = !isPlaylist;
  $$('[data-page-type-option]').forEach((button) => button.classList.toggle("active", button.dataset.pageTypeOption === state.pageType));
  $$(".lyrics-style-only").forEach((element) => { element.hidden = isPlaylist; });
  const squareOption = $("#ratio-square-option");
  if (squareOption) { squareOption.hidden = isPlaylist; squareOption.disabled = isPlaylist; }
  const values = {
    name: state.name, footerText: state.footerText, title: state.title, artist: state.artist, album: state.album, tags: state.tags, description: state.description,
    durationText: formatTime(state.duration), palette: state.palette, ratio: state.ratio,
    showTime: state.showTime, showTranslation: state.showTranslation,
    coverZoom: state.cover.zoom, coverX: state.cover.x, coverY: state.cover.y
  };
  $$('[data-field]').forEach((input) => {
    const value = values[input.dataset.field];
    if (input.type === "checkbox") input.checked = Boolean(value); else input.value = value;
  });
  $("#zoom-output").value = `${Math.round(state.cover.zoom * 100)}%`;
  $("#x-output").value = `${Math.round(state.cover.x)}%`;
  $("#y-output").value = `${Math.round(state.cover.y)}%`;
  $$("[data-custom-color]").forEach((input) => { input.value = state.customPalette[input.dataset.customColor]; });
  const customPanel = $("#custom-palette-panel");
  if (customPanel) customPanel.hidden = state.palette !== "custom";
  $$('[data-template-option]').forEach((button) => button.classList.toggle("active", button.dataset.templateOption === state.template));
  if (isPlaylist) {
    $$('[data-profile-field]').forEach((input) => { input.value = state.profile[input.dataset.profileField] || ""; });
    $$('[data-playlist-field]').forEach((input) => { input.value = state.playlist[input.dataset.playlistField] || ""; });
    playlistEditor.innerHTML = state.playlist.tracks.map((track,index) => `<article class="playlist-editor-card" data-track-id="${track.id}"><span class="playlist-editor-index">${String(index + 1).padStart(2,"0")}</span><label class="playlist-editor-cover"><img src="${DEFAULT_COVER}" data-playlist-ref="${escapeHtml(track.coverRef)}" alt=""><input type="file" accept="image/*" data-track-cover aria-label="上传歌曲封面"></label><div class="playlist-editor-inputs"><input data-track-key="title" value="${escapeHtml(track.title)}" placeholder="歌曲名"><input data-track-key="artist" value="${escapeHtml(track.artist)}" placeholder="歌手"><input data-track-key="album" value="${escapeHtml(track.album)}" placeholder="专辑"><input data-track-key="duration" value="${escapeHtml(track.duration)}" placeholder="03:40"></div><div class="playlist-editor-actions"><button data-track-action="up" title="上移">↑</button><button data-track-action="down" title="下移">↓</button><button data-track-action="delete" title="删除">×</button></div></article>`).join("");
    requestAnimationFrame(hydratePlaylistAssets);
  } else {
    timelineEditor.innerHTML = state.lyrics.map((line, index) => `<article class="line-card" data-line-id="${line.id}"><div class="line-time-wrap"><input class="line-time" data-line-key="time" value="${formatTime(line.time)}" aria-label="节点时间"></div><div class="line-inputs"><input data-line-key="text" value="${escapeHtml(line.text)}" placeholder="歌词正文"><input class="translation" data-line-key="translation" value="${escapeHtml(line.translation)}" placeholder="译文或注释（可选）"></div><div class="line-actions"><button data-line-action="seek" title="定位播放">▶</button><button data-line-action="delete" title="删除节点">×</button></div><span class="sr-only">第 ${index + 1} 行</span></article>`).join("");
  }
  updateHistoryButtons();
}
function renderAll() { renderEditor(); renderCanvas(); if (state.pageType === "lyrics") hydrateCover(); }

function fitCanvas() {
  if (!viewport || !canvas || !frame) return;
  const { width, height } = CANVAS_SIZES[state.ratio] || CANVAS_SIZES.landscape;
  const rect = viewport.getBoundingClientRect();
  const viewportHeight = window.visualViewport?.height || window.innerHeight;
  const style = getComputedStyle(viewport);
  const horizontalPadding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  const verticalPadding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
  const visibleBottom = Math.min(rect.bottom, viewportHeight);
  const isPhone = window.matchMedia("(max-width: 680px)").matches;
  const availableWidth = Math.max(180, rect.width - horizontalPadding - (isPhone ? 0 : 8));
  const availableHeight = Math.max(160, visibleBottom - rect.top - verticalPadding - 8);
  const shouldFitHeight = document.body.classList.contains("focus-mode") || (!isPhone && (window.matchMedia("(max-width: 980px)").matches || state.ratio === "portrait"));
  const scale = shouldFitHeight ? Math.min(1, availableWidth / width, availableHeight / height) : Math.min(1, availableWidth / width);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.style.transform = `scale(${scale})`;
  frame.style.width = `${Math.round(width * scale)}px`;
  frame.style.height = `${Math.round(height * scale)}px`;
}
function addLine() {
  const last = state.lyrics.at(-1)?.time ?? 0;
  commit((draft) => { draft.lyrics.push({ id: uid(), time: clamp(last + 15, 0, draft.duration), text: "新歌词", translation: "" }); draft.currentTime = clamp(last + 15, 0, draft.duration); }, { rebuild: true });
  requestAnimationFrame(() => { const card = timelineEditor.lastElementChild; card?.scrollIntoView({ behavior: "smooth", block: "center" }); card?.querySelector('[data-line-key="text"]')?.select(); });
}
function addTrack() {
  commit((draft) => { draft.playlist.tracks.push({ id:uid(), title:"新歌曲", artist:"未署名歌手", album:"", duration:"03:40", coverRef:"", coverName:"cover.png" }); }, { rebuild:true });
  requestAnimationFrame(() => playlistEditor.lastElementChild?.querySelector('[data-track-key="title"]')?.select());
}
function seekLine(direction) {
  if (!state.lyrics.length) return;
  const active = getActiveIndex();
  const next = clamp(active + direction, 0, state.lyrics.length - 1);
  commit((draft) => { draft.currentTime = draft.lyrics[next].time; }, { history: false });
}
function startPlayback() {
  if (isPlaying) { stopPlayback(); return; }
  if (state.currentTime >= state.duration) state.currentTime = 0;
  isPlaying = true; renderCanvas();
  let last = performance.now();
  playTimer = window.setInterval(() => {
    const now = performance.now(); const delta = (now - last) / 1000; last = now;
    state.currentTime = clamp(state.currentTime + delta, 0, state.duration);
    renderCanvas();
    if (state.currentTime >= state.duration) stopPlayback();
  }, 200);
}
function stopPlayback() { isPlaying = false; clearInterval(playTimer); renderCanvas(); }

function showToast(message, isError = false) {
  const toast = $("#toast"); clearTimeout(toastTimer); toast.textContent = message; toast.style.background = isError ? "#863e3e" : "#183b63"; toast.classList.add("show");
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}
function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = fileName; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1200);
}
async function exportJson() {
  const portable = clone(state);
  if (state.cover.ref) {
    try { const blob = await getAsset(state.cover.ref); if (blob) portable.coverData = await blobToDataUrl(blob); } catch { /* keep text data exportable */ }
  }
  portable.cover.ref = "";
  if (state.profile.avatarRef) {
    try { const blob = await getAsset(state.profile.avatarRef); if (blob) portable.profile.avatarData = await blobToDataUrl(blob); } catch { /* keep text data exportable */ }
  }
  portable.profile.avatarRef = "";
  await Promise.all(state.playlist.tracks.map(async (track, index) => {
    portable.playlist.tracks[index].coverRef = "";
    if (!track.coverRef) return;
    try { const blob = await getAsset(track.coverRef); if (blob) portable.playlist.tracks[index].coverData = await blobToDataUrl(blob); } catch { /* keep text data exportable */ }
  }));
  downloadBlob(new Blob([JSON.stringify(portable, null, 2)], { type: "application/json;charset=utf-8" }), `${safeFileName(state.name)}.json`);
  showToast("项目 JSON 已保存。 ");
}
async function importJson(file) {
  if (!file) return;
  if (file.size > 80 * 1024 * 1024) throw new Error("JSON 文件超过 80MB。");
  const parsed = JSON.parse(await file.text());
  if (parsed.schema !== "lyric-timeline") throw new Error("这不是有效的歌词时间线项目文件。");
  const next = normalizeProject(parsed);
  const stamp = Date.now();
  if (parsed.coverData) {
    const ref = `cover-${next.id}-${stamp}`;
    await setAsset(ref, dataUrlToBlob(parsed.coverData)); next.cover.ref = ref;
  }
  if (parsed.profile?.avatarData) {
    const ref = `playlist-avatar-${next.id}-${stamp}`;
    await setAsset(ref, dataUrlToBlob(parsed.profile.avatarData)); next.profile.avatarRef = ref;
  }
  await Promise.all((parsed.playlist?.tracks || []).map(async (track, index) => {
    if (!track?.coverData || !next.playlist.tracks[index]) return;
    const ref = `playlist-track-${next.playlist.tracks[index].id}-${stamp}-${index}`;
    await setAsset(ref, dataUrlToBlob(track.coverData)); next.playlist.tracks[index].coverRef = ref;
  }));
  captureHistory(); state = next; historyFuture = []; exportFontCssPromise = null; stopPlayback(); saveStoredProject(); renderAll(); showToast("项目已导入。 ");
}
async function warmLocalFonts() {
  if (!document.fonts?.load) return;
  const sample = "歌曲名 这是一句歌词 潮汐来信 夜航收藏";
  try {
    await Promise.all([
      document.fonts.load('400 32px "OC Noto Serif SC"', sample),
      document.fonts.load('600 32px "OC Noto Serif SC"', sample),
      document.fonts.load('700 32px "OC Noto Serif SC"', sample)
    ]);
    fitCanvas();
  } catch (error) {
    console.warn("本地 Noto Serif SC 预加载失败，将使用后备字体。", error);
  }
}
async function waitForAssets(root) {
  await Promise.all($$("img", root).map((img) => img.complete && img.naturalWidth ? Promise.resolve() : new Promise((resolve) => { img.addEventListener("load", resolve, { once: true }); img.addEventListener("error", resolve, { once: true }); setTimeout(resolve, 4000); })));
  if (document.fonts?.load) {
    const fontSpecs = ["pixel", "classic-pixel"].includes(state.template)
      ? ['400 16px "PoxiaoPixel"']
      : ['400 16px "OC Noto Serif SC"', '600 16px "OC Noto Serif SC"', '700 16px "OC Noto Serif SC"'];
    await Promise.all(fontSpecs.map((spec) => Promise.race([
      document.fonts.load(spec, "歌曲名 这是一句歌词 潮汐来信"),
      new Promise((resolve) => setTimeout(resolve, 2500))
    ])));
  }
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}
async function getExportFontCss() {
  if (globalThis.OCExportFonts?.getFontEmbedCSS) {
    return globalThis.OCExportFonts.getFontEmbedCSS(canvas).catch((error) => {
      console.warn("按需字体嵌入失败，将使用兼容导出流程。", error);
      return "";
    });
  }
  if (!globalThis.htmlToImage?.getFontEmbedCSS) return "";
  if (!exportFontCssPromise) {
    exportFontCssPromise = htmlToImage.getFontEmbedCSS(canvas, { preferredFontFormat: "woff2" })
      .catch((error) => {
        exportFontCssPromise = null;
        console.warn("字体嵌入缓存生成失败，将使用默认导出流程。", error);
        return "";
      });
  }
  return exportFontCssPromise;
}
async function exportPng() {
  if (!globalThis.htmlToImage?.toBlob) throw new Error("PNG 导出组件没有加载，请确认 vendor 文件完整。");
  if (location.protocol === "file:") throw new Error("本地字体导出需要通过 localhost 或网站地址打开页面，不能直接双击 HTML。");
  const buttons = [$("#export-button"), $("#mobile-export-button")];
  buttons.forEach((button) => { button.disabled = true; });
  const originalTransform = canvas.style.transform;
  try {
    showToast("正在浏览器中生成 PNG…");
    await waitForAssets(canvas);
    canvas.classList.add("exporting");
    canvas.style.transform = "none";
    const { width, height } = CANVAS_SIZES[state.ratio] || CANVAS_SIZES.landscape;
    const fontEmbedCSS = await getExportFontCss();
    const exportOptions = {
      cacheBust: false, pixelRatio: 2, width, height,
      preferredFontFormat: "woff2",
      backgroundColor: getComputedStyle(canvas).getPropertyValue("--canvas-bg").trim() || "#f1eee7",
      style: { transform: "none", boxShadow: "none", margin: "0" }
    };
    if (fontEmbedCSS) exportOptions.fontEmbedCSS = fontEmbedCSS;
    const blob = await htmlToImage.toBlob(canvas, exportOptions);
    downloadBlob(blob, state.pageType === "playlist" ? `${safeFileName(state.name)}-播放列表.png` : `${safeFileName(state.name)}-${formatTime(state.currentTime).replaceAll(":","-")}.png`);
    showToast("PNG 已生成并开始下载。 ");
  } finally {
    canvas.classList.remove("exporting");
    canvas.style.transform = originalTransform;
    buttons.forEach((button) => { button.disabled = false; });
    fitCanvas();
  }
}
function bindEvents() {
  $$(".main-tab").forEach((tab) => tab.addEventListener("click", () => {
    $$(".main-tab").forEach((item) => item.classList.toggle("active", item === tab));
    $$(".tab-page").forEach((page) => page.classList.toggle("active", page.dataset.tabPage === tab.dataset.mainTab));
  }));
  document.addEventListener("focusin", (event) => {
    if (!event.target.matches("[data-field], [data-profile-field], [data-playlist-field], [data-track-key], input[data-custom-color], .line-card input")) return;
    if (!inputSnapshotTaken) { captureHistory(); inputSnapshotTaken = true; }
  });
  document.addEventListener("focusout", (event) => {
    if (!event.target.matches("[data-field], [data-profile-field], [data-playlist-field], [data-track-key], input[data-custom-color], .line-card input")) return;
    requestAnimationFrame(() => { if (!document.activeElement?.matches("[data-field], [data-profile-field], [data-playlist-field], [data-track-key], input[data-custom-color], .line-card input")) inputSnapshotTaken = false; });
  });
  $$('[data-field]').forEach((input) => input.addEventListener("input", () => {
    const field = input.dataset.field;
    if (field === "durationText") { const duration = parseTime(input.value); if (duration !== null) state.duration = clamp(duration, 1, 86400); }
    else if (field === "coverZoom") state.cover.zoom = number(input.value, 1);
    else if (field === "coverX") state.cover.x = number(input.value, 50);
    else if (field === "coverY") state.cover.y = number(input.value, 50);
    else if (field === "showTime" || field === "showTranslation") state[field] = input.checked;
    else state[field] = input.value;
    state = normalizeProject(state); scheduleSave(); renderCanvas();
    if (field === "coverZoom") $("#zoom-output").value = `${Math.round(state.cover.zoom * 100)}%`;
    if (field === "coverX") $("#x-output").value = `${Math.round(state.cover.x)}%`;
    if (field === "coverY") $("#y-output").value = `${Math.round(state.cover.y)}%`;
  }));
  $$('[data-custom-color]').forEach((input) => input.addEventListener("input", () => {
    state.palette = "custom";
    state.customPalette[input.dataset.customColor] = sanitizeHex(input.value, DEFAULT_CUSTOM_PALETTE[input.dataset.customColor]);
    state = normalizeProject(state);
    const paletteSelect = $('[data-field="palette"]');
    if (paletteSelect) paletteSelect.value = "custom";
    scheduleSave();
    renderCanvas();
  }));
  $("#reset-custom-palette").addEventListener("click", () => commit((draft) => {
    draft.palette = "custom";
    draft.customPalette = { ...DEFAULT_CUSTOM_PALETTE };
  }, { rebuild: true }));
  $$('[data-page-type-option]').forEach((button) => button.addEventListener("click", () => {
    stopPlayback();
    exportFontCssPromise = null;
    commit((draft) => { draft.pageType = button.dataset.pageTypeOption; if (draft.pageType === "playlist" && draft.ratio === "square") draft.ratio = "landscape"; }, { rebuild:true });
  }));
  $$('[data-profile-field]').forEach((input) => input.addEventListener("input", () => { state.profile[input.dataset.profileField] = input.value; state = normalizeProject(state); scheduleSave(); renderCanvas(); }));
  $$('[data-playlist-field]').forEach((input) => input.addEventListener("input", () => { state.playlist[input.dataset.playlistField] = input.value; state = normalizeProject(state); scheduleSave(); renderCanvas(); }));
  $$('[data-template-option]').forEach((button) => button.addEventListener("click", () => { exportFontCssPromise = null; commit((draft) => { draft.template = button.dataset.templateOption; }, { rebuild: true }); }));
  timelineEditor.addEventListener("input", (event) => {
    const input = event.target.closest("[data-line-key]"); if (!input) return;
    const line = state.lyrics.find((item) => item.id === input.closest(".line-card").dataset.lineId); if (!line) return;
    if (input.dataset.lineKey === "time") { const parsed = parseTime(input.value); if (parsed !== null) line.time = clamp(parsed, 0, state.duration); }
    else line[input.dataset.lineKey] = input.value;
    scheduleSave(); renderCanvas();
  });
  timelineEditor.addEventListener("change", (event) => {
    if (!event.target.matches('[data-line-key="time"]')) return;
    state.lyrics.sort((a,b) => a.time - b.time); scheduleSave(); renderEditor(); renderCanvas();
  });
  timelineEditor.addEventListener("click", (event) => {
    const action = event.target.closest("[data-line-action]"); if (!action) return;
    const id = action.closest(".line-card").dataset.lineId; const line = state.lyrics.find((item) => item.id === id); if (!line) return;
    if (action.dataset.lineAction === "seek") commit((draft) => { draft.currentTime = line.time; }, { history: false });
    if (action.dataset.lineAction === "delete") commit((draft) => { draft.lyrics = draft.lyrics.filter((item) => item.id !== id); }, { rebuild: true });
  });
  playlistEditor.addEventListener("input", (event) => {
    const input = event.target.closest("[data-track-key]"); if (!input) return;
    const track = state.playlist.tracks.find((item) => item.id === input.closest("[data-track-id]").dataset.trackId); if (!track) return;
    track[input.dataset.trackKey] = input.value; scheduleSave(); renderCanvas();
  });
  playlistEditor.addEventListener("click", (event) => {
    const button = event.target.closest("[data-track-action]"); if (!button) return;
    const id = button.closest("[data-track-id]").dataset.trackId; const index = state.playlist.tracks.findIndex((item) => item.id === id); if (index < 0) return;
    const action = button.dataset.trackAction;
    if (action === "delete") { const ref = state.playlist.tracks[index].coverRef; commit((draft) => { draft.playlist.tracks.splice(index,1); }, { rebuild:true }); if (ref) removeAsset(ref); return; }
    const next = action === "up" ? index - 1 : index + 1; if (next < 0 || next >= state.playlist.tracks.length) return;
    commit((draft) => { const [track] = draft.playlist.tracks.splice(index,1); draft.playlist.tracks.splice(next,0,track); }, { rebuild:true });
  });
  playlistEditor.addEventListener("change", async (event) => {
    const input = event.target.closest("[data-track-cover]"); if (!input) return;
    const file = input.files?.[0]; if (!file || !file.type.startsWith("image/") || file.size > 25 * 1024 * 1024) { input.value = ""; return showToast("请选择 25MB 以内的图片。", true); }
    const id = input.closest("[data-track-id]").dataset.trackId; const track = state.playlist.tracks.find((item) => item.id === id); if (!track) return;
    const oldRef = track.coverRef; const ref = `playlist-track-${id}-${Date.now()}`;
    try { await setAsset(ref,file); commit((draft) => { const item=draft.playlist.tracks.find((entry)=>entry.id===id); if(item){item.coverRef=ref;item.coverName=file.name;} }, { rebuild:true }); if(oldRef) removeAsset(oldRef); } catch { showToast("浏览器无法保存这张封面。",true); }
  });
  $("#add-track-button").addEventListener("click", addTrack); $("#add-track-wide").addEventListener("click", addTrack);
  $("#canvas-lyrics").addEventListener("click", (event) => { const line = state.lyrics.find((item) => item.id === event.target.closest("[data-line-id]")?.dataset.lineId); if (line) commit((draft) => { draft.currentTime = line.time; }, { history: false }); });
  $("#add-line-button").addEventListener("click", addLine); $("#add-line-wide").addEventListener("click", addLine);
  $("#preview-play").addEventListener("click", startPlayback); $("#preview-prev").addEventListener("click", () => seekLine(-1)); $("#preview-next").addEventListener("click", () => seekLine(1));
  $("#preview-progress").addEventListener("click", (event) => { const rect = event.currentTarget.getBoundingClientRect(); commit((draft) => { draft.currentTime = clamp((event.clientX - rect.left) / rect.width * draft.duration, 0, draft.duration); }, { history: false }); });
  $("#playlist-avatar-input").addEventListener("change", async (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 25 * 1024 * 1024) { event.target.value=""; return showToast("请选择 25MB 以内的图片。",true); }
    const oldRef=state.profile.avatarRef; const ref=`playlist-avatar-${state.id}-${Date.now()}`;
    try { await setAsset(ref,file); commit((draft)=>{draft.profile.avatarRef=ref;draft.profile.avatarName=file.name;},{rebuild:true}); if(oldRef) removeAsset(oldRef); } catch { showToast("浏览器无法保存头像。",true); }
    event.target.value="";
  });
  $("#reset-playlist-avatar").addEventListener("click", () => { const oldRef=state.profile.avatarRef; commit((draft)=>{draft.profile.avatarRef="";draft.profile.avatarName="cover.png";},{rebuild:true}); if(oldRef) removeAsset(oldRef); });
  $("#cover-input").addEventListener("change", async (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith("image/")) return showToast("请选择图片文件。", true);
    if (file.size > 25 * 1024 * 1024) return showToast("图片请控制在 25MB 以内。", true);
    const oldRef = state.cover.ref; const ref = `cover-${state.id}-${Date.now()}`;
    try { await setAsset(ref, file); commit((draft) => { draft.cover.ref = ref; draft.cover.name = file.name; draft.cover.zoom = 1; draft.cover.x = 50; draft.cover.y = 50; }, { rebuild: true }); await hydrateCover(); if (oldRef) removeAsset(oldRef); }
    catch { showToast("浏览器无法保存这张图片。", true); }
    event.target.value = "";
  });
  $("#reset-cover-button").addEventListener("click", async () => { const oldRef = state.cover.ref; commit((draft) => { draft.cover = { ref: "", name: "cover.png", zoom: 1, x: 50, y: 50 }; }, { rebuild: true }); await hydrateCover(); if (oldRef) removeAsset(oldRef); });
  $("#undo-button").addEventListener("click", undo); $("#redo-button").addEventListener("click", redo);
  $("#json-button").addEventListener("click", () => exportJson().catch((error) => showToast(error.message, true)));
  $("#import-input").addEventListener("change", (event) => importJson(event.target.files?.[0]).catch((error) => showToast(`导入失败：${error.message}`, true)).finally(() => { event.target.value = ""; }));
  $("#export-button").addEventListener("click", () => exportPng().catch((error) => showToast(`导出失败：${error.message}`, true)));
  $("#mobile-export-button").addEventListener("click", () => exportPng().catch((error) => showToast(`导出失败：${error.message}`, true)));
  $("#clear-button").addEventListener("click", () => {
    const isPlaylist = state.pageType === "playlist";
    const message = isPlaylist ? "确定清空账户信息和全部播放列表歌曲吗？建议先保存 JSON。" : "确定清空歌曲信息和全部歌词节点吗？建议先保存 JSON。";
    if (!confirm(message)) return;
    if (isPlaylist) {
      const refs = [state.profile.avatarRef, ...state.playlist.tracks.map((track) => track.coverRef)].filter(Boolean);
      commit((draft) => {
        draft.name = "未命名播放列表项目"; draft.footerText = "";
        draft.profile = { name: "", handle: "", bio: "", tags: "", badge: "", location: "", joined: "", status: "", statSongs: "", statPlaylists: "", statFollowers: "", stats: "", avatarRef: "", avatarName: "cover.png" };
        draft.playlist = { title: "", subtitle: "", description: "", tracks: [] };
      }, { rebuild: true });
      refs.forEach(removeAsset);
    } else {
      commit((draft) => { draft.name = "未命名歌词项目"; draft.footerText = ""; draft.title = ""; draft.artist = ""; draft.album = ""; draft.tags = ""; draft.description = ""; draft.currentTime = 0; draft.lyrics = []; }, { rebuild: true });
    }
  });
  $("#focus-button").addEventListener("click", () => { document.body.classList.toggle("focus-mode"); $("#focus-button").textContent = document.body.classList.contains("focus-mode") ? "×" : "⛶"; requestAnimationFrame(fitCanvas); });
  $("#focus-exit-button").addEventListener("click", () => $("#focus-button").click());
  $$("[data-jump]").forEach((button) => button.addEventListener("click", () => document.getElementById(button.dataset.jump)?.scrollIntoView({ behavior: "smooth", block: "start" })));
  window.addEventListener("resize", fitCanvas);
  window.visualViewport?.addEventListener("resize", fitCanvas);
  new ResizeObserver(fitCanvas).observe(viewport);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("focus-mode")) $("#focus-button").click();
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); event.shiftKey ? redo() : undo(); }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") { event.preventDefault(); redo(); }
  });
  window.addEventListener("beforeunload", saveStoredProject);
}

const PLAYER_TUTORIAL_SEEN_KEY = "lyric-timeline-tutorial-seen-v1";
const PLAYER_TUTORIAL_STEPS = [
  {
    target: ".workspace",
    kicker: "STEP 1 · OVERVIEW",
    title: "在一个页面完成整份作品",
    description: "上方是实时画布，下方或右侧是编辑区域。你可以一边填写内容，一边检查最终图片的排版效果。",
    points: ["歌词页面和播放列表共用同一套编辑器。", "手机端的预览区与编辑区可以分别滚动。"]
  },
  {
    target: "#preview-panel",
    kicker: "STEP 2 · PREVIEW",
    title: "随时检查实时预览",
    description: "文字、图片、歌词高亮和配色都会立即显示在画布上。画布高于当前预览区域时，可以直接在预览区上下滑动查看。",
    points: ["画布会按屏幕宽度自动缩放。", "右上角的 ⛶ 可以进入专注预览。"]
  },
  {
    target: ".generator-switch",
    kicker: "STEP 3 · PAGE TYPE",
    title: "选择歌词页面或播放列表",
    description: "歌词页面适合制作单曲歌词视觉，播放列表适合展示账户资料和多首歌曲。两种页面可以使用相同的模板与配色语言。",
    points: ["切换页面不会删除另一种页面已经填写的内容。", "播放列表支持横版和竖版画幅。"]
  },
  {
    target: ".main-tabs",
    kicker: "STEP 4 · EDITOR",
    title: "内容与样式分开设置",
    description: "“内容编辑”负责文字、图片和歌词节点；“样式设置”负责模板、配色、画幅与封面取景。",
    prepare: () => activatePlayerTutorialTab("content")
  },
  {
    target: () => state.pageType === "playlist"
      ? document.querySelector("#playlist-content-panel .card")
      : document.querySelector("#lyrics-content-panel .card"),
    kicker: "STEP 5 · CONTENT",
    title: "先填写作品的基础内容",
    description: "在这里填写歌曲或账户资料、上传封面，并继续向下编辑歌词节点或播放列表。所有字段都会自动保存在当前浏览器。",
    points: ["歌词节点可以填写时间、正文和译文。", "播放列表可以添加歌曲、调整顺序和更换每首歌的封面。"],
    prepare: () => activatePlayerTutorialTab("content")
  },
  {
    target: ".preset-grid",
    fallbackTarget: '[data-tab-page="style"] .card',
    kicker: "STEP 6 · STYLE",
    title: "组合模板、配色和画幅",
    description: "选择视觉模板后，还可以继续修改整套配色、横竖画幅以及封面的缩放和位置。样式调整不会覆盖已经填写的内容。",
    points: ["不同模板在横版、方图和竖版中会使用对应排版。", "自定义颜色可以同时控制背景、文字、按钮和强调色。"],
    prepare: () => activatePlayerTutorialTab("style")
  },
  {
    target: [".top-actions", "#focus-button"],
    kicker: "STEP 7 · FINISH",
    title: "专注检查、备份并导出",
    description: "点击 ⛶ 进入专注预览；完成后可以保存 JSON 备份，或直接导出 PNG。之后仍可点击顶部的“教程”重新查看本引导。",
    points: ["导入 JSON 可以继续编辑之前保存的项目。", "导出前会等待本地字体与图片准备完成。"]
  }
];

let playerTutorialIndex = 0;
let playerTutorialLayer = null;
let playerTutorialSpotlight = null;
let playerTutorialPopover = null;
let playerTutorialTargets = [];
let playerTutorialRestore = null;

function playerTutorialSeen() {
  try { return localStorage.getItem(PLAYER_TUTORIAL_SEEN_KEY) === "1"; }
  catch { return false; }
}
function markPlayerTutorialSeen() {
  try { localStorage.setItem(PLAYER_TUTORIAL_SEEN_KEY, "1"); }
  catch { /* The tutorial remains usable without storage. */ }
}
function activatePlayerTutorialTab(tabName) {
  const button = $(`.main-tab[data-main-tab="${tabName}"]`);
  if (button && !button.classList.contains("active")) button.click();
}
function resolvePlayerTutorialTargets(step) {
  const source = typeof step.target === "function" ? step.target() : step.target;
  const candidates = Array.isArray(source) ? source : [source];
  const nodes = candidates.flatMap((candidate) => {
    if (typeof candidate === "string") return [$(candidate)];
    return candidate instanceof Element ? [candidate] : [];
  }).filter((node) => node && node.getClientRects().length);
  if (!nodes.length && step.fallbackTarget) {
    const fallback = $(step.fallbackTarget);
    if (fallback?.getClientRects().length) nodes.push(fallback);
  }
  return nodes;
}
function getPlayerTutorialRect(nodes = playerTutorialTargets) {
  const rects = nodes.map((node) => node.getBoundingClientRect()).filter((rect) => rect.width || rect.height);
  if (!rects.length) return null;
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.right));
  const bottom = Math.max(...rects.map((rect) => rect.bottom));
  return { left, top, right, bottom, width: right - left, height: bottom - top };
}
function makePlayerTutorialButton(text, className, action) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = text;
  button.addEventListener("click", action);
  return button;
}
function buildPlayerTutorialLayer() {
  playerTutorialLayer = document.createElement("div");
  playerTutorialLayer.className = "tutorial-layer";
  playerTutorialLayer.setAttribute("aria-hidden", "false");

  const guard = document.createElement("div");
  guard.className = "tutorial-click-guard";
  playerTutorialSpotlight = document.createElement("div");
  playerTutorialSpotlight.className = "tutorial-spotlight";
  playerTutorialPopover = document.createElement("section");
  playerTutorialPopover.className = "tutorial-popover";
  playerTutorialPopover.setAttribute("role", "dialog");
  playerTutorialPopover.setAttribute("aria-modal", "true");
  playerTutorialPopover.setAttribute("aria-labelledby", "player-tutorial-title");
  playerTutorialPopover.setAttribute("aria-describedby", "player-tutorial-description");

  playerTutorialLayer.append(guard, playerTutorialSpotlight, playerTutorialPopover);
  document.body.append(playerTutorialLayer);
  document.body.classList.add("tutorial-open");
  window.addEventListener("resize", positionPlayerTutorial);
  window.visualViewport?.addEventListener("resize", positionPlayerTutorial);
  document.addEventListener("keydown", handlePlayerTutorialKeys);
}
function renderPlayerTutorialPopover(step) {
  playerTutorialPopover.replaceChildren();

  const header = document.createElement("div");
  header.className = "tutorial-popover-header";
  const kicker = document.createElement("span");
  kicker.className = "tutorial-kicker";
  kicker.textContent = step.kicker;
  const counter = document.createElement("span");
  counter.className = "tutorial-counter";
  counter.textContent = `${playerTutorialIndex + 1} / ${PLAYER_TUTORIAL_STEPS.length}`;
  header.append(kicker, counter);

  const title = document.createElement("h2");
  title.id = "player-tutorial-title";
  title.textContent = step.title;
  const description = document.createElement("p");
  description.id = "player-tutorial-description";
  description.textContent = step.description;

  const points = document.createElement("ul");
  points.className = "tutorial-points";
  (step.points || []).forEach((point) => {
    const item = document.createElement("li");
    item.textContent = point;
    points.append(item);
  });

  const progress = document.createElement("div");
  progress.className = "tutorial-progress";
  progress.setAttribute("aria-hidden", "true");
  progress.style.setProperty("--tutorial-steps", String(PLAYER_TUTORIAL_STEPS.length));
  PLAYER_TUTORIAL_STEPS.forEach((_, index) => {
    const bar = document.createElement("span");
    if (index <= playerTutorialIndex) bar.classList.add("active");
    progress.append(bar);
  });

  const actions = document.createElement("div");
  actions.className = "tutorial-actions";
  actions.append(makePlayerTutorialButton("跳过", "button ghost tutorial-action", finishPlayerTutorial));
  const navigation = document.createElement("div");
  navigation.className = "tutorial-navigation";
  if (playerTutorialIndex > 0) {
    navigation.append(makePlayerTutorialButton("上一步", "button ghost tutorial-action", () => showPlayerTutorialStep(playerTutorialIndex - 1)));
  }
  navigation.append(makePlayerTutorialButton(
    playerTutorialIndex === PLAYER_TUTORIAL_STEPS.length - 1 ? "完成" : "下一步",
    "button primary tutorial-action tutorial-next",
    () => playerTutorialIndex === PLAYER_TUTORIAL_STEPS.length - 1
      ? finishPlayerTutorial()
      : showPlayerTutorialStep(playerTutorialIndex + 1)
  ));
  actions.append(navigation);

  playerTutorialPopover.append(header, title, description);
  if (points.childElementCount) playerTutorialPopover.append(points);
  playerTutorialPopover.append(progress, actions);
}
function setPlayerTutorialMobilePlacement(rect) {
  if (!playerTutorialPopover) return;
  if (!window.matchMedia("(max-width: 680px)").matches) {
    playerTutorialPopover.classList.remove("is-top");
    return;
  }
  const center = rect.top + Math.min(rect.height, window.innerHeight) / 2;
  playerTutorialPopover.classList.toggle("is-top", center > window.innerHeight * .52);
}
function ensurePlayerTutorialTargetVisible() {
  const rect = getPlayerTutorialRect();
  const first = playerTutorialTargets[0];
  if (!rect || !first || !playerTutorialPopover) return;
  const isPhone = window.matchMedia("(max-width: 680px)").matches;
  setPlayerTutorialMobilePlacement(rect);

  if (!isPhone) {
    if (rect.bottom < 16 || rect.top > window.innerHeight - 16) {
      first.scrollIntoView({ behavior: "auto", block: "center", inline: "nearest" });
    }
    return;
  }

  const popoverHeight = Math.min(playerTutorialPopover.scrollHeight, window.innerHeight * .48);
  const popoverOnTop = playerTutorialPopover.classList.contains("is-top");
  const visibleTop = popoverOnTop ? popoverHeight + 22 : 8;
  const visibleBottom = popoverOnTop ? window.innerHeight - 8 : window.innerHeight - popoverHeight - 22;
  const availableHeight = Math.max(60, visibleBottom - visibleTop);
  const scrollContainer = first.closest(".editor-scroll, .preview-viewport");
  if (!scrollContainer) return;

  let delta = 0;
  if (rect.height > availableHeight) delta = rect.top - visibleTop;
  else if (rect.top < visibleTop) delta = rect.top - visibleTop;
  else if (rect.bottom > visibleBottom) delta = rect.bottom - visibleBottom;
  if (Math.abs(delta) > 1) scrollContainer.scrollTop += delta;
}
function positionPlayerTutorial() {
  if (!playerTutorialLayer || !playerTutorialSpotlight || !playerTutorialPopover) return;
  const rect = getPlayerTutorialRect();
  if (!rect) return;
  setPlayerTutorialMobilePlacement(rect);

  const padding = 7;
  const left = Math.max(6, rect.left - padding);
  const top = Math.max(6, rect.top - padding);
  const right = Math.min(window.innerWidth - 6, rect.right + padding);
  const bottom = Math.min(window.innerHeight - 6, rect.bottom + padding);
  Object.assign(playerTutorialSpotlight.style, {
    left: `${left}px`,
    top: `${top}px`,
    width: `${Math.max(28, right - left)}px`,
    height: `${Math.max(28, bottom - top)}px`
  });

  if (window.matchMedia("(max-width: 680px)").matches) {
    playerTutorialPopover.style.removeProperty("left");
    playerTutorialPopover.style.removeProperty("top");
    return;
  }

  const popoverRect = playerTutorialPopover.getBoundingClientRect();
  const gap = 16;
  let popoverLeft = rect.right + gap;
  if (popoverLeft + popoverRect.width > window.innerWidth - 16) popoverLeft = rect.left - popoverRect.width - gap;
  if (popoverLeft < 16) {
    popoverLeft = Math.min(window.innerWidth - popoverRect.width - 16, Math.max(16, rect.left + rect.width / 2 - popoverRect.width / 2));
  }
  const popoverTop = Math.min(window.innerHeight - popoverRect.height - 16, Math.max(16, rect.top));
  playerTutorialPopover.style.left = `${popoverLeft}px`;
  playerTutorialPopover.style.top = `${popoverTop}px`;
}
function showPlayerTutorialStep(index) {
  playerTutorialIndex = clamp(index, 0, PLAYER_TUTORIAL_STEPS.length - 1);
  const step = PLAYER_TUTORIAL_STEPS[playerTutorialIndex];
  step.prepare?.();
  renderPlayerTutorialPopover(step);

  requestAnimationFrame(() => {
    playerTutorialTargets = resolvePlayerTutorialTargets(step);
    if (!playerTutorialTargets.length) {
      if (playerTutorialIndex < PLAYER_TUTORIAL_STEPS.length - 1) showPlayerTutorialStep(playerTutorialIndex + 1);
      else finishPlayerTutorial();
      return;
    }
    ensurePlayerTutorialTargetVisible();
    requestAnimationFrame(() => {
      positionPlayerTutorial();
      playerTutorialPopover.querySelector(".tutorial-next")?.focus();
    });
  });
}
function handlePlayerTutorialKeys(event) {
  if (!playerTutorialLayer) return;
  if (event.key === "Escape") {
    event.preventDefault();
    finishPlayerTutorial();
    return;
  }
  if (event.key === "ArrowRight") {
    event.preventDefault();
    if (playerTutorialIndex < PLAYER_TUTORIAL_STEPS.length - 1) showPlayerTutorialStep(playerTutorialIndex + 1);
    else finishPlayerTutorial();
    return;
  }
  if (event.key === "ArrowLeft" && playerTutorialIndex > 0) {
    event.preventDefault();
    showPlayerTutorialStep(playerTutorialIndex - 1);
    return;
  }
  if (event.key !== "Tab") return;
  const focusable = [...playerTutorialPopover.querySelectorAll("button")];
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
function startPlayerTutorial() {
  if (playerTutorialLayer) return;
  playerTutorialRestore = {
    tab: $(".main-tab.active")?.dataset.mainTab || "content",
    editorScroll: $(".editor-scroll")?.scrollTop || 0,
    previewScroll: $(".preview-viewport")?.scrollTop || 0,
    focusMode: document.body.classList.contains("focus-mode")
  };
  if (playerTutorialRestore.focusMode) $("#focus-button")?.click();
  buildPlayerTutorialLayer();
  showPlayerTutorialStep(0);
}
function finishPlayerTutorial() {
  markPlayerTutorialSeen();
  playerTutorialLayer?.remove();
  playerTutorialLayer = null;
  playerTutorialSpotlight = null;
  playerTutorialPopover = null;
  playerTutorialTargets = [];
  document.body.classList.remove("tutorial-open");
  window.removeEventListener("resize", positionPlayerTutorial);
  window.visualViewport?.removeEventListener("resize", positionPlayerTutorial);
  document.removeEventListener("keydown", handlePlayerTutorialKeys);

  const restore = playerTutorialRestore;
  playerTutorialRestore = null;
  if (!restore) return;
  activatePlayerTutorialTab(restore.tab);
  requestAnimationFrame(() => {
    const editor = $(".editor-scroll");
    const preview = $(".preview-viewport");
    if (editor) editor.scrollTop = restore.editorScroll;
    if (preview) preview.scrollTop = restore.previewScroll;
    if (restore.focusMode && !document.body.classList.contains("focus-mode")) $("#focus-button")?.click();
  });
}
function initPlayerTutorial() {
  $("#open-tutorial")?.addEventListener("click", startPlayerTutorial);
  if (!playerTutorialSeen()) window.setTimeout(startPlayerTutorial, 450);
}
bindEvents();
initMobileWorkspaceResizer();
renderAll();
warmLocalFonts();
initPlayerTutorial();
