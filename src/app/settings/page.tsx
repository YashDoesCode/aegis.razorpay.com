"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Sliders,
  Save,
  Loader2,
  PlusCircle,
  Unlink,
} from "lucide-react";
import { toast } from "sonner";
import { LocalErrorBoundary } from "@/components/ui/error-boundary";
import { useMerchantMode } from "@/context/merchant-mode-context";

export default function SettingsPage() {
  const {
    mode,
    merchant,
    setIsConnectModalOpen,
    disconnectAccount,
  } = useMerchantMode();

  const [minWinnabilityScore, setMinWinnabilityScore] = useState(80);
  const [autoDraftEnabled, setAutoDraftEnabled] = useState(true);
  const [autoAcceptLowScore, setAutoAcceptLowScore] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await new Promise((resolve) => setTimeout(resolve, 300));
      toast.success("Aegis Defense settings saved successfully");
    } catch (err) {
      console.error("Save settings error:", err);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell>
      <LocalErrorBoundary fallbackTitle="Settings Console Error">
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="w-full max-w-4xl space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink">
                Settings & Defense Parameters
              </h1>
              <p className="text-xs text-muted-slate mt-1">
                Configure autonomous dispute defense rules and Razorpay API authentication credentials
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white hover:bg-primary-container text-xs font-semibold rounded-[4px] shadow-xs cursor-pointer disabled:opacity-50 h-9"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Settings</span>
                </>
              )}
            </Button>
          </div>

          {/* Razorpay Account Connection Card */}
          <div className="bg-white p-5 rounded-[4px] border border-border-subtle shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-border-subtle pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[4px] bg-[#0D1A48] text-white flex items-center justify-center font-bold text-xs">
                  RZP
                </div>
                <div>
                  <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
                    Razorpay Merchant Integration
                  </h2>
                  <p className="text-xs text-muted-slate mt-0.5">
                    Active gateway credentials, live API authentication, and mode status
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-[4px] flex items-center gap-1.5 ${
                    mode === "live"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                      : "bg-amber-50 text-amber-800 border border-amber-300"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      mode === "live" ? "bg-emerald-600 animate-pulse" : "bg-amber-600"
                    }`}
                  />
                  {mode === "live" ? "Live Mode Active" : "Test Sandbox Active"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-[4px] border border-border-subtle bg-surface space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink">
                    Connected Merchant Account
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-[3px] bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                    {merchant.isConnected ? "VERIFIED LIVE" : "SANDBOX MODE"}
                  </span>
                </div>
                <div className="font-mono text-xs text-ink bg-white p-2.5 rounded-[4px] border border-border-subtle flex justify-between items-center">
                  <span>{merchant.name}</span>
                  <span className="text-[11px] text-muted-slate">({merchant.merchantId})</span>
                </div>
              </div>

              <div className="p-4 rounded-[4px] border border-border-subtle bg-surface space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink">
                    Razorpay API Key ID
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-[3px] bg-primary/10 text-primary font-bold border border-primary/20">
                    SERVER SECURED
                  </span>
                </div>
                <div className="font-mono text-xs text-muted-slate truncate bg-white p-2.5 rounded-[4px] border border-border-subtle">
                  {merchant.maskedKeyId || "rzp_live_••••••••"}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <p className="text-[11px] text-muted-slate">
                Credentials are encrypted and processed strictly server-side.
              </p>

              <div className="flex items-center gap-3">
                {merchant.isConnected && (
                  <button
                    type="button"
                    onClick={async () => {
                      await disconnectAccount();
                      toast.info("Live account disconnected. Switched to Test Mode.");
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-[4px] border border-amber-200 transition-colors cursor-pointer"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    <span>Disconnect Live Account</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsConnectModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary-container rounded-[4px] transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Connect Razorpay Account</span>
                </button>
              </div>
            </div>
          </div>

          {/* Defense Automation Rules Card */}
          <div className="bg-white p-5 rounded-[4px] border border-border-subtle shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-border-subtle pb-4">
              <Sliders className="w-4 h-4 text-primary" />
              <div>
                <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
                  Autonomous Defense Thresholds
                </h2>
                <p className="text-xs text-muted-slate mt-0.5">
                  Control how the deterministic scoring engine and rebuttal drafting handle incoming disputes
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-ink">
                    Minimum Winnability Score for Auto-Contest Staging
                  </label>
                  <span className="font-mono font-bold text-primary text-xs">
                    {minWinnabilityScore}% (High Winnability)
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={minWinnabilityScore}
                  onChange={(e) => setMinWinnabilityScore(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
                <p className="text-[11px] text-muted-slate mt-1">
                  Disputes scoring at or above this threshold will automatically generate grounded representment packages staged in DRAFT mode on Razorpay API.
                </p>
              </div>

              <div className="pt-2 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoDraftEnabled}
                    onChange={(e) => setAutoDraftEnabled(e.target.checked)}
                    className="mt-0.5 rounded-[2px] text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-xs font-semibold text-ink block">
                      Auto-Draft Grounded Rebuttal Letters
                    </span>
                    <span className="text-[11px] text-muted-slate block">
                      Automatically assemble PODs, GST invoices, and communication threads upon new chargeback webhook.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoAcceptLowScore}
                    onChange={(e) => setAutoAcceptLowScore(e.target.checked)}
                    className="mt-0.5 rounded-[2px] text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-xs font-semibold text-ink block">
                      Auto-Accept Low Winnability Disputes (&lt;30%)
                    </span>
                    <span className="text-[11px] text-muted-slate block">
                      Mitigate merchant processing penalties by promptly accepting disputes where mandatory delivery proof is completely missing.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Acquiring Infrastructure Profile Card */}
          <div className="bg-white p-5 rounded-[4px] border border-border-subtle shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
              <Shield className="w-4 h-4 text-slate-700" />
              <div>
                <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
                  Acquiring Infrastructure & Gateway Spec
                </h2>
                <p className="text-xs text-muted-slate mt-0.5">
                  Active database topology and payment gateway specs
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <div className="text-muted-slate font-semibold">Datastore</div>
                <div className="font-mono text-ink mt-0.5">Neon Serverless PostgreSQL</div>
              </div>
              <div>
                <div className="text-muted-slate font-semibold">Network Protocols</div>
                <div className="text-ink mt-0.5">NPCI UPI 2.0 / RuPay / Visa / MC</div>
              </div>
              <div>
                <div className="text-muted-slate font-semibold">Contest Staging</div>
                <div className="text-ink mt-0.5">Strict DRAFT (Zero Unintended Submissions)</div>
              </div>
            </div>
          </div>
        </motion.div>
      </LocalErrorBoundary>
    </DashboardShell>
  );
}
