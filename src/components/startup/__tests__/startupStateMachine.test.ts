import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StartupState } from "../types";

class StartupStateMachineHarness {
  public state: StartupState = "IDLE";
  public hasCompleted: boolean = false;
  public audioUnlocked: boolean = false;
  public isMuted: boolean = false;
  public volume: number = 1.0;
  public error: Error | null = null;
  public fadeTimer: NodeJS.Timeout | null = null;
  public watchdogTimer: NodeJS.Timeout | null = null;
  public wasPlayingBeforeHidden: boolean = false;

  constructor(
    private fadeDurationMs: number = 250,
    private watchdogTimeoutMs: number = 10000
  ) {}

  public mount() {
    if (this.hasCompleted) return;
    this.state = "LOADING_VIDEO";

    this.watchdogTimer = setTimeout(() => {
      if (!this.hasCompleted && this.state !== "PLAYING") {
        this.markComplete();
      }
    }, this.watchdogTimeoutMs);
  }

  public async attemptAutoplay(
    mockUnmutedPlay: () => Promise<void>,
    mockMutedPlay?: () => Promise<void>
  ) {
    if (this.hasCompleted) return;
    this.state = "ATTEMPTING_AUTOPLAY";
    this.isMuted = false;
    this.volume = 1.0;

    try {
      await mockUnmutedPlay();
      this.audioUnlocked = true;
      this.state = "PLAYING";
    } catch {
      try {
        this.isMuted = true;
        if (mockMutedPlay) {
          await mockMutedPlay();
        } else {
          await mockUnmutedPlay();
        }
        this.state = "PLAYING";
      } catch {
        this.markComplete();
      }
    }
  }

  public async handleUserGesture(mockPlayPromise: () => Promise<void>) {
    if (this.hasCompleted) return;
    if (
      this.state === "WAITING_FOR_USER_GESTURE" ||
      this.state === "ATTEMPTING_AUTOPLAY" ||
      this.state === "LOADING_VIDEO" ||
      (this.state === "PLAYING" && this.isMuted)
    ) {
      try {
        this.isMuted = false;
        this.volume = 1.0;
        await mockPlayPromise();
        this.audioUnlocked = true;
        this.state = "PLAYING";
      } catch (err) {
        this.error = err as Error;
        this.markComplete();
      }
    }
  }

  public handleVideoEnded() {
    this.state = "FADING_OUT";
    if (this.fadeTimer) clearTimeout(this.fadeTimer);

    this.fadeTimer = setTimeout(() => {
      this.markComplete();
    }, this.fadeDurationMs);
  }

  public handleVideoError(err?: Error) {
    this.error = err || new Error("Video decode failure");
    this.markComplete();
  }

  public handleVisibilityChange(
    visibilityState: "visible" | "hidden",
    isVideoPaused: boolean,
    pauseFn: () => void,
    playFn: () => Promise<void>
  ) {
    if (this.hasCompleted) return;

    if (visibilityState === "hidden") {
      if (this.state === "PLAYING" && !isVideoPaused) {
        this.wasPlayingBeforeHidden = true;
        pauseFn();
      }
    } else if (visibilityState === "visible") {
      if (this.wasPlayingBeforeHidden && this.state === "PLAYING") {
        this.wasPlayingBeforeHidden = false;
        playFn().catch(() => {});
      }
    }
  }

  public markComplete() {
    this.state = "COMPLETE";
    this.hasCompleted = true;
    if (this.watchdogTimer) clearTimeout(this.watchdogTimer);
    if (this.fadeTimer) clearTimeout(this.fadeTimer);
  }

  public unmount() {
    if (this.watchdogTimer) clearTimeout(this.watchdogTimer);
    if (this.fadeTimer) clearTimeout(this.fadeTimer);
  }
}

describe("Aegis Startup State Machine & Autoplay Recovery Engine", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes in IDLE and transitions to LOADING_VIDEO on mount", () => {
    const harness = new StartupStateMachineHarness();
    expect(harness.state).toBe("IDLE");
    expect(harness.hasCompleted).toBe(false);

    harness.mount();
    expect(harness.state).toBe("LOADING_VIDEO");
  });

  it("handles unmuted autoplay when allowed by browser", async () => {
    const harness = new StartupStateMachineHarness();
    harness.mount();

    const mockPlay = vi.fn().mockResolvedValue(undefined);
    await harness.attemptAutoplay(mockPlay);

    expect(mockPlay).toHaveBeenCalledTimes(1);
    expect(harness.state).toBe("PLAYING");
    expect(harness.audioUnlocked).toBe(true);
    expect(harness.isMuted).toBe(false);
    expect(harness.volume).toBe(1.0);
  });

  it("handles unmuted autoplay block by immediately falling back to direct muted playback without modal", async () => {
    const harness = new StartupStateMachineHarness();
    harness.mount();

    const notAllowedError = new Error("play() failed because the user didn't interact with the document first.");
    notAllowedError.name = "NotAllowedError";

    const mockUnmutedPlay = vi.fn().mockRejectedValue(notAllowedError);
    const mockMutedPlay = vi.fn().mockResolvedValue(undefined);
    await harness.attemptAutoplay(mockUnmutedPlay, mockMutedPlay);

    expect(mockUnmutedPlay).toHaveBeenCalledTimes(1);
    expect(mockMutedPlay).toHaveBeenCalledTimes(1);
    expect(harness.state).toBe("PLAYING");
    expect(harness.isMuted).toBe(true);
  });

  it("transitions from PLAYING -> FADING_OUT -> COMPLETE upon video completion", () => {
    const harness = new StartupStateMachineHarness(250);
    harness.mount();
    harness.state = "PLAYING";

    harness.handleVideoEnded();
    expect(harness.state).toBe("FADING_OUT");
    expect(harness.hasCompleted).toBe(false);

    vi.advanceTimersByTime(250);

    expect(harness.state).toBe("COMPLETE");
    expect(harness.hasCompleted).toBe(true);
  });

  it("fails open and unlocks dashboard if video error occurs", () => {
    const harness = new StartupStateMachineHarness();
    harness.mount();

    harness.handleVideoError(new Error("Network / decode error"));

    expect(harness.state).toBe("COMPLETE");
    expect(harness.hasCompleted).toBe(true);
    expect(harness.error).toBeDefined();
  });

  it("watchdog timer unlocks dashboard if playback hangs indefinitely", () => {
    const harness = new StartupStateMachineHarness(250, 10000);
    harness.mount();
    expect(harness.state).toBe("LOADING_VIDEO");

    vi.advanceTimersByTime(10000);

    expect(harness.state).toBe("COMPLETE");
    expect(harness.hasCompleted).toBe(true);
  });

  it("handles document visibility changes", async () => {
    const harness = new StartupStateMachineHarness();
    harness.mount();
    harness.state = "PLAYING";

    const pauseFn = vi.fn();
    const playFn = vi.fn().mockResolvedValue(undefined);

    harness.handleVisibilityChange("hidden", false, pauseFn, playFn);
    expect(pauseFn).toHaveBeenCalledTimes(1);
    expect(harness.wasPlayingBeforeHidden).toBe(true);

    harness.handleVisibilityChange("visible", true, pauseFn, playFn);
    expect(playFn).toHaveBeenCalledTimes(1);
    expect(harness.wasPlayingBeforeHidden).toBe(false);
  });

  it("never loops or replays once COMPLETE has been reached", async () => {
    const harness = new StartupStateMachineHarness();
    harness.markComplete();

    expect(harness.hasCompleted).toBe(true);
    expect(harness.state).toBe("COMPLETE");

    harness.mount();
    expect(harness.state).toBe("COMPLETE");

    const mockPlay = vi.fn();
    await harness.attemptAutoplay(mockPlay);
    expect(mockPlay).not.toHaveBeenCalled();
    expect(harness.state).toBe("COMPLETE");
  });
});
