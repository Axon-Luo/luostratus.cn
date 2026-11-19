import { computed, signal } from '@preact/signals';
import { buildEntries, describePalette, generatePalettes, repairPalette } from './core/palette/generate';
import type { GenerateOptions } from './core/palette/generate';
import { toColorMap } from './core/palette/types';
import { evaluate } from './core/palette/metrics';
import { SCENE_MAP, SCENES, HARMONY_LABEL, hexLabel } from './content/presets';
import type { Palette, Role } from './core/palette/types';
import { decodeShare } from './core/share';
import { DEFAULT_CHALLENGE, DEFAULT_DAILY, DEFAULT_SETTINGS, loadPersisted, savePersisted } from './core/storage';
import { createLibraryBackup, mergePalettes, parseLibraryBackup } from './core/library';
import { dailyPalette, dayKey, visitDaily } from './core/daily';
import { UndoStack } from './core/undo';
import type { ChallengeState, DailyState, Persisted, PreviewMode, Settings, ThemeMode, ToolDrafts } from './core/storage';
import type { CvdType } from './core/color/cvd';

const loaded = loadPersisted();

function initialTheme(fallback: ThemeMode): ThemeMode {
  try {
    if (typeof localStorage !== 'undefined' && !localStorage.getItem('cf.ui.v3')) {
      localStorage.setItem('cf.ui.v3', '1');
      return 'dark';
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

export const settings = signal<Settings>({
  ...DEFAULT_SETTINGS,
  ...loaded.settings,
  theme: initialTheme(loaded.settings.theme),
});
export const favorites = signal<Palette[]>(loaded.favorites);
export const history = signal<Palette[]>(loaded.history);
export const storageWarning = signal(false);
export const sharedFrom = signal(false);
export const toastMsg = signal('');
export const previewTheme = signal<'light' | 'dark'>('light');
export const cvdType = signal<CvdType>('none');
export const imageUrl = signal('');
export const imageColors = signal<string[]>([]);
export const lockMap = signal<Partial<Record<Role, string>>>({});
export const daily = signal<DailyState>(loaded.daily);
export const challenge = signal<ChallengeState>(loaded.challenge);
export const toolDrafts = signal<ToolDrafts>(loaded.tools);

function readOptions(seed?: number): GenerateOptions {
  const s = settings.value;
  return {
    baseHex: s.baseColor,
    scene: s.scene,
    style: s.style,
    mood: s.mood,
    harmony: s.harmony,
    strict: s.strict,
    pair: s.pairMode,
    cvdSafe: s.cvdSafe,
    locks: lockMap.value,
    seed,
    count: 3,
  };
}

const initialPalettes = generatePalettes(readOptions(20261116));
export const palettes = signal<Palette[]>(initialPalettes);
export const activeId = signal<string>(initialPalettes[0]?.id ?? '');
// 首次生成的三套方案也进入历史，用户一进来就能在「我的方案」里找回。
initialPalettes.forEach((p) => pushHistory(p));

export const activePalette = computed<Palette | null>(() => {
  const list = palettes.value;
  return list.find((p) => p.id === activeId.value) ?? list[0] ?? null;
});

export const activeMap = computed(() => {
  const p = activePalette.value;
  return p ? toColorMap(p) : null;
});

/* ---------- 工作区撤销 / 重做 ---------- */

interface WorkspaceSnapshot {
  palettes: Palette[];
  activeId: string;
  settings: Settings;
  lockMap: Partial<Record<Role, string>>;
}

const workspaceUndo = new UndoStack<WorkspaceSnapshot>(50);
export const undoState = signal({ canUndo: false, canRedo: false });

function snapshotWorkspace(): WorkspaceSnapshot {
  return {
    palettes: palettes.value,
    activeId: activeId.value,
    settings: settings.value,
    lockMap: lockMap.value,
  };
}

function syncUndoState(): void {
  undoState.value = { canUndo: workspaceUndo.canUndo, canRedo: workspaceUndo.canRedo };
}

/** 在修改工作区之前记录快照；key 相同的连续操作（拖滑杆、连按空格）会合并。 */
function recordWorkspace(key: string): void {
  workspaceUndo.push(snapshotWorkspace(), key);
  syncUndoState();
}

function applyWorkspace(s: WorkspaceSnapshot): void {
  palettes.value = s.palettes;
  activeId.value = s.activeId;
  settings.value = s.settings;
  lockMap.value = s.lockMap;
  persist();
}

export function undoWorkspace(): void {
  const prev = workspaceUndo.undo(snapshotWorkspace());
  if (!prev) {
    toast('没有可以撤销的操作');
    return;
  }
  applyWorkspace(prev);
  syncUndoState();
  toast('已撤销');
}

export function redoWorkspace(): void {
  const next = workspaceUndo.redo(snapshotWorkspace());
  if (!next) {
    toast('没有可以重做的操作');
    return;
  }
  applyWorkspace(next);
  syncUndoState();
  toast('已重做');
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export function toast(message: string): void {
  toastMsg.value = message;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMsg.value = '';
  }, 2000);
}

function persist(): void {
  const data: Persisted = {
    version: 2,
    favorites: favorites.value,
    history: history.value,
    settings: settings.value,
    daily: daily.value,
    challenge: challenge.value,
    tools: toolDrafts.value,
  };
  storageWarning.value = !savePersisted(data);
}

function signature(p: Palette): string {
  return p.colors.map((c) => c.hex).join(',');
}

export function pushHistory(p: Palette): void {
  const list = history.value.filter((x) => signature(x) !== signature(p));
  list.unshift(p);
  history.value = list.slice(0, 30);
}

export function generateNow(seed?: number): void {
  recordWorkspace('generate');
  const list = generatePalettes(readOptions(seed));
  palettes.value = list;
  activeId.value = list[0]?.id ?? '';
  list.forEach(pushHistory);
  persist();
}

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
  settings.value = { ...settings.value, [key]: value };
  persist();
  if (
    key === 'baseColor' ||
    key === 'scene' ||
    key === 'style' ||
    key === 'mood' ||
    key === 'harmony' ||
    key === 'strict' ||
    key === 'pairMode' ||
    key === 'cvdSafe'
  ) {
    generateNow();
  }
}

export function setBaseColor(hex: string, regenerate = false): void {
  settings.value = { ...settings.value, baseColor: hex };
  persist();
  if (regenerate) generateNow();
}

export function selectPalette(id: string): void {
  activeId.value = id;
}

export function toggleLock(role: Role): void {
  const p = activePalette.value;
  if (!p) return;
  const current = p.colors.find((c) => c.role === role)?.hex;
  if (!current) return;
  const next = { ...lockMap.value };
  if (next[role]) delete next[role];
  else next[role] = current;
  lockMap.value = next;
  generateNow();
}

export function toggleFavorite(p: Palette): void {
  const exists = favorites.value.some((x) => x.id === p.id);
  favorites.value = exists
    ? favorites.value.filter((x) => x.id !== p.id)
    : [structuredClone(p), ...favorites.value].slice(0, 50);
  persist();
  toast(exists ? '已取消收藏' : '已收藏');
}

export function deleteFavorite(id: string): void {
  favorites.value = favorites.value.filter((x) => x.id !== id);
  persist();
}

export function deleteHistory(id: string): void {
  history.value = history.value.filter((x) => x.id !== id);
  persist();
}

export function exportLibraryData(): string {
  return JSON.stringify(
    createLibraryBackup(favorites.value, history.value, settings.value),
    null,
    2,
  );
}

export function importLibraryData(text: string, mode: 'merge' | 'replace'): { ok: boolean; message: string } {
  const parsed = parseLibraryBackup(text);
  if (!parsed.ok) return { ok: false, message: parsed.error };

  if (mode === 'replace') {
    favorites.value = parsed.data.favorites;
    history.value = parsed.data.history;
  } else {
    favorites.value = mergePalettes(favorites.value, parsed.data.favorites);
    history.value = mergePalettes(history.value, parsed.data.history);
  }
  favorites.value = favorites.value.slice(0, 50);
  history.value = history.value.slice(0, 30);

  const incoming = parsed.data.settings;
  if (incoming && typeof incoming === 'object') {
    settings.value = {
      ...settings.value,
      ...incoming,
      baseColor: /^#[0-9a-fA-F]{6}$/.test(incoming.baseColor) ? incoming.baseColor : settings.value.baseColor,
    };
  }
  persist();
  const total = parsed.data.favorites.length + parsed.data.history.length;
  return {
    ok: true,
    message: `已导入 ${total} 个方案${parsed.skipped ? `，跳过 ${parsed.skipped} 条无效数据` : ''}`,
  };
}

export function markDailyVisit(): Palette {
  const today = dayKey();
  daily.value = visitDaily(daily.value, today);
  persist();
  return dailyPalette(today);
}

export function recordChallengeScore(score: number): void {
  const today = dayKey();
  challenge.value = {
    best: Math.max(challenge.value.best, score),
    lastDate: today,
    history: [{ date: today, score }, ...challenge.value.history].slice(0, 20),
  };
  persist();
}

export function clearAllData(): void {
  workspaceUndo.clear();
  syncUndoState();
  favorites.value = [];
  history.value = [];
  daily.value = { ...DEFAULT_DAILY, archive: [] };
  challenge.value = { ...DEFAULT_CHALLENGE, history: [] };
  toolDrafts.value = {};
  settings.value = { ...DEFAULT_SETTINGS };
  lockMap.value = {};
  persist();
  toast('已清空本地数据');
}

export function restorePalette(p: Palette): void {
  recordWorkspace('restore');
  const copy = structuredClone(p);
  palettes.value = [copy];
  activeId.value = copy.id;
  const primary = copy.colors.find((c) => c.role === 'primary');
  if (primary) settings.value = { ...settings.value, baseColor: primary.hex };
  pushHistory(copy);
  persist();
  toast('已恢复这套配色');
}

export function renamePalette(p: Palette, name: string): void {
  const clean = name.trim().slice(0, 40);
  if (clean === (p.customName ?? '')) return;
  const update = (list: Palette[]) =>
    list.map((x) =>
      x.id === p.id ? { ...x, customName: clean, updatedAt: Date.now() } : x,
    );
  palettes.value = update(palettes.value);
  favorites.value = update(favorites.value);
  history.value = update(history.value);
  persist();
}

export function repairActive(): void {
  const p = activePalette.value;
  if (!p) return;
  recordWorkspace('repair');
  const fixed = repairPalette(p);
  palettes.value = palettes.value.map((x) => (x.id === fixed.id ? fixed : x));
  history.value = history.value.map((x) => (x.id === fixed.id ? fixed : x));
  persist();
  toast('已按最小改动修复对比度');
}

/** 改单个颜色：即时更新方案、写入历史，并锁定该角色。 */
export function updatePaletteColor(paletteId: string, role: Role, hex: string): void {
  const source =
    palettes.value.find((x) => x.id === paletteId) ??
    favorites.value.find((x) => x.id === paletteId) ??
    history.value.find((x) => x.id === paletteId);
  if (!source) return;

  const currentHex = source.colors.find((c) => c.role === role)?.hex;
  if (currentHex && currentHex.toLowerCase() === hex.toLowerCase()) return;

  recordWorkspace(`color:${paletteId}:${role}`);
  const map = toColorMap(source);
  map[role] = hex;
  const scene = SCENE_MAP[source.scene] ?? SCENES[0];
  const next: Palette = {
    ...source,
    colors: buildEntries(map),
    a11y: evaluate(map),
    description: describePalette(map, scene, HARMONY_LABEL[source.harmony] ?? '和谐'),
    updatedAt: Date.now(),
  };
  const update = (list: Palette[]) => list.map((x) => (x.id === paletteId ? next : x));
  palettes.value = update(palettes.value);
  favorites.value = update(favorites.value);
  history.value = update(history.value);
  lockMap.value = { ...lockMap.value, [role]: hex };
  persist();
}

/** 保留已锁定的颜色，让其它颜色重新适配。 */
export function regenerateAroundLocks(): void {
  generateNow();
}

/** 工具页/收藏库把方案带回工作台，并同步全部生成设置。 */
export function applyPaletteToStudio(p: Palette): void {
  recordWorkspace('apply');
  const copy = structuredClone(p);
  palettes.value = [copy];
  activeId.value = copy.id;
  const primary = copy.colors.find((c) => c.role === 'primary');
  settings.value = {
    ...settings.value,
    baseColor: primary?.hex ?? settings.value.baseColor,
    scene: copy.scene,
    style: copy.style,
    mood: copy.mood,
    harmony: copy.harmony,
  };
  lockMap.value = {};
  pushHistory(copy);
  persist();
  navigate('/studio');
}

export function setTheme(theme: ThemeMode): void {
  settings.value = { ...settings.value, theme };
  document.documentElement.dataset.theme = theme;
  persist();
}

export function setPreview(mode: PreviewMode): void {
  settings.value = { ...settings.value, preview: mode };
  persist();
}

export function setCvd(type: CvdType): void {
  cvdType.value = type;
}

export const route = signal<string>(normalizePath(location.hash));

function normalizePath(hash: string): string {
  const raw = hash.replace(/^#/, '');
  if (!raw || raw === '/') return '/';
  return raw;
}

export function navigate(path: string): void {
  if (location.hash === `#${path}`) {
    route.value = path;
    return;
  }
  location.hash = path;
}

export function handleHashChange(): void {
  const hash = location.hash;
  const shareMatch = hash.match(/^#\/s\/([A-Za-z0-9_-]+)$/);
  if (shareMatch) {
    const p = decodeShare(shareMatch[1]);
    if (p) {
      recordWorkspace('share');
      palettes.value = [p];
      activeId.value = p.id;
      const primary = p.colors.find((c) => c.role === 'primary');
      settings.value = {
        ...settings.value,
        baseColor: primary?.hex ?? settings.value.baseColor,
        scene: p.scene,
        style: p.style,
        mood: p.mood,
        harmony: p.harmony,
      };
      lockMap.value = {};
      history.value = [p, ...history.value.filter((x) => x.id !== p.id)].slice(0, 30);
      sharedFrom.value = true;
      persist();
      window.history.replaceState(null, '', '#/studio');
      route.value = '/studio';
      toast('已打开朋友分享的配色');
      return;
    }
    toast('分享链接已失效，已回到工作台');
    window.history.replaceState(null, '', '#/studio');
    route.value = '/studio';
    return;
  }
  sharedFrom.value = false;
  route.value = normalizePath(hash);
}

export function init(): void {
  document.documentElement.dataset.theme = settings.value.theme;
  handleHashChange();
  window.addEventListener('hashchange', handleHashChange);
}
