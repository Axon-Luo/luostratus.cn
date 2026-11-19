import { clamp, hexToRgb, rgbToHex } from './color/convert';

const toLinear = (v: number): number => {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

const toSrgb = (v: number): number => {
  const s = v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
  return clamp(Math.round(s * 255), 0, 255);
};

/** 光的加色混合：线性亮度空间按 t 加权（t 为 b 的占比）。 */
export function mixLight(a: string, b: string, t: number): string {
  const w = clamp(t, 0, 1);
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex({
    r: toSrgb(toLinear(ca.r) * (1 - w) + toLinear(cb.r) * w),
    g: toSrgb(toLinear(ca.g) * (1 - w) + toLinear(cb.g) * w),
    b: toSrgb(toLinear(ca.b) * (1 - w) + toLinear(cb.b) * w),
  });
}

// Kubelka-Munk 单常数：反射率与吸收/散射比互转；端点夹避避免除零。
const ks = (r: number): number => {
  const x = clamp(r, 0.001, 0.999);
  return ((1 - x) ** 2) / (2 * x);
};
const reflect = (k: number): number => clamp(1 + k - Math.sqrt(k * k + 2 * k), 0, 1);

/** 颜料的减色混合：Kubelka-Munk 近似，t 为 b 的占比；结果通常比插值更暗更浊。 */
export function mixPigment(a: string, b: string, t: number): string {
  const w = clamp(t, 0, 1);
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const channel = (x: number, y: number): number => {
    const k = ks(x / 255) * (1 - w) + ks(y / 255) * w;
    return clamp(Math.round(reflect(k) * 255), 0, 255);
  };
  return rgbToHex({ r: channel(ca.r, cb.r), g: channel(ca.g, cb.g), b: channel(ca.b, cb.b) });
}