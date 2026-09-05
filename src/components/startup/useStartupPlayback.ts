"use client";

import { useEffect, useRef, useCallback } from "react";
import { useStartupContext } from "./startup-context";
import { StartupState } from "./types";

interface UseStartupPlaybackOptions {
  watchdogTimeoutMs?: number;
}

export function useStartupPlayback({
  watchdogTimeoutMs = 3500,
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
  const watchdogTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const wasPlayingBeforeHiddenRef = useRef<boolean>(false);

  const transitionTo = useCallback(
    (nextState: StartupState) => {
      setStartupState(nextState);
    },
    [setStartupState]
  );

  const handleVideoEnded = useCallback(() => {
    isPlayingRef.current = false;
    transitionTo("COMPLETE");
    markComplete();
  }, [transitionTo, markComplete]);

  const handleVideoError = useCallback(() => {
    isPlayingRef.current = false;
    markComplete();
  }, [markComplete]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || hasCompleted) return;
    if (video.duration && video.currentTime >= video.duration - 0.2) {
      handleVideoEnded();
    }
  }, [hasCompleted, handleVideoEnded]);

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
        isPlayingRef.current = true;
        triggerUserStart();
        transitionTo("PLAYING");
      }
    } catch {
      try {
        video.muted = true;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          await playPromise;
          isPlayingRef.current = true;
          transitionTo("PLAYING");
        }
      } catch {
        isPlayingRef.current = false;
        markComplete();
      }
    }
  }, [hasCompleted, transitionTo, triggerUserStart, markComplete]);

  const handleUserGesture = useCallback(
    async (e?: React.SyntheticEvent | Event) => {
      if (e && typeof e.stopPropagation === "function") {
        e.stopPropagation();
      }
      markComplete();
    },
    [markComplete]
  );

  useEffect(() => {
    if (hasCompleted) return;

    if (startupState === "IDLE") {
      transitionTo("LOADING_VIDEO");
    }

    watchdogTimerRef.current = setTimeout(() => {
      markComplete();
    }, watchdogTimeoutMs);

    return () => {
      if (watchdogTimerRef.current) {
        clearTimeout(watchdogTimerRef.current);
      }
    };
  }, [hasCompleted, startupState, transitionTo, markComplete, watchdogTimeoutMs]);

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
          video.play().catch(() => {});
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [hasCompleted, startupState]);

  useEffect(() => {
    if (hasCompleted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        markComplete();
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [hasCompleted, markComplete]);

  return {
    videoRef,
    startupState,
    hasCompleted,
    audioUnlocked,
    attemptAutoplay,
    handleUserGesture,
    handleVideoEnded,
    handleVideoError,
    handleTimeUpdate,
    markComplete,
  };
}
