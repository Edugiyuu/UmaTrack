/**
 * Plays every career calendar (src/data/careers.ts) many times with a simple player
 * policy and prints how often each race goal is met. Used to tune `turnsBefore` and
 * `goal` (docs/tasks/17-horse-career.md). Uses the real training rules, rival
 * generator and race engine; touches no database.
 *
 * Policy: rest when energy is low; otherwise train the stat furthest below the next
 * track's requirements (minigame score 6–10 of 10); buy the +25 passive skills when the
 * skill points allow; no optional races.
 */
import { HORSE_CATALOG } from "../data/horses";
import { TRACK_CATALOG } from "../data/tracks";
import { SKILL_CATALOG } from "../data/skills";
import { careerFor as calendarFor, type CareerRaceSeed } from "../data/careers";
import { resolveRest, resolveTraining, TRAIN_TYPES, type TrainType } from "../services/trainingEngine";
import { generateRivals } from "../services/rivalGenerator";
import { simulateRace } from "../services/raceEngine";
import { applyCareerResult, careerView, isCareerRaceDue, isRetired } from "../services/career";
import type { OwnedHorseDoc } from "../services/ownedHorse";
import type { RaceSkill, RaceTrackInput } from "../types/race";

const RUNS = Number(process.env.CAREER_RUNS ?? 300);
/** Tuning aid: CAREER_JSON='[{"trackSlug":…,"turnsBefore":…,"goal":…}]' tries one calendar on every girl. */
const override: CareerRaceSeed[] | null = process.env.CAREER_JSON ? JSON.parse(process.env.CAREER_JSON) : null;
const careerFor = (name: string) => override ?? calendarFor(name);
const RACE_ENERGY_COST = 35;
const REST_BELOW = 40;

const toRaceSkill = (skill: (typeof SKILL_CATALOG)[number]): RaceSkill => ({
  slug: skill.slug,
  name: skill.name,
  effect: skill.effect,
  trigger: skill.trigger
});
const skillPool = SKILL_CATALOG.filter((skill) => skill.rarity !== "unique").map(toRaceSkill);
const passives = SKILL_CATALOG.filter((skill) => skill.effect.kind === "flatStat");

const trackInput = (slug: string): RaceTrackInput => {
  const track = TRACK_CATALOG.find((candidate) => candidate.slug === slug);
  if (!track) throw new Error(`unknown track ${slug}`);
  return track as unknown as RaceTrackInput;
};

let seedCounter = 1;
const rng = () => {
  seedCounter = (seedCounter * 1103515245 + 12345) & 0x7fffffff;
  return seedCounter / 0x7fffffff;
};

const placementFactor = (placement: number) =>
  placement === 1 ? 1 : placement === 2 ? 0.6 : placement === 3 ? 0.42 : placement <= 5 ? 0.28 : 0.15;

const playCareer = (horse: (typeof HORSE_CATALOG)[number]) => {
  const stats = { speed: horse.speed, stamina: horse.stamina, power: horse.power, wit: horse.wit };
  let energy = 100;
  let mood = 3;
  let skillPoints = 0;
  const learned: RaceSkill[] = [];
  const placements: number[] = [];

  for (const race of careerFor(horse.name)) {
    const track = trackInput(race.trackSlug);

    for (let turn = 0; turn < race.turnsBefore; turn += 1) {
      if (energy < REST_BELOW) {
        ({ energy, mood } = resolveRest(energy, mood));
        continue;
      }
      const target = (stat: TrainType) => track.requirements[stat] * 1.1;
      const trainType = [...TRAIN_TYPES].sort(
        (a, b) => (target(b) - stats[b]) / target(b) - (target(a) - stats[a]) / target(a)
      )[0];
      const outcome = resolveTraining({
        stats,
        trainType,
        score: 6 + Math.floor(rng() * 5),
        maxScore: 10,
        energy,
        mood,
        random: rng
      });
      stats[trainType] += outcome.statGain;
      skillPoints += outcome.skillPointsGained;
      energy = Math.max(0, energy - outcome.energySpent);
      mood = Math.min(5, Math.max(1, mood + outcome.moodChange));
    }

    // Buy the passive for the stat furthest below the requirements, when affordable.
    for (const skill of [...passives].sort((a, b) => {
      const gap = (s: typeof a) => (s.effect.stat ? track.requirements[s.effect.stat] - stats[s.effect.stat] : 0);
      return gap(b) - gap(a);
    })) {
      if (skillPoints >= skill.cost && !learned.some((known) => known.slug === skill.slug)) {
        skillPoints -= skill.cost;
        learned.push(toRaceSkill(skill));
      }
    }

    // Turns are over: rest for free until she can race.
    while (energy < RACE_ENERGY_COST) ({ energy, mood } = resolveRest(energy, mood));

    const seed = Math.floor(rng() * 0xffffffff);
    const trackSeed = TRACK_CATALOG.find((candidate) => candidate.slug === race.trackSlug)!;
    const rivals = generateRivals({
      track,
      count: trackSeed.fieldSize - 1,
      difficulty: trackSeed.difficulty,
      seed,
      skillPool,
      excludeName: horse.name
    });
    const simulation = simulateRace({
      track,
      seed,
      runners: [
        { id: "player", name: horse.name, isPlayer: true, runningStyle: "pace", ...stats, skills: learned },
        ...rivals
      ]
    });
    const placement = simulation.results.find((result) => result.isPlayer)!.placement;
    placements.push(placement);
    energy -= RACE_ENERGY_COST;
    skillPoints += Math.round(trackSeed.skillPointReward * placementFactor(placement));
    if (placement > race.goal) break;
  }

  return { placements, stats };
};

// --- rules -----------------------------------------------------------------------------

let failures = 0;
const check = (label: string, ok: boolean) => {
  if (!ok) failures += 1;
  console.log(`${ok ? "ok  " : "FAIL"} ${label}`);
};

const fakeHorse = (name: string) =>
  ({
    name,
    turnsLeft: calendarFor(name)[0].turnsBefore,
    career: { status: "active", raceIndex: 0, results: [] as unknown[] }
  }) as unknown as OwnedHorseDoc;

{
  const calendar = calendarFor("Special Week");
  const horse = fakeHorse("Special Week");
  check("a new career starts with the first race's turns", horse.turnsLeft === calendar[0].turnsBefore);
  check("the career race is not due while turns are left", !isCareerRaceDue(horse));
  horse.turnsLeft = 0;
  check("at zero turns the career race is due", isCareerRaceDue(horse));
  check("the view points at the first race", careerView(horse).nextRace?.trackSlug === calendar[0].trackSlug);

  const passed = applyCareerResult(horse, calendar[0].goal, 8);
  check("meeting the goal moves to the next race", passed.kind === "passed" && horse.career.raceIndex === 1);
  check("and hands back that race's turns", horse.turnsLeft === calendar[1].turnsBefore);

  horse.turnsLeft = 0;
  const failed = applyCareerResult(horse, calendar[1].goal + 1, 10);
  check("missing the goal ends the career", failed.kind === "failed" && isRetired(horse));
  check("a retired horse has no next race", careerView(horse).nextRace === null && !isCareerRaceDue(horse));
  check("both results are kept", horse.career.results.length === 2);

  const champion = fakeHorse("Special Week");
  let last = null as ReturnType<typeof applyCareerResult> | null;
  for (let index = 0; index < calendar.length; index += 1) {
    champion.turnsLeft = 0;
    last = applyCareerResult(champion, 1, 10);
  }
  check("winning every race completes the career", last?.kind === "completed" && champion.career.status === "completed");
  check("an unknown horse girl gets the default calendar", calendarFor("Nobody").length > 0);
}

if (process.env.CAREER_RULES_ONLY) process.exit(failures ? 1 : 0);

// --- balance ---------------------------------------------------------------------------

const quartiles = (values: number[]) => {
  if (!values.length) return "—";
  const sorted = [...values].sort((a, b) => a - b);
  const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
  return `${at(0.25)}/${at(0.5)}/${at(0.75)}`;
};

for (const horse of HORSE_CATALOG) {
  const races = careerFor(horse.name);
  const reached = races.map(() => 0);
  const passed = races.map(() => 0);
  const seen: number[][] = races.map(() => []);
  let finalStats = { speed: 0, stamina: 0, power: 0, wit: 0 };

  for (let run = 0; run < RUNS; run += 1) {
    const { placements, stats } = playCareer(horse);
    placements.forEach((placement, index) => {
      reached[index] += 1;
      seen[index].push(placement);
      if (placement <= races[index].goal) passed[index] += 1;
    });
    for (const key of TRAIN_TYPES) finalStats[key] += stats[key] / RUNS;
  }

  console.log(`\n${horse.name} — carreira completa em ${Math.round((passed.at(-1)! / RUNS) * 100)}%`);
  races.forEach((race, index) => {
    const rate = reached[index] ? Math.round((passed[index] / reached[index]) * 100) : 0;
    console.log(
      `  ${index + 1}. ${race.trackSlug.padEnd(18)} ${String(race.turnsBefore).padStart(2)} turnos, top ${race.goal}: ` +
        `${String(rate).padStart(3)}% bate a meta (chegaram ${reached[index]}) · ` +
        `colocação p25/p50/p75: ${quartiles(seen[index])}`
    );
  });
  finalStats = Object.fromEntries(
    Object.entries(finalStats).map(([key, value]) => [key, Math.round(value)])
  ) as typeof finalStats;
  console.log(`  atributos médios no fim: ${JSON.stringify(finalStats)}`);
}

if (failures) process.exit(1);
