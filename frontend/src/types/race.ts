export type TrackSurface = "turf" | "dirt";
export type TrackTerrain = "flat" | "incline" | "rolling" | "technical";
export type TrackCategory = "sprint" | "mile" | "medium" | "long";
export type RunningStyle = "front" | "pace" | "late" | "end";
export type StatName = "speed" | "stamina" | "power" | "wit";

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
  requirements: StatBlock;
}

export interface RaceFrame {
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
  finishTime: number;
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
  time: number;
  distance: number;
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
}

export interface RaceRewards {
  placement: number;
  prizeMoney: number;
  entryFee: number;
  skillPointsEarned: number;
  fansEarned: number;
  energySpent: number;
  turnsLeft: number;
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
  prizeMoney: number;
  skillPointsEarned: number;
  fansEarned: number;
  createdAt: string;
}
