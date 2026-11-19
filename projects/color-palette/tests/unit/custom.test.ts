import { describe, expect, it } from 'vitest';
import { generatePalettes } from '../../src/core/palette/generate';
import { paletteWithColors } from '../../src/core/palette/custom';

const base = generatePalettes({
  baseHex: '#4A6CF7',
  scene: 'web',
  style: 'none',
  mood: 'none',
  harmony: 'auto',
  seed: 12,
  pair: true,
  count: 1,
  now: 1,
})[0];

describe('独立改色', () => {
  it('只改指定角色，不修改原方案', () => {
    const before = base.colors.map((c) => c.hex);
    const next = paletteWithColors(base, { primary: '#E53935' });
    expect(next.colors.find((c) => c.role === 'primary')?.hex).toBe('#E53935');
    expect(base.colors.map((c) => c.hex)).toEqual(before);
    expect(next.dark).toBeUndefined();
    expect(next.a11y.textOnBg).toBeGreaterThan(0);
  });

  it('忽略非法颜色值', () => {
    const next = paletteWithColors(base, { accent: 'not-a-color' });
    expect(next.colors.find((c) => c.role === 'accent')?.hex).toBe(
      base.colors.find((c) => c.role === 'accent')?.hex,
    );
  });

  it('改背景后其它角色与报告仍完整', () => {
    const next = paletteWithColors(base, { bg: '#101014', text: '#F5F5F5' });
    expect(next.colors).toHaveLength(6);
    expect(next.a11y.textOnBg).toBeGreaterThanOrEqual(4.5);
  });
});
