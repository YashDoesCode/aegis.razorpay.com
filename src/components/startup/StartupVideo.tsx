"use client";

import React, { forwardRef } from "react";
import { StartupState } from "./types";

interface StartupVideoProps {
  startupState: StartupState;
  onCanPlay: () => void;
  onEnded: () => void;
  onError: (e: React.SyntheticEvent<HTMLVideoElement, Event>) => void;
  videoSrc?: string;
}

export const StartupVideo = forwardRef<HTMLVideoElement, StartupVideoProps>(
  (
    {
      startupState,
      onCanPlay,
      onEnded,
      onError,
      videoSrc = "/Intro.mp4",
    },
    ref
  ) => {
    return (
      <div
        className={`relative w-full h-full flex items-center justify-center bg-white overflow-hidden transition-opacity duration-300 ${
          startupState === "FADING_OUT" ? "opacity-0" : "opacity-100"
        }`}
      >
        <video
          ref={ref}
          src={videoSrc}
          playsInline
          preload="auto"
          muted={false}
          controls={false}
          disablePictureInPicture
          aria-hidden="true"
          onCanPlay={onCanPlay}
          onEnded={onEnded}
          onError={onError}
          className="w-full h-full object-contain pointer-events-none select-none transform-gpu bg-white"
        />
      </div>
    );
  }
);

StartupVideo.displayName = "StartupVideo";
