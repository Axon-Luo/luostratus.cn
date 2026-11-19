import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

test.describe('v2 工作台升级', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/studio');
    await expect(page.locator('article.palette')).toHaveCount(3);
  });

  test('单色编辑后自动锁定，换一批保持不变', async ({ page }) => {
    const card = page.locator('article.palette').first();
    await card.locator('.swatch-chip-btn').first().click();
    const dialog = page.locator('dialog[open]');
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('颜色值').fill('#E53935');
    await dialog.getByLabel('颜色值').press('Enter');
    await expect(card.locator('.swatch-hex').first()).toHaveText('#E53935');
    await dialog.getByRole('button', { name: '完成' }).click();
    await expect(page.getByRole('button', { name: '主色', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.getByRole('button', { name: /换一批配色/ }).click();
    await expect(page.locator('article.palette').first().locator('.swatch-hex').first()).toHaveText(
      '#E53935',
    );
  });

  test('屏幕吸管取色（mock EyeDropper）', async ({ page }) => {
    await page.goto('/#/studio');
    await page.evaluate(() => {
      Object.defineProperty(window, 'EyeDropper', {
        configurable: true,
        value: class {
          open() {
            return Promise.resolve({ sRGBHex: '#E53935' });
          }
        },
      });
    });
    await page.getByRole('button', { name: '屏幕吸管' }).click();
    await expect(page.locator('.source-meta strong')).toHaveText('#E53935');
  });

  test('导入 hex 列表生成方案', async ({ page }) => {
    await page.getByRole('button', { name: '导入配色' }).click();
    const dialog = page.locator('dialog[open]');
    await dialog.locator('textarea').fill('#E53935 #1E88E5 #F6D365 #111111 #F6F1F1 #FFFFFF');
    await dialog.getByRole('button', { name: '应用' }).click();
    await expect(page.locator('article.palette')).toHaveCount(1);
    await expect(page.locator('article.palette h3').first()).toHaveText('导入的配色');
  });

  test('深色成对与色弱友好开关生效', async ({ page }) => {
    await page.getByRole('switch', { name: /深色成对/ }).click();
    await expect(page.locator('.apca-row').filter({ hasText: '深色版' })).toBeVisible();
    await page.getByRole('switch', { name: /色弱友好/ }).click();
    await expect(page.locator('.apca-row').filter({ hasText: '色弱分离' })).toBeVisible();
  });

  test('摄像头拍照后进入图片取色', async ({ page }) => {
    await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#E53935';
        ctx.fillRect(0, 0, 320, 240);
      }
      const stream = canvas.captureStream(5);
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: { getUserMedia: async () => stream },
      });
    });
    await page.getByRole('button', { name: '摄像头' }).click();
    const dialog = page.locator('dialog[open]');
    await expect(dialog.locator('video')).toBeVisible();
    await expect(dialog.getByRole('button', { name: '快门' })).toBeEnabled({ timeout: 8000 });
    await dialog.getByRole('button', { name: '快门' }).click();
    await expect(page.locator('.picker-frame canvas')).toBeVisible({ timeout: 8000 });
  });

  test('多图情绪板提取并设为基础色', async ({ page }) => {
    const urls = await page.evaluate(() => {
      const make = (color: string) => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = color;
          ctx.fillRect(0, 0, 64, 64);
        }
        return canvas.toDataURL('image/png');
      };
      return [make('#E53935'), make('#1E88E5')];
    });
    const files = urls.map((url, index) => ({
      name: `mood-${index}.png`,
      mimeType: 'image/png',
      buffer: Buffer.from(url.split(',')[1], 'base64'),
    }));
    await page.getByRole('button', { name: '情绪板' }).click();
    const dialog = page.locator('dialog[open]');
    await dialog.locator('input[type=file]').setInputFiles(files);
    await dialog.getByRole('button', { name: '提取颜色' }).click();
    await expect(dialog.locator('.moodboard-colors button').first()).toBeVisible({ timeout: 8000 });
    const before = await page.locator('.source-meta strong').textContent();
    await dialog.locator('.moodboard-colors button').first().click();
    await expect(page.locator('.source-meta strong')).not.toHaveText(before ?? '');
  });

  test('分享卡导出 1080×1440 PNG', async ({ page }) => {
    await page.locator('article.palette').first().getByRole('button', { name: '分享卡' }).click();
    const dialog = page.locator('dialog[open]');
    await expect(dialog.locator('img')).toBeVisible({ timeout: 10000 });
    const downloadPromise = page.waitForEvent('download');
    await dialog.getByRole('button', { name: '下载 PNG' }).click();
    const download = await downloadPromise;
    const path = await download.path();
    const buffer = readFileSync(path as string);
    expect(buffer.readUInt32BE(16)).toBe(1080);
    expect(buffer.readUInt32BE(20)).toBe(1440);
    expect(download.suggestedFilename()).toContain('3x4');
  });
});

test.describe('v2 案例与小课堂', () => {
  test('案例库筛选并可载入工作台', async ({ page }) => {
    await page.goto('/#/cases');
    await expect(page.locator('.case-card')).toHaveCount(8);
    await page.getByRole('button', { name: /海报/ }).click();
    await expect(page.locator('.case-card')).toHaveCount(3);
    await page.locator('.case-card').first().getByRole('button', { name: '用这个方案' }).click();
    await expect(page.locator('article.palette')).toHaveCount(1);
  });

  test('小课堂阅读与示例载入', async ({ page }) => {
    await page.goto('/#/learn');
    await expect(page.locator('.lesson-card')).toHaveCount(8);
    await page.locator('.lesson-card').first().getByRole('button', { name: '开始阅读' }).click();
    await expect(page.locator('.lesson-section')).toHaveCount(5);
    await expect(page.locator('.lesson-table')).toBeVisible();
    await page.getByRole('button', { name: '用这套去工作台试试' }).click();
    await expect(page.locator('article.palette')).toHaveCount(1);
  });
});

test.describe('v2 生活任务', () => {
  test('一周穿搭生成 7 天并导出 1080×1920', async ({ page }) => {
    await page.goto('/#/outfit');
    await expect(page.locator('.outfit-day')).toHaveCount(7);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出周历' }).click();
    const download = await downloadPromise;
    const buffer = readFileSync((await download.path()) as string);
    expect(buffer.readUInt32BE(16)).toBe(1080);
    expect(buffer.readUInt32BE(20)).toBe(1920);
  });

  test('房间刷色 5 个部位并导出 A4', async ({ page }) => {
    await page.goto('/#/room');
    await expect(page.locator('.room-row')).toHaveCount(5);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出 A4 清单' }).click();
    const download = await downloadPromise;
    const buffer = readFileSync((await download.path()) as string);
    expect(buffer.readUInt32BE(16)).toBe(1240);
    expect(buffer.readUInt32BE(20)).toBe(1754);
  });

  test('贺卡五种样式可切换并下载', async ({ page }) => {
    await page.goto('/#/card');
    await expect(page.locator('img.greeting-preview')).toBeVisible({ timeout: 10000 });
    for (const label of ['经典', '极简', '杂志', '渐变', '胶片']) {
      await expect(page.getByRole('button', { name: label, exact: true })).toBeVisible();
    }
    await page.getByRole('button', { name: '极简', exact: true }).click();
    await page.getByPlaceholder('对方的名字').fill('小林');
    await expect(page.getByRole('button', { name: '下载 PNG' })).toBeEnabled({ timeout: 10000 });
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: '下载 PNG' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('minimal');
    const buffer = readFileSync((await download.path()) as string);
    expect(buffer.readUInt32BE(16)).toBe(1080);
    expect(buffer.readUInt32BE(20)).toBe(1440);
  });

  test('打印色卡 A4 / A5 尺寸正确', async ({ page }) => {
    await page.goto('/#/print');
    await expect(page.locator('img.print-preview')).toBeVisible({ timeout: 10000 });
    const first = page.waitForEvent('download');
    await page.getByRole('button', { name: '下载 PNG' }).click();
    const a4 = readFileSync((await (await first).path()) as string);
    expect(a4.readUInt32BE(16)).toBe(1240);
    expect(a4.readUInt32BE(20)).toBe(1754);
    await page.getByRole('button', { name: 'A5', exact: true }).click();
    await page.waitForTimeout(700);
    const second = page.waitForEvent('download');
    await page.getByRole('button', { name: '下载 PNG' }).click();
    const a5 = readFileSync((await (await second).path()) as string);
    expect(a5.readUInt32BE(16)).toBe(874);
    expect(a5.readUInt32BE(20)).toBe(1240);
  });
});

test.describe('v2 每日与挑战', () => {
  test('每日一色固定 6 色并记录连续天数', async ({ page }) => {
    await page.goto('/#/daily');
    await expect(page.locator('.daily-swatches button')).toHaveCount(6);
    await expect(page.locator('.page-head')).toContainText('每日一色');
    await expect(page.locator('.daily-day')).toHaveCount(1);
    await expect(page.locator('.card-head').first()).toContainText('连续 1 天');
  });

  test('配色挑战可以开始并进入下一题', async ({ page }) => {
    await page.goto('/#/play');
    await page.getByRole('button', { name: '开始挑战' }).click();
    await expect(page.locator('.play-option')).toHaveCount(4);
    await page.locator('.play-option').first().click();
    await expect(page.locator('.play-feedback')).toBeVisible();
    await expect(page.locator('.play-last')).toContainText('上一题');
    await expect(page.locator('.card-head')).toContainText('第 2 / 10 题');
  });
});

test.describe('v2 工具中心', () => {
  test('工具卡片可进入已上线工具', async ({ page }) => {
    await page.goto('/#/tools');
    await expect(page.locator('.tool-card')).toHaveCount(16);
    await page.locator('.tool-card', { hasText: '渐变生成器' }).click();
    await expect(page.locator('.page-head')).toContainText('渐变生成器');
  });
});

test.describe('v2 主题与场景清单', () => {
  test('节气/城市主题可载入工作台', async ({ page }) => {
    await page.goto('/#/themes');
    await expect(page.locator('.theme-card')).toHaveCount(12);
    await page.getByRole('tab', { name: /城市/ }).click();
    await expect(page.locator('.theme-card')).toHaveCount(8);
    await page.locator('.theme-card').first().getByRole('button', { name: '用这套' }).click();
    await expect(page.locator('article.palette')).toHaveCount(1);
    await expect(page.locator('article.palette h3').first()).toContainText('北京');
  });

  test('场景清单展示 10 个场景并可下载 Markdown', async ({ page }) => {
    await page.goto('/#/studio');
    await page.getByRole('button', { name: '场景清单' }).click();
    const dialog = page.locator('dialog[open]');
    await expect(dialog.locator('.checklist-scene')).toHaveCount(10);
    const downloadPromise = page.waitForEvent('download');
    await dialog.getByRole('button', { name: '下载 MD' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.md$/);
  });
});

test.describe('v2 专业工具独立选色', () => {
  test('色阶与渐变可以独立改色，不影响工作台', async ({ page }) => {
    await page.goto('/#/studio');
    const before = await page.locator('article.palette').first().locator('.swatch-hex').first().textContent();

    await page.goto('/#/scales');
    const scaleColor = page.locator('.scale-color input[type=color]').first();
    await scaleColor.fill('#e53935');
    await expect(page.locator('.scale-color em').first()).toHaveText('#E53935');

    await page.goto('/#/studio');
    await expect(page.locator('article.palette').first().locator('.swatch-hex').first()).toHaveText(before ?? '');

    await page.goto('/#/gradient');
    const gradientColor = page.locator('.gradient-stop input[type=color]').first();
    await gradientColor.fill('#112233');
    await expect(page.locator('.gradient-preview span')).toContainText('#112233');

    await page.goto('/#/studio');
    await expect(page.locator('article.palette').first().locator('.swatch-hex').first()).toHaveText(before ?? '');
  });
});

test.describe('v2 渐变', () => {
  test('展示渐变并导出 1200×800 PNG', async ({ page }) => {
    await page.goto('/#/gradient');
    await expect(page.locator('.gradient-preview')).toBeVisible();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出 PNG' }).click();
    const download = await downloadPromise;
    const buffer = readFileSync((await download.path()) as string);
    expect(buffer.readUInt32BE(16)).toBe(1200);
    expect(buffer.readUInt32BE(20)).toBe(800);
  });
});

test.describe('v2 色阶与令牌', () => {
  test('展示色阶并可切换令牌格式', async ({ page }) => {
    await page.goto('/#/scales');
    await expect(page.locator('.scale-row:not(.scale-head)')).toHaveCount(7);
    await page.getByRole('tab', { name: 'Android XML' }).click();
    await expect(page.locator('.token-code')).toContainText('<color name="primary_500">');
  });
});

test.describe('v2 PWA', () => {
  test('manifest 与图标可访问', async ({ page, request }) => {
    const manifest = await request.get('/manifest.webmanifest');
    expect(manifest.status()).toBe(200);
    const data = await manifest.json();
    expect(data.name).toContain('配色工坊');
    expect(data.icons.length).toBeGreaterThanOrEqual(3);
    const icon = await request.get('/icons/icon-192.png');
    expect(icon.status()).toBe(200);
    expect(icon.headers()['content-type']).toContain('image/png');
    await page.goto('/#/');
    await expect(page.locator('link[rel=manifest]')).toHaveAttribute('href', './manifest.webmanifest');
  });
});

test.describe('v2 我的方案', () => {
  test('收藏、搜索、导出与导入备份', async ({ page }) => {
    await page.goto('/#/studio');
    await page.locator('article.palette .star').first().click();
    await page.getByRole('link', { name: '我的' }).click();
    await expect(page.locator('.library-list li')).toHaveCount(1);

    const search = page.getByLabel('搜索方案');
    await search.fill('不存在');
    await expect(page.locator('.empty')).toContainText('没有匹配');
    await search.fill('');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出备份' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.json$/);
    const path = await download.path();
    const content = readFileSync(path as string, 'utf8');
    expect(content).toContain('colorlife-library');

    await page.locator('input[type=file]').setInputFiles({
      name: 'backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(content, 'utf8'),
    });
    await expect(page.locator('.toast')).toContainText('已导入');
  });
});

test.describe('v2 生活工具独立选色', () => {
  test('房间 / 贺卡 / 打印不强制跟随工作台', async ({ page }) => {
    await page.goto('/#/room');
    await expect(page.locator('.independent-color input[type=color]')).toHaveCount(6);
    await page.locator('.independent-color input[type=color]').nth(3).fill('#e53935');
    await expect(page.locator('.room-wall')).toHaveCSS('background-color', 'rgb(229, 57, 53)');

    await page.goto('/#/card');
    await expect(page.locator('.independent-color input[type=color]')).toHaveCount(6);
    await page.locator('.independent-color input[type=color]').first().fill('#2255aa');
    await expect(page.locator('.independent-color input[type=color]').first()).toHaveValue('#2255aa');

    await page.goto('/#/print');
    await expect(page.locator('.independent-color input[type=color]')).toHaveCount(6);
    await page.locator('.independent-color input[type=color]').nth(1).fill('#2f8f6b');
    await expect(page.locator('.independent-color input[type=color]').nth(1)).toHaveValue('#2f8f6b');
  });

  test('对比度题型有四个选项并给出反馈', async ({ page }) => {
    await page.goto('/#/play');
    await page.getByRole('button', { name: '对比度' }).click();
    await page.getByRole('button', { name: '开始挑战' }).click();
    await expect(page.locator('.play-pair')).toHaveCount(4);
    await page.locator('.play-pair').first().click();
    await expect(page.locator('.play-feedback')).toBeVisible();
  });
});
test.describe('v2 配色挑战题库', () => {
  test('同一局连续题目不再重复同一组颜色', async ({ page }) => {
    await page.goto('/#/play');
    await page.getByRole('button', { name: '找色相' }).click();
    await page.getByRole('button', { name: '开始挑战' }).click();
    const targets: string[] = [];
    for (let round = 0; round < 4; round += 1) {
      const target = await page.locator('.play-target em').textContent();
      targets.push(target ?? '');
      await page.locator('.play-option').first().click();
      await expect(page.locator('.play-last')).toContainText('上一题');
      await expect(page.locator('.play-target em')).not.toHaveText(target ?? '');
    }
    expect(new Set(targets).size).toBe(4);
  });
});
test.describe('v2 挑战题型切换', () => {
  test('做题中切换题型会以新类型重新开始', async ({ page }) => {
    await page.goto('/#/play');
    await page.getByRole('button', { name: '开始挑战' }).click();
    await page.locator('.play-option').first().click();
    await expect(page.locator('.play-last')).toBeVisible();

    await page.getByRole('button', { name: '排明度' }).click();
    await expect(page.locator('.card-head')).toContainText('第 1 / 10 题');
    await expect(page.locator('.play-options.is-order')).toBeVisible();
    await expect(page.locator('.play-option')).toHaveCount(5);
    await expect(page.locator('.play-last')).toHaveCount(0);
    await expect(page.locator('.play-status')).toContainText('得分 0');

    await page.getByRole('button', { name: '对比度' }).click();
    await expect(page.locator('.card-head')).toContainText('第 1 / 10 题');
    await expect(page.locator('.play-pair')).toHaveCount(4);
  });
});