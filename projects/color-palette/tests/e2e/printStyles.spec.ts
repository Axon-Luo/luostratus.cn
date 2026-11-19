import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const openPrint = async (page: Page): Promise<void> => {
  await page.goto('/#/print');
  await expect(page.locator('img.print-preview')).toBeVisible({ timeout: 10000 });
};

const paletteHexes = (page: Page): Promise<string[]> =>
  page
    .locator('.independent-color input[type="color"]')
    .evaluateAll((els) => els.map((el) => (el as HTMLInputElement).value.toUpperCase()));

const waitPreviewChange = async (page: Page, previous: string | null): Promise<void> => {
  await page.waitForFunction(
    (prev) => document.querySelector('img.print-preview')?.getAttribute('src') !== prev,
    previous,
    { timeout: 10000 },
  );
};

const switchStyle = async (page: Page, label: string): Promise<void> => {
  const old = await page.locator('img.print-preview').getAttribute('src');
  await page.getByRole('button', { name: label, exact: true }).click();
  await waitPreviewChange(page, old);
};

const pixelAt = (page: Page, x: number, y: number): Promise<string> =>
  page.locator('img.print-preview').evaluate(async (el, point) => {
    const img = el as HTMLImageElement;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no 2d context');
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(point.x, point.y, 1, 1).data;
    return `#${[d[0], d[1], d[2]]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()}`;
  }, { x, y });

const downloadPng = async (page: Page) => {
  await expect(page.getByRole('button', { name: '下载 PNG' })).toBeEnabled({ timeout: 10000 });
  const promise = page.waitForEvent('download');
  await page.getByRole('button', { name: '下载 PNG' }).click();
  const download = await promise;
  return {
    name: download.suggestedFilename(),
    buffer: readFileSync((await download.path()) as string),
  };
};

test.describe('打印色卡版式', () => {
  test('默认经典清单且色块像素与方案一致', async ({ page }) => {
    await openPrint(page);
    const hexes = await paletteHexes(page);
    await expect(page.getByRole('button', { name: '经典清单', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    for (const label of ['大色块海报', '网格色票', '比例条']) {
      await expect(page.getByRole('button', { name: label, exact: true })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    }
    expect(await pixelAt(page, 151, 270)).toBe(hexes[0]);
    expect(await pixelAt(page, 151, 476)).toBe(hexes[1]);
  });

  test('大色块海报色带像素正确并带样式文件名', async ({ page }) => {
    await openPrint(page);
    const hexes = await paletteHexes(page);
    await switchStyle(page, '大色块海报');
    expect(await pixelAt(page, 620, 296)).toBe(hexes[0]);
    expect(await pixelAt(page, 620, 1013)).toBe(hexes[3]);
    const { name, buffer } = await downloadPng(page);
    expect(name).toContain('poster');
    expect(buffer.readUInt32BE(16)).toBe(1240);
    expect(buffer.readUInt32BE(20)).toBe(1754);
  });

  test('网格色票 2×3 色区像素正确', async ({ page }) => {
    await openPrint(page);
    const hexes = await paletteHexes(page);
    await switchStyle(page, '网格色票');
    expect(await pixelAt(page, 341, 350)).toBe(hexes[0]);
    expect(await pixelAt(page, 899, 350)).toBe(hexes[1]);
    expect(await pixelAt(page, 341, 1324)).toBe(hexes[4]);
    const { name } = await downloadPng(page);
    expect(name).toContain('tickets');
  });

  test('比例条横条与明细色块像素正确', async ({ page }) => {
    await openPrint(page);
    const hexes = await paletteHexes(page);
    await switchStyle(page, '比例条');
    expect(await pixelAt(page, 86, 190)).toBe(hexes[0]);
    expect(await pixelAt(page, 104, 435)).toBe(hexes[0]);
    expect(await pixelAt(page, 104, 641)).toBe(hexes[1]);
    const { name } = await downloadPng(page);
    expect(name).toContain('ratio');
  });

  test('A5 海报尺寸与色带像素正确', async ({ page }) => {
    await openPrint(page);
    const hexes = await paletteHexes(page);
    await switchStyle(page, '大色块海报');
    const old = await page.locator('img.print-preview').getAttribute('src');
    await page.getByRole('button', { name: 'A5', exact: true }).click();
    await waitPreviewChange(page, old);
    expect(await pixelAt(page, 437, 256)).toBe(hexes[0]);
    const { buffer } = await downloadPng(page);
    expect(buffer.readUInt32BE(16)).toBe(874);
    expect(buffer.readUInt32BE(20)).toBe(1240);
  });

  test('房间清单隐藏版式且文件名不变', async ({ page }) => {
    await openPrint(page);
    await page.getByRole('button', { name: '房间清单', exact: true }).click();
    await expect(page.locator('.field-label', { hasText: '版式' })).toHaveCount(0);
    await expect(page.locator('img.print-preview')).toBeVisible({ timeout: 10000 });
    const { name } = await downloadPng(page);
    expect(name).toBe('配色工坊-room-A4.png');
    await page.getByRole('button', { name: '色卡', exact: true }).click();
    await expect(page.getByRole('button', { name: '经典清单', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('移动端 390 宽切换版式无横向溢出', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPrint(page);
    await switchStyle(page, '网格色票');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});