import { describe, expect, it } from 'vitest';
import { rgbToCmyk, cmykLabel } from '../../src/core/cmyk';
import {
  GRADIENT_PRESETS,
  buildGradientCss,
  conicLut,
  conicStartRad,
  gradientTextSuggestion,
  linearGradientLine,
  normalizeGradient,
  radialGradientRadius,
  randomGradientSpec,
  reverseStops,
  stopColorAt,
} from '../../src/core/gradient';
import type { GradientSpec } from '../../src/core/gradient';

const spec: GradientSpec = {
  type: 'linear',
  angle: 135,
  stops: [
    { id: 'a', hex: '#4A6CF7', pos: 0 },
    { id: 'b', hex: '#E8A33D', pos: 50 },
    { id: 'c', hex: '#2FA36B', pos: 100 },
  ],
};

describe('CMYK 近似', () => {
  it('黑白边界正确', () => {
    expect(rgbToCmyk('#FFFFFF')).toEqual({ c: 0, m: 0, y: 0, k: 0 });
    expect(rgbToCmyk('#000000')).toEqual({ c: 0, m: 0, y: 0, k: 100 });
  });

  it('彩色值在 0–100 之间', () => {
    const v = rgbToCmyk('#E53935');
    for (const n of [v.c, v.m, v.y, v.k]) {
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(100);
    }
    expect(cmykLabel('#E53935')).toMatch(/^C\d+ M\d+ Y\d+ K\d+$/);
  });
});

describe('渐变', () => {
  it('线性 CSS 含角度与停靠点', () => {
    const css = buildGradientCss(spec);
    expect(css).toContain('linear-gradient(135deg');
    expect(css).toContain('#4A6CF7 0%');
    expect(css).toContain('#2FA36B 100%');
  });

  it('径向与锥形语法不同', () => {
    expect(buildGradientCss({ ...spec, type: 'radial' })).toContain('radial-gradient');
    expect(buildGradientCss({ ...spec, type: 'conic' })).toContain('conic-gradient');
  });

  it('停靠点排序并夹紧到 0–100', () => {
    const normalized = normalizeGradient({
      ...spec,
      stops: [
        { id: 'a', hex: '#000000', pos: 120 },
        { id: 'b', hex: '#FFFFFF', pos: -10 },
      ],
    });
    expect(normalized.stops[0].pos).toBe(0);
    expect(normalized.stops[1].pos).toBe(100);
  });

  it('文字建议给出可用对比度', () => {
    const suggestion = gradientTextSuggestion(spec);
    expect(['#FFFFFF', '#17171A']).toContain(suggestion.color);
    expect(suggestion.min).toBeGreaterThan(0);
  });
});

describe('渐变几何与交互', () => {
  it('线性渐变线符合 CSS 角度约定', () => {
    const h = linearGradientLine(1200, 800, 90);
    expect(h.x0).toBeCloseTo(0, 6);
    expect(h.x1).toBeCloseTo(1200, 6);
    expect(h.y0).toBeCloseTo(400, 6);
    expect(h.y1).toBeCloseTo(400, 6);
    const v = linearGradientLine(1200, 800, 0);
    expect(v.x0).toBeCloseTo(600, 6);
    expect(v.x1).toBeCloseTo(600, 6);
    expect(v.y0).toBeCloseTo(800, 6);
    expect(v.y1).toBeCloseTo(0, 6);
    const l135 = linearGradientLine(1200, 800, 135);
    expect(l135.x1).toBeGreaterThan(l135.x0);
    expect(l135.y1).toBeGreaterThan(l135.y0);
  });

  it('径向半径为 farthest-corner', () => {
    expect(radialGradientRadius(1200, 800, 50, 50)).toBeCloseTo(Math.hypot(600, 400), 5);
    expect(radialGradientRadius(1200, 800, 0, 0)).toBeCloseTo(Math.hypot(1200, 800), 5);
  });

  it('锥形起始角相对 canvas 偏移 90 度', () => {
    expect(conicStartRad(90)).toBeCloseTo(0, 10);
    expect(conicStartRad(0)).toBeCloseTo(-Math.PI / 2, 10);
  });

  it('中心点写入径向与锥形 CSS', () => {
    expect(buildGradientCss({ ...spec, type: 'radial', cx: 30, cy: 40 })).toContain('circle at 30% 40%');
    expect(buildGradientCss({ ...spec, type: 'conic', cx: 30, cy: 40 })).toContain('at 30% 40%');
    const clamped = normalizeGradient({ ...spec, cx: 130, cy: -20 });
    expect(clamped.cx).toBe(100);
    expect(clamped.cy).toBe(0);
  });

  it('色标插值、反转与查找表', () => {
    const stops = [
      { id: 'a', hex: '#000000', pos: 0 },
      { id: 'b', hex: '#FFFFFF', pos: 100 },
    ];
    expect(stopColorAt(stops, 50)).toBe('#808080');
    expect(stopColorAt(stops, -5)).toBe('#000000');
    expect(stopColorAt(stops, 120)).toBe('#FFFFFF');
    expect(reverseStops(stops).map((s) => s.pos)).toEqual([100, 0]);
    expect(conicLut(stops, 8)).toHaveLength(24);
  });

  it('预设与随机规格合法', () => {
    expect(GRADIENT_PRESETS).toHaveLength(6);
    for (const preset of GRADIENT_PRESETS) {
      const n = normalizeGradient(preset.spec);
      expect(n.stops.length).toBeGreaterThanOrEqual(2);
      for (const s of n.stops) expect(s.hex).toMatch(/^#[0-9A-F]{6}$/);
    }
    let seed = 42;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    const r = normalizeGradient(randomGradientSpec(rand));
    expect(r.stops.length).toBeGreaterThanOrEqual(2);
    expect(r.stops.length).toBeLessThanOrEqual(6);
    expect(r.stops[0].pos).toBe(0);
    expect(r.stops[r.stops.length - 1].pos).toBe(100);
  });
});
