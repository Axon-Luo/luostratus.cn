import { describe, expect, it } from 'vitest';
import { generatePalettes } from '../../src/core/palette/generate';
import { buildSceneChecklist, checklistMarkdown } from '../../src/core/sceneChecklist';

const p = generatePalettes({
  baseHex: '#4A6CF7',
  scene: 'web',
  style: 'none',
  mood: 'none',
  harmony: 'auto',
  seed: 5,
  count: 1,
  now: 1,
})[0];

describe('场景清单', () => {
  it('覆盖 10 个场景，每个 6 个角色', () => {
    const items = buildSceneChecklist(p);
    expect(items).toHaveLength(10);
    for (const item of items) {
      expect(item.rows).toHaveLength(6);
      expect(item.rows[0].hex).toMatch(/^#[0-9A-F]{6}$/);
      expect(item.rows[0].use.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('Markdown 含场景、角色与提示', () => {
    const items = buildSceneChecklist(p);
    const md = checklistMarkdown(p, items);
    expect(md).toContain('# 场景清单');
    expect(md).toContain('## 穿搭');
    expect(md).toContain('## 网页');
    expect(md).toContain('文字/背景');
    expect(md).toContain('> ');
  });
});
