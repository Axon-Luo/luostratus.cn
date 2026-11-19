import { evaluate } from './palette/metrics';
import { ROLES } from './palette/types';
import type { ColorMap, HarmonyType, MoodId, Palette, Role, SceneId, StyleId } from './palette/types';
import { HARMONY_LABEL, SCENES, hexLabel } from '../content/presets';

interface SharePayload {
  v: 1 | 2;
  n: string;
  s: string;
  st: string;
  m: string;
  h: string;
  c: Array<[string, string]>;
  d?: Array<[string, string]>;
}

function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(token: string): string {
  let s = token.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function encodeShare(p: Palette): string {
  const payload: SharePayload = {
    v: 2,
    n: p.customName?.trim() || p.name,
    s: p.scene,
    st: p.style,
    m: p.mood,
    h: p.harmony,
    c: p.colors.map((c) => [c.role, c.hex] as [string, string]),
    d: p.dark?.map((c) => [c.role, c.hex] as [string, string]),
  };
  return toBase64Url(JSON.stringify(payload));
}

export function decodeShare(token: string): Palette | null {
  if (!token) return null;
  try {
    const raw = JSON.parse(fromBase64Url(token)) as SharePayload;
    if (!raw || (raw.v !== 1 && raw.v !== 2) || !Array.isArray(raw.c) || raw.c.length < 3) return null;

    const map: Partial<ColorMap> = {};
    for (const pair of raw.c) {
      const role = pair[0] as Role;
      const hex = String(pair[1] ?? '');
      if (!ROLES.some((r) => r.id === role)) continue;
      if (!/^#[0-9a-fA-F]{6}$/.test(hex)) continue;
      map[role] = hex.toUpperCase();
    }
    for (const r of ROLES) {
      if (!map[r.id]) return null;
    }
    const colors = ROLES.map((r) => hexLabel(r.id, map[r.id] as string, r.ratio));
    const full = map as ColorMap;

    let darkColors: Palette['dark'];
    let darkA11y: Palette['darkA11y'];
    if (Array.isArray(raw.d) && raw.d.length >= 3) {
      const darkMap: Partial<ColorMap> = {};
      for (const pair of raw.d) {
        const role = pair[0] as Role;
        const hex = String(pair[1] ?? '');
        if (!ROLES.some((r) => r.id === role)) continue;
        if (!/^#[0-9a-fA-F]{6}$/.test(hex)) continue;
        darkMap[role] = hex.toUpperCase();
      }
      if (ROLES.every((r) => darkMap[r.id])) {
        darkColors = ROLES.map((r) => hexLabel(r.id, darkMap[r.id] as string, r.ratio));
        darkA11y = evaluate(darkMap as ColorMap);
      }
    }
    const scene = (raw.s || 'outfit') as SceneId;
    const sceneLabel = SCENES.find((s) => s.id === scene)?.label ?? '生活';
    const name = raw.n?.trim() || '分享的配色';
    const harmony = (raw.h || 'analogous') as HarmonyType;

    return {
      id: `p_s_${token.slice(0, 8)}`,
      name,
      customName: raw.n?.trim() ?? '',
      seed: 0,
      harmony,
      scene,
      style: (raw.st || 'none') as StyleId | 'none',
      mood: (raw.m || 'none') as MoodId | 'none',
      colors,
      a11y: evaluate(full),
      dark: darkColors,
      darkA11y,
      description: `来自朋友的${sceneLabel}配色（${HARMONY_LABEL[harmony] ?? '和谐'}），点击「重新生成」可以基于主色继续探索`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

export function shareUrl(p: Palette): string {
  const base = `${location.origin}${location.pathname}`;
  return `${base}#/s/${encodeShare(p)}`;
}
