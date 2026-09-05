"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import {
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
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { LocalErrorBoundary } from "@/components/ui/error-boundary";
import { useMerchantMode } from "@/context/merchant-mode-context";
import { useTheme } from "@/context/theme-context";
import { useOnboarding } from "@/components/onboarding";
import { safeStorage, ThemeMode } from "@/lib/storage/safeStorage";
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
  const [showClearConfirm, setShowClearConfirm] = useState(false);

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

  const handleClearLocalCache = () => {
    safeStorage.clearLocalData();
    setTheme("light");
    setAccent("neutral");
    setShowClearConfirm(false);
    toast.success("Local preferences and application cache reset");
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
      description: "Neutral very-dark grey workspace",
      icon: Moon,
      previewBg: "bg-[#181818]",
      previewBorder: "border-[#262626]",
    },
    {
      id: "amoled",
      name: "AMOLED",
      description: "Pure-black display with true #000000 surfaces",
      icon: Zap,
      previewBg: "bg-[#000000]",
      previewBorder: "border-[#1F1F1F]",
    },
  ];

  return (
    <DashboardShell>
      <LocalErrorBoundary fallbackTitle="Settings Console Error">
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="w-full max-w-4xl space-y-4 sm:space-y-5"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                Settings &amp; Defense Parameters
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure autonomous dispute defense rules, appearance profiles, and gateway credentials
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg shadow-xs cursor-pointer disabled:opacity-50 h-8.5"
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

          <div className="bg-card p-4 sm:p-5 rounded-xl border border-border shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Workspace Appearance &amp; Themes
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select your preferred workspace theme and accent profile
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  resetOnboarding();
                  toast.info("Product tour restarted");
                }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Replay Tour</span>
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
                      "p-3 rounded-lg border text-left flex flex-col justify-between gap-3 transition cursor-pointer",
                      isSelected
                        ? "bg-card border-foreground ring-1 ring-foreground shadow-xs"
                        : "bg-muted/40 border-border hover:border-muted-foreground/40"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-5 h-5 rounded-md flex items-center justify-center border",
                            opt.previewBg,
                            opt.previewBorder
                          )}
                        >
                          <IconComponent
                            className={cn(
                              "w-3 h-3",
                              opt.id === "light" ? "text-slate-900" : "text-white"
                            )}
                          />
                        </div>
                        <span className="text-xs font-medium text-foreground">
                          {opt.name}
                        </span>
                      </div>

                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-foreground text-background flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-muted-foreground leading-snug">
                      {opt.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-foreground">
                  Accent Color Profile
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Controls focus rings, primary highlights, and active elements
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAccent("neutral");
                    toast.success("Accent set to Neutral Monochrome (Default)");
                  }}
                  className={cn(
                    "p-3 rounded-lg border text-left flex items-center justify-between transition cursor-pointer",
                    accent === "neutral"
                      ? "bg-card border-foreground ring-1 ring-foreground shadow-xs"
                      : "bg-muted/40 border-border hover:border-muted-foreground/40"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-foreground border border-border" />
                    <div>
                      <span className="text-xs font-medium text-foreground block">
                        Monochrome (Default)
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Restrained, high-contrast minimal fintech palette
                      </span>
                    </div>
                  </div>
                  {accent === "neutral" && (
                    <div className="w-4 h-4 rounded-full bg-foreground text-background flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAccent("blue");
                    toast.success("Accent set to Razorpay Blue");
                  }}
                  className={cn(
                    "p-3 rounded-lg border text-left flex items-center justify-between transition cursor-pointer",
                    accent === "blue"
                      ? "bg-card border-blue-600 ring-1 ring-blue-600 shadow-xs"
                      : "bg-muted/40 border-border hover:border-muted-foreground/40"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-[#305EFF] border border-blue-400" />
                    <div>
                      <span className="text-xs font-medium text-foreground block">
                        Razorpay Blue
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Corporate fintech accent tone (#305EFF)
                      </span>
                    </div>
                  </div>
                  {accent === "blue" && (
                    <div className="w-4 h-4 rounded-full bg-[#305EFF] text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-card p-4 sm:p-5 rounded-xl border border-border shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                  RZP
                </div>
                <div>
                  <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Razorpay Merchant Gateway
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Active gateway credentials and environment mode status
                  </p>
                </div>
              </div>

              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1.5 ${
                  mode === "live"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                    : "bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    mode === "live" ? "bg-emerald-600" : "bg-amber-600"
                  }`}
                />
                {mode === "live" ? "Live Mode" : "Test Mode"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-border bg-muted/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">
                    Connected Merchant
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-foreground font-medium border border-border">
                    {merchant.isConnected ? "VERIFIED LIVE" : "SANDBOX MODE"}
                  </span>
                </div>
                <div className="font-mono text-xs text-foreground bg-card p-2 rounded border border-border flex justify-between items-center">
                  <span>{merchant.name}</span>
                  <span className="text-[11px] text-muted-foreground">({merchant.merchantId})</span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-border bg-muted/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">
                    Razorpay API Key ID
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-foreground font-medium border border-border">
                    ENCRYPTED
                  </span>
                </div>
                <div className="font-mono text-xs text-muted-foreground truncate bg-card p-2 rounded border border-border">
                  {merchant.maskedKeyId || "rzp_live_••••••••"}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border">
              <p className="text-[11px] text-muted-foreground">
                Credentials are encrypted and processed strictly server-side.
              </p>

              <div className="flex items-center gap-2">
                {merchant.isConnected && (
                  <button
                    type="button"
                    onClick={async () => {
                      await disconnectAccount();
                      toast.info("Live account disconnected. Switched to Test Mode.");
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/60 rounded-lg border border-border transition cursor-pointer"
                  >
                    <Unlink className="w-3 h-3" />
                    <span>Disconnect Live Account</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsConnectModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-primary-foreground bg-primary hover:opacity-90 rounded-lg transition cursor-pointer"
                >
                  <PlusCircle className="w-3 h-3" />
                  <span>Connect Razorpay Account</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-card p-4 sm:p-5 rounded-xl border border-border shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Sliders className="w-4 h-4 text-muted-foreground" />
              <div>
                <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Autonomous Defense Thresholds
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Control automated winnability scoring and representment staging
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-foreground">
                    Minimum Winnability Score for Auto-Contest Staging
                  </label>
                  <span className="font-mono font-medium text-foreground text-xs">
                    {minWinnabilityScore}%
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
              </div>

              <div className="pt-2 space-y-2.5">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoDraftEnabled}
                    onChange={(e) => setAutoDraftEnabled(e.target.checked)}
                    className="mt-0.5 rounded text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-xs font-medium text-foreground block">
                      Auto-Draft Grounded Rebuttal Letters
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      Automatically assemble PODs, GST invoices, and communication threads upon new chargeback webhook.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoAcceptLowScore}
                    onChange={(e) => setAutoAcceptLowScore(e.target.checked)}
                    className="mt-0.5 rounded text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-xs font-medium text-foreground block">
                      Auto-Accept Low Winnability Disputes (&lt;30%)
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      Mitigate merchant processing penalties by promptly accepting disputes where mandatory delivery proof is completely missing.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-card p-4 sm:p-5 rounded-xl border border-border shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Local Application Data &amp; Cache
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Clear local browser preferences, saved UI states, and cached tour indicators
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-border transition cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Reset Local App Data</span>
              </button>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Resetting local data removes saved display preferences, cached UI states, onboarding indicators, and sidebar positions from this browser. It does <strong className="text-foreground">not</strong> delete server-side disputes, database records, merchant API credentials, uploaded statements, or audit records.
            </p>

            {showClearConfirm && (
              <div className="p-3.5 rounded-lg border border-border bg-muted/60 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Confirm Local Cache Reset</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Are you sure you want to reset your local browser preferences? Workspace theme and accent will return to defaults.
                </p>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground rounded-md transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleClearLocalCache}
                    className="px-3 py-1 text-xs font-medium bg-rose-600 text-white hover:bg-rose-700 rounded-md shadow-xs transition cursor-pointer"
                  >
                    Confirm Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </LocalErrorBoundary>
    </DashboardShell>
  );
}
