import { describe, expect, it } from 'vitest';
import { CONTRAST_TARGETS, fixContrast, maxContrast } from '../../src/core/contrastFix';
import { contrastRatio, hexToOklch } from '../../src/core/color';

describe('对比度修复', () => {
  it('已达标时原样返回', () => {
    expect(fixContrast('#17171A', '#FFFFFF', 4.5)).toBe('#17171A');
  });

  it('修正后达到目标且只朝一个明度方向移动', () => {
    const fixed = fixContrast('#9A9A9A', '#FFFFFF', 4.5);
    expect(fixed).not.toBeNull();
    expect(contrastRatio(fixed as string, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
    expect(hexToOklch(fixed as string).l).toBeLessThan(hexToOklch('#9A9A9A').l);
  });

  it('修背景与修前景对称可用', () => {
    const fixedBg = fixContrast('#FFFFFF', '#9A9A9A', 4.5);
    expect(fixedBg).not.toBeNull();
    expect(contrastRatio('#FFFFFF', fixedBg as string)).toBeGreaterThanOrEqual(4.5);
  });

  it('中灰背景做不到 AAA 7 时返回 null', () => {
    expect(maxContrast('#808080')).toBeLessThan(7);
    expect(fixContrast('#17171A', '#808080', 7)).toBeNull();
  });

  it('纯白背景理论上限 21，四个目标都可修', () => {
    expect(maxContrast('#FFFFFF')).toBe(21);
    for (const t of CONTRAST_TARGETS) {
      const fixed = fixContrast('#FFB3A7', '#FFFFFF', t.ratio);
      expect(fixed).not.toBeNull();
      expect(contrastRatio(fixed as string, '#FFFFFF')).toBeGreaterThanOrEqual(t.ratio);
    }
  });
});