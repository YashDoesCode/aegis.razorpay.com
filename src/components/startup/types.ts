export type StartupState =
  | "IDLE"
  | "LOADING_VIDEO"
  | "ATTEMPTING_AUTOPLAY"
  | "WAITING_FOR_USER_GESTURE"
  | "PLAYING"
  | "FADING_OUT"
  | "COMPLETE";

export interface StartupContextValue {
  startupState: StartupState;
  hasCompleted: boolean;
  audioUnlocked: boolean;
  error: Error | null;
  setError: (error: Error | null) => void;
  setStartupState: (state: StartupState) => void;
  markComplete: () => void;
  triggerUserStart: () => void;
}
