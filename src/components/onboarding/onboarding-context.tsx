"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { safeStorage, STORAGE_KEYS, OnboardingState } from "@/lib/storage/safeStorage";
import { useStartupContext } from "@/components/startup/startup-context";

export interface TourStep {
  id: string;
  targetId: string;
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "step-overview",
    targetId: "tour-overview-header",
    title: "Dispute Operations Console",
    description: "Your real-time command center for monitoring chargeback exposure, automated winnability probabilities, and connected evidence pipelines.",
    position: "bottom",
  },
  {
    id: "step-hero-metrics",
    targetId: "tour-hero-metrics",
    title: "Total Recovered & Operations Queue",
    description: "Track cumulative revenue protected via automated dispute contestation alongside active queue volume, SLA deadlines, and win ratios.",
    position: "right",
  },
  {
    id: "step-exposure-chart",
    targetId: "tour-exposure-chart",
    title: "Exposure & Recovery Trend Graph",
    description: "Analyze dynamic historical trends comparing total chargeback liability against recovered funds with built-in risk upper bounds.",
    position: "left",
  },
  {
    id: "step-action-queue",
    targetId: "tour-action-queue",
    title: "Autonomous Action Queue",
    description: "Instant operational triage for chargebacks due today, missing delivery proofs, high-risk velocity spikes, and courier tracking logs.",
    position: "top",
  },
  {
    id: "step-winnability-risk",
    targetId: "tour-winnability-risk",
    title: "Winnability & Fraud Signals",
    description: "Deterministic ML distribution models categorize disputes by victory probability while connected carrier logs automatically link proof-of-delivery.",
    position: "top",
  },
  {
    id: "step-settings",
    targetId: "tour-merchant-menu",
    title: "Merchant Controls & Themes",
    description: "Toggle between Live and Test modes, configure automated defense thresholds, manage API keys, and customize workspace themes.",
    position: "bottom",
  },
];

interface OnboardingContextValue {
  showWelcome: boolean;
  isTourActive: boolean;
  currentStepIndex: number;
  currentStep: TourStep;
  totalSteps: number;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { hasCompleted: startupCompleted } = useStartupContext();
  const [showWelcome, setShowWelcome] = useState<boolean>(false);
  const [isTourActive, setIsTourActive] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  useEffect(() => {
    if (!startupCompleted) return;

    const savedState = safeStorage.getItem<OnboardingState>(STORAGE_KEYS.ONBOARDING, {
      completed: false,
      skipped: false,
    });

    if (!savedState.completed && !savedState.skipped) {
      const timer = setTimeout(() => {
        setShowWelcome(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [startupCompleted]);

  const startTour = useCallback(() => {
    setShowWelcome(false);
    setCurrentStepIndex(0);
    setIsTourActive(true);
  }, []);

  const completeTour = useCallback(() => {
    setIsTourActive(false);
    setShowWelcome(false);
    safeStorage.setItem(STORAGE_KEYS.ONBOARDING, {
      completed: true,
      skipped: false,
    });
  }, []);

  const skipTour = useCallback(() => {
    setIsTourActive(false);
    setShowWelcome(false);
    safeStorage.setItem(STORAGE_KEYS.ONBOARDING, {
      completed: false,
      skipped: true,
    });
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStepIndex((prev) => {
      if (prev >= TOUR_STEPS.length - 1) {
        completeTour();
        return prev;
      }
      return prev + 1;
    });
  }, [completeTour]);

  const prevStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const resetOnboarding = useCallback(() => {
    safeStorage.removeItem(STORAGE_KEYS.ONBOARDING);
    setCurrentStepIndex(0);
    setIsTourActive(false);
    setShowWelcome(true);
  }, []);

  const value = useMemo(
    () => ({
      showWelcome,
      isTourActive,
      currentStepIndex,
      currentStep: TOUR_STEPS[currentStepIndex] || TOUR_STEPS[0],
      totalSteps: TOUR_STEPS.length,
      startTour,
      nextStep,
      prevStep,
      skipTour,
      completeTour,
      resetOnboarding,
    }),
    [
      showWelcome,
      isTourActive,
      currentStepIndex,
      startTour,
      nextStep,
      prevStep,
      skipTour,
      completeTour,
      resetOnboarding,
    ]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
