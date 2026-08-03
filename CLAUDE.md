# luostratus.cn — AI Agent 项目交接

## GitHub 仓库

```
git@github.com:Axon-Luo/luostratus.cn.git
https://github.com/Axon-Luo/luostratus.cn
```

直接 clone 即可获取完整项目代码。所有修改提交到 `master` 分支，push 后 Cloudflare Workers Builds 自动构建部署。

---

## 技术栈速览

- **Hugo** 静态站点生成器（本地 v0.164，**Cloudflare 构建环境 v0.147.7**）
- **PaperMod** 主题（通过 `layouts/partials/extend_head.html` 和 `extend_footer.html` 注入自定义代码）
- **Cloudflare Workers** 静态托管，Hugo 构建输出 `public`（见 `wrangler.jsonc`），git push 即部署
- 域名 `luostratus.cn`，腾讯云注册，Cloudflare DNS 管理，**无需备案**

---

## 项目结构要点

```
├── hugo.yaml              # 站点配置、菜单、分页
├── wrangler.jsonc         # Workers 静态资源配置（assets 目录为 public）
├── content/
│   ├── posts/             # 5 篇博客（Markdown）
│   ├── gallery/           # 画廊（Branch Bundle，图片在目录内）
│   └── tools/             # 小功能板块（15 个游戏/工具）
├── layouts/
│   ├── index.html         # 首页模板（展示最近两篇文章）
│   ├── archives.html      # 归档模板（只展示 posts）
│   ├── gallery/list.html  # 画廊核心：CSS 瀑布流 + 文件名日期排序
│   ├── tools/             # 小功能板块模板
│   │   ├── list.html      # 工具卡片网格主页
│   │   └── single.html    # 加载 partials/tools/<name>.html
│   └── partials/
│       ├── extend_head.html   # 全站 CSS 动效注入
│       ├── extend_footer.html # 全站 JS 注入（导航、TOC、返回顶部）
│       ├── footer.html        # 覆盖主题 footer（含 Last Updated）
│       └── tools/             # 15 个工具的游戏/工具代码
└── assets/                # bilibili.svg 社交图标
```

---

## ⚠️ 三大致命陷阱

### 1. Partial 路径错误（上次崩溃根因）
Hugo 的 `partial "tools/snake.html"` **只查找 `layouts/partials/tools/snake.html`**，不会查找 `layouts/tools/snake.html`。新增工具时务必把代码放在 `layouts/partials/tools/` 下。

### 2. Cloudflare Hugo 版本不兼容
Cloudflare Pages 使用 **Hugo v0.147.7**（比本地 v0.164 更旧）。**`cond` 模板函数会导致构建崩溃**，请使用 `if/else` 或 `first` 过滤器替代。

### 3. 必须本地构建验证
每次推送前，在本地执行构建命令确认 0 错误：
```bash
# Hugo 可执行文件路径（Windows）:
C:\Users\LuoYun\AppData\Local\Microsoft\WinGet\Packages\Hugo.Hugo.Extended_Microsoft.Winget.Source_8wekyb3d8bbwe\hugo.exe

# 构建命令:
hugo --source C:\Users\LuoYun\luostratus.cn --config C:\Users\LuoYun\luostratus.cn\hugo.yaml
```
期望输出：`Pages: 62 | ... Total in ~230 ms`，无 `ERROR`。

---

## 当前菜单结构

```
文章(weight:1) → 画廊(2) → 归档(3) → 标签(4) → 小功能(5) → 搜索(6) → 关于(7)
```

归档已恢复，只展示 posts 文章。首页已改为展示最近两篇文章（`layouts/index.html` 使用 `where` + `first`，避免 `cond`）。

---

## 如何修改

### 添加新文章
```bash
hugo new posts/文章名.md
# 编辑 content/posts/文章名.md，draft: true → false
git add -A && git commit -m "新文章" && git push
```

### 添加新工具到小功能
1. 创建 `content/tools/工具名.md`（只写 frontmatter 和 title）
2. 创建 `layouts/partials/tools/工具名.html`（完整 HTML + CSS + JS）
3. 在 `layouts/tools/list.html` 的 games 或 utils 数组中添加条目
4. 构建验证 → commit → push

### 修改菜单
编辑 `hugo.yaml` 的 `menu.main` 部分，注意 weight 顺序。

### 修改样式
CSS 在 `layouts/partials/extend_head.html`，JS 在 `layouts/partials/extend_footer.html`。

### 回滚
```bash
git reset --hard <commit-hash>
git push --force
```
当前稳定版本 commit: `ee36b57`（最后的 commit 只是加了 CLAUDE.md）
预工具版本 tag: `v1.0-before-tools`

---

## 画廊工作方式

- 所有图片放 `content/gallery/` 目录
- `_index.md` 是 Branch Bundle 入口
- 图片名必须含日期才能被解析：`YYYY-MM-DD` 或 `20xxMMDD` 格式
- 排序逻辑在 `layouts/gallery/list.html`，使用 Hugo `.Scratch` 管理状态
- CSS `column-count: 2` 瀑布流，点击放大用 classList.toggle

---

## 小功能板块包含

**10 款游戏**: 贪吃蛇、俄罗斯方块、打砖块、2048、扫雷、记忆翻牌、点击速度测试、颜色识别测试、数独、24点

**5 组工具**: 单位换算（7类）、进制/数字转换、BMI 计算器、摩斯电码（含播放）、随机数生成
