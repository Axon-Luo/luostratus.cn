# luostratus.cn 网站维护交接

> 更新时间：2026-10-09  
> 当前分支：`master`  
> 当前基线提交：`332f274`（fix: remove theme shortcut icon border）  
> 生产地址：https://luostratus.cn/

## 1. 给新 Agent 的直接要求

- 所有网站改动直接在仓库内完成，不要只给建议；若用户没有要求先讨论，默认实现、构建、提交、推送、线上验证。
- 除用户明确要求回滚外，不执行 `git reset --hard`、强制推送或删除历史提交。
- 提交前必须运行 Hugo 构建。Markdown 文档单独修改可做轻量检查，但发布仍需确认构建正常。
- 不要把 `debug.log`、`public/`、`resources/`、`.laws-work/`、`backup/`、`.guizang-ppt-skill/` 或本地 PPT 源目录提交到仓库。
- `CLAUDE.md` 中的工具数量、菜单顺序和部分流程已经过时；本文件是当前交接基准。

## 2. 项目概览

- 技术栈：Hugo + PaperMod 主题。
- 部署：Cloudflare Workers 静态资源托管，配置见 `wrangler.jsonc`；推送到 `master` 后由 Cloudflare Workers Builds 自动构建部署。
- 远端仓库：`git@github.com:Axon-Luo/luostratus.cn.git`。
- 仓库没有后端服务或数据库，网站内容、工具逻辑和法律数据最终都以静态文件发布。
- 本地验证可用的 Hugo：`C:\Users\LuoYun\AppData\Local\Microsoft\WinGet\Packages\Hugo.Hugo.Extended_Microsoft.Winget.Source_8wekyb3d8bbwe\hugo.exe`，版本为 `v0.164.0 extended`。
- 若该 Hugo 被权限策略拦截，可使用备用命令：`npx --yes --cache "$env:TEMP\codex-npm-cache" hugo-bin ...`。备用环境当前可能安装较新的 Hugo，最终以构建结果和线上效果为准。

## 3. 当前目录结构

```text
hugo.yaml                         # 站点、菜单、搜索和 PaperMod 配置
wrangler.jsonc                    # Cloudflare Workers 静态资源配置
content/                          # Hugo 内容
  posts/                          # 文章
  gallery/                        # 画廊图片与页面
  tools/                          # 工具/游戏入口页
  cinema/                         # 放映厅作品元数据
layouts/                          # PaperMod 覆写模板
  index.html                      # 首页，只展示最近两篇文章
  archives.html                   # 归档，只展示 posts
  index.json                      # 站内搜索 JSON 索引
  partials/extend_head.html       # 全站 CSS、主题变量、外观设置样式
  partials/extend_footer.html     # 全站 JS、导航、外观设置、返回顶部
  tools/list.html                 # 小功能总览和分类数组
  tools/single.html               # 工具详情页加载器
  partials/tools/                  # 各个工具/游戏的 HTML/CSS/JS
  cinema/                         # 放映厅列表与详情模板
  gallery/                        # 画廊模板
static/
  games/                          # 静态游戏页面
  virtual/                        # 虚拟信息生成器页面
  decks/                          # HTML PPT 播放器页面
  laws/                           # 法律查询前端与数据
scripts/laws/                     # 法律数据提取与校验脚本
```

## 4. 当前栏目与顺序

`hugo.yaml` 中菜单顺序为：

1. 文章 `/posts/`
2. 画廊 `/gallery/`
3. 小功能 `/tools/`
4. 放映厅 `/cinema/`
5. 搜索 `/search/`
6. 标签 `/tags/`
7. 归档 `/archives/`
8. 关于 `/about/`

核心既有行为：

- 首页只展示最近两篇文章，模板为 `layouts/index.html`。
- 归档只展示 `posts`，不要加入画廊、工具、放映厅等页面。
- 站内搜索使用 Hugo `JSON` 索引，入口模板为 `layouts/index.json`。
- 全站亮暗主题和自定义颜色由 `layouts/partials/extend_head.html` 与 `layouts/partials/extend_footer.html` 共同处理。
- “虚拟信息生成器”标题行保留了快速明暗切换按钮；该按钮使用 `#tools-quick-theme`，当前样式为无边框、透明背景。

## 5. 小功能板块

当前 `content/tools/` 有 62 个文件，`layouts/partials/tools/` 有 46 个工具 partial。实际展示入口以 `layouts/tools/list.html` 中的 `$games`、`$utils`、`$virtual` 数组为准。

新增普通工具或游戏：

1. 在 `content/tools/<slug>.md` 创建页面入口，通常只需 front matter 和标题。
2. 在 `layouts/partials/tools/<slug>.html` 创建完整 HTML/CSS/JS。
3. 在 `layouts/tools/list.html` 的对应数组加入卡片。
4. 构建并打开 `/tools/<slug>/` 验证只有该工具，而不是再次回到工具列表。

注意事项：

- `layouts/tools/single.html` 通过 `.File.BaseFileName` 找同名 partial，文件名必须一致。
- partial 必须放在 `layouts/partials/tools/`，不能放在 `layouts/tools/`。
- 页面风格必须统一到网站现有视觉，不自带第三方页面外壳。
- 法律查询必须保持在小功能列表的最前位置。
- 虚拟信息生成器内容来自 `static/virtual/`，入口仍由 `layouts/tools/list.html` 的 `$virtual` 数组控制。

## 6. 法律查询

前端入口：

- `layouts/tools/law-search.html`
- `static/laws/app.css`
- `static/laws/app.js`
- `static/laws/index.json`
- `static/laws/data/<bbbs>.json`
- `static/laws/search/cat-*.json`

当前数据规模约为 520 个数据文件、53.5 MB，不要无理由重新生成或手工编辑这些 JSON。

提取脚本位于 `scripts/laws/`，推荐顺序：

1. `python scripts/laws/fetch_list.py`
2. `python scripts/laws/fetch_text.py`
3. 如有失败记录，再运行 `python scripts/laws/recover_failed_pdf.py`
4. `python scripts/laws/build_index.py`
5. `python scripts/laws/validate.py`

脚本依赖 `python-docx` 和 `pdfplumber`。临时目录 `.laws-work/` 已被 Git 忽略，不应提交。法律检索功能保持客户端静态检索，不要在未确认需求时引入服务端或外部数据库。

## 7. 放映厅

当前有 3 个作品：

- `long-march-10b`
- `zhuque-three`
- `league-secretary-election`

每个作品由三部分组成：

1. `content/cinema/<slug>/index.md`：标题、日期、简介、播放器目标路径。
2. `content/cinema/<slug>/cover.png`：列表和详情封面。
3. `static/decks/<slug>/`：实际 HTML PPT 及被引用的资源。

新增作品时，先确认 `index.md` 的 front matter 与现有作品一致，再把播放器放到独立 `static/decks/<slug>/` 目录，避免与 `/cinema/` 路由冲突。播放器链接应在新标签页打开，并保留返回放映厅入口。

## 8. 画廊

- 图片放在 `content/gallery/`。
- 图片文件名必须包含 `YYYY-MM-DD` 或 `20xxMMDD` 日期，排序逻辑在 `layouts/gallery/list.html`。
- 画廊使用 CSS 瀑布流与点击放大，不要改成会改变图片原始比例和卡片尺寸的布局。
- 图片体积过大是加载慢的主要原因；优先在发布前压缩，不要只靠前端延迟加载掩盖问题。

## 9. 构建、预览和发布

构建：

```powershell
& 'C:\Users\LuoYun\AppData\Local\Microsoft\WinGet\Packages\Hugo.Hugo.Extended_Microsoft.Winget.Source_8wekyb3d8bbwe\hugo.exe' --gc --minify --destination public --cleanDestinationDir
```

本地预览：

```powershell
& 'C:\Users\LuoYun\AppData\Local\Microsoft\WinGet\Packages\Hugo.Hugo.Extended_Microsoft.Winget.Source_8wekyb3d8bbwe\hugo.exe' server --disableFastRender --port 1324 --bind 127.0.0.1
```

发布前检查：

```powershell
git status --short
git diff --check
```

提交时只添加本次相关文件，例如：

```powershell
git add -- HANDOFF.md layouts/tools/list.html
git commit -m "docs: add agent handoff"
```

## 10. Git 推送、SSH 和线上验证

历史机器上 GitHub SSH 22 端口可能被拒绝。当前可用方案是 GitHub 官方 443 端口：

```powershell
$env:GIT_SSH_COMMAND = 'ssh -o StrictHostKeyChecking=accept-new -p 443'
git push ssh://git@ssh.github.com:443/Axon-Luo/luostratus.cn.git master
```

不要改用 HTTPS 凭据管理器作为默认方案；此前 `git-remote-https.exe` 曾多次崩溃，而 443 SSH 已验证可用。

推送后必须回读远端：

```powershell
$env:GIT_SSH_COMMAND = 'ssh -o StrictHostKeyChecking=accept-new -p 443'
git ls-remote ssh://git@ssh.github.com:443/Axon-Luo/luostratus.cn.git refs/heads/master
```

Cloudflare 通常会在几十秒到数分钟内刷新。线上验证时使用禁用缓存请求，并检查目标页面中的新标记：

```powershell
$r = Invoke-WebRequest -Uri 'https://luostratus.cn/' -UseBasicParsing -Headers @{ 'Cache-Control' = 'no-cache' }
$r.StatusCode
$r.Content -match '要验证的关键词'
```

## 11. 当前已知问题与风险

- `debug.log` 是未跟踪文件，可能是历史崩溃日志；不要提交，也不要因为清理工作区而删除。
- 本地 `.git` 有时可能处于只读或沙箱受限状态；不要把权限问题误判为代码问题。
- 如果 `hugo.exe` 被系统权限拦截，先尝试允许执行，或使用临时目录中的便携 Hugo；不要跳过构建验证。
- 旧交接文件提醒 Cloudflare 构建环境可能比本地 Hugo 更旧。新增模板时优先使用 `if/else`、`first` 等兼容写法，不要贸然使用 `cond`。
- 网站视觉经历过多次改版与回滚。除非用户明确要求，不要顺手重构全站样式。
- 法律数据和放映厅资源体积较大，提交前用 `git diff --stat` 和 `git status` 检查是否误加入大量临时文件。

## 12. 推荐的首轮检查

新 Agent 接手后按以下顺序工作：

1. 阅读本文件。
2. 执行 `git status --short`、`git log -5 --oneline` 和 `git remote -v`。
3. 运行一次 Hugo 构建，确认基线可通过。
4. 若用户提出改动，先定位对应模板和内容文件，再做最小范围修改。
5. 构建通过后提交，使用 443 SSH 推送。
6. 回读远端 SHA，等待 Cloudflare 部署，再用无缓存请求验证线上页面。

只要遵守以上流程，新的 Agent 可以直接接手当前网站的维护工作。

## 13. 版本号（页脚）

- 唯一来源：`data/version.yaml`；`layouts/partials/footer.html` 读取并渲染为 `Version V{year}.{major}.{patch}`，显示在 Last Updated 同一行末尾。
- **计数单位：每一次提交（git commit）都算一次更新。** 版号变更与代码改动放在同一个提交里（不要单独提交一次「只改版号」）。
- 维护规则（2026-10-22 起，用户指令）：**BB（major）只能由用户明确决定**，Agent 不得自行 `major + 1`（即使自评 S/A 级也不行）；**CC（patch）** 为日常更新默认值，正常提交一律只 `patch + 1`（内容发布、文案样式、清理、修复、文档等都算日常更新）；`year` 跨年改为新年份后两位，`major` 与 `patch` 继续累积（不重置）。
- merge 提交若自身无文件变更，不单独计数，随被合并的提交计算。
- 基线：`V26.10.0` = 2026-10-21 之前按「更新日批次」统计的 19 次更新（10 个 S/A 级）；自 2026-10-21 起改为按单次提交计数；2026-10-22 起 major 由用户决定。历史：`5bbb014` → `V26.10.1`，`474e67d` → `V26.10.2`，`a1d8ba9`（发布两篇文章 + 表格适配）→ `V26.11.0`，`37ba465` → `V26.11.1`，`fa9be78` → `V26.11.2`，`d560fee` → `V26.11.3`（未单独上线），`ef3d3b3` → `V26.11.4`，`91cad48`（删除网页版 Minecraft）→ `V26.12.0`，`9b7eb9d`（新增劳动权益放映稿）→ `V26.13.0`，`d22278a`（版本规则改为 major 由用户决定、日常只动 patch，C 级）→ `V26.13.1`（当前，2026-10-22 08:xx 推送）。
- 部署验证：每次提交后必须检查线上页脚版号是否等于最新提交的版号。注意仅修改 `data/` 的提交可能不触发 Cloudflare 构建（`5bbb014` 未上线，随后带模板改动的 `474e67d` 才部署），因此纯数据/文档改动后若 3 分钟内线上版号未变，应在下一次提交中附带模板或内容改动，或在 Cloudflare 控制台手动重跑构建。
- 注意：页脚 `Last Updated` 取构建时间。Cloudflare 构建机为 UTC，加 8 小时后线上显示正确；本地 Hugo 的 `now` 已是本地时间，再加 8 小时会偏快，本地预览时间异常属已知现象，不影响线上。
## 14. F（Product Launch）视觉改版 · 2026-10-24

- 提交：`31cde26`，版本 `V26.13.2`（patch，未改 major）。
- 回滚备份（改版前）：tag `pre-f-redesign-2026-10-24`（已推远端）；`backup/luostratus-full-2026-10-24.bundle`；`backup/luostratus-source-2026-10-24.zip`；`backup/HANDOFF-2026-10-24.md`；回滚步骤见 `backup/README-rollback-2026-10-24.md`。
- 改动文件：新增 `layouts/_partials/home_info.html`（F 风格 hero，右侧展示最新放映稿封面）；`layouts/partials/extend_head.html` 新增 `#f-theme` 样式块与默认深色初始化脚本；`layouts/partials/extend_footer.html` 改为「未选择主题默认深色、显式 auto 才跟随系统」；`data/version.yaml` 补丁版本 +1。
- 主题行为：首次访问默认深色；页头主题按钮、外观设置的「自动/浅色/深色」仍可用（auto 会存 `pref-theme=auto` 并跟随系统）；文字/背景/卡片改色与「全部恢复默认」实测正常。
- 功能回归：134 pages / 0 ERROR；48 个工具页 + 10 个主要页面在 1280 与 500 宽度下无横向溢出、无 JS 报错；搜索、文章 TOC、表格滚动、放映厅链接、画廊、主题切换均正常。
- 说明：所有颜色通过 CSS 变量（`--theme/--entry/--primary/--secondary/--content/--border/--code-bg`）驱动，外观设置的内联变量仍可覆盖；工具页面自身 JS 与 partial 未改动。
### 14.1 外观设置弹层修复 · 2026-10-24
- 现象：F 主题下头部加了 `backdrop-filter`，使 `.header` 形成 stacking context（z-index auto）；`.main` 是 `position:relative` 且在后，导致外观设置弹层被页面内容盖住，看起来“透明/错位”。
- 修复：`.header` 增加 `position:relative; z-index:50`；移动端弹层 `top` 改为 `calc(var(--header-height) + 20px)`，避免贴住头部。
- 验证：1280 与 420 宽度下弹层均不透明、可点击（`elementFromPoint` 返回弹层元素），外观改色与恢复默认正常。
- 提交：`50b84e6`，版本 `V26.13.3`。
### 14.2 首页细节调整 · 2026-10-24
- 需求：仿 macOS 窗口的三个圆点不要灰色，改为红/黄/绿；首页 `LuoStratus` 改为站点蓝色。
- 实现：`#f-theme` 中 `.f-window-bar i:nth-child(1/2/3)` 分别设 `#FF5F57`、`#FEBC2E`、`#28C840`；`home_info.html` 将标题中的 `LuoStratus` 包成 `.f-hero-name`，CSS 用 `var(--f-accent)`（#5B7BFF）。
- 验证：1280 与 420 宽度下名称为 `rgb(91,123,255)`，三圆点为 `rgb(255,95,87)/rgb(254,188,46)/rgb(40,200,64)`，无横向溢出。
- 提交：`285650f`，版本 `V26.13.4`。
### 14.3 版本归档：F 改版计为重大更新 · 2026-10-24
- 用户指定：本次 F（Product Launch）整站改版计为一次重大更新。
- 版号调整：`year 26` 不变，`major 13 → 14`，`patch` 归 0；页脚显示 `V26.14.0`。
- 说明：改版过程提交（31cde26、50b84e6、285650f）保留为 V26.13.x 历史；`7c1fd6e` 为版本归档提交。
## 15. F 设计层扩展到全部板块 · 2026-10-24

- 提交：`5a078e7`，版本 `V26.14.1`（patch）。
- 目标：让文章、画廊、小功能、放映厅、搜索、标签、归档、关于、文章详情、404 都具备首页同款设计语言，而不只是换色。
- 模板改动：新增 `layouts/single.html`（文章/关于统一 F 页头、kicker、meta、TOC 卡片）、`layouts/search.html`（F 搜索 hero）、`layouts/404.html`（渐变 404 + 返回按钮）；`layouts/tools/list.html`（PLAYGROUND hero + 统计胶囊）、`layouts/gallery/list.html`（GALLERY hero + 图片数 + 圆角悬停）、`layouts/cinema/list.html`（SCREENING ROOM hero + 最新放映 featured 横卡）、`layouts/archives.html`（ARCHIVE hero + 年份/月份统计，月份改中文）、`layouts/tools/single.html`（左侧 PLAYGROUND·TOOL 页头）；新增 `content/posts/_index.md`（标题「文章」+ 描述）。
- 样式改动：`extend_head.html` 的 F 主题块新增约 250 行页面设计层：列表页 hero、统计胶囊、FEATURED 首篇文章卡与序号、工具分区/卡片序号、文章页标题/正文 h2 强调条/TOC 卡片、归档卡片化、标签胶囊网格、搜索大输入框与结果卡、404 渐变数字、工具页头。
- 功能回归：本地构建 134 pages / 0 ERROR；48 个工具页 + 11 个主要页面（含 404、文章、放映厅详情、搜索）在 1280/500 宽度无横向溢出、无 JS 报错；浅色/深色截图目检；外观设置自定义文字/背景/卡片色仍生效；搜索输入「劳动」返回 2 条结果。
- 说明：所有颜色仍走 CSS 变量，外观改色不被破坏；未改任何工具 partial 的 JS。
### 15.1 小功能卡片顶部蓝条修复 · 2026-10-24
- 现象：工具卡 hover 时顶部 2px 蓝色渐变条从卡片最边缘开始，在圆角处露出直角，看起来“穿过圆角”。
- 修复：`.tool-card` 增加 `overflow:hidden`；`.tool-card::before` 左右各内缩 16px、top 1px、圆角 999px，渐变改为全蓝到淡蓝。
- 验证：hover 截图确认蓝条完整落在卡片圆角内部；提交 `23a1c87`，版本 `V26.14.2`。
## 16. 首页名字改手写艺术字 · 2026-10-24

- 需求：把首页 `LuoStratus` 改成类似手写的艺术字。
- 选型：Google Fonts 的 **Pacifico**（OFL 开源，粗笔刷手写体），自托管为 `static/fonts/Pacifico-Regular.ttf`（329KB），许可证 `static/fonts/Pacifico-OFL.txt`；不依赖访客本机字体。
- 实现：`extend_head.html` 的 F 主题层加 `@font-face`（family `"F Hand"`，`font-display:swap`）；`.f-hero .f-hero-name` 使用 `"F Hand","Segoe Script","Bradley Hand","Snell Roundhand","Apple Chancery",cursive`，字号 `.94em`、行高 1.12，保持站点蓝色 `var(--f-accent)`。
- 验证：本地 1280/420 宽度下 `document.fonts.check` 为 true、无横向溢出；线上部署后 `Version V26.14.3`。字体只在首页使用，不影响其它页面加载。
- 提交：`cb8a111`，版本 `V26.14.3`。
### 16.1 手写名字放大 · 2026-10-24
- 需求：保留 Pacifico 效果，把 `LuoStratus` 再放大一些。
- 调整：`.f-hero .f-hero-name` 字号 `.94em → 1.2em`，行高 1.12 → 1.06；桌面约 66.6px → 85px，420 宽度约 36px → 46px。
- 验证：1280/420 无横向溢出，两行标题与按钮布局正常；提交 `6654a2d`，版本 `V26.14.4`。
### 16.2 取消窗口卡片倾斜 · 2026-10-24
- 需求：首页右侧仿 macOS 窗口卡片的倾斜效果取消，改为正的。
- 调整：`.f-window` 的 `transform:rotate(-1.1deg)` 改为 `none`；hover 从 `rotate(0deg) translateY(-2px)` 改为 `translateY(-3px)`，保留轻微上浮反馈。
- 验证：本地 1280 宽度计算样式 `transform:none`，截图确认窗口水平；提交 `6d762e9`，版本 `V26.14.5`。
### 16.3 窗口卡片比例与窗口结构优化 · 2026-10-24
- 需求：窗口卡片内部内容比例不够好，希望更像参考图那种桌面应用窗口。
- 调整：窗口拆成标题栏 + 内容区；标题栏左侧红黄绿圆点、右侧标题 `LuoStratus · 放映厅`（等宽小字）；内容区四周 12px 内边距，封面图放进 16:9 圆角内框，不再贴边；窗口整体改为纯 `var(--entry)` 底 + 边框，比例约 1.46:1。
- 验证：1280/420 截图确认标题栏、内框、圆点比例正常，无横向溢出；提交 `6459425`，版本 `V26.14.6`。
### 16.4 窗口圆角缩小、去掉标题文字 · 2026-10-24
- 需求：窗口圆角偏大，按参考图缩小；去掉窗口顶部的 `LuoStratus · 放映厅` 文字。
- 调整：`.f-window` 圆角 22px → 12px；内层封面圆角 12px → 8px；内容区内边距 12px → 10px；标题栏内边距 12px → 10px；删除 `.f-window-title` 标记与样式，只保留红黄绿圆点。
- 验证：1280/420 计算样式 `border-radius:12px`、内层 8px、无标题文字、无横向溢出；提交 `29bec77`，版本 `V26.14.7`。
## 17. 侧边快捷导航折叠功能 · 2026-10-25

- 需求：滚动后出现的侧边快捷导航（#side-nav）增加“侧边回收”能力，可折叠/展开。
- 实现：`extend_footer.html` 的 `#side-nav` 内新增 `#side-nav-toggle` 按钮（chevron SVG），新增 `initSideNavCollapse()`：点击切换 `.collapsed`，localStorage 键 `side-nav-collapsed` 持久化，同步 `aria-expanded`/`aria-label`/`title`；`extend_head.html` 增加按钮样式与折叠态（链接 `display:none`、箭头旋转 180°，移动端按钮 32px）。
- 验证：CDP 滚动后侧栏 `visible`、8 个链接；折叠后 `collapsed=true`、`localStorage=1`、链接隐藏；刷新后保持折叠；再点恢复。构建 134 pages / 0 ERROR；提交 `c978334`，版本 `V26.14.8`。
### 17.1 侧边导航折叠/展开过渡 · 2026-10-26
- 需求：折叠/展开太生硬，加过渡动画。
- 实现：`#side-nav a` 增加 `height/opacity/padding/border-width/transform` 过渡（约 280ms），折叠时高度 36→0、透明度 1→0、右移 12px，`#side-nav` 的 `gap` 同步过渡；不再 `display:none`。`apply()` 同步给链接加/去 `tabindex=-1`，保证收起时不可聚焦。
- 验证：CDP 采样折叠过程高度 36→27.1→5.9→0、透明度 1→0.64→0.07→0（约 330ms），展开反向；提交 `04dca4b`，版本 `V26.14.9`。
## 18. 渐变网点背景风格 · 2026-10-30

- 需求：给背景增加「渐变网点」新风格。
- 实现：`extend_head.html` 用 `html[data-bg-style="dots"] body` 的多层 `background-image`：150° 渐变遮罩 + 双层双色网点（accent 30% / primary 14%，24px/12px）；浅色主题单独降低透明度并显式设置 size/position/attachment。`__applyAppearance` 写 `root.dataset.bgStyle`（style 缺失默认 dots，plain 关闭），`__readAppearancePrefs` 读取 style。
- 面板：`extend_footer.html` 背景面板新增「背景风格：纯色 / 渐变网点」，`prefs.style` 持久化；预览卡 `.tcp-preview.is-dots` 同步显示网点；重置回默认 dots。
- 验证：CDP 默认 dots、切 plain 后背景图案消失且持久化、刷新保持、再切回 dots 正常；深/浅色截图确认网点从左下向右上渐隐；构建 134 pages / 0 ERROR；提交 `8dc054c`，版本 `V26.14.10`。
### 18.1 回滚渐变网点 · 2026-10-30
- 用户确认只回滚渐变网点背景，保留其它设计。
- 操作：`git revert --no-commit 8dc054c` 撤销 V26.14.10 的 `extend_head.html` / `extend_footer.html` 改动；版本继续递增到 `V26.14.11`（不重复使用旧版号）。
- 验证：本地构建 134 pages / 0 ERROR，产物中无 `data-bg-style` 与 `tcp-style`，页脚 `Version V26.14.11`；提交 `61f7701` 已推送。
## 19. 配色工坊 v2 发布 · 2026-11-19

- 来源：`E:\配色工坊\发布包\配色工坊 v2\site`（v2.0.0，2026-11-19，源码提交 a1f681，Vite + Preact + signals 预构建静态 SPA）。
- 备份：旧 partial 与 content 备份在 `.tmp-shot/color-palette-backup-20261119/`（忽略目录）。
- 集成方式：9 个构建文件复制到 `static/tools/color-palette/`；删除旧 `layouts/partials/tools/color-palette.html`；`content/tools/color-palette.md` 用 `build.render: never` 让静态应用接管 `/tools/color-palette/`；`layouts/tools/list.html` 描述更新；README 同步 v2 说明与 133 pages 基准。
- 本地验证：133 pages / 0 ERROR；应用首页与 `#/studio` 路由正常；桌面 1280 / 移动 420 截图正常；`/index.json` 仍包含配色工坊；工具列表卡片指向 `/tools/color-palette/`。
- 线上验证：`https://luostratus.cn/tools/color-palette/` 标题「配色工坊 · 生活调色盘」，静态资源加载正常；页脚 `Version V26.14.16`。
- 提交：`6f5ab8c`（先删除旧 partial）、`6b0aa85`（补齐静态应用、content、version、README、列表描述）；最终可用提交 `6b0aa85`。
- 回滚：`git revert 6b0aa85 6f5ab8c` 或 checkout `48fac61`（V26.14.15 旧版）。
### 19.1 配色工坊页脚统一 · 2026-11-19

- 需求：把配色工坊底部信息改成站点统一页脚样式。
- 实现：`static/tools/color-palette/index.html` 注入页脚样式与脚本；`MutationObserver` 等待 Preact 渲染后，把原「配色工坊 · 生活调色盘 / 2026 Qoder 高校创造力大赛 / 关于」替换为两行站点页脚：版权 + Hugo & PaperMod，Last Updated（UTC+8，取文件 lastModified）+ Version；颜色/间距/分割线对齐站点 F 主题。
- 缓存：`sw.js` 的 CACHE 从 `cf-cache-v6` 升到 `cf-cache-v7`，避免旧页脚缓存。
- 验证：本地与线上页脚文本正确、无 Qoder 字样；桌面/移动截图；站点页脚 V26.14.17；构建 133 pages / 0 ERROR；提交 `ba45489`。
### 19.2 重要更新：版本提升到 V26.15.0 · 2026-11-19

- 用户明确表示「这次算作一次重要更新」，按规则提升 major：`year:26 / major:15 / patch:0` → `V26.15.0`。
- 同步位置：`data/version.yaml`、README 版本段落、配色工坊页脚 `SITE_VERSION`。
- 验证：本地 133 pages / 0 ERROR；线上站点页脚 `Version V26.15.0`；配色工坊页脚 `Version V26.15.0`；提交 `c88ac0a`。
### 19.3 非虚拟工具增加返回小工具按钮 · 2026-11-19

- 范围：除 13 个虚拟生成器外的全部工具页（25 游戏 + 22 常规实用工具 + 法律查阅 + 配色工坊）。
- 实现：新增 `layouts/partials/tools/back-link.html`，在 `layouts/tools/single.html` 页头与 `layouts/tools/law-search.html` 顶部引入；`extend_head.html` 增加 `.tool-back` 胶囊样式（← 返回小工具，悬停变蓝）。
- 配色工坊：`static/tools/color-palette/index.html` 左下角固定 `.cf-tool-back` 按钮，指向 `/tools/`。
- 虚拟生成器：仍使用 `layout: redirect` 的入口，不出现返回按钮；`/virtual/` 页面保持原样。
- 验证：构建 133 pages / 0 ERROR；本地/线上 `/tools/snake/`、`/tools/law-search/`、`/tools/color-palette/` 均有按钮且跳转 `/tools/`；`/tools/oc-timeline-generator/` 无按钮；桌面/移动截图正常；版本 `V26.15.1`，提交 `524a147`。
### 19.4 返回按钮去箭头、配色工坊移到左上 · 2026-11-19

- 用户反馈：返回按钮内的「←」去掉；配色工坊内的返回按钮从左下角改到左上角。
- 实现：`layouts/partials/tools/back-link.html` 删除箭头 span 与 `.tool-back-arrow`；配色工坊 `index.html` 改为顶部 `.cf-back-strip` 条，按钮位于左上角、不再 fixed 左下。
- 版本：V26.15.2（功能调整，270c610）、V26.15.3（README 按钮说明同步，ec8ca2d）。
- 验证：构建 133 pages / 0 ERROR；线上 `/tools/snake/` 按钮文本无箭头；`/tools/color-palette/` 顶部条在 header 上方，按钮 text「返回小工具」；桌面/移动截图正常。
### 19.5 配色工坊返回按钮移到 logo 正左边 · 2026-11-19

- 用户要求：返回按钮放在配色工坊 logo 的正左边。
- 实现：配色工坊 `index.html` 移除顶部独立返回条，改为 JS 在 `.topbar-inner` 里把 `.cf-tool-back` 插入 `.brand` 之前；CSS 去掉 fixed/独立条，桌面与移动端随 header 同一行；移动端 `topbar-inner` gap 收窄，420px 无横向溢出。
- 验证：本地/线上按钮 x 坐标均小于 logo；桌面/移动截图正常；构建 133 pages / 0 ERROR；版本 V26.15.4，提交 `206cb0e`。
### 19.6 配色工坊亮暗与站点联动 · 2026-11-19

- 需求：配色工坊的亮暗模式与网站统一联动。
- 实现：`static/tools/color-palette/index.html` 增加主题同步脚本：读取站点 `pref-theme`（dark/light/auto），加载前写 `cf.v2.settings.theme` 并设置 `html[data-theme]`，避免 hydration 前闪错；应用内主题按钮变化时写回 `pref-theme`；监听 `storage` 与系统配色变化。
- 站点：`layouts/partials/extend_footer.html` 增加 `pref-theme` 的 `storage` 监听，其他标签页/配色工坊改主题时即时更新站点。
- 验证：light/dark 加载一致；auto 随系统切换；应用内切换写回站点；跨标签页双向联动；构建 133 pages / 0 ERROR；线上 V26.15.6，提交 `9fb8168`。
### 19.7 配色工坊返回按钮跟随亮色主题 · 2026-11-19

- 问题：亮色模式下配色工坊左上「返回小工具」仍是深色胶囊，和页面不协调。
- 修复：`static/tools/color-palette/index.html` 增加 `html[data-theme="light"] .cf-tool-back` 覆盖，使用 `--card`/`--line` 变量变白底、浅边框、深灰文字、轻阴影；hover 用 `--accent`；深色样式保持原样。
- 验证：亮色计算值白底/浅边、深色保持原样；构建 133 pages / 0 ERROR；线上 V26.15.7，提交 `b2f5ff8`。