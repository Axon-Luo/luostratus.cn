import { describe, expect, it } from 'vitest';
import { extractColors, pickBaseColor } from '../../src/core/image/quantize';

function makeImage(
  width: number,
  height: number,
  paint: (x: number, y: number) => [number, number, number, number],
): { data: Uint8ClampedArray; width: number; height: number } {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = paint(x, y);
      const i = (y * width + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    }
  }
  return { data, width, height };
}

describe('图片取色', () => {
  it('提取出红蓝两色', () => {
    const img = makeImage(40, 40, (x) =>
      x < 20 ? [230, 30, 40, 255] : [30, 60, 230, 255],
    );
    const colors = extractColors(img.data, img.width, img.height, { k: 6 });
    expect(colors.length).toBeGreaterThanOrEqual(2);
    expect(colors.some((h) => parseInt(h.slice(1, 3), 16) > 180)).toBe(true);
    expect(colors.some((h) => parseInt(h.slice(5, 7), 16) > 180)).toBe(true);
  });

  it('结果确定', () => {
    const img = makeImage(30, 30, (x, y) => [x * 8, y * 8, 120, 255]);
    const a = extractColors(img.data, img.width, img.height);
    const b = extractColors(img.data, img.width, img.height);
    expect(a).toEqual(b);
  });

  it('全透明图片返回空数组', () => {
    const img = makeImage(10, 10, () => [0, 0, 0, 0]);
    expect(extractColors(img.data, img.width, img.height)).toEqual([]);
  });

  it('pickBaseColor 返回候选中的一个', () => {
    const colors = ['#EEEEEE', '#4A6CF7', '#F2C94C'];
    expect(colors).toContain(pickBaseColor(colors));
    expect(pickBaseColor([])).toBe('#4A6CF7');
  });
});
