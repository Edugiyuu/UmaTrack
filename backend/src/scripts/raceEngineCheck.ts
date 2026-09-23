/**
 * Sanity check for the race engine, runnable without a database:
 *
 *   npm run race:check
 *
 * It asserts the properties the design relies on: the simulation is deterministic,
 * a climb rewards Power while a flat sprint rewards Speed, and a thin stamina bar
 * actually breaks down before the line.
 */
import { TRACK_CATALOG } from "../data/tracks";
import { simulateRace } from "../services/raceEngine";
import type { RaceRunnerInput, RaceTrackInput } from "../types/race";

const track = (slug: string): RaceTrackInput => {
  const found = TRACK_CATALOG.find((candidate) => candidate.slug === slug);
  if (!found) throw new Error(`Track ${slug} not found`);
  return found;
};

const runner = (
  id: string,
  stats: { speed: number; stamina: number; power: number; wit: number }
): RaceRunnerInput => ({
  id,
  name: id,
  isPlayer: false,
  runningStyle: "pace",
  skills: [],
  ...stats
});

let failures = 0;

const check = (label: string, passed: boolean, detail = "") => {
  console.log(`${passed ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!passed) failures += 1;
};

// --- determinism -------------------------------------------------------------
{
  const kokura = track("kokura-climb");
  const field = [
    runner("a", { speed: 120, stamina: 140, power: 190, wit: 100 }),
    runner("b", { speed: 150, stamina: 120, power: 120, wit: 110 })
  ];
  const first = simulateRace({ track: kokura, runners: field, seed: 42 });
  const second = simulateRace({ track: kokura, runners: field, seed: 42 });
  check(
    "same seed gives the same result",
    JSON.stringify(first.results) === JSON.stringify(second.results)
  );
  const other = simulateRace({ track: kokura, runners: field, seed: 99 });
  check(
    "a different seed produces a different race",
    JSON.stringify(other.frames) !== JSON.stringify(first.frames)
  );
}

// --- power wins the climb, speed wins the sprint -----------------------------
{
  // Same stat budget, distributed differently.
  const powerhouse = runner("power", { speed: 95, stamina: 130, power: 215, wit: 90 });
  const sprinter = runner("speed", { speed: 175, stamina: 130, power: 135, wit: 90 });

  const climbWins = { power: 0, speed: 0 };
  const sprintWins = { power: 0, speed: 0 };

  for (let seed = 1; seed <= 25; seed += 1) {
    const climb = simulateRace({
      track: track("kokura-climb"),
      runners: [powerhouse, sprinter],
      seed
    });
    climbWins[climb.results[0].id as "power" | "speed"] += 1;

    const sprint = simulateRace({
      track: track("sapporo-sprint"),
      runners: [powerhouse, sprinter],
      seed
    });
    sprintWins[sprint.results[0].id as "power" | "speed"] += 1;
  }

  check(
    "Power beats Speed on the Kokura climb",
    climbWins.power > climbWins.speed,
    `power ${climbWins.power} x ${climbWins.speed} speed`
  );
  check(
    "Speed beats Power on the Sapporo sprint",
    sprintWins.speed > sprintWins.power,
    `speed ${sprintWins.speed} x ${sprintWins.power} power`
  );
}

// --- stamina actually matters ------------------------------------------------
{
  const tokyo = track("tokyo-classic");
  const stayer = runner("stayer", { speed: 130, stamina: 180, power: 130, wit: 110 });
  const glassCannon = runner("glass", { speed: 150, stamina: 70, power: 130, wit: 110 });

  const race = simulateRace({ track: tokyo, runners: [stayer, glassCannon], seed: 7 });
  const glassResult = race.results.find((result) => result.id === "glass")!;
  const stayerResult = race.results.find((result) => result.id === "stayer")!;

  check("a thin stamina bar runs dry at Tokyo", glassResult.exhausted);
  check("the stayer wins at 2400m", stayerResult.placement === 1);
  check(
    "the shortfall is reported",
    race.shortfalls.glass?.some((entry) => entry.stat === "stamina") === true
  );
}

// --- replay sanity ------------------------------------------------------------
{
  const race = simulateRace({
    track: track("niigata-mile"),
    runners: [
      runner("a", { speed: 80, stamina: 70, power: 65, wit: 75 }),
      runner("b", { speed: 90, stamina: 75, power: 70, wit: 80 })
    ],
    seed: 3
  });

  const monotonic = race.frames.every((frame, index) =>
    index === 0 ? true : frame.positions.every((pos, lane) => pos >= race.frames[index - 1].positions[lane])
  );
  check("runners never move backwards in the replay", monotonic);
  check(
    "everyone reaches the finish line",
    race.frames[race.frames.length - 1].positions.every((pos) => pos >= race.distance)
  );
  check(
    "a mile at the reference level lands in a believable time",
    race.results[0].finishTime > 85 && race.results[0].finishTime < 115,
    `${race.results[0].finishTime}s`
  );
}

// --- every track finishes in a plausible time ---------------------------------
for (const seed of TRACK_CATALOG) {
  const contender = runner("test", {
    speed: seed.requirements.speed,
    stamina: seed.requirements.stamina,
    power: seed.requirements.power,
    wit: seed.requirements.wit
  });
  const race = simulateRace({ track: seed, runners: [contender], seed: 11 });
  const seconds = race.results[0].finishTime;
  const pace = seed.distance / seconds;
  check(
    `${seed.name}: a runner on the requirements holds a sane pace`,
    pace > 12 && pace < 19,
    `${seconds}s (${pace.toFixed(1)} m/s)`
  );
}

console.log(failures === 0 ? "\nAll race engine checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
