import { gsap } from "gsap";

/**
 * Background music. Silent until the player presses the music button (browsers refuse
 * sound before an interaction anyway); from then on every screen names a scene and the
 * scene picks the track, crossfading with GSAP when it changes.
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
let enabled = false;
let playing: TrackId | null = null;

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

const currentScene = () => overlays[overlays.length - 1]?.scene ?? baseScene;

const fadeOut = (id: TrackId) => {
  const audio = player(id);
  gsap.to(audio, {
    volume: 0,
    duration: FADE_OUT,
    ease: "sine.out",
    overwrite: true,
    onComplete: () => audio.pause()
  });
};

const fadeIn = (id: TrackId) => {
  const audio = player(id);
  // Autoplay is refused only before the first click; the button press is that click.
  audio.play().catch(() => {
    if (playing === id) {
      enabled = false;
      playing = null;
      notify();
    }
  });
  gsap.to(audio, { volume: VOLUME, duration: FADE_IN, ease: "sine.in", overwrite: true });
};

/** Plays the current scene's track, fading the previous one out. */
const sync = () => {
  const next = enabled ? SCENE_TRACK[currentScene()] : null;
  if (next === playing) return;
  if (playing) fadeOut(playing);
  playing = next;
  if (next) fadeIn(next);
  notify();
};

export const bgMusic = {
  isEnabled: () => enabled,
  /** The track playing now, for the button's label. */
  nowPlaying: () => playing,

  /** Call only from a click: that click is what lets the browser play. */
  setEnabled(next: boolean) {
    enabled = next;
    sync();
    notify();
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

  /** For React: `useSyncExternalStore(bgMusic.subscribe, bgMusic.isEnabled)`. */
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }
};
