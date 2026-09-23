import { MAX_ENERGY, MAX_MOOD } from "../models/user";
import type { StatBlock } from "../types/race";

export const TRAIN_TYPES = ["speed", "stamina", "power", "wit"] as const;
export type TrainType = (typeof TRAIN_TYPES)[number];

/** Energy a training session burns. */
export const TRAINING_ENERGY_COST = 20;
/** Energy and mood a rest turn gives back. */
export const REST_ENERGY_GAIN = 45;

/** Ceiling gain for a flawless session, before every multiplier. */
const BASE_GAIN: Record<TrainType, number> = {
  speed: 9,
  stamina: 9,
  power: 8,
  wit: 7
};

const MOOD_MULTIPLIER = [0.85, 0.93, 1, 1.07, 1.15];

export interface TrainingOutcome {
  statGain: number;
  skillPointsGained: number;
  energySpent: number;
  moodChange: number;
  /** True when low energy spoiled the session. */
  failed: boolean;
  /** Human-readable reasons, shown in the results screen. */
  notes: string[];
}

/**
 * How well this horse girl takes to a given kind of training. Her strongest stat is
 * the one she grows fastest in, so a Power type stays a Power type unless the player
 * deliberately pushes against it.
 */
const affinityFor = (stats: StatBlock, trainType: TrainType) => {
  const best = Math.max(stats.speed, stats.stamina, stats.power, stats.wit, 1);
  return 0.85 + 0.3 * (stats[trainType] / best);
};

/** Energy below 60 starts eating into the gains, and below 25 risks a bad session. */
const energyMultiplier = (energy: number) => {
  if (energy >= 60) return 1;
  if (energy >= 30) return 0.8;
  if (energy >= 10) return 0.55;
  return 0.3;
};

export interface TrainingInput {
  stats: StatBlock;
  trainType: TrainType;
  /** Minigame score and the score that was available. */
  score: number;
  maxScore: number;
  energy: number;
  mood: number;
  /** Injected so tests can pin the outcome; defaults to Math.random. */
  random?: () => number;
}

/**
 * Turns a minigame performance into stat points and skill points. All of it runs on
 * the server: the client only reports how it did in the minigame, never the reward.
 */
export const resolveTraining = ({
  stats,
  trainType,
  score,
  maxScore,
  energy,
  mood,
  random = Math.random
}: TrainingInput): TrainingOutcome => {
  const notes: string[] = [];
  const scoreRatio = maxScore > 0 ? Math.min(1, Math.max(0, score / maxScore)) : 0;

  // A poor round still teaches something, a perfect one is worth chasing.
  const performance = 0.25 + 0.75 * Math.pow(scoreRatio, 1.15);
  const affinity = affinityFor(stats, trainType);
  const moodMultiplier = MOOD_MULTIPLIER[Math.min(MAX_MOOD, Math.max(1, mood)) - 1];
  const energyFactor = energyMultiplier(energy);
  // Every point gets harder to add as the stat grows.
  const diminishing = 1 / (1 + stats[trainType] / 260);
  const jitter = 0.9 + random() * 0.25;

  const failureChance = energy < 25 ? (25 - energy) / 50 : 0;
  const failed = failureChance > 0 && random() < failureChance;

  let statGain = Math.round(
    BASE_GAIN[trainType] * performance * affinity * moodMultiplier * energyFactor * diminishing * jitter
  );
  if (failed) {
    statGain = Math.floor(statGain * 0.4);
    notes.push("Ela estava exausta e o treino rendeu pouco.");
  }
  statGain = Math.max(1, statGain);

  if (affinity >= 1.05) notes.push("Treino afinado com o tipo dela.");
  if (moodMultiplier > 1) notes.push("Humor ótimo!");
  if (moodMultiplier < 1) notes.push("Humor baixo atrapalhou.");
  if (energyFactor < 1) notes.push("Energia baixa reduziu o ganho.");
  if (diminishing < 0.7) notes.push("Atributo já alto: cada ponto custa mais.");

  let skillPointsGained = Math.max(1, Math.round(statGain * 0.45));
  if (scoreRatio >= 1) {
    skillPointsGained += 8;
    notes.push("Round perfeito: +8 skill points de bônus.");
  }

  let moodChange = 0;
  if (failed) {
    moodChange = -1;
  } else if (scoreRatio >= 0.9 && mood < MAX_MOOD) {
    moodChange = 1;
  }

  return {
    statGain,
    skillPointsGained,
    energySpent: TRAINING_ENERGY_COST,
    moodChange,
    failed,
    notes
  };
};

export const resolveRest = (energy: number, mood: number) => ({
  energy: Math.min(MAX_ENERGY, energy + REST_ENERGY_GAIN),
  mood: Math.min(MAX_MOOD, mood + 1)
});
