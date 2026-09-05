"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Download, X } from "lucide-react";
import { toast } from "sonner";
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
  const [isChromium, setIsChromium] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsStandalone(standalone);
    if (standalone) return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isChromiumBrowser =
      userAgent.includes("chrome") ||
      userAgent.includes("chromium") ||
      userAgent.includes("edg") ||
      userAgent.includes("brave") ||
      userAgent.includes("samsungbrowser") ||
      userAgent.includes("opera");

    setIsChromium(isChromiumBrowser);

    const isDismissed = safeStorage.getItem<boolean>(STORAGE_KEYS.PWA_DISMISSED, false);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!isDismissed) {
        setIsVisible(true);
      }
    };

    const handleAppInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
      setIsStandalone(true);
      safeStorage.setItem(STORAGE_KEYS.PWA_DISMISSED, true);
      toast.success("Razorpay Aegis installed successfully!");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    if (isChromiumBrowser && !isDismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.removeEventListener("appinstalled", handleAppInstalled);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        safeStorage.setItem(STORAGE_KEYS.PWA_DISMISSED, true);
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } else {
      toast.info(
        "To install Aegis: click the Install icon in your browser address bar or use Chrome menu > Cast, save and share > Install Razorpay Aegis."
      );
      setIsVisible(false);
      safeStorage.setItem(STORAGE_KEYS.PWA_DISMISSED, true);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    safeStorage.setItem(STORAGE_KEYS.PWA_DISMISSED, true);
  };

  if (isStandalone || !isVisible) return null;

  return (
    <div
      role="region"
      aria-label="Application Installation"
      className="fixed bottom-4 right-4 z-40 max-w-sm w-[calc(100vw-2rem)] bg-card border border-border rounded-xl p-3.5 shadow-xl flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-border shadow-xs bg-card">
            <Image
              src="/Favicon.png"
              alt="Razorpay Aegis Logo"
              width={32}
              height={32}
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground">Install Aegis App</div>
            <div className="text-[11px] text-muted-foreground leading-snug">
              Instant desktop access with a dedicated operations window.
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
          className="px-3 py-1 text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 rounded-md shadow-xs transition cursor-pointer flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install as App</span>
        </button>
      </div>
    </div>
  );
}
