import { describe, expect, it } from 'vitest';
import { generatePalettes } from '../../src/core/palette/generate';
import {
  buildOutfitWeek,
  buildRoomSchemes,
  CARD_OCCASIONS,
  cardTitle,
} from '../../src/core/lifePlans';

const base = generatePalettes({
  baseHex: '#4A6CF7',
  scene: 'home',
  style: 'none',
  mood: 'none',
  harmony: 'auto',
  seed: 3,
  count: 1,
  now: 1,
})[0];

describe('一周穿搭', () => {
  it('生成 7 天，每天 3 个服饰色', () => {
    const days = buildOutfitWeek({ occasion: 'commute', weather: 'mild', seed: 42 });
    expect(days).toHaveLength(7);
    for (const day of days) {
      expect(day.top).toMatch(/^#[0-9A-F]{6}$/);
      expect(day.bottom).toMatch(/^#[0-9A-F]{6}$/);
      expect(day.shoes).toMatch(/^#[0-9A-F]{6}$/);
      expect(day.note.length).toBeGreaterThan(4);
    }
  });

  it('种子相同结果稳定', () => {
    const a = buildOutfitWeek({ occasion: 'date', weather: 'hot', seed: 9 });
    const b = buildOutfitWeek({ occasion: 'date', weather: 'hot', seed: 9 });
    expect(a.map((d) => d.top)).toEqual(b.map((d) => d.top));
  });

  it('种子不同会换一周', () => {
    const a = buildOutfitWeek({ occasion: 'commute', weather: 'mild', seed: 9 });
    const b = buildOutfitWeek({ occasion: 'commute', weather: 'mild', seed: 10 });
    const key = (days: typeof a) => days.map((d) => `${d.top}${d.bottom}${d.shoes}`).join();
    expect(key(a)).not.toBe(key(b));
  });
});

describe('房间刷色', () => {
  it('生成 3 套方案，每套 5 个部位且面积和为 100', () => {
    const schemes = buildRoomSchemes(base, 5);
    expect(schemes).toHaveLength(3);
    for (const scheme of schemes) {
      expect(scheme.surfaces).toHaveLength(5);
      expect(scheme.surfaces.reduce((sum, s) => sum + s.area, 0)).toBe(100);
      for (const surface of scheme.surfaces) {
        expect(surface.hex).toMatch(/^#[0-9A-F]{6}$/);
      }
    }
  });
});

describe('贺卡文案', () => {
  it('四种场合都有标题', () => {
    expect(CARD_OCCASIONS).toHaveLength(4);
    for (const occasion of CARD_OCCASIONS) {
      expect(cardTitle(occasion).length).toBeGreaterThan(2);
    }
  });
});
