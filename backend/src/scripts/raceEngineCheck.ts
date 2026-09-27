/**
 * Sanity check for the turn-based race engine, runnable without a database:
 *
 *   npm run race:check
 *
 * It asserts the properties the design relies on (docs/tasks/14-race-turn-engine.md):
 * the simulation is deterministic, each stat does its job, corners cost speed, a thin
 * stamina bar breaks down before the line and same-turn finishes never tie.
 */
import { TRACK_CATALOG } from "../data/tracks";
import { SKILL_CATALOG } from "../data/skills";
import { simulateRace } from "../services/raceEngine";
import type { RaceRunnerInput, RaceSkill, RaceTrackInput, RaceTrackSegment } from "../types/race";

const track = (slug: string): RaceTrackInput => {
  const found = TRACK_CATALOG.find((candidate) => candidate.slug === slug);
  if (!found) throw new Error(`Track ${slug} not found`);
  return found;
};

/** A bare track: only distance and corners matter to the engine. */
const customTrack = (distance: number, segments: RaceTrackSegment[]): RaceTrackInput => ({
  ...track("sapporo-sprint"),
  slug: "custom",
  name: "custom",
  distance,
  segments
});

const straight = (lengthRatio: number): RaceTrackSegment => ({
  label: "Reta",
  lengthRatio,
  grade: 0,
  curve: 0
});
const corner = (lengthRatio: number): RaceTrackSegment => ({
  label: "Curva",
  lengthRatio,
  grade: 0,
  curve: 0.6
});

/**
 * The 1200m oval from the original turn-based sketch: a 200m straight, then a corner
 * before each of the next four stretches (300 / 300 / 300 / 100).
 */
const OVAL = customTrack(1200, [
  straight(200 / 1200),
  corner(300 / 1200),
  corner(300 / 1200),
  corner(300 / 1200),
  corner(100 / 1200)
]);
const FLAT = customTrack(1200, [straight(1)]);

const runner = (
  id: string,
  stats: { speed: number; stamina: number; power: number; wit: number },
  skills: RaceSkill[] = []
): RaceRunnerInput => ({
  id,
  name: id,
  isPlayer: false,
  runningStyle: "pace",
  skills,
  ...stats
});

const skill = (slug: string): RaceSkill => {
  const found = SKILL_CATALOG.find((candidate) => candidate.slug === slug);
  if (!found) throw new Error(`Skill ${slug} not found`);
  return found;
};

const finishOf = (race: ReturnType<typeof simulateRace>, id: string) =>
  race.results.find((result) => result.id === id)!;

let failures = 0;

const check = (label: string, passed: boolean, detail = "") => {
  console.log(`${passed ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!passed) failures += 1;
};

/**
 * Independent re-implementation of the rules in section 4.1 of the task, without
 * skills or noise, so the engine is checked against the paper version.
 */
const paperRace = (
  stats: { speed: number; stamina: number; power: number; wit: number },
  distance: number,
  corners: number[]
) => {
  let speed = stats.power / 2;
  let stamina = stats.stamina;
  let covered = 0;
  for (let turn = 1; turn < 300; turn += 1) {
    const tired = stamina <= 0;
    const power = tired ? stats.power / 3 : stats.power;
    const ceiling = tired ? stats.speed / 2 : stats.speed;
    if (turn > 1) speed = Math.min(ceiling, speed + power / 6);
    const pressure = [1, 1.25, 1.5][Math.min(2, Math.floor((covered / distance) * 3))];
    stamina -= ((speed * speed) / 1800) * pressure * (1 - stats.wit / 500);
    if (covered + speed >= distance) return turn - 1 + (distance - covered) / speed;
    const before = covered;
    covered += speed;
    for (const mark of corners) if (before < mark && covered >= mark) speed /= 1.2;
  }
  return 300;
};

// --- determinism -------------------------------------------------------------
{
  const field = [
    runner("a", { speed: 120, stamina: 140, power: 110, wit: 100 }),
    runner("b", { speed: 130, stamina: 110, power: 100, wit: 110 })
  ];
  const first = simulateRace({ track: track("tokyo-classic"), runners: field, seed: 42 });
  const second = simulateRace({ track: track("tokyo-classic"), runners: field, seed: 42 });
  check(
    "same seed gives the same result",
    JSON.stringify(first) === JSON.stringify(second)
  );
  const other = simulateRace({ track: track("tokyo-classic"), runners: field, seed: 99 });
  check(
    "a different seed produces a different race",
    JSON.stringify(other.frames) !== JSON.stringify(first.frames)
  );
}

// --- the engine matches the rules on paper ------------------------------------
{
  const profiles = {
    balanced: { speed: 110, stamina: 140, power: 96, wit: 105 },
    sketch: { speed: 120, stamina: 108, power: 96, wit: 105 },
    glass: { speed: 140, stamina: 70, power: 96, wit: 105 }
  };
  for (const [id, stats] of Object.entries(profiles)) {
    const expected = paperRace(stats, 1200, [200, 500, 800, 1100]);
    const actual = simulateRace({ track: OVAL, runners: [runner(id, stats)], seed: 1 }).results[0];
    check(
      `${id} on the sketch oval matches the paper rules`,
      Math.abs(actual.finishTime - expected) / expected < 0.03,
      `engine ${actual.finishTime.toFixed(2)} x paper ${expected.toFixed(2)} turns`
    );
  }
}

// --- each stat does its job ------------------------------------------------------
{
  const base = { speed: 110, stamina: 200, power: 90, wit: 90 };
  let fasterWins = 0;
  let strongerWins = 0;
  for (let seed = 1; seed <= 20; seed += 1) {
    const speedRace = simulateRace({
      track: FLAT,
      runners: [runner("fast", { ...base, speed: 130 }), runner("base", base)],
      seed
    });
    if (speedRace.results[0].id === "fast") fasterWins += 1;

    const powerRace = simulateRace({
      track: OVAL,
      runners: [runner("strong", { ...base, power: 130 }), runner("base", base)],
      seed
    });
    if (powerRace.results[0].id === "strong") strongerWins += 1;
  }
  check("more Speed wins when stamina is not an issue", fasterWins === 20, `${fasterWins}/20`);
  check("more Power wins on a track full of corners", strongerWins === 20, `${strongerWins}/20`);

  // At 1200m a sprinter can afford to run dry near the line; at 2400m she cannot.
  const race = simulateRace({
    track: track("tokyo-classic"),
    runners: [
      runner("balanced", { speed: 110, stamina: 150, power: 115, wit: 100 }),
      runner("glass", { speed: 140, stamina: 100, power: 115, wit: 100 })
    ],
    seed: 7
  });
  check("a thin stamina bar runs dry at 2400m", finishOf(race, "glass").exhausted);
  check(
    "the balanced runner beats the glass cannon at 2400m",
    finishOf(race, "balanced").placement === 1,
    `${finishOf(race, "balanced").finishTime} x ${finishOf(race, "glass").finishTime} turns`
  );

  const thrifty = simulateRace({
    track: track("tokyo-classic"),
    runners: [
      runner("wise", { speed: 110, stamina: 150, power: 115, wit: 200 }),
      runner("plain", { speed: 110, stamina: 150, power: 115, wit: 20 })
    ],
    seed: 5
  });
  check(
    "Wit saves stamina",
    finishOf(thrifty, "wise").staminaLeft > finishOf(thrifty, "plain").staminaLeft ||
      (finishOf(thrifty, "plain").exhausted && !finishOf(thrifty, "wise").exhausted)
  );
}

// --- corners and segment boundaries ---------------------------------------------
{
  const stats = { speed: 120, stamina: 300, power: 96, wit: 100 };
  const onFlat = simulateRace({ track: FLAT, runners: [runner("r", stats)], seed: 3 }).results[0];
  const onOval = simulateRace({ track: OVAL, runners: [runner("r", stats)], seed: 3 }).results[0];
  check(
    "corners cost speed",
    onOval.finishTime > onFlat.finishTime,
    `oval ${onOval.finishTime} x flat ${onFlat.finishTime} turns`
  );

  const cut = customTrack(1200, [straight(0.2), straight(0.3), straight(0.3), straight(0.2)]);
  const onCut = simulateRace({ track: cut, runners: [runner("r", stats)], seed: 3 }).results[0];
  check(
    "straight segment boundaries lose no metres",
    onCut.finishTime === onFlat.finishTime,
    `${onCut.finishTime} x ${onFlat.finishTime} turns`
  );
}

// --- photo finishes -----------------------------------------------------------------
{
  const twins = Array.from({ length: 8 }, (_, index) =>
    runner(`twin-${index}`, { speed: 100, stamina: 120, power: 90, wit: 90 })
  );
  const race = simulateRace({ track: track("niigata-mile"), runners: twins, seed: 21 });
  const times = race.results.map((result) => result.finishTime);
  const sameTurn = new Set(times.map(Math.ceil)).size < times.length;
  check("identical runners never tie", new Set(times).size === times.length, times.join(" · "));
  check("some of them finish in the same turn, so the fraction decides", sameTurn);
}

// --- skills -------------------------------------------------------------------------
{
  let fired = 0;
  let helped = 0;
  const stats = { speed: 100, stamina: 150, power: 80, wit: 80 };
  for (let seed = 1; seed <= 20; seed += 1) {
    const race = simulateRace({
      track: FLAT,
      runners: [runner("dash", stats, [skill("concentration")]), runner("plain", stats)],
      seed
    });
    if (finishOf(race, "dash").skillsActivated.includes("Concentração")) fired += 1;
    if (finishOf(race, "dash").placement === 1) helped += 1;
  }
  check("an opening skill fires in most races", fired >= 16, `${fired}/20`);
  check("the skill usually decides a race between twins", helped >= 14, `${helped}/20`);

  // 200 Wit makes the gate burst a sure thing on turn 1, where the launch is decided.
  const burst = simulateRace({
    track: FLAT,
    runners: [
      runner("burst", { ...stats, wit: 200 }, [skill("gate-burst")]),
      runner("plain", { ...stats, wit: 200 })
    ],
    seed: 4
  });
  const firstTurn = burst.frames.find((frame) => frame.t === 1)!;
  check(
    "an accelBoost that fires on turn 1 speeds up the launch",
    finishOf(burst, "burst").skillsActivated.includes("Explosão de Portão") &&
      firstTurn.positions[0] > firstTurn.positions[1] * 1.3,
    `${firstTurn.positions[0]}m x ${firstTurn.positions[1]}m after turn 1`
  );

  const passive = simulateRace({
    track: track("sapporo-sprint"),
    runners: [runner("p", { speed: 70, stamina: 30, power: 60, wit: 40 }, [skill("iron-lungs")])],
    seed: 1
  });
  check(
    "passive stat skills are folded in before the race",
    passive.shortfalls.p === undefined,
    "30 + 25 Stamina clears the 35 requirement"
  );
}

// --- running dry on the last turn still counts ----------------------------------------
{
  // Sweeping Stamina walks the moment the bar empties across the whole race, so some of
  // these runners drain it on the very turn they cross the line.
  let dryFinishes = 0;
  let unflagged = 0;
  for (let stamina = 20; stamina <= 60; stamina += 1) {
    const race = simulateRace({
      track: track("sapporo-sprint"),
      runners: [runner("r", { speed: 60, stamina, power: 50, wit: 30 })],
      seed: 2
    });
    const result = race.results[0];
    if (result.staminaLeft === 0) {
      dryFinishes += 1;
      if (!result.exhausted) unflagged += 1;
    }
  }
  check(
    "a runner who finishes with an empty bar is flagged as exhausted",
    dryFinishes > 0 && unflagged === 0,
    `${unflagged} of ${dryFinishes} dry finishes unflagged`
  );
}

// --- replay sanity -------------------------------------------------------------------
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
    index === 0
      ? true
      : frame.positions.every((pos, lane) => pos >= race.frames[index - 1].positions[lane])
  );
  check("runners never move backwards in the replay", monotonic);
  check("the replay starts at the gates", race.frames[0].t === 0);
  check(
    "everyone reaches the finish line",
    race.frames[race.frames.length - 1].positions.every((pos) => pos >= race.distance)
  );
}

// --- every track is winnable on the requirements ---------------------------------------
for (const seed of TRACK_CATALOG) {
  const onRequirements = runner("req", seed.requirements);
  const shortOfStamina = runner("short", {
    ...seed.requirements,
    stamina: Math.round(seed.requirements.stamina * 0.7)
  });
  const race = simulateRace({ track: seed, runners: [onRequirements, shortOfStamina], seed: 11 });
  const req = finishOf(race, "req");
  const short = finishOf(race, "short");
  check(
    `${seed.name}: a runner on the requirements finishes in 15–35 turns`,
    req.finishTime > 15 && req.finishTime < 35,
    `${req.finishTime} turns, ${Math.round(req.staminaLeft * 100)}% stamina left`
  );
  check(
    `${seed.name}: 30% less Stamina runs dry and loses`,
    short.exhausted && short.placement === 2,
    `${short.finishTime} turns`
  );
}

console.log(failures === 0 ? "\nAll race engine checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
