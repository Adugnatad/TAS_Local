"use client";

import { useEffect, useState } from "react";
import { USE_MSW } from "@/lib/constants";

export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(!USE_MSW);

  useEffect(() => {
    async function init() {
      if (USE_MSW) {
        const { worker } = await import("@/mocks/browser");
        await worker.start({ onUnhandledRequest: "bypass" });
      }
      setReady(true);
    }
    init();
  }, []);

  useEffect(() => {
    if (ready) {
      document.body.dataset.appReady = "true";
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}
