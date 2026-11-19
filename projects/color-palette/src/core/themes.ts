import { oklchToHex } from './color/convert';
import { generatePalettes } from './palette/generate';
import type { Palette } from './palette/types';
import { SCENES } from '../content/presets';
import type { ThemePreset } from '../content/themes';

const cache = new Map<string, Palette>();

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function themePalette(preset: ThemePreset): Palette {
  const hit = cache.get(preset.id);
  if (hit) return hit;
  const seed = hash(preset.id);
  const p = generatePalettes({
    baseHex: preset.baseHex,
    scene: preset.scene,
    style: preset.style,
    mood: preset.mood,
    harmony: preset.harmony,
    seed,
    count: 1,
    now: 1,
  })[0];
  const out: Palette = {
    ...p,
    id: `p_theme_${preset.id}`,
    name: preset.name,
    customName: '',
    source: 'tool',
    tags: preset.tags,
  };
  cache.set(preset.id, out);
  return out;
}

export function blindTheme(seed = Math.floor(Math.random() * 1_000_000)): ThemePreset {
  const scene = SCENES[seed % SCENES.length];
  const hue = seed % 360;
  return {
    id: `blind-${seed}`,
    name: `盲盒 · ${scene.label}`,
    story: '随机抽一组今天没试过的颜色，先别判断，用一分钟感受它',
    baseHex: oklchToHex({ l: 0.55, c: 0.16 + (seed % 5) * 0.012, h: hue }),
    scene: scene.id as ThemePreset['scene'],
    style: 'none',
    mood: 'none',
    harmony: 'auto',
    group: 'city',
    tags: ['盲盒', '随机', scene.label],
  };
}
