import { buildSceneChecklist, checklistMarkdown } from '../../core/sceneChecklist';
import type { Palette } from '../../core/palette/types';
import { displayName } from '../../core/export/exporters';
import { toast } from '../../state';
import { Dialog } from '../../ui/Dialog';
import { copyText, downloadText } from '../fileExport';

function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

async function renderPng(p: Palette): Promise<Blob> {
  const items = buildSceneChecklist(p);
  const width = 1200;
  const block = 166;
  const height = 170 + items.length * block;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('当前浏览器不支持画布');
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* ignore */
    }
  }

  ctx.fillStyle = '#F7F3EC';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#17171A';
  ctx.font = '700 38px "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
  ctx.fillText(`场景清单 · ${displayName(p)}`, 48, 64);
  ctx.fillStyle = '#6B675F';
  ctx.font = '16px "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
  ctx.fillText(`文字/背景 ${p.a11y.textOnBg.toFixed(2)}:1 · APCA Lc ${p.a11y.apca.toFixed(1)}`, 48, 94);

  items.forEach((item, index) => {
    const top = 130 + index * block;
    ctx.fillStyle = '#17171A';
    ctx.font = '600 20px "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
    ctx.fillText(item.label, 48, top + 24);
    ctx.fillStyle = '#8A867E';
    ctx.font = '12px "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
    ctx.fillText(item.tip.slice(0, 48), 48, top + 44);

    item.rows.forEach((row, i) => {
      const x = 48 + i * 182;
      ctx.fillStyle = row.hex;
      ctx.fillRect(x, top + 56, 170, 48);
      ctx.strokeStyle = 'rgba(0,0,0,0.16)';
      ctx.strokeRect(x, top + 56, 170, 48);
      ctx.fillStyle = '#17171A';
      ctx.font = '11px "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
      ctx.fillText(`${row.label} ${row.hex}`, x, top + 118);
      ctx.fillStyle = '#6B675F';
      ctx.fillText(row.use.slice(0, 12), x, top + 134);
    });
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('图片生成失败'))), 'image/png');
  });
}

export function SceneChecklistDialog(props: {
  open: boolean;
  palette: Palette;
  onClose: () => void;
}) {
  const items = buildSceneChecklist(props.palette);
  const markdown = checklistMarkdown(props.palette, items);

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      title="场景清单"
      wide
      footer={
        <>
          <span class="hint">10 个场景 · 每个颜色怎么用</span>
          <button type="button" class="btn ghost" onClick={() => copyText(markdown, '清单已复制')}>
            复制 Markdown
          </button>
          <button
            type="button"
            class="btn ghost"
            onClick={() =>
              downloadText(`配色工坊-场景清单-${displayName(props.palette)}.md`, markdown, 'text/markdown')
            }
          >
            下载 MD
          </button>
          <button
            type="button"
            class="btn primary"
            onClick={async () => {
              try {
                const blob = await renderPng(props.palette);
                downloadBlob(blob, `配色工坊-场景清单-${displayName(props.palette)}.png`);
              } catch {
                toast('图片生成失败');
              }
            }}
          >
            下载 PNG
          </button>
        </>
      }
    >
      <div class="checklist">
        {items.map((item) => (
          <section class="checklist-scene" key={item.scene}>
            <header>
              <strong>{item.label}</strong>
              <span>{item.tip}</span>
            </header>
            <div class="checklist-rows">
              {item.rows.map((row) => (
                <div class="checklist-row" key={row.role}>
                  <i style={{ background: row.hex }} />
                  <span class="checklist-role">{row.label}</span>
                  <span class="checklist-use">{row.use}</span>
                  <span class="mono">{row.hex}</span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Dialog>
  );
}
