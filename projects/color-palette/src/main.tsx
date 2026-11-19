import { render } from 'preact';
import { App } from './app/App';
import { init } from './state';
import './ui/styles.css';

const root = document.getElementById('app');
if (root) {
  init();
  render(<App />, root);
}

// 离线：注册 Service Worker（只缓存本站静态资源，不涉及任何上传）
// 开发环境与 file:// 单文件版都不注册：前者避免缓存旧模块，后者没有 http 协议。
const canUseServiceWorker =
  import.meta.env.PROD &&
  'serviceWorker' in navigator &&
  (location.protocol === 'http:' || location.protocol === 'https:');

if (canUseServiceWorker) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* 离线能力不可用时不阻塞主流程 */
    });
  });
}
