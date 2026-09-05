"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStartupPlayback } from "./useStartupPlayback";
import { StartupOverlay } from "./StartupOverlay";
import { StartupVideo } from "./StartupVideo";
import { useTheme } from "@/context/theme-context";

export function StartupExperience() {
  const {
    videoRef,
    startupState,
    hasCompleted,
    attemptAutoplay,
    handleUserGesture,
    handleVideoEnded,
    handleVideoError,
  } = useStartupPlayback();

  const { theme } = useTheme();
  const isDark = theme === "dark" || theme === "amoled";
  const videoSrc = isDark ? "/Intro (B&W).mp4" : "/Intro.mp4";

  return (
    <AnimatePresence mode="wait">
      {!hasCompleted && (
        <motion.div
          key="startup-experience-container"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: 0.45, ease: "easeInOut" },
          }}
          className="fixed inset-0 z-[99999] pointer-events-auto"
        >
          <StartupOverlay
            startupState={startupState}
            onUserGesture={handleUserGesture}
            isDark={isDark}
          >
            <StartupVideo
              ref={videoRef}
              startupState={startupState}
              onCanPlay={attemptAutoplay}
              onEnded={handleVideoEnded}
              onError={handleVideoError}
              videoSrc={videoSrc}
              isDark={isDark}
            />
          </StartupOverlay>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
