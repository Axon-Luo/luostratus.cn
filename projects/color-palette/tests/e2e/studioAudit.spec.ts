import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function solidPng(page: Page, hex: string): Promise<Buffer> {
  const dataUrl = await page.evaluate((color) => {
    const cv = document.createElement('canvas');
    cv.width = 40;
    cv.height = 40;
    const ctx = cv.getContext('2d')!;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 40, 40);
    return cv.toDataURL('image/png');
  }, hex);
  return Buffer.from(dataUrl.split(',')[1], 'base64');
}

test.describe('开始与素材审计修复', () => {
  test('空格激活聚焦的收藏按钮而不是换一批', async ({ page }) => {
    await page.goto('/#/studio');
    await page.locator('.palette').first().waitFor();
    const hexBefore = await page.locator('.palette .swatch-hex').first().textContent();
    const star = page.getByRole('button', { name: '收藏方案' }).first();
    await star.focus();
    await page.keyboard.press('Space');
    await expect(page.getByRole('button', { name: '取消收藏' }).first()).toBeVisible();
    expect(await page.locator('.palette .swatch-hex').first().textContent()).toBe(hexBefore);
  });

  test('方向键不再劫持聚焦的选项按钮', async ({ page }) => {
    await page.goto('/#/studio');
    await page.locator('.swatch-big').waitFor();
    const baseBefore = await page.locator('.swatch-big span').textContent();
    await page.locator('.field .chips .chip').first().focus();
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(300);
    expect(await page.locator('.swatch-big span').textContent()).toBe(baseBefore);
  });

  test('重命名按 Esc 丢弃草稿', async ({ page }) => {
    await page.goto('/#/studio');
    await page.locator('.palette').first().waitFor();
    const original = await page.locator('.palette-name-row h3').first().textContent();
    await page.getByRole('button', { name: '重命名' }).first().click();
    const input = page.getByLabel('方案名称');
    await input.fill('应该被丢弃');
    await input.press('Escape');
    await expect(page.locator('.palette-name-row h3').first()).toHaveText(original ?? '');
  });

  test('颜色未改动时点完成不产生锁定', async ({ page }) => {
    await page.goto('/#/studio');
    await page.locator('.swatch-chip-btn').first().click();
    await page.getByRole('button', { name: '完成' }).click();
    await expect(page.getByRole('button', { name: '清除全部锁定' })).toHaveCount(0);
  });

  test('切换比例后立刻下载拿到新尺寸的图', async ({ page }) => {
    await page.goto('/#/studio');
    await page.getByRole('button', { name: '分享卡' }).first().click();
    await page.locator('.share-card-preview img').waitFor();
    await page.locator('dialog').getByRole('button', { name: '16:9', exact: true }).click();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: '下载 PNG' }).dispatchEvent('click'),
    ]);
    const file = readFileSync(await download.path());
    expect(file.readUInt32BE(16)).toBe(1920);
    expect(file.readUInt32BE(20)).toBe(1080);
  });

  test('带图离开再回工作台不重置用户选的基础色', async ({ page }) => {
    await page.goto('/#/studio');
    await page.locator('.swatch-big').waitFor();
    const buffer = await solidPng(page, '#3B65C4');
    await page.getByLabel('上传图片').setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer,
    });
    await page.locator('.mini-swatches button').first().waitFor();
    await page.getByLabel('基础色').fill('#6682BB');
    await expect(page.locator('.swatch-big span')).toHaveText('#6682bb');
    await page.goto('/#/library');
    await page.getByRole('heading', { name: '我的方案' }).waitFor();
    await page.goto('/#/studio');
    await page.locator('.picker canvas').waitFor();
    await page.waitForTimeout(400);
    await expect(page.locator('.swatch-big span')).toHaveText('#6682bb');
  });

  test('滚轮只滚动光标所在列', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/#/studio');
    await page.locator('.palette').first().waitFor();
    const side = page.locator('.side');
    const main = page.locator('.main');
    const sideBox = await side.boundingBox();
    await page.mouse.move(sideBox!.x + sideBox!.width / 2, sideBox!.y + 200);
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(200);
    expect(await side.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    expect(await main.evaluate((el) => el.scrollTop)).toBe(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    const sideScroll = await side.evaluate((el) => el.scrollTop);
    const mainBox = await main.boundingBox();
    await page.mouse.move(mainBox!.x + mainBox!.width / 2, mainBox!.y + 200);
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(200);
    expect(await main.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    expect(await side.evaluate((el) => el.scrollTop)).toBe(sideScroll);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('高视口下内容不足一屏的列不带动整页', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 2000 });
    await page.goto('/#/studio');
    await page.locator('.palette').first().waitFor();
    const side = page.locator('.side');
    const fits = await side.evaluate((el) => el.scrollHeight <= el.clientHeight + 1);
    expect(fits).toBe(true);
    const box = await side.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + 200);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    expect(await page.locator('.main').evaluate((el) => el.scrollTop)).toBe(0);
  });

  test('情绪板满 6 张后再加给出提示', async ({ page }) => {
    await page.goto('/#/studio');
    await page.getByRole('button', { name: '情绪板' }).click();
    const buffer = await solidPng(page, '#C44536');
    const files = Array.from({ length: 6 }, (_, i) => ({
      name: `m${i}.png`,
      mimeType: 'image/png',
      buffer,
    }));
    const input = page.getByLabel('选择情绪板图片');
    await input.setInputFiles(files);
    await expect(page.locator('dialog[open] .input-row .hint')).toHaveText('6/6');
    await input.setInputFiles({ name: 'extra.png', mimeType: 'image/png', buffer });
    await expect(page.locator('.toast.is-show')).toHaveText('最多 6 张，先移除一张再加');
    await expect(page.locator('.moodboard-thumb')).toHaveCount(6);
  });
});