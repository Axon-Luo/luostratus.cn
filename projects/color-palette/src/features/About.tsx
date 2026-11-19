export function About() {
  return (
    <div class="about">
      <h1>关于配色工坊</h1>
      <p>
        配色工坊是一个为「生活里的小配色决定」做的工具：穿什么、房间刷什么颜色、手账怎么搭、朋友圈封面用什么色调，
        它不要求你会设计，也不要求你注册账号——拍一张照片，就能得到一套能直接用的配色
      </p>

      <section class="about-section">
        <h2>它怎么工作</h2>
        <ul>
          <li>图片在浏览器里用 canvas 读取，主色用 OKLab 空间的 k-means 提取，不上传服务器</li>
          <li>配色在 OKLCH 感知均匀色彩空间里生成，用 ΔE2000 保证几个颜色「看起来真的不一样」</li>
          <li>对比度同时按 WCAG 2.2 与 APCA 计算，修复时保持色相、以最小色差逼近达标</li>
          <li>色觉模拟使用 Machado 2009 的矩阵，覆盖红、绿、蓝三种色觉障碍与全色盲</li>
          <li>分享卡、周历、房间清单、贺卡与打印页都在浏览器里用 Canvas 生成，不上传服务器</li>
          <li>Service Worker 缓存整站静态资源，安装为 PWA 后可以离线打开</li>
        </ul>
      </section>

      <section class="about-section">
        <h2>隐私</h2>
        <p>
          没有账号、没有后端、没有统计脚本，图片只在当前标签页内处理；收藏与历史存在浏览器
          localStorage 里，清除站点数据就会消失
        </p>
      </section>

      <section class="about-section">
        <h2>技术与版本</h2>
        <dl class="about-kv">
          <dt>参赛</dt>
          <dd>2026 Qoder 高校创造力大赛 · LifeHack 生活娱乐赛道</dd>
          <dt>技术栈</dt>
          <dd>Vite · TypeScript · Preact · 原生 CSS · Web Canvas</dd>
          <dt>色彩引擎</dt>
          <dd>OKLab / OKLCH · CIEDE2000 · WCAG 2.2 · APCA 0.1.9</dd>
          <dt>版本</dt>
          <dd>0.2.0 · v2（26 项功能）</dd>
        </dl>
      </section>

      <section class="about-section">
        <h2>v2 包含什么</h2>
        <p>
          工作台升级、专业工具、生活任务、每日一色、四种题型配色挑战、主题配色、案例库与小课堂、方案库备份、PWA；专业与生活工具均可独立调色，贺卡有五种版式，所有子页面有返回与面包屑，视觉采用黑底靛蓝的 LuoStratus 风格，
          另有混色实验室、传统色字典与对比度修复器三个颜色小工具，所有颜色计算、图片处理与成品导出都在本地完成；如果发现不好用的地方，欢迎告诉作者
        </p>
      </section>
    </div>
  );
}
