"use client";

import { useEffect, useRef, useCallback } from "react";
import { useStartupContext } from "./startup-context";
import { StartupState } from "./types";

interface UseStartupPlaybackOptions {
  fadeDurationMs?: number;
  watchdogTimeoutMs?: number;
}

export function useStartupPlayback({
  fadeDurationMs = 250,
  watchdogTimeoutMs = 12000,
}: UseStartupPlaybackOptions = {}) {
  const {
    startupState,
    setStartupState,
    hasCompleted,
    audioUnlocked,
    triggerUserStart,
    markComplete,
  } = useStartupContext();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const watchdogTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const wasPlayingBeforeHiddenRef = useRef<boolean>(false);

  // Helper to transition state safely
  const transitionTo = useCallback(
    (nextState: StartupState) => {
      setStartupState(nextState);
    },
    [setStartupState]
  );

  // Attempt initial audible autoplay
  const attemptAutoplay = useCallback(async () => {
    const video = videoRef.current;
    if (!video || hasCompleted) return;

    transitionTo("ATTEMPTING_AUTOPLAY");

    try {
      video.muted = false;
      video.volume = 1.0;
      const playPromise = video.play();

      if (playPromise !== undefined) {
        await playPromise;
        // Autoplay succeeded with sound
        isPlayingRef.current = true;
        triggerUserStart();
        transitionTo("PLAYING");
      }
    } catch {
      // Autoplay blocked by browser policy (NotAllowedError, etc.)
      // Gracefully switch to user interaction waiting state
      isPlayingRef.current = false;
      transitionTo("WAITING_FOR_USER_GESTURE");
    }
  }, [hasCompleted, transitionTo, triggerUserStart]);

  // Handle user interaction recovery (click, touch, or keypress)
  const handleUserGesture = useCallback(
    async (e?: React.SyntheticEvent | Event) => {
      if (e && typeof e.stopPropagation === "function") {
        e.stopPropagation();
      }

      const video = videoRef.current;
      if (!video || hasCompleted) return;

      if (startupState === "WAITING_FOR_USER_GESTURE" || startupState === "ATTEMPTING_AUTOPLAY" || startupState === "LOADING_VIDEO") {
        try {
          video.muted = false;
          video.volume = 1.0;
          const playPromise = video.play();

          if (playPromise !== undefined) {
            await playPromise;
            isPlayingRef.current = true;
            triggerUserStart();
            transitionTo("PLAYING");
          }
        } catch (err) {
          // If playback still fails for unexpected reasons, fail-safe complete
          console.warn("[Aegis Startup] User gesture playback failed:", err);
          markComplete();
        }
      }
    },
    [startupState, hasCompleted, triggerUserStart, transitionTo, markComplete]
  );

  // Handle video ended
  const handleVideoEnded = useCallback(() => {
    isPlayingRef.current = false;
    transitionTo("FADING_OUT");

    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
    }

    fadeTimerRef.current = setTimeout(() => {
      markComplete();
    }, fadeDurationMs);
  }, [transitionTo, markComplete, fadeDurationMs]);

  // Handle video error (fail-safe recovery)
  const handleVideoError = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement, Event> | Event) => {
      console.warn("[Aegis Startup] Video playback error detected, failing open:", e);
      isPlayingRef.current = false;
      markComplete();
    },
    [markComplete]
  );

  // Initial mount lifecycle & state initiation
  useEffect(() => {
    if (hasCompleted) return;

    if (startupState === "IDLE") {
      transitionTo("LOADING_VIDEO");
    }

    if (startupState === "LOADING_VIDEO" || startupState === "ATTEMPTING_AUTOPLAY") {
      watchdogTimerRef.current = setTimeout(() => {
        console.warn("[Aegis Startup] Watchdog timer expired while loading/attempting playback, unlocking dashboard.");
        markComplete();
      }, watchdogTimeoutMs);
    }

    return () => {
      if (watchdogTimerRef.current) {
        clearTimeout(watchdogTimerRef.current);
      }
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
      }
    };
  }, [hasCompleted, startupState, transitionTo, markComplete, watchdogTimeoutMs]);

  // Visibility change handling
  useEffect(() => {
    if (hasCompleted) return;

    const handleVisibilityChange = () => {
      const video = videoRef.current;
      if (!video) return;

      if (document.visibilityState === "hidden") {
        if (isPlayingRef.current && !video.paused) {
          wasPlayingBeforeHiddenRef.current = true;
          video.pause();
        }
      } else if (document.visibilityState === "visible") {
        if (wasPlayingBeforeHiddenRef.current && startupState === "PLAYING") {
          wasPlayingBeforeHiddenRef.current = false;
          video.play().catch(() => {
            // Autoplay could be lost on visibility change in edge cases
          });
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [hasCompleted, startupState]);

  // Global keydown handler to recover on any keypress when in waiting state
  useEffect(() => {
    if (hasCompleted || startupState !== "WAITING_FOR_USER_GESTURE") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      handleUserGesture(e);
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [hasCompleted, startupState, handleUserGesture]);

  return {
    videoRef,
    startupState,
    hasCompleted,
    audioUnlocked,
    attemptAutoplay,
    handleUserGesture,
    handleVideoEnded,
    handleVideoError,
    markComplete,
  };
}
