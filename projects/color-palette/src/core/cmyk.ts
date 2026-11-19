import { hexToRgb } from './color/convert';

export interface Cmyk {
  c: number;
  m: number;
  y: number;
  k: number;
}

/** 屏幕色 → 印刷 CMYK 近似值（0–100），仅作沟通参考。 */
export function rgbToCmyk(hex: string): Cmyk {
  const { r, g, b } = hexToRgb(hex);
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const k = 1 - Math.max(rr, gg, bb);
  if (k >= 1) return { c: 0, m: 0, y: 0, k: 100 };
  const c = (1 - rr - k) / (1 - k);
  const m = (1 - gg - k) / (1 - k);
  const y = (1 - bb - k) / (1 - k);
  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  };
}

export function cmykLabel(hex: string): string {
  const v = rgbToCmyk(hex);
  return `C${v.c} M${v.m} Y${v.y} K${v.k}`;
}
