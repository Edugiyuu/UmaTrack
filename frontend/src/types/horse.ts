import type { RunningStyle } from "./race";

export interface LearnedSkill {
  slug: string;
  name: string;
  learnedAt?: string;
}

export interface HorseResponseProfile {
  name: string;
  passiveBuff?: string;
  stamina: number;
  power: number;
  speed: number;
  wit: number;
  _id: string;
  sourceHorseId?: string;
  ownedHorseId?: string;
  cost: number;
  turnsLeft?: number;

  skillPoints?: number;
  skills?: LearnedSkill[];
  energy?: number;
  mood?: number;
  runningStyle?: RunningStyle;
  fans?: number;
  racesRun?: number;
  racesWon?: number;
}
