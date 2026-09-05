"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Sparkles, FileText, ArrowRight, X } from "lucide-react";
import { useOnboarding } from "./onboarding-context";

export function WelcomeModal() {
  const { showWelcome, startTour, skipTour } = useOnboarding();

  if (!showWelcome) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99998] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={skipTour}
          className="fixed inset-0 bg-background/80 backdrop-blur-xs"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-xl z-10 select-none overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-modal-title"
        >
          <button
            type="button"
            onClick={skipTour}
            aria-label="Close welcome modal"
            className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-2xs">
              <Shield className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold tracking-tight text-foreground">
                  Razorpay Aegis
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                  Console
                </span>
              </div>
              <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                Autonomous Dispute Defense
              </span>
            </div>
          </div>

          <div className="space-y-1 mb-5">
            <h2
              id="welcome-modal-title"
              className="text-lg font-semibold tracking-tight text-foreground"
            >
              Welcome to Razorpay Aegis
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your operations console for dispute defense, fraud intelligence, and evidence-backed recovery.
            </p>
          </div>

          <div className="space-y-2 mb-5">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border">
              <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-medium text-foreground">
                  Winnability Scoring
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Deterministic win probability calculated for every chargeback.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-medium text-foreground">
                  Automated Evidence Pipelines
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Seamless carrier PoD and GST invoice auto-matching.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border">
              <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-medium text-foreground">
                  One-Click Representment Staging
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Strict draft contestation safely integrated with Razorpay API.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
            <button
              type="button"
              onClick={skipTour}
              className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Skip tour
            </button>

            <button
              type="button"
              onClick={startTour}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-primary hover:opacity-90 text-primary-foreground rounded-lg text-xs font-medium shadow-2xs transition-opacity cursor-pointer"
            >
              <span>Get started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
