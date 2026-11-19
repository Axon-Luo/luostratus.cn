# 配色工坊 · 项目交接文档（给下一个 AI 工具）

> 交接时间：2026-11-17
> 仓库：`E:\配色工坊`（Windows，git `master`）
> 代码基线提交：`1c46880 feat: 页面层级导航、返回上一级与贺卡五种版式`
> 交接文档提交：本文件自身的提交，用 `git log -1 -- HANDOFF.md` 查看
> 当前版本：`package.json` → `0.2.0`
> 当前工作区：干净（无未提交改动）
> 参赛：2026 Qoder 高校创造力大赛 · LifeHack 生活娱乐赛道
> 硬截止：**2026-11-30 18:00**，作品必须部署到 **Qoder Sites** 并公开访问

---

## 0. 给新 AI 的第一条指令（可直接粘贴）

```text
你在 Windows 的 E:\配色工坊 接手一个已经完成 v2 的纯前端项目「配色工坊」。
先完整阅读仓库根目录的 HANDOFF.md，再读 README.md、docs/技术说明.md、docs/发布清单.md。
不要重做视觉，不要引入后端、账号、云同步、AI 生图或第三方运行时请求。
改动前先跑 pnpm check，改完必须跑 pnpm check 和 pnpm test:e2e，保持 137 单测 / 109 e2e / 20 axe 全绿。
做完用 pnpm release 重新生成「配色工坊 v2/」和 zip；发布到 Qoder Sites 由用户操作。
```

---

## 1. 项目是什么

**配色工坊 · 生活调色盘** 是一个纯前端静态 Web 应用：

- 输入：一张生活照片、一个颜色、一个主题、一个案例，或直接手填 HEX/RGB/HSL。
- 处理：在浏览器本地完成取色、配色生成、深色成对、色弱安全、WCAG/APCA 检查、色阶/令牌、渐变、CMYK 近似。
- 输出：五种真实场景预览、分享卡、贺卡、周历、房间清单、打印色卡、CSS/JSON/SVG/PNG、分享链接。
- 原则：**无后端、无上传、无账号、无第三方请求**；图片只在浏览器里处理；可离线二次访问；PWA 可安装。

### 参赛约束

- 必须用 Qoder 开发，并部署到 **Qoder Sites**（Free 计划只支持静态站点）。
- 当前机器**没有安装 Qoder**，所以“部署到 Qoder Sites”这一步必须由用户手动完成；本地只能产出可发布的静态站点和文档。
- 参赛作品要在 **2026-11-30 18:00** 前提交公开链接。

### 明确不做（除非用户重新授权）

- 色彩人格测试（用户明确排除）。
- AI 生图 / AI 配色 / 调模型 API。
- 账号、云同步、后端数据库、实时协作。
- 图像分割、AR 实时换色。
- 多语言 i18n（当前仅中文）。
- 把项目改成 React/Vue/Next；当前是 Preact + signals + 原生 CSS。

---

## 2. 当前完成度（截至本交接）

| 项目 | 状态 |
| --- | --- |
| v2 功能 | **23/23 全部完成** |
| 页面 | 16 个路由，另有分享链接 `#/s/:payload` |
| 单元测试 | **137 项通过**（Vitest） |
| 端到端 | **109 项通过**（Playwright + 本机 Edge） |
| 可访问性 | **20 页 axe 扫描**，0 serious / critical |
| 构建 | JS **102.4 KB gzip**、CSS **12.1 KB gzip**，单 bundle |
| 发布包 | `发布包/配色工坊 v2/` + `发布包/配色工坊 v2.zip`（1,639,407 字节） |
| 单文件版 | `发布包/配色工坊 v2/配色工坊-免安装.html`（347,603 字节） |
| 部署 | **已部署** `colorlife-workshop-67tq5stihve.qoder.zone`（公开）；用户要求此后更新直接同步发布 |
| 截图 | `docs/screenshots/` 10 张当前黑底视觉（6 张重拍 + 4 张新功能）；作品帖草稿 `docs/作品帖.md` |

最近的关键提交：

```text
1c46880 feat: 页面层级导航、返回上一级与贺卡五种版式
669cf3c feat: 配色挑战支持做题中切换题型并重新开始
042fd7c feat: 配色挑战作答后自动下一题，并显示上一题结果
aa5cb5b fix: 配色挑战每轮题目重复，扩充题型变体与题库
2f6b5d0 feat: LuoStratus 风格视觉 / 挑战题库升级 / 工具独立调色
bd3c892 feat: 专业工具支持独立选色（色阶 / 渐变）
0f13a46 chore: v2 发布准备（首页入口 / 文档 / 0.2.0 / 独立版修复）
38cf70d feat: v2 第八波（案例库 / 小课堂）— 23/23
```

---

## 3. 运行环境与命令

本机实测：

- Node **v24.16.0**
- pnpm **11.22.0**
- 包管理：pnpm（`pnpm-lock.yaml` 已提交）
- 浏览器：本机安装了 Edge；Playwright 使用 `channel: 'msedge'`

```bash
cd E:\配色工坊
pnpm install            # 首次
pnpm dev                # 开发服务器，默认 5173
pnpm check              # tsc --noEmit + 137 个单元测试
pnpm test               # 仅 Vitest
pnpm test:e2e           # Playwright，自动使用 4173 的 preview
pnpm build              # 类型检查 + 生产构建到 dist/
pnpm release            # build + 生成「发布包/配色工坊 v2/」
pnpm standalone         # 单独生成单文件 HTML（需已有 dist）
pnpm icons              # 重新生成 PWA 图标
pnpm shots              # 重拍 10 张提交截图（需 4173 的 preview）
```

### 验证顺序（非常重要）

```bash
pnpm check
pnpm build
pnpm test:e2e
pnpm release
```

- **Playwright 读取的是 `dist/` 的 preview，不是 `src/` 的 dev server。**
  改完代码后如果只跑了 `pnpm test:e2e` 没跑 `pnpm build`，测试可能仍在测旧版本，导致“明明改了却不过”或“明明没改却过了”。
- preview 默认 `http://localhost:4173`；Playwright 配置 `reuseExistingServer: true`。
- 如果 4173 已有旧 preview 在跑，先确认它服务的是最新 `dist`，或在测试前重新 `pnpm build`。
- `pnpm release` 会先删除 `发布包/配色工坊 v2/`；如果目录被预览服务/命令行 cwd 占用，会报 `EPERM`。先停掉占用进程再打包。

---

## 4. 技术栈与构建约束

| 层 | 选型 |
| --- | --- |
| 构建 | Vite 8 |
| 语言 | TypeScript 7，`strict: true`，`noEmit` |
| UI | Preact 11 + `@preact/signals` |
| 样式 | 原生 CSS + CSS 自定义属性（无 Tailwind、无 UI 框架） |
| 图标 | 项目内 `Icon` 组件 + 内联 SVG |
| 路由 | 原生 hash 路由（`route` signal） |
| 二维码 | `qrcode-generator` |
| 测试 | Vitest + jsdom；Playwright + axe-core |
| PWA | 手写 `public/sw.js` + `public/manifest.webmanifest` |

### 不可破坏的构建约束

- `vite.config.ts` 中 `base: './'`、`cssCodeSplit: false`：**必须保持单 JS + 单 CSS**，因为单文件版会把它们内联进 HTML。引入动态 import / 代码分割会破坏 `scripts/standalone.mjs`。
- `assetsInlineLimit: 4096`：小资源内联。
- `target: 'es2020'`。
- 不允许引入需要 Node 服务端运行的依赖；发布目标是纯静态。
- 不允许运行时请求外部字体、CDN、统计脚本；当前字体全部走系统字体栈。

### 关键配置

`vite.config.ts`：

```ts
base: './'
plugins: [preact()]
build: { target: 'es2020', cssCodeSplit: false, assetsInlineLimit: 4096 }
test: { environment: 'jsdom', include: ['tests/**/*.test.ts'], globals: true }
```

`playwright.config.ts`：

```ts
baseURL: 'http://localhost:4173'
channel: 'msedge'
viewport: { width: 1280, height: 900 }
webServer.command: 'pnpm preview --port 4173 --strictPort'
webServer.reuseExistingServer: true
```

`tsconfig.json`：ES2022 / Bundler / `jsxImportSource: preact` / `strict` / `verbatimModuleSyntax`。

---

## 5. 目录地图

```text
E:\配色工坊
├─ index.html                 PWA meta、manifest、apple 图标
├─ package.json               脚本与依赖（version 0.2.0）
├─ vite.config.ts
├─ playwright.config.ts
├─ tsconfig.json
├─ README.md                  面向用户/评委的项目说明
├─ HANDOFF.md                 本交接文档
├─ 发布包/                    交付包输出目录（配色工坊 v2/ + zip，已 gitignore）
├─ docs/
│  ├─ 技术说明.md             架构、算法、验证数据、视觉系统
│  ├─ 发布清单.md             发布前检查、Qoder Sites 步骤、排障
│  ├─ 演示脚本.md             60–90 秒演示口径
│  ├─ 作品帖.md               大赛提交帖草稿（含截图引用）
│  └─ screenshots/            10 张当前视觉截图（scripts/screenshots.mjs 可重跑）
├─ public/
│  ├─ manifest.webmanifest
│  ├─ sw.js                   cf-cache-v6
│  └─ icons/                  192 / 512 / maskable / apple
├─ scripts/
│  ├─ package-release.mjs     生成「发布包/配色工坊 v2/」
│  ├─ standalone.mjs          dist → 单文件 HTML
│  ├─ serve.mjs               Node 零依赖静态预览（4180）
│  ├─ launcher.bat            GBK + CRLF 的一键启动器
│  ├─ icons.mjs               生成 PWA 图标
│  └─ screenshots.mjs         截图脚本（10 张提交截图）
├─ src/
│  ├─ main.tsx                挂载 App、init()
│  ├─ state.ts                signals + actions + 持久化
│  ├─ app/App.tsx             顶栏、导航、路由分发、PageNav 元数据、标题、主题色
│  ├─ content/                场景/风格/情绪/主题/案例/课堂/令牌格式
│  ├─ core/
│  │  ├─ color/               convert / contrast / cvd / quantize
│  │  ├─ palette/             types / generate / pair / metrics / scale / custom
│  │  ├─ export/              exporters / tokens / shareCard
│  │  ├─ image/               图片采样/情绪板
│  │  ├─ import/              CSS/JSON/文本解析
│  │  ├─ storage.ts           cf.v2 schema 与 v1 迁移
│  │  ├─ share.ts             分享 payload 编解码
│  │  ├─ capture.ts           EyeDropper / getUserMedia
│  │  ├─ gradient.ts
│  │  ├─ cmyk.ts
│  │  ├─ daily.ts
│  │  ├─ challenge.ts
│  │  ├─ themes.ts
│  │  ├─ sceneChecklist.ts
│  │  ├─ lifePlans.ts         穿搭/房间/贺卡标题等纯逻辑
│  │  ├─ lifeSheets.ts        canvas 成品：周历/房间清单/贺卡/打印页
│  │  ├─ cases.ts / lessons.ts
│  │  └─ library.ts           收藏/历史导入导出
│  ├─ features/               每个路由一个页面组件
│  ├─ studio/                 工作台内部组件（生成器、预览、检测等）
│  └─ ui/
│     ├─ components.tsx       Card / Empty / Tabs / Icon / ToastHost 等
│     ├─ Dialog.tsx
│     ├─ IndependentColors.tsx 工具页 6 色独立调色条
│     ├─ PageNav.tsx           返回上一级 + 面包屑
│     ├─ InstallPrompt.tsx
│     └─ styles.css            全部样式（约 3900 行）
└─ tests/
   ├─ unit/                   23 个测试文件，137 项
   └─ e2e/                    app.spec.ts / v2.spec.ts / workflow.spec.ts / audit.spec.ts / studioAudit.spec.ts / toolsNew.spec.ts / printStyles.spec.ts / a11y.spec.ts，109 项
```

---

## 6. 路由与页面层级

路由是 **hash 路由**，形如 `#/studio`。`src/state.ts` 的 `route` signal 保存当前 path；`handleHashChange()` 还处理分享链接。

### 16 个路由

| 路由 | 组件 | 页面 | 父级/返回 |
| --- | --- | --- | --- |
| `/` | `Home` | 首页 | 无 |
| `/studio` | `Studio` | 工作台 | 首页 |
| `/tools` | `Tools` | 工具中心 | 首页 |
| `/daily` | `Daily` | 每日一色 | 首页 |
| `/play` | `Play` | 配色挑战 | 工具 |
| `/themes` | `Themes` | 主题配色 | 工具 |
| `/outfit` | `Outfit` | 一周穿搭 | 工具 |
| `/room` | `Room` | 房间刷色 | 工具 |
| `/card` | `CardPage` | 礼物贺卡 | 工具 |
| `/print` | `PrintPage` | 打印色卡 | 工具 |
| `/cases` | `Cases` | 生活案例 | 工具 |
| `/learn` | `Learn` | 配色小课堂 | 工具 |
| `/scales` | `Scales` | 色阶与令牌 | 工具 |
| `/gradient` | `Gradient` | 渐变生成器 | 工具 |
| `/library` | `Library` | 我的方案 | 首页 |
| `/about` | `About` | 关于 | 首页 |

### 导航规则（App.tsx）

- 顶栏固定 5 项：首页 / 工作台 / 每日 / 工具 / 我的。
- `TOOL_PATHS` 包含 `/tools` 及其所有子工具；进入任一工具子页时「工具」保持高亮。
- `PAGE_META` 为每个非首页路由提供：
  - `trail`：面包屑，例如 `首页 / 工具 / 渐变生成器`；
  - `back`：确定的父级链接（不依赖 history），工具子页回 `#/tools`，其余回 `#/`。
- `PageNav` 在 `main` 里、页面内容之前渲染；`styles.css` 用 `.page-nav + .page { padding-top: 20px; }` 收紧留白。

### 工具中心分组（Tools.tsx）

按使用顺序：

1. 开始与素材：工作台、我的方案
2. 专业工具：色阶与设计令牌、渐变生成器
3. 生活任务：一周穿搭、房间刷色、礼物贺卡、打印色卡
4. 灵感与学习：生活案例、配色小课堂、主题配色
5. 每日与挑战：每日一色、配色挑战

工具卡片总数 **13**，被 e2e 断言。

### 页面标题

`App.tsx` 的 `titles` map 维护文档标题；新增路由时**必须同时加**：
1. `import` 页面组件；
2. `PAGE_META`；
3. `titles`；
4. 路由分支；
5. `TOOL_PATHS`（如果是工具子页）；
6. e2e/axe 覆盖。

---

## 7. 视觉系统（LuoStratus 风格）

用户明确要求整体改成 **LuoStratus.cn 风格**，当前已实现：

- 纯黑底 `#000`、深色卡片、靛蓝强调 `#4a55e6`。
- 800 字重粗标题、等宽大写小标签（`.eyebrow`）、浏览器窗口式主视觉（三色圆点 + 调色板网格 + `LIVE PREVIEW`）。
- 默认深色；浅色主题保留同一套几何与靛蓝强调。
- 老用户首次升级用 `localStorage` 的 `cf.ui.v3` 做一次性迁移，强制切到深色；之后用户手动切浅色仍会持久化。
- 移动端 620px 以下隐藏 `.brand-text`，只留品牌 mark，避免 5 项导航被挤成竖排。

### 设计令牌（styles.css 顶部）

```css
:root {
  --paper: #000000;
  --paper-2: #07070a;
  --card: #0b0b0f;
  --card-2: #111116;
  --ink: #f6f6f8;
  --ink-2: #b9b9c4;
  --ink-3: #83838f;
  --line: rgba(255,255,255,.11);
  --line-strong: rgba(255,255,255,.28);
  --accent: #4a55e6;
  --accent-2: #8b96ff;
  --ok: #62d39b;
  --bad: #ff7d73;
  --warn: #e6b45c;
  --radius: 16px;
  --radius-sm: 10px;
  --shadow: none;
}
[data-theme='light'] { /* 白底版本，同一几何 */ }
```

**注意**：不要把 `--accent` 改回 `#5b6cff`。它配白字只有 4.17:1，会让 15 个页面的 axe color-contrast 同时失败；`#4a55e6` 是 5.63:1。

### 关键 UI 组件

- `ui/components.tsx`：`Card`、`Empty`、`Tabs`、`Icon`、`ToastHost`。
- `ui/PageNav.tsx`：全站页面层级条（返回 + 面包屑）。
- `ui/IndependentColors.tsx`：6 色独立调色条，供色阶、房间、贺卡、打印使用；改色只改页面局部，不回写工作台。
- `ui/Dialog.tsx`：原生 `<dialog>` 封装的取色/导入/分享卡/摄像头/情绪板/场景清单弹窗。
- `ui/InstallPrompt.tsx`：PWA 安装提示。

### 样式约定

- 新组件优先使用 CSS 变量，不写死暗色/浅色。
- 卡片统一 `.card` / `.feature` / `.tool-card` / `.theme-card` / `.case-card`。
- 按钮：`.btn` + `.btn.primary` / `.ghost` / `.sm`；圆角 999px。
- 筛选项：`.chip` + `.chip.is-on`。
- 页面根：`<div class="container page">`，标题用 `<header class="page-head">`。
- 不要引入外部字体；截图/画布字形会因系统字体略有差异。

---

## 8. 状态、持久化与分享

### 入口

`src/main.tsx` 挂载 `App`，并调用 `init()`（设置主题、监听 hash、巡检每日/挑战等）。

### 主要 signals（state.ts）

- 数据：`palettes`、`activeId`、`activePalette`、`activeMap`、`lockMap`
- 设置：`settings`（baseColor/format/scene/style/mood/harmony/strict/theme/preview/pairMode/cvdSafe/shareFormat）
- 互动：`favorites`、`history`、`daily`、`challenge`、`toastMsg`
- 采集：`imageUrl`、`imageColors`
- 工具：`toolDrafts`（按工具 id 存草稿）
- 预览：`previewTheme`、`cvdType`
- 路由：`route`
- 分享：`sharedFrom`

### 关键 actions

`updatePaletteColor`、`regenerateAroundLocks`、`applyPaletteToStudio`、`markDailyVisit`、`recordChallengeScore`、`exportLibraryData`、`importLibraryData`、`clearAllData`、`deleteHistory`，以及 `setTheme`、`toast`。

### localStorage

- 主 key：`cf.v2`
- 旧 key：`cf.v1`（只读迁移，不删除，便于回滚）
- 一次性视觉迁移 key：`cf.ui.v3`
- `Persisted` 结构：`{ version: 2, favorites, history, settings, daily, challenge, tools }`
- 存储失败时降级为内存模式，不抛错。

**不要随意改 key 或 `version`**；如果必须升级 schema，必须：
1. 在 `normalize()` 做字段兜底；
2. 保留 `cf.v1`/`cf.v2` 读取；
3. 写迁移测试；
4. 更新本文档。

### 分享链接

- `core/share.ts`：base64url 紧凑 JSON。
- v2 payload 增加可选 `d`（深色角色数组）；解码兼容 v1。
- 路由 `#/s/:payload` 由 `handleHashChange()` 解码，写入 `palettes`，把 URL 替换为 `#/studio` 并弹 toast。
- 分享卡本身由 `core/export/shareCard.ts` 画布生成，二维码用 `qrcode-generator`。

### 主题

- `Settings.theme`：`'light' | 'dark'`。
- 默认值在 `DEFAULT_SETTINGS` 是 `dark`。
- `state.ts` 初始化时用 `initialTheme()`：若 `cf.ui.v3` 不存在，强制 dark 并写入标记；之后尊重用户选择。
- `App.tsx` 同步 `<meta name="theme-color">`：dark `#000000`，light `#F4F4F7`。
- `index.html` 初始 theme-color 也是 `#000000`。

---

## 9. 色彩核心与算法

### 9.1 色彩空间

`src/core/color/convert.ts`：

- sRGB ↔ HSL ↔ OKLab/OKLCH。
- 对外导出 HEX/RGB/HSL；内部生成/色差/色阶用 OKLab/OKLCH。
- `textOn(hex)` 返回黑或白文字色；`contrastRatio(a,b)` 在 `contrast.ts`。
- `clamp`、`hexToOklch`、`oklchToHex`、`hslToHex` 等纯函数。

`contrast.ts`：

- WCAG 2.2 相对亮度与对比度。
- APCA Lc（0.1.9）在 metrics 层使用。

`cvd.ts`：

- Machado 2009 色觉障碍矩阵（protan/deutan/tritan）。
- 生成色弱友好方案时用分离度阈值。

`quantize.ts`：

- OKLab k-means++（情绪板/图片取色）。

**修改颜色算法时**必须保持：
- 对外仍是 hex/rgb/hsl；
- 修正对比度时保持色相偏移最小；
- 深色成对仍保留 L/h；
- `ΔE2000` 仍用于“最小色差修复”；
- 单元测试 `color.test.ts` / `pair.test.ts` / `palette.test.ts` 全绿。

### 9.2 配色生成

`src/core/palette/generate.ts`：

- `generatePalettes(options)` → `Palette[]`。
- `GenerateOptions`：baseHex、scene、style、mood、harmony、seed、pair、cvdSafe、count、now。
- 6 角色：`primary / secondary / accent / bg / surface / text`。
- 输出 `Palette`：colors、a11y、description、dark/darkA11y、cvd、source、tags。
- 单色编辑 + 锁定：`regenerateAroundLocks`。
- `paletteForTheme(p)` 用 `p.dark` 做深色预览。

`pair.ts`：

- `buildDarkPalette`：保持 L/h，生成深色成对。
- `cvdSeparation` / `ensureCvdSafe`。

`scale.ts`：

- `SCALE_STEPS` = 50/100/…/950（11 档）。
- `buildScale` 生成每角色色阶；`buildSemanticTokens` 生成 success/warning/danger/info。

`custom.ts`：

- `paletteWithColors(p, overrides)`：页面级独立改色，返回新 `Palette`，不改工作台；清掉 `dark/darkA11y/cvd` 避免脏数据。
- 工具页独立调色都用它。

### 9.3 导出

`src/core/export/tokens.ts`：

- `buildTokens`、`tokensToCss/Tailwind/Figma/Android/Ios/Flutter`。
- `TOKEN_FORMATS` 驱动色阶页 6 个 tab。

`src/core/export/exporters.ts`：

- `displayName`、CSS/JSON/SVG/PNG 导出。

`src/core/export/shareCard.ts`：

- `SHARE_FORMATS` 3:4 / 9:16 / 16:9。
- `renderShareCard`、`shareCardSize`、`shareCardFileName`。
- 二维码；PNG 输出。

### 9.4 渐变 / CMYK

`gradient.ts`：

- `normalizeGradient`、`buildGradientCss`、`gradientStopsFromPalette`、`gradientTextSuggestion`。
- 支持 linear/radial/conic；2–6 个色标；中心点 `cx/cy`（径向/锥形）。
- 几何 helper 保证导出与 CSS 同约定：`linearGradientLine`（CSS 角度自向上顺时针、渐变线为矩形投影）、`radialGradientRadius`（farthest-corner）、`conicStartRad`（canvas 偏移 -90°）、`stopColorAt`/`conicLut`（sRGB 插值与锥形回退查找表）。
- `GRADIENT_PRESETS` 6 套、`randomGradientSpec`、`reverseStops`。
- `core/export/gradientPng.ts`：4 种尺寸、文字开关、锥形无 `createConicGradient` 时 ImageData 回退；历史坑：旧导出用数学角约定 + max(w,h) 线长，与预览差 90° 且色标位置不准，已修。
- UI：色标轨拖拽/点击加色标（行序保持插入序，排序只用于 CSS）、角度旋钮 + 滑杆 + 数值、中心滑杆、预设/反转/随机。

`cmyk.ts`：

- `rgbToCmyk` / `cmykLabel`，近似值，打印页注明“仅供沟通，正式印刷请打样”。

### 9.5 每日 / 挑战

`daily.ts`：

- `dayKey()`、`dailySeed()`（FNV-1a）、`dailyPalette()`、`dailyNote()`、`previousDay()`、`nextStreak()`、`visitDaily()`。
- 每日方案固定、可回看 7 天、连续天数存 `daily`。

`challenge.ts`：

- 4 种模式：`hue` / `order` / `odd` / `contrast`。
- `buildRound(mode, seed, roundIndex)`：
  - **每轮把 `roundIndex` 混入 seed**（`seed ^ imul(roundIndex+1, 0x9e3779b9)`），这是修复“每题重复”的关键，不要改回固定 seed。
  - `difficulty = clamp(roundIndex/9,0,1)`。
  - 找色相：4–6 选 1，色相步长从约 14° 收到 4°。
  - 排明度：5–7 块，OKLab 明度差 0.022–0.042；有 light-to-dark / dark-to-light 两个方向。
  - 找不同：6–8 块，分色相偏 3.5–11.5° 或饱和度偏 12–18 两个变体。
  - 对比度：4–5 组，阈值随机 3 / 4.5 / 7；只有一组达标。
  - 提示语每种 6–8 套。
- `isCorrect(round, answer)`：数字题或顺序数组。
- `scoreFor(correct, secondsLeft)` = 10 + 0–5 时间奖励。

`Play.tsx` 交互：

- 60 秒 / 10 题。
- 作答后 900ms **自动下一题**（`feedback` 的 effect 触发，避免捕获旧分数）。
- 顶部状态栏显示「上一题 ✓ 正确 / ✗ 错误」，跨题保留。
- 最后一题自动结算。
- 做题中可切题型：`switchMode` → `begin(nextMode)`，重置比分/计时/题号/上一题状态，用新题型新种子重开。
- 计时器 effect 依赖 `[running, runId]`，`begin` 递增 `runId` 保证从 60 秒重跑。
- 题型 chip 不再 `disabled`。

### 9.6 主题 / 案例 / 课堂 / 场景清单

- `content/themes.ts`：12 节气 + 8 城市，`ThemePreset`；`core/themes.ts` 有 `themePalette` 缓存和 `blindTheme`。
- `content/cases.ts`：8 个案例；`core/cases.ts` 有 `casePalette` 缓存。
- `content/lessons.ts`：8 篇（入门 3 / 进阶 5），每篇 ≥5 节，含要点列表、速查表与实色对比示例（`LessonSample` 带 live 对比度）；`core/lessons.ts` 有 `lessonPalette` 缓存；已读进度存 `cf.learn.v1`。
- `sceneChecklist.ts`：10 场景 × 6 角色；`buildSceneChecklist`、`checklistMarkdown`。

### 9.7 生活任务

`lifePlans.ts`：

- `buildOutfitWeek`：7 天，上装/下装/鞋包 + 备注。
- `buildRoomSchemes(base, seed)`：返回 **3 套**：
  - 第 1 套 `room-base` 直接用传入的独立基色；
  - 后 2 套 `nature`/`retro` 从主色生成。
- 5 个部位：墙 45 / 地面 25 / 沙发 15 / 窗帘 10 / 点缀 5。
- `CARD_OCCASIONS`：生日/毕业/节日/感谢。
- `cardTitle()`。

`lifeSheets.ts`（canvas）：

- `renderOutfitImage` 1080×1920。
- `renderRoomImage` 1240×1754（房间图 + 面积表）。
- `renderCardImage` 1080×1440，五种版式，见下。
- `renderPrintSheet` A4 1240×1754 / A5 874×1240，150dpi，带裁切线。
- `contrastLabel`。

**贺卡五种版式**（`CARD_STYLES`）：

| id | 中文 | 说明 |
| --- | --- | --- |
| `classic` | 经典 | 上下色条 + 六色块 |
| `minimal` | 极简 | 大留白 + 细线 + 小色条 |
| `editorial` | 杂志 | 大色块 + 分栏 + 六色网格 |
| `gradient` | 渐变 | 主色→强调色渐变 + 白字 + 半透明色卡 |
| `film` | 胶片 | 深色边框 + 拍立得内框 + 齿孔 + 色带 |

每个版式都按 `textOn(bg/surface)` 算标题/正文颜色，深色底自动切白，避免不可读。

### 9.8 采集与导入

- `capture.ts`：`supportsEyeDropper`、`pickScreenColor`、`openCamera`、`stopStream`；错误码。
- `image/`：上传/拖拽/粘贴、canvas 采样、情绪板 2–6 张。
- `import/parse.ts`：`parsePaletteInput`、`paletteFromColors`、角色映射；支持 HEX/CSS/JSON。
- 摄像头需要 HTTPS 或 localhost；EyeDropper 不支持 Safari。

### 9.9 方案库

`core/library.ts`：

- 导出/解析/合并；
- 六角色齐全时**保留原始角色顺序**，不要重新排序；
- 支持合并/替换导入；
- 单元测试在 `library.test.ts`。

### 9.10 工具页审计修复（2026-11-18）

对除「开始与素材」外的 11 个工具页做过一轮桌面 + 移动真实浏览器审计（控制台、溢出、主流程探针），修复：

- 穿搭「换一周」改为独立随机种子状态（`Outfit.tsx` 的 `seed`），连续点击每次都会重掷；此前无种子调用 `buildOutfitWeek` 导致第二次起结果不变。
- 排明度反馈不再把所有块标绿：块上数字显示**正确顺序**，排错的位置红框（`is-miss`）并加「你 N」小标；排对才绿框。反馈文案补充读法说明。
- 结算后切换题型回到准备界面（清空 round/feedback），不再停留在旧结算页。
- 找不同启用 `is-odd` 三列布局（此前 CSS 规则存在但类名未挂）；剩余 ≤10s 计时变红脉冲（`play-time is-low`）。
- 移动端色阶改为整块横滑（`.scale-list` overflow-x，行 min-width 580px），角色标签 sticky 吸附左缘并撑满行高，步宽 ≥44px；深色/浅色均验证。
- Cases/穿搭/房间/打印/贺卡的开关型 chips 补 `aria-pressed`；全局滚动条补 hover 态与 Firefox `scrollbar-color`。
- 回归测试在 `tests/e2e/audit.spec.ts`（4 项）与 `lifePlans.test.ts`（种子不同会换一周）。

### 9.11 开始与素材审计修复（2026-11-18）

对工作台与我的方案做桌面 + 移动真实浏览器审计，只改程序与交互逻辑、不动设计与功能：

- 工作台全局快捷键不再劫持控件：空格/↑↓ 在聚焦的 button/a/summary 上交给原生激活；Ctrl+Z/Y 仍全局可用；输入框与打开的对话框内一律不触发。
- 粘贴图片同样跳过输入框与打开的对话框，避免把图贴进导入文本框时被工作台抢走。
- 图片取色按 URL 缓存提取结果（`Studio.tsx` 模块级 `extractedCache`）：离开再回工作台只重绘画布与色条，不再重置用户后来选的基础色、不再重复弹提取提示；onload 加 canceled 守卫防竞态。
- `updatePaletteColor` 同色提交直接返回：不锁定角色、不写撤销记录、不刷 updatedAt；`renamePalette` 同名返回不写状态。
- 重命名输入框 Esc 真正丢弃草稿（`cancelRename` ref 挡住卸载时的 blur 提交）。
- 分享卡缓存 blob 带选项指纹（`blobKeyRef`）：防抖窗口内切换比例后立刻下载/系统分享会重渲染，不再拿旧尺寸像素；系统分享仅 AbortError 静默，其它失败落下载兜底。
- 情绪板满 6 张再加给 toast 提示且不再创建多余 objectURL；截断加入时提示「多余的已忽略」；移除时 revoke 移出 setState updater。
- 四处 FileReader（取材上传、全局粘贴、方案库导入、导入配色）补 onerror toast；方案库导入去掉冗余三目。
- 回归测试：`tests/unit/studioState.test.ts`（3 项）、`tests/e2e/studioAudit.spec.ts`（7 项）。
- 确认非缺陷：撤销栈同 key 600ms 合并是设计行为（连按空格只占一条历史）；原生 dialog 的 Esc/背板关闭、摄像头错误分支均正常。

### 9.12 工作台双列独立滚动（2026-11-18）

用户要求滚轮按光标所在列独立滚动，且列要铺满视口、不在中途露出黑带：

- 结构：`.studio-grid` 两列各包一层 `.studio-col`（grid item，`align-items: stretch` + JS 显式高度），内层 `.side` / `.main` 才是滚动容器。
- 桌面（>960px）内层 `position: sticky; top: 84px` + `height: calc(100dvh - 100px)` + `overflow-y: auto` + `overscroll-behavior: contain`：吸附后列底恒为视口底 -16px，未吸附时延伸出视口被裁切，任何滚动位置都没有黑带；contain 阻断滚动链，滚轮原生只作用于光标下的列。
- 外层高度由 `Studio.tsx` 的 ResizeObserver 同步为两列 `scrollHeight` 的较大值（内容自然高度），给 sticky 留出整页吸附行程；卡片尺寸变化（换方案、切预览、传图）自动重算。移动端清空高度、恢复整页滚动。
- 高视口下某列内容不足一屏时不是可滚动容器，grid 的 wheel 监听（passive:false + matchMedia 桌面守卫）对该列 `preventDefault`，避免链到整页带动另一列。
- 桌面 `.studio-page` padding-bottom 收为 20px，滚到底时列与 footer 只留 20px 间隙。
- 回归：`studioAudit.spec.ts` 两项（滚轮只滚光标列、高视口短列不带动整页）；真实浏览器量测 s=0/170/600/1500/最大 五种滚动位置的列顶底与 footer 位置，双主题截图复核。

### 9.13 首页三板块卡片尺寸统一（2026-11-18）

用户要求首页三个板块的卡片大小一致，以第二板块「把颜色带进生活」的 `.life-card` 为基准：

- 基准度量：`min-height: 92px` / `padding: 13px` / `gap: 4px` / 圆角 12。`.quick-card` 由 168/14/6/圆角14 改为基准值，`.pro-card` 补 `min-height: 92px`；删掉 ≤620 的 `.quick-card { min-height: 0 }` 覆盖，移动端同样 92。
- `.quick-card` 标题/描述字号对齐 life（14.5 / 11.5×1.6），kicker 10px×1.4；四条 QUICK 描述精简到单行（≤17 字），保证最窄四列宽度（981px 视口）也不换行撑高。
- 实测 1920/1440/1024/980/700/390 六档视口：11 张卡片全部 92px；桌面 + 移动整页截图复核。
- 顺带补齐 `ImportDialog.tsx` readFile 缺失的 onerror toast（§9.11 的描述自此与代码一致）。

### 9.14 三个颜色小工具（2026-11-19）

用户选定混色实验室、传统色字典、对比度修复器全部加入，工具 13→16、功能 23→26：

- `core/mix.ts`：颜料减色用 Kubelka-Munk 单常数（K/S 加权后反解反射率），光加色在线性亮度空间加权；端点恒等、比例夹取 0..1。页面 `#/mix`：双 ColorField + 交换 + 比例滑杆/预设 chips，两结果卡可复制、四色带回工作台。
- `content/traditionalColors.ts`：118 条流传传统色（名字/近似 hex/七色系），注明近似仅供灵感；`core/traditional.ts` 搜索（名字或 hex、可叠色系）与 ΔE2000 近色查询。页面 `#/traditional`：查近色卡（ΔE 显示、复制、带回）、搜索框、色系 chips、色卡点击复制。
- `core/contrastFix.ts`：`fixContrast` 保持 OKLCH 色相彩度、只向较近一端二分明度到最近达标点；两端都达不到（如中灰背景 AAA 7）返回 null，页面显示该侧理论上限 `maxContrast`。页面 `#/contrast`：四档徽章、aria-hidden 预览区（比值与判定在上方文字等价）、目标 chips、修前景/修背景两行应用/复制。
- 共用 `ui/components.tsx` 新增 `ColorField`（拾色器 + hex 文本，Enter/blur 提交、非法回退、简写归一化同步回写）。
- 审计修复：ColorField 有效提交原先等 effect 回写有一帧延迟，改为 commit 内同步 setDraft；回归 `toolsNew.spec.ts`「简写色值提交后立即归一化」。
- 测试：单测 +13（mix/traditional/contrastFix）、e2e +11（toolsNew 10 + 归一化 1）、axe +3 页；`.contrast-preview` 按 `.lesson-samples` 同例排除。
- 实测：桌面双主题 + 移动 390 三页截图、键盘滑杆/非法输入回退/交换/不可达分支均验证，console 无错误。

### 9.15 打印色卡四种版式（2026-11-19）

用户要求丰富「打印色卡」的色卡样式，照贺卡版式选择器的做法加四种：

- `core/lifeSheets.ts` 新增 `PRINT_STYLES`（list 经典清单 / poster 大色块海报 / tickets 网格色票 / ratio 比例条）与 `PrintStyle`；`renderPrintSheet(p, sheet, size, style = 'list')` 按版式分支绘制，A4/A5 150dpi、裁切线、页脚 CMYK 提示与署名不变。
- 海报：六条整宽色带，文字用 `textOn` 自动反色，左名称/色值/占比、右 CMYK；色票：`ticketGrid` 2×3 圆角票（上色彩区下文字），可剪开；比例条：`ratioWidths` 按占比精确分宽（floor + 余数按小数部分分配，守恒），条内 ≥80px 才画百分比，下方明细行高按剩余页高均分铺满整页。
- 两个几何助手导出供单测：`ratioWidths`（零/负占比、单占比、不整除守恒）、`ticketGrid`（奇数/单色行数与尺寸不超界）。
- `PrintPage.tsx`：仅「色卡」内容显示版式 chips（title 带描述），切房间清单隐藏；下载文件名色卡为 `配色工坊-swatches-{style}-{size}.png`，房间清单保持原名；页头说明补「色卡四种版式」。
- 测试：单测 +8（printStyles.test.ts）、e2e +7（printStyles.spec.ts：默认版式、四版式逐点像素采样与方案色一致、A5 海报尺寸、样式文件名、房间隐藏版式、移动 390 无横滚）。
- 实测：桌面双主题 + 移动 390 截图逐版式核对；比例条初版下半页留白过多，改为明细行均分铺满后复核；console 无错误、横溢 0。

### 9.16 界面短文案去句号（2026-11-19）

用户视觉习惯要求删掉网站文字的句号，范围经确认为「只删界面短文案」：

- 删除范围：页面描述/提示/卡片/toast/画布成品文字、挑战反馈与题型说明、每日一色文案、主题与场景 tip、穿搭提示、审计报告措辞、分享描述、index.html meta 与 manifest description。句尾句号直接删；多句短文案的句中句号改逗号保可读；跨行 JSX 段落接缝（About 两段）补逗号。
- 保留：小课堂 8 篇正文（263 个句号）与案例 story（16 个）不动；代码注释不动。
- 实现：按行定位的脚本替换（只改字符串/JSX 行）；含 `* ` 乘号的画布注释行曾被过滤器漏掉，手工补齐（lifeSheets 房间清单 wrap 提示）。
- 顺带清理首页 CTA「打开工作台」残留的 arrow Icon（早前「按键删箭头」要求的漏网），删除随之无用的 Icon import。
- 验证：137 单测 / 109 e2e / 20 axe 全绿；19 路由 innerText 实测 17 个界面路由句号为 0，仅 /cases 16、/learn 9 保留正文句号；console 无错误；首页/关于截图复核。

### 9.17 作品帖与截图重拍（2026-11-19）

按大赛作品帖要求（作品链接 + 自我介绍/是什么/为什么/怎么用/ Qoder 过程五部分）起草 `docs/作品帖.md`：

- 链接用已公开站点；「怎么用」压到 5 步；「Qoder 过程」拆成「交给 Qoder 的步骤」与「用户自己决定/纠正的部分」，并附打印版式一个完整闭环例子。
- 截图凭据：重拍 6 张旧 v1 截图 + 新增 4 张（打印/混色/传统色/对比度），共 10 张当前黑底视觉；`scripts/screenshots.mjs` 同步重写为当前拍法。
- 自我介绍留【姓名/学校】占位；发帖时另附 Qoder 对话截图（指令、门禁全绿、发布卡片）作过程凭据。
- 本批仅文档与截图，dist 未变，不重复发布站点。

### 9.18 交付产物集中到「发布包」目录（2026-11-19）

- 应用户要求，根目录新建 `发布包/` 集中存放交付产物：`发布包/配色工坊 v2/` 与 `发布包/配色工坊 v2.zip`。
- `scripts/package-release.mjs` 输出路径同步改为 `发布包/配色工坊 ${version}`；`.gitignore` 增加 `发布包/`。
- 根目录旧 `配色工坊 v1/` 与 `配色工坊 v1.zip` 为历史产物，保留原位不动。
- 本批仅打包路径与文档，dist 未变，不重复发布站点。

---

## 10. 工具页与“独立调色”

用户明确要求：工具不要强制绑定工作台配色。当前状态：

| 工具 | 独立调色 | 说明 |
| --- | --- | --- |
| 色阶与令牌 | ✅ 6 个基色拾色器 | 标题「色阶与基色」；改色不回写工作台 |
| 渐变生成器 | ✅ 2–6 个色标 | 色标轨拖拽、角度旋钮、中心滑杆、6 预设；可「从工作台载入」作为起点 |
| 房间刷色 | ✅ 6 色条 | 第 1 套直接用独立基色 |
| 礼物贺卡 | ✅ 6 色条 | 五种版式 + 四场合 |
| 打印色卡 | ✅ 6 色条 | 四种版式（清单/海报/色票/比例条），也可从工作台/收藏载入 |
| 每日一色 | — | 固定每日方案，本身不跟随工作台 |
| 主题配色 | — | 预设/盲盒，本身不跟随工作台 |
| 一周穿搭 | — | 按场合/天气生成自己的颜色 |
| 案例/课堂 | — | 预设内容，可载入工作台 |

通用组件 `ui/IndependentColors.tsx`：

```tsx
<IndependentColors
  palette={base}
  onChange={setBase}
  onLoad={() => { if (activePalette.value) setBase(activePalette.value); }}
/>
```

注意事项：

- `paletteWithColors` 会清空 `dark/darkA11y/cvd`；不要依赖旧缓存。
- 页面用 `base?.updatedAt` 作为 effect 依赖，保证连续改色能重绘。
- 不要用挂载后的 `useEffect` 去重置独立颜色：会和用户操作竞态（历史上踩过）。

---

## 11. 测试与质量门

### 单元测试（137）

`tests/unit/`：

- `color.test.ts`：转换往返、WCAG/APCA 基准、ΔE2000。
- `palette.test.ts`：生成器不变量、深色成对、色弱安全。
- `pair.test.ts`、`scale.test.ts`、`gradient.test.ts`、`daily.test.ts`、`themes.test.ts`、`checklist.test.ts`、`lifePlans.test.ts`、`cases.test.ts`、`custom.test.ts`、`storage.test.ts`、`import.test.ts`、`library.test.ts`、`share.test.ts`、`quantize.test.ts`。
- `undo.test.ts`：工作台撤销栈（合并连续操作、redo 失效、容量上限）。
- `studioState.test.ts`：工作台无操作守卫（同色提交不锁定、同名重命名不写状态）。
- `mix.test.ts`：混色端点回归、黑白加色中点、减色比加色暗、比例夹取。
- `traditional.test.ts`：传统色数据集完整性、名字/色值/色系搜索、近色查询自身距离 0。
- `contrastFix.test.ts`：已达标原样返回、修正达标且单向推移、修背景对称、中灰背景 AAA 不可达返回 null。
- `printStyles.test.ts`：四版式定义、占比分宽守恒/排序/零负/不整除、色票网格行列与尺寸不超界。
- `audit.test.ts`：无障碍审计报告（检查项统计、整改建议、HTML 转义）。

**注意**：

- `daily.test.ts` 包含挑战题的单测；排明度方向/数量是随机的，测试按 `orderDirection` 校验 OKLab 明度单调，不要写死“从浅到深 6 块”。
- `custom.test.ts` 校验独立改色不改原方案。
- `cases.test.ts` 同时校验小课堂内容结构：8 篇、每篇 ≥5 节、表格行列对齐、示例色值合法。
- `expect(value, message)` 不是 Vitest 合法签名，会触发 TS2769；用 `expect(value).toBe(...)`。

### e2e（109）

`tests/e2e/`：

- `app.spec.ts`：首页/工作台/主题切换/分享/移动端/返回导航。
- `v2.spec.ts`：26 项功能、PNG 尺寸、贺卡五版式、挑战、独立调色、PWA、方案库。
- `workflow.spec.ts`：撤销/重做与快捷键、并排对比、审计报告导出、小课堂筛选与阅读进度、渐变轨拖拽/旋钮/预设/多尺寸导出。
- `audit.spec.ts`：工具页审计修复回归（穿搭重掷、排明度反馈、结算换题型、移动色阶横滑）。
- `studioAudit.spec.ts`：开始与素材审计修复回归（空格/方向键不劫持控件、Esc 丢弃重命名、无改色不锁定、分享卡快下载尺寸、带图回页不重置基色、情绪板满额提示、双列滚轮独立滚动）。
- `toolsNew.spec.ts`：三个新工具回归（混色端点/预设/复制/带回、简写色值归一化、传统色搜索/色系/近色、对比度修复/不可达/交换、新页移动无横滚）。
- `printStyles.spec.ts`：打印四版式回归（默认经典清单、海报/色票/比例条逐点像素采样等于方案色、A5 海报尺寸、下载文件名带样式 id、房间清单隐藏版式且文件名不变、移动 390 无横滚）。
- `a11y.spec.ts`：20 页 axe（WCAG 2.1 AA），排除预览/画布/教学对比示例（`.lesson-samples` 故意含不达标对照，等价信息在可见 meta 文本）与对比度修复器预览区（`.contrast-preview` 是用户当前配对的视觉模拟，比值与判定在上方以文字给出）。

运行：

```bash
pnpm build
pnpm test:e2e
```

**必须重新 build**，因为 preview 读 dist。历史坑：改完 chip 的 disabled 没 build，e2e 一直点不动旧按钮。

### 已知测试限制

- Canvas 生成只在 e2e 验证 PNG 宽高/可下载，不做像素级快照。
- 摄像头用 mock（`page.addInitScript` + canvas 流）；真实摄像头未自动化。
- PWA 安装、系统分享、真实手机离线未自动化；需要在手机上补测。
- EyeDropper 在无头浏览器里行为受限；e2e 用 `defineProperty` mock。

---

## 12. 发布与交付

### 生成发布包

```bash
pnpm release
```

`scripts/package-release.mjs` 会：

1. `pnpm build`；
2. 删除/创建 `发布包/配色工坊 v2/`；
3. 复制 `dist/` → `发布包/配色工坊 v2/site/`；
4. 复制 `docs/`（含截图）；
5. 生成 `README.md`（版本 0.2.0、打包日期、源码提交）；
6. 生成 `serve.mjs`、`一键打开.bat`；
7. 调用 `standalone.mjs` 生成 `配色工坊-免安装.html`。

### 打 zip

```powershell
Compress-Archive -Path '发布包/配色工坊 v2/*' -DestinationPath '发布包/配色工坊 v2.zip' -Force
```

当前 zip：**1,639,407 字节**（含 10 张截图与作品帖）。

### 交付物

- `发布包/配色工坊 v2/site/`：Qoder Sites 发布目录。
- `发布包/配色工坊 v2/配色工坊-免安装.html`：单文件版，双击可用。
- `发布包/配色工坊 v2/一键打开.bat`：本地服务启动器（需要 Node 18+；GBK + CRLF）。
- `发布包/配色工坊 v2/serve.mjs`：零依赖静态服务，默认 4180。
- `发布包/配色工坊 v2.zip`：整包发送用。

### 单文件版认准 `配色工坊-免安装.html`

发布包每次由 `pnpm release` 全量重建，历史上用户自留的旧副本 `配色工坊 轻量验证版.html` 已不在包内。
当前单文件版是 `配色工坊-免安装.html`（347,603 字节），验收只认它。

### Qoder Sites 发布（已授权自动同步）

站点已存在：projectId `01a1e70d-e724-7b3a-adf7-d045a616480d`，公开 URL `colorlife-workshop-67tq5stihve.qoder.zone`。
用户已授权「此后所有更新直接同步到站点，不用问我」：每次完成更新并跑绿质量门后，用 sites 工具链
prepare_site（webDirectory 指向 `dist`）→ publish_site → get_publish_status → show_publish_confirmation 直接发布。

真机仍需补测：

1. 手机 4G 打开、无横向滚动；
2. PWA 安装、离线二次访问；
3. 分享卡二维码、系统分享；
4. 摄像头/吸管（HTTPS 或 localhost）；
5. 贺卡五版式下载。

在 **2026-11-30 18:00** 前提交作品链接。

Qoder Free 计划只支持静态站点；本项目没有后端，正好符合。

---

## 13. 已知问题 / 限制（接手后优先看）

1. **已部署**：公网 URL `colorlife-workshop-67tq5stihve.qoder.zone`；用户要求此后所有更新直接同步发布到该站点，不再询问。`calendar` 里 11-30 18:00 的提交提醒仍需按期提交作品链接。
2. **截图已重拍**：`docs/screenshots/` 10 张为当前黑底视觉（01/02/03/04/05/06 重拍 + 07 打印 / 08 混色 / 09 传统色 / 10 对比度）；`scripts/screenshots.mjs` 已同步为当前拍法（需先 `pnpm preview`）。作品帖草稿见 `docs/作品帖.md`，自我介绍留有【姓名/学校】占位待填。
3. **PWA/分享未真机验证**：安装、系统分享、离线二次访问需要真实手机补测。
4. **单文件版限制**：`file://` 下分享链接是本地路径、SW 不注册、部分浏览器 localStorage 受限；不是部署替代品。
5. **画布字体差异**：贺卡/打印/周历使用系统字体，不同系统字形略有差异。
6. **CMYK 是近似值**：打印页已注明，正式印刷需打样。
7. **摄像头/吸管能力差异**：Safari 不支持 EyeDropper；摄像头需 HTTPS/localhost。
8. **无后端**：不能做账号、云同步、排行榜、多人协作；这是比赛约束下的有意取舍。
9. **版本号**：仍是 0.2.0；如果要做“最终提交版”，可以考虑升 0.3.0 并同步 README/About/package README。
10. **`docs/screenshots` 生成脚本**：`scripts/screenshots.mjs` 已更新为当前 10 张拍法（1440×900 双主题 + 390 移动，分享卡截 dialog[open]，打印截网格色票）；重跑前先 `pnpm preview`。

---

## 14. 本机/Windows 常见坑（很重要）

### PowerShell 替换吞模板字面量

用双引号字符串做 `.Replace()` 时，JS 的 `${...}` / 反引号可能被 PowerShell 当变量/转义，导致：
- `class={chip }`（模板被吞）
- `toast(已取色 )`
- 文件名丢 `${style}`

**规则**：
- 代码改动优先用 `edit` 工具（字面量替换）。
- 必须用 PowerShell 时用**单引号** here-string / `.Replace()`，改完 `Select-String` 复核。
- 改完一定 `pnpm exec tsc --noEmit`。

### UTF-8 BOM

- PowerShell 5.1 `Set-Content -Encoding UTF8` 会写 BOM。
- `manifest.webmanifest` 带 BOM 会让 `manifest.json()` 解析失败（e2e PWA 测试挂）。
- 生成 JSON/文本给 Node/Python 消费时用：
  ```powershell
  [IO.File]::WriteAllText($path, $text, (New-Object System.Text.UTF8Encoding($false)))
  ```
- `.bat` 是例外：**必须 ANSI/GBK(936) + CRLF**，否则 cmd 会把多行 if/goto 拆碎、双击闪退。

### `pnpm release` EPERM

`package-release.mjs` 会 `rmSync('发布包/配色工坊 v2')`。如果：
- `node serve.mjs` 以该目录为 cwd 在跑；
- 或 `cmd /k node serve.mjs` 还开着；

Windows 会锁目录，报 `EPERM`。先停进程，再 release。
Playwright 的 4173 preview 不占用包目录，但会占用 `dist`，通常不影响。

### 改了代码但 e2e 测旧版

e2e 用 `http://localhost:4173` 的 preview，服务的是 `dist/`。
**先 `pnpm build` 再 `pnpm test:e2e`**。如果 4173 已有旧 preview，`reuseExistingServer` 会复用它；必要时手动重启 preview。

### manifest / SW 缓存

- 改公共资源后，`public/sw.js` 的 `cf-cache-v6` 要递增（当前 v6），否则老用户可能拿旧缓存。
- 改 manifest 后确认无 BOM。
- PWA 图标由 `scripts/icons.mjs` 生成，改品牌 mark 后要重跑 `pnpm icons`。

### React/Preact 事件

- 颜色输入在 e2e 中用 `locator.fill('#hex')` 可行；不要只 `dispatchEvent`，可能早于组件挂载。
- 独立调色不要在挂载 effect 里重置，会与用户操作竞态。
- 自动推进定时器要放在 `feedback` 的 effect 里，确保最后一题计分拿到最新 state。

---

## 15. 推荐下一步（按优先级）

### P0（比赛前必须）

1. 在 Qoder 中把 `发布包/配色工坊 v2/site/` 发布到 Qoder Sites，切 Public。
2. 真机验证：PWA 安装、离线二次访问、分享卡二维码、摄像头/吸管、贺卡五版式下载。
3. 截图已重拍（10 张当前视觉），作品帖草稿 `docs/作品帖.md` 待填自我介绍后发帖。
4. 更新 About/README 的最终版本号（如 0.3.0），确认提交文案。

### P1（体验提升）

1. 贺卡再增加 1–2 个版式（如“手写便签”“极简线框”）并补 e2e。
2. 工具页加“下一步推荐”：色阶 → 渐变 → 分享卡，减少来回跳。
3. 我的方案支持“按工具来源筛选”。
4. 挑战增加“本局错题回顾/最佳连击”，但不要做排行榜（无后端）。
5. 移动端把工具页分组做成锚点/折叠，减少长滚动。

### P2（工程/质量）

1. 为贺卡五种版式补 canvas 像素/尺寸测试（当前 e2e 只测最小导出）。
2. 为 PageNav 的所有路由补一条参数化 e2e（当前只测渐变页）。
3. 把 4173 preview 的“旧 dist”风险写进 CI/脚本（build 后再 test）。
4. 评估是否把 `docs/screenshots` 改为 Playwright 自动生成，避免再次过期。
5. 检查 bundle 是否还能再压（当前 96 KB gzip，可接受；不要为了体积破坏单文件版）。

---

## 16. 新增功能时的操作清单

### 新增一个页面/工具

1. `src/features/YourPage.tsx`，用 `<div class="container page">` + `<header class="page-head">`。
2. `App.tsx`：
   - import；
   - `PAGE_META` 加 trail/back；
   - `titles` 加标题；
   - 路由分支；
   - 如果是工具，加入 `TOOL_PATHS` 和 `Tools.tsx` 的 `GROUPS`。
3. 样式优先复用 `.card` / `.field` / `.btn` / `.chip`。
4. 如果绑定配色，接入 `IndependentColors`，不要直接改 `activePalette`。
5. 加 e2e（进入、核心交互、返回）与 axe。
6. `pnpm check && pnpm build && pnpm test:e2e`。

### 新增贺卡版式

1. `CARD_STYLES` 加 `{ id, label, desc }`。
2. `renderCardImage` 加分支，1080×1440；用 `textOn()` 算字色。
3. `CardPage` 的样式 chips 会自动出现。
4. e2e 断言 5/6 个样式按钮、切换后预览可见、下载文件名含版式 id。
5. 重新截图（贺卡）。

### 新增挑战题型

1. `ChallengeMode` 加 id。
2. `buildRound` 加 builder；**务必混入 `roundIndex` 到 seed**。
3. `Play.tsx` 加 `MODE_LABELS` / `MODE_DESCRIPTIONS` / 渲染分支 / 判定分支。
4. 单测：题面结构、答案唯一性、连续两轮不同。
5. e2e：开始、作答、自动下一题、切题型重开。

### 新增存储字段

1. `Settings` / `Persisted` 加可选字段。
2. `DEFAULT_SETTINGS` / `normalize()` 兜底。
3. 不升级 `version` 的前提下保持向后兼容。
4. 加 `storage.test.ts`。
5. 更新本文档第 8 节。

---

## 17. 代码风格与协作约定

- 注释用中文（与现有代码一致）；变量/类型用英文。
- 纯函数放 `core/`，页面组件放 `features/`，通用 UI 放 `ui/`。
- 不要把所有逻辑塞进页面；颜色/画布/算法必须是可单测的纯函数。
- 不要引入新的 UI 框架或 CSS 方案。
- 不要随意改 `package.json` 版本；发版时统一改 README/About/package。
- 提交信息用 `feat:` / `fix:` / `chore:`，正文写清“改了什么 + 怎么验”。
- 改完必须：
  ```bash
  pnpm check
  pnpm build
  pnpm test:e2e
  pnpm release
  ```
- 如果改了 `src/ui/styles.css`，至少目检桌面 1280×900 + 移动 390×844，确认无横向滚动。

---

## 18. 重要文件索引（接手先读）

| 文件 | 为什么读 |
| --- | --- |
| `src/app/App.tsx` | 路由、导航、PageNav、标题、主题色 |
| `src/state.ts` | 所有 signals/actions、持久化、分享分支 |
| `src/core/storage.ts` | `cf.v2` schema、默认值、v1 迁移 |
| `src/core/palette/types.ts` | Palette/ColorEntry/ROLES/场景/风格/情绪 |
| `src/core/palette/generate.ts` | 生成主流程 |
| `src/core/palette/custom.ts` | 独立改色 |
| `src/core/challenge.ts` | 四题型与难度 |
| `src/core/lifeSheets.ts` | 贺卡/打印/周历/房间画布 |
| `src/ui/PageNav.tsx` | 返回/面包屑 |
| `src/ui/IndependentColors.tsx` | 工具独立调色条 |
| `src/ui/styles.css` | 设计令牌、全部布局 |
| `tests/e2e/v2.spec.ts` | 功能契约，改功能先看它 |
| `docs/发布清单.md` | 发布/部署/排障 |

---

## 19. 交接结论

项目已经处于**可发布候选**状态：功能完整、测试全绿、包和单文件版都能跑，视觉/导航/贺卡版式也已完成本轮优化。

真正剩下的不是“再写多少功能”，而是：

1. **部署到 Qoder Sites**（必须用户操作）；
2. **真机验证 PWA/分享/摄像头**；
3. **重拍截图并更新发布包**；
4. 在 2026-11-30 18:00 前提交公开链接。

新接手的 AI 请优先保证这四件事，不要在比赛前做高风险重构。
