import { gsap } from "gsap";

/**
 * Background music, on by default. Every screen names a scene and the scene picks the
 * track, crossfading with GSAP when it changes. Browsers refuse sound before the first
 * interaction, so if the page opens blocked the music starts on the first click or key
 * anywhere. Turning it off with the music button is remembered.
 */

export type MusicScene =
  | "site"
  | "career"
  | "training"
  | "skills"
  | "trackSelect"
  | "race";

type TrackId = "storyMenu" | "gachaMenu" | "shikake";

/** Track → file under `public/audio/`. */
const TRACKS: Record<TrackId, string> = {
  storyMenu: "audio/story-menu.mp3",
  gachaMenu: "audio/gacha-menu.mp3",
  shikake: "audio/shikake.mp3"
};

/**
 * 仕掛け always plays in the race. The calm story-menu theme frames the site and the
 * career hub; the livelier gacha-menu theme takes over whenever she does something
 * (training, buying skills, picking the next track), so every career action changes it.
 */
const SCENE_TRACK: Record<MusicScene, TrackId> = {
  site: "storyMenu",
  career: "storyMenu",
  training: "gachaMenu",
  skills: "gachaMenu",
  trackSelect: "gachaMenu",
  race: "shikake"
};

const VOLUME = 0.35;
const FADE_IN = 1.2;
const FADE_OUT = 0.9;
const OFF_KEY = "umasprint:music:off";

const players = new Map<TrackId, HTMLAudioElement>();

const player = (id: TrackId) => {
  let audio = players.get(id);
  if (!audio) {
    audio = new Audio(`${import.meta.env.BASE_URL}${TRACKS[id]}`);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;
    players.set(id, audio);
  }
  return audio;
};

/** The route's scene, under any screen opened on top of it (training, skills). */
let baseScene: MusicScene = "site";
const overlays: { scene: MusicScene }[] = [];
let enabled = (() => {
  try {
    return window.localStorage.getItem(OFF_KEY) !== "true";
  } catch {
    return true;
  }
})();
let playing: TrackId | null = null;
/** True while the browser refuses to play until the player interacts with the page. */
let blocked = false;

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

const currentScene = () => overlays[overlays.length - 1]?.scene ?? baseScene;

/**
 * GSAP ticks on animation frames, which stop in a background tab or a busy frame, so a
 * fade may never finish. A timer settles where each fade should have ended anyway: the
 * track that left is paused, the one playing is at full volume.
 */
const settleAfter = (id: TrackId, seconds: number) => {
  window.setTimeout(() => {
    const audio = player(id);
    if (playing === id) {
      if (audio.volume < VOLUME) {
        gsap.killTweensOf(audio);
        audio.volume = VOLUME;
      }
    } else if (!audio.paused) {
      gsap.killTweensOf(audio);
      audio.volume = 0;
      audio.pause();
    }
  }, (seconds + 0.25) * 1000);
};

const fadeOut = (id: TrackId) => {
  const audio = player(id);
  gsap.to(audio, {
    volume: 0,
    duration: FADE_OUT,
    ease: "sine.out",
    overwrite: true,
    onComplete: () => audio.pause()
  });
  settleAfter(id, FADE_OUT);
};

/** Pointer and key events that count as the interaction browsers wait for. */
const GESTURES = ["pointerdown", "pointerup", "keydown", "touchend"] as const;

const onGesture = (event: Event) => {
  // The music button handles its own click (it resumes instead of toggling off).
  if ((event.target as Element | null)?.closest?.(".MusicToggle")) return;
  unblock();
};

const waitForGesture = () => {
  GESTURES.forEach((type) => document.addEventListener(type, onGesture, true));
};

function unblock() {
  GESTURES.forEach((type) => document.removeEventListener(type, onGesture, true));
  if (!blocked) return;
  blocked = false;
  sync();
}

const fadeIn = (id: TrackId) => {
  const audio = player(id);
  audio.play().catch((error: unknown) => {
    if (playing !== id || (error instanceof DOMException && error.name === "AbortError")) return;
    // Autoplay refused: try again on the first interaction.
    gsap.killTweensOf(audio);
    audio.volume = 0;
    playing = null;
    blocked = true;
    waitForGesture();
    notify();
  });
  gsap.to(audio, { volume: VOLUME, duration: FADE_IN, ease: "sine.in", overwrite: true });
  settleAfter(id, FADE_IN);
};

/** Plays the current scene's track, fading the previous one out. */
function sync() {
  const next = enabled && !blocked ? SCENE_TRACK[currentScene()] : null;
  if (next === playing) return;
  if (playing) fadeOut(playing);
  playing = next;
  if (next) fadeIn(next);
  notify();
}

export const bgMusic = {
  /** Whether music is audible now (on, and not waiting for the first interaction). */
  isPlaying: () => enabled && !blocked,

  /** The music button: a click while blocked starts it, otherwise it toggles. */
  toggle() {
    if (enabled && blocked) {
      unblock();
      return;
    }
    enabled = !enabled;
    try {
      window.localStorage.setItem(OFF_KEY, String(!enabled));
    } catch {
      // Private windows can refuse storage; the choice just will not stick.
    }
    sync();
  },

  setBaseScene(scene: MusicScene) {
    baseScene = scene;
    sync();
  },

  /** A screen on top of the route claims its own music; the returned function lets go. */
  pushScene(scene: MusicScene) {
    const entry = { scene };
    overlays.push(entry);
    sync();
    return () => {
      const index = overlays.indexOf(entry);
      if (index >= 0) overlays.splice(index, 1);
      sync();
    };
  },

  /** For React: `useSyncExternalStore(bgMusic.subscribe, bgMusic.isPlaying)`. */
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }
};

// A hot reload in dev replaces this module; silence the old one's players with it.
import.meta.hot?.dispose(() => {
  players.forEach((audio) => {
    gsap.killTweensOf(audio);
    audio.pause();
  });
});
