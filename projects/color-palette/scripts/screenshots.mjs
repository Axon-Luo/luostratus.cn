// 生成提交用截图（需要先 `pnpm preview` 在 4173 端口）
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const out = resolve('docs/screenshots');
mkdirSync(out, { recursive: true });
const base = 'http://localhost:4173';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const shot = (page, name, opts) => page.screenshot({ path: `${out}/${name}`, ...opts });

const light = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'zh-CN' });
const lp = await light.newPage();
await lp.goto(`${base}/#/`);
await lp.waitForTimeout(700);
await shot(lp, '01-home.png', { fullPage: true });
await light.close();

const dark = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'zh-CN' });
const page = await dark.newPage();
await page.goto(`${base}/#/`);
await page.waitForTimeout(500);
if ((await page.evaluate(() => document.documentElement.dataset.theme)) !== 'dark') {
  await page.getByRole('button', { name: '切换到深色' }).click();
}
await page.waitForTimeout(300);
await shot(page, '06-dark-home.png', { fullPage: true });

await page.goto(`${base}/#/studio`);
await page.locator('.preview-shell').waitFor({ timeout: 10000 });
await page.waitForTimeout(500);
await shot(page, '02-studio.png');
await page
  .locator('section.card')
  .filter({ has: page.locator('.preview-shell') })
  .screenshot({ path: `${out}/03-preview-dark.png` });
await page.getByRole('button', { name: '分享卡', exact: true }).first().click();
await page.locator('dialog[open] img[alt="分享卡预览"]').waitFor({ timeout: 10000 });
await page.locator('dialog[open]').screenshot({ path: `${out}/05-export-card.png` });
await page.keyboard.press('Escape');

await page.goto(`${base}/#/print`);
await page.locator('img.print-preview').waitFor({ timeout: 10000 });
const old = await page.locator('img.print-preview').getAttribute('src');
await page.getByRole('button', { name: '网格色票', exact: true }).click();
await page.waitForFunction(
  (prev) => document.querySelector('img.print-preview')?.getAttribute('src') !== prev,
  old,
  { timeout: 10000 },
);
await page.waitForTimeout(300);
await shot(page, '07-print.png');

for (const [route, name] of [
  ['/mix', '08-mix.png'],
  ['/traditional', '09-traditional.png'],
  ['/contrast', '10-contrast.png'],
]) {
  await page.goto(`${base}/#${route}`);
  await page.waitForTimeout(700);
  await shot(page, name);
}
await dark.close();

const mob = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'zh-CN' });
const mp = await mob.newPage();
await mp.goto(`${base}/#/`);
await mp.waitForTimeout(700);
await shot(mp, '04-mobile.png', { fullPage: true });
await mob.close();
await browser.close();
console.log('screenshots done');