import {
  conicLut,
  conicStartRad,
  gradientTextSuggestion,
  linearGradientLine,
  normalizeGradient,
  radialGradientRadius,
} from '../gradient';
import type { GradientSpec } from '../gradient';

export interface GradientExportSize {
  id: string;
  label: string;
  w: number;
  h: number;
}

export const GRADIENT_EXPORT_SIZES: GradientExportSize[] = [
  { id: 'landscape', label: '1200 × 800', w: 1200, h: 800 },
  { id: 'square', label: '1080 × 1080', w: 1080, h: 1080 },
  { id: 'wide', label: '1920 × 1080', w: 1920, h: 1080 },
  { id: 'story', label: '1080 × 1920', w: 1080, h: 1920 },
];

export interface GradientPngOptions {
  width?: number;
  height?: number;
  withText?: boolean;
}

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

function paintConicFallback(
  ctx: CanvasRenderingContext2D,
  spec: GradientSpec,
  w: number,
  h: number,
): void {
  const lut = conicLut(spec.stops);
  const lutSize = lut.length / 3;
  const px = ((spec.cx ?? 50) / 100) * w;
  const py = ((spec.cy ?? 50) / 100) * h;
  const image = ctx.createImageData(w, h);
  const data = image.data;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const deg = (Math.atan2(y - py, x - px) * 180) / Math.PI;
      const t = (((deg + 90 - spec.angle) % 360) + 360) % 360;
      const idx = Math.min(lutSize - 1, Math.round((t / 360) * (lutSize - 1))) * 3;
      const o = (y * w + x) * 4;
      data[o] = lut[idx];
      data[o + 1] = lut[idx + 1];
      data[o + 2] = lut[idx + 2];
      data[o + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
}

export async function renderGradientCanvas(
  input: GradientSpec,
  options: GradientPngOptions = {},
): Promise<HTMLCanvasElement | null> {
  const spec = normalizeGradient(input);
  const w = options.width ?? 1200;
  const h = options.height ?? 800;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* 字体就绪失败不影响渐变本体 */
    }
  }

  let gradient: CanvasGradient | null = null;
  if (spec.type === 'linear') {
    const line = linearGradientLine(w, h, spec.angle);
    gradient = ctx.createLinearGradient(line.x0, line.y0, line.x1, line.y1);
  } else if (spec.type === 'radial') {
    const px = ((spec.cx ?? 50) / 100) * w;
    const py = ((spec.cy ?? 50) / 100) * h;
    gradient = ctx.createRadialGradient(px, py, 0, px, py, radialGradientRadius(w, h, spec.cx ?? 50, spec.cy ?? 50));
  } else {
    const maker = (ctx as unknown as { createConicGradient?: (a: number, x: number, y: number) => CanvasGradient })
      .createConicGradient;
    if (typeof maker === 'function') {
      gradient = maker.call(ctx, conicStartRad(spec.angle), ((spec.cx ?? 50) / 100) * w, ((spec.cy ?? 50) / 100) * h);
    }
  }
  if (gradient) {
    for (const stop of spec.stops) gradient.addColorStop(stop.pos / 100, stop.hex);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  } else if (spec.type === 'conic') {
    paintConicFallback(ctx, spec, w, h);
  } else {
    return null;
  }

  if (options.withText !== false) {
    const scale = Math.min(w, h) / 800;
    const suggestion = gradientTextSuggestion(spec);
    ctx.fillStyle = suggestion.color;
    ctx.font = `700 ${Math.round(64 * scale)}px "PingFang SC", "Microsoft YaHei", system-ui, sans-serif`;
    ctx.fillText('把生活调成', 72 * scale, h / 2 - 24 * scale);
    ctx.fillText('喜欢的颜色', 72 * scale, h / 2 + 56 * scale);
    ctx.font = `${Math.round(18 * scale)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.globalAlpha = 0.82;
    ctx.fillText(spec.stops.map((s) => s.hex).join('  '), 76 * scale, h - 72 * scale);
    ctx.globalAlpha = 1;
  }
  return canvas;
}

export async function exportGradientPng(
  spec: GradientSpec,
  name: string,
  options: GradientPngOptions = {},
): Promise<boolean> {
  const canvas = await renderGradientCanvas(spec, options);
  if (!canvas) return false;
  return new Promise<boolean>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, name);
      resolve(Boolean(blob));
    }, 'image/png');
  });
}

export function gradientCssFile(css: string): string {
  return `.gradient {\n  background: ${css};\n}\n`;
}