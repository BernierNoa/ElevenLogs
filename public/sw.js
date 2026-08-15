self.addEventListener('push', (event) => {
  let data = {};
  try {
    if (event.data) data = event.data.json();
  } catch (e) {
    data = {};
  }

  const title = data.title || 'Eleven Logs';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-512.png',
    badge: data.badge || '/icon-512.png',
    data: {
      url: data.url || '/',
    },
    tag: data.tag || 'eleven-logs-notification',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || '/';

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of allClients) {
        if ('focus' in client) {
          client.navigate(url);
          client.focus();
          return;
        }
      }
      if (clients.openWindow) {
        await clients.openWindow(url);
      }
    })(),
  );
});
