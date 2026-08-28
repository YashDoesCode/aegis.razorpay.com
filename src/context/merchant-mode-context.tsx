"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface ConnectedMerchantState {
  isConnected: boolean;
  merchantId: string;
  name: string;
  mode: "test" | "live";
  authType: "api_key" | "oauth" | "env";
  maskedKeyId: string | null;
  connectedAt?: string;
}

interface MerchantModeContextType {
  mode: "test" | "live";
  setMode: (mode: "test" | "live") => void;
  toggleMode: () => void;
  merchant: ConnectedMerchantState;
  isLoading: boolean;
  isConnectModalOpen: boolean;
  setIsConnectModalOpen: (open: boolean) => void;
  refreshStatus: () => Promise<void>;
  connectAccount: (keyId: string, keySecret: string, merchantName?: string) => Promise<{ ok: boolean; error?: string }>;
  disconnectAccount: () => Promise<void>;
}

const defaultMerchant: ConnectedMerchantState = {
  isConnected: false,
  merchantId: "acc_demo_test_01",
  name: "Acme India Retail Ltd",
  mode: "test",
  authType: "env",
  maskedKeyId: "rzp_test_••••••••",
};

const MerchantModeContext = createContext<MerchantModeContextType>({
  mode: "test",
  setMode: () => {},
  toggleMode: () => {},
  merchant: defaultMerchant,
  isLoading: false,
  isConnectModalOpen: false,
  setIsConnectModalOpen: () => {},
  refreshStatus: async () => {},
  connectAccount: async () => ({ ok: false }),
  disconnectAccount: async () => {},
});

const STORAGE_KEY = "aegis_dashboard_mode";

export function MerchantModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<"test" | "live">("test");
  const [merchant, setMerchant] = useState<ConnectedMerchantState>(defaultMerchant);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState<boolean>(false);

  // Fetch status on initial mount
  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/merchant/status", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setMerchant({
            isConnected: Boolean(data.isConnected),
            merchantId: data.merchantId || "acc_demo_test_01",
            name: data.name || "Acme India Retail Ltd",
            mode: data.mode || "test",
            authType: data.authType || "env",
            maskedKeyId: data.maskedKeyId || null,
            connectedAt: data.connectedAt,
          });
        }
      }
    } catch (err) {
      console.warn("⚠️ [MerchantModeContext] Failed to load status:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Read persisted mode if available
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "live" || saved === "test") {
        setModeState(saved);
      }
    } catch {
      // Ignore localStorage errors
    }
    refreshStatus();
  }, [refreshStatus]);

  const setMode = useCallback((newMode: "test" | "live") => {
    setModeState(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch {
      // Ignore
    }

    // If switching to live and no account is connected, prompt the connect modal
    if (newMode === "live" && !merchant.isConnected) {
      setIsConnectModalOpen(true);
    }
  }, [merchant.isConnected]);

  const toggleMode = useCallback(() => {
    const next = mode === "test" ? "live" : "test";
    setMode(next);
  }, [mode, setMode]);

  const connectAccount = useCallback(async (keyId: string, keySecret: string, merchantName?: string) => {
    try {
      const res = await fetch("/api/merchant/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId, keySecret, merchantName }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        return { ok: false, error: data.error || "Connection failed" };
      }

      await refreshStatus();
      setModeState("live");
      try {
        localStorage.setItem(STORAGE_KEY, "live");
      } catch {
        // Ignore
      }
      setIsConnectModalOpen(false);
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Connection failed";
      return { ok: false, error: message };
    }
  }, [refreshStatus]);

  const disconnectAccount = useCallback(async () => {
    try {
      await fetch("/api/merchant/disconnect", { method: "POST" });
      await refreshStatus();
      setModeState("test");
      try {
        localStorage.setItem(STORAGE_KEY, "test");
      } catch {
        // Ignore
      }
    } catch (err) {
      console.warn("⚠️ [MerchantModeContext] Disconnect error:", err);
    }
  }, [refreshStatus]);

  return (
    <MerchantModeContext.Provider
      value={{
        mode,
        setMode,
        toggleMode,
        merchant,
        isLoading,
        isConnectModalOpen,
        setIsConnectModalOpen,
        refreshStatus,
        connectAccount,
        disconnectAccount,
      }}
    >
      {children}
    </MerchantModeContext.Provider>
  );
}

export function useMerchantMode() {
  return useContext(MerchantModeContext);
}
