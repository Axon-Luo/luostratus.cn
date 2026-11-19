import { describe, expect, it } from 'vitest';
import { paletteFromColors, parsePaletteInput } from '../../src/core/import/parse';

describe('配色导入', () => {
  it('解析 hex 列表', () => {
    const result = parsePaletteInput('#E53935 #1E88E5 #F6D365');
    expect(result.source).toBe('hex');
    expect(result.colors).toEqual(['#E53935', '#1E88E5', '#F6D365']);
  });

  it('解析三位缩写并去重', () => {
    const result = parsePaletteInput('#abc, #AABBCC, #abc');
    expect(result.colors).toEqual(['#AABBCC']);
  });

  it('解析 CSS 变量', () => {
    const result = parsePaletteInput(':root{--brand:#E53935;--bg:#F6F1F1;}');
    expect(result.source).toBe('css');
    expect(result.colors).toContain('#E53935');
    expect(result.colors).toContain('#F6F1F1');
  });

  it('解析设计令牌 JSON', () => {
    const result = parsePaletteInput(
      JSON.stringify({ color: { primary: '#E53935', brand: ['#1E88E5', '#F6D365'] } }),
    );
    expect(result.source).toBe('json');
    expect(result.colors.length).toBeGreaterThanOrEqual(3);
  });

  it('无法识别时给出警告', () => {
    const result = parsePaletteInput('hello world');
    expect(result.colors).toEqual([]);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('超过 24 色截断并警告', () => {
    const result = parsePaletteInput(
      Array.from({ length: 30 }, (_, i) => '#' + (i + 1).toString(16).padStart(6, '0')).join(' '),
    );
    expect(result.colors).toHaveLength(24);
    expect(result.warnings.some((w) => w.includes('24'))).toBe(true);
  });

  it('从 2 个颜色可以构造完整方案', () => {
    const palette = paletteFromColors(['#E53935', '#1E88E5']);
    expect(palette).not.toBeNull();
    expect(palette?.colors).toHaveLength(6);
    expect(palette?.a11y.textOnBg).toBeGreaterThan(0);
  });

  it('从 6 个颜色映射出主色/背景/文字', () => {
    const palette = paletteFromColors(['#E53935', '#1E88E5', '#F6D365', '#111111', '#F6F1F1', '#FFFFFF']);
    expect(palette).not.toBeNull();
    const roles = palette?.colors.map((c) => c.role) ?? [];
    expect(roles).toEqual(['primary', 'secondary', 'accent', 'bg', 'surface', 'text']);
  });
});
