// ProNexaX Service Worker v3.0
// v3: POST を cache.put 対象外に修正 / CACHE_NAME 更新で旧 SW を強制退避
const CACHE_NAME = 'pronexax-v3';
const OFFLINE_URL = './index.html';

// インストール時：主要アセットをキャッシュ → skipWaiting で即時待機解除
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        OFFLINE_URL,
        './manifest.json',
        './pronexaX_logo.png'
      ]);
    }).then(() => self.skipWaiting())  // 旧 SW を待たずに即時 activate へ
  );
});

// アクティベート時：pronexax-v3 以外の旧キャッシュを全削除 → clients.claim で即時制御
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)  // v1 / v2 を含む旧キャッシュを削除
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())  // 既存タブも即座にこの SW が制御
  );
});

// フェッチ：Cache-first（HTML のみ Network-first）
// ★ GET 以外（POST 等）は cache.put しない
self.addEventListener('fetch', (event) => {
  // ナビゲーション（ページ遷移）は Network-first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // POST / PUT / DELETE 等は cache を一切経由しない — そのままネットワークへ
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  // GET のみ Cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return response;
      });
    }).catch(() => caches.match(OFFLINE_URL))
  );
});
