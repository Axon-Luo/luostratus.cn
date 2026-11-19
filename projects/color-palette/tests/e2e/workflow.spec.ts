import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

test.describe('撤销重做与快捷键', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/studio');
    await expect(page.locator('article.palette')).toHaveCount(3);
  });

  test('换一批后可撤销与重做', async ({ page }) => {
    const undo = page.getByRole('button', { name: '撤销', exact: true });
    const redo = page.getByRole('button', { name: '重做', exact: true });
    const first = page.locator('article.palette').first();
    const hexOf = () => first.locator('.swatch-hex').first().textContent();

    await expect(undo).toBeDisabled();
    const before = await hexOf();
    await page.getByRole('button', { name: /换一批配色/ }).click();
    await expect(undo).toBeEnabled();
    await expect.poll(hexOf).not.toBe(before);

    await undo.click();
    await expect.poll(hexOf).toBe(before);
    await expect(redo).toBeEnabled();

    await redo.click();
    await expect.poll(hexOf).not.toBe(before);
  });

  test('空格换一批，Ctrl+Z 撤销，Ctrl+Shift+Z 重做', async ({ page }) => {
    const first = page.locator('article.palette').first();
    const hexOf = () => first.locator('.swatch-hex').first().textContent();
    const before = await hexOf();

    await page.keyboard.press('Space');
    await expect.poll(hexOf).not.toBe(before);
    const generated = await hexOf();

    await page.keyboard.press('Control+z');
    await expect.poll(hexOf).toBe(before);

    await page.keyboard.press('Control+Shift+z');
    await expect.poll(hexOf).toBe(generated);
  });

  test('方向键微调基础色亮度', async ({ page }) => {
    const value = () => page.locator('.source-meta strong').textContent();
    const before = await value();
    await page.keyboard.press('ArrowUp');
    await expect.poll(value).not.toBe(before);
  });

  test('输入框内按键不触发快捷键', async ({ page }) => {
    const input = page.getByLabel('输入颜色值');
    await input.focus();
    const before = await page.locator('article.palette .swatch-hex').first().textContent();
    await page.keyboard.press('Space');
    await expect(page.locator('article.palette .swatch-hex').first()).toHaveText(before ?? '');
  });
});

test.describe('配色并排对比', () => {
  test('选择两套方案自动打开对比，并可带回工作台', async ({ page }) => {
    await page.goto('/#/library');
    await page.getByRole('tab', { name: /历史/ }).click();
    const items = page.locator('.library-list li');
    await expect(items).toHaveCount(3);

    await items.nth(0).getByRole('button', { name: '对比', exact: true }).click();
    await expect(page.locator('.compare-hint')).toContainText('再选一套');

    await items.nth(1).getByRole('button', { name: '对比', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: '配色对比' })).toBeVisible();
    await expect(dialog.locator('.compare-side')).toHaveCount(2);
    await expect(dialog.locator('.compare-table')).toContainText('APCA Lc');

    await dialog.getByRole('button', { name: '带这套去工作台' }).first().click();
    await expect(page).toHaveURL(/#\/studio/);
    await expect(page.locator('article.palette')).toHaveCount(1);
  });
});

test.describe('小课堂扩充', () => {
  test('难度筛选、实时对比度示例、下一篇与已读标记', async ({ page }) => {
    await page.goto('/#/learn');
    await expect(page.locator('.lesson-card')).toHaveCount(8);
    await page.getByRole('tab', { name: /进阶/ }).click();
    await expect(page.locator('.lesson-card')).toHaveCount(5);
    await page.getByRole('tab', { name: /全部/ }).click();

    await page.locator('.lesson-card').nth(1).getByRole('button', { name: '开始阅读' }).click();
    const samples = page.locator('.lesson-sample');
    await expect(samples).toHaveCount(4);
    await expect(samples.nth(1)).toContainText('4.54:1');
    await expect(samples.nth(1).locator('.badge')).toHaveText('达标');
    await expect(samples.nth(2).locator('.badge')).toHaveText('未达标');

    await page.getByRole('button', { name: /下一篇/ }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('色觉多样性');

    await page.getByRole('button', { name: '回到小课堂' }).click();
    await expect(page.locator('.lesson-read')).toHaveCount(2);
    await expect(
      page.locator('.lesson-card').nth(1).getByRole('button', { name: '继续阅读' }),
    ).toBeVisible();
  });
});

test.describe('无障碍审计报告', () => {
  test('展示检查结论并下载 HTML 报告', async ({ page }) => {
    await page.goto('/#/studio');
    await expect(page.locator('article.palette')).toHaveCount(3);

    await page.getByRole('button', { name: '审计报告', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: '无障碍审计报告' })).toBeVisible();
    await expect(dialog.locator('.audit-summary')).toContainText('项通过');
    await expect(dialog.locator('.audit-list li')).toHaveCount(5);

    const downloadPromise = page.waitForEvent('download');
    await dialog.getByRole('button', { name: '下载 HTML 报告' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/无障碍审计.*\.html$/);
  });
});

test.describe('渐变交互升级', () => {
  test('色标轨拖拽、点击添加与删除', async ({ page }) => {
    await page.goto('/#/gradient');
    const rail = page.locator('.gradient-rail');
    await expect(page.locator('.gradient-handle')).toHaveCount(3);
    const box = await rail.boundingBox();
    const handle = page.locator('.gradient-handle').nth(1);
    const hb = await handle.boundingBox();
    if (!box || !hb) throw new Error('色标轨不可见');
    await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.8, hb.y + hb.height / 2, { steps: 8 });
    await page.mouse.up();
    await expect(handle).toHaveAttribute('aria-valuenow', '80');
    await expect(page.locator('.gradient-preview span')).toContainText('80%');
    await rail.click({ position: { x: box.width * 0.25, y: box.height / 2 } });
    await expect(page.locator('.gradient-handle')).toHaveCount(4);
    await expect(page.locator('.gradient-stop')).toHaveCount(4);
    await page.getByRole('button', { name: '删除色标 4' }).click();
    await expect(page.locator('.gradient-handle')).toHaveCount(3);
  });

  test('角度旋钮键盘可调，预设与反转随机生效', async ({ page }) => {
    await page.goto('/#/gradient');
    const dial = page.getByRole('slider', { name: '渐变角度旋钮' });
    await dial.focus();
    await page.keyboard.press('ArrowRight');
    await expect(dial).toHaveAttribute('aria-valuenow', '136');
    await page.getByRole('button', { name: '日落' }).click();
    await expect(page.locator('.gradient-preview span')).toContainText('linear-gradient(160deg');
    const before = await page.locator('.gradient-preview span').textContent();
    await page.getByRole('button', { name: '反转', exact: true }).click();
    await expect(page.locator('.gradient-preview span')).not.toHaveText(before ?? '');
    await page.getByRole('button', { name: '随机灵感' }).click();
    await expect(page.locator('.gradient-preview span')).toContainText('gradient');
  });

  test('导出尺寸可选，文字叠加开关同步预览与 PNG', async ({ page }) => {
    await page.goto('/#/gradient');
    await page.getByLabel('导出尺寸').selectOption('square');
    await page.getByRole('switch', { name: /文字叠加/ }).click();
    await expect(page.locator('.gradient-preview strong')).toHaveCount(0);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出 PNG' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('1080x1080');
    const buffer = readFileSync((await download.path()) as string);
    expect(buffer.readUInt32BE(16)).toBe(1080);
    expect(buffer.readUInt32BE(20)).toBe(1080);
  });

  test('径向中心滑杆改变 CSS 与预览', async ({ page }) => {
    await page.goto('/#/gradient');
    await page.getByRole('button', { name: '径向', exact: true }).click();
    await page.getByLabel('中心横向位置').fill('20');
    await page.getByLabel('中心纵向位置').fill('30');
    await expect(page.locator('.gradient-preview span')).toContainText('circle at 20% 30%');
  });
});
