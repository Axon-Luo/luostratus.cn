import { describe, expect, it } from 'vitest';
import { generatePalettes } from '../../src/core/palette/generate';
import { DEFAULT_SETTINGS } from '../../src/core/storage';
import { createLibraryBackup, mergePalettes, parseLibraryBackup, paletteSignature } from '../../src/core/library';

function palette(seed: number) {
  return generatePalettes({
    baseHex: '#4A6CF7',
    scene: 'outfit',
    style: 'none',
    mood: 'none',
    harmony: 'auto',
    seed,
    count: 1,
    now: 1,
  })[0];
}

describe('方案库备份', () => {
  it('导出后可解析回同样的方案', () => {
    const p = palette(7);
    const json = JSON.stringify(createLibraryBackup([p], [p], DEFAULT_SETTINGS));
    const parsed = parseLibraryBackup(json);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.data.favorites).toHaveLength(1);
    expect(paletteSignature(parsed.data.favorites[0])).toBe(paletteSignature(p));
  });

  it('拒绝非本应用的 JSON', () => {
    expect(parseLibraryBackup('{"hello":1}').ok).toBe(false);
    expect(parseLibraryBackup('not json').ok).toBe(false);
  });

  it('跳过损坏的方案但保留正常的方案', () => {
    const p = palette(9);
    const json = JSON.stringify({
      kind: 'colorlife-library',
      schemaVersion: 1,
      exportedAt: '',
      favorites: [p, { colors: [] }, null],
      history: [],
      settings: DEFAULT_SETTINGS,
    });
    const parsed = parseLibraryBackup(json);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.data.favorites).toHaveLength(1);
    expect(parsed.skipped).toBe(2);
  });

  it('合并时按颜色签名去重', () => {
    const a = palette(1);
    const b = palette(2);
    const merged = mergePalettes([a], [a, b]);
    expect(merged).toHaveLength(2);
    expect(merged[1].id).toBe(b.id);
  });
});
