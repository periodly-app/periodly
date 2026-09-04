// Periodly Service Worker

const CACHE_NAME = 'cycle-reminder-v1'

// Installation — App-Shell cachen
self.addEventListener('install', event => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(['/', '/index.html'])
    })
  )
})

// Activation — alten Cache löschen
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch — zuerst Netzwerk, dann Cache (Network First)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})

// Push Event — Notification anzeigen
self.addEventListener('push', event => {
  const data = event.data?.json() || {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'Periodly', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [100, 50, 100],
      data: { url: data.url || '/' },
    })
  )
})

// Notification Click — App öffnen
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      if (clientList.length > 0) {
        clientList[0].focus()
        clientList[0].navigate(url)
        return
      }
      return clients.openWindow(url)
    })
  )
})
