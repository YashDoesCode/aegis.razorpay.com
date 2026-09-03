"use client";

import React, { useState } from "react";
import { useMerchantMode } from "@/context/merchant-mode-context";
import {
  X,
  Shield,
  KeyRound,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  ArrowRight,
} from "lucide-react";

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
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!keyId.trim() || !keySecret.trim()) {
      setErrorMsg("Please provide both Razorpay Key ID and Key Secret.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await connectAccount(keyId.trim(), keySecret.trim(), merchantName.trim() || undefined);
      if (result.ok) {
        setSuccessMsg("Account verified and connected successfully! Live mode is now active.");
        setTimeout(() => {
          setIsConnectModalOpen(false);
          setSuccessMsg(null);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0D1A48] text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-xs">
              <Shield className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Connect Razorpay Account
              </h3>
              <p className="text-xs text-slate-300">
                Authorize Aegis to manage real disputes via official API
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsConnectModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
          <button
            type="button"
            onClick={() => setTab("keys")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              tab === "keys"
                ? "border-primary text-primary"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            API Key & Secret
          </button>
          <button
            type="button"
            onClick={() => setTab("oauth")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              tab === "oauth"
                ? "border-primary text-primary"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Razorpay OAuth
          </button>
        </div>

        <div className="p-6">
          {tab === "keys" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Merchant / Business Name (Optional)
                </label>
                <input
                  type="text"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  placeholder="e.g. Acme India Retail Ltd"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Razorpay Key ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={keyId}
                  onChange={(e) => setKeyId(e.target.value)}
                  placeholder="rzp_live_... or rzp_test_..."
                  className="w-full px-3.5 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Razorpay Key Secret <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={keySecret}
                  onChange={(e) => setKeySecret(e.target.value)}
                  placeholder="••••••••••••••••••••••••"
                  className="w-full px-3.5 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white transition-all"
                />
              </div>

              {errorMsg && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Credentials stored server-side only</span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setIsConnectModalOpen(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-container rounded-xl disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Authorize & Connect
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-2">
                <p className="font-semibold text-slate-900">
                  Razorpay Partner App OAuth 2.0
                </p>
                <p className="leading-relaxed">
                  For automated partner access, you can authorize Aegis via Razorpay OAuth 2.0 protocol with the `read_only` or `disputes` scope.
                </p>
                <div className="p-2.5 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-lg overflow-x-auto">
                  https://auth.razorpay.com/authorize?client_id=...&amp;response_type=code&amp;scope=read_only
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
                <strong>Development Note:</strong> Direct <strong>API Key & Secret</strong> connection provides immediate 1-click verification.
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setTab("keys")}
                  className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-container rounded-xl transition-colors cursor-pointer"
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
