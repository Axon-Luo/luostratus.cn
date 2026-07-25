---
date: '2026-07-24T18:38:31+08:00'
draft: false
title: 个人站代码解析：Hugo + PaperMod + Cloudflare Pages
tags:
  - 技术
  - Hugo
  - 前端
description: 从零搭建 luostratus.cn 的完整技术复盘，涵盖项目架构、画廊自定义排序、CSS 瀑布流与全站交互效果。
---

## 项目概览

这个站点采用 **Hugo 静态生成 + PaperMod 主题 + Cloudflare Pages 免费部署** 的技术栈，从域名注册到上线只用了一个下午。本文逐层拆解架构设计和自定义魔改。

### 技术选型

| 层级 | 技术 | 理由 |
|------|------|------|
| 静态生成 | Hugo v0.164 | Go 实现，构建 200ms，单二进制 |
| 主题 | PaperMod | 响应式、内置搜索/暗色模式/SEO |
| 托管 | Cloudflare Pages | 免费、全球 CDN、push 即部署 |
| 域名 | luostratus.cn | 腾讯云注册 → Cloudflare DNS 接管 |
| 代码托管 | GitHub | 免备案最优解 |

`.cn` 域名托管在境外服务器无需 ICP 备案，这是选择 Cloudflare Pages 的关键原因。

## 项目结构

```text
luostratus.cn/
├── hugo.yaml                  # 站点配置
├── archetypes/
│   ├── default.md              # 普通文章模板
│   └── gallery.md              # 画廊模板
├── content/
│   ├── about.md
│   ├── posts/                  # 博客文章
│   └── gallery/
│       ├── _index.md           # 画廊主页（branch bundle）
│       └── *.png / *.jpg       # 图片资源（bundle 成员）
└── layouts/
    ├── gallery/
    │   ├── list.html            # ★ 画廊核心：排序 + 瀑布流
    │   └── single.html          # 画廊详情
    └── partials/
        ├── extend_head.html     # 全站 CSS + 动效
        └── extend_footer.html   # 返回顶部 + 导航 JS
```

PaperMod 提供 `extend_head` 和 `extend_footer` 扩展点，覆盖这两个 partial 即可注入自定义样式与脚本，**不修改主题一行代码**，升级主题零冲突。

## hugo.yaml 关键配置

```yaml
baseURL: https://luostratus.cn/
locale: zh-cn
theme: PaperMod

# 分页 —— 注意版本兼容性
pagination:
  pagerSize: 10

# 代码高亮
markup:
  highlight:
    style: catppuccin-macchiato
    noClasses: false

# JSON 输出是 PaperMod 搜索功能必需的
outputs:
  home:
    - HTML
    - RSS
    - JSON

params:
  ShowReadingTime: true
  ShowToc: true
  ShowBreadCrumbs: true
  ShowCodeCopyButtons: true
  ShowPostNavLinks: true
  dateFormat: "2006-01-02"     # Go 诞生日 = YYYY-MM-DD
```

### 部署踩坑

Cloudflare Pages 的 Hugo 版本（`v0.147.7`）比本地（`v0.164.0`）更旧。起初 `paginate: 10` 直接导致构建报错：

```
ERROR deprecated: site config key paginate was deprecated in Hugo v0.128.0
  and subsequently removed. Use pagination.pagerSize instead.
```

改为 `pagination.pagerSize` 后解决。**CI 环境与本地版本不一致** 是静态站点部署中最常见的坑，后续可在 Cloudflare 环境变量中锁定 `HUGO_VERSION`。

## 画廊：核心自定义模块

画廊是这个站点最复杂的定制部分——单页展示、零子页面、CSS 瀑布流、智能排序。

### Branch Bundle 设计

```text
content/gallery/
├── _index.md          ← Branch Bundle，可通过 .Resources 访问所有文件
├── 00-校色卡.png       ← 固定首位
├── 2026-07-01_15.23.21.png
├── IMG_20250712_212757.jpg
└── ...
```

Hugo 的 Branch Bundle 允许 `_index.md` 通过 `.Resources.ByType "image"` 直接获取同目录下所有图片。不需要子文件夹、不要二级页面，用户进入即见所有图片。

### 文件名日期解析

35+ 张图片来源各异——截图、手机照片、无人机、微信——命名规范完全不同。模板中用 **两层正则** 逐级匹配：

```go
{{ $dateStr := "—" }}

// 第一层：匹配 YYYY-MM-DD 格式（截图类文件）
{{ $m1 := findRE `^(\d{4}-\d{2}-\d{2})` $filename 1 }}

// 第二层：匹配 20xxMMDD 格式
//        关键是用 "20" 开头限定，避开 Unix 时间戳
{{ $m2 := findRE `(20\d{6})` $filename 1 }}
```

**各文件名处理结果：**

| 文件名 | 匹配层 | 提取日期 |
|--------|--------|---------|
| `2026-07-01_15.23.21.png` | 第一层 `^\d{4}-\d{2}-\d{2}` | `2026-07-01` |
| `IMG_20250712_212757.jpg` | 第二层 `20\d{6}` | `2025-07-12` |
| `DJI_20241111063817...jpg` | 第二层 `20\d{6}` | `2024-11-11` |
| `mmexport..._20230511_*.jpg` | 第二层 `20\d{6}` | `2023-05-11` |
| `1684758526619.png` | 无匹配 | `—` |

第二层用 `20\d{6}` 而非 `\d{8}` 是关键：`mmexport1682250305721_20230511_...` 中第一个 8 位数字是时间戳的前缀 `16822503`，只有用 `20` 限定前缀才能命中真正的日期 `20230511`。

### 排序算法

```text
输入：35+ 张图片（含日期的 N 张 + 无日期的 M 张 + 1 张固定图）

1. 分离
   ├── $pinned ← .Resources.GetMatch "00-校色卡*"
   ├── $dated  ← 有日期的图片（格式化为 {r: resource, d: "2026-07-01"}）
   └── $undated ← 无日期的图片

2. 排序
   ├── $dated = sort $dated "d" "desc"     // 新 → 旧
   └── $undated = shuffle $undated          // 随机

3. 穿插间隔
   ├── $gap = len($dated) / (len($undated) + 1)
   └── 每隔 $gap 张已排序图片，插入 1 张无日期图片

4. 渲染
   ├── 首先渲染 $pinned（固定首位，不参与排序）
   └── 循环渲染排序后的穿插序列
```

Hugo 模板的一个硬限制是 **无法在 range 循环内修改外部变量**。为此使用了 `.Scratch` 来维护计数状态：

```go
{{ $.Scratch.Set "di" 0 }}           // 初始化排序计数
{{ $.Scratch.Set "ui" 0 }}           // 初始化无日期计数
{{ $.Scratch.Set "slot" $gap }}      // 下一次插入槽位

{{ range $idx := seq (add $dt $ut) }}
  {{ $di := $.Scratch.Get "di" }}    // 读取当前状态
  {{ $ui := $.Scratch.Get "ui" }}
  ...
  {{ $.Scratch.Set "di" (add $di 1) }} // 更新状态（仅在 Scratch 作用域内）
{{ end }}
```

`.Scratch` 是 Hugo 模板中实现可变状态的唯一标准模式——虽然写法不够优雅，但能在不引入自定义 shortcode 或 data file 的前提下完成复杂逻辑。

### CSS 瀑布流

```css
.gallery-masonry {
  column-count: 2;           /* CSS3 多列布局，天然瀑布流 */
  column-gap: 20px;
}
.gallery-item {
  break-inside: avoid;       /* 防止图片在列间断裂 */
}
.gallery-item img {
  width: 100%;
  height: auto;              /* 保持原始宽高比，不裁切 */
  border-radius: 8px;
  cursor: zoom-in;
}
```

选择 `column-count` 而非 Grid/Flexbox 的原因：

- **天然错位**：不需要计算每张图的高度，浏览器自动排列
- **零依赖**：无需 Masonry.js（~9KB gzipped）
- **移动端自适应**：`column-count: 1` 一行搞定

### 点击放大：零 DOM 方案

```js
// 直接 toggle class，不需要额外的 overlay 元素
onclick="this.classList.toggle('zoomed')"
```

```css
/* 放大状态：fixed 定位 + 超大阴影模拟遮罩 */
.gallery-item img.zoomed {
  position: fixed;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  max-width: 92vw; max-height: 92vh;
  box-shadow: 0 0 0 2000px rgba(0,0,0,0.8);  /* 遮罩 */
  z-index: 1000;
  cursor: zoom-out;
}
```

这个方案的妙处在于：不需要创建 overlay div、不需要管理 body 滚动锁定、不需要 addEventListener，**纯粹的声明式交互**。一个 class 切换完成全部效果。

## 全站交互效果

### 导航菜单

导航是交互设计最密集的区域：

```css
/* 类按钮化的链接 */
#menu a {
  padding: 6px 14px;
  border-radius: 8px;
  transition: background 0.25s, color 0.25s, transform 0.2s;
}

/* hover：半透明底色浮现 */
#menu a:hover {
  background: color-mix(in srgb, var(--primary) 8%, transparent);
  transform: translateY(-1px);
}

/* 当前页：底部指示横条 */
#menu a[aria-current="page"]::after {
  content: '';
  width: 18px; height: 3px;
  border-radius: 2px;
  background: var(--primary);
  transition: width 0.3s;       /* hover 时向外伸展 */
}
```

当前页标记通过 JS 动态注入：

```js
// 对比 URL 路径，标记匹配的导航项
const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
document.querySelectorAll('#menu a').forEach(link => {
  const linkPath = new URL(link.href).pathname.replace(/\/$/, '') || '/';
  if (linkPath === currentPath) {
    link.setAttribute('aria-current', 'page');
  }
});
```

### 交互效果一览

| 效果 | 技术 |
|------|------|
| 页面入场动画 | `@keyframes fadeIn` 0.4s |
| 图片懒加载淡入 | `opacity: 0→1`，`onload` 触发 |
| 链接下划线滑入 | `background-size: 0%→100%` |
| 文章卡片抬起 | `translateY(-3px)` + 阴影 |
| 返回顶部按钮 | `IntersectionObserver` + `scrollTo({behavior:'smooth'})` |
| 暗色模式过渡 | 全元素 `transition: background-color/color/border-color 0.3s` |
| 按钮点击反馈 | `:active { transform: scale(0.96) }` |
| 代码块 hover | 阴影浮现 |
| 选中文字 | `::selection` 自定义配色 |

所有效果均为 **纯 CSS + 少量原生 JS**，零外部依赖，总计不到 200 行代码。

## 后续新增功能

在初始版本上线后，网站陆续增加了以下功能模块。

### Bilibili 社交图标

在首页 GitHub 图标旁添加了 Bilibili 跳转入口。PaperMod 的 `socialIcons` 配置不内置 Bilibili，但可以通过自定义 SVG 扩展：

```yaml
# hugo.yaml
params:
  socialIcons:
    - name: github
      url: "https://github.com/Axon-Luo"
    - name: bilibili
      url: "https://space.bilibili.com/438193192"
```

PaperMod 渲染社交图标时，如果找不到内置图标，会自动去 `assets/` 目录下查找同名 SVG 文件。只需要放置 `assets/bilibili.svg`，无需改动主题模板：

```svg
<!-- assets/bilibili.svg -->
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18.5 4.5H5.5C4.12 4.5 3 5.62 3 7v8c0 1.38 1.12 2.5 2.5 2.5h13c1.38 0 ..." fill="currentColor"/>
  <!-- 电视机机身 + 两根天线 + 播放按钮的组合造型 -->
</svg>
```

### 网站图标（Favicon）

在 `static/favicon.png` 放置图标文件，并在 `extend_head.html` 中添加显式引用：

```html
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="apple-touch-icon" href="/favicon.png">
```

第二行确保 iOS 添加到主屏幕时也使用自定义图标。虽然浏览器会自动寻找 `/favicon.ico`，但显式声明能保证所有平台一致识别。

### 文章悬浮目录栏

这是为长篇文章设计的**左侧悬浮 TOC 导航**，纯 JS 动态生成，不依赖 Hugo 模板渲染。

**实现原理：**

```js
function buildArticleTOC() {
  // 1. 仅在文章页生效（检查 .post-content 存在）
  const content = document.querySelector('.post-content');
  if (!content) return;

  // 2. 提取所有 h2、h3 标题
  const headings = content.querySelectorAll('h2, h3');
  if (headings.length < 2) return;

  // 3. 为每个标题生成锚点 id 和导航链接
  headings.forEach((h, i) => {
    if (!h.id) h.id = 'section-' + i;
    const a = document.createElement('a');
    a.href = '#' + h.id;
    a.textContent = h.textContent;
    a.className = h.tagName === 'H3' ? 'toc-h3' : '';
    toc.appendChild(a);
  });

  // 4. IntersectionObserver 追踪当前阅读位置
  const observer = new IntersectionObserver(entries => {
    // 找到第一个进入视口的标题
    // 高亮对应的导航项
  }, { rootMargin: '-80px 0px -60% 0px', threshold: 0 });
}
```

**CSS 定位策略：**

```css
#article-toc {
  position: fixed;
  /* 左侧定位：在内容区域之外，随视口宽度自动调整 */
  left: max(16px, calc((100vw - 820px) / 2 - 220px));
  top: 120px;
  /* 默认隐藏，JS 构建完成后添加 .visible 类显示 */
  opacity: 0;
  transform: translateX(-12px);
  pointer-events: none;
  transition: opacity 0.3s, transform 0.3s;
}
```

悬浮栏默认隐藏（`opacity: 0; pointer-events: none`），在 JS 构建完链接后才显示，避免"先出现空壳再填充"的闪烁。

**移动端适配：** 在小屏幕上（≤768px），TOC 从左侧悬浮改为底部弹出面板——因为手机屏幕宽度不足以在侧边再放置一个导航栏。

**当前章节高亮：** 激活项通过 `border-right` 右侧指示条 + 加粗 + 背景色区分，hover 时有色块浮现。

### 滚动触发的快捷导航

这是顶部导航的"替身"——当用户向下滚动、页面顶部的导航栏移出屏幕后，右侧会出现一个**固定悬浮的快捷导航栏**：

```js
function buildSideNav() {
  // 1. 从顶部导航复制所有菜单项
  const menuLinks = document.querySelectorAll('#menu a');
  menuLinks.forEach(link => {
    const a = document.createElement('a');
    a.href = link.href;
    a.textContent = link.textContent.trim(); // 保留完整文字
    sideNav.appendChild(a);
  });

  // 2. 监听滚动：header 底部滚出视口 → 显示侧边导航
  const onScroll = () => {
    const headerBottom = header.getBoundingClientRect().bottom;
    const shouldShow = headerBottom < 0;
    sideNav.classList.toggle('visible', shouldShow);
  };
}
```

**设计要点：**

- 与顶部导航**互斥显示**：两者不可同时出现（通过 `header.getBoundingClientRect().bottom < 0` 判断）
- 统一大小的圆角矩形按钮（`min-width: 56px; height: 36px; border-radius: 10px`）
- 当前页面高亮（`aria-current="page"`）
- hover 时向左微移（`translateX(-2px)`），暗示"点击跳转"的交互语义
- 移动端缩小尺寸适配

### 更新后的项目结构

```text
luostratus.cn/
├── hugo.yaml
├── assets/
│   └── bilibili.svg             # 自定义社交图标
├── static/
│   └── favicon.png              # 网站图标
├── content/
│   ├── about.md
│   ├── posts/                   # 博客文章
│   └── gallery/
│       ├── _index.md
│       └── *.png / *.jpg        # 35+ 张图片
└── layouts/
    ├── gallery/
    │   ├── list.html             # 画廊：排序 + 瀑布流
    │   └── single.html
    └── partials/
        ├── extend_head.html      # 全站 CSS + 动效 + TOC样式 + 侧边导航样式
        └── extend_footer.html    # 返回顶部 + 导航高亮 + TOC逻辑 + 侧边导航逻辑
```

## 部署管线

```text
本地编写 → git push → GitHub
                         ↓
              Cloudflare Pages 自动触发
                         ↓
              Hugo build（~1min）
                         ↓
              全球 330+ 节点分发
                         ↓
              luostratus.cn 可访问
```

全链路零成本：Hugo 开源、GitHub 免费、Cloudflare Pages 免费（无限带宽 + 无限请求）。

## 可优化方向

1. **图片压缩**：35+ 张原图约 40MB+，可用 Hugo Image Processing 自动生成 WebP 缩略图
2. **画廊分页**：图片增多后可加无限滚动
3. **评论系统**：Giscus（基于 GitHub Discussions，免费无追踪）
4. **CI 版本锁定**：在 Cloudflare 环境变量中设置 `HUGO_VERSION`
5. **Open Graph 优化**：为画廊页添加社交分享预览图
6. **TOC 持久化状态**：记录折叠/展开偏好到 localStorage
7. **画廊搜索/筛选**：按日期范围或标签筛选图片

---

> 完整源码：[github.com/Axon-Luo/luostratus.cn](https://github.com/Axon-Luo/luostratus.cn)
