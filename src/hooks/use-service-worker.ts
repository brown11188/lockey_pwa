"use client";

import { useEffect } from "react";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function useServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const swUrl = `${BASE_PATH}/sw.js`;

    navigator.serviceWorker
      .register(swUrl, { scope: `${BASE_PATH}/` })
      .then((reg) => {
        console.log("[SW] Registered:", reg.scope);

        // Check for updates every 60 minutes
        setInterval(() => reg.update(), 60 * 60 * 1000);

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "activated") {
              // New version available — could show toast
              console.log("[SW] New version activated");
            }
          });
        });
      })
      .catch((err) => console.warn("[SW] Registration failed:", err));
  }, []);
}
