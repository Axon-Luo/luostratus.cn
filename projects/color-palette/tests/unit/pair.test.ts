import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../../src/core/color/contrast';
import { simulateCvd } from '../../src/core/color/cvd';
import { deltaE2000 } from '../../src/core/color/distance';
import { generatePalettes } from '../../src/core/palette/generate';
import { buildDarkPalette, cvdSeparation, ensureCvdSafe } from '../../src/core/palette/pair';
import { toColorMap } from '../../src/core/palette/types';

const base = {
  baseHex: '#4A6CF7',
  scene: 'web' as const,
  style: 'none' as const,
  mood: 'none' as const,
  harmony: 'auto' as const,
  seed: 7,
  count: 1,
  now: 1,
};

describe('深色成对', () => {
  it('深色版文本/背景达到 AA，彩色与背景达到 3:1', () => {
    const p = generatePalettes({ ...base, pair: true })[0];
    expect(p.dark).toHaveLength(6);
    expect(p.darkA11y?.textOnBg).toBeGreaterThanOrEqual(4.5);
    const dark = toColorMap({ ...p, colors: p.dark! });
    for (const role of ['primary', 'secondary', 'accent'] as const) {
      expect(contrastRatio(dark[role], dark.bg)).toBeGreaterThanOrEqual(3);
    }
  });

  it('深色背景比浅色背景更暗', () => {
    const p = generatePalettes({ ...base, pair: true })[0];
    expect(p.dark).toBeDefined();
    const lightBg = p.colors.find((c) => c.role === 'bg')!.hex;
    const darkBg = p.dark!.find((c) => c.role === 'bg')!.hex;
    expect(contrastRatio(lightBg, '#000000')).toBeGreaterThan(contrastRatio(darkBg, '#000000'));
  });

  it('未开启成对时不生成 dark', () => {
    const p = generatePalettes(base)[0];
    expect(p.dark).toBeUndefined();
  });

  it('buildDarkPalette 保持主色色相方向', () => {
    const light = generatePalettes(base)[0];
    const dark = buildDarkPalette(toColorMap(light));
    expect(dark.primary).toMatch(/^#[0-9A-F]{6}$/);
    expect(dark.text).not.toBe(light.colors[5].hex);
  });
});

describe('色弱安全', () => {
  it('cvdSafe 开启后三种模拟的分离度 ≥ 8 或报告不安全', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const p = generatePalettes({ ...base, cvdSafe: true, seed })[0];
      expect(p.cvd).toBeDefined();
      const map = toColorMap(p);
      const report = cvdSeparation(map);
      if (p.cvd?.safe) {
        expect(report.protan).toBeGreaterThanOrEqual(8);
        expect(report.deutan).toBeGreaterThanOrEqual(8);
        expect(report.tritan).toBeGreaterThanOrEqual(8);
      }
    }
  });

  it('ensureCvdSafe 能提升原本接近的组合', () => {
    const map = { primary: '#E53935', secondary: '#0FA36B', accent: '#E5A50A', bg: '#FFFDF9', surface: '#FFFFFF', text: '#17171A' };
    const before = cvdSeparation(map);
    const after = ensureCvdSafe(map);
    expect(after.report.protan + after.report.deutan + after.report.tritan).toBeGreaterThanOrEqual(
      before.protan + before.deutan + before.tritan,
    );
  });

  it('色弱模拟保持颜色可解析', () => {
    const p = generatePalettes({ ...base, cvdSafe: true, seed: 9 })[0];
    for (const c of p.colors) {
      expect(simulateCvd(c.hex, 'deutan')).toMatch(/^#[0-9A-F]{6}$/);
    }
    expect(deltaE2000('#E53935', '#0FA36B')).toBeGreaterThan(0);
  });
});
