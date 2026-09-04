"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Check } from "lucide-react";
import { useOnboarding } from "./onboarding-context";

interface ElementBounds {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function ProductTour() {
  const {
    isTourActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
  } = useOnboarding();

  const [targetBounds, setTargetBounds] = useState<ElementBounds | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const updateBounds = useCallback(() => {
    if (!isTourActive || !currentStep) {
      setTargetBounds(null);
      return;
    }
    const element = document.getElementById(currentStep.targetId);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetBounds({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      });
      element.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else {
      setTargetBounds(null);
    }
  }, [isTourActive, currentStep]);

  useEffect(() => {
    const timer = setTimeout(updateBounds, 50);
    window.addEventListener("resize", updateBounds);
    window.addEventListener("scroll", updateBounds, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateBounds);
      window.removeEventListener("scroll", updateBounds);
    };
  }, [updateBounds]);

  if (!isTourActive || !currentStep) return null;

  const isLastStep = currentStepIndex === totalSteps - 1;
  const progressPercent = ((currentStepIndex + 1) / totalSteps) * 100;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99995] pointer-events-auto">
        {targetBounds ? (
          <svg className="fixed inset-0 w-full h-full pointer-events-auto">
            <defs>
              <mask id="tour-spotlight-cutout">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={targetBounds.left - 8}
                  y={targetBounds.top - 8}
                  width={targetBounds.width + 16}
                  height={targetBounds.height + 16}
                  rx="16"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(15, 23, 42, 0.65)"
              mask="url(#tour-spotlight-cutout)"
              className="backdrop-blur-md"
            />
          </svg>
        ) : (
          <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-md pointer-events-auto" />
        )}

        {targetBounds && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute rounded-2xl ring-4 ring-blue-500/80 shadow-[0_0_40px_rgba(59,130,246,0.6)] pointer-events-none transition-all duration-300"
            style={{
              top: `${targetBounds.top - 8}px`,
              left: `${targetBounds.left - 8}px`,
              width: `${targetBounds.width + 16}px`,
              height: `${targetBounds.height + 16}px`,
            }}
          />
        )}

        <div className="fixed inset-x-4 bottom-6 sm:bottom-8 z-[99998] flex justify-center pointer-events-auto">
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-3"
            role="region"
            aria-label="Product tour step guidance"
          >
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Step {currentStepIndex + 1} of {totalSteps}
                </span>
              </div>

              <button
                type="button"
                onClick={skipTour}
                aria-label="Exit tour"
                className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {currentStep.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {currentStep.description}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStepIndex === 0}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={skipTour}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition cursor-pointer"
                >
                  Skip
                </button>

                {isLastStep ? (
                  <button
                    type="button"
                    onClick={completeTour}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Finish</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex items-center gap-1 px-4 py-1.5 bg-slate-950 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-full text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
