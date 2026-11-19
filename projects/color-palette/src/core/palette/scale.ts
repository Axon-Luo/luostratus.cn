import { clamp, hexToOklch, oklchToHex } from '../color/convert';
import { contrastRatio } from '../color/contrast';
import { ensureContrast } from './generate';

export const SCALE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

export type ScaleStep = (typeof SCALE_STEPS)[number];

export type ScaleMap = Record<number, string>;

export type SemanticKey = 'success' | 'warning' | 'danger' | 'info';

/** 在 OKLCH 中生成 11 档色阶：明度等距下降，彩度中段最高，色相保持不变。 */
export function buildScale(hex: string, steps: readonly number[] = SCALE_STEPS): ScaleMap {
  const base = hexToOklch(hex);
  const total = steps.length - 1;
  const out: ScaleMap = {};
  steps.forEach((step, index) => {
    const t = total <= 0 ? 0 : index / total;
    const l = 0.97 - t * 0.85;
    const c = clamp(base.c * (0.35 + 2.2 * t * (1 - t)), 0, 0.3);
    out[step] = oklchToHex({ l, c, h: base.h });
  });
  return out;
}

const SEMANTIC_HUES: Record<SemanticKey, number> = {
  success: 145,
  warning: 75,
  danger: 27,
  info: 250,
};

/** 语义色：固定色相锚点，在给定背景上保证 4.5:1。 */
export function buildSemanticTokens(bg: string): Record<SemanticKey, string> {
  const out = {} as Record<SemanticKey, string>;
  for (const [key, hue] of Object.entries(SEMANTIC_HUES) as Array<[SemanticKey, number]>) {
    const base = oklchToHex({ l: 0.55, c: 0.15, h: hue });
    out[key] = contrastRatio(base, bg) >= 4.5 ? base : ensureContrast(base, bg, 4.5);
  }
  return out;
}
