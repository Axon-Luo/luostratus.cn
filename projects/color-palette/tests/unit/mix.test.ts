import { describe, expect, it } from 'vitest';
import { mixLight, mixPigment } from '../../src/core/mix';
import { hexToRgb, relativeLuminance } from '../../src/core/color';

const A = '#E4572E';
const B = '#2E6FE4';

const close = (x: string, y: string): void => {
  const ca = hexToRgb(x);
  const cb = hexToRgb(y);
  expect(Math.abs(ca.r - cb.r)).toBeLessThanOrEqual(1);
  expect(Math.abs(ca.g - cb.g)).toBeLessThanOrEqual(1);
  expect(Math.abs(ca.b - cb.b)).toBeLessThanOrEqual(1);
};

describe('混色核心', () => {
  it('比例端点回到原色', () => {
    close(mixPigment(A, B, 0), A);
    close(mixPigment(A, B, 1), B);
    close(mixLight(A, B, 0), A);
    close(mixLight(A, B, 1), B);
  });

  it('黑白加色中点是线性亮度一半', () => {
    expect(mixLight('#000000', '#FFFFFF', 0.5)).toBe('#BCBCBC');
  });

  it('饱和色的颜料混合比光混合更暗', () => {
    const pigment = mixPigment(A, B, 0.5);
    const light = mixLight(A, B, 0.5);
    expect(relativeLuminance(pigment)).toBeLessThan(relativeLuminance(light));
  });

  it('比例越界被夹回 0..1', () => {
    expect(mixPigment(A, B, -2)).toBe(mixPigment(A, B, 0));
    expect(mixLight(A, B, 3)).toBe(mixLight(A, B, 1));
  });
});