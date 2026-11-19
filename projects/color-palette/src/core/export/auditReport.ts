import type { Palette, Role } from '../palette/types';
import { displayName } from './exporters';

export interface AuditCheck {
  id: string;
  label: string;
  detail: string;
  value: string;
  target: string;
  pass: boolean;
  advice: string;
}

export interface AuditReport {
  name: string;
  date: string;
  checks: AuditCheck[];
  notes: string[];
  passed: number;
  total: number;
  summary: string;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDate(now: Date): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function buildAuditReport(p: Palette, now = new Date()): AuditReport {
  const hex = (role: Role): string => p.colors.find((c) => c.role === role)?.hex ?? '';
  const pair = (a: Role, b: Role): string => `${hex(a)} / ${hex(b)}`;
  const contrastAdvice = '加深前景色或提亮背景色，也可以在工作台点「一键修复」按最小改动调整';
  const checks: AuditCheck[] = [
    {
      id: 'text',
      label: '文字 / 背景',
      detail: pair('text', 'bg'),
      value: `${p.a11y.textOnBg.toFixed(2)}:1`,
      target: '≥ 4.5:1（WCAG AA 正文）',
      pass: p.a11y.textOnBg >= 4.5,
      advice: contrastAdvice,
    },
    {
      id: 'primary',
      label: '主色 / 背景',
      detail: pair('primary', 'bg'),
      value: `${p.a11y.primaryOnBg.toFixed(2)}:1`,
      target: '≥ 3:1（WCAG AA 图形与大字）',
      pass: p.a11y.primaryOnBg >= 3,
      advice: '主色目前只宜装饰使用；要用于图标、按钮或大字，请拉大它与背景的明度差',
    },
    {
      id: 'secondary',
      label: '辅助色 / 背景',
      detail: pair('secondary', 'bg'),
      value: `${p.a11y.secondaryOnBg.toFixed(2)}:1`,
      target: '≥ 3:1（WCAG AA 图形与大字）',
      pass: p.a11y.secondaryOnBg >= 3,
      advice: '辅助色与背景过近，用于信息图形前请加深或改用文字色呈现',
    },
    {
      id: 'accent',
      label: '强调色 / 背景',
      detail: pair('accent', 'bg'),
      value: `${p.a11y.accentOnBg.toFixed(2)}:1`,
      target: '≥ 3:1（WCAG AA 图形与大字）',
      pass: p.a11y.accentOnBg >= 3,
      advice: '强调色对比不足，关键状态提示建议同时配合文字或图标，不只依赖颜色',
    },
    {
      id: 'apca',
      label: 'APCA 正文可读性',
      detail: pair('text', 'bg'),
      value: `Lc ${p.a11y.apca.toFixed(1)}`,
      target: '≥ 75（正文）· ≥ 60（大字）',
      pass: p.a11y.apca >= 75,
      advice: '当前更适合大号文字；正文建议 Lc ≥ 75，可加深文字或提高背景明度',
    },
  ];

  const notes: string[] = [];
  if (p.darkA11y) {
    checks.push({
      id: 'dark-text',
      label: '深色版 文字 / 背景',
      detail: '深色成对方案',
      value: `${p.darkA11y.textOnBg.toFixed(2)}:1`,
      target: '≥ 4.5:1（WCAG AA 正文）',
      pass: p.darkA11y.textOnBg >= 4.5,
      advice: contrastAdvice,
    });
  } else {
    notes.push('未生成深色成对方案，深色模式未纳入检查；可在生成设置中开启「深色成对」');
  }

  if (p.cvd) {
    checks.push({
      id: 'cvd',
      label: '色弱可分辨性',
      detail: `红色盲 ΔE ${p.cvd.protan.toFixed(0)} · 绿色盲 ΔE ${p.cvd.deutan.toFixed(0)} · 蓝黄色盲 ΔE ${p.cvd.tritan.toFixed(0)}`,
      value: p.cvd.safe ? '可分辨' : '偏近',
      target: '三种模拟下主/辅/强调最小 ΔE ≥ 8',
      pass: p.cvd.safe,
      advice: '部分色觉下主色、辅助色、强调色过于接近，建议开启「色弱友好」重新生成，或调整其中一个颜色的色相',
    });
  } else {
    notes.push('未包含色弱模拟数据；可在生成设置中开启「色弱友好」后重新生成');
  }

  const passed = checks.filter((c) => c.pass).length;
  const failed = checks.filter((c) => !c.pass);
  const summary =
    failed.length === 0
      ? `${passed}/${checks.length} 项通过，全部检查达标，可以直接使用`
      : `${passed}/${checks.length} 项通过，${failed.length} 项待改进：${failed.map((c) => c.label).join('、')}`;

  return { name: displayName(p), date: formatDate(now), checks, notes, passed, total: checks.length, summary };
}

export function auditReportMarkdown(p: Palette, report = buildAuditReport(p)): string {
  const lines = [
    `# 无障碍审计报告 · ${report.name}`,
    '',
    `生成时间：${report.date}`,
    '',
    `**结论：${report.summary}**`,
    '',
    '| 检查项 | 数值 | 标准 | 结果 |',
    '| --- | --- | --- | --- |',
    ...report.checks.map((c) => `| ${c.label} | ${c.value} | ${c.target} | ${c.pass ? '通过' : '未通过'} |`),
  ];

  const failed = report.checks.filter((c) => !c.pass);
  if (failed.length) {
    lines.push('', '## 整改建议', ...failed.map((c) => `- **${c.label}**（${c.value}）：${c.advice}`));
  }
  if (report.notes.length) {
    lines.push('', '## 说明', ...report.notes.map((n) => `- ${n}`));
  }
  lines.push('', '## 色板', ...p.colors.map((c) => `- ${c.label} ${c.hex}（占比 ${c.ratio}%）`));
  lines.push('', '---', '由配色工坊生成，检测基于 WCAG 2.2 与 APCA');
  return lines.join('\n');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function auditReportHtml(p: Palette, report = buildAuditReport(p)): string {
  const e = escapeHtml;
  const rows = report.checks
    .map(
      (c) => `<tr>
  <td><strong>${e(c.label)}</strong><br><span class="detail">${e(c.detail)}</span></td>
  <td class="mono">${e(c.value)}</td>
  <td>${e(c.target)}</td>
  <td><span class="badge ${c.pass ? 'ok' : 'bad'}">${c.pass ? '通过' : '未通过'}</span></td>
</tr>`,
    )
    .join('\n');
  const failed = report.checks.filter((c) => !c.pass);
  const advice = failed.length
    ? `<h2>整改建议</h2>
<ul>${failed.map((c) => `<li><strong>${e(c.label)}</strong>（${e(c.value)}）：${e(c.advice)}</li>`).join('\n')}</ul>`
    : '';
  const notes = report.notes.length
    ? `<h2>说明</h2>
<ul>${report.notes.map((n) => `<li>${e(n)}</li>`).join('\n')}</ul>`
    : '';
  const swatches = p.colors
    .map(
      (c) => `<div class="sw"><i style="background:${e(c.hex)}"></i><span>${e(c.label)}</span><span class="mono">${e(c.hex)}</span></div>`,
    )
    .join('\n');

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>无障碍审计报告 · ${e(report.name)}</title>
<style>
  body { font-family: "PingFang SC", "Microsoft YaHei", system-ui, sans-serif; margin: 40px auto; max-width: 880px; padding: 0 20px; color: #17171a; background: #fffdf9; line-height: 1.7; }
  h1 { font-size: 24px; margin-bottom: 4px; }
  h2 { font-size: 17px; margin-top: 28px; }
  .meta { color: #6b675f; font-size: 13px; }
  .summary { background: #f4efe6; border-radius: 10px; padding: 12px 16px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; }
  th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #e7e0d3; vertical-align: top; }
  th { color: #6b675f; font-weight: 500; font-size: 13px; }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  .detail { color: #8a867e; font-size: 12px; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; }
  .badge.ok { background: #e3f0e4; color: #256b34; }
  .badge.bad { background: #fbe4df; color: #a13a24; }
  .swatches { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 12px; }
  .sw { display: flex; flex-direction: column; font-size: 12px; gap: 2px; }
  .sw i { width: 84px; height: 56px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.12); }
  footer { margin-top: 32px; color: #8a867e; font-size: 12px; border-top: 1px solid #e7e0d3; padding-top: 12px; }
  @media print { body { margin: 0; background: #fff; } }
</style>
</head>
<body>
<h1>无障碍审计报告 · ${e(report.name)}</h1>
<p class="meta">生成时间：${e(report.date)} · 配色工坊</p>
<p class="summary">${e(report.summary)}</p>
<table>
<thead><tr><th>检查项</th><th>数值</th><th>标准</th><th>结果</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>
${advice}
${notes}
<h2>色板</h2>
<div class="swatches">
${swatches}
</div>
<footer>检测基于 WCAG 2.2 对比度、APCA 可读性与色觉模拟（ΔE2000），结果供设计参考</footer>
</body>
</html>
`;
}
