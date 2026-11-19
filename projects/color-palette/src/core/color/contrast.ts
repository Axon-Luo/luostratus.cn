import { hexToRgb } from './convert';

/** WCAG 2.x 相对亮度 */
export function relativeLuminance(hex: string): number {
  const c = hexToRgb(hex);
  const f = (v: number) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
}

/** WCAG 对比度，1–21 */
export function contrastRatio(a: string, b: string): number {
  const x = relativeLuminance(a);
  const y = relativeLuminance(b);
  const hi = Math.max(x, y);
  const lo = Math.min(x, y);
  return (hi + 0.05) / (lo + 0.05);
}

export type WcagLevel = 'AAA' | 'AA' | 'AA-LG' | 'fail';

export function wcagLevel(ratio: number, large = false): WcagLevel {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (large && ratio >= 3) return 'AA-LG';
  return 'fail';
}

/** APCA 0.1.9 的简化实现：返回 Lc（正文对比度，正负代表极性） */
export function apcaLc(textHex: string, bgHex: string): number {
  const TRC = 2.4;
  const luma = (hex: string) => {
    const c = hexToRgb(hex);
    return (
      0.2126729 * Math.pow(c.r / 255, TRC) +
      0.7151522 * Math.pow(c.g / 255, TRC) +
      0.072175 * Math.pow(c.b / 255, TRC)
    );
  };
  let yText = luma(textHex);
  let yBg = luma(bgHex);
  const clampBlack = (y: number) =>
    y < 0.022 ? y + Math.pow(0.022 - y, 1.414) : y;
  yText = clampBlack(yText);
  yBg = clampBlack(yBg);

  let out: number;
  if (yBg > yText) {
    const sapc = (Math.pow(yBg, 0.56) - Math.pow(yText, 0.57)) * 1.14;
    out = sapc < 0.1 ? 0 : (sapc - 0.027) * 100;
  } else {
    const sapc = (Math.pow(yBg, 0.65) - Math.pow(yText, 0.62)) * 1.14;
    out = sapc > -0.1 ? 0 : (sapc + 0.027) * 100;
  }
  return Math.round(out * 100) / 100;
}
