const CACHE_NAME = 'roberto-v3.0.0';

const ASSETS = [
  './',
  './index.html',
  './admin.html',
  './reviews.html',
  './support.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(
        ASSETS.map(url => cache.add(url).catch(err => console.log('Skip:', url)))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if(cached) return cached;
      return fetch(event.request).then(response => {
        if(response && response.status === 200 && response.type === 'basic'){
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        if(event.request.destination === 'document'){
          return caches.match('./index.html');
        }
      });
    })
  );
});

self.addEventListener('push', event => {
  let data = { title: 'ROBERTO', body: 'عرض جديد وصل!' };
  if(event.data){
    try { data = event.data.json(); }
    catch(e){ data.body = event.data.text(); }
  }
  const options = {
    body: data.body,
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'roberto-notification',
    renotify: true,
    data: { url: data.url || './index.html' }
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if(event.action === 'close') return;
  const url = event.notification.data.url || './index.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for(const client of list){
        if(client.url.includes('roberto-store') && 'focus' in client) return client.focus();
      }
      if(clients.openWindow) return clients.openWindow(url);
    })
  );
});