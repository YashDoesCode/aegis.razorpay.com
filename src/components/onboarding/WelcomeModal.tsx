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
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl z-10 select-none overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-modal-title"
        >
          <button
            type="button"
            onClick={skipTour}
            aria-label="Close welcome modal"
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-2xl bg-slate-950 dark:bg-blue-600 text-white flex items-center justify-center shadow-md">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.75"
                viewBox="0 0 24 24"
              >
                <polygon
                  fill="currentColor"
                  fillOpacity="0.2"
                  points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold tracking-tight text-slate-950 dark:text-white">
                  Razorpay
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-950/80 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-100/60 dark:border-blue-800/60">
                  Aegis
                </span>
              </div>
              <span className="text-[10px] font-medium tracking-wide text-slate-400 dark:text-slate-500 uppercase">
                Autonomous Dispute Defense
              </span>
            </div>
          </div>

          <div className="space-y-1 mb-5">
            <h2
              id="welcome-modal-title"
              className="text-xl font-bold tracking-tight text-slate-950 dark:text-white"
            >
              Welcome to Razorpay Aegis
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Your command center for dispute defense, fraud intelligence, and evidence-backed recovery.
            </p>
          </div>

          <div className="space-y-2.5 mb-6">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
              <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  ML Winnability Scoring
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Deterministic win probability calculated for every chargeback.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
              <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Shield className="w-3.5 h-3.5 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Automated Evidence Pipelines
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Seamless carrier PoD and GST invoice auto-matching.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
              <div className="w-7 h-7 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  One-Click Representment Staging
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Strict DRAFT contestation safely integrated with Razorpay API.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={skipTour}
              className="px-4 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              Skip tour
            </button>

            <button
              type="button"
              onClick={startTour}
              className="flex items-center gap-1.5 px-5 py-2 bg-slate-950 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-full text-xs font-semibold shadow-md transition cursor-pointer"
            >
              <span>Get started</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
