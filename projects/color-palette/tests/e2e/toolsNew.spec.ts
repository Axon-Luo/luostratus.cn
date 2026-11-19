import { expect, test } from '@playwright/test';

const setRange = async (page: import('@playwright/test').Page, value: string): Promise<void> => {
  await page.locator('#mix-ratio').evaluate((el, v) => {
    const input = el as HTMLInputElement;
    input.value = v;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
};

test.describe('混色实验室', () => {
  test('比例端点与预设回到原色', async ({ page }) => {
    await page.goto('/#/mix');
    await page.locator('.mix-card').first().waitFor();
    await setRange(page, '0');
    await expect(page.locator('.mix-title span').first()).toHaveText('#E4572E');
    await expect(page.locator('.mix-title span').nth(1)).toHaveText('#E4572E');
    await page.getByRole('button', { name: 'B 100%' }).click();
    await expect(page.locator('.mix-title span').first()).toHaveText('#2E6FE4');
    await expect(page.locator('.mix-title span').nth(1)).toHaveText('#2E6FE4');
  });

  test('中点颜料比光更暗且可复制', async ({ page }) => {
    await page.goto('/#/mix');
    await page.locator('.mix-card').first().waitFor();
    await page.getByRole('button', { name: 'B 50%' }).click();
    const pigment = await page.locator('.mix-title span').first().textContent();
    const light = await page.locator('.mix-title span').nth(1).textContent();
    expect(pigment).not.toBe(light);
    await page.getByRole('button', { name: '复制色值' }).first().click();
    await expect(page.getByRole('status')).toHaveText('已复制');
  });

  test('简写色值提交后立即归一化', async ({ page }) => {
    await page.goto('/#/mix');
    await page.getByLabel('颜色 A色值').fill('#abc');
    await page.getByLabel('颜色 A色值').press('Enter');
    await expect(page.getByLabel('颜色 A色值')).toHaveValue('#AABBCC');
  });

  test('带回工作台生成混色实验方案', async ({ page }) => {
    await page.goto('/#/mix');
    await page.getByRole('button', { name: '带回工作台' }).click();
    await expect(page.getByRole('status')).toHaveText('已带回工作台');
    await page.goto('/#/studio');
    await expect(page.getByText('混色实验').first()).toBeVisible();
  });
});

test.describe('传统色字典', () => {
  test('搜索与空态', async ({ page }) => {
    await page.goto('/#/traditional');
    await expect(page.locator('.trad-swatch')).toHaveCount(118);
    await page.getByLabel('搜索传统色').fill('月白');
    await expect(page.locator('.trad-swatch')).toHaveCount(1);
    await page.getByLabel('搜索传统色').fill('不存在的颜色');
    await expect(page.locator('.empty')).toBeVisible();
  });

  test('色系筛选与色卡复制', async ({ page }) => {
    await page.goto('/#/traditional');
    await page.getByRole('button', { name: '红', exact: true }).click();
    await expect(page.locator('.trad-swatch')).toHaveCount(22);
    await page.locator('.trad-swatch').first().click();
    await expect(page.getByRole('status')).toContainText('已复制 粉红');
  });

  test('近色查询给出名字与距离', async ({ page }) => {
    await page.goto('/#/traditional');
    await expect(page.locator('.trad-nearest strong')).not.toHaveText('');
    await expect(page.locator('.trad-nearest-text em')).toContainText('ΔE ≈');
    await page.getByLabel('你的颜色色值').fill('#D6ECF0');
    await page.getByLabel('你的颜色色值').press('Enter');
    await expect(page.locator('.trad-nearest strong')).toHaveText('月白');
    await expect(page.locator('.trad-nearest-text em')).toHaveText('ΔE ≈ 0.0');
  });
});

test.describe('对比度修复器', () => {
  test('判定徽章与一键修前景', async ({ page }) => {
    await page.goto('/#/contrast');
    await expect(page.locator('.badge.bad').first()).toBeVisible();
    await page.locator('.fix-row').first().getByRole('button', { name: '应用' }).click();
    const ratio = parseFloat((await page.locator('.contrast-score strong').textContent()) ?? '0');
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    await expect(page.locator('.contrast-badges .badge').first()).toHaveClass(/ok/);
  });

  test('中灰背景 AAA 不可达时给出上限提示', async ({ page }) => {
    await page.goto('/#/contrast');
    await page.getByLabel('前景 / 文字色值').fill('#17171A');
    await page.getByLabel('前景 / 文字色值').press('Enter');
    await page.getByLabel('背景色值').fill('#808080');
    await page.getByLabel('背景色值').press('Enter');
    await page.getByRole('button', { name: 'AAA 正文 7' }).click();
    await expect(page.locator('.fix-row').first()).toContainText('不可达');
    await expect(page.locator('.fix-row').nth(1).getByRole('button', { name: '应用' })).toBeVisible();
  });

  test('交换前景背景', async ({ page }) => {
    await page.goto('/#/contrast');
    await page.getByRole('button', { name: '交换' }).click();
    await expect(page.getByLabel('前景 / 文字色值')).toHaveValue('#FFFFFF');
    await expect(page.getByLabel('背景色值')).toHaveValue('#8A8A93');
  });
});

test.describe('新工具移动端', () => {
  test('三个新页面 390px 无横向滚动', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const path of ['/#/mix', '/#/traditional', '/#/contrast']) {
      await page.goto(path);
      await page.locator('.page-head').waitFor();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    }
  });
});