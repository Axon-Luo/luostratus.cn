import { hexToRgb, rgbToOklab } from './convert';

interface Lab {
  L: number;
  a: number;
  b: number;
}

function rgbToLab(hex: string): Lab {
  const c = hexToRgb(hex);
  const lin = (v: number) => {
    const x = v / 255;
    return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  const r = lin(c.r);
  const g = lin(c.g);
  const b = lin(c.b);

  const x = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b;
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const z = 0.0193339 * r + 0.119192 * g + 0.9503041 * b;

  const xn = 0.95047;
  const yn = 1;
  const zn = 1.08883;
  const f = (t: number) => {
    const e = Math.pow(6 / 29, 3);
    return t > e ? Math.cbrt(t) : t / (3 * Math.pow(6 / 29, 2)) + 4 / 29;
  };
  const fx = f(x / xn);
  const fy = f(y / yn);
  const fz = f(z / zn);

  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

const RAD = Math.PI / 180;

/** CIEDE2000 色差。相同颜色为 0，越大差异越明显。 */
export function deltaE2000(hexA: string, hexB: string): number {
  const x = rgbToLab(hexA);
  const y = rgbToLab(hexB);

  const avgL = (x.L + y.L) / 2;
  const c1 = Math.sqrt(x.a * x.a + x.b * x.b);
  const c2 = Math.sqrt(y.a * y.a + y.b * y.b);
  const avgC = (c1 + c2) / 2;
  const pow25 = Math.pow(25, 7);
  const g = 0.5 * (1 - Math.sqrt(Math.pow(avgC, 7) / (Math.pow(avgC, 7) + pow25)));

  const a1p = (1 + g) * x.a;
  const a2p = (1 + g) * y.a;
  const c1p = Math.sqrt(a1p * a1p + x.b * x.b);
  const c2p = Math.sqrt(a2p * a2p + y.b * y.b);

  const hue = (b: number, ap: number) => {
    if (b === 0 && ap === 0) return 0;
    const h = Math.atan2(b, ap) / RAD;
    return h >= 0 ? h : h + 360;
  };
  const h1p = hue(x.b, a1p);
  const h2p = hue(y.b, a2p);

  const dLp = y.L - x.L;
  const dCp = c2p - c1p;
  let dhp = 0;
  if (c1p * c2p !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(c1p * c2p) * Math.sin((dhp / 2) * RAD);

  const avgLp = (x.L + y.L) / 2;
  const avgCp = (c1p + c2p) / 2;
  let avgHp = 0;
  if (c1p * c2p !== 0) {
    avgHp = h1p + h2p;
    if (Math.abs(h1p - h2p) > 180) avgHp = avgHp < 360 ? avgHp + 360 : avgHp - 360;
    avgHp /= 2;
  }

  const t =
    1 -
    0.17 * Math.cos((avgHp - 30) * RAD) +
    0.24 * Math.cos(2 * avgHp * RAD) +
    0.32 * Math.cos((3 * avgHp + 6) * RAD) -
    0.2 * Math.cos((4 * avgHp - 63) * RAD);

  const dTheta = 30 * Math.exp(-Math.pow((avgHp - 275) / 25, 2));
  const rc = 2 * Math.sqrt(Math.pow(avgCp, 7) / (Math.pow(avgCp, 7) + pow25));
  const sl = 1 + (0.015 * Math.pow(avgLp - 50, 2)) / Math.sqrt(20 + Math.pow(avgLp - 50, 2));
  const sc = 1 + 0.045 * avgCp;
  const sh = 1 + 0.015 * avgCp * t;
  const rt = -Math.sin(2 * dTheta * RAD) * rc;

  const dl = dLp / sl;
  const dc = dCp / sc;
  const dh = dHp / sh;

  return Math.sqrt(dl * dl + dc * dc + dh * dh + rt * dc * dh);
}

/** OKLab 空间欧氏距离，用于快速近似判断。 */
export function oklabDistance(hexA: string, hexB: string): number {
  const a = rgbToOklab(hexToRgb(hexA));
  const b = rgbToOklab(hexToRgb(hexB));
  return Math.sqrt(
    Math.pow(a.L - b.L, 2) + Math.pow(a.a - b.a, 2) + Math.pow(a.b - b.b, 2),
  );
}
