---
date: '2026-07-22T16:00:00+08:00'
draft: false
title: 欢迎来到画廊
description: 画廊板块的第一篇帖子，展示如何使用
tags:
  - 示例
---

这是我的第一组图片分享。

## 如何使用画廊

每篇画廊帖子都是一个**文件夹**，文件夹名就是帖子路径。把图片放到文件夹里，并在 `index.md` 中撰写文字。

```
content/gallery/我的帖子/
  index.md       ← 帖子文字内容
  cover.jpg      ← 封面图片（命名为 cover 或 featured 可自动展示）
  photo-01.jpg   ← 更多图片
  photo-02.jpg
```

### 发布新帖子的命令

```bash
hugo new gallery/我的新帖子  --kind gallery
```

然后把图片放进去，把 `draft: true` 改为 `false`，推送即可。

> 📸 把图片拖进来，开始你的第一组分享吧！
