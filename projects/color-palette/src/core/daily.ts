import { oklchToHex } from './color/convert';
import { generatePalettes } from './palette/generate';
import type { Palette } from './palette/types';
import { HARMONIES, SCENES } from '../content/presets';
import type { DailyState } from './storage';

const NOTES = [
  '今天的颜色适合把桌面收拾干净，再开始一件小事',
  '把主色放在最常看到的地方，心情会跟着稳下来',
  '不必一次用满六个颜色，先挑一个当主角',
  '留白也是配色的一部分，今天少用一个颜色试试',
  '给屏幕之外的东西也留一点同色系：杯子、本子、衣角',
  '如果觉得太热闹，就把背景换成更浅的一档',
  '今天适合用一点对比色，提醒自己换个角度',
  '颜色没有对错，只有此刻合不合适',
  '把喜欢的颜色拍下来，比记在脑子里更可靠',
  '试着用一个颜色串起今天的三件小事',
  '主色不必最亮，能托住其他颜色就好',
  '给文字留足对比度，温柔也要看得清',
  '今天的配色可以只用一个颜色加两种中性色',
  '把颜色调低一点饱和，事情也会显得没那么急',
  '出门前看一眼天空，再决定今天的主色',
  '给房间换一块小面积的色，比整面墙更容易试错',
  '同一种颜色，在不同材质上会讲不同的故事',
  '今天适合把最亮的颜色留给最重要的那件事',
  '配色是取舍，生活也是',
  '如果两个颜色打架，就让第三个颜色站远一点',
  '把今天的颜色存下来，周末回看会很有意思',
  '试着用冷暖各一个颜色，给画面一点呼吸',
  '颜色越少，越需要把比例安排好',
  '今天不追流行色，用你此刻最想看到的颜色',
  '深色背景上，浅色文字会更轻，别忘了检查对比度',
  '给贺卡或手账留一块空白，颜色才有地方呼吸',
  '把主色用在重复出现的小物件上，整体感会更强',
  '今天的配色适合慢慢看，不适合急着下结论',
];

export function dayKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dailySeed(key: string): number {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function dailyNote(key: string): string {
  return NOTES[dailySeed(key) % NOTES.length];
}

export function dailyBaseColor(key: string): string {
  const seed = dailySeed(key);
  return oklchToHex({ l: 0.56, c: 0.17, h: seed % 360 });
}

export function dailyPalette(key: string): Palette {
  const seed = dailySeed(key);
  const scene = SCENES[seed % SCENES.length];
  const harmony = HARMONIES[(seed >>> 5) % HARMONIES.length]?.id ?? 'auto';
  const parsed = new Date(`${key}T08:00:00`);
  const now = Number.isNaN(parsed.getTime()) ? Date.now() : parsed.getTime();
  const base = generatePalettes({
    baseHex: dailyBaseColor(key),
    scene: scene.id as Palette['scene'],
    style: 'none',
    mood: 'none',
    harmony: harmony as Palette['harmony'],
    seed,
    count: 1,
    now,
  })[0];
  const date = key.slice(5).replace('-', ' / ');
  return {
    ...base,
    id: `p_daily_${key}`,
    name: `每日一色 · ${date}`,
    customName: '',
    source: 'daily',
    createdAt: now,
    updatedAt: now,
  };
}

export function previousDay(key: string): string {
  const date = new Date(`${key}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  date.setDate(date.getDate() - 1);
  return dayKey(date);
}

export function nextStreak(lastDate: string, today: string, streak: number): number {
  if (!lastDate) return 1;
  if (lastDate === today) return Math.max(1, streak);
  if (lastDate === previousDay(today)) return streak + 1;
  return 1;
}

export function visitDaily(state: DailyState, today: string): DailyState {
  if (state.lastDate === today) {
    if (state.archive.some((item) => item.date === today)) return state;
    return {
      ...state,
      archive: [{ date: today, seed: dailySeed(today) }, ...state.archive].slice(0, 7),
    };
  }
  return {
    lastDate: today,
    streak: nextStreak(state.lastDate, today, state.streak),
    archive: [{ date: today, seed: dailySeed(today) }, ...state.archive.filter((item) => item.date !== today)].slice(0, 7),
  };
}
