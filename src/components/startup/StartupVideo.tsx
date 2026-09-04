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
        className={`fixed inset-0 z-50 w-screen h-screen flex items-center justify-center bg-white dark:bg-slate-950 overflow-hidden transition-opacity duration-500 ${
          startupState === "FADING_OUT" ? "opacity-0" : "opacity-100"
        }`}
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
          className="w-full h-full object-cover sm:object-contain pointer-events-none select-none transform-gpu bg-white dark:bg-slate-950"
        />
      </div>
    );
  }
);

StartupVideo.displayName = "StartupVideo";
