import { describe, expect, it } from 'vitest';
import { hexToOklch } from '../../src/core/color/convert';
import { contrastRatio } from '../../src/core/color/contrast';
import { generatePalettes } from '../../src/core/palette/generate';
import { buildScale, buildSemanticTokens, SCALE_STEPS } from '../../src/core/palette/scale';
import { TOKEN_FORMATS, tokenText } from '../../src/core/export/tokens';

const palette = (pair = false) =>
  generatePalettes({
    baseHex: '#4A6CF7',
    scene: 'web',
    style: 'none',
    mood: 'none',
    harmony: 'auto',
    seed: 11,
    count: 1,
    now: 1,
    pair,
  })[0];

describe('色阶', () => {
  it('生成 11 档且都是合法 HEX', () => {
    const scale = buildScale('#4A6CF7');
    expect(Object.keys(scale)).toHaveLength(SCALE_STEPS.length);
    for (const step of SCALE_STEPS) {
      expect(scale[step]).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  it('明度从 50 到 950 单调下降，色相保持', () => {
    const scale = buildScale('#4A6CF7');
    const ls = SCALE_STEPS.map((step) => hexToOklch(scale[step]).l);
    for (let i = 1; i < ls.length; i += 1) {
      expect(ls[i]).toBeLessThan(ls[i - 1]);
    }
    const baseHue = hexToOklch('#4A6CF7').h;
    for (const step of [100, 500, 900]) {
      const hue = hexToOklch(scale[step]).h;
      expect(Math.abs(hue - baseHue)).toBeLessThan(4);
    }
  });

  it('语义色在背景上达到 4.5:1', () => {
    const bg = '#F6F1F1';
    const semantic = buildSemanticTokens(bg);
    for (const hex of Object.values(semantic)) {
      expect(contrastRatio(hex, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('设计令牌导出', () => {
  it('六种格式都有内容', () => {
    const p = palette(true);
    for (const format of TOKEN_FORMATS) {
      const text = tokenText(p, format.id);
      expect(text.length).toBeGreaterThan(50);
    }
  });

  it('CSS/Tailwind 包含色阶与深色块', () => {
    const p = palette(true);
    const css = tokenText(p, 'css');
    expect(css).toContain('--color-primary-500');
    expect(css).toContain('[data-theme="dark"]');
    const tw = tokenText(p, 'tailwind');
    expect(tw).toContain('@theme');
    expect(tw).toContain('--color-success');
  });

  it('Android / iOS / Flutter 使用各自语法', () => {
    const p = palette();
    expect(tokenText(p, 'android')).toContain('<color name="primary_500">');
    expect(tokenText(p, 'ios')).toContain('Color(hex: 0x');
    expect(tokenText(p, 'flutter')).toContain('Color(0xFF');
  });

  it('Figma Tokens 是合法 JSON', () => {
    const p = palette();
    const json = JSON.parse(tokenText(p, 'figma'));
    expect(json.color.primary['500'].$value).toMatch(/^#[0-9A-F]{6}$/);
  });
});
