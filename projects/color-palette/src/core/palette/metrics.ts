import { apcaLc, contrastRatio } from '../color/contrast';
import type { A11yReport, ColorMap } from './types';

export function evaluate(map: ColorMap): A11yReport {
  const textOnBg = contrastRatio(map.text, map.bg);
  const primaryOnBg = contrastRatio(map.primary, map.bg);
  const secondaryOnBg = contrastRatio(map.secondary, map.bg);
  const accentOnBg = contrastRatio(map.accent, map.bg);
  const apca = apcaLc(map.text, map.bg);

  const warnings: string[] = [];
  if (textOnBg < 4.5) {
    warnings.push(`文字与背景 ${textOnBg.toFixed(2)}:1，未达 AA`);
  }
  if (primaryOnBg < 3) {
    warnings.push(`主色与背景 ${primaryOnBg.toFixed(2)}:1，只适合大字或图形`);
  }
  if (secondaryOnBg < 2.2) {
    warnings.push(`辅助色与背景 ${secondaryOnBg.toFixed(2)}:1，容易看不清`);
  }
  if (accentOnBg < 2.2) {
    warnings.push(`强调色与背景 ${accentOnBg.toFixed(2)}:1，容易看不清`);
  }

  return {
    textOnBg: round2(textOnBg),
    primaryOnBg: round2(primaryOnBg),
    secondaryOnBg: round2(secondaryOnBg),
    accentOnBg: round2(accentOnBg),
    apca: round2(apca),
    aa: textOnBg >= 4.5,
    aaa: textOnBg >= 7,
    warnings,
  };
}

export function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
