// Service Worker for Web Push Notifications
const CACHE_NAME = 'jira-alarm-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Push event - 알림 수신 처리
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  let notificationData = {
    title: 'Jira 알림',
    body: '새로운 이슈가 할당되었습니다.',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: 'jira-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: '확인하기',
        icon: '/logo192.png'
      },
      {
        action: 'close',
        title: '닫기'
      }
    ]
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data
      };
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);
  
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // 이미 열린 창이 있으면 포커스
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // 새 창 열기
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Background sync for offline support
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event);
  if (event.tag === 'jira-sync') {
    event.waitUntil(
      // Jira 데이터 동기화 로직
      syncJiraData()
    );
  }
});

async function syncJiraData() {
  try {
    // 오프라인에서 저장된 데이터를 서버와 동기화
    console.log('Syncing Jira data...');
  } catch (error) {
    console.error('Sync failed:', error);
  }
}
