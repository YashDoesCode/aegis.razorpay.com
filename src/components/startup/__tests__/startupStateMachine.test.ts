import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StartupState } from "../types";

// Simulates the exact state machine transitions and invariants of the Aegis startup system
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

  public async attemptAutoplay(mockPlayPromise: () => Promise<void>) {
    if (this.hasCompleted) return;
    this.state = "ATTEMPTING_AUTOPLAY";
    this.isMuted = false;
    this.volume = 1.0;

    try {
      await mockPlayPromise();
      this.audioUnlocked = true;
      this.state = "PLAYING";
    } catch {
      // Autoplay blocked by browser policy
      this.state = "WAITING_FOR_USER_GESTURE";
    }
  }

  public async handleUserGesture(mockPlayPromise: () => Promise<void>) {
    if (this.hasCompleted) return;
    if (
      this.state === "WAITING_FOR_USER_GESTURE" ||
      this.state === "ATTEMPTING_AUTOPLAY" ||
      this.state === "LOADING_VIDEO"
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

  public handleVisibilityChange(visibilityState: "visible" | "hidden", isVideoPaused: boolean, pauseFn: () => void, playFn: () => Promise<void>) {
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

  it("handles Case 1: Autoplay allowed with sound (immediate resolution)", async () => {
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

  it("handles Case 2: Autoplay blocked with sound -> transitions to WAITING_FOR_USER_GESTURE without muting", async () => {
    const harness = new StartupStateMachineHarness();
    harness.mount();

    const notAllowedError = new Error("play() failed because the user didn't interact with the document first.");
    notAllowedError.name = "NotAllowedError";

    const mockPlay = vi.fn().mockRejectedValue(notAllowedError);
    await harness.attemptAutoplay(mockPlay);

    expect(mockPlay).toHaveBeenCalledTimes(1);
    expect(harness.state).toBe("WAITING_FOR_USER_GESTURE");
    expect(harness.hasCompleted).toBe(false);
    expect(harness.isMuted).toBe(false); // CRITICAL: Never silently muted!
  });

  it("recovers from WAITING_FOR_USER_GESTURE on user click/tap/keypress and unlocks sound", async () => {
    const harness = new StartupStateMachineHarness();
    harness.mount();

    // 1. Initial attempt fails
    const mockPlayFail = vi.fn().mockRejectedValue(new Error("NotAllowedError"));
    await harness.attemptAutoplay(mockPlayFail);
    expect(harness.state).toBe("WAITING_FOR_USER_GESTURE");

    // 2. User clicks / interacts
    const mockPlaySuccess = vi.fn().mockResolvedValue(undefined);
    await harness.handleUserGesture(mockPlaySuccess);

    expect(mockPlaySuccess).toHaveBeenCalledTimes(1);
    expect(harness.state).toBe("PLAYING");
    expect(harness.audioUnlocked).toBe(true);
    expect(harness.isMuted).toBe(false);
  });

  it("transitions from PLAYING -> FADING_OUT -> COMPLETE upon video completion", () => {
    const harness = new StartupStateMachineHarness(250);
    harness.mount();
    harness.state = "PLAYING";

    harness.handleVideoEnded();
    expect(harness.state).toBe("FADING_OUT");
    expect(harness.hasCompleted).toBe(false);

    // Fast-forward fade duration (250ms)
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

    // Advance 10 seconds without video progress
    vi.advanceTimersByTime(10000);

    expect(harness.state).toBe("COMPLETE");
    expect(harness.hasCompleted).toBe(true);
  });

  it("handles document visibility changes (pauses in background, resumes when active)", async () => {
    const harness = new StartupStateMachineHarness();
    harness.mount();
    harness.state = "PLAYING";

    const pauseFn = vi.fn();
    const playFn = vi.fn().mockResolvedValue(undefined);

    // Tab hidden
    harness.handleVisibilityChange("hidden", false, pauseFn, playFn);
    expect(pauseFn).toHaveBeenCalledTimes(1);
    expect(harness.wasPlayingBeforeHidden).toBe(true);

    // Tab restored
    harness.handleVisibilityChange("visible", true, pauseFn, playFn);
    expect(playFn).toHaveBeenCalledTimes(1);
    expect(harness.wasPlayingBeforeHidden).toBe(false);
  });

  it("never loops or replays once COMPLETE has been reached", async () => {
    const harness = new StartupStateMachineHarness();
    harness.markComplete();

    expect(harness.hasCompleted).toBe(true);
    expect(harness.state).toBe("COMPLETE");

    // Re-mount / navigation attempt
    harness.mount();
    expect(harness.state).toBe("COMPLETE");

    const mockPlay = vi.fn();
    await harness.attemptAutoplay(mockPlay);
    expect(mockPlay).not.toHaveBeenCalled();
    expect(harness.state).toBe("COMPLETE");
  });
});
