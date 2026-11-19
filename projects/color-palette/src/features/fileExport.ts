import {
  displayName,
  exportFileName,
  paletteToCss,
  paletteToJson,
  paletteSubtitle,
  paletteToSvg,
} from '../core/export/exporters';
import type { Palette } from '../core/palette/types';
import { toast } from '../state';

export function downloadText(name: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function copyText(text: string, message = '已复制'): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      toast(message);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    toast(message);
    return true;
  } catch {
    toast('复制失败，请手动选择');
    return false;
  }
}

export async function exportPng(p: Palette): Promise<void> {
  const width = 900;
  const height = 520;
  const canvas = document.createElement('canvas');
  canvas.width = width * 2;
  canvas.height = height * 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    toast('当前浏览器不支持画布导出');
    return;
  }
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* ignore */
    }
  }
  ctx.scale(2, 2);

  ctx.fillStyle = '#FFFDF9';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#17171A';
  ctx.font = '600 30px "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
  ctx.fillText(displayName(p), 40, 62);

  ctx.fillStyle = '#6B6B66';
  ctx.font = '15px "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
  ctx.fillText(paletteSubtitle(p), 40, 92);

  const chipWidth = 124;
  const gap = 12;
  p.colors.forEach((c, i) => {
    const x = 40 + i * (chipWidth + gap);
    const radius = 8;
    ctx.fillStyle = c.hex;
    ctx.beginPath();
    ctx.roundRect?.(x, 118, chipWidth, 168, radius);
    if (!ctx.roundRect) ctx.rect(x, 118, chipWidth, 168);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.16)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#17171A';
    ctx.font = '16px "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
    ctx.fillText(`${c.name} ${c.label}`, x, 316);

    ctx.fillStyle = '#6B6B66';
    ctx.font = '14px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText(c.hex, x, 340);

    ctx.fillStyle = '#8A8A84';
    ctx.font = '12px "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
    ctx.fillText(`${c.ratio}%`, x, 360);
  });

  let cursor = 40;
  ctx.fillStyle = '#F0EDE6';
  ctx.fillRect(40, 398, 820, 14);
  p.colors.forEach((c) => {
    const w = (c.ratio / 100) * 820;
    ctx.fillStyle = c.hex;
    ctx.fillRect(cursor, 398, w, 14);
    cursor += w;
  });

  ctx.fillStyle = '#6B6B66';
  ctx.font = '14px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText(
    `文字/背景 ${p.a11y.textOnBg.toFixed(2)}:1 · APCA Lc ${p.a11y.apca.toFixed(1)}`,
    40,
    452,
  );

  ctx.fillStyle = '#8A8A84';
  ctx.font = '13px "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('配色工坊 · 生活调色盘', 860, 452);
  ctx.textAlign = 'left';

  await new Promise<void>((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        toast('图片生成失败');
        resolve();
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exportFileName(p, 'png');
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast('已导出 PNG 色卡');
      resolve();
    }, 'image/png');
  });
}

export function exportPalette(kind: 'css' | 'json' | 'svg' | 'png', p: Palette): void {
  if (kind === 'css') {
    downloadText(exportFileName(p, 'css'), paletteToCss(p), 'text/css');
    toast('已导出 CSS 变量');
  } else if (kind === 'json') {
    downloadText(exportFileName(p, 'json'), paletteToJson(p), 'application/json');
    toast('已导出 JSON');
  } else if (kind === 'svg') {
    downloadText(exportFileName(p, 'svg'), paletteToSvg(p), 'image/svg+xml');
    toast('已导出 SVG 色卡');
  } else {
    void exportPng(p);
  }
}
