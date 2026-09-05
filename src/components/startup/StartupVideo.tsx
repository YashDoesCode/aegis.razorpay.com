"use client";

import React, { forwardRef } from "react";
import { StartupState } from "./types";

interface StartupVideoProps {
  startupState: StartupState;
  onCanPlay: () => void;
  onEnded: () => void;
  onError: (e: React.SyntheticEvent<HTMLVideoElement, Event>) => void;
  onTimeUpdate?: () => void;
  videoSrc?: string;
  isDark?: boolean;
}

export const StartupVideo = forwardRef<HTMLVideoElement, StartupVideoProps>(
  (
    {
      startupState,
      onCanPlay,
      onEnded,
      onError,
      onTimeUpdate,
      videoSrc = "/intro-bw.mp4",
      isDark = true,
    },
    ref
  ) => {
    return (
      <div
        className={`fixed inset-0 z-50 w-screen h-screen flex items-center justify-center overflow-hidden transition-opacity duration-500 ${
          isDark ? "bg-[#000000]" : "bg-white"
        } ${startupState === "FADING_OUT" ? "opacity-0" : "opacity-100"}`}
      >
        <video
          ref={ref}
          src={videoSrc}
          playsInline
          autoPlay
          preload="auto"
          controls={false}
          disablePictureInPicture
          aria-hidden="true"
          onCanPlay={onCanPlay}
          onEnded={onEnded}
          onError={onError}
          onTimeUpdate={onTimeUpdate}
          className={`w-full h-full object-contain pointer-events-none select-none transform-gpu ${
            isDark ? "bg-[#000000]" : "bg-white"
          }`}
        />
      </div>
    );
  }
);

StartupVideo.displayName = "StartupVideo";
