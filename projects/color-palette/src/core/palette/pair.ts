import { clamp, hexToOklch, oklchToHex } from '../color/convert';
import { contrastRatio } from '../color/contrast';
import { simulateCvd } from '../color/cvd';
import { deltaE2000 } from '../color/distance';
import type { ColorMap } from './types';

/**
 * 从浅色方案派生可用的深色配套：
 * 背景/面板/文字独立取 L 阶，彩色抬亮并保证与深色背景 ≥3:1。
 */
export function buildDarkPalette(light: ColorMap): ColorMap {
  const neutralHue = hexToOklch(light.bg).h;
  const bgOklch = hexToOklch(light.bg);
  const bg = oklchToHex({ l: 0.13, c: Math.min(0.02, bgOklch.c * 0.8), h: neutralHue });
  const surface = oklchToHex({ l: 0.2, c: 0.012, h: neutralHue });
  let text = oklchToHex({ l: 0.94, c: 0.008, h: neutralHue });
  if (contrastRatio(text, bg) < 7) {
    text = oklchToHex({ l: 0.98, c: 0.004, h: neutralHue });
  }

  const lift = (hex: string, delta: number, minContrast: number): string => {
    const base = hexToOklch(hex);
    let candidate = oklchToHex({
      l: clamp(base.l + delta, 0.25, 0.86),
      c: clamp(base.c * 0.95, 0, 0.28),
      h: base.h,
    });
    for (let i = 0; i < 24 && contrastRatio(candidate, bg) < minContrast; i += 1) {
      const next = hexToOklch(candidate);
      candidate = oklchToHex({
        l: clamp(next.l + 0.03, 0.3, 0.92),
        c: clamp(next.c * 0.97, 0, 0.3),
        h: next.h,
      });
    }
    return candidate;
  };

  return {
    bg,
    surface,
    text,
    primary: lift(light.primary, 0.2, 3),
    secondary: lift(light.secondary, 0.14, 3),
    accent: lift(light.accent, 0.18, 3),
  };
}

export interface CvdSeparation {
  protan: number;
  deutan: number;
  tritan: number;
  safe: boolean;
}

function minPairDelta(map: ColorMap, mode: 'protan' | 'deutan' | 'tritan'): number {
  const colors = [map.primary, map.secondary, map.accent].map((hex) => simulateCvd(hex, mode));
  let min = Number.POSITIVE_INFINITY;
  for (let i = 0; i < colors.length; i += 1) {
    for (let j = i + 1; j < colors.length; j += 1) {
      min = Math.min(min, deltaE2000(colors[i], colors[j]));
    }
  }
  return Math.round(min * 10) / 10;
}

export function cvdSeparation(map: ColorMap): CvdSeparation {
  const protan = minPairDelta(map, 'protan');
  const deutan = minPairDelta(map, 'deutan');
  const tritan = minPairDelta(map, 'tritan');
  return {
    protan,
    deutan,
    tritan,
    safe: protan >= 8 && deutan >= 8 && tritan >= 8,
  };
}

/**
 * F07：在保持主色色相的前提下调整辅助/强调色，让三种色弱模拟下的
 * 主/辅/强调两两 ΔE ≥ min。无解时返回当前最佳并标记 safe=false。
 */
export function ensureCvdSafe(map: ColorMap, min = 8): { map: ColorMap; report: CvdSeparation } {
  let best = { map, report: cvdSeparation(map) };
  if (best.report.safe) return best;

  const baseSecondary = hexToOklch(map.secondary);
  const baseAccent = hexToOklch(map.accent);
  for (let step = 1; step <= 16; step += 1) {
    const shift = step * 6;
    const candidate: ColorMap = {
      ...map,
      secondary: oklchToHex({
        l: clamp(baseSecondary.l + (step % 2 === 0 ? 0.03 : -0.03), 0.3, 0.8),
        c: baseSecondary.c,
        h: baseSecondary.h + shift,
      }),
      accent: oklchToHex({
        l: clamp(baseAccent.l + (step % 3 === 0 ? 0.04 : -0.02), 0.35, 0.85),
        c: baseAccent.c,
        h: baseAccent.h - shift,
      }),
    };
    const report = cvdSeparation(candidate);
    if (report.safe) return { map: candidate, report };
    if (report.protan + report.deutan + report.tritan > best.report.protan + best.report.deutan + best.report.tritan) {
      best = { map: candidate, report };
    }
  }
  return best;
}
