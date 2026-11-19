import { TRADITIONAL_COLORS } from '../content/traditionalColors';
import type { TraditionalColor } from '../content/traditionalColors';
import { normalizeHex } from './color/convert';
import { deltaE2000 } from './color/distance';

export function searchTraditional(query: string, series?: string): TraditionalColor[] {
  const q = query.trim().toLowerCase().replace(/^#/, '');
  return TRADITIONAL_COLORS.filter((c) => {
    if (series && c.series !== series) return false;
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || c.hex.toLowerCase().includes(q);
  });
}

export function nearestTraditional(hex: string): { color: TraditionalColor; distance: number } | null {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  let best: TraditionalColor | null = null;
  let bestDistance = Infinity;
  for (const color of TRADITIONAL_COLORS) {
    const d = deltaE2000(normalized, color.hex);
    if (d < bestDistance) {
      bestDistance = d;
      best = color;
    }
  }
  return best ? { color: best, distance: bestDistance } : null;
}