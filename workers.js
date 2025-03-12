// 香港智障服務人員嘉許計劃2025 - Service Worker
const CACHE_NAME = 'awid-award-v1';
const ASSETS_TO_CACHE = [
  './',
  './main.html',
  './logo.webp',
  './logo-caritas.webp',
  './background.png',
  './qrcode.png',
];

// 檢查瀏覽器是否支持Cache API
const isCacheSupported = 'caches' in self;

// 安裝Service Worker
self.addEventListener('install', (event) => {
  // 如果支持緩存，則預緩存資源
  if (isCacheSupported) {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => {
          console.log('緩存已開啟');
          return cache.addAll(ASSETS_TO_CACHE);
        })
        .then(() => {
          // 強制Service Worker跳過等待
          return self.skipWaiting();
        })
        .catch(error => {
          console.error('緩存資源失敗:', error);
        })
    );
  } else {
    // 如果不支持緩存，僅跳過等待階段
    event.waitUntil(self.skipWaiting());
  }
});

// 啓動Service Worker
self.addEventListener('activate', (event) => {
  // 如果支持緩存，清理舊的緩存
  if (isCacheSupported) {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('刪除舊緩存:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // 確保Service Worker立即接管頁面
        return self.clients.claim();
      })
      .catch(error => {
        console.error('清理緩存失敗:', error);
        return self.clients.claim();
      })
    );
  } else {
    // 如果不支持緩存，僅接管頁面
    event.waitUntil(self.clients.claim());
  }
});

// 處理頁面請求
self.addEventListener('fetch', (event) => {
  // 如果不支持緩存，直接使用網絡請求
  if (!isCacheSupported) {
    return;
  }
  
  try {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // 如果資源在緩存中找到，直接返回
          if (response) {
            return response;
          }
          
          // 否則，網絡請求獲取資源
          return fetch(event.request.clone())
            .then((networkResponse) => {
              // 確保我們收到有效響應
              if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                return networkResponse;
              }
              
              // 複製響應並緩存
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                })
                .catch(err => {
                  console.error('緩存請求失敗:', err);
                });
                
              return networkResponse;
            })
            .catch(error => {
              console.error('獲取資源失敗:', error);
              return new Response('無法連接網絡', {
                status: 503,
                statusText: '服務不可用'
              });
            });
        })
        .catch(error => {
          console.error('緩存匹配錯誤:', error);
          return fetch(event.request);
        })
    );
  } catch (error) {
    console.error('Service Worker處理請求時出錯:', error);
    // 如果respondWith出錯，不做任何處理讓瀏覽器正常處理請求
  }
});
