"use client";

export async function registerServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    try {
      // Add a timestamp to the service worker URL to bypass browser cache in development
      const swUrl =
        process.env.NODE_ENV === "development"
          ? `/service-worker.js?v=${Date.now()}`
          : "/service-worker.js";

      const registration = await navigator.serviceWorker.register(swUrl, {
        // Use a scope that only includes what's necessary
        scope: "/",
      });

      console.log("Service worker registered:", registration);

      // Set up listener for sound playing messages from service worker
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "PLAY_NOTIFICATION_SOUND") {
          const audio = new Audio(event.data.sound);
          audio.volume = 0.5;
          audio.play().catch((error) => {
            console.error("Error playing notification sound:", error);
          });
        }
      });

      // In development, update the service worker on each page load
      if (process.env.NODE_ENV === "development") {
        registration.update();
      }

      return registration;
    } catch (error) {
      console.error("Service worker registration failed:", error);
    }
  }
}

// Function to clear all service worker caches
export async function clearServiceWorkerCaches() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;

      // Create a message channel to get a response from the service worker
      const messageChannel = new MessageChannel();

      // Create a promise that resolves when the service worker responds
      const clearCachePromise = new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          if (event.data.success) {
            resolve(true);
          }
        };
      });

      // Send the clear cache message to the service worker
      registration?.active.postMessage({ type: "CLEAR_CACHES" }, [
        messageChannel.port2,
      ]);

      // Wait for the service worker to respond
      await clearCachePromise;

      console.log("Service worker caches cleared");
      return true;
    } catch (error) {
      console.error("Failed to clear service worker caches:", error);
      return false;
    }
  }
  return false;
}

// Function to unregister all service workers
export async function unregisterServiceWorkers() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();

      for (const registration of registrations) {
        await registration.unregister();
      }

      console.log("Service workers unregistered");
      return true;
    } catch (error) {
      console.error("Failed to unregister service workers:", error);
      return false;
    }
  }
  return false;
}
