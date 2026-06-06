"use client";

import { useEffect } from "react";

const TAWK_SRC = "https://embed.tawk.to/69f8e4381eeb261c3abd895c/1jnq3mvd3";

declare global {
  interface Window {
    Tawk_API?: Record<string, unknown>;
    Tawk_LoadStart?: Date;
  }
}

export function TawkToScript() {
  useEffect(() => {
    let loaded = false;
    let timeoutId: number | null = null;

    function loadWidget() {
      if (loaded || document.getElementById("tawk-to-widget-script")) {
        loaded = true;
        return;
      }

      loaded = true;
      window.Tawk_API = window.Tawk_API || {};
      window.Tawk_LoadStart = new Date();

      const script = document.createElement("script");
      script.id = "tawk-to-widget-script";
      script.async = true;
      script.src = TAWK_SRC;
      script.charset = "UTF-8";
      script.setAttribute("crossorigin", "*");
      document.body.appendChild(script);
    }

    const idleCallback =
      "requestIdleCallback" in window
        ? window.requestIdleCallback(() => loadWidget(), { timeout: 7000 })
        : null;
    timeoutId = window.setTimeout(loadWidget, 9000);

    const events = ["pointerdown", "keydown", "touchstart", "scroll"] as const;
    events.forEach((eventName) => window.addEventListener(eventName, loadWidget, { once: true, passive: true }));

    return () => {
      if (idleCallback && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleCallback);
      }
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      events.forEach((eventName) => window.removeEventListener(eventName, loadWidget));
    };
  }, []);

  return null;
}
