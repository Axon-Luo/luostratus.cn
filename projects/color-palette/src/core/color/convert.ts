/** 颜色表示与转换：sRGB / HSL / OKLab / OKLCH。内部计算以 OKLab 为准。 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface OKLab {
  L: number;
  a: number;
  b: number;
}

export interface OKLCH {
  l: number;
  c: number;
  h: number;
}

export const clamp = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v));

export const round = (v: number, digits = 0): number => {
  const p = 10 ** digits;
  return Math.round(v * p) / p;
};

const HEX6 = /^[0-9a-fA-F]{6}$/;

export function hexToRgb(hex: string): RGB {
  if (typeof hex !== 'string') return { r: 0, g: 0, b: 0 };
  let t = hex.trim().replace(/^#/, '');
  if (t.length === 3 && /^[0-9a-fA-F]{3}$/.test(t)) {
    t = t
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (!HEX6.test(t)) return { r: 0, g: 0, b: 0 };
  const n = parseInt(t, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex(c: RGB): string {
  const part = (v: number) =>
    clamp(Math.round(Number.isFinite(v) ? v : 0), 0, 255)
      .toString(16)
      .padStart(2, '0');
  return ('#' + part(c.r) + part(c.g) + part(c.b)).toUpperCase();
}

export function hslToRgb(hsl: HSL): RGB {
  const h = ((hsl.h % 360) + 360) % 360;
  const s = clamp(hsl.s, 0, 100) / 100;
  const l = clamp(hsl.l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

export function rgbToHsl(c: RGB): HSL {
  const r = c.r / 255;
  const g = c.g / 255;
  const b = c.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h: round(h, 2), s: round(s * 100, 2), l: round(l * 100, 2) };
}

export function hexToHsl(hex: string): HSL {
  return rgbToHsl(hexToRgb(hex));
}

export function hslToHex(hsl: HSL): string {
  return rgbToHex(hslToRgb(hsl));
}

function srgbToLinear(v: number): number {
  const x = v / 255;
  return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

function linearToSrgb(v: number): number {
  const x = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  return clamp(x * 255, 0, 255);
}

export function rgbToOklab(c: RGB): OKLab {
  const r = srgbToLinear(c.r);
  const g = srgbToLinear(c.g);
  const b = srgbToLinear(c.b);

  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l3 = Math.cbrt(l);
  const m3 = Math.cbrt(m);
  const s3 = Math.cbrt(s);

  return {
    L: 0.2104542553 * l3 + 0.793617785 * m3 - 0.0040720468 * s3,
    a: 1.9779984951 * l3 - 2.428592205 * m3 + 0.4505937099 * s3,
    b: 0.0259040371 * l3 + 0.7827717662 * m3 - 0.808675766 * s3,
  };
}

export function oklabToLinear(c: OKLab): RGB {
  const l3 = c.L + 0.3963377774 * c.a + 0.2158037573 * c.b;
  const m3 = c.L - 0.1055613458 * c.a - 0.0638541728 * c.b;
  const s3 = c.L - 0.0894841775 * c.a - 1.291485548 * c.b;

  const l = l3 * l3 * l3;
  const m = m3 * m3 * m3;
  const s = s3 * s3 * s3;

  return {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  };
}

/** OKLCH → RGB，超出 sRGB 色域时保持 L 与 h，按比例收缩彩度。 */
export function oklchToRgb(c: OKLCH): RGB {
  const l = clamp(c.l, 0, 1);
  const h = ((c.h % 360) + 360) % 360;
  const rad = (h * Math.PI) / 180;
  let chroma = Math.max(0, c.c);
  for (let i = 0; i < 32; i++) {
    const lin = oklabToLinear({
      L: l,
      a: chroma * Math.cos(rad),
      b: chroma * Math.sin(rad),
    });
    const eps = 1e-4;
    if (
      lin.r >= -eps &&
      lin.r <= 1 + eps &&
      lin.g >= -eps &&
      lin.g <= 1 + eps &&
      lin.b >= -eps &&
      lin.b <= 1 + eps
    ) {
      return {
        r: Math.round(linearToSrgb(lin.r)),
        g: Math.round(linearToSrgb(lin.g)),
        b: Math.round(linearToSrgb(lin.b)),
      };
    }
    chroma *= 0.92;
  }
  const gray = Math.round(linearToSrgb(l * l * l));
  return { r: gray, g: gray, b: gray };
}

export function rgbToOklch(c: RGB): OKLCH {
  const lab = rgbToOklab(c);
  const chroma = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
  let h = (Math.atan2(lab.b, lab.a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: round(lab.L, 5), c: round(chroma, 5), h: round(h, 2) };
}

export function oklchToHex(c: OKLCH): string {
  return rgbToHex(oklchToRgb(c));
}

export function hexToOklch(hex: string): OKLCH {
  return rgbToOklch(hexToRgb(hex));
}

/** 宽容解析：HEX / RGB / HSL 三种文本。失败返回 null。 */
export function parseColor(input: string): RGB | null {
  const raw = String(input ?? '').trim();
  if (!raw) return null;

  const rgbMatch = raw.match(
    /^rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})/i,
  );
  if (rgbMatch) {
    const r = Number(rgbMatch[1]);
    const g = Number(rgbMatch[2]);
    const b = Number(rgbMatch[3]);
    if ([r, g, b].every((v) => v >= 0 && v <= 255)) return { r, g, b };
    return null;
  }

  const hslMatch = raw.match(
    /^hsla?\(\s*(-?\d{1,3}(?:\.\d+)?)\s*[, ]\s*(\d{1,3}(?:\.\d+)?)%?\s*[, ]\s*(\d{1,3}(?:\.\d+)?)%?/i,
  );
  if (hslMatch) {
    const h = Number(hslMatch[1]);
    const s = Number(hslMatch[2]);
    const l = Number(hslMatch[3]);
    if (s >= 0 && s <= 100 && l >= 0 && l <= 100) {
      return hslToRgb({ h: ((h % 360) + 360) % 360, s, l });
    }
    return null;
  }

  const hex = raw.replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(hex) || /^[0-9a-fA-F]{6}$/.test(hex)) {
    return hexToRgb(hex);
  }
  return null;
}

export function normalizeHex(input: string): string | null {
  const rgb = parseColor(input);
  return rgb ? rgbToHex(rgb) : null;
}

export function mix(a: string, b: string, t: number): string {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  const w = clamp(t, 0, 1);
  return rgbToHex({
    r: x.r + (y.r - x.r) * w,
    g: x.g + (y.g - x.g) * w,
    b: x.b + (y.b - x.b) * w,
  });
}

export function withAlpha(hex: string, alpha: number): string {
  const c = hexToRgb(hex);
  return `rgba(${c.r},${c.g},${c.b},${clamp(alpha, 0, 1)})`;
}

/** 返回与给定颜色最易读的文字色（白或近黑）。 */
export function textOn(bgHex: string): string {
  const c = hexToRgb(bgHex);
  const yiq = (c.r * 299 + c.g * 587 + c.b * 114) / 1000;
  return yiq >= 150 ? '#17171A' : '#FFFFFF';
}
