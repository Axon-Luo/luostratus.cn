import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const outDir = resolve('public/icons');
mkdirSync(outDir, { recursive: true });

const colors = ['#4A6CF7', '#E8A33D', '#2FA36B', '#E4572E'];

function svg(size, maskable = false) {
  const pad = maskable ? size * 0.24 : size * 0.2;
  const gap = size * 0.035;
  const tile = (size - pad * 2 - gap) / 2;
  const r = tile * 0.24;
  const positions = [
    [pad, pad],
    [pad + tile + gap, pad],
    [pad, pad + tile + gap],
    [pad + tile + gap, pad + tile + gap],
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#F7F3EC"/>
  ${positions
    .map(
      ([x, y], i) =>
        `<rect x="${x}" y="${y}" width="${tile}" height="${tile}" rx="${r}" fill="${colors[i]}"/>`,
    )
    .join('')}
</svg>`;
}

const browser = await chromium.launch({ channel: 'msedge' });
const jobs = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-maskable-512.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, maskable: false },
];

for (const job of jobs) {
  const page = await browser.newPage({ viewport: { width: job.size, height: job.size }, deviceScaleFactor: 1 });
  await page.setContent(
    `<html><body style="margin:0;background:#F7F3EC">${svg(job.size, job.maskable)}</body></html>`,
  );
  await page.screenshot({ path: resolve(outDir, job.name), clip: { x: 0, y: 0, width: job.size, height: job.size } });
  await page.close();
}

await browser.close();
console.log(`icons written to ${outDir}`);
