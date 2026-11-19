import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

test.describe('首页与导航', () => {
  test('首页可打开并进入工作台', async ({ page }) => {
    await page.goto('/#/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('把生活');
    await expect(page.locator('.deck-card')).toHaveCount(6);
    await page.getByRole('link', { name: /开始配色/ }).first().click();
    await expect(page).toHaveURL(/#\/studio/);
    await expect(page.getByRole('heading', { name: '工作台' })).toBeVisible();
  });

  test('关于页可打开', async ({ page }) => {
    await page.goto('/#/about');
    await expect(page.getByRole('heading', { name: '关于配色工坊' })).toBeVisible();
  });
});

test.describe('工作台核心链路', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/studio');
    await expect(page.locator('article.palette')).toHaveCount(3);
  });

  test('生成三套方案并可以换一批', async ({ page }) => {
    const first = page.locator('article.palette').first();
    const before = await first.locator('.swatch-hex').first().textContent();
    await page.getByRole('button', { name: /换一批配色/ }).click();
    await expect
      .poll(async () => first.locator('.swatch-hex').first().textContent())
      .not.toBe(before);
  });

  test('锁定主色后重新生成保持不变', async ({ page }) => {
    const first = page.locator('article.palette').first();
    const primary = await first.locator('.swatch-hex').first().textContent();
    await page.getByRole('button', { name: '主色', exact: true }).click();
    await page.getByRole('button', { name: /换一批配色/ }).click();
    await expect
      .poll(async () => first.locator('.swatch-hex').first().textContent())
      .toBe(primary);
  });

  test('输入色值会更新基础色', async ({ page }) => {
    await page.getByLabel('输入颜色值').fill('#E53935');
    await page.getByRole('button', { name: '应用' }).click();
    await expect(page.locator('.swatch-big')).toHaveCSS('background-color', 'rgb(229, 57, 53)');
    await expect(page.locator('.source-meta strong')).toHaveText('#E53935');
  });

  test('切换预览场景', async ({ page }) => {
    await page.getByRole('tab', { name: '网页' }).click();
    await expect(page.locator('.pv-web')).toBeVisible();
    await page.getByRole('tab', { name: '海报' }).click();
    await expect(page.locator('.pv-poster')).toBeVisible();
    await page.getByRole('tab', { name: '壁纸' }).click();
    await expect(page.locator('.pv-wallpaper')).toBeVisible();
    await page.getByRole('tab', { name: '穿搭' }).click();
    await expect(page.locator('.pv-outfit')).toBeVisible();
  });

  test('深色预览与色觉模拟生效', async ({ page }) => {
    const lightBg = await page.locator('.pv-phone').evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    await page.getByRole('tab', { name: '深色', exact: true }).click();
    await expect
      .poll(async () =>
        page.locator('.pv-phone').evaluate((el) => getComputedStyle(el).backgroundColor),
      )
      .not.toBe(lightBg);
    await page.getByRole('tab', { name: '绿色盲' }).click();
    await expect(page.getByRole('tab', { name: '绿色盲' })).toHaveAttribute('aria-selected', 'true');
    const previewCard = page.locator('section.card', {
      has: page.getByRole('heading', { name: '实时预览' }),
    });
    await expect(previewCard.getByRole('tab', { name: '绿色盲' })).toBeVisible();
  });

  test('收藏后出现在我的方案里', async ({ page }) => {
    await page.locator('article.palette .star').first().click();
    await page.getByRole('tab', { name: /收藏/ }).click();
    await expect(page.locator('.saved-list li')).toHaveCount(1);
  });

  test('分享会复制链接', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.locator('article.palette').first().getByRole('button', { name: '分享', exact: true }).click();
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toContain('#/s/');
  });

  test('导出 CSS 文件', async ({ page }) => {
    await page.locator('details.menu summary').first().click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出 CSS' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.css$/);
    const file = await download.path();
    const text = readFileSync(file as string, 'utf8');
    expect(text).toContain('--color-primary');
    expect(text).toContain('#');
  });

  test('上传图片后出现取色画布与主色', async ({ page }) => {
    const dataUrl = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 48;
      canvas.height = 48;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';
      ctx.fillStyle = '#E53935';
      ctx.fillRect(0, 0, 24, 48);
      ctx.fillStyle = '#1E88E5';
      ctx.fillRect(24, 0, 24, 48);
      return canvas.toDataURL('image/png');
    });
    const buffer = Buffer.from(dataUrl.split(',')[1], 'base64');
    await page.getByLabel('上传图片').setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer,
    });
    await expect(page.locator('.picker-frame canvas')).toBeVisible();
    await expect
      .poll(async () => page.locator('.mini-swatches button').count())
      .toBeGreaterThan(0);
  });

  test('严格无障碍开启后彩色仍达到 3:1', async ({ page }) => {
    await page.getByRole('switch', { name: /严格无障碍/ }).click();
    const rows = page.locator('.access-list li');
    await expect(rows).toHaveCount(4);
    for (let i = 0; i < 4; i++) {
      const badge = rows.nth(i).locator('.badge');
      await expect(badge).not.toHaveText('未通过');
    }
  });
});

test.describe('主题与响应式', () => {
  test('主题可以切换并持久化', async ({ page }) => {
    await page.goto('/#/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.getByRole('button', { name: '切换到浅色' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('移动端没有横向滚动', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#/studio');
    await expect(page.locator('article.palette')).toHaveCount(3);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});

test.describe('分享、导出与持久化', () => {
  test('分享链接能在新标签页还原同一套配色', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/#/studio');
    const card = page.locator('article.palette').first();
    await card.waitFor();
    const primary = await card.locator('.swatch-hex').first().textContent();
    await card.getByRole('button', { name: '分享', exact: true }).click();
    const link = (await page.evaluate(() => navigator.clipboard.readText())).trim();
    expect(link).toContain('#/s/');

    const shared = await context.newPage();
    await shared.goto(link);
    await expect(shared.locator('.banner')).toContainText('朋友分享');
    await expect(shared.locator('article.palette').first().locator('.swatch-hex').first()).toHaveText(
      primary as string,
    );
    await shared.close();
  });

  test('导出的 PNG 是有效图片', async ({ page }) => {
    await page.goto('/#/studio');
    await page.locator('article.palette').first().waitFor();
    await page.locator('details.menu summary').first().click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出 PNG' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.png$/);
    const file = await download.path();
    const bytes = readFileSync(file as string);
    expect(bytes.length).toBeGreaterThan(10_000);
    expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  });

  test('一键修复后四项都达标', async ({ page }) => {
    await page.goto('/#/studio');
    await page.getByLabel('输入颜色值').fill('#F6D365');
    await page.getByRole('button', { name: '应用' }).click();
    await page.getByRole('button', { name: /一键修复/ }).click();
    const badges = page.locator('.access-list .badge');
    await expect(badges).toHaveCount(4);
    for (let i = 0; i < 4; i++) {
      await expect(badges.nth(i)).not.toHaveText('未通过');
    }
  });

  test('收藏在刷新后仍然存在', async ({ page }) => {
    await page.goto('/#/studio');
    await page.locator('article.palette .star').first().click();
    await page.reload();
    await expect(page.getByRole('tab', { name: /收藏 1/ })).toBeVisible();
  });
});

test.describe('离线能力', () => {
  test('第二次访问可以断网打开', async ({ page, context }) => {
    await page.goto('/#/studio');
    await page.locator('article.palette').first().waitFor();
    await page.waitForFunction(
      () => navigator.serviceWorker != null && navigator.serviceWorker.controller != null,
      null,
      { timeout: 15_000 },
    );
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading', { name: '工作台' })).toBeVisible();
    await context.setOffline(false);
  });
});

test('子页面有返回上一级与面包屑', async ({ page }) => {
  await page.goto('/#/gradient');
  const back = page.getByRole('link', { name: '返回工具' });
  await expect(back).toBeVisible();
  await expect(back).toHaveAttribute('href', '#/tools');
  await expect(page.locator('.breadcrumbs')).toContainText('渐变生成器');
  await expect(page.locator('.nav a.is-on')).toHaveText('工具');
  await back.click();
  await expect(page).toHaveURL(/#\/tools/);
  await expect(page.locator('.page-head h1')).toHaveText('工具');
});