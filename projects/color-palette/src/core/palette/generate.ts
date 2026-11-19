import { contrastRatio } from '../color/contrast';
import { clamp, hexToOklch, oklchToHex } from '../color/convert';
import { deltaE2000 } from '../color/distance';
import {
  HARMONY_LABEL,
  MOOD_MAP,
  SCENE_MAP,
  SCENES,
  STYLE_MAP,
  hexLabel,
} from '../../content/presets';
import type { SceneDef } from '../../content/presets';
import { harmonyHues, resolveHarmony } from './harmony';
import { buildDarkPalette, cvdSeparation, ensureCvdSafe } from './pair';
import { evaluate } from './metrics';
import { ROLES, toColorMap } from './types';
import type {
  ColorEntry,
  ColorMap,
  HarmonyType,
  MoodId,
  Palette,
  Role,
  SceneId,
  StyleId,
} from './types';

export interface GenerateOptions {
  baseHex: string;
  scene: SceneId;
  style: StyleId | 'none';
  mood: MoodId | 'none';
  harmony: HarmonyType;
  locks?: Partial<Record<Role, string>>;
  strict?: boolean;
  pair?: boolean;
  cvdSafe?: boolean;
  seed?: number;
  count?: number;
  now?: number;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildEntries(map: ColorMap): ColorEntry[] {
  return ROLES.map((r) => hexLabel(r.id, map[r.id], r.ratio));
}

function pick(
  rand: () => number,
  hue: number,
  lMin: number,
  lMax: number,
  cBase: number,
  cFactor: number,
  cMin: number,
  cMax: number,
  jitter = 10,
): string {
  const l = lMin + rand() * (lMax - lMin);
  const c = clamp(cBase * cFactor * (0.88 + rand() * 0.24), cMin, cMax);
  const h = hue + (rand() - 0.5) * jitter;
  return oklchToHex({ l, c, h });
}

/** 找出与目标对比度最接近原色（ΔE2000 最小）的颜色，保持色相。 */
export function ensureContrast(hex: string, bg: string, target: number): string {
  if (contrastRatio(hex, bg) >= target) return hex;
  const base = hexToOklch(hex);
  let best = hex;
  let bestDelta = Number.POSITIVE_INFINITY;

  for (let l = 0.02; l <= 0.98; l += 0.01) {
    for (const scale of [1, 0.75, 0.5, 0.25, 0]) {
      const cand = oklchToHex({ l, c: base.c * scale, h: base.h });
      if (contrastRatio(cand, bg) < target) continue;
      const d = deltaE2000(hex, cand);
      if (d < bestDelta) {
        bestDelta = d;
        best = cand;
      }
    }
  }
  return best;
}

function pushApart(
  hex: string,
  others: string[],
  minDelta: number,
  rand: () => number,
): string {
  let cur = hex;
  for (let i = 0; i < 18; i++) {
    if (others.every((o) => deltaE2000(cur, o) >= minDelta)) return cur;
    const { l, c, h } = hexToOklch(cur);
    const dir = rand() > 0.5 ? 1 : -1;
    cur = oklchToHex({
      l: clamp(l + dir * 0.03, 0.24, 0.84),
      c: clamp(c * 1.02, 0, 0.3),
      h: h + (rand() - 0.5) * 10,
    });
  }
  return cur;
}

export function describePalette(map: ColorMap, scene: SceneDef, harmonyLabel: string): string {
  const a = evaluate(map);
  const primary = hexLabel('primary', map.primary, 38);
  const secondary = hexLabel('secondary', map.secondary, 22);
  const accent = hexLabel('accent', map.accent, 8);
  return `${scene.label}场景的${harmonyLabel}方案：${primary.name}做主色，${secondary.name}承接辅助，${accent.name}用来点缀，文字与背景 ${a.textOnBg.toFixed(2)}:1，${scene.tip}`;
}

function buildPalette(
  o: GenerateOptions,
  seed: number,
  index: number,
  hueBump: number,
): Palette {
  const rand = mulberry32(seed);
  const base = hexToOklch(o.baseHex);
  const scene = SCENE_MAP[o.scene] ?? SCENES[0];
  const st = STYLE_MAP[o.style] ?? STYLE_MAP.none;
  const md = MOOD_MAP[o.mood] ?? MOOD_MAP.none;
  const harmony = resolveHarmony(o.harmony, index);

  const hueBase = base.h + st.hue + md.hue + scene.hueShift + hueBump;
  const chromaBase = clamp(base.c * st.chroma * md.chroma * scene.chroma, 0.03, 0.28);
  const [h1, h2, h3] = harmonyHues(hueBase, harmony);

  const bg = oklchToHex({
    l: 0.965 - rand() * 0.01,
    c: 0.004 + rand() * 0.006,
    h: scene.neutralHue,
  });
  const surface = oklchToHex({
    l: 0.99 - rand() * 0.006,
    c: 0.002,
    h: scene.neutralHue,
  });
  let text = oklchToHex({
    l: 0.16 + rand() * 0.05,
    c: 0.008 + rand() * 0.01,
    h: scene.neutralHue,
  });

  const locks = o.locks ?? {};
  let primary = pick(rand, h1, 0.4, 0.56, chromaBase, 1, 0.09, 0.2);
  let secondary = pick(rand, h2, 0.6, 0.72, chromaBase, 0.62, 0.045, 0.14);
  let accent = pick(rand, h3, 0.5, 0.64, chromaBase, 1.15, 0.12, 0.25);

  if (!locks.primary) primary = ensureContrast(primary, bg, 3);
  if (!locks.secondary) secondary = ensureContrast(secondary, bg, o.strict ? 3 : 2.1);
  if (!locks.accent) accent = ensureContrast(accent, bg, o.strict ? 3 : 2.1);
  if (!locks.text) text = ensureContrast(text, bg, 4.5);

  if (!locks.secondary) secondary = pushApart(secondary, [primary], 12, rand);
  if (!locks.accent) accent = pushApart(accent, [primary, secondary], 14, rand);
  if (!locks.secondary) secondary = ensureContrast(secondary, bg, o.strict ? 3 : 2.1);
  if (!locks.accent) accent = ensureContrast(accent, bg, o.strict ? 3 : 2.1);
  if (!locks.text) text = ensureContrast(text, bg, 4.5);

  let map: ColorMap = {
    primary: locks.primary ?? primary,
    secondary: locks.secondary ?? secondary,
    accent: locks.accent ?? accent,
    bg: locks.bg ?? bg,
    surface: locks.surface ?? surface,
    text: locks.text ?? text,
  };

  let cvd: Palette['cvd'];
  if (o.cvdSafe) {
    const adjusted = ensureCvdSafe(map);
    map = adjusted.map;
    cvd = adjusted.report;
  }

  const darkMap = o.pair ? buildDarkPalette(map) : undefined;

  const nameParts = [HARMONY_LABEL[harmony] ?? '和谐', scene.label];
  if (o.style !== 'none') nameParts.push(STYLE_MAP[o.style]?.label ?? '');
  if (o.mood !== 'none') nameParts.push(MOOD_MAP[o.mood]?.label ?? '');

  const now = o.now ?? Date.now();
  return {
    id: `p_${seed.toString(36)}_${index}`,
    name: nameParts.filter(Boolean).join(' · '),
    customName: '',
    seed,
    harmony,
    scene: o.scene,
    style: o.style,
    mood: o.mood,
    colors: buildEntries(map),
    a11y: evaluate(map),
    description: describePalette(map, scene, HARMONY_LABEL[harmony] ?? '和谐'),
    dark: darkMap ? buildEntries(darkMap) : undefined,
    darkA11y: darkMap ? evaluate(darkMap) : undefined,
    cvd,
    createdAt: now,
    updatedAt: now,
  };
}

export function generatePalettes(o: GenerateOptions): Palette[] {
  const seed = Math.floor(o.seed ?? Math.random() * 1_000_000_000);
  const count = o.count ?? 3;
  const out: Palette[] = [];

  for (let i = 0; i < count; i++) {
    let cand = buildPalette(o, seed + i * 7919, i, 0);
    for (let k = 0; k < 5; k++) {
      const clash = out.some(
        (p) =>
          deltaE2000(toColorMap(p).primary, toColorMap(cand).primary) < 9,
      );
      if (!clash) break;
      cand = buildPalette(o, seed + i * 7919 + (k + 1) * 211, i, (k + 1) * 16);
    }
    out.push(cand);
  }
  return out;
}

/** 以当前背景为基准修复对比度，返回新方案。 */
export function repairPalette(p: Palette): Palette {
  const map = toColorMap(p);
  const next: ColorMap = { ...map };
  for (const role of ['text', 'primary', 'secondary', 'accent'] as Role[]) {
    const target = role === 'text' ? 4.5 : 3;
    if (contrastRatio(next[role], next.bg) < target) {
      next[role] = ensureContrast(next[role], next.bg, target);
    }
  }
  const scene = SCENE_MAP[p.scene] ?? SCENES[0];
  const darkMap = p.dark ? buildDarkPalette(next) : undefined;
  return {
    ...p,
    colors: buildEntries(next),
    a11y: evaluate(next),
    dark: darkMap ? buildEntries(darkMap) : undefined,
    darkA11y: darkMap ? evaluate(darkMap) : undefined,
    cvd: p.cvd ? cvdSeparation(next) : undefined,
    description: describePalette(next, scene, HARMONY_LABEL[p.harmony] ?? '和谐'),
    updatedAt: Date.now(),
  };
}

/** 预览用：把浅色方案映射成深色版本。 */
export function paletteForTheme(p: Palette, theme: 'light' | 'dark'): ColorMap {
  const map = toColorMap(p);
  if (theme === 'light') return map;

  if (p.dark) {
    const dark = {} as ColorMap;
    p.dark.forEach((c) => { dark[c.role] = c.hex; });
    return dark;
  }

  const shift = (hex: string, dl: number, dcScale = 1, floor = 0.2, ceil = 0.92): string => {
    const c = hexToOklch(hex);
    return oklchToHex({
      l: clamp(c.l + dl, floor, ceil),
      c: c.c * dcScale,
      h: c.h,
    });
  };

  return {
    bg: oklchToHex({ l: 0.135, c: 0.012, h: hexToOklch(map.bg).h }),
    surface: oklchToHex({ l: 0.195, c: 0.012, h: hexToOklch(map.surface).h }),
    text: oklchToHex({ l: 0.93, c: 0.01, h: hexToOklch(map.text).h }),
    primary: shift(map.primary, 0.18, 1.02, 0.5, 0.82),
    secondary: shift(map.secondary, 0.1, 0.95, 0.5, 0.82),
    accent: shift(map.accent, 0.12, 1.02, 0.5, 0.82),
  };
}
