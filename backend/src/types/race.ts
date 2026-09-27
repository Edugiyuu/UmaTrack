import type { RunningStyle } from "../models/user";
import type { SkillEffectKind, SkillPhase, SkillTerrain, StatName } from "../models/skill";
import type { TrackCategory, TrackSurface, TrackTerrain } from "../models/track";

export type RacePhase = "opening" | "middle" | "final" | "spurt";

export interface StatBlock {
  speed: number;
  stamina: number;
  power: number;
  wit: number;
}

export interface RaceSkill {
  slug: string;
  name: string;
  effect: {
    kind: SkillEffectKind;
    stat?: StatName;
    value: number;
    duration: number;
  };
  trigger: {
    phase: SkillPhase;
    terrain: SkillTerrain;
    baseChance: number;
    maxStaminaRatio?: number;
    minPosition?: number;
  };
}

export interface RaceRunnerInput extends StatBlock {
  id: string;
  name: string;
  isPlayer: boolean;
  runningStyle: RunningStyle;
  skills: RaceSkill[];
}

export interface RaceTrackSegment {
  label: string;
  lengthRatio: number;
  grade: number;
  curve: number;
}

export interface RaceTrackInput {
  slug: string;
  name: string;
  distance: number;
  category: TrackCategory;
  surface: TrackSurface;
  terrain: TrackTerrain;
  segments: RaceTrackSegment[];
  statWeights: StatBlock;
  requirements: StatBlock;
}

export interface SkillActivation {
  runnerId: string;
  runnerName: string;
  skillSlug: string;
  skillName: string;
  /** Turn in which the skill fired, counted from 0 at the gates. */
  time: number;
  distance: number;
}

export interface RaceFrame {
  /** Turns since the gates opened. Sampled several times per turn. */
  t: number;
  /** Metres covered by each runner, in the order of `runners`. */
  positions: number[];
  /** Remaining stamina of each runner as a 0..1 ratio. */
  stamina: number[];
}

export interface RaceRunnerResult {
  id: string;
  name: string;
  isPlayer: boolean;
  runningStyle: RunningStyle;
  placement: number;
  /** Turns taken to cross the line; the fraction breaks same-turn finishes. */
  finishTime: number;
  /** Fastest speed reached, skill bonuses included, in m/turn. */
  topSpeed: number;
  staminaLeft: number;
  /** True when the runner emptied her stamina bar before the line. */
  exhausted: boolean;
  skillsActivated: string[];
}

/** How the stamina left compares with the track left: plenty, just enough, or not enough. */
export type PaceVerdict = "safe" | "tight" | "rushed";

/** What the engine decided for the player's runner in one turn. Read-only: never fed back. */
export interface RunnerTelemetry {
  /** Turn, counted from 1. */
  turn: number;
  phase: RacePhase;
  /** Stamina cost multiplier: 1, 1.25 or 1.5. */
  pressure: number;
  /** Placement at the start of the turn, 1 = leader. */
  placement: number;
  /** Base speed in the turn, m/turn (skills not included). */
  speed: number;
  /** Speed actually run, speed skills included, m/turn. */
  runSpeed: number;
  /** Ceiling in the turn: Speed, or Speed / 2 when tired. */
  ceiling: number;
  /** Speed gained this turn, m/turn (0 at the ceiling or on turn 1; negative when tiring halves the ceiling). */
  accel: number;
  /** Speed lost entering a corner at the end of this turn, m/turn (0 if none). */
  curveLoss: number;
  /** Stamina spent this turn, in Stamina points. */
  staminaCost: number;
  /** Cut applied to the cost (Wit + skills), 0..0.6. */
  staminaSave: number;
  /** Stamina left after the turn, in points (may go negative). */
  stamina: number;
  /**
   * Metres she can still run on the stamina she started the turn with, holding this
   * speed (or the ceiling, while still accelerating) and paying each third its pressure.
   */
  staminaRange: number;
  /** Metres to the line at the start of the turn. */
  remaining: number;
  pace: PaceVerdict;
  tired: boolean;
  /** Skill effect kinds active in this turn. */
  effects: SkillEffectKind[];
}

export interface RaceSimulation {
  seed: number;
  trackSlug: string;
  distance: number;
  /** Runner ids in the order used by every frame of the replay. */
  runners: { id: string; name: string; isPlayer: boolean; runningStyle: RunningStyle }[];
  frames: RaceFrame[];
  results: RaceRunnerResult[];
  activations: SkillActivation[];
  /** Per-runner notes about stats that fell short of the track requirements. */
  shortfalls: Record<string, { stat: keyof StatBlock; required: number; current: number }[]>;
  /** Telemetry of the player's runner, one item per turn. Empty without a player. */
  telemetry: RunnerTelemetry[];
}
