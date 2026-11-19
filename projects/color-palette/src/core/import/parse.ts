import { clamp, hexToHsl, hexToOklch, hslToHex, oklchToHex, rgbToHex } from '../color/convert';
import { deltaE2000 } from '../color/distance';
import { evaluate } from '../palette/metrics';
import { describePalette, buildEntries } from '../palette/generate';
import { ROLES, toColorMap } from '../palette/types';
import type { ColorMap, Palette, Role, HarmonyType, MoodId, SceneId, StyleId } from '../palette/types';
import { hexLabel, HARMONY_LABEL, SCENE_MAP, SCENES } from '../../content/presets';

export interface ParsedColors {
  colors: string[];
  source: 'hex' | 'css' | 'json';
  warnings: string[];
}

const HEX_RE = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;

function normalizeAll(values: string[]): string[] {
  const out: string[] = [];
  for (const value of values) {
    const raw = value.trim();
    if (!/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(raw)) continue;
    let t = raw.replace('#', '');
    if (t.length === 3) t = t.split('').map((c) => c + c).join('');
    const hex = '#' + t.toUpperCase();
    if (!out.includes(hex)) out.push(hex);
  }
  return out;
}

/** 支持 hex 列表、CSS 变量/样式、设计令牌 JSON 三类输入。 */
export function parsePaletteInput(text: string): ParsedColors {
  const raw = String(text ?? '').trim();
  const warnings: string[] = [];
  if (!raw) return { colors: [], source: 'hex', warnings: ['没有可解析的内容'] };

  let source: ParsedColors['source'] = 'hex';
  let values: string[] = [];

  if (raw.startsWith('{') || raw.startsWith('[')) {
    source = 'json';
    try {
      const data = JSON.parse(raw);
      const collect = (node: unknown) => {
        if (typeof node === 'string') {
          values.push(...(node.match(HEX_RE) ?? []));
        } else if (Array.isArray(node)) {
          node.forEach(collect);
        } else if (node && typeof node === 'object') {
          for (const [key, value] of Object.entries(node)) {
            if (/^(color|colour|hex|value)$/i.test(key) && typeof value === 'string') {
              values.push(...(value.match(HEX_RE) ?? []));
            } else {
              collect(value);
            }
          }
        }
      };
      collect(data);
    } catch {
      warnings.push('JSON 解析失败，已尝试按文本提取颜色');
      values.push(...(raw.match(HEX_RE) ?? []));
    }
  } else if (/--[\w-]+\s*:/.test(raw) || /[{}]/.test(raw)) {
    source = 'css';
    values.push(...(raw.match(HEX_RE) ?? []));
  } else {
    values.push(...(raw.match(HEX_RE) ?? []));
  }

  let colors = normalizeAll(values);
  if (colors.length > 24) {
    colors = colors.slice(0, 24);
    warnings.push('颜色超过 24 个，只保留前 24 个');
  }
  if (colors.length === 0) warnings.push('没有识别到 HEX 颜色');
  return { colors, source, warnings };
}

function assignRoles(colors: string[]): ColorMap {
  const infos = colors.map((hex) => {
    const oklch = hexToOklch(hex);
    return { hex, ...oklch };
  });
  const byChroma = [...infos].sort((a, b) => b.c - a.c);
  const byLight = [...infos].sort((a, b) => b.l - a.l);
  const bg = byLight[0]?.hex ?? '#FFFDF9';
  const text = byLight[byLight.length - 1]?.hex ?? '#17171A';
  const chromatic = byChroma.filter((c) => c.c > 0.03 && c.hex !== bg && c.hex !== text);
  const primary = chromatic[0]?.hex ?? byChroma[0]?.hex ?? '#4A6CF7';
  const secondary = chromatic[1]?.hex ?? primary;
  const accent = chromatic[2]?.hex ?? secondary;
  const surface = infos
    .filter((c) => c.hex !== bg && c.l > 0.8)
    .sort((a, b) => a.l - b.l)[0]?.hex;
  return {
    primary,
    secondary,
    accent,
    bg,
    surface: surface ?? (hexToOklch(bg).l > 0.7 ? bg : '#FFFDF9'),
    text,
  };
}

export interface PaletteFromColorsOptions {
  name?: string;
  scene?: SceneId;
  style?: StyleId | 'none';
  mood?: MoodId | 'none';
  harmony?: HarmonyType;
}

export function paletteFromColors(colors: string[], options: PaletteFromColorsOptions = {}): Palette | null {
  const normalized = normalizeAll(colors).slice(0, 6);
  if (normalized.length === 0) return null;
  const map = assignRoles(normalized);
  const scene = options.scene ?? 'outfit';
  const harmony = options.harmony ?? 'auto';
  const now = Date.now();
  return {
    id: `p_import_${now.toString(36)}`,
    name: options.name ?? '导入的配色',
    customName: '',
    seed: 0,
    harmony,
    scene,
    style: options.style ?? 'none',
    mood: options.mood ?? 'none',
    colors: buildEntries(map),
    a11y: evaluate(map),
    description: describePalette(map, SCENE_MAP[scene] ?? SCENES[0], HARMONY_LABEL[harmony] ?? '和谐'),
    createdAt: now,
    updatedAt: now,
  };
}

/** 色值距离大于阈值才算不同，供取色/去重使用。 */
export function isDistinct(a: string, b: string, threshold = 6): boolean {
  return deltaE2000(a, b) >= threshold;
}

/** 把任意颜色吸附到可读的 HSL 值，供编辑器显示。 */
export function safeHsl(hex: string) {
  const hsl = hexToHsl(hex);
  return {
    h: clamp(Math.round(hsl.h), 0, 359),
    s: clamp(Math.round(hsl.s), 0, 100),
    l: clamp(Math.round(hsl.l), 0, 100),
  };
}

/** 供编辑器使用：HSL → HEX，保留边界。 */
export function hslHex(h: number, s: number, l: number): string {
  return hslToHex({ h: ((h % 360) + 360) % 360, s: clamp(s, 0, 100), l: clamp(l, 0, 100) });
}

/** RGB 输入转 HEX，非法返回 null。 */
export function rgbInputToHex(value: string): string | null {
  const m = value.match(/^(\d{1,3})\s*[,，\s]\s*(\d{1,3})\s*[,，\s]\s*(\d{1,3})$/);
  if (!m) return null;
  const nums = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (nums.some((n) => n < 0 || n > 255)) return null;
  return rgbToHex({ r: nums[0], g: nums[1], b: nums[2] });
}

export { ROLES, toColorMap, hexLabel, oklchToHex };
