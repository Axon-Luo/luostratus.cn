import { clamp, hexToOklch, hslToHex, oklchToHex } from './color/convert';
import { contrastRatio } from './color/contrast';

export type ChallengeMode = 'hue' | 'order' | 'odd' | 'contrast';

export interface ContrastPair {
  fg: string;
  bg: string;
  ratio: number;
}

export interface ChallengeRound {
  mode: ChallengeMode;
  prompt: string;
  target?: string;
  options: string[];
  pairs?: ContrastPair[];
  answer: number | number[];
  explanation: string;
  difficulty: number;
  /** 对比度题的达标阈值；其他题型为 undefined */
  threshold?: number;
  /** 排明度题的方向 */
  orderDirection?: 'light-to-dark' | 'dark-to-light';
}

const HUE_PROMPTS = [
  '找出与目标色相最接近的一块',
  '哪一块的色相与目标几乎一致？',
  '别被明暗骗了，看色相',
  '目标色的邻居是谁？',
  '哪一块和目标是同一个色相？',
  '从相似色里挑出目标色相',
  '色相相差一点点，找出来',
  '看色相，不看深浅',
];

const ORDER_LIGHT_PROMPTS = [
  '按明度从浅到深依次点击',
  '从最亮排到最暗',
  '把这几块按亮度排好',
  '从浅到深，相邻两块只差一点',
  '先找最亮，再一路排到最暗',
  '按亮度递减的顺序点',
];

const ORDER_DARK_PROMPTS = [
  '按明度从深到浅依次点击',
  '从最暗排到最亮',
  '反过来排：深色在前',
  '从深到浅，慢慢找边界',
  '先找最暗，再一路排到最亮',
  '按亮度递增的顺序点',
];

const ODD_HUE_PROMPTS = [
  '找出色相不同的一块',
  '五块几乎一样，哪一块偏了？',
  '找出那个“不一样”的颜色',
  '有一块色相偏了一点，找出来',
  '哪一块的颜色不在同一条色相线上？',
  '仔细看，色相藏了细微差别',
];

const ODD_CHROMA_PROMPTS = [
  '找出饱和度不同的一块',
  '哪一块更灰 / 更艳？',
  '明度一样，但有一块不够纯',
  '找出彩度偏掉的一块',
  '有一块的鲜艳度不同，找出来',
  '饱和度藏了差别，仔细看',
];

const CONTRAST_PROMPTS = [
  '哪一组文字达到要求的对比度？',
  '找出真正看得清的一组',
  '哪组文字与背景的对比度达标？',
  '只有一组合格，选出来',
  '按阈值判断，哪组能过？',
  '看对比度，不看颜色好看不好看',
];

function rand(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(list: T[], rnd: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pickPrompt(list: string[], rnd: () => number): string {
  return list[Math.floor(rnd() * list.length)];
}

function optionCount(base: number, roundIndex: number, steps: number[]): number {
  return base + steps.filter((step) => roundIndex >= step).length;
}

function hueRound(seed: number, difficulty: number, roundIndex: number): ChallengeRound {
  const rnd = rand(seed);
  const targetHue = Math.floor(rnd() * 360);
  const saturation = 40 + Math.floor(rnd() * 25);
  const lightness = 42 + Math.floor(rnd() * 16);
  const target = hslToHex({ h: targetHue, s: saturation, l: lightness });
  const step = 4 + (1 - difficulty) * 10;
  const count = optionCount(4, roundIndex, [3, 7]);
  const offsets = Array.from({ length: count - 1 }, (_, index) => {
    const distance = step * (1 + index * 0.62);
    const sign = index % 2 === 0 ? 1 : -1;
    return targetHue + Math.round(distance * sign + (rnd() - 0.5) * 2);
  });
  const colors = shuffle(
    [target, ...offsets.map((h) => hslToHex({ h, s: saturation, l: lightness }))],
    rnd,
  );
  return {
    mode: 'hue',
    prompt: pickPrompt(HUE_PROMPTS, rnd),
    target,
    options: colors,
    answer: colors.indexOf(target),
    explanation: `目标色相约 ${targetHue}°，正确的一块是 ${target}，先比较相邻色相，不要被亮度影响`,
    difficulty,
  };
}

function orderRound(seed: number, difficulty: number, roundIndex: number): ChallengeRound {
  const rnd = rand(seed);
  const baseHue = Math.floor(rnd() * 360);
  const direction: 'light-to-dark' | 'dark-to-light' =
    rnd() < 0.5 ? 'light-to-dark' : 'dark-to-light';
  const gap = 0.022 + (1 - difficulty) * 0.02;
  const count = optionCount(5, roundIndex, [3, 7]);
  const levels = Array.from({ length: count }, (_, index) => 0.22 + index * gap);
  const colors = levels.map((l, index) =>
    oklchToHex({
      l,
      c: 0.055 + (index % 2) * 0.02,
      h: (baseHue + index * 7) % 360,
    }),
  );
  const options = shuffle(colors, rnd);
  const answer = options
    .map((hex, index) => ({ hex, index, l: hexToOklch(hex).l }))
    .sort((a, b) => (direction === 'light-to-dark' ? b.l - a.l : a.l - b.l))
    .map((item) => item.index);
  return {
    mode: 'order',
    prompt: pickPrompt(
      direction === 'light-to-dark' ? ORDER_LIGHT_PROMPTS : ORDER_DARK_PROMPTS,
      rnd,
    ),
    options,
    answer,
    explanation:
      direction === 'light-to-dark'
        ? '先从六块里挑出最亮的一块，再依次往下排；相邻明度差很小'
        : '先从六块里挑出最暗的一块，再依次往上排；相邻明度差很小',
    difficulty,
    orderDirection: direction,
  };
}

function oddRound(seed: number, difficulty: number, roundIndex: number): ChallengeRound {
  const rnd = rand(seed);
  const baseHue = Math.floor(rnd() * 360);
  const count = optionCount(6, roundIndex, [5]);
  const kind = rnd() < 0.5 ? 'hue' : 'chroma';
  const offset = 3.5 + (1 - difficulty) * 8;
  const baseS = 50 + Math.floor(rnd() * 10);
  const base =
    kind === 'hue'
      ? hslToHex({ h: baseHue, s: baseS, l: 48 })
      : hslToHex({ h: baseHue, s: baseS, l: 48 });
  const odd =
    kind === 'hue'
      ? hslToHex({ h: baseHue + offset, s: baseS, l: 48 })
      : hslToHex({ h: baseHue, s: baseS - 12 - (1 - difficulty) * 6, l: 48 });
  const options = shuffle(
    Array.from({ length: count }, (_, index) => (index === 0 ? odd : base)),
    rnd,
  );
  return {
    mode: 'odd',
    prompt: pickPrompt(
      kind === 'hue' ? ODD_HUE_PROMPTS : ODD_CHROMA_PROMPTS,
      rnd,
    ),
    options,
    answer: options.indexOf(odd),
    explanation:
      kind === 'hue'
        ? `只有一块的色相偏了约 ${Math.round(offset)}°，其余完全相同`
        : '只有一块的饱和度更低，其余完全相同',
    difficulty,
  };
}

function pairForRatio(bg: string, target: number, hue: number): string {
  let best = '#111111';
  let bestGap = Number.POSITIVE_INFINITY;
  for (let l = 0.04; l <= 0.96; l += 0.004) {
    const fg = oklchToHex({ l, c: 0.018, h: hue });
    const gap = Math.abs(contrastRatio(fg, bg) - target);
    if (gap < bestGap) {
      bestGap = gap;
      best = fg;
    }
  }
  return best;
}

function contrastRound(seed: number, difficulty: number, roundIndex: number): ChallengeRound {
  const rnd = rand(seed);
  const bgs = ['#FBFBFD', '#F5F1EA', '#EFF3F8', '#F6F2F6', '#F9F6F2'].map((hex) =>
    hex.toUpperCase(),
  );
  const hue = Math.floor(rnd() * 360);
  const threshold = [3, 4.5, 7][Math.floor(rnd() * 3)];
  const below = Math.max(1.4, threshold - 0.4 - rnd() * 0.4);
  const correctTarget = threshold + 0.35 + rnd() * 0.3;
  const count = optionCount(4, roundIndex, [5]);
  const ratios = shuffle(
    [
      correctTarget,
      below,
      below + 0.12 + rnd() * 0.2,
      Math.max(1.2, threshold - 0.7),
      below + 0.3 + rnd() * 0.1,
    ].slice(0, count),
    rnd,
  );
  const pairs = ratios.map((ratio, index) => {
    const bg = bgs[index % bgs.length];
    const fg = pairForRatio(bg, ratio, hue + index * 17);
    return { fg, bg, ratio: Number(contrastRatio(fg, bg).toFixed(2)) };
  });
  const correctIndex = ratios.indexOf(correctTarget);
  return {
    mode: 'contrast',
    prompt: `${pickPrompt(CONTRAST_PROMPTS, rnd)}（阈值 ${threshold}:1）`,
    options: pairs.map((pair) => pair.fg),
    pairs,
    answer: correctIndex,
    explanation: `只有一组达到 ${threshold}:1（约 ${pairs[correctIndex]?.ratio}:1）；其余都差一点，别只看颜色深浅`,
    difficulty,
    threshold,
  };
}

export function buildRound(mode: ChallengeMode, seed: number, roundIndex = 0): ChallengeRound {
  const difficulty = clamp(roundIndex / 9, 0, 1);
  const roundSeed = (seed ^ Math.imul(roundIndex + 1, 0x9e3779b9)) >>> 0;
  if (mode === 'hue') return hueRound(roundSeed, difficulty, roundIndex);
  if (mode === 'order') return orderRound(roundSeed, difficulty, roundIndex);
  if (mode === 'odd') return oddRound(roundSeed, difficulty, roundIndex);
  return contrastRound(roundSeed, difficulty, roundIndex);
}

export function isCorrect(round: ChallengeRound, answer: number | number[]): boolean {
  if (typeof round.answer === 'number') return round.answer === answer;
  if (!Array.isArray(answer)) return false;
  return round.answer.length === answer.length && round.answer.every((v, i) => v === answer[i]);
}

export function scoreFor(correct: boolean, secondsLeft: number): number {
  if (!correct) return 0;
  return 10 + Math.max(0, Math.min(5, Math.floor(secondsLeft / 10)));
}
