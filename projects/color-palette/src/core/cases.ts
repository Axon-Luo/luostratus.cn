import { generatePalettes } from './palette/generate';
import type { Palette } from './palette/types';
import type { CasePreset } from '../content/cases';

const cache = new Map<string, Palette>();

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function casePalette(item: CasePreset): Palette {
  const hit = cache.get(item.id);
  if (hit) return hit;
  const p = generatePalettes({
    baseHex: item.baseHex,
    scene: item.scene,
    style: item.style,
    mood: item.mood,
    harmony: item.harmony,
    seed: hash(item.id),
    count: 1,
    now: 1,
  })[0];
  const out: Palette = {
    ...p,
    id: `p_case_${item.id}`,
    name: item.title,
    customName: '',
    source: 'case',
    tags: item.tags,
  };
  cache.set(item.id, out);
  return out;
}
