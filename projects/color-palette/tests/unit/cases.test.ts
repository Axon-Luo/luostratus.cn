import { describe, expect, it } from 'vitest';
import { CASES } from '../../src/content/cases';
import { LESSONS } from '../../src/content/lessons';
import { casePalette } from '../../src/core/cases';
import { lessonPalette } from '../../src/core/lessons';

describe('生活案例', () => {
  it('8 个案例，id 唯一，场景有效', () => {
    expect(CASES).toHaveLength(8);
    expect(new Set(CASES.map((c) => c.id)).size).toBe(8);
    for (const item of CASES) {
      expect(item.story.length).toBeGreaterThan(10);
      expect(item.tags.length).toBeGreaterThan(0);
    }
  });

  it('每个案例生成稳定的 6 色方案', () => {
    for (const item of CASES) {
      const p = casePalette(item);
      expect(p.colors).toHaveLength(6);
      expect(p.name).toBe(item.title);
      expect(casePalette(item).colors.map((c) => c.hex)).toEqual(p.colors.map((c) => c.hex));
    }
  });
});

describe('配色小课堂', () => {
  it('8 篇文章，id 唯一，章节与要点充实', () => {
    expect(LESSONS).toHaveLength(8);
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(8);
    for (const lesson of LESSONS) {
      expect(lesson.sections.length).toBeGreaterThanOrEqual(5);
      expect(lesson.takeaways.length).toBeGreaterThanOrEqual(4);
      expect(lesson.summary.length).toBeGreaterThan(10);
      expect(lesson.minutes).toBeGreaterThanOrEqual(6);
    }
  });

  it('表格行列对齐，示例色值合法', () => {
    const hex = /^#[0-9A-Fa-f]{6}$/;
    for (const lesson of LESSONS) {
      for (const section of lesson.sections) {
        expect(section.text.length).toBeGreaterThan(30);
        if (section.table) {
          for (const row of section.table.rows) {
            expect(row).toHaveLength(section.table.head.length);
          }
        }
        for (const s of section.samples ?? []) {
          expect(s.fg).toMatch(hex);
          expect(s.bg).toMatch(hex);
          expect(s.label.length).toBeGreaterThan(2);
        }
      }
    }
  });

  it('每篇文章有示例方案', () => {
    for (const lesson of LESSONS) {
      expect(lessonPalette(lesson).colors).toHaveLength(6);
    }
  });
});
