import { auditReportHtml, auditReportMarkdown, buildAuditReport } from '../../core/export/auditReport';
import { displayName } from '../../core/export/exporters';
import type { Palette } from '../../core/palette/types';
import { toast } from '../../state';
import { Dialog } from '../../ui/Dialog';
import { copyText, downloadText } from '../fileExport';

export function AuditReportDialog(props: { open: boolean; palette: Palette; onClose: () => void }) {
  const report = buildAuditReport(props.palette);
  const failed = report.checks.filter((c) => !c.pass);

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      title="无障碍审计报告"
      wide
      footer={
        <>
          <span class="hint">
            {report.passed}/{report.total} 项通过 · {report.date}
          </span>
          <button
            type="button"
            class="btn ghost"
            onClick={() => copyText(auditReportMarkdown(props.palette, report), '报告 Markdown 已复制')}
          >
            复制 Markdown
          </button>
          <button
            type="button"
            class="btn primary"
            onClick={() => {
              downloadText(
                `配色工坊-无障碍审计-${displayName(props.palette)}.html`,
                auditReportHtml(props.palette, report),
                'text/html',
              );
              toast('审计报告已导出，可用浏览器打开或打印');
            }}
          >
            下载 HTML 报告
          </button>
        </>
      }
    >
      <p class="audit-summary">{report.summary}</p>

      <ul class="audit-list">
        {report.checks.map((c) => (
          <li key={c.id}>
            <span class="access-label">
              {c.label}
              <span class="audit-detail mono">{c.detail}</span>
            </span>
            <span class="mono">{c.value}</span>
            <span class={`badge ${c.pass ? 'ok' : 'bad'}`}>{c.pass ? '通过' : '未通过'}</span>
          </li>
        ))}
      </ul>

      {failed.length > 0 && (
        <>
          <h3 class="audit-subhead">整改建议</h3>
          <ul class="warn-list">
            {failed.map((c) => (
              <li key={c.id}>
                <strong>{c.label}</strong>：{c.advice}
              </li>
            ))}
          </ul>
        </>
      )}

      {report.notes.length > 0 && (
        <ul class="audit-notes">
          {report.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
