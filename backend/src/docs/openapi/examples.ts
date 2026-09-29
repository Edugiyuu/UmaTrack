import { HORSE_CATALOG } from "../../data/horses";
import { SKILL_CATALOG } from "../../data/skills";
import { TRACK_CATALOG } from "../../data/tracks";
import { careerCalendar } from "../../services/career";

/**
 * Examples shown in the Swagger UI. Catalogue values (horses, tracks, skills, career
 * calendars) are read from src/data so they stay real; ids and dates are made up.
 */

const DATE = "2026-09-27T12:00:00.000Z";

export const IDS = {
  user: "66f6a1c2e4b0a1b2c3d4e5f6",
  horse: "66f6a1c2e4b0a1b2c3d4e601",
  ownedHorse: "66f6a1c2e4b0a1b2c3d4e7a0",
  track: "66f6a1c2e4b0a1b2c3d4e802",
  skill: "66f6a1c2e4b0a1b2c3d4e906",
  raceResult: "66f6a1c2e4b0a1b2c3d4ea01"
};

const HORSE_NAME = "Silence Suzuka";
const catalogHorse = HORSE_CATALOG.find((horse) => horse.name === HORSE_NAME)!;
const track = TRACK_CATALOG.find((candidate) => candidate.slug === "niigata-mile")!;
const skill = SKILL_CATALOG.find((candidate) => candidate.slug === "steady-breathing")!;
const calendar = careerCalendar(HORSE_NAME);

export const catalogHorseExample = {
  _id: IDS.horse,
  ...catalogHorse,
  createdAt: DATE,
  updatedAt: DATE,
  __v: 0
};

export const trackExample = {
  _id: IDS.track,
  ...track,
  createdAt: DATE,
  updatedAt: DATE,
  __v: 0,
  maxGrade: track.segments.reduce((max, segment) => Math.max(max, segment.grade), 0),
  id: IDS.track
};

export const skillExample = {
  _id: IDS.skill,
  ...skill,
  createdAt: DATE,
  updatedAt: DATE,
  __v: 0
};

const firstCareerResult = {
  raceIndex: 0,
  trackSlug: calendar[0].trackSlug,
  trackName: calendar[0].trackName,
  goal: calendar[0].goal,
  placement: 2,
  fieldSize: 8,
  passed: true,
  ranAt: DATE
};

/** She passed her first career race and is preparing for the second. */
export const careerViewExample = {
  status: "active",
  raceIndex: 1,
  races: calendar,
  results: [firstCareerResult],
  endedAt: null,
  nextRace: calendar[1],
  raceDue: false
};

export const careerOutcomeExamples = {
  passed: { kind: "passed", goal: calendar[0].goal, placement: 2, next: calendar[1] },
  completed: { kind: "completed", goal: calendar[calendar.length - 1].goal, placement: 1 },
  failed: { kind: "failed", goal: calendar[1].goal, placement: 6 }
};

const learnedSkill = { skillId: IDS.skill, slug: skill.slug, name: skill.name, learnedAt: DATE };

/** Stats after a few training turns; the race example below is run with them. */
const trainedStats = { speed: 98, stamina: 68, power: 68, wit: 58 };

const ownedHorseState = {
  sourceHorseId: IDS.horse,
  name: HORSE_NAME,
  passiveBuff: catalogHorse.passiveBuff,
  ...trainedStats,
  cost: catalogHorse.cost,
  turnsLeft: 5,
  skillPoints: 44,
  skills: [learnedSkill],
  energy: 65,
  mood: 4,
  runningStyle: "front",
  fans: 300,
  racesRun: 1,
  racesWon: 0
};

export const ownedHorseExample = {
  ...ownedHorseState,
  _id: IDS.horse,
  ownedHorseId: IDS.ownedHorse,
  career: careerViewExample
};

export const trainingExample = {
  statGain: 8,
  skillPointsGained: 12,
  energySpent: 20,
  moodChange: 1,
  failed: false,
  notes: ["Humor ótimo!", "Round perfeito: +8 skill points de bônus."]
};

export const restExample = { energyRecovered: 45, energy: 75, mood: 5, turnSpent: true };

const userBase = {
  _id: IDS.user,
  username: "Eduardo",
  email: "edu@example.com",
  monies: 1000,
  createdAt: DATE,
  updatedAt: DATE,
  __v: 0
};

/** Fresh account: one random horse girl, at her catalogue stats. */
export const userExample = {
  ...userBase,
  horses: [
    {
      _id: IDS.ownedHorse,
      sourceHorseId: IDS.horse,
      name: HORSE_NAME,
      passiveBuff: catalogHorse.passiveBuff,
      speed: catalogHorse.speed,
      stamina: catalogHorse.stamina,
      power: catalogHorse.power,
      wit: catalogHorse.wit,
      cost: catalogHorse.cost,
      turnsLeft: calendar[0].turnsBefore,
      skillPoints: 0,
      skills: [],
      energy: 100,
      mood: 3,
      runningStyle: "pace",
      fans: 0,
      racesRun: 0,
      racesWon: 0,
      career: { status: "active", raceIndex: 0, results: [] }
    }
  ]
};

export const userProfileExample = {
  ...userBase,
  monies: 1880,
  horses: [{ ...ownedHorseState, _id: IDS.ownedHorse, career: careerViewExample }]
};

/**
 * Real simulation, generated offline with the race engine (no database): Silence Suzuka
 * with `trainedStats`, style `front` and the skill `steady-breathing`, on `niigata-mile`
 * (10 runners, difficulty 3), seed 20260927, rivals from `generateRivals` with the
 * common and rare skills as pool. Trimmed to 3 runners (hers, the winner and a rival
 * whose skill fired), 8 frames and 3 telemetry turns so the Swagger UI stays light.
 */
export const simulationExample = {
  seed: 20260927,
  trackSlug: "niigata-mile",
  distance: 1600,
  runners: [
    { id: "player", name: "Silence Suzuka", isPlayer: true, isRival: false, runningStyle: "front" },
    { id: "rival-2", name: "Dusty Rhapsody", isPlayer: false, isRival: true, runningStyle: "end" },
    { id: "rival-3", name: "Kite Runner", isPlayer: false, isRival: true, runningStyle: "end" }
  ],
  rivals: [
    {
      id: "rival-2",
      name: "Dusty Rhapsody",
      runningStyle: "end",
      stats: { speed: 79, stamina: 82, power: 63, wit: 73 },
      skills: ["Especialista em Curva"]
    },
    {
      id: "rival-3",
      name: "Kite Runner",
      runningStyle: "end",
      stats: { speed: 92, stamina: 77, power: 76, wit: 69 },
      skills: []
    }
  ],
  frames: [
    { t: 0, positions: [0, 0, 0], stamina: [1, 1, 1] },
    { t: 4.75, positions: [263, 241, 292], stamina: [0.886, 0.922, 0.878] },
    { t: 9.5, positions: [695, 611, 720], stamina: [0.575, 0.748, 0.615] },
    { t: 14.25, positions: [1160, 987, 1152], stamina: [0.201, 0.534, 0.303] },
    { t: 19, positions: [1525, 1360, 1587.9876672405996], stamina: [0, 0.296, 0] },
    { t: 22.75, positions: [1600, 1600, 1600], stamina: [0, 0.092, 0] },
    { t: 26.75, positions: [1600, 1600, 1600], stamina: [0, 0.079, 0] },
    { t: 32, positions: [1600, 1600, 1600], stamina: [0, 0.079, 0] }
  ],
  results: [
    {
      id: "rival-3",
      name: "Kite Runner",
      isPlayer: false,
      runningStyle: "end",
      placement: 1,
      finishTime: 19.2577,
      topSpeed: 92,
      staminaLeft: 0,
      exhausted: true,
      skillsActivated: []
    },
    {
      id: "player",
      name: "Silence Suzuka",
      isPlayer: true,
      runningStyle: "front",
      placement: 2,
      finishTime: 20.5523,
      topSpeed: 98,
      staminaLeft: 0,
      exhausted: true,
      skillsActivated: ["Respiração Constante"]
    },
    {
      id: "rival-2",
      name: "Dusty Rhapsody",
      isPlayer: false,
      runningStyle: "end",
      placement: 3,
      finishTime: 22.0122,
      topSpeed: 84,
      staminaLeft: 0.079,
      exhausted: false,
      skillsActivated: ["Especialista em Curva"]
    }
  ],
  activations: [
    {
      runnerId: "rival-2",
      runnerName: "Dusty Rhapsody",
      skillSlug: "corner-adept",
      skillName: "Especialista em Curva",
      time: 8,
      distance: 487
    },
    {
      runnerId: "player",
      runnerName: "Silence Suzuka",
      skillSlug: "steady-breathing",
      skillName: "Respiração Constante",
      time: 11,
      distance: 842
    }
  ],
  shortfalls: {
    player: [{ stat: "wit", required: 70, current: 58 }],
    "rival-3": [{ stat: "wit", required: 70, current: 69 }]
  },
  telemetry: [
    {
      turn: 1,
      phase: "opening",
      pressure: 1,
      placement: 1,
      speed: 34,
      runSpeed: 34,
      ceiling: 98,
      accel: 0,
      curveLoss: 0,
      staminaCost: 0.6,
      staminaSave: 0.116,
      stamina: 67.4,
      staminaRange: 1209,
      remaining: 1600,
      pace: "rushed",
      tired: false,
      effects: []
    },
    {
      turn: 11,
      phase: "middle",
      pressure: 1.25,
      placement: 2,
      speed: 98,
      runSpeed: 98,
      ceiling: 98,
      accel: 0,
      curveLoss: 0,
      staminaCost: 5.9,
      staminaSave: 0.116,
      stamina: 30.3,
      staminaRange: 555,
      remaining: 857,
      pace: "rushed",
      tired: false,
      effects: []
    },
    {
      turn: 21,
      phase: "spurt",
      pressure: 1.5,
      placement: 2,
      speed: 49,
      runSpeed: 49,
      ceiling: 49,
      accel: 0,
      curveLoss: 0,
      staminaCost: 1.8,
      staminaSave: 0.116,
      stamina: -12.4,
      staminaRange: 0,
      remaining: 27,
      pace: "rushed",
      tired: true,
      effects: []
    }
  ]
};

/** 2nd place in an optional race on Niigata Mile (placement factor 0.6). */
const placementFactor = 0.6;
const raceRewards = {
  placement: 2,
  prizeMoney: track.prizeMoney[1],
  entryFee: track.entryFee,
  skillPointsEarned: Math.round(track.skillPointReward * placementFactor),
  fansEarned: Math.round(track.fansReward * placementFactor),
  energySpent: 35,
  turnsLeft: ownedHorseState.turnsLeft - 1
};

export const raceRunExample = {
  msg: "Corrida concluída",
  simulation: simulationExample,
  rewards: { ...raceRewards, career: null },
  horse: {
    ...ownedHorseExample,
    skillPoints: ownedHorseState.skillPoints + raceRewards.skillPointsEarned,
    fans: ownedHorseState.fans + raceRewards.fansEarned,
    energy: ownedHorseState.energy - raceRewards.energySpent,
    racesRun: ownedHorseState.racesRun + 1,
    turnsLeft: raceRewards.turnsLeft
  },
  monies: userProfileExample.monies - raceRewards.entryFee + raceRewards.prizeMoney
};

export const raceResultExample = {
  _id: IDS.raceResult,
  userId: IDS.user,
  trackId: IDS.track,
  trackSlug: track.slug,
  trackName: track.name,
  distance: track.distance,
  horseName: HORSE_NAME,
  sourceHorseId: IDS.horse,
  runningStyle: "front",
  seed: simulationExample.seed,
  placement: 2,
  fieldSize: track.fieldSize,
  finishTime: 20.5523,
  timeUnit: "turns",
  exhausted: true,
  skillsActivated: ["Respiração Constante"],
  statsSnapshot: trainedStats,
  prizeMoney: raceRewards.prizeMoney,
  skillPointsEarned: raceRewards.skillPointsEarned,
  fansEarned: raceRewards.fansEarned,
  entryFee: raceRewards.entryFee,
  createdAt: DATE,
  updatedAt: DATE,
  __v: 0
};
