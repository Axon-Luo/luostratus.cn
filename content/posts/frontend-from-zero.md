---
date: '2026-07-25T16:55:41+08:00'
draft: false
title: 从零开始学前端：HTML、CSS、JavaScript 完整教程
tags:
  - 前端
  - HTML
  - CSS
  - JavaScript
  - 教程
description: 面向零基础读者的前端开发完整教程，从 HTML 标签到 CSS 布局再到 JavaScript 异步编程，配合大量可运行的代码实例。
---

## 前言

前端开发是构建网页和 Web 应用的技术集合。它的三大支柱是：

| 技术 | 角色 | 类比 |
|------|------|------|
| **HTML** | 内容与结构 | 建筑的骨架 |
| **CSS** | 样式与布局 | 建筑的装修 |
| **JavaScript** | 交互与逻辑 | 建筑的水电系统 |

读完本文，你将能够从零搭建一个完整的个人网页。每个知识点都配有可直接运行的代码示例。

---

## 第一部分：HTML

HTML（HyperText Markup Language）不是编程语言，而是**标记语言**——用标签来描述内容。

### 1.1 一个最小的 HTML 页面

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>我的第一个网页</title>
</head>
<body>
  <h1>你好，世界！</h1>
  <p>这是我的第一个 HTML 页面。</p>
</body>
</html>
```

逐行解释：

- `<!DOCTYPE html>` — 声明这是 HTML5 文档
- `<html lang="zh-CN">` — 页面根元素，`lang` 告诉浏览器页面语言
- `<head>` — 元数据区：字符集、视口、标题，不显示在页面上
- `<body>` — 可见内容区，你看到的一切都在这里
- `<h1>` — 一级标题（Heading 1），有 h1~h6 六个级别
- `<p>` — 段落（Paragraph）

### 1.2 常用文本标签

```html
<!-- 标题层级 -->
<h1>一级标题</h1>
<h2>二级标题</h2>
<h3>三级标题</h3>

<!-- 段落与换行 -->
<p>这是一个段落。HTML 会忽略代码中的换行，
   连续空格也会被合并为一个。</p>
<p>另一个段落。<br>这是 br 标签产生的换行。</p>

<!-- 文本强调 -->
<p>这是 <strong>加粗强调</strong>，这是 <em>斜体强调</em>。</p>
<p>这是 <mark>高亮标记</mark>，这是 <del>删除线</del>。</p>
<p>行内代码：<code>console.log('hello')</code></p>

<!-- 引用 -->
<blockquote>
  <p>任何足够先进的技术，都与魔法无异。——阿瑟·克拉克</p>
</blockquote>
```

### 1.3 链接与图片

```html
<!-- 超链接 -->
<a href="https://example.com">访问 Example</a>
<a href="https://example.com" target="_blank">新标签页打开</a>
<a href="#section-2">跳转到页面内的 section-2</a>
<a href="mailto:hello@example.com">发送邮件</a>

<!-- 图片 -->
<img src="photo.jpg" alt="一张照片的描述" width="400" height="300">
<img src="photo.jpg" alt="" loading="lazy">  <!-- 懒加载 -->
```

`alt` 属性很重要：当图片加载失败时显示替代文字，也是屏幕阅读器读给视障用户的内容。`loading="lazy"` 让图片在即将进入视口时才加载，提升页面性能。

### 1.4 列表

```html
<!-- 无序列表 -->
<ul>
  <li>HTML</li>
  <li>CSS</li>
  <li>JavaScript</li>
</ul>

<!-- 有序列表 -->
<ol>
  <li>打开编辑器</li>
  <li>编写代码</li>
  <li>保存文件</li>
  <li>在浏览器中打开</li>
</ol>

<!-- 描述列表 -->
<dl>
  <dt>HTML</dt>
  <dd>定义网页结构的标记语言</dd>
  <dt>CSS</dt>
  <dd>控制网页外观的样式语言</dd>
</dl>
```

### 1.5 表格

```html
<table>
  <thead>
    <tr>
      <th>姓名</th>
      <th>年龄</th>
      <th>城市</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>张三</td>
      <td>25</td>
      <td>北京</td>
    </tr>
    <tr>
      <td>李四</td>
      <td>30</td>
      <td>上海</td>
    </tr>
  </tbody>
</table>
```

### 1.6 表单

```html
<form action="/submit" method="POST">
  <!-- 文本输入 -->
  <label for="name">姓名：</label>
  <input type="text" id="name" name="name" placeholder="请输入姓名" required>

  <!-- 邮箱 -->
  <label for="email">邮箱：</label>
  <input type="email" id="email" name="email" required>

  <!-- 密码 -->
  <label for="password">密码：</label>
  <input type="password" id="password" name="password" minlength="8">

  <!-- 单选 -->
  <fieldset>
    <legend>性别：</legend>
    <label><input type="radio" name="gender" value="male"> 男</label>
    <label><input type="radio" name="gender" value="female"> 女</label>
  </fieldset>

  <!-- 多选 -->
  <label><input type="checkbox" name="agree" required> 我同意服务条款</label>

  <!-- 下拉选择 -->
  <label for="city">城市：</label>
  <select id="city" name="city">
    <option value="">请选择</option>
    <option value="beijing">北京</option>
    <option value="shanghai">上海</option>
  </select>

  <!-- 多行文本 -->
  <label for="message">留言：</label>
  <textarea id="message" name="message" rows="4"></textarea>

  <!-- 提交按钮 -->
  <button type="submit">提交</button>
  <button type="reset">重置</button>
</form>
```

### 1.7 语义化标签

HTML5 引入了描述页面结构的语义标签。对比 `<div>` 和语义标签：

```html
<!-- 不推荐：全是 div -->
<div class="header">...</div>
<div class="nav">...</div>
<div class="main">...</div>
<div class="footer">...</div>

<!-- 推荐：使用语义标签 -->
<header>
  <nav>
    <a href="/">首页</a>
    <a href="/about">关于</a>
  </nav>
</header>
<main>
  <article>
    <h2>文章标题</h2>
    <section>
      <h3>第一节</h3>
      <p>内容...</p>
    </section>
  </article>
  <aside>侧边栏</aside>
</main>
<footer>页脚信息</footer>
```

语义标签的好处：**SEO 友好**（搜索引擎理解页面结构）、**无障碍友好**（屏幕阅读器能正确导航）、**代码可读性高**。

---

## 第二部分：CSS

CSS（Cascading Style Sheets）控制 HTML 元素的视觉呈现。

### 2.1 三种引入方式

```html
<!-- 方式一：内联样式（不推荐，难以维护） -->
<p style="color: red; font-size: 16px;">红色文字</p>

<!-- 方式二：内部样式表 -->
<style>
  p { color: blue; }
</style>

<!-- 方式三：外部样式表（推荐） -->
<link rel="stylesheet" href="styles.css">
```

### 2.2 选择器

```css
/* 元素选择器 —— 选中所有 <p> */
p { color: #333; }

/* 类选择器 —— 选中 class="highlight" 的元素 */
.highlight { background: yellow; }

/* ID 选择器 —— 选中 id="hero" 的元素 */
#hero { font-size: 2rem; }

/* 后代选择器 —— article 内部的所有 p */
article p { line-height: 1.8; }

/* 直接子代 —— article 的直接子 p */
article > p { margin-bottom: 16px; }

/* 属性选择器 —— type="email" 的 input */
input[type="email"] { border-color: blue; }

/* 伪类 —— 鼠标悬停 */
a:hover { text-decoration: underline; }

/* 伪类 —— 第一个子元素 */
li:first-child { font-weight: bold; }

/* 伪类 —— 每三个中的第 2 个 */
li:nth-child(3n+2) { background: #f0f0f0; }

/* 伪元素 —— 在每个 p 前插入引号 */
blockquote::before { content: "❝"; font-size: 2em; }

/* 同时选择多个 */
h1, h2, h3 { font-family: sans-serif; }
```

### 2.3 层叠与优先级

**层叠（Cascading）** 是 CSS 的核心机制——当多个规则冲突时，浏览器按以下优先级决定：

```text
!important > 内联 style > #id > .class > 元素 > 通配符 *
```

```css
p { color: green; }           /* 优先级：1 */
.text { color: blue; }        /* 优先级：10 */
#main p { color: red; }       /* 优先级：101 */
p { color: orange !important; } /* 优先级：∞（尽量避免） */
```

### 2.4 盒模型

每个元素都是一个矩形盒子，由四层组成：

```text
┌─────────────────────────────┐
│          margin             │  ← 外边距（与其他元素的距离）
│   ┌───────────────────┐     │
│   │      border       │     │  ← 边框
│   │   ┌─────────┐     │     │
│   │   │ padding │     │     │  ← 内边距（内容与边框的距离）
│   │   │ content │     │     │  ← 内容区域
│   │   └─────────┘     │     │
│   └───────────────────┘     │
└─────────────────────────────┘
```

```css
.box {
  width: 200px;           /* 内容宽度 */
  height: 100px;          /* 内容高度 */
  padding: 16px;           /* 内边距 */
  border: 2px solid #333;  /* 边框 */
  margin: 20px;            /* 外边距 */

  /* 让 padding 和 border 包含在 width/height 内 */
  box-sizing: border-box;
}
```

**关键技巧**：始终设置 `box-sizing: border-box`，这样 `width: 200px` 指的是盒子的总宽度，而不是内容宽度。大多数项目会在全局样式中写：

```css
*, *::before, *::after {
  box-sizing: border-box;
}
```

### 2.5 颜色与单位

```css
/* 颜色的四种写法 */
color: red;                        /* 颜色名 */
color: #ff0000;                    /* 十六进制 */
color: rgb(255, 0, 0);             /* RGB */
color: hsl(0, 100%, 50%);          /* HSL（色相、饱和度、亮度） */
color: oklch(62.8% 0.25 29);       /* OKLCH（现代推荐） */

/* 绝对单位 */
font-size: 16px;                   /* 像素 */
font-size: 12pt;                   /* 磅（打印用） */

/* 相对单位 */
font-size: 1.5rem;                 /* 相对于根元素字体大小 */
font-size: 1.2em;                  /* 相对于父元素字体大小 */
width: 50%;                        /* 相对于父元素宽度 */
width: 80vw;                       /* 相对于视口宽度（80% of viewport width） */
height: 100vh;                     /* 相对于视口高度 */
```

推荐正文使用 `rem` 定义字体大小——它在任何嵌套层级都相对于根元素 `<html>`，不会像 `em` 那样层层累积。

### 2.6 Flexbox 布局

Flexbox 解决**一维排列**问题——让元素在一条线上灵活分布。

```css
.container {
  display: flex;
  justify-content: space-between;  /* 主轴对齐 */
  align-items: center;             /* 交叉轴对齐 */
  gap: 16px;                       /* 间距 */
  flex-wrap: wrap;                 /* 换行 */
}

.item {
  flex: 1;            /* 等分剩余空间 */
}

.item-wide {
  flex: 2;            /* 占两倍空间 */
}

.item-fixed {
  flex: 0 0 200px;    /* 固定宽度，不伸缩 */
  /*    ↑  ↑  ↑
  │    │  └── flex-basis: 基础尺寸
  │    └───── flex-shrink: 不收缩
  └────────── flex-grow: 不扩展 */
}
```

**实例：居中对齐（最实用）**

```css
/* 水平垂直居中 */
.center-both {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
```

**实例：导航栏**

```css
nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
}
nav .logo { font-weight: bold; font-size: 1.2rem; }
nav .links { display: flex; gap: 20px; }
```

```html
<nav>
  <span class="logo">MySite</span>
  <div class="links">
    <a href="#">首页</a>
    <a href="#">文章</a>
    <a href="#">关于</a>
  </div>
</nav>
```

### 2.7 Grid 布局

Grid 解决**二维排列**问题——同时控制行和列。

```css
.grid {
  display: grid;

  /* 三列：中间自适应，两边固定 */
  grid-template-columns: 200px 1fr 200px;

  /* 三行：第一行固定，后面的自适应 */
  grid-template-rows: 60px 1fr;

  /* 快捷写法 */
  grid-template-columns: repeat(3, 1fr);  /* 三等分 */

  /* 自适应列：最少 250px，空间允许则扩展 */
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));

  gap: 16px;
}

/* 网格项可以跨越多列/多行 */
.item-header {
  grid-column: 1 / -1;  /* 从第一列到最后列，相当于占满整行 */
}
.item-sidebar {
  grid-row: 2 / 4;      /* 跨越第 2 到第 4 行 */
}
```

**实例：经典页面布局**

```css
.page {
  display: grid;
  grid-template-areas:
    "header  header"
    "sidebar main"
    "footer  footer";
  grid-template-columns: 250px 1fr;
  grid-template-rows: 60px 1fr 50px;
  min-height: 100vh;
}
.header  { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main    { grid-area: main; }
.footer  { grid-area: footer; }
```

### 2.8 响应式设计

```css
/* 移动优先：基础样式为手机设计 */
.card {
  padding: 16px;
  font-size: 1rem;
}

/* 平板及以上（≥768px） */
@media (min-width: 768px) {
  .card {
    padding: 24px;
    font-size: 1.1rem;
  }
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 桌面（≥1024px） */
@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .container {
    max-width: 1100px;
    margin: 0 auto;
  }
}
```

### 2.9 过渡与动画

```css
/* transition：属性变化时平滑过渡 */
.button {
  background: #3880ff;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  cursor: pointer;

  /* 过渡：all 属性在 0.2s 内缓动变化 */
  transition: all 0.2s ease;
}
.button:hover {
  background: #2a67d4;
  transform: translateY(-2px);    /* 向上移动 2px */
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.button:active {
  transform: scale(0.97);         /* 点击时略微缩小 */
}

/* @keyframes：定义关键帧动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-in {
  animation: fadeInUp 0.5s ease;
}

/* 无限旋转（加载图标） */
@keyframes spin {
  to { transform: rotate(360deg); }
}
.spinner {
  width: 24px; height: 24px;
  border: 3px solid #e0e0e0;
  border-top-color: #3880ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
```

### 2.10 CSS 变量（自定义属性）

```css
:root {
  --primary: #3880ff;
  --text: #333;
  --bg: #fff;
  --radius: 8px;
  --shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.card {
  background: var(--bg);
  color: var(--text);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
.card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

/* 暗色主题：只需覆盖变量 */
[data-theme="dark"] {
  --text: #eee;
  --bg: #1a1a2e;
}
```

这是实现**暗色模式**最优雅的方式——不需要重写每个选择器，只需切换根变量即可。

---

## 第三部分：JavaScript

JavaScript 让网页"活起来"。

### 3.1 变量与数据类型

```js
// 变量声明
let name = '小明';          // 可变变量（推荐）
const PI = 3.14159;        // 常量，不可重新赋值（优先使用）
var old = '不推荐';         // 旧式声明，有作用域问题

// 数据类型
let str = 'hello';                 // 字符串
let num = 42;                      // 数字
let bool = true;                   // 布尔
let nothing = null;                // 空值（人为设置）
let notDefined = undefined;        // 未定义（系统返回）
let arr = [1, 2, 3];               // 数组
let obj = { name: '小明', age: 25 }; // 对象

// 模板字符串（反引号）
let greeting = `你好，我叫${name}，今年${obj.age}岁`;

// 类型检查
typeof 'hello';    // "string"
typeof 42;         // "number"
typeof [];         // "object"（数组也是对象）
Array.isArray([]); // true（判断数组的正确方式）
```

### 3.2 函数

```js
// 函数声明
function add(a, b) {
  return a + b;
}

// 箭头函数（现代写法，推荐）
const multiply = (a, b) => a * b;

// 箭头函数多行体需要花括号 + return
const greet = (name) => {
  const message = `你好，${name}！`;
  return message;
};

// 默认参数
function createUser(name, role = 'user') {
  return { name, role };
}
createUser('小明');           // { name: '小明', role: 'user' }
createUser('管理员', 'admin'); // { name: '管理员', role: 'admin' }

// 解构参数
function render({ title, content, author = '匿名' }) {
  console.log(`${title} — ${author}`);
  console.log(content);
}
render({ title: '新闻', content: '正文内容...' });
// 输出：新闻 — 匿名
//       正文内容...
```

### 3.3 数组操作

```js
const numbers = [1, 2, 3, 4, 5, 6];

// map：把每个元素映射为新值
const doubled = numbers.map(n => n * 2);
// [2, 4, 6, 8, 10, 12]

// filter：筛选符合条件的元素
const evens = numbers.filter(n => n % 2 === 0);
// [2, 4, 6]

// reduce：把数组归约为一个值
const sum = numbers.reduce((acc, n) => acc + n, 0);
// 21

// find：查找第一个匹配的元素
const firstEven = numbers.find(n => n % 2 === 0);
// 2

// some / every：判断是否存在 / 是否全部满足
numbers.some(n => n > 5);    // true（至少有一个 > 5）
numbers.every(n => n > 0);   // true（全部都 > 0）

// 链式调用（map + filter + reduce）
const result = numbers
  .filter(n => n % 2 === 0)    // [2, 4, 6]
  .map(n => n * n)              // [4, 16, 36]
  .reduce((a, b) => a + b);    // 56
```

### 3.4 对象与解构

```js
const user = {
  name: '小明',
  age: 25,
  address: {
    city: '北京',
    district: '海淀'
  },
  hobbies: ['编程', '摄影']
};

// 解构赋值
const { name, age, address: { city } } = user;
console.log(name, age, city);  // 小明 25 北京

// 展开运算符
const updated = { ...user, age: 26, email: 'xm@example.com' };
// 原 user 不变，新对象 age 被覆盖，email 被新增

// 数组展开
const arr1 = [1, 2];
const arr2 = [3, 4];
const combined = [...arr1, ...arr2, 5];  // [1, 2, 3, 4, 5]

// 可选链（安全访问深层属性）
console.log(user?.address?.city);    // "海淀"
console.log(user?.job?.title);       // undefined（不报错）
```

### 3.5 DOM 操作

```js
// 选择元素
const header = document.querySelector('h1');        // 第一个匹配
const buttons = document.querySelectorAll('.btn');  // 所有匹配（NodeList）
const form = document.getElementById('form');       // 按 ID

// 读取 / 修改内容
header.textContent = '新标题';           // 纯文本
header.innerHTML = '<span>新标题</span>'; // HTML（注意 XSS 风险）

// 读取 / 修改属性
const link = document.querySelector('a');
console.log(link.href);                  // 完整 URL
console.log(link.getAttribute('href'));  // 原始值

// 修改类名
header.classList.add('active');
header.classList.remove('hidden');
header.classList.toggle('dark');          // 有则删，无则加
header.classList.contains('active');      // true/false

// 修改样式
header.style.color = 'red';
header.style.setProperty('--my-var', '10px');  // 设置 CSS 变量

// 创建 / 删除元素
const div = document.createElement('div');
div.className = 'card';
div.innerHTML = '<h3>新卡片</h3>';
document.body.appendChild(div);   // 追加到 body 末尾

const parent = document.querySelector('.container');
parent.prepend(div);              // 插入到容器开头
parent.removeChild(div);          // 删除
div.remove();                     // 删除自身（现代写法）
```

### 3.6 事件处理

```js
// 点击事件
const btn = document.querySelector('button');
btn.addEventListener('click', (e) => {
  console.log('按钮被点击了！');
  console.log(e.target);       // 被点击的元素
  console.log(e.clientX);      // 鼠标 X 坐标
});

// 表单提交
const form = document.querySelector('form');
form.addEventListener('submit', (e) => {
  e.preventDefault();          // 阻止默认提交（页面刷新）
  const data = new FormData(form);
  console.log(data.get('name'));
});

// 键盘事件
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
});

// 输入事件
const input = document.querySelector('input');
input.addEventListener('input', (e) => {
  console.log('当前输入：', e.target.value);
});

// 事件委托：在父元素上监听子元素的事件
document.querySelector('ul').addEventListener('click', (e) => {
  if (e.target.tagName === 'LI') {
    console.log('点击了：', e.target.textContent);
  }
});
// 好处：新添加的 li 自动被监听，无需重新绑定
```

### 3.7 异步编程

```js
// Promise：处理异步操作
fetch('https://api.example.com/data')
  .then(response => {
    if (!response.ok) throw new Error('请求失败');
    return response.json();
  })
  .then(data => {
    console.log('获取到数据：', data);
  })
  .catch(error => {
    console.error('出错了：', error.message);
  });

// async/await：更优雅的异步写法
async function loadData() {
  try {
    const response = await fetch('https://api.example.com/data');
    if (!response.ok) throw new Error('请求失败');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('出错了：', error.message);
  }
}

// 并行请求
async function loadAll() {
  const [users, posts] = await Promise.all([
    fetch('/api/users').then(r => r.json()),
    fetch('/api/posts').then(r => r.json())
  ]);
  console.log({ users, posts });
}

// setTimeout / setInterval
const timer = setTimeout(() => {
  console.log('3 秒后执行');
}, 3000);
clearTimeout(timer);  // 取消

const interval = setInterval(() => {
  console.log('每秒执行一次');
}, 1000);
clearInterval(interval);  // 停止
```

### 3.8 实战：一个完整的交互组件

下面是一个标签页（Tab）组件的完整实现：

```html
<div class="tabs">
  <div class="tab-buttons">
    <button class="tab-btn active" data-tab="html">HTML</button>
    <button class="tab-btn" data-tab="css">CSS</button>
    <button class="tab-btn" data-tab="js">JavaScript</button>
  </div>
  <div class="tab-panels">
    <div class="tab-panel active" id="html">
      <h3>HTML</h3>
      <p>定义网页结构。</p>
    </div>
    <div class="tab-panel" id="css">
      <h3>CSS</h3>
      <p>控制网页外观。</p>
    </div>
    <div class="tab-panel" id="js">
      <h3>JavaScript</h3>
      <p>添加交互逻辑。</p>
    </div>
  </div>
</div>

<style>
.tab-buttons { display: flex; gap: 4px; margin-bottom: 16px; }
.tab-btn {
  padding: 8px 20px;
  border: 1px solid #ddd;
  background: #f5f5f5;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}
.tab-btn.active { background: #3880ff; color: white; border-color: #3880ff; }
.tab-panel { display: none; }
.tab-panel.active { display: block; }
</style>

<script>
document.querySelector('.tab-buttons').addEventListener('click', (e) => {
  if (!e.target.classList.contains('tab-btn')) return;

  // 移除所有 active 状态
  document.querySelectorAll('.tab-btn, .tab-panel').forEach(el => {
    el.classList.remove('active');
  });

  // 激活当前按钮
  e.target.classList.add('active');

  // 激活对应面板
  const tabId = e.target.dataset.tab;
  document.getElementById(tabId).classList.add('active');
});
</script>
```

---

## 第四部分：综合实战——个人主页

把三部分知识整合，构建一个完整的个人主页。

### 完整代码

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>小明的主页</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --primary: #4f46e5;
      --bg: #f8fafc;
      --card-bg: #fff;
      --text: #1e293b;
      --text-light: #64748b;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
    }

    /* 导航栏 */
    header {
      background: var(--card-bg);
      border-bottom: 1px solid #e2e8f0;
      position: sticky; top: 0; z-index: 100;
    }
    nav {
      max-width: 960px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
    }
    nav a { color: var(--text); text-decoration: none; }
    nav a:hover { color: var(--primary); }
    .nav-links { display: flex; gap: 24px; }

    /* 主内容 */
    main { max-width: 960px; margin: 0 auto; padding: 40px 24px; }

    /* Hero 区域 */
    .hero { text-align: center; padding: 60px 0; }
    .hero h1 { font-size: 2.5rem; margin-bottom: 12px; }
    .hero p { color: var(--text-light); font-size: 1.15rem; max-width: 500px; margin: 0 auto; }

    /* 卡片网格 */
    .projects {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      margin-top: 40px;
    }
    .card {
      background: var(--card-bg);
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.1);
    }
    .card h3 { margin-bottom: 8px; }
    .card p { color: var(--text-light); font-size: 0.95rem; }

    /* 页脚 */
    footer {
      text-align: center;
      padding: 40px 24px;
      color: var(--text-light);
      font-size: 0.85rem;
    }

    /* 回到顶部按钮 */
    #back-to-top {
      position: fixed;
      bottom: 32px; right: 32px;
      width: 44px; height: 44px;
      border-radius: 50%;
      background: var(--primary);
      color: white;
      border: none;
      cursor: pointer;
      font-size: 1.2rem;
      opacity: 0;
      transform: translateY(12px);
      pointer-events: none;
      transition: opacity 0.3s, transform 0.3s;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    #back-to-top.show {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }

    @media (max-width: 600px) {
      .hero h1 { font-size: 1.8rem; }
      .nav-links { gap: 14px; font-size: 0.9rem; }
    }
  </style>
</head>
<body>
  <header>
    <nav>
      <a href="#"><strong>小明</strong></a>
      <div class="nav-links">
        <a href="#about">关于</a>
        <a href="#projects">项目</a>
        <a href="#contact">联系</a>
      </div>
    </nav>
  </header>

  <main>
    <section class="hero">
      <h1>👋 你好，我是小明</h1>
      <p>前端开发者，热爱简洁的设计和有用的工具。</p>
    </section>

    <section id="projects">
      <h2>项目</h2>
      <div class="projects">
        <div class="card">
          <h3>🎨 个人博客</h3>
          <p>基于 Hugo 构建的静态博客，部署在 Cloudflare Pages。</p>
        </div>
        <div class="card">
          <h3>📝 待办应用</h3>
          <p>纯前端实现的 Todo App，支持本地存储和标签分类。</p>
        </div>
        <div class="card">
          <h3>🌦️ 天气组件</h3>
          <p>通过 API 获取实时天气的 Web Component，可嵌入任意页面。</p>
        </div>
      </div>
    </section>
  </main>

  <footer>
    <p>&copy; 2026 小明 · Built with 💜</p>
  </footer>

  <button id="back-to-top" title="返回顶部">↑</button>

  <script>
    // 回到顶部按钮
    const topBtn = document.getElementById('back-to-top');
    window.addEventListener('scroll', () => {
      topBtn.classList.toggle('show', window.scrollY > 500);
    });
    topBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // 平滑滚动到锚点
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    });
  </script>
</body>
</html>
```

保存为 `index.html`，双击用浏览器打开即可看到效果。

---

## 第五部分：进阶路线图

掌握基础后的学习路径：

```
第 1 个月：HTML + CSS + JS 基础（本文内容）
第 2 个月：响应式设计 + Flexbox/Grid 精通 + DOM 操作熟练
第 3 个月：一个前端框架（React / Vue / Svelte 选一个）
第 4 个月：构建工具（Vite）+ 包管理（npm）+ Git
第 5 个月：API 交互 + 状态管理 + 路由
第 6 个月：做 3 个完整项目，部署上线
```

### 推荐资源

| 资源 | 说明 |
|------|------|
| [MDN Web Docs](https://developer.mozilla.org/zh-CN/) | Mozilla 官方文档，最权威的前端参考 |
| [CSS-Tricks](https://css-tricks.com/) | CSS 技巧大全，Flexbox/Grid 图解 |
| [JavaScript.info](https://zh.javascript.info/) | 现代 JavaScript 教程，从入门到精通 |
| [Frontend Mentor](https://www.frontendmentor.io/) | 真实项目挑战，练手首选 |
| [Can I Use](https://caniuse.com/) | 查询浏览器兼容性 |

---

## 结语

前端的魅力在于**即时反馈**——你写下一行 CSS，刷新浏览器就能看到变化；你绑上一个事件，点击按钮就有了响应。这种快速的反馈循环让学习变得非常有趣。

从本文的 HTML 标签出发，到 CSS 的布局魔法，再到 JavaScript 的交互逻辑——你现在已经具备了构建一个完整网页的全部基础知识。接下来需要的是**动手练习**：找一个你觉得有趣的小项目，把它做出来。

> 📌 记住：写代码最好的学习方式是写代码本身。不要等到"学完"再开始做——边做边学，效果最好。
