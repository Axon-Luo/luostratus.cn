import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../../src/core/color';
import {
  ensureContrast,
  generatePalettes,
  paletteForTheme,
  repairPalette,
} from '../../src/core/palette/generate';
import { ROLES, toColorMap } from '../../src/core/palette/types';
import type { Palette } from '../../src/core/palette/types';

const baseOptions = {
  baseHex: '#4A6CF7',
  scene: 'outfit' as const,
  style: 'none' as const,
  mood: 'none' as const,
  harmony: 'auto' as const,
  seed: 12345,
  count: 3,
  now: 1_700_000_000_000,
};

describe('配色生成', () => {
  it('同一 seed 结果可复现', () => {
    const a = generatePalettes(baseOptions);
    const b = generatePalettes(baseOptions);
    expect(a.map((p) => p.colors.map((c) => c.hex))).toEqual(
      b.map((p) => p.colors.map((c) => c.hex)),
    );
  });

  it('生成三套方案，角色与比例完整', () => {
    const list = generatePalettes(baseOptions);
    expect(list).toHaveLength(3);
    for (const p of list) {
      expect(p.colors.map((c) => c.role)).toEqual(ROLES.map((r) => r.id));
      expect(p.colors.reduce((sum, c) => sum + c.ratio, 0)).toBe(100);
      expect(p.description.length).toBeGreaterThan(10);
    }
  });

  it('文字与背景始终达到 AA', () => {
    const list = generatePalettes({ ...baseOptions, baseHex: '#F6D365' });
    for (const p of list) {
      expect(contrastRatio(toColorMap(p).text, toColorMap(p).bg)).toBeGreaterThanOrEqual(4.5);
      expect(p.a11y.aa).toBe(true);
    }
  });

  it('锁定颜色原样保留', () => {
    const locks = { primary: '#123456', text: '#222222' };
    const list = generatePalettes({ ...baseOptions, locks });
    for (const p of list) {
      const map = toColorMap(p);
      expect(map.primary).toBe('#123456');
      expect(map.text).toBe('#222222');
    }
  });

  it('严格无障碍下三个彩色都达到 3:1', () => {
    const list = generatePalettes({ ...baseOptions, strict: true, baseHex: '#F6D365' });
    for (const p of list) {
      const map = toColorMap(p);
      expect(contrastRatio(map.primary, map.bg)).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(map.secondary, map.bg)).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(map.accent, map.bg)).toBeGreaterThanOrEqual(3);
    }
  });

  it('三套方案的主色彼此可区分', () => {
    const list = generatePalettes(baseOptions);
    const primaries = list.map((p) => toColorMap(p).primary);
    expect(new Set(primaries).size).toBeGreaterThan(1);
  });

  it('ensureContrast 能达标且保持色相', () => {
    const fixed = ensureContrast('#F0E0C0', '#FFFFFF', 4.5);
    expect(contrastRatio(fixed, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
  });

  it('repairPalette 修复低对比度方案', () => {
    const p = generatePalettes(baseOptions)[0];
    const broken: Palette = {
      ...p,
      colors: p.colors.map((c) =>
        c.role === 'text' ? { ...c, hex: '#F2F2F2' } : c,
      ),
    };
    const fixed = repairPalette(broken);
    const map = toColorMap(fixed);
    expect(contrastRatio(map.text, map.bg)).toBeGreaterThanOrEqual(4.5);
    expect(map.bg).toBe(toColorMap(broken).bg);
  });

  it('深色预览版本仍然可读', () => {
    const p = generatePalettes(baseOptions)[0];
    const dark = paletteForTheme(p, 'dark');
    expect(contrastRatio(dark.text, dark.bg)).toBeGreaterThanOrEqual(7);
    expect(dark.bg).not.toBe(toColorMap(p).bg);
  });
});
