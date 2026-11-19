import { generatePalettes } from './palette/generate';
import type { Palette } from './palette/types';
import type { Lesson } from '../content/lessons';

const cache = new Map<string, Palette>();

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function lessonPalette(lesson: Lesson): Palette {
  const hit = cache.get(lesson.id);
  if (hit) return hit;
  const p = generatePalettes({
    baseHex: lesson.baseHex,
    scene: lesson.scene,
    style: lesson.style,
    mood: lesson.mood,
    harmony: lesson.harmony,
    seed: hash(lesson.id),
    count: 1,
    now: 1,
  })[0];
  const out: Palette = {
    ...p,
    id: `p_lesson_${lesson.id}`,
    name: lesson.title,
    customName: '',
    source: 'tool',
    tags: [lesson.level, `${lesson.minutes} 分钟`],
  };
  cache.set(lesson.id, out);
  return out;
}
