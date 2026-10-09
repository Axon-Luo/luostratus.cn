# luostratus.cn 网站维护交接

> 更新时间：2026-10-09  
> 当前分支：`master`  
> 当前基线提交：`332f274`（fix: remove theme shortcut icon border）  
> 生产地址：https://luostratus.cn/

## 1. 给新 Agent 的直接要求

- 所有网站改动直接在仓库内完成，不要只给建议；若用户没有要求先讨论，默认实现、构建、提交、推送、线上验证。
- 用户称呼为“老大”；与用户对话时，每句话结尾单独加一个“喵”。正式生成的文档、代码、提交信息不附加“喵”。
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
