import { describe, expect, it } from 'vitest';
import { dailyBaseColor, dailyNote, dailyPalette, dailySeed, dayKey, nextStreak, previousDay, visitDaily } from '../../src/core/daily';
import type { DailyState } from '../../src/core/storage';
import { buildRound, isCorrect, scoreFor } from '../../src/core/challenge';
import { hexToOklch } from '../../src/core/color/convert';

describe('每日一色', () => {
  it('同一天结果固定，不同天不同', () => {
    expect(dailySeed('2026-11-16')).toBe(dailySeed('2026-11-16'));
    expect(dailySeed('2026-11-16')).not.toBe(dailySeed('2026-11-17'));
    const a = dailyPalette('2026-11-16');
    const b = dailyPalette('2026-11-16');
    expect(a.colors.map((c) => c.hex)).toEqual(b.colors.map((c) => c.hex));
    expect(a.id).toBe('p_daily_2026-11-16');
    expect(a.colors).toHaveLength(6);
    expect(dailyBaseColor('2026-11-16')).toMatch(/^#[0-9A-F]{6}$/);
    expect(dailyNote('2026-11-16').length).toBeGreaterThan(4);
  });

  it('日期与前一天计算正确', () => {
    expect(dayKey(new Date(2026, 10, 16))).toBe('2026-11-16');
    expect(previousDay('2026-03-01')).toBe('2026-02-28');
    expect(previousDay('2026-01-01')).toBe('2025-12-31');
  });

  it('连续天数：昨天 +1，中断归 1，同一天不变', () => {
    expect(nextStreak('2026-11-15', '2026-11-16', 3)).toBe(4);
    expect(nextStreak('2026-11-13', '2026-11-16', 3)).toBe(1);
    expect(nextStreak('2026-11-16', '2026-11-16', 3)).toBe(3);
  });

  it('访问后写入归档且最多 7 条', () => {
    const state: DailyState = {
      lastDate: '2026-11-15',
      streak: 2,
      archive: [{ date: '2026-11-15', seed: 1 }],
    };
    const next = visitDaily(state, '2026-11-16');
    expect(next.streak).toBe(3);
    expect(next.archive[0].date).toBe('2026-11-16');
    expect(next.archive).toHaveLength(2);
  });
});

describe('配色挑战', () => {
  it('找色相答案索引有效', () => {
    const round = buildRound('hue', 42);
    expect(round.mode).toBe('hue');
    expect(round.options).toHaveLength(4);
    expect(typeof round.answer).toBe('number');
    const index = round.answer as number;
    expect(index).toBeGreaterThanOrEqual(0);
    expect(index).toBeLessThan(4);
    expect(isCorrect(round, index)).toBe(true);
    expect(isCorrect(round, (index + 1) % 4)).toBe(false);
  });

  it('排明度答案是按方向的完整排列', () => {
    const round = buildRound('order', 7, 0);
    expect(round.options).toHaveLength(5);
    const answer = round.answer as number[];
    expect([...answer].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4]);
    const levels = answer.map((index) => hexToOklch(round.options[index]).l);
    const sorted = [...levels].sort((a, b) => b - a);
    expect(levels).toEqual(round.orderDirection === 'light-to-dark' ? sorted : sorted.reverse());
    expect(isCorrect(round, answer)).toBe(true);
    expect(isCorrect(round, [...answer].reverse())).toBe(false);
  });

  it('同一题型不同轮次出现不同题目', () => {
    for (const mode of ['hue', 'order', 'odd', 'contrast'] as const) {
      const a = buildRound(mode, 12345, 0);
      const b = buildRound(mode, 12345, 1);
      expect(a.options).not.toEqual(b.options);
    }
  });

  it('找不同只有一块色相偏出', () => {
    const round = buildRound('odd', 11);
    expect(round.options).toHaveLength(6);
    const index = round.answer as number;
    expect(index).toBeGreaterThanOrEqual(0);
    expect(index).toBeLessThan(6);
    expect(isCorrect(round, index)).toBe(true);
  });

  it('对比度题只有一组达到阈值', () => {
    const round = buildRound('contrast', 21, 0);
    expect(round.pairs).toHaveLength(4);
    const threshold = round.threshold ?? 4.5;
    const passing = round.pairs!.filter((pair) => pair.ratio >= threshold);
    expect(passing).toHaveLength(1);
    expect(round.answer).toBe(round.pairs!.findIndex((pair) => pair.ratio >= threshold));
    expect(isCorrect(round, round.answer as number)).toBe(true);
  });

  it('对比度题在多个随机种子下都只有一组达标', () => {
    for (let seed = 1; seed <= 30; seed += 1) {
      const round = buildRound('contrast', seed, seed % 10);
      const threshold = round.threshold ?? 4.5;
      const passing = round.pairs!.filter((pair) => pair.ratio >= threshold);
      expect(passing.length).toBe(1);
      expect(round.pairs![round.answer as number].ratio).toBeGreaterThanOrEqual(threshold);
    }
  });

  it('计分包含时间奖励', () => {
    expect(scoreFor(false, 50)).toBe(0);
    expect(scoreFor(true, 50)).toBe(15);
    expect(scoreFor(true, 5)).toBe(10);
  });
});
