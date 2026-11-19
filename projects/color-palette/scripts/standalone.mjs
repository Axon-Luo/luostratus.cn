// 把 dist 构建产物内联成一个可直接双击打开的 HTML（无需 Node、无需服务器）。
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function buildStandalone(distDir, outFile) {
  const indexPath = join(distDir, 'index.html');
  let html = readFileSync(indexPath, 'utf8');

  const cssMatch = html.match(/<link[^>]+rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/i);
  if (!cssMatch) throw new Error('index.html 里没有找到 CSS 引用');
  const cssPath = join(distDir, cssMatch[1].replace(/^\.\//, ''));
  const css = readFileSync(cssPath, 'utf8');

  const jsMatch = html.match(/<script[^>]+type="module"[^>]+src="([^"]+)"[^>]*><\/script>/i);
  if (!jsMatch) throw new Error('index.html 里没有找到入口 JS');
  const jsPath = join(distDir, jsMatch[1].replace(/^\.\//, ''));
  const js = readFileSync(jsPath, 'utf8');

  html = html.replace(cssMatch[0], () => `<style>\n${css}\n</style>`);
  html = html.replace(
    jsMatch[0],
    () => `<script type="module">\n${js.replace(/<\/script/gi, '<\\/script')}\n</script>`,
  );

  const remaining = html.match(/(?:src|href)="\.\/assets\/[^"]+"/g);
  if (remaining) throw new Error(`仍存在外部资源引用：${remaining.join(', ')}`);

  writeFileSync(outFile, html, 'utf8');
  return outFile;
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
  const dist = resolve('dist');
  const out = resolve(process.argv[2] || 'release/配色工坊-免安装.html');
  mkdirSync(dirname(out), { recursive: true });
  buildStandalone(dist, out);
  console.log(`已生成单文件版：${out}`);
}
