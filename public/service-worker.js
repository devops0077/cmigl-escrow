// Service worker for handling push notifications and minimal offline support

// Version helps with cache invalidation
const VERSION = "v1";
const OFFLINE_CACHE = `offline-cache-${VERSION}`;

// Only cache essential offline assets - not API routes or dynamic content
const OFFLINE_ESSENTIALS = [
  "/",
  "/offline",
  "/icon1.png",
  "/apple-icon.png",
  "/sounds/notification.mp3",
  "/sounds/transaction.mp3",
  "/sounds/alert.mp3",
];

// Install event - cache minimal offline essentials only
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(OFFLINE_CACHE).then((cache) => {
      return cache.addAll(OFFLINE_ESSENTIALS);
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName.startsWith("offline-cache-") &&
              cacheName !== OFFLINE_CACHE
            ) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Claim clients so the updated service worker controls current pages
        return self.clients.claim();
      })
  );
});

// Fetch event - ONLY handle offline fallbacks, don't cache API requests
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isAPIRequest = url.pathname.startsWith("/api/");
  const isNavigationRequest = event.request.mode === "navigate";

  // Never cache or intercept API requests
  if (isAPIRequest) {
    return;
  }

  // For navigation requests, try network first, fall back to offline page
  if (isNavigationRequest) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If network request fails, show offline page
        return caches.match("/offline");
      })
    );
    return;
  }

  // For offline essential assets, use cache-first approach
  if (OFFLINE_ESSENTIALS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
    return;
  }

  // For all other requests, use network-only strategy
  // This ensures fresh content and prevents unwanted caching
});

// Function to play notification sound
const playNotificationSound = async (soundName) => {
  try {
    // Default sound if none specified
    const soundPath = soundName
      ? `/sounds/${soundName}.mp3`
      : "/sounds/notification.mp3";

    // Check if the sound file is in the cache
    const cache = await caches.open(OFFLINE_CACHE);
    const soundResponse = await cache.match(soundPath);

    if (soundResponse) {
      // If we have clients, send a message to play the sound
      const clients = await self.clients.matchAll();
      if (clients.length > 0) {
        clients.forEach((client) => {
          client.postMessage({
            type: "PLAY_NOTIFICATION_SOUND",
            sound: soundPath,
          });
        });
      }
    }
  } catch (error) {
    console.error("Error playing notification sound:", error);
  }
};

// Push event - handle incoming push notifications
self.addEventListener("push", (event) => {
  if (!event.data) {
    console.log("Push event but no data");
    return;
  }

  try {
    const data = event.data.json();

    // Extract notification data
    const title = data.title || "CMIGL Escrow";
    const options = {
      body: data.body || "You have a new notification",
      icon: data.icon || "/icon1.png",
      badge: data.badge || "/icon1.png",
      image: data.image,
      tag: data.tag || "default",
      data: data.data || {},
      actions: data.actions || [],
      requireInteraction: true,
      renotify: true,
      silent: false, // We'll handle the sound ourselves
    };

    // Get the sound preference from the data
    const sound = data.data?.sound || "default";

    // Show the notification and play sound
    event.waitUntil(
      Promise.all([
        self.registration.showNotification(title, options),
        // Play notification sound if specified
        sound !== "none" ? playNotificationSound(sound) : Promise.resolve(),
        // Send delivery confirmation to the server
        (async () => {
          const notificationId = data.data?.notificationId;
          if (notificationId) {
            try {
              await fetch("/api/push-notifications/delivered", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ notificationId }),
              });
            } catch (error) {
              console.error("Error sending delivery confirmation:", error);
            }
          }
        })(),
      ])
    );
  } catch (error) {
    console.error("Error processing push notification:", error);
  }
});

// Notification click event - handle user interaction with the notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // Get the notification data
  const data = event.notification.data || {};
  const url = data.url || "/dashboard";
  const notificationId = data.notificationId;

  // Handle notification click
  event.waitUntil(
    Promise.all([
      // Open the target URL
      self.clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clientList) => {
          // Check if there's already a window open
          for (const client of clientList) {
            if (
              client.url.includes(self.location.origin) &&
              "focus" in client
            ) {
              client.navigate(url);
              return client.focus();
            }
          }
          // If no window is open, open a new one
          return self.clients.openWindow(url);
        }),

      // Send click confirmation to the server
      notificationId
        ? fetch("/api/push-notifications/clicked", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ notificationId }),
          })
        : Promise.resolve(),
    ])
  );
});

// Push subscription change event
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    // Get the new subscription
    self.registration.pushManager
      .subscribe(event.oldSubscription.options)
      .then((subscription) => {
        // Send the new subscription to the server
        return fetch("/api/push-notifications/update-subscription", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            oldEndpoint: event.oldSubscription.endpoint,
            newSubscription: subscription,
          }),
        });
      })
  );
});

// Listen for messages from the client
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  // Handle cache clearing request
  if (event.data && event.data.type === "CLEAR_CACHES") {
    event.waitUntil(
      caches
        .keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              return caches.delete(cacheName);
            })
          );
        })
        .then(() => {
          event.ports[0].postMessage({ success: true });
        })
    );
  }
});
