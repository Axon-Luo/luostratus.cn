import type { HarmonyType, MoodId, Palette, SceneId, StyleId } from './palette/types';
import type { ColorFormat } from '../content/presets';

export type ThemeMode = 'light' | 'dark';
export type PreviewMode = 'phone' | 'web' | 'poster' | 'wallpaper' | 'outfit';
export type ShareFormat = '3:4' | '9:16' | '16:9';

export interface Settings {
  baseColor: string;
  format: ColorFormat;
  scene: SceneId;
  style: StyleId | 'none';
  mood: MoodId | 'none';
  harmony: HarmonyType;
  strict: boolean;
  theme: ThemeMode;
  preview: PreviewMode;
  pairMode: boolean;
  cvdSafe: boolean;
  shareFormat: ShareFormat;
}

export interface DailyState {
  lastDate: string;
  streak: number;
  archive: Array<{ date: string; seed: number }>;
}

export interface ChallengeState {
  best: number;
  lastDate: string;
  history: Array<{ date: string; score: number }>;
}

/** 工具页的草稿输入，按工具 id 存放，避免每加一个工具就改 schema。 */
export type ToolDrafts = Record<string, unknown>;

export interface Persisted {
  version: 2;
  favorites: Palette[];
  history: Palette[];
  settings: Settings;
  daily: DailyState;
  challenge: ChallengeState;
  tools: ToolDrafts;
}

export const DEFAULT_SETTINGS: Settings = {
  baseColor: '#4A6CF7',
  format: 'HEX',
  scene: 'outfit',
  style: 'none',
  mood: 'none',
  harmony: 'auto',
  strict: false,
  theme: 'dark',
  preview: 'phone',
  pairMode: false,
  cvdSafe: false,
  shareFormat: '3:4',
};

export const DEFAULT_DAILY: DailyState = { lastDate: '', streak: 0, archive: [] };
export const DEFAULT_CHALLENGE: ChallengeState = { best: 0, lastDate: '', history: [] };

const KEY = 'cf.v2';
const LEGACY_KEY = 'cf.v1';

function getStorage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export function defaultPersisted(): Persisted {
  return {
    version: 2,
    favorites: [],
    history: [],
    settings: { ...DEFAULT_SETTINGS },
    daily: { ...DEFAULT_DAILY, archive: [] },
    challenge: { ...DEFAULT_CHALLENGE, history: [] },
    tools: {},
  };
}

function normalize(input: unknown): Persisted {
  const fallback = defaultPersisted();
  if (!input || typeof input !== 'object') return fallback;
  const data = input as Record<string, unknown>;
  const settings = (data.settings ?? {}) as Partial<Settings>;
  const daily = (data.daily ?? {}) as Partial<DailyState>;
  const challenge = (data.challenge ?? {}) as Partial<ChallengeState>;
  return {
    version: 2,
    favorites: Array.isArray(data.favorites) ? (data.favorites as Palette[]) : [],
    history: Array.isArray(data.history) ? (data.history as Palette[]) : [],
    settings: { ...DEFAULT_SETTINGS, ...settings },
    daily: {
      lastDate: typeof daily.lastDate === 'string' ? daily.lastDate : '',
      streak: typeof daily.streak === 'number' ? daily.streak : 0,
      archive: Array.isArray(daily.archive) ? daily.archive : [],
    },
    challenge: {
      best: typeof challenge.best === 'number' ? challenge.best : 0,
      lastDate: typeof challenge.lastDate === 'string' ? challenge.lastDate : '',
      history: Array.isArray(challenge.history) ? challenge.history : [],
    },
    tools: data.tools && typeof data.tools === 'object' ? (data.tools as ToolDrafts) : {},
  };
}

export function loadPersisted(storage: Storage | null = getStorage()): Persisted {
  if (!storage) return defaultPersisted();
  try {
    const raw = storage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw) as Record<string, unknown>;
      if (data.version === 2) return normalize(data);
    }
  } catch {
    /* 继续尝试旧版本 */
  }

  // v1 → v2：只读迁移，不删除旧数据，便于回滚
  try {
    const legacy = storage.getItem(LEGACY_KEY);
    if (legacy) {
      const data = JSON.parse(legacy) as Record<string, unknown>;
      if (data.version === 1) return normalize(data);
    }
  } catch {
    /* 回退默认值 */
  }

  return defaultPersisted();
}

export function savePersisted(data: Persisted, storage: Storage | null = getStorage()): boolean {
  if (!storage) return false;
  try {
    storage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function clearPersisted(storage: Storage | null = getStorage()): void {
  try {
    storage?.removeItem(KEY);
    storage?.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
}
