import { hexToOklch } from './convert';

// 阈值为 OKLCH 色相角：红约 29°、橙约 60°、黄约 100°、绿约 150°、蓝约 265°
const HUE_NAMES: Array<[number, string]> = [
  [18, '红'],
  [45, '红'],
  [72, '橙'],
  [105, '黄'],
  [135, '黄绿'],
  [168, '绿'],
  [205, '青'],
  [262, '蓝'],
  [295, '靛蓝'],
  [325, '紫'],
  [352, '洋红'],
  [361, '红'],
];

/** 中文色名：色相 + 明度/彩度描述，用于方案说明与导出。 */
export function colorName(hex: string): string {
  const { l, c, h } = hexToOklch(hex);

  if (c < 0.02) {
    if (l > 0.94) return '米白';
    if (l > 0.86) return '浅灰';
    if (l > 0.66) return '银灰';
    if (l > 0.42) return '中灰';
    if (l > 0.2) return '深灰';
    return '墨黑';
  }

  const base = HUE_NAMES.find(([max]) => h <= max)?.[1] ?? '红';
  let prefix = '';
  if (c < 0.055) prefix = '灰';
  else if (l < 0.28) prefix = '深';
  else if (l > 0.82) prefix = '浅';
  else if (c > 0.16 && l > 0.45 && l < 0.66) prefix = '鲜';
  else if (l > 0.68) prefix = '柔';

  return prefix + base;
}

/** 色相在色环上的描述，如「偏暖的橙」。 */
export function hueFeeling(hex: string): string {
  const { h } = hexToOklch(hex);
  if (h < 60 || h >= 330) return '暖';
  if (h < 105) return '明亮';
  if (h < 170) return '清爽';
  if (h < 230) return '冷';
  if (h < 290) return '沉静';
  if (h < 330) return '浪漫';
  return '暖';
}
