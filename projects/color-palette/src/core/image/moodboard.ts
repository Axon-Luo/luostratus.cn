import { deltaE2000 } from '../color/distance';
import { extractColors } from './quantize';

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('图片加载失败'));
    image.src = url;
  });
}

/**
 * 多图情绪板：每张图缩到 96px 提取 5 个主色，再按 ΔE 去重合并。
 * 这样比直接拼像素更稳定，也避免大图撑爆内存。
 */
export async function extractFromImages(urls: string[], max = 8): Promise<string[]> {
  const all: string[] = [];
  for (const url of urls) {
    try {
      const image = await loadImage(url);
      const canvas = document.createElement('canvas');
      const width = 96;
      const height = Math.max(1, Math.round((width * image.naturalHeight) / image.naturalWidth));
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;
      ctx.drawImage(image, 0, 0, width, height);
      const data = ctx.getImageData(0, 0, width, height);
      all.push(...extractColors(data.data, width, height, { k: 5 }));
    } catch {
      /* 跳过损坏图片 */
    }
  }

  const picked: string[] = [];
  for (const hex of all) {
    if (picked.some((other) => deltaE2000(other, hex) < 6)) continue;
    picked.push(hex);
    if (picked.length >= max) break;
  }
  return picked;
}
