import { describe, expect, it } from 'vitest';
import { TRADITIONAL_COLORS, TRAD_SERIES } from '../../src/content/traditionalColors';
import { nearestTraditional, searchTraditional } from '../../src/core/traditional';
import { normalizeHex } from '../../src/core/color';

describe('传统色字典', () => {
  it('数据集完整：名字唯一、色值合法、色系已知', () => {
    expect(TRADITIONAL_COLORS.length).toBeGreaterThanOrEqual(100);
    const names = new Set(TRADITIONAL_COLORS.map((c) => c.name));
    expect(names.size).toBe(TRADITIONAL_COLORS.length);
    for (const c of TRADITIONAL_COLORS) {
      expect(normalizeHex(c.hex)).not.toBeNull();
      expect(TRAD_SERIES).toContain(c.series);
    }
  });

  it('按名字与色值搜索', () => {
    expect(searchTraditional('月白').map((c) => c.name)).toEqual(['月白']);
    expect(searchTraditional('d6ecf0').map((c) => c.name)).toEqual(['月白']);
    expect(searchTraditional('', '红').every((c) => c.series === '红')).toBe(true);
    expect(searchTraditional('不存在的颜色')).toHaveLength(0);
  });

  it('近色查询：自身距离为 0，非法输入返回 null', () => {
    const hit = nearestTraditional('#D6ECF0');
    expect(hit?.color.name).toBe('月白');
    expect(hit?.distance).toBe(0);
    expect(nearestTraditional('#12345')).toBeNull();
  });

  it('任意色都能找到近色且距离有限', () => {
    const hit = nearestTraditional('#3B6CFF');
    expect(hit).not.toBeNull();
    expect(Number.isFinite(hit?.distance)).toBe(true);
  });
});