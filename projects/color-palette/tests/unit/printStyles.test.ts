import { describe, expect, it } from 'vitest';
import { PRINT_STYLES, ratioWidths, ticketGrid } from '../../src/core/lifeSheets';

describe('打印版式定义', () => {
  it('四种版式 id 唯一且含默认经典清单', () => {
    const ids = PRINT_STYLES.map((s) => s.id);
    expect(ids).toEqual(['list', 'poster', 'tickets', 'ratio']);
    expect(new Set(ids).size).toBe(4);
    for (const s of PRINT_STYLES) {
      expect(s.label.length).toBeGreaterThan(0);
      expect(s.desc.length).toBeGreaterThan(0);
    }
  });
});

describe('ratioWidths', () => {
  it('宽度之和精确等于总宽', () => {
    const widths = ratioWidths([30, 25, 20, 15, 6, 4], 1088);
    expect(widths.reduce((a, b) => a + b, 0)).toBe(1088);
    expect(widths.every((w) => w >= 0)).toBe(true);
  });

  it('占比越大宽度越大', () => {
    const widths = ratioWidths([30, 25, 20, 15, 6, 4], 1088);
    for (let i = 1; i < widths.length; i += 1) {
      expect(widths[i - 1]).toBeGreaterThan(widths[i]);
    }
  });

  it('全零或负占比返回全零', () => {
    expect(ratioWidths([0, 0], 100)).toEqual([0, 0]);
    expect(ratioWidths([-3, -1], 100)).toEqual([0, 0]);
    expect(ratioWidths([1, 1], 0)).toEqual([0, 0]);
  });

  it('单一占比占满总宽', () => {
    expect(ratioWidths([7], 722)).toEqual([722]);
  });

  it('不能整除时余数分配后仍守恒', () => {
    const widths = ratioWidths([1, 1, 1], 10);
    expect(widths.reduce((a, b) => a + b, 0)).toBe(10);
    for (const w of widths) expect([3, 4]).toContain(w);
  });
});

describe('ticketGrid', () => {
  it('六色排成 2×3 且不超出可用区域', () => {
    const gap = 28;
    const { cols, rows, tw, th } = ticketGrid(6, 1088, 1434, gap);
    expect(cols).toBe(2);
    expect(rows).toBe(3);
    expect(tw).toBeGreaterThan(0);
    expect(th).toBeGreaterThan(0);
    expect(cols * tw + (cols - 1) * gap).toBeLessThanOrEqual(1088);
    expect(rows * th + (rows - 1) * gap).toBeLessThanOrEqual(1434);
  });

  it('奇数与单色也给出正尺寸', () => {
    expect(ticketGrid(5, 722, 920, 28).rows).toBe(3);
    const one = ticketGrid(1, 722, 920, 28);
    expect(one.rows).toBe(1);
    expect(one.th).toBe(920);
  });
});