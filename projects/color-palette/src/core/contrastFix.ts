import { contrastRatio } from './color/contrast';
import { hexToOklch, normalizeHex, oklchToHex } from './color/convert';

export interface ContrastTarget {
  id: string;
  label: string;
  ratio: number;
}

export const CONTRAST_TARGETS: ContrastTarget[] = [
  { id: 'AA', label: 'AA 正文', ratio: 4.5 },
  { id: 'AA-LG', label: 'AA 大字', ratio: 3 },
  { id: 'AAA', label: 'AAA 正文', ratio: 7 },
  { id: 'AAA-LG', label: 'AAA 大字', ratio: 4.5 },
];

/** 该背景理论上能达到的最高对比度（纯黑 / 纯白取大者）。 */
export function maxContrast(against: string): number {
  return Math.max(contrastRatio('#000000', against), contrastRatio('#FFFFFF', against));
}

const searchSide = (l0: number, end: number, c: number, h: number, against: string, target: number): number => {
  let lo = l0;
  let hi = end;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (contrastRatio(oklchToHex({ l: mid, c, h }), against) >= target) hi = mid;
    else lo = mid;
  }
  return hi;
};

/**
 * 保持色相与彩度，只把 OKLCH 明度推向较近的一端直到达标；
 * 两端都达不到目标时返回 null（例如中灰背景做不到 AAA 7）。
 */
export function fixContrast(color: string, against: string, target: number): string | null {
  const hex = normalizeHex(color);
  const bg = normalizeHex(against);
  if (!hex || !bg) return null;
  if (contrastRatio(hex, bg) >= target) return hex;
  const { l, c, h } = hexToOklch(hex);
  const ok = (lv: number): boolean => contrastRatio(oklchToHex({ l: lv, c, h }), bg) >= target;
  const darkOk = ok(0);
  const lightOk = ok(1);
  if (!darkOk && !lightOk) return null;
  const candidates: number[] = [];
  if (darkOk) candidates.push(searchSide(l, 0, c, h, bg, target));
  if (lightOk) candidates.push(searchSide(l, 1, c, h, bg, target));
  const best = candidates.reduce((a, b) => (Math.abs(b - l) < Math.abs(a - l) ? b : a));
  return oklchToHex({ l: best, c, h });
}