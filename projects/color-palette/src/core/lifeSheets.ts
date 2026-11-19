import { textOn } from './color/convert';
import { contrastRatio } from './color/contrast';
import { cmykLabel } from './cmyk';
import { displayName } from './export/exporters';
import type { Palette } from './palette/types';
import { buildRoomSchemes } from './lifePlans';
import type { OutfitDay, RoomScheme } from './lifePlans';

const PAPER = '#F7F3EC';
const INK = '#17171A';
const MUTED = '#6B675F';
const LINE = 'rgba(23,23,26,0.14)';
const CJK = '"PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

function canvasOf(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('当前浏览器不支持画布');
  return [canvas, ctx];
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 3,
): number {
  const chars = Array.from(text);
  let line = '';
  let lines = 0;
  let cursor = y;
  for (const char of chars) {
    const next = line + char;
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line, x, cursor);
      lines += 1;
      cursor += lineHeight;
      line = char;
      if (lines >= maxLines) return cursor;
    } else {
      line = next;
    }
  }
  if (line) {
    ctx.fillText(line, x, cursor);
    cursor += lineHeight;
  }
  return cursor;
}

function blobOf(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('图片生成失败'))), 'image/png');
  });
}

async function fontsReady(): Promise<void> {
  if (!document.fonts?.ready) return;
  try {
    await document.fonts.ready;
  } catch {
    /* ignore */
  }
}

export async function renderOutfitImage(days: OutfitDay[], subtitle: string): Promise<Blob> {
  await fontsReady();
  const width = 1080;
  const height = 1920;
  const [canvas, ctx] = canvasOf(width, height);
  const pad = 64;
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = INK;
  ctx.font = `700 46px ${CJK}`;
  ctx.fillText('一周穿搭', pad, 100);
  ctx.fillStyle = MUTED;
  ctx.font = `18px ${CJK}`;
  ctx.fillText(subtitle, pad, 134);

  const rowHeight = 216;
  const top = 178;
  days.forEach((day, index) => {
    const y = top + index * rowHeight;
    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, pad, y, width - pad * 2, rowHeight - 18, 14);
    ctx.fill();
    ctx.strokeStyle = LINE;
    ctx.stroke();

    ctx.fillStyle = INK;
    ctx.font = `600 22px ${CJK}`;
    ctx.fillText(`周${'一二三四五六日'[index]}`, pad + 24, y + 38);

    const chips = [
      { label: '上装', hex: day.top },
      { label: '下装', hex: day.bottom },
      { label: '鞋包', hex: day.shoes },
    ];
    chips.forEach((chip, i) => {
      const x = pad + 130 + i * 210;
      ctx.fillStyle = chip.hex;
      ctx.fillRect(x, y + 18, 190, 78);
      ctx.fillStyle = textOn(chip.hex);
      ctx.font = `12px ${CJK}`;
      ctx.fillText(chip.label, x + 10, y + 38);
      ctx.font = `11px ${MONO}`;
      ctx.fillText(chip.hex, x + 10, y + 80);
    });

    ctx.fillStyle = MUTED;
    ctx.font = `14px ${CJK}`;
    wrap(ctx, day.note, pad + 24, y + 132, width - pad * 2 - 48, 22, 2);
  });

  ctx.fillStyle = MUTED;
  ctx.font = `13px ${CJK}`;
  ctx.fillText('配色工坊 · 生活调色盘', pad, height - 52);
  return blobOf(canvas);
}

export async function renderRoomImage(scheme: RoomScheme): Promise<Blob> {
  await fontsReady();
  const width = 1240;
  const height = 1754;
  const [canvas, ctx] = canvasOf(width, height);
  const pad = 76;
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = INK;
  ctx.font = `700 44px ${CJK}`;
  ctx.fillText('房间刷色清单', pad, 104);
  ctx.fillStyle = MUTED;
  ctx.font = `17px ${CJK}`;
  ctx.fillText(`${scheme.name}方案 · ${displayName(scheme.palette)}`, pad, 138);

  // 简易房间示意
  const roomTop = 190;
  const roomH = 360;
  ctx.fillStyle = scheme.surfaces[0].hex;
  ctx.fillRect(pad, roomTop, width - pad * 2, roomH);
  ctx.fillStyle = scheme.surfaces[1].hex;
  ctx.fillRect(pad, roomTop + roomH - 80, width - pad * 2, 80);
  ctx.fillStyle = scheme.surfaces[2].hex;
  ctx.fillRect(pad + 110, roomTop + 200, 300, 120);
  ctx.fillStyle = scheme.surfaces[3].hex;
  ctx.fillRect(width - pad - 210, roomTop + 20, 150, 280);
  ctx.fillStyle = scheme.surfaces[4].hex;
  ctx.fillRect(pad + 480, roomTop + 220, 90, 80);
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.strokeRect(pad, roomTop, width - pad * 2, roomH);

  let y = roomTop + roomH + 60;
  ctx.fillStyle = INK;
  ctx.font = `600 24px ${CJK}`;
  ctx.fillText('面积分配', pad, y);
  y += 36;

  scheme.surfaces.forEach((surface) => {
    ctx.fillStyle = surface.hex;
    ctx.fillRect(pad, y, 86, 52);
    ctx.strokeStyle = LINE;
    ctx.strokeRect(pad, y, 86, 52);
    ctx.fillStyle = INK;
    ctx.font = `18px ${CJK}`;
    ctx.fillText(surface.label, pad + 110, y + 24);
    ctx.fillStyle = MUTED;
    ctx.font = `14px ${MONO}`;
    ctx.fillText(`${surface.hex} · ${surface.area}%`, pad + 110, y + 46);
    y += 74;
  });

  ctx.fillStyle = MUTED;
  ctx.font = `13px ${CJK}`;
  wrap(
    ctx,
    '小面积先试：抱枕、窗帘、床品比整面墙更容易验证，CMYK 近似值仅供沟通，正式印刷请打样',
    pad,
    y + 18,
    width - pad * 2,
    22,
    2,
  );
  ctx.fillText('配色工坊 · 生活调色盘', pad, height - 52);
  return blobOf(canvas);
}

export const CARD_STYLES = [
  { id: 'classic', label: '经典', desc: '上下色条 + 六色块' },
  { id: 'minimal', label: '极简', desc: '大留白 + 细线' },
  { id: 'editorial', label: '杂志', desc: '大色块 + 分栏' },
  { id: 'gradient', label: '渐变', desc: '双色渐变 + 白字' },
  { id: 'film', label: '胶片', desc: '深色边框 + 拍立得' },
] as const;

export type CardStyle = (typeof CARD_STYLES)[number]['id'];

export async function renderCardImage(options: {
  title: string;
  to: string;
  message: string;
  palette: Palette;
  style?: CardStyle;
}): Promise<Blob> {
  await fontsReady();
  const width = 1080;
  const height = 1440;
  const [canvas, ctx] = canvasOf(width, height);
  const p = options.palette;
  const map = Object.fromEntries(p.colors.map((c) => [c.role, c.hex]));
  const bg = map.bg ?? '#F7F3EC';
  const primary = map.primary ?? '#4A6CF7';
  const accent = map.accent ?? '#E8A33D';
  const surface = map.surface ?? '#FFFFFF';
  const ink = textOn(bg) === '#FFFFFF' ? '#FFFFFF' : INK;
  const pad = 84;
  const style = options.style ?? 'classic';
  const message = options.message || '愿你今天看到喜欢的颜色';
  const to = options.to || '你';

  if (style === 'minimal') {
    const paperInk = textOn(surface) === '#FFFFFF' ? '#FFFFFF' : INK;
    const paperMuted = paperInk === '#FFFFFF' ? 'rgba(255,255,255,0.68)' : MUTED;
    ctx.fillStyle = surface;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = primary;
    ctx.fillRect(0, 0, width, 8);
    ctx.fillStyle = INK;
    ctx.font = `600 14px ${MONO}`;
    ctx.fillText('COLORLIFE / HANDMADE CARD', pad, 100);
    ctx.fillStyle = INK;
    ctx.font = `700 78px ${CJK}`;
    ctx.fillText(options.title, pad, 235);
    ctx.fillStyle = MUTED;
    ctx.font = `24px ${CJK}`;
    ctx.fillText(`给 ${to}`, pad, 292);
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, 350);
    ctx.lineTo(width - pad, 350);
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.font = `30px ${CJK}`;
    wrap(ctx, message, pad, 430, width - pad * 2, 52, 7);
    const barY = height - 280;
    p.colors.forEach((color, index) => {
      ctx.fillStyle = color.hex;
      ctx.fillRect(pad + index * 144, barY, 112, 10);
      ctx.fillStyle = MUTED;
      ctx.font = `11px ${MONO}`;
      ctx.fillText(color.role.slice(0, 2).toUpperCase(), pad + index * 144, barY + 32);
    });
    ctx.fillStyle = MUTED;
    ctx.font = `14px ${MONO}`;
    ctx.fillText('把生活调成喜欢的颜色 / ' + new Date().getFullYear(), pad, height - 130);
    return blobOf(canvas);
  }

  if (style === 'editorial') {
    ctx.fillStyle = primary;
    ctx.fillRect(0, 0, width, 470);
    const headInk = textOn(primary) === '#FFFFFF' ? '#FFFFFF' : INK;
    ctx.fillStyle = headInk;
    ctx.globalAlpha = 0.72;
    ctx.font = `600 14px ${MONO}`;
    ctx.fillText('COLOR STORY / ISSUE 01', pad, 96);
    ctx.globalAlpha = 1;
    ctx.font = `800 88px ${CJK}`;
    ctx.fillText(options.title, pad, 235);
    ctx.font = `24px ${CJK}`;
    ctx.fillText(`给 ${to}`, pad, 310);
    ctx.fillStyle = accent;
    ctx.fillRect(pad, 355, 120, 6);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 470, width, height - 470);
    ctx.fillStyle = INK;
    ctx.font = `30px ${CJK}`;
    wrap(ctx, message, pad, 590, width - pad * 2, 52, 7);
    const startY = 880;
    p.colors.forEach((color, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = pad + col * 300;
      const y = startY + row * 190;
      ctx.fillStyle = color.hex;
      ctx.fillRect(x, y, 260, 130);
      ctx.fillStyle = MUTED;
      ctx.font = `11px ${MONO}`;
      ctx.fillText(color.hex, x, y + 156);
    });
    ctx.fillStyle = MUTED;
    ctx.font = `14px ${CJK}`;
    ctx.fillText('配色工坊 · 生活调色盘', pad, height - 90);
    return blobOf(canvas);
  }

  if (style === 'gradient') {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, primary);
    grad.addColorStop(1, accent);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.28)';
    ctx.shadowBlur = 22;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `600 14px ${MONO}`;
    ctx.fillText('COLORLIFE / GRADIENT CARD', pad, 104);
    ctx.font = `800 94px ${CJK}`;
    ctx.fillText(options.title, pad, 265);
    ctx.font = `26px ${CJK}`;
    ctx.fillText(`给 ${to}`, pad, 330);
    ctx.font = `28px ${CJK}`;
    ctx.globalAlpha = 0.92;
    wrap(ctx, message, pad, 455, width - pad * 2, 50, 7);
    ctx.restore();
    const cardY = height - 330;
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    roundRect(ctx, pad, cardY, width - pad * 2, 150, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.stroke();
    p.colors.forEach((color, index) => {
      ctx.fillStyle = color.hex;
      ctx.fillRect(pad + 24 + index * 142, cardY + 26, 112, 70);
      ctx.fillStyle = 'rgba(255,255,255,0.86)';
      ctx.font = `10px ${MONO}`;
      ctx.fillText(color.hex, pad + 24 + index * 142, cardY + 116);
    });
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = `14px ${MONO}`;
    ctx.fillText('把生活调成喜欢的颜色', pad, height - 96);
    return blobOf(canvas);
  }

  if (style === 'film') {
    ctx.fillStyle = '#08080A';
    ctx.fillRect(0, 0, width, height);
    for (let y = 90; y < height - 60; y += 64) {
      ctx.fillStyle = 'rgba(255,255,255,0.72)';
      ctx.fillRect(28, y, 26, 32);
      ctx.fillRect(width - 54, y, 26, 32);
    }
    ctx.fillStyle = bg;
    ctx.fillRect(82, 96, width - 164, 1248);
    ctx.strokeStyle = 'rgba(255,255,255,0.24)';
    ctx.strokeRect(82, 96, width - 164, 1248);
    const filmInk = textOn(bg) === '#FFFFFF' ? '#FFFFFF' : INK;
    const filmMuted = filmInk === '#FFFFFF' ? 'rgba(255,255,255,0.62)' : MUTED;
    ctx.fillStyle = filmInk;
    ctx.font = `600 13px ${MONO}`;
    ctx.fillText('35MM · COLOR STUDY', 130, 160);
    ctx.font = `800 78px ${CJK}`;
    ctx.fillText(options.title, 130, 275);
    ctx.fillStyle = MUTED;
    ctx.font = `23px ${CJK}`;
    ctx.fillText(`给 ${to}`, 130, 332);
    ctx.fillStyle = INK;
    ctx.font = `29px ${CJK}`;
    wrap(ctx, message, 130, 430, width - 260, 50, 8);
    ctx.fillStyle = primary;
    ctx.fillRect(130, 990, width - 260, 4);
    p.colors.forEach((color, index) => {
      ctx.fillStyle = color.hex;
      ctx.fillRect(130 + index * 132, 1020, 108, 74);
    });
    ctx.fillStyle = MUTED;
    ctx.font = `12px ${MONO}`;
    ctx.fillText('LIFEHACK / ' + new Date().getFullYear(), 130, 1180);
    return blobOf(canvas);
  }

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = primary;
  ctx.fillRect(0, 0, width, 18);
  ctx.fillStyle = accent;
  ctx.fillRect(0, height - 18, width, 18);

  ctx.fillStyle = ink;
  ctx.font = `600 18px ${CJK}`;
  ctx.fillText('配色工坊 · 手工贺卡', pad, 100);

  ctx.font = `700 72px ${CJK}`;
  ctx.fillText(options.title, pad, 250);
  ctx.font = `24px ${CJK}`;
  ctx.fillText(`给 ${to}`, pad, 306);

  ctx.font = `30px ${CJK}`;
  wrap(ctx, message, pad, 430, width - pad * 2, 50, 7);

  const swatchY = height - 300;
  p.colors.forEach((color, index) => {
    ctx.fillStyle = color.hex;
    ctx.fillRect(pad + index * 140, swatchY, 112, 72);
    ctx.strokeStyle = 'rgba(0,0,0,0.16)';
    ctx.strokeRect(pad + index * 140, swatchY, 112, 72);
  });

  ctx.fillStyle = ink;
  ctx.font = `14px ${CJK}`;
  ctx.globalAlpha = 0.72;
  ctx.fillText('把生活调成喜欢的颜色', pad, height - 150);
  ctx.globalAlpha = 1;
  return blobOf(canvas);
}

export type PrintSheet = 'swatches' | 'room';
export type PrintSize = 'A4' | 'A5';

export const PRINT_STYLES = [
  { id: 'list', label: '经典清单', desc: '左色块 + 名称 / 色值 / 占比 / CMYK' },
  { id: 'poster', label: '大色块海报', desc: '整页色带，文字按底色自动反色' },
  { id: 'tickets', label: '网格色票', desc: '2×3 圆角色票，可剪开随身携带' },
  { id: 'ratio', label: '比例条', desc: '按占比分割的横条 + 明细' },
] as const;

export type PrintStyle = (typeof PRINT_STYLES)[number]['id'];

export function ratioWidths(ratios: number[], total: number): number[] {
  const safe = ratios.map((r) => Math.max(0, r));
  const sum = safe.reduce((a, b) => a + b, 0);
  if (sum <= 0 || total <= 0) return safe.map(() => 0);
  const exact = safe.map((r) => (r / sum) * total);
  const widths = exact.map((v) => Math.floor(v));
  let left = total - widths.reduce((a, b) => a + b, 0);
  const order = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (const { i } of order) {
    if (left <= 0) break;
    widths[i] += 1;
    left -= 1;
  }
  return widths;
}

export function ticketGrid(count: number, areaW: number, areaH: number, gap: number) {
  const cols = 2;
  const rows = Math.max(1, Math.ceil(count / cols));
  const tw = Math.floor((areaW - gap * (cols - 1)) / cols);
  const th = Math.floor((areaH - gap * (rows - 1)) / rows);
  return { cols, rows, tw, th };
}

const SIZES: Record<PrintSize, { w: number; h: number }> = {
  A4: { w: 1240, h: 1754 },
  A5: { w: 874, h: 1240 },
};

function cropMarks(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const m = 28;
  const len = 22;
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1;
  const corners = [
    [m, m, 1, 1],
    [w - m, m, -1, 1],
    [m, h - m, 1, -1],
    [w - m, h - m, -1, -1],
  ];
  for (const [x, y, dx, dy] of corners) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len * dx, y);
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + len * dy);
    ctx.stroke();
  }
}

const PRINT_TOP = 180;
const PRINT_BOTTOM_RESERVE = 140;

function drawPrintList(ctx: CanvasRenderingContext2D, p: Palette, pad: number, size: PrintSize) {
  let y = PRINT_TOP;
  const block = size === 'A4' ? 206 : 168;
  for (const color of p.colors) {
    ctx.fillStyle = color.hex;
    ctx.fillRect(pad, y, 150, block - 26);
    ctx.strokeStyle = LINE;
    ctx.strokeRect(pad, y, 150, block - 26);
    ctx.fillStyle = INK;
    ctx.font = `600 19px ${CJK}`;
    ctx.fillText(`${color.label} · ${color.name}`, pad + 172, y + 30);
    ctx.fillStyle = MUTED;
    ctx.font = `15px ${MONO}`;
    ctx.fillText(color.hex, pad + 172, y + 58);
    ctx.font = `13px ${CJK}`;
    ctx.fillText(`占比 ${color.ratio}% · ${cmykLabel(color.hex)}`, pad + 172, y + 84);
    y += block;
  }
}

function drawPrintPoster(
  ctx: CanvasRenderingContext2D,
  p: Palette,
  w: number,
  h: number,
  pad: number,
  size: PrintSize,
) {
  const bandH = Math.floor((h - PRINT_TOP - PRINT_BOTTOM_RESERVE) / p.colors.length);
  const innerW = w - pad * 2;
  p.colors.forEach((color, index) => {
    const y = PRINT_TOP + index * bandH;
    ctx.fillStyle = color.hex;
    ctx.fillRect(pad, y, innerW, bandH - 6);
    ctx.fillStyle = textOn(color.hex);
    ctx.font = `600 ${size === 'A4' ? 24 : 20}px ${CJK}`;
    ctx.fillText(`${color.label} · ${color.name}`, pad + 28, y + bandH / 2 - 6);
    ctx.globalAlpha = 0.85;
    ctx.font = `${size === 'A4' ? 16 : 14}px ${MONO}`;
    ctx.fillText(`${color.hex} · 占比 ${color.ratio}%`, pad + 28, y + bandH / 2 + 26);
    ctx.textAlign = 'right';
    ctx.font = `${size === 'A4' ? 15 : 13}px ${CJK}`;
    ctx.fillText(cmykLabel(color.hex), w - pad - 28, y + bandH / 2 + 26);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  });
}

function drawPrintTickets(
  ctx: CanvasRenderingContext2D,
  p: Palette,
  w: number,
  h: number,
  pad: number,
  size: PrintSize,
) {
  const gap = 28;
  const areaH = h - PRINT_TOP - PRINT_BOTTOM_RESERVE;
  const { cols, tw, th } = ticketGrid(p.colors.length, w - pad * 2, areaH, gap);
  const bodyH = size === 'A4' ? 118 : 100;
  p.colors.forEach((color, index) => {
    const x = pad + (index % cols) * (tw + gap);
    const y = PRINT_TOP + Math.floor(index / cols) * (th + gap);
    roundRect(ctx, x, y, tw, th, 18);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.save();
    roundRect(ctx, x, y, tw, th, 18);
    ctx.clip();
    ctx.fillStyle = color.hex;
    ctx.fillRect(x, y, tw, th - bodyH);
    ctx.restore();
    roundRect(ctx, x, y, tw, th, 18);
    ctx.strokeStyle = LINE;
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.font = `600 ${size === 'A4' ? 19 : 16}px ${CJK}`;
    ctx.fillText(`${color.label} · ${color.name}`, x + 20, y + th - bodyH + 34);
    ctx.fillStyle = MUTED;
    ctx.font = `${size === 'A4' ? 15 : 13}px ${MONO}`;
    ctx.fillText(color.hex, x + 20, y + th - bodyH + 62);
    ctx.font = `${size === 'A4' ? 13 : 11}px ${CJK}`;
    ctx.fillText(`占比 ${color.ratio}% · ${cmykLabel(color.hex)}`, x + 20, y + th - bodyH + 88);
  });
}

function drawPrintRatio(
  ctx: CanvasRenderingContext2D,
  p: Palette,
  w: number,
  h: number,
  pad: number,
  size: PrintSize,
) {
  const barH = size === 'A4' ? 96 : 72;
  const widths = ratioWidths(
    p.colors.map((c) => c.ratio),
    w - pad * 2,
  );
  let x = pad;
  p.colors.forEach((color, index) => {
    const bw = widths[index];
    if (bw <= 0) return;
    ctx.fillStyle = color.hex;
    ctx.fillRect(x, PRINT_TOP, bw, barH);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, PRINT_TOP, bw, barH);
    ctx.lineWidth = 1;
    if (bw >= 80) {
      ctx.fillStyle = textOn(color.hex);
      ctx.font = `600 ${size === 'A4' ? 18 : 14}px ${MONO}`;
      ctx.textAlign = 'center';
      ctx.fillText(`${color.ratio}%`, x + bw / 2, PRINT_TOP + barH / 2 + 6);
      ctx.textAlign = 'left';
    }
    x += bw;
  });

  let y = PRINT_TOP + barH + 56;
  const rowH = Math.floor((h - PRINT_BOTTOM_RESERVE - y) / p.colors.length);
  for (const color of p.colors) {
    const sy = y + Math.floor((rowH - 56) / 2);
    roundRect(ctx, pad, sy, 56, 56, 10);
    ctx.fillStyle = color.hex;
    ctx.fill();
    ctx.strokeStyle = LINE;
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.font = `600 19px ${CJK}`;
    ctx.fillText(`${color.label} · ${color.name}`, pad + 78, sy + 24);
    ctx.fillStyle = MUTED;
    ctx.font = `15px ${MONO}`;
    ctx.fillText(`${color.hex} · ${cmykLabel(color.hex)}`, pad + 78, sy + 50);
    ctx.textAlign = 'right';
    ctx.fillStyle = INK;
    ctx.font = `600 ${size === 'A4' ? 26 : 22}px ${MONO}`;
    ctx.fillText(`${color.ratio}%`, w - pad, sy + 38);
    ctx.textAlign = 'left';
    y += rowH;
  }
}

export async function renderPrintSheet(
  p: Palette,
  sheet: PrintSheet,
  size: PrintSize,
  style: PrintStyle = 'list',
): Promise<Blob> {
  await fontsReady();
  const { w, h } = SIZES[size];
  const [canvas, ctx] = canvasOf(w, h);
  const pad = 76;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = INK;

  if (sheet === 'swatches') {
    const styleLabel = PRINT_STYLES.find((s) => s.id === style)?.label ?? '';
    ctx.font = `700 ${size === 'A4' ? 40 : 32}px ${CJK}`;
    ctx.fillText('配色色卡', pad, 100);
    ctx.fillStyle = MUTED;
    ctx.font = `15px ${CJK}`;
    ctx.fillText(`${displayName(p)} · ${styleLabel} · ${size} 150dpi`, pad, 128);

    if (style === 'poster') drawPrintPoster(ctx, p, w, h, pad, size);
    else if (style === 'tickets') drawPrintTickets(ctx, p, w, h, pad, size);
    else if (style === 'ratio') drawPrintRatio(ctx, p, w, h, pad, size);
    else drawPrintList(ctx, p, pad, size);

    ctx.fillStyle = MUTED;
    ctx.font = `12px ${CJK}`;
    ctx.fillText('CMYK 为近似值；正式印刷请以打样为准', pad, h - 72);
  } else {
    const scheme = buildRoomSchemes(p)[0];
    ctx.font = `700 ${size === 'A4' ? 40 : 32}px ${CJK}`;
    ctx.fillText('房间刷色清单', pad, 100);
    ctx.fillStyle = MUTED;
    ctx.font = `15px ${CJK}`;
    ctx.fillText(`${scheme.name}方案 · ${size} 150dpi`, pad, 128);

    let y = 180;
    for (const surface of scheme.surfaces) {
      ctx.fillStyle = surface.hex;
      ctx.fillRect(pad, y, 120, 70);
      ctx.strokeStyle = LINE;
      ctx.strokeRect(pad, y, 120, 70);
      ctx.fillStyle = INK;
      ctx.font = `600 18px ${CJK}`;
      ctx.fillText(surface.label, pad + 142, y + 28);
      ctx.fillStyle = MUTED;
      ctx.font = `14px ${MONO}`;
      ctx.fillText(`${surface.hex} · ${surface.area}%`, pad + 142, y + 54);
      y += 104;
    }
    ctx.fillStyle = MUTED;
    ctx.font = `12px ${CJK}`;
    wrap(ctx, '先从小面积试色；墙面大面积建议先刷一块 1m×1m 样板观察一天', pad, y + 18, w - pad * 2, 20, 2);
  }

  cropMarks(ctx, w, h);
  ctx.fillStyle = MUTED;
  ctx.font = `11px ${CJK}`;
  ctx.textAlign = 'right';
  ctx.fillText('配色工坊 · 生活调色盘', w - pad, h - 44);
  ctx.textAlign = 'left';
  return blobOf(canvas);
}

export function contrastLabel(p: Palette): string {
  return `${p.a11y.textOnBg.toFixed(2)}:1 · ${contrastRatio(p.colors[5].hex, p.colors[3].hex).toFixed(2)}:1`;
}
