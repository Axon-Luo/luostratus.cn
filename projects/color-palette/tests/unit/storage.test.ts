import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearPersisted,
  DEFAULT_SETTINGS,
  defaultPersisted,
  loadPersisted,
  savePersisted,
} from '../../src/core/storage';
import { generatePalettes } from '../../src/core/palette/generate';

function samplePalette() {
  return generatePalettes({
    baseHex: '#4A6CF7',
    scene: 'web',
    style: 'none',
    mood: 'none',
    harmony: 'auto',
    seed: 7,
    count: 1,
    now: 1,
  })[0];
}

describe('本地存储 v2', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('空存储返回 v2 默认值', () => {
    const data = loadPersisted();
    expect(data.version).toBe(2);
    expect(data.favorites).toEqual([]);
    expect(data.settings).toEqual(DEFAULT_SETTINGS);
    expect(data.daily.streak).toBe(0);
    expect(data.challenge.best).toBe(0);
  });

  it('保存后可以读回', () => {
    const data = defaultPersisted();
    data.settings.scene = 'food';
    data.settings.baseColor = '#0FA36B';
    data.daily.streak = 4;
    expect(savePersisted(data)).toBe(true);
    const back = loadPersisted();
    expect(back.settings.scene).toBe('food');
    expect(back.settings.baseColor).toBe('#0FA36B');
    expect(back.daily.streak).toBe(4);
  });

  it('损坏的 v2 JSON 回退默认值', () => {
    localStorage.setItem('cf.v2', '{oops');
    expect(loadPersisted().settings).toEqual(DEFAULT_SETTINGS);
  });

  it('v1 数据迁移到 v2，不丢收藏与设置', () => {
    const palette = samplePalette();
    localStorage.setItem(
      'cf.v1',
      JSON.stringify({
        version: 1,
        favorites: [palette],
        history: [palette],
        settings: { baseColor: '#E53935', scene: 'poster' },
      }),
    );
    const data = loadPersisted();
    expect(data.version).toBe(2);
    expect(data.favorites).toHaveLength(1);
    expect(data.history).toHaveLength(1);
    expect(data.settings.baseColor).toBe('#E53935');
    expect(data.settings.scene).toBe('poster');
    expect(data.settings.pairMode).toBe(false);
  });

  it('v2 版本不匹配时尝试迁移 v1', () => {
    localStorage.setItem('cf.v2', JSON.stringify({ version: 9 }));
    const palette = samplePalette();
    localStorage.setItem(
      'cf.v1',
      JSON.stringify({ version: 1, favorites: [palette], history: [], settings: {} }),
    );
    expect(loadPersisted().favorites).toHaveLength(1);
  });

  it('清除后回到默认值，并同时清掉旧 key', () => {
    localStorage.setItem('cf.v1', JSON.stringify({ version: 1, favorites: [], history: [], settings: {} }));
    const data = defaultPersisted();
    savePersisted(data);
    clearPersisted();
    expect(loadPersisted().favorites).toEqual([]);
    expect(localStorage.getItem('cf.v1')).toBeNull();
  });
});
