import { oklchToHex } from './color/convert';
import { generatePalettes } from './palette/generate';
import { toColorMap } from './palette/types';
import type { Palette } from './palette/types';

export type OutfitOccasion = 'commute' | 'date' | 'sport' | 'campus';
export type OutfitWeather = 'cold' | 'mild' | 'hot';

export const OUTFIT_OCCASIONS: Array<{ id: OutfitOccasion; label: string }> = [
  { id: 'commute', label: '通勤' },
  { id: 'date', label: '约会' },
  { id: 'sport', label: '运动' },
  { id: 'campus', label: '校园' },
];

export const OUTFIT_WEATHERS: Array<{ id: OutfitWeather; label: string }> = [
  { id: 'cold', label: '冷' },
  { id: 'mild', label: '适中' },
  { id: 'hot', label: '热' },
];

export interface OutfitDay {
  day: number;
  palette: Palette;
  top: string;
  bottom: string;
  shoes: string;
  note: string;
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const NOTES: Record<OutfitOccasion, string[]> = {
  commute: ['上装用主色，会议多的日子把亮度收一点', '下装保持中性，鞋包做一点强调', '通勤路上加一件同色系外套'],
  date: ['主色放在靠近脸的位置，显气色', '鞋包用一个强调色就够', '想更松弛，把下装换成更浅的一档'],
  sport: ['主色选耐看的，运动完也不显乱', '鞋用强调色，安全感更强', '大面积留给透气的浅色'],
  campus: ['上装主色 + 下装中性，最不容易出错', '书包或帽子用强调色', '今天可以试一个平时少用的颜色'],
};

export function buildOutfitWeek(options: {
  occasion: OutfitOccasion;
  weather: OutfitWeather;
  seed?: number;
}): OutfitDay[] {
  const base = options.seed ?? hash(`${options.occasion}-${options.weather}`);
  const style = options.occasion === 'sport' ? 'vivid' : options.occasion === 'date' ? 'retro' : 'minimal';
  const mood = options.weather === 'cold' ? 'calm' : options.weather === 'hot' ? 'fresh' : 'warm';
  return Array.from({ length: 7 }, (_, index) => {
    const hue = (base + index * 47) % 360;
    const p = generatePalettes({
      baseHex: oklchToHex({ l: 0.54, c: 0.16, h: hue }),
      scene: 'outfit',
      style,
      mood,
      harmony: 'analogous',
      seed: base + index,
      count: 1,
      now: 1,
    })[0];
    const map = toColorMap(p);
    const notes = NOTES[options.occasion];
    return {
      day: index + 1,
      palette: p,
      top: map.primary,
      bottom: map.secondary,
      shoes: map.accent,
      note: notes[index % notes.length],
    };
  });
}

export interface RoomSurface {
  id: 'wall' | 'floor' | 'sofa' | 'curtain' | 'decor';
  label: string;
  area: number;
  hex: string;
}

export interface RoomScheme {
  id: string;
  name: string;
  palette: Palette;
  surfaces: RoomSurface[];
}

const AREAS: Array<{ id: RoomSurface['id']; label: string; area: number; role: 'bg' | 'secondary' | 'primary' | 'surface' | 'accent' }> = [
  { id: 'wall', label: '墙面', area: 45, role: 'bg' },
  { id: 'floor', label: '地面', area: 25, role: 'secondary' },
  { id: 'sofa', label: '沙发', area: 15, role: 'primary' },
  { id: 'curtain', label: '窗帘', area: 10, role: 'surface' },
  { id: 'decor', label: '点缀', area: 5, role: 'accent' },
];

const ROOM_STYLES = ['nature', 'retro'] as const;

export function buildRoomSchemes(base: Palette, seed = 1): RoomScheme[] {
  const primary = base.colors.find((c) => c.role === 'primary')?.hex ?? '#4A6CF7';
  const baseMap = toColorMap(base);
  const direct: RoomScheme = {
    id: 'room-base',
    name: '当前方案',
    palette: base,
    surfaces: AREAS.map((item) => ({
      id: item.id,
      label: item.label,
      area: item.area,
      hex: baseMap[item.role],
    })),
  };
  const variants = ROOM_STYLES.map((style, index) => {
    const p = generatePalettes({
      baseHex: primary,
      scene: 'home',
      style,
      mood: 'calm',
      harmony: 'analogous',
      seed: seed + index * 31,
      count: 1,
      now: 1,
    })[0];
    const map = toColorMap(p);
    return {
      id: `room-${style}`,
      name: ['自然', '复古'][index],
      palette: p,
      surfaces: AREAS.map((item) => ({
        id: item.id,
        label: item.label,
        area: item.area,
        hex: map[item.role],
      })),
    };
  });
  return [direct, ...variants];
}

export interface CardOptions {
  occasion: string;
  to: string;
  message: string;
  palette: Palette;
}

export const CARD_OCCASIONS = ['生日', '毕业', '节日', '感谢'] as const;

export function cardTitle(occasion: string): string {
  if (occasion === '生日') return '生日快乐';
  if (occasion === '毕业') return '毕业快乐';
  if (occasion === '节日') return '节日快乐';
  if (occasion === '感谢') return '谢谢你';
  return occasion;
}
