import type { HarmonyType } from './types';

export const AUTO_HARMONIES: Exclude<HarmonyType, 'auto'>[] = [
  'analogous',
  'complementary',
  'split',
  'triadic',
];

/** 返回主色 / 辅助色 / 强调色三个色相（度）。 */
export function harmonyHues(hue: number, type: HarmonyType): [number, number, number] {
  const h = ((hue % 360) + 360) % 360;
  const norm = (v: number) => ((v % 360) + 360) % 360;
  switch (type) {
    case 'complementary':
      return [h, h, norm(h + 180)];
    case 'analogous':
      return [h, norm(h + 28), norm(h - 28)];
    case 'triadic':
      return [h, norm(h + 120), norm(h + 240)];
    case 'split':
      return [h, norm(h + 150), norm(h + 210)];
    case 'tetradic':
      return [h, norm(h + 90), norm(h + 180)];
    case 'monochrome':
      return [h, h, h];
    default:
      return [h, norm(h + 28), norm(h + 180)];
  }
}

export function resolveHarmony(type: HarmonyType, index: number): Exclude<HarmonyType, 'auto'> {
  if (type !== 'auto') return type;
  return AUTO_HARMONIES[index % AUTO_HARMONIES.length];
}
