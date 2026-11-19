import { describe, expect, it } from 'vitest';
import { generatePalettes } from '../../src/core/palette/generate';
import { decodeShare, encodeShare } from '../../src/core/share';

function makePalette() {
  return generatePalettes({
    baseHex: '#4A6CF7',
    scene: 'home',
    style: 'nature',
    mood: 'warm',
    harmony: 'triadic',
    seed: 42,
    count: 1,
    now: 1,
  })[0];
}

describe('分享链接', () => {
  it('编码后可还原同样的颜色', () => {
    const p = makePalette();
    const token = encodeShare(p);
    const back = decodeShare(token);
    expect(back).not.toBeNull();
    expect(back?.colors.map((c) => c.hex)).toEqual(p.colors.map((c) => c.hex));
    expect(back?.scene).toBe('home');
    expect(back?.harmony).toBe('triadic');
  });

  it('token 里的 URL 安全字符', () => {
    const token = encodeShare(makePalette());
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('损坏或非法 token 返回 null', () => {
    expect(decodeShare('')).toBeNull();
    expect(decodeShare('not-base64-$$$')).toBeNull();
    expect(decodeShare('YWJj')).toBeNull();
  });

  it('深色成对会随分享一起往返', () => {
    const p = generatePalettes({
      baseHex: '#4A6CF7',
      scene: 'web',
      style: 'none',
      mood: 'none',
      harmony: 'auto',
      pair: true,
      seed: 3,
      count: 1,
      now: 1,
    })[0];
    const back = decodeShare(encodeShare(p));
    expect(back?.dark?.map((c) => c.hex)).toEqual(p.dark?.map((c) => c.hex));
    expect(back?.darkA11y?.textOnBg).toBeGreaterThan(0);
  });
});
