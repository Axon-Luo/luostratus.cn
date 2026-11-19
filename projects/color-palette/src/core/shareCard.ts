import qrcode from 'qrcode-generator';
import { textOn } from './color/convert';
import { displayName, paletteSubtitle } from './export/exporters';
import { shareUrl } from './share';
import type { Palette } from './palette/types';
import type { ShareFormat } from './storage';

export interface ShareCardSpec {
  format: ShareFormat;
  theme: 'light' | 'dark';
  title: string;
  subtitle: string;
  date: string;
  showQr: boolean;
  includeHex: boolean;
  palette: Palette;
}

export const SHARE_FORMATS: Array<{ id: ShareFormat; label: string; hint: string }> = [
  { id: '3:4', label: '3:4', hint: '朋友圈 / 小红书' },
  { id: '9:16', label: '9:16', hint: '手机壁纸 / 故事' },
  { id: '16:9', label: '16:9', hint: '桌面壁纸 / 封面' },
];

const SIZES: Record<ShareFormat, { w: number; h: number }> = {
  '3:4': { w: 1080, h: 1440 },
  '9:16': { w: 1080, h: 1920 },
  '16:9': { w: 1920, h: 1080 },
};

export function shareCardSize(format: ShareFormat): { w: number; h: number } {
  return SIZES[format];
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}

function drawQr(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  fg: string,
  bg: string,
): void {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const count = qr.getModuleCount();
  const quiet = 4;
  const cell = size / (count + quiet * 2);
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = fg;
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (!qr.isDark(row, col)) continue;
      ctx.fillRect(x + (col + quiet) * cell, y + (row + quiet) * cell, Math.ceil(cell), Math.ceil(cell));
    }
  }
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 2,
): number {
  const chars = Array.from(text);
  let line = '';
  let lines = 0;
  let cursorY = y;
  for (const char of chars) {
    const next = line + char;
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      lines += 1;
      cursorY += lineHeight;
      line = char;
      if (lines >= maxLines) return cursorY;
    } else {
      line = next;
    }
  }
  if (line) {
    ctx.fillText(line, x, cursorY);
    cursorY += lineHeight;
  }
  return cursorY;
}

export async function renderShareCard(spec: ShareCardSpec): Promise<Blob> {
  const { w, h } = SIZES[spec.format];
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('当前浏览器不支持画布导出');
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* ignore */
    }
  }

  const dark = spec.theme === 'dark';
  const paper = dark ? '#111114' : '#F7F3EC';
  const ink = dark ? '#F4F1EA' : '#17171A';
  const muted = dark ? '#A9A49B' : '#6B675F';
  const line = dark ? 'rgba(244,241,234,0.14)' : 'rgba(23,23,26,0.12)';
  const pad = Math.round(Math.min(w, h) * 0.07);

  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, w, h);

  // 品牌行
  ctx.fillStyle = ink;
  ctx.font = '600 22px "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
  ctx.fillText('配色工坊', pad, pad + 6);
  ctx.fillStyle = muted;
  ctx.font = '16px "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
  ctx.fillText('生活调色盘 · COLIFE', pad + 92, pad + 5);

  ctx.textAlign = 'right';
  ctx.fillStyle = muted;
  ctx.font = '16px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText(spec.date, w - pad, pad + 5);
  ctx.textAlign = 'left';

  // 标题
  const titleTop = pad + Math.round(h * 0.07);
  ctx.fillStyle = ink;
  ctx.font = `700 ${spec.format === '16:9' ? 58 : 54}px "PingFang SC", "Microsoft YaHei", system-ui, sans-serif`;
  const titleBottom = wrapText(ctx, spec.title, pad, titleTop, w - pad * 2, spec.format === '16:9' ? 68 : 64, 2);

  ctx.fillStyle = muted;
  ctx.font = '22px "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
  wrapText(ctx, spec.subtitle, pad, titleBottom + 12, w - pad * 2, 30, 2);

  // 色条
  const paletteTop = Math.max(titleBottom + (spec.format === '9:16' ? 120 : 90), h * 0.28);
  const footerSpace = spec.showQr ? (spec.format === '16:9' ? 210 : 260) : 150;
  const paletteHeight = h - paletteTop - footerSpace - pad;
  const barGap = Math.max(8, Math.round(h * 0.008));
  const barHeight = (paletteHeight - barGap * 5) / 6;
  const barX = pad;
  const barW = w - pad * 2;

  spec.palette.colors.forEach((c, index) => {
    const y = paletteTop + index * (barHeight + barGap);
    ctx.fillStyle = c.hex;
    roundRect(ctx, barX, y, barW, barHeight, 12);
    ctx.fill();
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    ctx.stroke();

    const fg = textOn(c.hex);
    ctx.fillStyle = fg;
    ctx.font = `600 ${Math.round(barHeight * 0.3)}px "PingFang SC", "Microsoft YaHei", system-ui, sans-serif`;
    ctx.fillText(c.label, barX + 22, y + barHeight * 0.46);
    ctx.font = `${Math.round(barHeight * 0.22)}px "PingFang SC", "Microsoft YaHei", system-ui, sans-serif`;
    ctx.fillText(`${c.name} · ${c.ratio}%`, barX + 22, y + barHeight * 0.78);

    if (spec.includeHex) {
      ctx.textAlign = 'right';
      ctx.font = `${Math.round(barHeight * 0.3)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.fillText(c.hex, barX + barW - 22, y + barHeight * 0.62);
      ctx.textAlign = 'left';
    }
  });

  // 底部：二维码 + 品牌
  const bottom = h - pad;
  if (spec.showQr) {
    const qrSize = Math.min(180, Math.round(w * 0.17));
    const qrX = w - pad - qrSize;
    const qrY = bottom - qrSize;
    drawQr(ctx, shareUrl(spec.palette), qrX, qrY, qrSize, ink, paper);
    ctx.fillStyle = muted;
    ctx.font = '15px "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('扫码打开这套配色', qrX - 16, qrY + 24);
    ctx.fillText('可继续编辑与导出', qrX - 16, qrY + 46);
    ctx.textAlign = 'left';
  }

  ctx.fillStyle = ink;
  ctx.font = '600 18px "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
  ctx.fillText(displayName(spec.palette), pad, bottom - 34);
  ctx.fillStyle = muted;
  ctx.font = '15px "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
  ctx.fillText(paletteSubtitle(spec.palette), pad, bottom - 12);

  // 细分割线
  ctx.strokeStyle = line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, bottom - 58);
  ctx.lineTo(w - pad, bottom - 58);
  ctx.stroke();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('图片生成失败'));
    }, 'image/png');
  });
}

export function shareCardFileName(p: Palette, format: ShareFormat): string {
  const scene = p.scene;
  return `配色工坊-${displayName(p)}-${scene}-${format.replace(':', 'x')}.png`;
}
