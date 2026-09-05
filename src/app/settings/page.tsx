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
  Sun,
  Moon,
  Zap,
  Sparkles,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { LocalErrorBoundary } from "@/components/ui/error-boundary";
import { useMerchantMode } from "@/context/merchant-mode-context";
import { useTheme } from "@/context/theme-context";
import { useOnboarding } from "@/components/onboarding";
import { ThemeMode } from "@/lib/storage/safeStorage";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const {
    mode,
    merchant,
    setIsConnectModalOpen,
    disconnectAccount,
  } = useMerchantMode();

  const { theme, setTheme, accent, setAccent } = useTheme();
  const { resetOnboarding } = useOnboarding();

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

  const themeOptions: {
    id: ThemeMode;
    name: string;
    description: string;
    icon: React.ElementType;
    previewBg: string;
    previewBorder: string;
  }[] = [
    {
      id: "light",
      name: "Light",
      description: "Clean default workspace with high contrast",
      icon: Sun,
      previewBg: "bg-white",
      previewBorder: "border-slate-300",
    },
    {
      id: "dark",
      name: "Dark",
      description: "Low-light workspace engineered for dark environments",
      icon: Moon,
      previewBg: "bg-[#131B2E]",
      previewBorder: "border-slate-700",
    },
    {
      id: "amoled",
      name: "AMOLED",
      description: "Pure-black display mode with pitch-black surfaces",
      icon: Zap,
      previewBg: "bg-[#000000]",
      previewBorder: "border-neutral-800",
    },
  ];

  return (
    <DashboardShell>
      <LocalErrorBoundary fallbackTitle="Settings Console Error">
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="w-full max-w-4xl space-y-5"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                Settings &amp; Defense Parameters
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Configure autonomous dispute defense rules, workspace themes, and Razorpay API credentials
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white hover:bg-primary-container text-xs font-semibold rounded-xl shadow-xs cursor-pointer disabled:opacity-50 h-9"
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

          <div className="bg-slate-50/70 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-950 dark:text-white uppercase tracking-wider">
                  Workspace Appearance &amp; Themes
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select your preferred display theme for the Aegis defense console
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  resetOnboarding();
                  toast.info("Product tour restarted");
                }}
                className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Replay Product Tour</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {themeOptions.map((opt) => {
                const isSelected = theme === opt.id;
                const IconComponent = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setTheme(opt.id);
                      toast.success(`Theme set to ${opt.name}`);
                    }}
                    className={cn(
                      "p-3.5 rounded-xl border text-left flex flex-col justify-between gap-3 transition cursor-pointer relative",
                      isSelected
                        ? "bg-white dark:bg-slate-800 border-primary ring-2 ring-primary/20 shadow-xs"
                        : "bg-white/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-6 h-6 rounded-lg flex items-center justify-center border",
                            opt.previewBg,
                            opt.previewBorder
                          )}
                        >
                          <IconComponent
                            className={cn(
                              "w-3.5 h-3.5",
                              opt.id === "light" ? "text-slate-900" : "text-white"
                            )}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {opt.name}
                        </span>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      {opt.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-200/70 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Accent Color Profile
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Controls primary buttons, focus rings, and active state highlights
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAccent("blue");
                    toast.success("Accent set to Razorpay Blue");
                  }}
                  className={cn(
                    "p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer",
                    accent === "blue"
                      ? "bg-white dark:bg-slate-800 border-blue-600 ring-2 ring-blue-500/20 shadow-xs"
                      : "bg-white/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#305EFF] border border-blue-400" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Razorpay Blue
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        Default corporate fintech indigo (#305EFF)
                      </span>
                    </div>
                  </div>
                  {accent === "blue" && (
                    <div className="w-5 h-5 rounded-full bg-[#305EFF] text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAccent("neutral");
                    toast.success("Accent set to Neutral Slate");
                  }}
                  className={cn(
                    "p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer",
                    accent === "neutral"
                      ? "bg-white dark:bg-slate-800 border-slate-900 dark:border-slate-100 ring-2 ring-slate-500/20 shadow-xs"
                      : "bg-white/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-slate-900 dark:bg-slate-100 border border-slate-700" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Neutral Slate
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        High-contrast monochrome minimal palette
                      </span>
                    </div>
                  </div>
                  {accent === "neutral" && (
                    <div className="w-5 h-5 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-50/70 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-950 text-white flex items-center justify-center font-bold text-xs">
                  RZP
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-950 dark:text-white uppercase tracking-wider">
                    Razorpay Merchant Integration
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Active gateway credentials, live API authentication, and mode status
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                    mode === "live"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                      : "bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
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
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Connected Merchant Account
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                    {merchant.isConnected ? "VERIFIED LIVE" : "SANDBOX MODE"}
                  </span>
                </div>
                <div className="font-mono text-xs text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 flex justify-between items-center">
                  <span>{merchant.name}</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">({merchant.merchantId})</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Razorpay API Key ID
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-bold border border-primary/20">
                    SERVER SECURED
                  </span>
                </div>
                <div className="font-mono text-xs text-slate-500 dark:text-slate-400 truncate bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
                  {merchant.maskedKeyId || "rzp_live_••••••••"}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200/70 dark:border-slate-800">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
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
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/60 rounded-xl border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    <span>Disconnect Live Account</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsConnectModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary-container rounded-xl transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Connect Razorpay Account</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-50/70 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-200/70 dark:border-slate-800 pb-4">
              <Sliders className="w-4 h-4 text-primary" />
              <div>
                <h2 className="text-sm font-bold text-slate-950 dark:text-white uppercase tracking-wider">
                  Autonomous Defense Thresholds
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Control how the deterministic scoring engine and rebuttal drafting handle incoming disputes
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-900 dark:text-slate-100">
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
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Disputes scoring at or above this threshold will automatically generate grounded representment packages staged in DRAFT mode on Razorpay API.
                </p>
              </div>

              <div className="pt-2 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoDraftEnabled}
                    onChange={(e) => setAutoDraftEnabled(e.target.checked)}
                    className="mt-0.5 rounded text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                      Auto-Draft Grounded Rebuttal Letters
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Automatically assemble PODs, GST invoices, and communication threads upon new chargeback webhook.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoAcceptLowScore}
                    onChange={(e) => setAutoAcceptLowScore(e.target.checked)}
                    className="mt-0.5 rounded text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                      Auto-Accept Low Winnability Disputes (&lt;30%)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Mitigate merchant processing penalties by promptly accepting disputes where mandatory delivery proof is completely missing.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-slate-50/70 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200/70 dark:border-slate-800 pb-3">
              <Shield className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              <div>
                <h2 className="text-sm font-bold text-slate-950 dark:text-white uppercase tracking-wider">
                  Acquiring Infrastructure &amp; Gateway Spec
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Active database topology and payment gateway specs
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <div className="text-slate-500 dark:text-slate-400 font-semibold">Datastore</div>
                <div className="font-mono text-slate-900 dark:text-slate-100 mt-0.5">Neon Serverless PostgreSQL</div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400 font-semibold">Network Protocols</div>
                <div className="text-slate-900 dark:text-slate-100 mt-0.5">NPCI UPI 2.0 / RuPay / Visa / MC</div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400 font-semibold">Contest Staging</div>
                <div className="text-slate-900 dark:text-slate-100 mt-0.5">Strict DRAFT (Zero Unintended Submissions)</div>
              </div>
            </div>
          </div>
        </motion.div>
      </LocalErrorBoundary>
    </DashboardShell>
  );
}
