"use client";

import { useEffect, useRef, useCallback } from "react";
import { useStartupContext } from "./startup-context";
import { StartupState } from "./types";

interface UseStartupPlaybackOptions {
  watchdogTimeoutMs?: number;
}

export function useStartupPlayback({
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
  const watchdogTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const wasPlayingBeforeHiddenRef = useRef<boolean>(false);

  const transitionTo = useCallback(
    (nextState: StartupState) => {
      setStartupState(nextState);
    },
    [setStartupState]
  );

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

      const video = videoRef.current;
      if (!video || hasCompleted) return;

      if (startupState === "PLAYING" && video.muted) {
        try {
          video.muted = false;
          video.volume = 1.0;
          triggerUserStart();
        } catch {}
      } else if (
        startupState === "WAITING_FOR_USER_GESTURE" ||
        startupState === "ATTEMPTING_AUTOPLAY" ||
        startupState === "LOADING_VIDEO"
      ) {
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
            markComplete();
          }
        }
      }
    },
    [startupState, hasCompleted, triggerUserStart, transitionTo, markComplete]
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

  useEffect(() => {
    if (hasCompleted) return;

    if (startupState === "IDLE") {
      transitionTo("LOADING_VIDEO");
    }

    if (startupState === "LOADING_VIDEO" || startupState === "ATTEMPTING_AUTOPLAY") {
      watchdogTimerRef.current = setTimeout(() => {
        markComplete();
      }, watchdogTimeoutMs);
    }

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
      handleUserGesture(e);
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [hasCompleted, handleUserGesture]);

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
