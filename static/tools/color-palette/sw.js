/* 配色工坊 Service Worker：离线可用、无第三方请求 */
const CACHE = 'cf-cache-v7';
const CORE = ['./', './index.html'];

async function precache() {
  const cache = await caches.open(CACHE);
  await cache.addAll(CORE).catch(() => undefined);

  // 构建产物文件名带 hash，安装时从 index.html 解析出真实资源并一并缓存，
  // 这样首次访问后即使断网也能完整打开。
  try {
    const response = await fetch('./index.html', { cache: 'reload' });
    const html = await response.text();
    const urls = new Set();
    for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      const raw = match[1];
      if (!raw || raw.startsWith('http') || raw.startsWith('data:')) continue;
      urls.add(new URL(raw, self.registration.scope).href);
    }
    await Promise.all(
      [...urls].map((url) => cache.add(new Request(url, { cache: 'reload' })).catch(() => undefined)),
    );
  } catch {
    /* 预缓存失败不影响在线使用 */
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 页面导航：优先网络，失败时用缓存里的 index.html 兜底
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put('./index.html', copy));
          return response;
        })
        .catch(() =>
          caches.match('./index.html', { ignoreVary: true }).then((hit) => hit || caches.match('./')),
        ),
    );
    return;
  }

  // 静态资源：缓存优先，未命中再请求并写入缓存
  event.respondWith(
    caches.match(request, { ignoreVary: true }).then((hit) => {
      if (hit) return hit;
      return fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
        return response;
      });
    }),
  );
});
