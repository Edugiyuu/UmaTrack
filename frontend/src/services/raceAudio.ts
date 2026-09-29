/**
 * Sound hooks for the race (docs/tasks/23-race-skill-fx.md, part D). The race only
 * announces what happened; which file plays, if any, is decided here. No file is
 * registered yet (task 24), so every event is silent and nothing can break.
 */

export type RaceAudioEvent =
  | "countdownTick"
  | "gatesOpen"
  | "skillActivate"
  | "cutscene"
  | "finalStretch"
  | "finish";

/** Event → audio file under `public/`. Empty until the sounds exist. */
const SOUNDS: Partial<Record<RaceAudioEvent, string>> = {};

const MUTED_KEY = "umasprint:race-audio:muted";
const VOLUME_KEY = "umasprint:race-audio:volume";

const read = (key: string) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private windows can refuse storage; the setting just will not stick.
  }
};

let muted = read(MUTED_KEY) === "true";
let volume = Number(read(VOLUME_KEY) ?? 0.6);
if (!Number.isFinite(volume)) volume = 0.6;

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

export const raceAudio = {
  /** Plays the sound for an event, if one is registered and the race is not muted. */
  play(event: RaceAudioEvent) {
    const file = SOUNDS[event];
    if (!file || muted) return;
    const audio = new Audio(`${import.meta.env.BASE_URL}${file}`);
    audio.volume = volume;
    // Browsers refuse sound before the first interaction; the race goes on without it.
    audio.play().catch(() => undefined);
  },

  isMuted: () => muted,
  setMuted(next: boolean) {
    muted = next;
    write(MUTED_KEY, String(next));
    notify();
  },

  getVolume: () => volume,
  setVolume(next: number) {
    volume = Math.min(1, Math.max(0, next));
    write(VOLUME_KEY, String(volume));
    notify();
  },

  /** For React: `useSyncExternalStore(raceAudio.subscribe, raceAudio.isMuted)`. */
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }
};
