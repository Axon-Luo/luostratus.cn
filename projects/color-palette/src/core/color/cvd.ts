import { clamp, hexToRgb, rgbToHex } from './convert';

export type CvdType = 'none' | 'protan' | 'deutan' | 'tritan' | 'achromat';

export const CVD_OPTIONS: Array<{ id: CvdType; label: string }> = [
  { id: 'none', label: '正常' },
  { id: 'protan', label: '红色盲' },
  { id: 'deutan', label: '绿色盲' },
  { id: 'tritan', label: '蓝色盲' },
  { id: 'achromat', label: '全色盲' },
];

/** Machado et al. 2009，severity = 1.0 的模拟矩阵 */
const MATRICES: Record<Exclude<CvdType, 'none'>, number[]> = {
  protan: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
  deutan: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881],
  tritan: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.3039],
  achromat: [0.299, 0.587, 0.114, 0.299, 0.587, 0.114, 0.299, 0.587, 0.114],
};

export function simulateCvd(hex: string, type: CvdType): string {
  if (!type || type === 'none') return hex;
  const m = MATRICES[type];
  if (!m) return hex;
  const c = hexToRgb(hex);
  return rgbToHex({
    r: clamp(m[0] * c.r + m[1] * c.g + m[2] * c.b, 0, 255),
    g: clamp(m[3] * c.r + m[4] * c.g + m[5] * c.b, 0, 255),
    b: clamp(m[6] * c.r + m[7] * c.g + m[8] * c.b, 0, 255),
  });
}
