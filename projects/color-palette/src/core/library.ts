import type { Palette } from './palette/types';
import type { Settings } from './storage';
import { buildEntries, describePalette } from './palette/generate';
import { evaluate } from './palette/metrics';
import { ROLES, toColorMap } from './palette/types';
import type { ColorMap } from './palette/types';
import { HARMONY_LABEL, SCENE_MAP, SCENES } from '../content/presets';
import { paletteFromColors } from './import/parse';

export interface LibraryBackup {
  kind: 'colorlife-library';
  schemaVersion: 1;
  exportedAt: string;
  favorites: Palette[];
  history: Palette[];
  settings: Settings;
}

export type ParseLibraryResult =
  | { ok: true; data: LibraryBackup; skipped: number }
  | { ok: false; error: string };

export function paletteSignature(p: Palette): string {
  return p.colors.map((c) => c.hex).join(',');
}

function sanitizePalette(value: unknown): Palette | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Record<string, unknown>;
  const rawColors = Array.isArray(data.colors) ? data.colors : [];
  const hexes: string[] = [];
  const byRole = new Map<string, string>();
  for (const item of rawColors) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const hex = record.hex;
    if (typeof hex !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(hex)) continue;
    hexes.push(hex.toUpperCase());
    if (typeof record.role === 'string') byRole.set(record.role, hex.toUpperCase());
  }
  if (hexes.length === 0) return null;

  const scene = typeof data.scene === 'string' ? (data.scene as Palette['scene']) : 'outfit';
  const safeScene = SCENE_MAP[scene] ? scene : 'outfit';
  const harmony = typeof data.harmony === 'string' ? (data.harmony as Palette['harmony']) : 'auto';
  const style = typeof data.style === 'string' ? (data.style as Palette['style']) : 'none';
  const mood = typeof data.mood === 'string' ? (data.mood as Palette['mood']) : 'none';

  // 完整六角色优先按角色还原，保证顺序与色值不变
  const complete = ROLES.every((role) => byRole.has(role.id));
  if (complete) {
    const map = {} as ColorMap;
    for (const role of ROLES) map[role.id] = byRole.get(role.id) as string;
    return {
      id: typeof data.id === 'string' ? data.id : `p_import_${Date.now().toString(36)}`,
      name: typeof data.name === 'string' ? data.name : '导入的方案',
      customName: typeof data.customName === 'string' ? data.customName : '',
      seed: typeof data.seed === 'number' ? data.seed : 0,
      harmony,
      scene: safeScene,
      style,
      mood,
      colors: buildEntries(map),
      a11y: evaluate(map),
      description: describePalette(map, SCENE_MAP[safeScene] ?? SCENES[0], HARMONY_LABEL[harmony] ?? '和谐'),
      createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
      updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
    };
  }

  const base = paletteFromColors(hexes.slice(0, 6), {
    name: typeof data.name === 'string' ? data.name : '导入的方案',
    scene: safeScene,
    style,
    mood,
    harmony,
  });
  if (!base) return null;
  return {
    ...base,
    id: typeof data.id === 'string' ? data.id : base.id,
    customName: typeof data.customName === 'string' ? data.customName : '',
  };
}

export function createLibraryBackup(
  favorites: Palette[],
  history: Palette[],
  settings: Settings,
): LibraryBackup {
  return {
    kind: 'colorlife-library',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    favorites,
    history,
    settings,
  };
}

export function parseLibraryBackup(text: string): ParseLibraryResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: '不是合法的 JSON 文件' };
  }
  if (!data || typeof data !== 'object') return { ok: false, error: '文件内容为空' };
  const record = data as Record<string, unknown>;
  if (record.kind !== 'colorlife-library' || record.schemaVersion !== 1) {
    return { ok: false, error: '不是配色工坊的方案库备份' };
  }
  const favoritesRaw = Array.isArray(record.favorites) ? record.favorites : [];
  const historyRaw = Array.isArray(record.history) ? record.history : [];
  if (favoritesRaw.length > 200 || historyRaw.length > 200) {
    return { ok: false, error: '备份条目过多（上限 200）' };
  }

  let skipped = 0;
  const favorites: Palette[] = [];
  const history: Palette[] = [];
  for (const item of favoritesRaw) {
    const p = sanitizePalette(item);
    if (p) favorites.push(p);
    else skipped += 1;
  }
  for (const item of historyRaw) {
    const p = sanitizePalette(item);
    if (p) history.push(p);
    else skipped += 1;
  }
  if (favorites.length === 0 && history.length === 0 && skipped === 0) {
    return { ok: false, error: '备份里没有方案' };
  }

  const settings = record.settings && typeof record.settings === 'object'
    ? (record.settings as Settings)
    : ({} as Settings);

  return {
    ok: true,
    skipped,
    data: {
      kind: 'colorlife-library',
      schemaVersion: 1,
      exportedAt: typeof record.exportedAt === 'string' ? record.exportedAt : '',
      favorites,
      history,
      settings,
    },
  };
}

/** 合并方案库：按颜色签名去重，已有条目优先。 */
export function mergePalettes(base: Palette[], incoming: Palette[]): Palette[] {
  const seen = new Set(base.map(paletteSignature));
  const out = [...base];
  for (const palette of incoming) {
    const signature = paletteSignature(palette);
    if (seen.has(signature)) continue;
    seen.add(signature);
    out.push(palette);
  }
  return out;
}
