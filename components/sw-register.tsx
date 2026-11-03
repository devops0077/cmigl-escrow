"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/register-service-worker";

/**
 * Registers the existing service worker (public/service-worker.js) in
 * production only. The worker itself is deliberately conservative: it
 * never intercepts or caches /api/ requests, serves navigations
 * network-first with an offline fallback page, and only cache-firsts a
 * small set of offline essentials — so sign-in sessions and escrow data
 * can never be served stale from a cache.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    registerServiceWorker().catch(() => {
      // Registration already logs its own failure; never break the page.
    });
  }, []);

  return null;
}
