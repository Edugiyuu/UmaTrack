import { RUNNING_STYLES, type RunningStyle } from "../models/user";
import type { RaceRunnerInput, RaceSkill, RaceTrackInput } from "../types/race";

const RIVAL_NAMES = [
  "Amber Comet",
  "Blue Meteor",
  "Clover Dash",
  "Dusty Rhapsody",
  "Echo Valley",
  "Fleet Harmony",
  "Golden Lantern",
  "Hazel Sprint",
  "Iron Marigold",
  "Jade Tempo",
  "Kite Runner",
  "Lunar Whisper",
  "Misty Gambit",
  "Noble Drift",
  "Opal Cadence",
  "Prairie Wind",
  "Quartz Reverie"
];

const createRng = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export interface GenerateRivalsOptions {
  track: RaceTrackInput;
  /** Number of rivals to build, usually `track.fieldSize - 1`. */
  count: number;
  /** Track difficulty, 1..10. Higher fields are tuned above the requirements. */
  difficulty: number;
  seed: number;
  skillPool: RaceSkill[];
  /** Name already taken by the player, so the field never contains a twin. */
  excludeName?: string;
}

/**
 * Builds the rival field. Rivals are generated around the track requirements rather
 * than around the player, so improving your stats genuinely improves your placement
 * instead of the field silently scaling with you.
 */
export const generateRivals = ({
  track,
  count,
  difficulty,
  seed,
  skillPool,
  excludeName
}: GenerateRivalsOptions): RaceRunnerInput[] => {
  const rng = createRng(seed ^ 0x9e3779b9);

  // Deterministic shuffle, then hand out names by index: two rivals in the same field
  // must never share a name.
  const names = RIVAL_NAMES.filter((name) => name !== excludeName);
  for (let index = names.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rng() * (index + 1));
    [names[index], names[swap]] = [names[swap], names[index]];
  }

  // 1.0 at difficulty 5: an average field sits right on the track requirements.
  const difficultyScale = 0.86 + difficulty * 0.028;

  return Array.from({ length: Math.max(0, count) }, (_, index) => {
    const name = names[index % names.length];
    const spread = 0.82 + rng() * 0.36;
    const style = RUNNING_STYLES[Math.floor(rng() * RUNNING_STYLES.length)] as RunningStyle;

    // Each rival leans into one stat so the field is not a row of clones.
    const focus = (["speed", "stamina", "power", "wit"] as const)[Math.floor(rng() * 4)];
    const stat = (key: "speed" | "stamina" | "power" | "wit") =>
      Math.round(
        track.requirements[key] * difficultyScale * spread * (key === focus ? 1.15 : 0.96)
      );

    const rival: RaceRunnerInput = {
      id: `rival-${index + 1}`,
      name: `${name}`,
      isPlayer: false,
      runningStyle: style,
      speed: stat("speed"),
      stamina: stat("stamina"),
      power: stat("power"),
      wit: stat("wit"),
      skills: []
    };

    const skillCount = Math.min(skillPool.length, Math.floor(rng() * (1 + difficulty / 3)));
    const picked = new Set<number>();
    while (picked.size < skillCount) {
      picked.add(Math.floor(rng() * skillPool.length));
    }
    rival.skills = [...picked].map((skillIndex) => skillPool[skillIndex]);

    return rival;
  });
};
