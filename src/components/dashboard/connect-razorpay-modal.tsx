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
  const { isConnectModalOpen, setIsConnectModalOpen, connectAccount, merchant } =
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-[4px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#0D1A48] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[4px] bg-[#305EFF] flex items-center justify-center text-white">
              <Shield className="w-4 h-4" />
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
            className="p-1 rounded-[4px] text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
          <button
            type="button"
            onClick={() => setTab("keys")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              tab === "keys"
                ? "border-[#305EFF] text-[#305EFF]"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            API Key & Secret
          </button>
          <button
            type="button"
            onClick={() => setTab("oauth")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              tab === "oauth"
                ? "border-[#305EFF] text-[#305EFF]"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Razorpay OAuth
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {tab === "keys" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-[4px] border border-slate-200">
                Enter your Razorpay <strong>Live</strong> or <strong>Test</strong> API Key credentials from the{" "}
                <a
                  href="https://dashboard.razorpay.com/app/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#305EFF] font-medium hover:underline inline-flex items-center gap-0.5"
                >
                  Razorpay Dashboard &rarr; API Keys
                </a>
                . Aegis verifies permissions with an immediate server-side test call.
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Merchant / Business Name (Optional)
                </label>
                <input
                  type="text"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  placeholder="e.g. Acme India Retail Ltd"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-[#305EFF] focus:border-[#305EFF] bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Razorpay Key ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={keyId}
                  onChange={(e) => setKeyId(e.target.value)}
                  placeholder="rzp_live_... or rzp_test_..."
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-[#305EFF] focus:border-[#305EFF] bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Razorpay Key Secret <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={keySecret}
                  onChange={(e) => setKeySecret(e.target.value)}
                  placeholder="••••••••••••••••••••••••"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-[#305EFF] focus:border-[#305EFF] bg-white"
                />
              </div>

              {/* Status alerts */}
              {errorMsg && (
                <div className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-[4px]">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-start gap-2 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-[4px]">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Credentials stored server-side only</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsConnectModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-300 rounded-[4px] hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#305EFF] hover:bg-[#274cd6] rounded-[4px] disabled:opacity-50 transition-colors"
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
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-[4px] text-xs text-slate-700 space-y-2">
                <p className="font-semibold text-slate-900">
                  Razorpay Partner App OAuth 2.0
                </p>
                <p className="leading-relaxed">
                  For automated partner access, you can authorize Aegis via Razorpay OAuth 2.0 protocol with the `read_only` or `disputes` scope.
                </p>
                <div className="p-2 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-[3px] overflow-x-auto">
                  https://auth.razorpay.com/authorize?client_id=...&amp;response_type=code&amp;scope=read_only
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-[4px] text-xs text-blue-800">
                <strong>Development Note:</strong> For hackathon evaluation and custom merchant accounts, direct <strong>API Key & Secret</strong> connection provides immediate 1-click verification.
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setTab("keys")}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#305EFF] hover:bg-[#274cd6] rounded-[4px] transition-colors"
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
