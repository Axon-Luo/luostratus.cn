import { useEffect } from 'preact/hooks';
import { route, setTheme, settings } from '../state';
import { Icon, ToastHost } from '../ui/components';
import { PageNav } from '../ui/PageNav';
import { About } from '../features/About';
import { Home } from '../features/Home';
import { Studio } from '../features/Studio';
import { Library } from '../features/Library';
import { Scales } from '../features/Scales';
import { Gradient } from '../features/Gradient';
import { Daily } from '../features/Daily';
import { Tools } from '../features/Tools';
import { Play } from '../features/Play';
import { Themes } from '../features/Themes';
import { Outfit } from '../features/Outfit';
import { Room } from '../features/Room';
import { CardPage } from '../features/CardPage';
import { PrintPage } from '../features/PrintPage';
import { Cases } from '../features/Cases';
import { Learn } from '../features/Learn';
import { MixLab } from '../features/MixLab';
import { TraditionalColors } from '../features/TraditionalColors';
import { ContrastFix } from '../features/ContrastFix';

const HOME = { label: '首页', href: '#/' };
const TOOLS = { label: '工具', href: '#/tools' };

const PAGE_META: Record<string, { trail: Array<{ label: string; href?: string }>; back: { label: string; href: string } }> = {
  '/studio': { trail: [HOME, { label: '工作台' }], back: HOME },
  '/tools': { trail: [HOME, { label: '工具' }], back: HOME },
  '/library': { trail: [HOME, { label: '我的方案' }], back: HOME },
  '/daily': { trail: [HOME, { label: '每日一色' }], back: HOME },
  '/play': { trail: [HOME, TOOLS, { label: '配色挑战' }], back: TOOLS },
  '/scales': { trail: [HOME, TOOLS, { label: '色阶与令牌' }], back: TOOLS },
  '/gradient': { trail: [HOME, TOOLS, { label: '渐变生成器' }], back: TOOLS },
  '/themes': { trail: [HOME, TOOLS, { label: '主题配色' }], back: TOOLS },
  '/outfit': { trail: [HOME, TOOLS, { label: '一周穿搭' }], back: TOOLS },
  '/room': { trail: [HOME, TOOLS, { label: '房间刷色' }], back: TOOLS },
  '/card': { trail: [HOME, TOOLS, { label: '礼物贺卡' }], back: TOOLS },
  '/print': { trail: [HOME, TOOLS, { label: '打印色卡' }], back: TOOLS },
  '/cases': { trail: [HOME, TOOLS, { label: '生活案例' }], back: TOOLS },
  '/learn': { trail: [HOME, TOOLS, { label: '配色小课堂' }], back: TOOLS },
  '/mix': { trail: [HOME, TOOLS, { label: '混色实验室' }], back: TOOLS },
  '/traditional': { trail: [HOME, TOOLS, { label: '传统色字典' }], back: TOOLS },
  '/contrast': { trail: [HOME, TOOLS, { label: '对比度修复器' }], back: TOOLS },
  '/about': { trail: [HOME, { label: '关于' }], back: HOME },
};

const TOOL_PATHS = new Set([
  '/tools',
  '/play',
  '/scales',
  '/gradient',
  '/themes',
  '/outfit',
  '/room',
  '/card',
  '/print',
  '/cases',
  '/learn',
  '/mix',
  '/traditional',
  '/contrast',
]);

export function App() {
  useEffect(() => {
    const shell = document.getElementById('app');
    if (shell) shell.setAttribute('data-ready', '1');
    return () => {
      if (shell) shell.removeAttribute('data-ready');
    };
  }, []);

  const path = route.value;
  const theme = settings.value.theme;
  const meta = PAGE_META[path];
  const toolsActive = TOOL_PATHS.has(path);

  useEffect(() => {
    const titles: Record<string, string> = {
      '/': '配色工坊 · 生活调色盘',
      '/studio': '工作台 · 配色工坊',
      '/library': '我的方案 · 配色工坊',
      '/scales': '色阶与令牌 · 配色工坊',
      '/gradient': '渐变生成器 · 配色工坊',
      '/daily': '每日一色 · 配色工坊',
      '/tools': '工具 · 配色工坊',
      '/play': '配色挑战 · 配色工坊',
      '/themes': '主题配色 · 配色工坊',
      '/outfit': '一周穿搭 · 配色工坊',
      '/room': '房间刷色 · 配色工坊',
      '/card': '礼物贺卡 · 配色工坊',
      '/print': '打印色卡 · 配色工坊',
      '/cases': '生活案例 · 配色工坊',
      '/learn': '配色小课堂 · 配色工坊',
      '/mix': '混色实验室 · 配色工坊',
      '/traditional': '传统色字典 · 配色工坊',
      '/contrast': '对比度修复器 · 配色工坊',
      '/about': '关于 · 配色工坊',
    };
    document.title = titles[path] ?? '配色工坊 · 生活调色盘';
  }, [path]);

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#000000' : '#F4F4F7');
  }, [theme]);

  return (
    <div class="app">
      <a class="skip-link" href="#main">
        跳到主要内容
      </a>

      <header class="topbar">
        <div class="container topbar-inner">
          <a class="brand" href="#/">
            <span class="brand-mark" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
            <span class="brand-text">
              配色工坊<small>生活调色盘</small>
            </span>
          </a>

          <nav class="nav" aria-label="主导航">
            <a class={path === '/' ? 'is-on' : ''} href="#/">
              首页
            </a>
            <a class={path.startsWith('/studio') ? 'is-on' : ''} href="#/studio">
              工作台
            </a>
            <a class={path === '/daily' ? 'is-on' : ''} href="#/daily">
              每日
            </a>
            <a class={toolsActive ? 'is-on' : ''} href="#/tools">
              工具
            </a>
            <a class={path === '/library' ? 'is-on' : ''} href="#/library">
              我的
            </a>
          </nav>

          <button
            type="button"
            class="icon-btn theme-toggle"
            aria-label={theme === 'light' ? '切换到深色' : '切换到浅色'}
            title={theme === 'light' ? '切换到深色' : '切换到浅色'}
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            <Icon name={theme === 'light' ? 'moon' : 'sun'} />
          </button>
        </div>
      </header>

      <main id="main">
        {meta && <PageNav trail={meta.trail} back={meta.back} />}
        {path.startsWith('/studio') ? (
          <Studio />
        ) : path === '/daily' ? (
          <Daily />
        ) : path === '/tools' ? (
          <Tools />
        ) : path === '/play' ? (
          <Play />
        ) : path === '/scales' ? (
          <Scales />
        ) : path === '/gradient' ? (
          <Gradient />
        ) : path === '/themes' ? (
          <Themes />
        ) : path === '/outfit' ? (
          <Outfit />
        ) : path === '/room' ? (
          <Room />
        ) : path === '/card' ? (
          <CardPage />
        ) : path === '/print' ? (
          <PrintPage />
        ) : path === '/cases' ? (
          <Cases />
        ) : path === '/learn' ? (
          <Learn />
        ) : path === '/mix' ? (
          <MixLab />
        ) : path === '/traditional' ? (
          <TraditionalColors />
        ) : path === '/contrast' ? (
          <ContrastFix />
        ) : path === '/library' ? (
          <Library />
        ) : path === '/about' ? (
          <About />
        ) : (
          <Home />
        )}
      </main>

      <footer class="footer">
        <div class="container">
          <span>配色工坊 · 生活调色盘</span>
          <span>2026 Qoder 高校创造力大赛</span>
          <a class="link footer-about" href="#/about">
            关于
          </a>
        </div>
      </footer>

      <ToastHost />
    </div>
  );
}
