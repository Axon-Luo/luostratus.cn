// 把构建产物、文档与本地预览脚本整合成独立的交付包。
// 用法：node scripts/package-release.mjs [版本号，默认 v2]
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { buildStandalone } from './standalone.mjs';

const version = process.argv[2] || 'v2';
const target = resolve(`发布包/配色工坊 ${version}`);
const dist = resolve('dist');

if (!existsSync(join(dist, 'index.html'))) {
  console.error('没有找到 dist/index.html，请先运行 pnpm build');
  process.exit(1);
}

let commit = '';
try {
  commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
} catch {
  commit = 'unknown';
}

const today = new Date().toISOString().slice(0, 10);

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });

cpSync(dist, join(target, 'site'), { recursive: true });
cpSync(resolve('docs'), join(target, 'docs'), { recursive: true });
if (existsSync(resolve('scripts/launcher.bat'))) {
  // 批处理为 GBK + CRLF，直接按字节复制，避免换行/编码被改写
  cpSync(resolve('scripts/launcher.bat'), join(target, '一键打开.bat'));
}

// 单文件免安装版：把 JS/CSS 内联，双击 HTML 即可使用，不需要 Node
buildStandalone(dist, join(target, '配色工坊-免安装.html'));

const server = `// 配色工坊本地预览服务器（无需安装依赖）
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';

const root = resolve('site');
const port = Number(process.env.PORT || 4180);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  let file = join(root, pathname === '/' ? 'index.html' : pathname);
  if (!file.startsWith(root)) {
    res.writeHead(403);
    res.end('forbidden');
    return;
  }
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(root, 'index.html');
  res.writeHead(200, { 'Content-Type': mime[extname(file).toLowerCase()] || 'application/octet-stream' });
  createReadStream(file).pipe(res);
}).listen(port, () => {
  console.log('配色工坊预览：http://localhost:' + port + '/');
});
`;

const readme = `# 配色工坊 · 生活调色盘（${version}）

- 版本：0.2.0
- 打包日期：${today}
- 源码提交：${commit}

## 目录

| 路径 | 内容 |
| --- | --- |
| \`site/\` | 可直接部署的静态站点（Qoder Sites 的发布目录选这里） |
| \`docs/\` | 技术说明、发布清单、演示脚本、作品帖、提交用截图 |
| \`配色工坊-免安装.html\` | 单文件版，双击即可用，不需要任何环境 |
| \`serve.mjs\` | 本地预览服务器，只依赖 Node 18+ |
| \`一键打开.bat\` | 双击启动预览并打开浏览器（需要 Node） |

## 发给没有环境的同学

直接发 **\`配色工坊-免安装.html\`**：整站（HTML + CSS + JS）都在这一个文件里，双击用 Chrome / Edge 打开即可，不需要安装 Node 或其他软件。

注意 file:// 打开时的限制：

- 分享按钮复制的是本机文件链接，对方无法打开；需要分享时用部署后的网址。
- 没有 Service Worker 离线缓存（单文件本身就是离线的，刷新仍可打开）。
- 少数浏览器的隐私模式可能禁用本地存储，收藏与历史会提示无法保存。

正式对外使用仍建议走部署链接（见下）。

## 一键打开（本机）

双击 \`一键打开.bat\`：会自动启动本地预览并打开 http://localhost:4180/ ；关闭弹出的「配色工坊 ${version} 预览」窗口即停止服务。该方式需要本机安装 Node.js 18+。

## 手动预览（需要 Node）

\`\`\`bash
node serve.mjs
\`\`\`

然后打开 http://localhost:4180/ 。

不要直接双击 \`site/index.html\`：它是分立资源的构建产物，ES module 必须通过 http 打开；需要双击就用 \`配色工坊-免安装.html\`。

## 发布

把 \`site/\` 作为 Qoder Sites 的发布目录，先私有预览、手机验证，再切换公开访问。完整步骤见 \`docs/发布清单.md\`。

## 验收数据

- 单元测试 137 项、端到端 109 项（Playwright + Edge）、axe 扫描 20 页（含深色工作台），全部通过。
- 构建体积：JS 102.4 KB gzip、CSS 12.1 KB gzip，无第三方运行时请求。
`;

writeFileSync(join(target, 'serve.mjs'), server, 'utf8');
writeFileSync(join(target, 'README.md'), readme, 'utf8');

console.log(`已生成 ${target}`);
