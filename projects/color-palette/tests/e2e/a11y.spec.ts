import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function audit(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    // 预览区是「用户配色在真实界面里的视觉模拟」，对比度由方案决定而非界面本身；
    // 它已在 DOM 中标记 aria-hidden，并由 sr-only 文本给出等价信息。
    .exclude('.preview-shell')
    .exclude('.hero-deck')
    // 小课堂的对比度示例刻意包含不达标组合，用于教学；
    // 色值与实时比值已在示例下方以文字给出等价信息。
    .exclude('.lesson-samples')
    // 对比度修复器的预览区是「用户当前前景/背景」的视觉模拟，可能刻意不达标；
    // 实时比值与四档判定已在预览上方以文字给出等价信息。
    .exclude('.contrast-preview')
    .analyze();
  return results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
}

test.describe('可访问性', () => {
  test('首页无严重可访问性问题', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForTimeout(300);
    const violations = await audit(page);
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test('工作台无严重可访问性问题', async ({ page }) => {
    await page.goto('/#/studio');
    await page.locator('article.palette').first().waitFor();
    await page.waitForTimeout(300);
    const violations = await audit(page);
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test('关于页无严重可访问性问题', async ({ page }) => {
    await page.goto('/#/about');
    await page.waitForTimeout(200);
    const violations = await audit(page);
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test('深色工作台无严重可访问性问题', async ({ page }) => {
    await page.goto('/#/');
    if ((await page.locator('html').getAttribute('data-theme')) !== 'dark') {
      await page.getByRole('button', { name: '切换到深色' }).click();
    }
    await page.goto('/#/studio');
    await page.locator('article.palette').first().waitFor();
    await page.waitForTimeout(300);
    const violations = await audit(page);
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test('我的方案页无严重可访问性问题', async ({ page }) => {
    await page.goto('/#/library');
    await page.waitForTimeout(300);
    const violations = await audit(page);
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test('每日一色页无严重可访问性问题', async ({ page }) => {
    await page.goto('/#/daily');
    await page.waitForTimeout(400);
    const violations = await audit(page);
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test('配色挑战页无严重可访问性问题', async ({ page }) => {
    await page.goto('/#/play');
    await page.waitForTimeout(300);
    const violations = await audit(page);
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test('案例库页无严重可访问性问题', async ({ page }) => {
    await page.goto('/#/cases');
    await page.waitForTimeout(300);
    const violations = await audit(page);
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test('小课堂页无严重可访问性问题', async ({ page }) => {
    await page.goto('/#/learn');
    await page.waitForTimeout(300);
    const violations = await audit(page);
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test('一周穿搭页无严重可访问性问题', async ({ page }) => {
    await page.goto('/#/outfit');
    await page.waitForTimeout(300);
    const violations = await audit(page);
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test('房间刷色页无严重可访问性问题', async ({ page }) => {
    await page.goto('/#/room');
    await page.waitForTimeout(300);
    const violations = await audit(page);
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test('礼物贺卡页无严重可访问性问题', async ({ page }) => {
    await page.goto('/#/card');
    await page.waitForTimeout(600);
    const violations = await audit(page);
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test('打印色卡页无严重可访问性问题', async ({ page }) => {
    await page.goto('/#/print');
    await page.waitForTimeout(600);
    const violations = await audit(page);
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test('主题配色页无严重可访问性问题', async ({ page }) => {
    await page.goto('/#/themes');
    await page.waitForTimeout(400);
    const violations = await audit(page);
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test('工具中心无严重可访问性问题', async ({ page }) => {
    await page.goto('/#/tools');
    await page.waitForTimeout(300);
    const violations = await audit(page);
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test('渐变页无严重可访问性问题', async ({ page }) => {
    await page.goto('/#/gradient');
    await page.waitForTimeout(300);
    const violations = await audit(page);
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test('色阶与令牌页无严重可访问性问题', async ({ page }) => {
    await page.goto('/#/scales');
    await page.waitForTimeout(300);
    const violations = await audit(page);
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test('混色实验室页无严重可访问性问题', async ({ page }) => {
    await page.goto('/#/mix');
    await page.waitForTimeout(300);
    const violations = await audit(page);
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test('传统色字典页无严重可访问性问题', async ({ page }) => {
    await page.goto('/#/traditional');
    await page.waitForTimeout(300);
    const violations = await audit(page);
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test('对比度修复器页无严重可访问性问题', async ({ page }) => {
    await page.goto('/#/contrast');
    await page.waitForTimeout(300);
    const violations = await audit(page);
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
