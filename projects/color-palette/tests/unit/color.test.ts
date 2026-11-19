import { describe, expect, it } from 'vitest';
import {
  apcaLc,
  colorName,
  contrastRatio,
  deltaE2000,
  hexToHsl,
  hexToOklch,
  hexToRgb,
  hslToHex,
  oklchToHex,
  parseColor,
  rgbToHex,
  simulateCvd,
} from '../../src/core/color';

describe('颜色转换', () => {
  it('HEX 往返一致', () => {
    for (const hex of ['#000000', '#FFFFFF', '#4A6CF7', '#E53935', '#0FA36B']) {
      expect(rgbToHex(hexToRgb(hex))).toBe(hex);
    }
  });

  it('支持三位缩写', () => {
    expect(hexToRgb('#abc')).toEqual({ r: 170, g: 187, b: 204 });
  });

  it('解析 HEX / RGB / HSL 文本', () => {
    expect(parseColor('#4A6CF7')).toEqual({ r: 74, g: 108, b: 247 });
    expect(parseColor('74, 108, 247')).toBeNull();
    expect(parseColor('rgb(74, 108, 247)')).toEqual({ r: 74, g: 108, b: 247 });
    expect(parseColor('hsl(229, 92%, 63%)')).not.toBeNull();
    expect(parseColor('not-a-color')).toBeNull();
    expect(parseColor('#12345')).toBeNull();
  });

  it('HSL 往返误差在 2 个色阶内', () => {
    for (const hex of ['#4A6CF7', '#E53935', '#0FA36B', '#8E44AD']) {
      const back = hexToRgb(hslToHex(hexToHsl(hex)));
      const src = hexToRgb(hex);
      expect(Math.abs(back.r - src.r)).toBeLessThanOrEqual(2);
      expect(Math.abs(back.g - src.g)).toBeLessThanOrEqual(2);
      expect(Math.abs(back.b - src.b)).toBeLessThanOrEqual(2);
    }
  });

  it('OKLCH 往返误差在 3 个色阶内', () => {
    for (const hex of ['#4A6CF7', '#E53935', '#0FA36B', '#F5F5F5', '#111111']) {
      const back = hexToRgb(oklchToHex(hexToOklch(hex)));
      const src = hexToRgb(hex);
      expect(Math.abs(back.r - src.r)).toBeLessThanOrEqual(3);
      expect(Math.abs(back.g - src.g)).toBeLessThanOrEqual(3);
      expect(Math.abs(back.b - src.b)).toBeLessThanOrEqual(3);
    }
  });
});

describe('对比度与色差', () => {
  it('黑白对比度为 21', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
  });

  it('中灰与白色约 4.48', () => {
    expect(contrastRatio('#777777', '#FFFFFF')).toBeGreaterThan(4.47);
    expect(contrastRatio('#777777', '#FFFFFF')).toBeLessThan(4.49);
  });

  it('对比度对称', () => {
    expect(contrastRatio('#4A6CF7', '#FFFFFF')).toBeCloseTo(
      contrastRatio('#FFFFFF', '#4A6CF7'),
      6,
    );
  });

  it('APCA 黑白基准值', () => {
    expect(apcaLc('#000000', '#FFFFFF')).toBeGreaterThan(105);
    expect(apcaLc('#000000', '#FFFFFF')).toBeLessThan(108);
    expect(apcaLc('#FFFFFF', '#000000')).toBeLessThan(-106);
    expect(apcaLc('#FFFFFF', '#000000')).toBeGreaterThan(-110);
  });

  it('ΔE2000 相同色为 0，黑白约 100', () => {
    expect(deltaE2000('#4A6CF7', '#4A6CF7')).toBeCloseTo(0, 6);
    expect(deltaE2000('#000000', '#FFFFFF')).toBeGreaterThan(99);
    expect(deltaE2000('#000000', '#FFFFFF')).toBeLessThan(101);
    expect(deltaE2000('#4A6CF7', '#E53935')).toBeCloseTo(
      deltaE2000('#E53935', '#4A6CF7'),
      6,
    );
  });
});

describe('色觉模拟与色名', () => {
  it('正常模式原样返回', () => {
    expect(simulateCvd('#E53935', 'none')).toBe('#E53935');
  });

  it('红绿色盲会把红绿拉近', () => {
    const red = simulateCvd('#E53935', 'deutan');
    const green = simulateCvd('#0FA36B', 'deutan');
    expect(deltaE2000(red, green)).toBeLessThan(deltaE2000('#E53935', '#0FA36B'));
  });

  it('中文色名可读', () => {
    expect(colorName('#FFFFFF')).toBe('米白');
    expect(colorName('#000000')).toBe('墨黑');
    expect(colorName('#E53935')).toContain('红');
    expect(colorName('#4A6CF7')).toContain('蓝');
  });
});
