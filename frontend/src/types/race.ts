import type { CareerRace } from "./horse";

export type TrackSurface = "turf" | "dirt";
export type TrackTerrain = "flat" | "incline" | "rolling" | "technical";
export type TrackCategory = "sprint" | "mile" | "medium" | "long";
export type RunningStyle = "front" | "pace" | "late" | "end";
export type StatName = "speed" | "stamina" | "power" | "wit";
export type RacePhase = "opening" | "middle" | "final" | "spurt";
export type SkillEffectKind =
  | "speedBoost"
  | "accelBoost"
  | "staminaRecover"
  | "staminaSave"
  | "startDash"
  | "inclineBoost"
  | "cornerBoost"
  | "flatStat";

export interface StatBlock {
  speed: number;
  stamina: number;
  power: number;
  wit: number;
}

export interface TrackSegment {
  label: string;
  lengthRatio: number;
  /** Slope in percent: positive is uphill. */
  grade: number;
  /** 0 is a straight, 1 is the tightest bend. */
  curve: number;
}

export interface TrackResponse {
  _id: string;
  slug: string;
  name: string;
  location: string;
  description?: string;
  image?: string;
  distance: number;
  category: TrackCategory;
  surface: TrackSurface;
  terrain: TrackTerrain;
  segments: TrackSegment[];
  statWeights: StatBlock;
  requirements: StatBlock;
  fieldSize: number;
  difficulty: number;
  entryFee: number;
  prizeMoney: number[];
  fansReward: number;
  skillPointReward: number;
  maxGrade?: number;
}

export interface SkillResponse {
  _id: string;
  slug: string;
  name: string;
  description: string;
  rarity: "common" | "rare" | "unique";
  cost: number;
  effect: {
    kind: string;
    stat?: StatName;
    value: number;
    duration: number;
  };
  trigger: {
    phase: string;
    terrain: string;
    baseChance: number;
    maxStaminaRatio?: number;
    minPosition?: number;
  };
}

export interface RaceFrame {
  /** Turns since the gates opened, sampled several times per turn. */
  t: number;
  positions: number[];
  stamina: number[];
}

export interface RaceRunnerResult {
  id: string;
  name: string;
  isPlayer: boolean;
  runningStyle: RunningStyle;
  placement: number;
  /** Turns taken to cross the line. */
  finishTime: number;
  /** Fastest speed reached, in m/turn. */
  topSpeed: number;
  staminaLeft: number;
  exhausted: boolean;
  skillsActivated: string[];
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

/** How the stamina left compares with the track left: plenty, just enough, or not enough. */
export type PaceVerdict = "safe" | "tight" | "rushed";

/** What the engine decided for the player's runner in one turn. */
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
  /** Speed gained this turn, m/turn; negative when tiring halves the ceiling. */
  accel: number;
  /** Speed lost entering a corner at the end of this turn, m/turn. */
  curveLoss: number;
  /** Stamina spent this turn, in Stamina points. */
  staminaCost: number;
  /** Cut applied to the cost (Wit + skills), 0..0.6. */
  staminaSave: number;
  /** Stamina left after the turn, in points (may go negative). */
  stamina: number;
  /** Metres she can still run at this speed on the stamina she started the turn with. */
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
  runners: { id: string; name: string; isPlayer: boolean; runningStyle: RunningStyle }[];
  frames: RaceFrame[];
  results: RaceRunnerResult[];
  activations: SkillActivation[];
  shortfalls: Record<string, { stat: StatName; required: number; current: number }[]>;
  /** Telemetry of the player's runner, one item per turn. */
  telemetry: RunnerTelemetry[];
}

export interface RaceRewards {
  placement: number;
  prizeMoney: number;
  entryFee: number;
  skillPointsEarned: number;
  fansEarned: number;
  energySpent: number;
  turnsLeft: number;
  /** Set when this was a career race: what it did to the career. */
  career:
    | { kind: "passed"; goal: number; placement: number; next: CareerRace }
    | { kind: "completed" | "failed"; goal: number; placement: number }
    | null;
}

export interface RaceHistoryEntry {
  _id: string;
  trackName: string;
  trackSlug: string;
  distance: number;
  horseName: string;
  placement: number;
  fieldSize: number;
  finishTime: number;
  /** Races run before the turn engine were timed in seconds. */
  timeUnit: "seconds" | "turns";
  prizeMoney: number;
  skillPointsEarned: number;
  fansEarned: number;
  createdAt: string;
}
