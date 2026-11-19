import { generatePalettes } from '../core/palette/generate';

const demo = generatePalettes({
  baseHex: '#3B6CFF',
  scene: 'poster',
  style: 'vivid',
  mood: 'energy',
  harmony: 'triadic',
  seed: 20261116,
  count: 1,
  now: 1,
})[0];

const QUICK = [
  {
    href: '#/daily',
    kicker: '每天 1 分钟',
    title: '今日一色',
    desc: '每天一套配色一句话，回看留下记录',
  },
  {
    href: '#/play',
    kicker: '60 秒',
    title: '配色挑战',
    desc: '四种题型，色差收窄，测测眼力',
  },
  {
    href: '#/themes',
    kicker: '12 + 8',
    title: '主题配色',
    desc: '节气、城市、盲盒，每套都能带走',
  },
  {
    href: '#/cases',
    kicker: '8 个场景',
    title: '生活案例',
    desc: '招新、毕业季、露营，看别人怎么配',
  },
];

const LIFE = [
  { href: '#/outfit', title: '一周穿搭', desc: '7 天上装 / 下装 / 鞋包，导出周历' },
  { href: '#/room', title: '房间刷色', desc: '墙面到点缀按面积分配，A4 清单' },
  { href: '#/card', title: '礼物贺卡', desc: '写一句祝福，生成 3:4 贺卡' },
  { href: '#/print', title: '打印色卡', desc: 'A4 / A5、150dpi、带裁切线' },
];

const PRO = [
  { href: '#/scales', title: '色阶与令牌', desc: '6 色 × 11 阶 + 6 种开发格式' },
  { href: '#/gradient', title: '渐变生成器', desc: '线性 / 径向 / 锥形，复制 CSS 或 PNG' },
  { href: '#/tools', title: '全部工具', desc: '16 个入口，从取材到打印' },
];

export function Home() {
  const colors = demo.colors;
  return (
    <div class="container">
      <section class="hero">
        <div class="hero-copy">
          <span class="eyebrow">COLORLIFE · LIFEHACK</span>
          <h1>
            把生活，
            <br />
            <span class="hero-accent">调成喜欢的颜色</span>
          </h1>
          <p>
            拍一张照片，30 秒得到一套能直接用的配色，能预览、能检查、能带走，而且不需要注册
          </p>
          <div class="hero-actions">
            <a class="btn primary" href="#/studio">
              开始配色
            </a>
            <a class="btn ghost" href="#/daily">
              看今日一色
            </a>
          </div>
          <ul class="hero-points">
            <li>图片零上传</li>
            <li>离线可用</li>
            <li>26 个功能</li>
          </ul>
        </div>

        <div class="hero-window">
          <div class="window-bar" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <div class="hero-deck" aria-hidden="true">
            {colors.map((c) => {
              const dark = c.hex.replace('#', '');
              const r = parseInt(dark.slice(0, 2), 16);
              const g = parseInt(dark.slice(2, 4), 16);
              const b = parseInt(dark.slice(4, 6), 16);
              const light = (r * 299 + g * 587 + b * 114) / 1000 >= 150;
              return (
                <div
                  class="deck-card"
                  key={c.role}
                  style={{ background: c.hex, color: light ? '#17171A' : '#FFFFFF' }}
                >
                  <strong>{c.label}</strong>
                  <span class="deck-hex">{c.hex}</span>
                </div>
              );
            })}
          </div>
          <div class="window-foot">
            <span>PALETTE / 06 ROLES</span>
            <span>LIVE PREVIEW</span>
          </div>
        </div>
        <p class="sr-only">
          示例配色：{colors.map((c) => `${c.label} ${c.hex}`).join('，')}
        </p>
      </section>

      <section class="section">
        <div class="section-head">
          <h2>今天先玩什么</h2>
          <p>不用先想好要做什么，随便点一个开始</p>
        </div>
        <div class="home-quick">
          {QUICK.map((item) => (
            <a class="quick-card" href={item.href} key={item.href}>
              <span>{item.kicker}</span>
              <strong>{item.title}</strong>
              <p>{item.desc}</p>
            </a>
          ))}
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <h2>把颜色带进生活</h2>
          <p>四个能直接产出成品的任务，不只是看色卡</p>
        </div>
        <div class="home-life">
          {LIFE.map((item) => (
            <a class="life-card" href={item.href} key={item.href}>
              <strong>{item.title}</strong>
              <p>{item.desc}</p>
            </a>
          ))}
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <h2>专业一点</h2>
          <p>给设计和开发用的色阶、令牌与渐变</p>
        </div>
        <div class="home-pro">
          {PRO.map((item) => (
            <a class="pro-card" href={item.href} key={item.href}>
              <strong>{item.title}</strong>
              <span>{item.desc}</span>
            </a>
          ))}
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <h2>三步，从照片到成品</h2>
          <p>不需要设计基础，也不用安装任何东西</p>
        </div>
        <div class="steps">
          <div class="step">
            <span>STEP 01</span>
            <h3>拍照、吸管或选主题</h3>
            <p>上传、摄像头、屏幕吸管、情绪板，或者直接选一个节气</p>
          </div>
          <div class="step">
            <span>STEP 02</span>
            <h3>换到喜欢为止</h3>
            <p>三套方案并列比较，单色微调后自动锁定</p>
          </div>
          <div class="step">
            <span>STEP 03</span>
            <h3>预览、检查、带走</h3>
            <p>五种预览、对比度与色弱检查，导出 CSS / JSON / PNG / 分享卡</p>
          </div>
        </div>
      </section>

      <section class="cta-band">
        <div>
          <h2>先拿一张照片试试</h2>
          <p>不需要注册，图片只在本地处理，关掉页面也不会留下</p>
        </div>
        <a class="btn primary" href="#/studio">
          打开工作台
        </a>
      </section>
    </div>
  );
}
