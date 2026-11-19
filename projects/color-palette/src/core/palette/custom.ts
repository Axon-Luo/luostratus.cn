import { buildEntries, describePalette } from './generate';
import { evaluate } from './metrics';
import { toColorMap } from './types';
import type { Palette, Role } from './types';
import { HARMONY_LABEL, SCENE_MAP, SCENES } from '../../content/presets';

/** 在页面内独立改色：返回新方案，不修改工作台状态。 */
export function paletteWithColors(p: Palette, overrides: Partial<Record<Role, string>>): Palette {
  const map = toColorMap(p);
  for (const [role, hex] of Object.entries(overrides)) {
    if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) continue;
    map[role as Role] = hex.toUpperCase();
  }
  const scene = SCENE_MAP[p.scene] ?? SCENES[0];
  return {
    ...p,
    colors: buildEntries(map),
    a11y: evaluate(map),
    description: describePalette(map, scene, HARMONY_LABEL[p.harmony] ?? '和谐'),
    dark: undefined,
    darkA11y: undefined,
    cvd: undefined,
    updatedAt: Date.now(),
  };
}
