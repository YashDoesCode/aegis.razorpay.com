"use client";

import React, { useState } from "react";
import {
  X,
  KeyRound,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { useMerchantMode } from "@/context/merchant-mode-context";

export function ConnectRazorpayModal() {
  const { isConnectModalOpen, setIsConnectModalOpen, connectAccount } =
    useMerchantMode();
  const [tab, setTab] = useState<"keys" | "oauth">("keys");
  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isConnectModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyId.trim() || !keySecret.trim()) {
      setErrorMsg("Please provide both Key ID and Key Secret.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const result = await connectAccount(
        keyId.trim(),
        keySecret.trim(),
        merchantName.trim() || undefined
      );

      if (result.ok) {
        setSuccessMsg("Merchant account verified & connected successfully!");
        setTimeout(() => {
          setIsConnectModalOpen(false);
        }, 1200);
      } else {
        setErrorMsg(result.error || "Failed to verify Razorpay credentials.");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Connection failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-card rounded-xl shadow-lg border border-border overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/40 text-foreground">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-2xs">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-foreground tracking-tight">
                Connect Razorpay Account
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Authorize Aegis to manage real disputes via official API
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsConnectModalOpen(false)}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex border-b border-border bg-card px-5 pt-2">
          <button
            type="button"
            onClick={() => setTab("keys")}
            className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              tab === "keys"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            API Key &amp; Secret
          </button>
          <button
            type="button"
            onClick={() => setTab("oauth")}
            className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              tab === "oauth"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Razorpay OAuth
          </button>
        </div>

        <div className="p-5">
          {tab === "keys" ? (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="text-xs text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-lg border border-border">
                Enter your Razorpay <strong>Live</strong> or <strong>Test</strong> API Key credentials from the{" "}
                <a
                  href="https://dashboard.razorpay.com/app/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary font-medium hover:underline inline-flex items-center gap-0.5"
                >
                  Razorpay Dashboard &rarr; API Keys
                </a>
                . Aegis verifies permissions with an immediate server-side test call.
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Merchant / Business Name (Optional)
                </label>
                <input
                  type="text"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  placeholder="e.g. Acme India Retail Ltd"
                  className="w-full px-3 py-1.5 text-xs border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-card text-foreground transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Razorpay Key ID <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={keyId}
                  onChange={(e) => setKeyId(e.target.value)}
                  placeholder="rzp_live_... or rzp_test_..."
                  className="w-full px-3 py-1.5 text-xs font-mono border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-card text-foreground transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Razorpay Key Secret <span className="text-destructive">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={keySecret}
                  onChange={(e) => setKeySecret(e.target.value)}
                  placeholder="••••••••••••••••••••••••"
                  className="w-full px-3 py-1.5 text-xs font-mono border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-card text-foreground transition-colors"
                />
              </div>

              {errorMsg && (
                <div className="flex items-start gap-2 p-2.5 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-start gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-lg">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border">
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Lock className="w-3.5 h-3.5 opacity-60" />
                  <span>Credentials stored server-side only</span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setIsConnectModalOpen(false)}
                    className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-primary-foreground bg-primary hover:opacity-90 rounded-lg disabled:opacity-50 transition-opacity shadow-2xs cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Authorize &amp; Connect
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-3.5">
              <div className="p-3.5 bg-muted/40 border border-border rounded-lg text-xs text-foreground space-y-2">
                <p className="font-medium text-foreground">
                  Razorpay Partner App OAuth 2.0
                </p>
                <p className="leading-relaxed text-muted-foreground">
                  For automated partner access, you can authorize Aegis via Razorpay OAuth 2.0 protocol with the `read_only` or `disputes` scope.
                </p>
                <div className="p-2 bg-muted text-foreground font-mono text-[10px] rounded border border-border overflow-x-auto">
                  https://auth.razorpay.com/authorize?client_id=...&amp;response_type=code&amp;scope=read_only
                </div>
              </div>

              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs text-foreground">
                <strong className="font-medium">Direct API Key &amp; Secret</strong> connection provides immediate 1-click verification.
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setTab("keys")}
                  className="px-3.5 py-1.5 text-xs font-medium text-primary-foreground bg-primary hover:opacity-90 rounded-lg transition-opacity cursor-pointer shadow-2xs"
                >
                  Use API Key Setup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
