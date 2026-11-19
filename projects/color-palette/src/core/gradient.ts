import { contrastRatio } from './color/contrast';
import { hexToRgb, hslToHex, mix } from './color/convert';
import type { Palette } from './palette/types';

export type GradientType = 'linear' | 'radial' | 'conic';

export interface GradientStop {
  id: string;
  hex: string;
  pos: number;
}

export interface GradientSpec {
  type: GradientType;
  angle: number;
  cx?: number;
  cy?: number;
  stops: GradientStop[];
}

export function gradientStopsFromPalette(p: Palette): GradientStop[] {
  const map = Object.fromEntries(p.colors.map((c) => [c.role, c.hex]));
  return [
    { id: 'a', hex: map.primary ?? '#4A6CF7', pos: 0 },
    { id: 'b', hex: map.accent ?? '#E8A33D', pos: 50 },
    { id: 'c', hex: map.secondary ?? '#2FA36B', pos: 100 },
  ];
}

const clampPct = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));

export function normalizeGradient(spec: GradientSpec): GradientSpec {
  const stops = [...spec.stops]
    .map((stop) => ({ ...stop, pos: clampPct(stop.pos) }))
    .sort((a, b) => a.pos - b.pos);
  return {
    ...spec,
    angle: ((Math.round(spec.angle) % 360) + 360) % 360,
    cx: clampPct(spec.cx ?? 50),
    cy: clampPct(spec.cy ?? 50),
    stops: stops.length >= 2 ? stops : gradientStopsFromPaletteFallback(),
  };
}

function gradientStopsFromPaletteFallback(): GradientStop[] {
  return [
    { id: 'a', hex: '#4A6CF7', pos: 0 },
    { id: 'b', hex: '#E8A33D', pos: 50 },
    { id: 'c', hex: '#2FA36B', pos: 100 },
  ];
}

export function buildGradientCss(spec: GradientSpec): string {
  const s = normalizeGradient(spec);
  const stops = s.stops.map((stop) => `${stop.hex} ${stop.pos}%`).join(', ');
  const at = `${s.cx}% ${s.cy}%`;
  if (s.type === 'radial') return `radial-gradient(circle at ${at}, ${stops})`;
  if (s.type === 'conic') return `conic-gradient(from ${s.angle}deg at ${at}, ${stops})`;
  return `linear-gradient(${s.angle}deg, ${stops})`;
}

export function gradientTextSuggestion(spec: GradientSpec): { color: string; min: number } {
  const white = '#FFFFFF';
  const dark = '#17171A';
  let whiteMin = 21;
  let darkMin = 21;
  for (const stop of normalizeGradient(spec).stops) {
    whiteMin = Math.min(whiteMin, contrastRatio(white, stop.hex));
    darkMin = Math.min(darkMin, contrastRatio(dark, stop.hex));
  }
  return darkMin >= whiteMin ? { color: dark, min: darkMin } : { color: white, min: whiteMin };
}

/** CSS 线性渐变的渐变线：方向自「向上」顺时针，长度覆盖矩形投影。 */
export function linearGradientLine(
  w: number,
  h: number,
  angle: number,
): { x0: number; y0: number; x1: number; y1: number } {
  const rad = (angle * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  const len = Math.abs(w * dx) + Math.abs(h * dy);
  return {
    x0: w / 2 - (dx * len) / 2,
    y0: h / 2 - (dy * len) / 2,
    x1: w / 2 + (dx * len) / 2,
    y1: h / 2 + (dy * len) / 2,
  };
}

/** CSS circle 默认 farthest-corner 半径。 */
export function radialGradientRadius(w: number, h: number, cx: number, cy: number): number {
  const px = (cx / 100) * w;
  const py = (cy / 100) * h;
  return Math.max(
    Math.hypot(px, py),
    Math.hypot(w - px, py),
    Math.hypot(px, h - py),
    Math.hypot(w - px, h - py),
  );
}

/** canvas createConicGradient 从 +x 轴起算，CSS 从正上方起算。 */
export function conicStartRad(angle: number): number {
  return ((angle - 90) * Math.PI) / 180;
}

/** 色标序列在 pos 处的插值颜色（sRGB，与浏览器渐变一致）。 */
export function stopColorAt(stops: GradientStop[], pos: number): string {
  const sorted = [...stops].sort((a, b) => a.pos - b.pos);
  if (sorted.length === 0) return '#000000';
  if (pos <= sorted[0].pos) return sorted[0].hex;
  const last = sorted[sorted.length - 1];
  if (pos >= last.pos) return last.hex;
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (pos >= a.pos && pos <= b.pos) {
      const span = b.pos - a.pos;
      return mix(a.hex, b.hex, span === 0 ? 0 : (pos - a.pos) / span);
    }
  }
  return last.hex;
}

export function reverseStops(stops: GradientStop[]): GradientStop[] {
  return stops.map((stop) => ({ ...stop, pos: 100 - stop.pos }));
}

export interface GradientPreset {
  id: string;
  name: string;
  spec: GradientSpec;
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  {
    id: 'sunset',
    name: '日落',
    spec: {
      type: 'linear',
      angle: 160,
      stops: [
        { id: 'p0', hex: '#FF9A5A', pos: 0 },
        { id: 'p1', hex: '#E85D75', pos: 52 },
        { id: 'p2', hex: '#5B4B8A', pos: 100 },
      ],
    },
  },
  {
    id: 'sea',
    name: '海面',
    spec: {
      type: 'linear',
      angle: 180,
      stops: [
        { id: 'p0', hex: '#9AD1D4', pos: 0 },
        { id: 'p1', hex: '#1E88E5', pos: 55 },
        { id: 'p2', hex: '#0F766E', pos: 100 },
      ],
    },
  },
  {
    id: 'matcha',
    name: '抹茶',
    spec: {
      type: 'radial',
      angle: 0,
      cx: 50,
      cy: 38,
      stops: [
        { id: 'p0', hex: '#F6F1E7', pos: 0 },
        { id: 'p1', hex: '#9DB87C', pos: 55 },
        { id: 'p2', hex: '#3F6B42', pos: 100 },
      ],
    },
  },
  {
    id: 'neon',
    name: '霓虹',
    spec: {
      type: 'conic',
      angle: 0,
      stops: [
        { id: 'p0', hex: '#D54A7A', pos: 0 },
        { id: 'p1', hex: '#4A6CF7', pos: 25 },
        { id: 'p2', hex: '#2FA36B', pos: 50 },
        { id: 'p3', hex: '#E8A33D', pos: 75 },
        { id: 'p4', hex: '#D54A7A', pos: 100 },
      ],
    },
  },
  {
    id: 'mist',
    name: '晨雾',
    spec: {
      type: 'linear',
      angle: 120,
      stops: [
        { id: 'p0', hex: '#F6F1F1', pos: 0 },
        { id: 'p1', hex: '#C9CED6', pos: 48 },
        { id: 'p2', hex: '#8E99A8', pos: 100 },
      ],
    },
  },
  {
    id: 'molten',
    name: '熔金',
    spec: {
      type: 'linear',
      angle: 45,
      stops: [
        { id: 'p0', hex: '#17171A', pos: 0 },
        { id: 'p1', hex: '#7A4A1F', pos: 40 },
        { id: 'p2', hex: '#E8A33D', pos: 78 },
        { id: 'p3', hex: '#F6D365', pos: 100 },
      ],
    },
  },
];

export function randomGradientSpec(rand: () => number = Math.random): GradientSpec {
  const types: GradientType[] = ['linear', 'radial', 'conic'];
  const type = types[Math.floor(rand() * types.length)];
  const count = 2 + Math.floor(rand() * 3);
  const baseHue = Math.floor(rand() * 360);
  const spread = 40 + Math.floor(rand() * 90);
  const stops: GradientStop[] = [];
  for (let i = 0; i < count; i += 1) {
    stops.push({
      id: `r${i}`,
      hex: hslToHex({
        h: (baseHue + i * spread) % 360,
        s: 55 + Math.floor(rand() * 30),
        l: 42 + Math.floor(rand() * 26),
      }),
      pos: Math.round((i / (count - 1)) * 100),
    });
  }
  if (type === 'conic') stops.push({ ...stops[0], id: `r${count}`, pos: 100 });
  return {
    type,
    angle: Math.floor(rand() * 360),
    cx: 30 + Math.floor(rand() * 41),
    cy: 30 + Math.floor(rand() * 41),
    stops,
  };
}

/** 供锥形导出回退使用的 RGB 查找表。 */
export function conicLut(stops: GradientStop[], size = 1024): Uint8ClampedArray {
  const lut = new Uint8ClampedArray(size * 3);
  for (let i = 0; i < size; i += 1) {
    const rgb = hexToRgb(stopColorAt(stops, (i / (size - 1)) * 100));
    lut[i * 3] = rgb.r;
    lut[i * 3 + 1] = rgb.g;
    lut[i * 3 + 2] = rgb.b;
  }
  return lut;
}