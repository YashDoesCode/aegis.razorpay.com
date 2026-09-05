"use client";

import React, { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { safeStorage, STORAGE_KEYS } from "@/lib/storage/safeStorage";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isDismissed = safeStorage.getItem<boolean>(STORAGE_KEYS.PWA_DISMISSED, false);
    if (isDismissed) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
      safeStorage.setItem(STORAGE_KEYS.PWA_DISMISSED, true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    setIsVisible(false);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      safeStorage.setItem(STORAGE_KEYS.PWA_DISMISSED, true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    safeStorage.setItem(STORAGE_KEYS.PWA_DISMISSED, true);
  };

  if (!isVisible || !deferredPrompt) return null;

  return (
    <div
      role="region"
      aria-label="Application Installation"
      className="fixed bottom-4 right-4 z-40 max-w-sm w-[calc(100vw-2rem)] bg-card border border-border rounded-xl p-3.5 shadow-lg flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground">Install Aegis</div>
            <div className="text-[11px] text-muted-foreground leading-snug">
              Fast desktop access with a dedicated operations window.
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss installation prompt"
          className="p-1 text-muted-foreground hover:text-foreground rounded-md transition cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1 border-t border-border">
        <button
          type="button"
          onClick={handleDismiss}
          className="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground rounded-md transition cursor-pointer"
        >
          Not now
        </button>
        <button
          type="button"
          onClick={handleInstallClick}
          className="px-3 py-1 text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 rounded-md shadow-xs transition cursor-pointer"
        >
          Install
        </button>
      </div>
    </div>
  );
}
