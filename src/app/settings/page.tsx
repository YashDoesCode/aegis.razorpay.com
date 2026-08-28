"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Key,
  Sliders,
  Save,
  Loader2,
  PlusCircle,
  Unlink,
  ExternalLink,
  CheckCircle2,
  Radio,
} from "lucide-react";
import { toast } from "sonner";
import { LocalErrorBoundary } from "@/components/ui/error-boundary";
import { useMerchantMode } from "@/context/merchant-mode-context";

export default function SettingsPage() {
  const {
    mode,
    setMode,
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
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Aegis Defense settings saved successfully!");
    } catch (err) {
      console.error("❌ Save settings error:", err);
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
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="w-full max-w-4xl space-y-8"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="font-headline-lg text-[32px] text-ink font-semibold tracking-tight">
                Settings & Rules
              </h1>
              <p className="text-xs text-muted-slate mt-1">
                Configure Aegis autonomous defense parameters and Razorpay account connection
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-primary text-white hover:bg-primary-container text-xs font-semibold rounded-[4px] flat-shadow cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Settings</span>
                </>
              )}
            </Button>
          </div>

          {/* Razorpay Account Connection Card */}
          <div className="bg-white p-6 rounded-[4px] border border-border-subtle flat-shadow space-y-5">
            <div className="flex items-center justify-between border-b border-border-subtle pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-[4px] bg-[#0D1A48] text-white flex items-center justify-center font-bold text-xs">
                  RZP
                </div>
                <div>
                  <h2 className="font-display font-semibold text-ink text-base">
                    Razorpay Merchant Integration
                  </h2>
                  <p className="text-xs text-muted-slate">
                    Manage active account credentials, live API authentication, and mode status
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-[4px] flex items-center gap-1.5 ${
                    mode === "live"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-amber-100 text-amber-800 border border-amber-300"
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
                  <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-success/10 text-success font-semibold">
                    {merchant.isConnected ? "VERIFIED LIVE" : "TEST SANDBOX"}
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
                    Razorpay API Key
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-primary/10 text-primary font-semibold">
                    SERVER PROTECTED
                  </span>
                </div>
                <div className="font-mono text-xs text-muted-slate truncate bg-white p-2.5 rounded-[4px] border border-border-subtle">
                  {merchant.maskedKeyId || "rzp_live_••••••••"}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <p className="text-[11px] text-slate-500">
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
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary-container rounded-[4px] transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Connect Razorpay Account</span>
                </button>
              </div>
            </div>
          </div>

          {/* Defense Automation Rules Card */}
          <div className="bg-white p-6 rounded-[4px] border border-border-subtle flat-shadow space-y-5">
            <div className="flex items-center gap-2 border-b border-border-subtle pb-4">
              <Sliders className="w-5 h-5 text-primary" />
              <div>
                <h2 className="font-display font-semibold text-ink text-base">
                  Autonomous Defense Rules
                </h2>
                <p className="text-xs text-muted-slate">
                  Control how the deterministic scoring engine and rebuttal drafting handle incoming disputes
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-ink">
                    Minimum Winnability Score for Auto-Contest
                  </label>
                  <span className="font-bold text-primary text-xs">
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
                      Automatically assemble POD, invoices, and communication threads upon new chargeback webhook.
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
                      Prevent penalty fees by immediately accepting disputes when essential proofs are missing.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Acquiring Infrastructure Profile Card */}
          <div className="bg-white p-6 rounded-[4px] border border-border-subtle flat-shadow space-y-4">
            <div className="flex items-center gap-2 border-b border-border-subtle pb-4">
              <Shield className="w-5 h-5 text-muted-slate" />
              <div>
                <h2 className="font-display font-semibold text-ink text-base">
                  Acquiring Infrastructure & Database
                </h2>
                <p className="text-xs text-muted-slate">
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
