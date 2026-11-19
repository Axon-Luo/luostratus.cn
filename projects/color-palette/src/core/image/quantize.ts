import { clamp, oklchToHex, rgbToOklab, type RGB } from '../color/convert';
import { deltaE2000 } from '../color/distance';

interface Sample {
  L: number;
  a: number;
  b: number;
  weight: number;
}

function makeRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function labToHex(L: number, a: number, b: number): string {
  const chroma = Math.sqrt(a * a + b * b);
  let hue = (Math.atan2(b, a) * 180) / Math.PI;
  if (hue < 0) hue += 360;
  return oklchToHex({ l: clamp(L, 0, 1), c: chroma, h: hue });
}

export interface QuantizeOptions {
  k?: number;
  maxSamples?: number;
}

/**
 * 从像素数据提取主色：OKLab 空间 k-means++，按「占比 + 彩度」排序，
 * 过滤近白/近黑并合并相近色。结果确定（固定随机种子）。
 */
export function extractColors(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options: QuantizeOptions = {},
): string[] {
  const k = options.k ?? 8;
  const total = width * height;
  if (!total || data.length < total * 4) return [];

  const stride = Math.max(1, Math.floor(Math.sqrt(total / (options.maxSamples ?? 9000))));
  const samples: Sample[] = [];
  for (let y = 0; y < height; y += stride) {
    for (let x = 0; x < width; x += stride) {
      const i = (y * width + x) * 4;
      const alpha = data[i + 3];
      if (alpha < 128) continue;
      const rgb: RGB = { r: data[i], g: data[i + 1], b: data[i + 2] };
      const lab = rgbToOklab(rgb);
      samples.push({ L: lab.L, a: lab.a, b: lab.b, weight: 1 });
    }
  }
  if (samples.length < 4) return [];

  const rnd = makeRandom(7);
  const kk = Math.min(k, samples.length);
  const centers: Sample[] = [];
  centers.push({ ...samples[Math.floor(rnd() * samples.length)] });

  while (centers.length < kk) {
    let sum = 0;
    const dists = samples.map((s) => {
      let best = Number.POSITIVE_INFINITY;
      for (const c of centers) {
        const d =
          (s.L - c.L) ** 2 + (s.a - c.a) ** 2 + (s.b - c.b) ** 2;
        if (d < best) best = d;
      }
      sum += best;
      return best;
    });
    if (sum <= 0) {
      centers.push({ ...samples[Math.floor(rnd() * samples.length)] });
      continue;
    }
    let target = rnd() * sum;
    let picked = 0;
    for (let i = 0; i < dists.length; i++) {
      target -= dists[i];
      if (target <= 0) {
        picked = i;
        break;
      }
    }
    centers.push({ ...samples[picked] });
  }

  const counts = new Array<number>(centers.length).fill(0);
  for (let iter = 0; iter < 14; iter++) {
    const acc = centers.map(() => ({ L: 0, a: 0, b: 0, n: 0 }));
    counts.fill(0);
    for (const s of samples) {
      let best = 0;
      let bestD = Number.POSITIVE_INFINITY;
      for (let c = 0; c < centers.length; c++) {
        const d =
          (s.L - centers[c].L) ** 2 +
          (s.a - centers[c].a) ** 2 +
          (s.b - centers[c].b) ** 2;
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      acc[best].L += s.L;
      acc[best].a += s.a;
      acc[best].b += s.b;
      acc[best].n += 1;
      counts[best] += 1;
    }
    for (let c = 0; c < centers.length; c++) {
      if (acc[c].n > 0) {
        centers[c] = {
          L: acc[c].L / acc[c].n,
          a: acc[c].a / acc[c].n,
          b: acc[c].b / acc[c].n,
          weight: acc[c].n,
        };
      }
      counts[c] = acc[c].n;
    }
  }

  const totalCount = counts.reduce((a, b) => a + b, 0) || 1;
  const scored = centers
    .map((c, i) => {
      const chroma = Math.sqrt(c.a * c.a + c.b * c.b);
      const pct = counts[i] / totalCount;
      return {
        hex: labToHex(c.L, c.a, c.b),
        l: c.L,
        chroma,
        score: 0.6 * pct + 0.4 * Math.min(1, chroma / 0.22),
      };
    })
    .filter((c) => c.l > 0.03 || c.chroma > 0.05)
    .sort((a, b) => b.score - a.score);

  const picked: string[] = [];
  for (const c of scored) {
    const nearWhite = c.l > 0.955 && c.chroma < 0.03;
    if (nearWhite && picked.length >= 3) continue;
    const tooClose = picked.some((h) => deltaE2000(h, c.hex) < 6);
    if (tooClose) continue;
    picked.push(c.hex);
    if (picked.length >= 8) break;
  }
  return picked;
}

/** 从若干候选色中挑一个更适合作为「基础色」的颜色：彩度优先、明度居中。 */
export function pickBaseColor(colors: string[]): string {
  if (!colors.length) return '#4A6CF7';
  let best = colors[0];
  let bestScore = -1;
  for (const hex of colors) {
    const lab = rgbToOklab({
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
    });
    const chroma = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
    const score = chroma * 2 + (1 - Math.abs(lab.L - 0.55));
    if (score > bestScore) {
      bestScore = score;
      best = hex;
    }
  }
  return best;
}
