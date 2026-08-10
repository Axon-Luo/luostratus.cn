---
date: '2026-07-24T18:38:31+08:00'
draft: false
title: 个人站代码解析：Hugo + PaperMod + Cloudflare Pages
tags:
  - 技术
  - Hugo
  - 前端
  - 部署
  - 小功能
description: 从零搭建 luostratus.cn 的完整技术复盘，涵盖项目架构、画廊压缩与排序、46 个小功能、搜索索引、自定义目录与 Cloudflare Workers 部署。
---

## 项目概览

这个站点采用 **Hugo 静态生成 + PaperMod 主题 + Cloudflare Workers 静态托管** 的技术栈。从最初一个下午完成上线，到现在已经演变成包含 **5 篇文章、35 张画廊照片、46 个小功能** 的个人站。本文逐层拆解架构设计和一路踩过的坑。

### 技术选型

| 层级 | 技术 | 理由 |
|------|------|------|
| 静态生成 | Hugo v0.164 | Go 实现，构建约 200ms，单二进制 |
| 主题 | PaperMod | 响应式、内置搜索/暗色模式/SEO |
| 托管 | Cloudflare Workers 静态托管 | 免费、全球 CDN、push 即部署 |
| 部署配置 | wrangler.jsonc | `assets.directory` 指向 `public` 构建产物 |
| 域名 | luostratus.cn | 腾讯云注册 → Cloudflare DNS 接管 |
| 代码托管 | GitHub | 免备案最优解 |

`.cn` 域名托管在境外服务无需 ICP 备案，这是选择 Cloudflare 的关键原因。

### 当前功能地图

| 模块 | 内容 | 实现要点 |
|------|------|---------|
| 首页 | 最近 2 篇文章 | `layouts/index.html` + `where` + `first` |
| 文章 | 5 篇博客 | Markdown + Hugo 渲染 |
| 归档 | 只含文章 | `layouts/archives.html` 按 `Section "posts"` 过滤 |
| 画廊 | 35 张压缩照片 | Branch Bundle + 文件名日期解析 + 瀑布流 |
| 小功能 | 46 个工具/游戏 | 独立 partial，每页一个功能 |
| 搜索 | 文章 + 小功能 | 自定义 `index.json` + Fuse.js |
| 阅读辅助 | 悬浮目录、回到顶部 | 原生 JS + CSS 过渡 |

## 项目结构

```text
luostratus.cn/
├── hugo.yaml                  # 站点配置、菜单、输出格式
├── wrangler.jsonc             # Workers 静态资源配置（输出 public）
├── content/
│   ├── about.md
│   ├── search.md              # 搜索页
│   ├── archives.md            # 归档页
│   ├── posts/                 # 博客文章
│   ├── gallery/
│   │   ├── _index.md          # 画廊主页（branch bundle）
│   │   └── 图片资源            # png / jpg / webp，均已压缩
│   └── tools/                 # 46 个小功能页
├── layouts/
│   ├── index.html             # 首页：展示最近 2 篇文章
│   ├── archives.html          # 归档：只展示 posts
│   ├── index.json             # 搜索索引（文章 + 小功能）
│   ├── rss.xml                # RSS（过滤小功能）
│   ├── gallery/               # 画廊排序 + 瀑布流
│   ├── tools/                 # 小功能列表与详情
│   └── partials/
│       ├── extend_head.html   # 全站 CSS + 动效 + 目录样式
│       ├── extend_footer.html # TOC、侧边导航、脚本
│       ├── footer.html        # 底部 + 回到顶部（主题版）
│       └── tools/             # 46 个工具的 HTML/CSS/JS
├── assets/
│   └── bilibili.svg           # 自定义社交图标
└── static/
    └── favicon.png            # 网站图标
```

PaperMod 提供 `extend_head` 和 `extend_footer` 扩展点，覆盖这两个 partial 即可注入自定义样式与脚本，**不修改主题一行代码**，升级主题零冲突。

## hugo.yaml 关键配置

```yaml
baseURL: https://luostratus.cn/
locale: zh-cn
theme: PaperMod

pagination:
  pagerSize: 10

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

menu:
  main:
    - name: 文章
      url: /posts/
      weight: 1
    - name: 画廊
      url: /gallery/
      weight: 2
    - name: 归档
      url: /archives/
      weight: 3
    - name: 标签
      url: /tags/
      weight: 4
    - name: 小功能
      url: /tools/
      weight: 5
    - name: 搜索
      url: /search/
      weight: 6
    - name: 关于
      url: /about/
      weight: 7
```

## 部署管线与踩坑

```text
本地编写 → git push → GitHub
                         ↓
      Cloudflare Workers Builds 自动触发
                         ↓
      Hugo build（输出到 public）
                         ↓
      wrangler.jsonc assets.directory = public
                         ↓
      luostratus.cn 可访问
```

全链路零成本：Hugo 开源、GitHub 免费、Cloudflare 免费额度足够个人站使用。

### 踩坑 1：分页配置改名

Cloudflare 构建环境的 Hugo 版本（`v0.147.7`）比本地（`v0.164.0`）更旧。起初 `paginate: 10` 直接导致构建报错：

```
ERROR deprecated: site config key paginate was deprecated in Hugo v0.128.0
  and subsequently removed. Use pagination.pagerSize instead.
```

改为 `pagination.pagerSize` 后解决。**CI 环境与本地版本不一致** 是静态站点部署中最常见的坑。

### 踩坑 2：cond 模板函数

Cloudflare 的 Hugo `v0.147.7` 不支持 `cond` 模板函数，之前首页“只显示两篇文章”的尝试就因此崩溃。最终改用 `where` + `first`：

```go
{{- $pages := where site.RegularPages "Section" "posts" }}
{{- $recentPosts := first 2 $pages }}
```

**兼容性结论：旧版 Hugo 用 `where`/`first`/`if` 代替 `cond`。**

### 踩坑 3：静态资源目录配错

仓库接入 Workers 后，自动生成过一份 `assets.directory: "layouts"` 的配置，导致线上把 Hugo 模板当网页直接返回，页面全是 `{{- define "main" }}` 这类乱码。修复方式是把 `wrangler.jsonc` 改为指向构建产物：

```json
{
  "assets": {
    "directory": "public"
  }
}
```

这个坑的教训是：**部署配置必须指向构建输出目录，而不是源码目录。**

## 首页与归档

### 首页：最近两篇文章

默认 PaperMod 首页依赖 `mainSections`，但本站没有设置该参数，因此直接用一个自定义首页模板控制内容：

```go
{{- $pages := where site.RegularPages "Section" "posts" }}
{{- $pages = where $pages "Params.hiddenInHomeList" "!=" "true" }}
{{- $recentPosts := first 2 $pages }}

{{- range $recentPosts }}
<article class="post-entry">
  ...
</article>
{{- end }}
```

这样首页始终显示按发布日期排序的最近 2 篇文章，画廊和小功能不会混进来。

### 归档：只保留文章

归档页同样不依赖主题默认的 `mainSections`，而是显式过滤：

```go
{{- $pages := where site.RegularPages "Section" "posts" }}
```

之前归档曾因为把照片和小功能也列进来而反复调整，最终用这一行过滤彻底解决。

## 画廊：核心自定义模块

### Branch Bundle 设计

```text
content/gallery/
├── _index.md          ← Branch Bundle，可通过 .Resources 访问所有文件
├── 00-校色卡.png       ← 固定首位，不参与压缩
├── 2026-07-01_15.23.21.webp
├── IMG_20250712_212757.jpg
└── ...
```

Hugo 的 Branch Bundle 允许 `_index.md` 通过 `.Resources.ByType "image"` 直接获取同目录下所有图片，不需要子文件夹，用户进入即见所有照片。

### 文件名日期解析

35 张图片来源各异——截图、手机照片、无人机、微信——命名规范完全不同。模板中用 **两层正则** 逐级匹配：

```go
{{ $m1 := findRE `^(\d{4}-\d{2}-\d{2})` $filename 1 }}
{{ $m2 := findRE `(20\d{6})` $filename 1 }}
```

第二层用 `20\d{6}` 而非 `\d{8}` 是关键：`mmexport1682250305721_20230511_...` 中第一个 8 位数字是时间戳前缀，只有用 `20` 限定才能命中真正的日期。

### 排序与瀑布流

有日期图片按日期倒序，无日期图片随机穿插，固定校色卡永远在最前。排序状态用 `.Scratch` 维护，因为 **Hugo 模板无法在 range 循环内修改外部变量**。

瀑布流使用 CSS 多列布局：

```css
.gallery-masonry {
  column-count: 2;
  column-gap: 20px;
}
.gallery-item {
  break-inside: avoid;
}
```

选择 `column-count` 而非 Grid/Flexbox：天然错位、零依赖、移动端一行改成 1 列。

### 图片压缩

画廊最初有大量 1MB-11MB 的照片，加载很慢。后来做了一轮批量压缩：

| 处理 | 规则 |
|------|------|
| PNG → WebP | 透明通道保留，最长边 2560px，质量 82 |
| 大 JPEG | 重压缩，最长边 2560px，质量 85 |
| 已达标图片 | 保持原样，不做无谓降质 |
| 校色卡 | 完全不动 |

现在除校色卡外所有照片都 ≤1MB，最大约 858KB，画廊加载速度明显提升。

## 小功能：46 个游戏与工具

小功能是网站内容最丰富的模块，现有 **25 款游戏 + 21 个实用工具**。

### 架构

每个工具都由三部分组成：

```text
content/tools/<slug>.md              # 页面 frontmatter（title + description）
layouts/partials/tools/<slug>.html   # 完整 HTML + CSS + JS
layouts/tools/list.html              # 卡片入口（games / utils 数组）
```

工具页详情模板只做一件事——按文件名加载对应 partial：

```go
{{ $tool := .File.BaseFileName }}
{{ partial (printf "tools/%s.html" $tool) . }}
```

所以新增一个工具 = 加一个 Markdown + 加一个 partial + 在列表里加一张卡片，互不干扰。

### 转盘抽奖：从“假随机”到真随机

转盘抽奖曾有个经典 bug：每次只随机“转多少整圈”，停止角度的余数没变，所以永远回到同一块。参考了 GitHub 上几个开源转盘实现后，改成 **先按权重选中结果，再反推停止角度**：

```js
function pickIndex() {
  const r = Math.random() * totalWeight;
  let acc = 0;
  for (let i = 0; i < options.length; i++) {
    acc += options[i].weight;
    if (r < acc) return i;
  }
  return options.length - 1;
}
```

选项编辑器也做成了可视化：每行有颜色标识、名称输入、权重输入、权重条、百分比和排序/删除按钮，权重越大扇形越大、越容易抽中。

### 其他代表工具

| 类型 | 工具 | 技术点 |
|------|------|--------|
| 游戏 | 五子棋、井字棋 | 棋盘状态 + AI 评分/极小化极大 |
| 游戏 | 华容道、推箱子 | Canvas 拖拽 / 网格状态机 |
| 游戏 | 连连看、三消 | 折线寻路 / 匹配消除算法 |
| 工具 | 密码生成器 | `crypto.getRandomValues` + 强度评分 |
| 工具 | JSON 格式化 | 格式化/压缩/校验一体 |
| 工具 | 节拍器、白噪音 | Web Audio 合成 |
| 工具 | 番茄钟、秒表 | `setInterval` + 声音提醒 |

## 搜索：文章 + 小功能

### 索引问题

PaperMod 默认的 `index.json` 只遍历 `site.RegularPages`，而小功能页此前被 `build.list: never` 排除，所以一个都搜不到。

### 自定义搜索索引

本站覆盖了 `layouts/index.json`，把小功能也并入索引，并把每个工具的描述写进 `content` 和 `summary`：

```go
{{- $tools := where site.AllPages "Section" "tools" }}
{{- $pages := union site.RegularPages $tools }}
{{- range $pages }}
  {{- if and (eq .Kind "page") (not .Params.searchHidden) }}
  {{- $content := .Plain }}
  {{- if .Description }}{{ $content = printf "%s %s" .Description $content }}{{ end }}
  {{- $.Scratch.Add "index" (dict "title" .Title "content" $content "permalink" .Permalink "summary" (.Summary | default .Description)) }}
  {{- end }}
{{- end }}
```

同时给全部 46 个工具页补充了 `description`，现在搜索“贪吃蛇”“扫雷”“密码”都能直接命中对应工具。

前端搜索使用 PaperMod 内置的 **Fuse.js**，匹配字段为 `title / permalink / summary / content`：

```js
const defaultFuseOptions = {
  distance: 100,
  threshold: 0.4,
  keys: ['title', 'permalink', 'summary', 'content']
};
```

### 保持 RSS 纯净

小功能进入搜索索引后，RSS 也会跟着收录。为了避免 46 个工具页灌进订阅源，覆盖了 `layouts/rss.xml`：

```go
{{- $pages = where $pages "Section" "ne" "tools" -}}
```

现在搜索能搜到小功能，但 RSS 仍然只包含文章和关于。

## 阅读体验

### 文章悬浮目录

长文章左侧有一个纯 JS 动态生成的悬浮目录，包含：

- `IntersectionObserver` 追踪当前章节并高亮
- 点击链接平滑滚动到对应标题
- “收起 / 展开”按钮，带高度 + 透明度过渡
- 收起状态写入 `localStorage`，下次打开仍保持
- 标题在目录滚动时始终 sticky 在顶部

```css
#article-toc .toc-title {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--entry);
  border-bottom: 1px solid var(--border);
}
```

移动端上，目录会从左侧悬浮改为底部弹出面板。

### 侧边快捷导航

当顶部导航滚出视口后，右侧会出现一组悬浮快捷导航按钮，与顶部导航互斥显示：

```js
const shouldShow = header.getBoundingClientRect().bottom < 0;
sideNav.classList.toggle('visible', shouldShow);
```

### 回到顶部

站点早期因为同一功能写了两份，出现两个回到顶部图标。后来删除了自定义的 `#back-to-top`，保留 PaperMod 主题的 `#top-link`，并给它补上了淡入 + 上滑/下滑过渡：

```css
#top-link {
  opacity: 0;
  visibility: hidden;
  transform: translateY(14px);
  transition: opacity 0.3s ease, transform 0.3s ease, visibility 0s linear 0.3s;
  pointer-events: none;
}
#top-link:not(.hidden) {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  pointer-events: auto;
}
```

这里有个 CSS 优先级陷阱：全局链接下划线动画的 `transition` 会把 `#top-link` 的过渡覆盖掉，必须用 ID 选择器才压得住。

### 交互效果一览

| 效果 | 技术 |
|------|------|
| 页面入场动画 | `@keyframes fadeIn` 0.4s |
| 图片懒加载淡入 | `opacity: 0→1`，`onload` 触发 |
| 链接下划线滑入 | `background-size: 0%→100%` |
| 文章卡片抬起 | `translateY(-3px)` + 阴影 |
| 目录收起过渡 | `max-height` + `opacity` + `transform` |
| 回到顶部过渡 | `opacity` + `translateY` + 延迟 visibility |
| 暗色模式过渡 | 全元素 `transition` 0.3s |
| 按钮点击反馈 | `:active { transform: scale(0.96) }` |

## 其他小配置

### Bilibili 社交图标

PaperMod 的 `socialIcons` 不内置 Bilibili，但会去 `assets/` 目录查找同名 SVG，所以放置 `assets/bilibili.svg` 即可：

```yaml
params:
  socialIcons:
    - name: github
      url: "https://github.com/Axon-Luo"
    - name: bilibili
      url: "https://space.bilibili.com/438193192"
```

### Favicon

在 `static/favicon.png` 放置图标，并在 `extend_head.html` 显式声明：

```html
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="apple-touch-icon" href="/favicon.png">
```

第二行确保 iOS 添加到主屏幕时也使用自定义图标。

## 可优化方向

1. **评论系统**：接入 Giscus（基于 GitHub Discussions，免费无追踪）
2. **画廊筛选**：按日期范围或标签筛选照片
3. **小功能本地存档**：为游戏/工具增加 localStorage 高分榜
4. **CI 版本锁定**：在 Cloudflare 环境变量中固定 `HUGO_VERSION`
5. **Open Graph 优化**：为画廊、工具页添加社交分享预览图
6. **搜索排序优化**：自定义 Fuse.js 权重，让标题命中优先于正文

## 本次大更新：虚拟信息生成器

在原有 46 个小功能基础上，小功能数量增加到了 **59 个**。这次新增的 13 个“虚拟信息生成器”用于制作时间线、邮件、小票、快递面单、角色设定卡等虚构信息素材。和之前偏“单文件 HTML”的小功能不同，这批工具开始真正形成 **HTML + CSS + JavaScript 三种语言协作** 的结构。

### 新增功能一览

| 工具 | 说明 |
|------|------|
| 时间线 | 制作人物生平、架空历史与世界观编年史长图 |
| 歌词与播放列表 | 整理歌词节点、歌曲信息与角色播放列表 |
| 社交帖子生成器 | 制作虚构帖子、账户页面、回复链与社交档案 |
| 邮件档案 | 制作虚构邮箱、邮件正文与多轮回复线程 |
| 大众点评 | 制作餐馆、菜品、商品与服务的虚构点评详情页 |
| 购物车与结算 | 制作虚构购物车、账户资料与订单结算页面 |
| 小票与 Invoice | 制作机打小票、账单与可自由摆放贴纸的 Invoice 页面 |
| 模拟电脑桌面 | 制作带角色档案、窗口、便签与自由素材的电脑桌面情绪板 |
| 背包 | 制作角色资料、随身装备与私人物件组成的背包界面 |
| 鉴定书生成器 | 制作珠宝、文物、司法、伤情与通用鉴定文书 |
| 小册 | 制作封面、目录、文章、藏品页与折页拼版的收藏小册 |
| 快递面单工坊 | 制作国内、国际、双语、赛博、复古与潮牌六种风格快递面单 |
| 设定卡工坊 | 制作档案、杂志、RPG 与手帐四种风格角色设定卡 |

### 目录与共享资源

```text
static/virtual/
├── oc-timeline-generator/        # 时间线
├── player/                       # 歌词与播放列表
├── social-post-generator/        # 社交帖子生成器
├── mail-generator/               # 邮件档案
├── review-generator/             # 大众点评
├── cart-generator/               # 购物车与结算
├── receipt-invoice-generator/    # 小票与 Invoice
├── desktop-moodboard-generator/  # 模拟电脑桌面
├── backpack-generator/           # 背包
├── appraisal-certificate-generator/ # 鉴定书生成器
├── museum-booklet-generator/     # 小册
├── express-label-generator/      # 快递面单工坊
├── oc-card-lab-generator/        # 设定卡工坊
└── shared/                       # 公共资源（字体、颜色选择器、主题桥接）
```

每个工具是独立目录，`index.html` 负责结构、`css/` 负责样式、`js/` 负责交互与渲染；`shared/` 里放多个工具共用的字体、颜色选择器和主题脚本。Hugo 会把 `static/` 原样复制到 `public/`，所以这些工具不需要单独构建。

### 从单 HTML 到三种语言

之前的游戏和工具大多在一个 partial 里同时写结构、样式和脚本；这 13 个工具交互更重，代码按职责拆开：

- **HTML**：页面骨架、编辑面板和工具栏
- **CSS**：布局、组件样式、画布主题和响应式
- **JavaScript**：状态管理、画布渲染、JSON 导入导出、PNG 导出

工具代码基本照搬源站，但补上了两件本地化的事：接入站内明暗主题、让搜索结果能直接跳到工具页。

### 明暗主题接入

主站默认黑暗模式，但照搬来的工具页原本只有浅色、没有切换按钮。这次通过两个共享文件统一接入：

```text
static/virtual/shared/
├── site-theme.js    # 读取 pref-theme（与主站同一键），默认黑暗
└── site-theme.css   # 用 data-site-theme 覆盖操作区颜色
```

每个工具页右下角有一个浮动切换按钮，点击后在黑暗/明亮之间切换；偏好写入主站同一个 `pref-theme`，两边会互相联动。工具画布里的作品是用户设计的一部分，保持原样不跟随变暗。

这里踩过一个真坑：一开始直接复用主站的 `data-theme` 属性，结果和工具自带的画布主题按钮冲突，页面里点任何地方都会被当成“切换画布主题”。最终改用独立的 `data-site-theme` 属性，彻底隔离两层主题逻辑。

### 搜索接入

静态工具不在 Hugo 内容体系里，默认搜不到。沿用现有小功能的模式，为每个工具在 `content/tools/` 下加一个入口页（title + description），并新增跳转布局：搜索命中后先进 `/tools/<slug>/`，再立即跳到真实的 `/virtual/<slug>/`：

```go
{{- $target := .Params.target | default "/tools/" -}}
<script>location.replace("{{ $target }}");</script>
```

现在搜索“时间线”“小票”“大众点评”“快递面单”都能直接命中对应工具。

### 列表页变化

“小功能”页在“实用工具”“游戏”之后新增了“虚拟信息生成器”分区，标题右侧有一句小字提示“使用以下功能时建议开启浅色模式”，提醒用户这些工具更适合在明亮主题下查看。

---

> 完整源码：[github.com/Axon-Luo/luostratus.cn](https://github.com/Axon-Luo/luostratus.cn)
