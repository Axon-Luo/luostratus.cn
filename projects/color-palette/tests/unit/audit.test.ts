import { describe, expect, it } from 'vitest';
import { generatePalettes } from '../../src/core/palette/generate';
import { auditReportHtml, auditReportMarkdown, buildAuditReport } from '../../src/core/export/auditReport';
import type { Palette } from '../../src/core/palette/types';

const base = generatePalettes({
  baseHex: '#4A6CF7',
  scene: 'web',
  style: 'none',
  mood: 'none',
  harmony: 'auto',
  seed: 5,
  count: 1,
  now: 1,
})[0];

const now = new Date(2026, 10, 18, 9, 30);

function failingPalette(): Palette {
  return {
    ...base,
    a11y: { ...base.a11y, textOnBg: 2.1, primaryOnBg: 1.4, secondaryOnBg: 5, accentOnBg: 4, apca: 30 },
  };
}

describe('无障碍审计报告', () => {
  it('默认包含 5 项检查，统计与结论一致', () => {
    const report = buildAuditReport(base, now);
    expect(report.total).toBe(5);
    expect(report.checks.map((c) => c.id)).toEqual(['text', 'primary', 'secondary', 'accent', 'apca']);
    expect(report.passed).toBe(report.checks.filter((c) => c.pass).length);
    expect(report.summary).toContain(`${report.passed}/${report.total} 项通过`);
    expect(report.date).toBe('2026-11-18 09:30');
    expect(report.notes.join('')).toContain('深色');
  });

  it('深色与色弱数据存在时追加对应检查', () => {
    const p: Palette = {
      ...base,
      darkA11y: { ...base.a11y, textOnBg: 8 },
      cvd: { protan: 12, deutan: 9, tritan: 20, safe: true },
    };
    const report = buildAuditReport(p, now);
    expect(report.total).toBe(7);
    expect(report.checks.some((c) => c.id === 'dark-text')).toBe(true);
    expect(report.checks.some((c) => c.id === 'cvd' && c.pass)).toBe(true);
    expect(report.notes).toHaveLength(0);
  });

  it('不达标项出现在整改建议中', () => {
    const p = failingPalette();
    const report = buildAuditReport(p, now);
    const failed = report.checks.filter((c) => !c.pass);
    expect(failed.map((c) => c.id)).toEqual(['text', 'primary', 'apca']);
    expect(report.summary).toContain('3 项待改进');

    const md = auditReportMarkdown(p, report);
    expect(md).toContain('## 整改建议');
    expect(md).toContain('**文字 / 背景**');
    expect(md).toContain('| 检查项 | 数值 | 标准 | 结果 |');

    const html = auditReportHtml(p, report);
    expect(html).toContain('整改建议');
    expect(html).toContain('未通过');
  });

  it('全部通过时不输出整改建议', () => {
    const p: Palette = {
      ...base,
      a11y: { ...base.a11y, textOnBg: 12, primaryOnBg: 5, secondaryOnBg: 4, accentOnBg: 3.5, apca: 95 },
    };
    const report = buildAuditReport(p, now);
    expect(report.passed).toBe(report.total);
    expect(auditReportMarkdown(p, report)).not.toContain('## 整改建议');
  });

  it('HTML 转义用户自定义名称', () => {
    const p: Palette = { ...base, customName: '<img src=x onerror=alert(1)>' };
    const html = auditReportHtml(p, buildAuditReport(p, now));
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x');
  });
});
