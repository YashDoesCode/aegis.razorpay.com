"use client";

import React from "react";
import { useStartupPlayback } from "./useStartupPlayback";
import { StartupOverlay } from "./StartupOverlay";
import { StartupVideo } from "./StartupVideo";

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

  if (hasCompleted && startupState === "COMPLETE") {
    return null;
  }

  return (
    <StartupOverlay
      startupState={startupState}
      onUserGesture={handleUserGesture}
    >
      <StartupVideo
        ref={videoRef}
        startupState={startupState}
        onCanPlay={attemptAutoplay}
        onEnded={handleVideoEnded}
        onError={handleVideoError}
      />
    </StartupOverlay>
  );
}
