# luostratus.cn — 项目交接文档

## 项目概览

- **仓库**: `github.com/Axon-Luo/luostratus.cn`
- **域名**: `https://luostratus.cn`
- **描述**: 个人博客 + 画廊 + 小游戏/工具集合
- **当前状态**: 运行正常，共 62 页

## 技术栈

| 层 | 技术 | 版本/说明 |
|---|---|---|
| 静态生成 | Hugo | 本地 v0.164 extended, **Cloudflare v0.147.7** |
| 主题 | PaperMod | 通过 extend_head/extend_footer 扩展 |
| CSS | 自定义 | color-mix, CSS 变量, scrollbar-width |
| JS | 原生 ES6 | 无框架，无依赖 |
| 托管 | Cloudflare Pages | 免费，push 即部署 |
| 域名 | luostratus.cn | 腾讯云注册 → Cloudflare DNS 管理，免备案 |

## ⚠️ 关键约束：Cloudflare Hugo 版本

**最重要的规则——Cloudflare Pages 使用 Hugo v0.147.7，而非本地 v0.164。** 以下特性在 Cloudflare 上不可用：

- `cond` 模板函数（Hugo v0.112 引入，实际测试中崩溃）
- `_build` → `build` 前端元数据键名差异
- 部分新 CSS 函数在不同 Hugo 版本生成的 HTML 中行为一致（CSS 是浏览器特性）

**安全做法**: 每次修改后，必须本地 `hugo --source` 构建验证，确认 0 错误后再推送。推送后等 Cloudflare 部署完成再判断是否成功。

## 项目结构

```
luostratus.cn/
├── hugo.yaml                      # 全局配置（主题、菜单、分页、社交链接）
├── CLAUDE.md                      # 本文档
│
├── content/                       # 所有页面内容（Markdown + frontmatter）
│   ├── about.md                   # 关于页
│   ├── search.md                  # 搜索页（PaperMod 内置）
│   ├── posts/                     # 博客文章（6篇）
│   │   ├── first-post.md
│   │   ├── hello-world.md
│   │   ├── site-code-review.md
│   │   ├── aa-art-aahub.md
│   │   ├── minecraft-journey.md
│   │   └── frontend-from-zero.md
│   ├── gallery/
│   │   ├── _index.md              # 画廊主页（Branch Bundle 入口）
│   │   └── *.png, *.jpg           # 35+ 张图片（Bundle Resources）
│   └── tools/                     # 小功能板块（16 个内容页）
│       ├── _index.md              # 板块主页，含 cascade 排除列表
│       └── *.md                   # 每个工具一页（仅 frontmatter）
│
├── layouts/                       # 自定义模板（覆盖 PaperMod）
│   ├── index.html                 # 首页模板（⚠️ 当前未使用，因为导致崩溃）
│   ├── gallery/
│   │   ├── list.html              # 画廊主页：CSS 瀑布流 + 日期排序
│   │   └── single.html            # 画廊详情页
│   ├── tools/
│   │   ├── list.html              # 小功能主页：游戏/工具卡片网格
│   │   └── single.html            # 小功能详情页：加载 partials/tools/*.html
│   └── partials/
│       ├── extend_head.html       # 全站 <head> 注入（CSS + 动效 + favicon）
│       ├── extend_footer.html     # 全站底部注入（返回顶部 + 导航 JS + TOC）
│       ├── footer.html            # 覆盖 PaperMod footer（添加 Last Updated）
│       └── tools/                 # ★ 15 个工具的游戏代码（每个都是完整 HTML+CSS+JS）
│           ├── snake.html, tetris.html, breakout.html, 2048.html,
│           ├── minesweeper.html, memory-match.html, click-speed.html,
│           ├── color-recognition.html, sudoku.html, 24-point.html,
│           ├── unit-converter.html, number-converter.html,
│           ├── bmi-calculator.html, morse-code.html, random-generator.html
│
├── assets/
│   └── bilibili.svg               # Bilibili 社交图标 SVG
├── static/
│   └── favicon.png                # 网站图标
├── archetypes/
│   ├── default.md                 # 文章模板
│   └── gallery.md                 # 画廊帖子模板
└── .gitignore
```

## 关键架构模式

### 1. PaperMod 扩展机制

PaperMod 提供两个扩展点，所有自定义代码通过它们注入，**不修改主题源码**：

- `layouts/partials/extend_head.html` → 注入到每页 `<head>` 中（CSS、meta、关键 JS）
- `layouts/partials/extend_footer.html` → 注入到每页 `</body>` 前（按钮、导航、功能 JS）

如果覆盖主题原有的 partial，放到相同路径下即可。例如 `layouts/partials/footer.html` 覆盖了 PaperMod 的 footer。

### 2. 画廊架构（Branch Bundle）

画廊使用 Hugo 的 **Branch Bundle**：所有图片放在 `content/gallery/` 目录下，`_index.md` 通过 `.Resources.ByType "image"` 获取所有图片资源。不创建子页面，单页直接展示。

关键代码在 `layouts/gallery/list.html`：
- 正则提取文件名日期（两层次匹配）
- `.Scratch` 管理排序状态（Hugo 模板无法在 range 内修改变量）
- CSS `column-count: 2` 实现瀑布流
- 点击放大用 `classList.toggle` + CSS `position: fixed` 零 DOM 方案

### 3. 小功能板块架构（★ 最复杂）

**文件对应关系**:
```
content/tools/snake.md          → 内容页（仅 frontmatter）
layouts/tools/single.html       → 模板：根据 .File.BaseFileName 加载 partial
layouts/partials/tools/snake.html → 实际的游戏 HTML/CSS/JS 代码
```

**partial 查找路径**：
`partial "tools/snake.html"` → 查找 `layouts/partials/tools/snake.html`
（**不是** `layouts/tools/snake.html` ——上次崩溃的根本原因）

**排除工具页出现在首页/标签/归档**：
`content/tools/_index.md` 中设置 `cascade.build.list: never`

### 4. 交互功能

所有交互效果写在 `extend_head.html`（CSS）和 `extend_footer.html`（JS）中：

| 功能 | 位置 |
|------|------|
| 导航菜单高亮 | extend_footer.html — URL 路径匹配 + aria-current |
| 文章目录 TOC | extend_footer.html — 动态生成 + IntersectionObserver |
| 侧边快捷导航 | extend_footer.html — 滚动触发 + 复制菜单项 |
| 返回顶部 | extend_footer.html — scroll 监听 + smooth scroll |
| 图片懒加载淡入 | extend_head.html — onload 事件 + opacity 过渡 |
| 链接下划线动画 | extend_head.html — background-size 过渡 |
| 暗色模式过渡 | extend_head.html — 全元素 transition |

## 如何修改

### 添加新文章
```bash
cd C:\Users\LuoYun\luostratus.cn
hugo new posts/新文章题目.md
# 编辑 content/posts/新文章题目.md
# 将 draft: true 改为 false
git add -A && git commit -m "新文章" && git push
```

### 修改配置
编辑 `hugo.yaml`。修改菜单时只改 menu.main 部分，注意 weight 顺序：
```
文章(1) → 画廊(2) → 标签(3) → 小功能(4) → 搜索(5) → 关于(6)
```

### 添加新工具到小功能板块
1. 创建 `content/tools/新工具名.md`（frontmatter + title）
2. 创建 `layouts/partials/tools/新工具名.html`（完整 HTML/CSS/JS）
3. 在 `layouts/tools/list.html` 的 games 或 utils 切片中添加对应条目
4. `hugo --source ... --config ...` 构建验证 0 错误
5. commit + push

### 修改画廊
画廊的核心逻辑在 `layouts/gallery/list.html`。添加图片只需把文件放入 `content/gallery/`，文件名必须包含日期（`YYYY-MM-DD` 或 `20xxMMDD` 格式）才能被日期解析。

### 修改样式/动效
CSS 在 `extend_head.html` 中，JS 在 `extend_footer.html` 中。导航栏相关 JS 注意：`buildSideNav()` 从 `#menu a` 读取所有菜单项重建侧边导航。

## 部署管线

```
本地编写 → git push → GitHub → Cloudflare Pages 检测 → Hugo build → CDN 分发
```

回滚命令：
```bash
cd C:\Users\LuoYun\luostratus.cn
git reset --hard <commit-hash>
git push --force
```

当前稳定版本 commit: `ee36b57`（Remove archives section）
预工具版本 tag: `v1.0-before-tools`

## 已知问题

| 问题 | 状态 |
|------|------|
| 首页只显示2篇文章 | ❌ 未实现（两次尝试均导致崩溃） |
| 归档功能 | ❌ 已删除（无法排除工具页导致显示异常） |
| 网站移动端适配 | ❌ 首页已标注"暂未适配移动端" |
| `layouts/index.html` | ⚠️ 当前不存在，若创建需避免 cond 函数 |

## 构建验证命令
```bash
/c/Users/LuoYun/AppData/Local/Microsoft/WinGet/Packages/Hugo.Hugo.Extended_Microsoft.Winget.Source_8wekyb3d8bbwe/hugo \
  --source /c/Users/LuoYun/luostratus.cn \
  --config /c/Users/LuoYun/luostratus.cn/hugo.yaml
```

期望输出：`Pages: 62 | ... Total in ~230 ms`，无 `ERROR` 字样。
