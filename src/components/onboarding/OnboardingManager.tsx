"use client";

import React from "react";
import { WelcomeModal } from "./WelcomeModal";
import { ProductTour } from "./ProductTour";

export function OnboardingManager() {
  return (
    <>
      <WelcomeModal />
      <ProductTour />
    </>
  );
}
