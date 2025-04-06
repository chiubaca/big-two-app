// Service worker for push notifications

self.addEventListener("install", (event) => {
  console.log("Service worker installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service worker activated");
  return self.clients.claim();
});

self.addEventListener("push", (event) => {
  console.log("Push notification received");

  const data = event.data?.json() ?? {
    title: "Lets play big two",
    body: "It's your turn to play",
  };

  const options = {
    body: data.body || "It's your turn to play!",
    icon: "/logo.png", // Add a card icon to your public folder
    badge: "/logo.png", // Add a badge icon to your public folder
    vibrate: [100, 50, 100],
    data: {
      url: data.url || self.registration.scope,
    },
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || "It's your turn in Big Two!",
      options
    )
  );
});

self.addEventListener("notificationclick", (event) => {
  debugger;
  console.log("Notification clicked");

  event.notification.close();

  // This looks to see if the current is already open and focuses if it is
  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        console.log("🚀 ~ .then ~ clientList:", clientList);
        const url = event.notification.data.url;

        // If we have a client, focus it
        for (const client of clientList) {
          if (client.url === url && "focus" in client) {
            return client.focus();
          }
        }

        // If no existing tab, open new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
