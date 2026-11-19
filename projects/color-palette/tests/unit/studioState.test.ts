import { describe, expect, it } from 'vitest';
import { lockMap, palettes, renamePalette, undoState, updatePaletteColor } from '../../src/state';

describe('工作台无操作守卫', () => {
  it('颜色未变化时不锁定角色、不产生撤销记录', () => {
    const p = palettes.value[0];
    const primary = p.colors.find((c) => c.role === 'primary')!;
    const beforeUndo = undoState.value.canUndo;
    const beforeUpdated = p.updatedAt;
    lockMap.value = {};

    updatePaletteColor(p.id, 'primary', primary.hex);

    expect(lockMap.value.primary).toBeUndefined();
    expect(undoState.value.canUndo).toBe(beforeUndo);
    expect(palettes.value.find((x) => x.id === p.id)!.updatedAt).toBe(beforeUpdated);
  });

  it('颜色变化时正常锁定角色', () => {
    const p = palettes.value[0];
    const primary = p.colors.find((c) => c.role === 'primary')!;
    const next = primary.hex === '#123456' ? '#654321' : '#123456';
    lockMap.value = {};

    updatePaletteColor(p.id, 'primary', next);

    expect(lockMap.value.primary).toBe(next);
  });

  it('重命名为相同名字不更新时间戳', () => {
    const p = palettes.value[0];
    renamePalette(p, '测试名字');
    const named = palettes.value.find((x) => x.id === p.id)!;
    const listBefore = palettes.value;

    renamePalette(named, '测试名字');

    expect(palettes.value).toBe(listBefore);
    expect(palettes.value.find((x) => x.id === p.id)!.updatedAt).toBe(named.updatedAt);
  });
});