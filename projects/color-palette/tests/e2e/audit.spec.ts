import { expect, test } from '@playwright/test';

test.describe('工具审计修复', () => {
  test('穿搭换一周每次都会重新生成', async ({ page }) => {
    await page.goto('/#/outfit');
    await page.locator('.outfit-day').first().waitFor();
    const read = () => page.locator('.outfit-hex').allTextContents();
    const initial = await read();
    await page.getByRole('button', { name: '换一周' }).click();
    await expect.poll(read).not.toEqual(initial);
    const a = await read();
    await page.getByRole('button', { name: '换一周' }).click();
    await expect.poll(read).not.toEqual(a);
    const b = await read();
    await page.getByRole('button', { name: '换一周' }).click();
    await expect.poll(read).not.toEqual(b);
  });

  test('排明度反馈区分排对与排错并显示正确顺序', async ({ page }) => {
    await page.goto('/#/play');
    await page.getByRole('button', { name: '排明度' }).click();
    await page.getByRole('button', { name: '开始挑战' }).click();
    const count = await page.locator('.play-option').count();
    for (let i = 0; i < count; i += 1) await page.locator('.play-option').nth(i).click();
    await page.getByRole('button', { name: '提交顺序' }).click();
    await expect(page.locator('.play-feedback')).toBeVisible();
    const correct = await page.locator('.play-option.is-correct').count();
    const miss = await page.locator('.play-option.is-miss').count();
    expect(correct + miss).toBe(count);
    const verdict = await page.locator('.play-feedback strong').textContent();
    if (verdict === '顺序不对') {
      expect(miss).toBeGreaterThan(0);
      expect(correct).toBeLessThan(count);
      await expect(page.locator('.play-rank-you').first()).toBeVisible();
    } else {
      expect(correct).toBe(count);
    }
    const ranks = await page.locator('.play-option > span').allTextContents();
    expect(ranks.map(Number).sort((x, y) => x - y)).toEqual(
      Array.from({ length: count }, (_, i) => i + 1),
    );
  });

  test('结算后切换题型回到准备界面', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/#/play');
    await page.getByRole('button', { name: '开始挑战' }).click();
    for (let i = 0; i < 10; i += 1) {
      await page.locator('.play-option').first().click();
      await page.locator('.play-feedback').waitFor();
      await page.waitForTimeout(950);
    }
    await expect(page.locator('.play-result')).toBeVisible();
    await page.getByRole('button', { name: '排明度' }).click();
    await expect(page.getByRole('button', { name: '开始挑战' })).toBeVisible();
  });

  test('移动端色阶可横滑且标签吸附', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#/scales');
    await page.locator('.scale-step').first().waitFor();
    const box = await page.locator('.scale-step').first().boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(40);
    const scrollable = await page
      .locator('.scale-list')
      .evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(scrollable).toBe(true);
    await page.locator('.scale-list').evaluate((el) => {
      el.scrollLeft = 240;
    });
    const label = await page.locator('.scale-label').nth(1).boundingBox();
    const list = await page.locator('.scale-list').boundingBox();
    expect(Math.abs((label?.x ?? 0) - (list?.x ?? 0))).toBeLessThan(4);
  });
});