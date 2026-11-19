import { describe, expect, it } from 'vitest';
import { ALL_THEMES, CITY_THEMES, SOLAR_THEMES } from '../../src/content/themes';
import { blindTheme, themePalette } from '../../src/core/themes';

describe('主题配色', () => {
  it('节气 12 个、城市 8 个，id 唯一', () => {
    expect(SOLAR_THEMES).toHaveLength(12);
    expect(CITY_THEMES).toHaveLength(8);
    expect(ALL_THEMES).toHaveLength(20);
    expect(new Set(ALL_THEMES.map((t) => t.id)).size).toBe(20);
  });

  it('每个主题都能生成 6 色方案，且同一主题稳定', () => {
    for (const preset of ALL_THEMES) {
      const p = themePalette(preset);
      expect(p.colors).toHaveLength(6);
      expect(p.name).toBe(preset.name);
      const again = themePalette(preset);
      expect(again.colors.map((c) => c.hex)).toEqual(p.colors.map((c) => c.hex));
    }
  });

  it('盲盒生成合法方案', () => {
    const preset = blindTheme(123);
    const p = themePalette(preset);
    expect(preset.name).toContain('盲盒');
    expect(p.colors).toHaveLength(6);
    expect(p.colors[0].hex).toMatch(/^#[0-9A-F]{6}$/);
  });
});
