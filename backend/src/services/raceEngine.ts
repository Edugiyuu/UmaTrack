import type {
  RaceFrame,
  RacePhase,
  RaceRunnerInput,
  RaceRunnerResult,
  RaceSimulation,
  RaceSkill,
  RaceTrackInput,
  RunnerTelemetry,
  PaceVerdict,
  SkillActivation,
  StatBlock
} from "../types/race";

/*
 * Turn-based race engine. Every rule is simple enough to redo on paper; see
 * docs/tasks/14-race-turn-engine.md for the reasoning behind each one.
 *
 * Units: distance in metres, speed in metres per turn, time in turns. The stat values
 * are used as-is: a Speed of 120 is a ceiling of 120 m/turn.
 */

/** Turn 1 starts at Power / START_DIVISOR. */
const START_DIVISOR = 2;
/** Every later turn adds Power / ACCEL_DIVISOR, up to the Speed ceiling. */
const ACCEL_DIVISOR = 6;
/** Entering a corner divides the current speed by this. */
const CURVE_DIVISOR = 1.2;
/** A segment whose `curve` reaches this counts as a corner. */
const CORNER_THRESHOLD = 0.4;
/** Stamina spent per turn is speed² / STAMINA_DIVISOR, before pressure and Wit. */
const STAMINA_DIVISOR = 1800;
/** Wit cuts the stamina cost by Wit / WIT_RELIEF_DIVISOR. */
const WIT_RELIEF_DIVISOR = 500;
/** Wit relief and staminaSave skills together never cut more than this. */
const MAX_STAMINA_SAVE = 0.6;
/** Stamina cost multiplier in the first, second and last third of the race. */
const PRESSURE = [1, 1.25, 1.5] as const;
/** Out of stamina: Power is divided by this... */
const TIRED_POWER_DIVISOR = 3;
/** ...and the Speed ceiling by this. */
const TIRED_SPEED_DIVISOR = 2;
/** Each turn's advance varies by up to ±NOISE so identical runners do not lockstep. */
const NOISE = 0.02;
/** Chance added to a skill's per-turn activation chance for each point of Wit. */
const SKILL_CHANCE_PER_WIT = 0.002;
/** Replay samples per turn. Motion inside a turn is uniform, so these are exact. */
const FRAME_SUBSTEPS = 4;
/** Safety net so a hopeless runner still ends the race. */
const MAX_TURNS = 300;
/** Telemetry: a stamina range this far past the line is `safe`... */
const SAFE_RANGE = 1.15;
/** ...this far is `tight`, and anything short of it is `rushed`. */
const TIGHT_RANGE = 0.95;

const STATS = ["speed", "stamina", "power", "wit"] as const;

/** mulberry32: small, fast and deterministic, which is all the engine needs. */
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

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** Skill trigger windows. Pressure uses thirds instead (see `pressureAt`). */
const phaseAt = (progress: number): RacePhase => {
  if (progress >= 0.8) return "spurt";
  if (progress >= 0.66) return "final";
  if (progress >= 0.16) return "middle";
  return "opening";
};

const pressureAt = (progress: number) => PRESSURE[Math.min(2, Math.floor(progress * 3))];

/** Telemetry is rounded when recorded so the payload does not carry float noise. */
const round = (value: number, digits: number) => Number(value.toFixed(digits));

/**
 * Metres a runner can still cover on `stamina` if she holds `speed` from `from` to the
 * line, paying each remaining third at its own pressure. Past the line the last third's
 * pressure keeps applying, so the surplus also reads in metres.
 */
const staminaRangeFrom = (
  stamina: number,
  speed: number,
  save: number,
  from: number,
  distance: number
) => {
  const costPerMetre = (pressure: number) =>
    (speed / STAMINA_DIVISOR) * pressure * (1 - save);

  let left = stamina;
  let covered = 0;
  let position = from;
  for (let third = Math.min(2, Math.floor((from / distance) * 3)); third < 3; third += 1) {
    const metres = (distance * (third + 1)) / 3 - position;
    const cost = metres * costPerMetre(PRESSURE[third]);
    if (cost >= left) return covered + left / costPerMetre(PRESSURE[third]);
    left -= cost;
    covered += metres;
    position += metres;
  }
  return covered + left / costPerMetre(PRESSURE[2]);
};

const paceFor = (range: number, remaining: number): PaceVerdict => {
  if (range >= remaining * SAFE_RANGE) return "safe";
  if (range >= remaining * TIGHT_RANGE) return "tight";
  return "rushed";
};

interface ResolvedSegment {
  start: number;
  end: number;
  grade: number;
  curve: number;
  isCorner: boolean;
}

/** Turns the ratio-based segments into absolute metre ranges. */
const resolveSegments = (track: RaceTrackInput): ResolvedSegment[] => {
  const segments: ResolvedSegment[] = [];
  let cursor = 0;

  track.segments.forEach((segment, index) => {
    const isLast = index === track.segments.length - 1;
    const end = isLast ? track.distance : cursor + segment.lengthRatio * track.distance;
    segments.push({
      start: cursor,
      end,
      grade: segment.grade,
      curve: segment.curve,
      isCorner: segment.curve >= CORNER_THRESHOLD
    });
    cursor = end;
  });

  return segments;
};

const segmentIndexAt = (segments: ResolvedSegment[], distance: number) => {
  const index = segments.findIndex((segment) => distance < segment.end);
  return index === -1 ? segments.length - 1 : index;
};

const matchesTerrain = (skill: RaceSkill, segment: ResolvedSegment) => {
  switch (skill.trigger.terrain) {
    case "uphill":
      return segment.grade > 0.8;
    case "downhill":
      return segment.grade < -0.8;
    case "corner":
      return segment.isCorner;
    case "straight":
      return !segment.isCorner && Math.abs(segment.grade) < 1;
    default:
      return true;
  }
};

interface ActiveEffect {
  kind: RaceSkill["effect"]["kind"];
  value: number;
  /** First turn in which the effect no longer applies. */
  expiresAt: number;
}

interface RunnerState {
  input: RaceRunnerInput;
  stats: StatBlock;
  maxStamina: number;
  stamina: number;
  distance: number;
  /** Base speed carried from turn to turn, in m/turn. Skill bonuses sit on top of it. */
  speed: number;
  topSpeed: number;
  finishTime: number | null;
  exhausted: boolean;
  pendingSkills: RaceSkill[];
  effects: ActiveEffect[];
  activated: string[];
}

const buildRunnerState = (runner: RaceRunnerInput): RunnerState => {
  // `flatStat` skills are passive, so they are folded into the stats up front.
  const stats: StatBlock = {
    speed: runner.speed,
    stamina: runner.stamina,
    power: runner.power,
    wit: runner.wit
  };

  const pendingSkills: RaceSkill[] = [];
  for (const skill of runner.skills) {
    if (skill.effect.kind === "flatStat" && skill.effect.stat) {
      stats[skill.effect.stat] += skill.effect.value;
    } else {
      pendingSkills.push(skill);
    }
  }

  return {
    input: runner,
    stats,
    maxStamina: stats.stamina,
    stamina: stats.stamina,
    distance: 0,
    speed: 0,
    topSpeed: 0,
    finishTime: null,
    exhausted: false,
    pendingSkills,
    effects: [],
    activated: []
  };
};

const sumEffects = (state: RunnerState, kinds: ActiveEffect["kind"][]) =>
  state.effects.reduce(
    (total, effect) => (kinds.includes(effect.kind) ? total + effect.value : total),
    0
  );

const staminaRatio = (state: RunnerState) =>
  state.maxStamina > 0 ? clamp(state.stamina / state.maxStamina, 0, 1) : 0;

export interface SimulateRaceOptions {
  track: RaceTrackInput;
  runners: RaceRunnerInput[];
  seed: number;
}

/**
 * Runs the whole race turn by turn. The result is fully determined by the seed, so the
 * same input always produces the same replay and the client can be handed the frames
 * to animate without ever being able to influence the outcome.
 */
export const simulateRace = ({ track, runners, seed }: SimulateRaceOptions): RaceSimulation => {
  const rng = createRng(seed);
  const segments = resolveSegments(track);
  const states = runners.map(buildRunnerState);

  const frames: RaceFrame[] = [
    { t: 0, positions: states.map(() => 0), stamina: states.map(() => 1) }
  ];
  const activations: SkillActivation[] = [];
  const telemetry: RunnerTelemetry[] = [];
  const playerLane = states.findIndex((state) => state.input.isPlayer);

  let turn = 0;

  while (states.some((state) => state.finishTime === null) && turn < MAX_TURNS) {
    turn += 1;

    // Placement is read before anyone moves, so every runner sees the same snapshot.
    const standings = [...states].sort((a, b) => b.distance - a.distance);
    const placementOf = new Map(standings.map((state, index) => [state.input.id, index + 1]));

    const startDistances = states.map((state) => state.distance);
    const startStamina = states.map(staminaRatio);
    const advances = states.map(() => 0);
    /** Fraction of this turn at which each runner crossed the line, if she did. */
    const finishFractions: (number | null)[] = states.map(() => null);

    states.forEach((state, lane) => {
      if (state.finishTime !== null) return;

      const segment = segments[segmentIndexAt(segments, state.distance)];
      const progress = state.distance / track.distance;

      state.effects = state.effects.filter((effect) => effect.expiresAt > turn);

      // --- skills ------------------------------------------------------------
      for (let index = state.pendingSkills.length - 1; index >= 0; index -= 1) {
        const skill = state.pendingSkills[index];
        const { trigger } = skill;

        if (trigger.phase !== "any" && trigger.phase !== phaseAt(progress)) continue;
        if (!matchesTerrain(skill, segment)) continue;
        if (trigger.maxStaminaRatio !== undefined && staminaRatio(state) > trigger.maxStaminaRatio) {
          continue;
        }
        if (trigger.minPosition !== undefined) {
          const placement = placementOf.get(state.input.id) ?? 1;
          if (placement < trigger.minPosition) continue;
        }

        const chance = trigger.baseChance + state.stats.wit * SKILL_CHANCE_PER_WIT;
        if (rng() > Math.min(1, chance)) continue;

        state.pendingSkills.splice(index, 1);
        state.activated.push(skill.name);
        activations.push({
          runnerId: state.input.id,
          runnerName: state.input.name,
          skillSlug: skill.slug,
          skillName: skill.name,
          time: turn - 1,
          distance: Math.round(state.distance)
        });

        if (skill.effect.kind === "staminaRecover") {
          state.stamina = Math.min(
            state.maxStamina,
            Math.max(0, state.stamina) + skill.effect.value * state.maxStamina
          );
        } else {
          state.effects.push({
            kind: skill.effect.kind,
            value: skill.effect.value,
            expiresAt: turn + Math.max(1, skill.effect.duration)
          });
        }
      }

      // --- speed ---------------------------------------------------------------
      const tired = state.stamina <= 0;
      const previousSpeed = state.speed;

      const power = tired ? state.stats.power / TIRED_POWER_DIVISOR : state.stats.power;
      const ceiling = tired ? state.stats.speed / TIRED_SPEED_DIVISOR : state.stats.speed;
      const accelBoost = 1 + sumEffects(state, ["accelBoost"]);

      // The launch is turn 1's acceleration, so an accelBoost that fires at the gates
      // boosts it; otherwise a one-turn opening boost would expire before it applied.
      if (turn === 1) {
        state.speed = Math.min(ceiling, (power / START_DIVISOR) * accelBoost);
      } else {
        state.speed = Math.min(ceiling, state.speed + (power / ACCEL_DIVISOR) * accelBoost);
      }
      // Nobody stands still: even a zero-stat runner eventually reaches the line.
      state.speed = Math.max(1, state.speed);

      const runSpeed = state.speed + sumEffects(state, ["speedBoost", "startDash", "cornerBoost"]);
      state.topSpeed = Math.max(state.topSpeed, runSpeed);

      // --- stamina ---------------------------------------------------------------
      const save = Math.min(
        MAX_STAMINA_SAVE,
        state.stats.wit / WIT_RELIEF_DIVISOR + sumEffects(state, ["staminaSave"])
      );
      const staminaCost =
        ((runSpeed * runSpeed) / STAMINA_DIVISOR) * pressureAt(progress) * (1 - save);
      const staminaBefore = state.stamina;
      state.stamina -= staminaCost;
      // Flag it the moment the bar empties, so running dry on the last turn still counts.
      if (state.stamina <= 0) state.exhausted = true;

      const remaining = track.distance - state.distance;

      // --- telemetry -------------------------------------------------------------
      // Only reads values already computed above, and never calls rng(), so recording
      // it cannot change the race.
      let record: RunnerTelemetry | null = null;
      if (lane === playerLane) {
        // Projected at the speed she is settling into (the ceiling while she still
        // accelerates), so the verdict does not start optimistic at the gates.
        const staminaRange = tired
          ? 0
          : staminaRangeFrom(
              staminaBefore,
              Math.max(runSpeed, ceiling),
              save,
              state.distance,
              track.distance
            );
        record = {
          turn,
          phase: phaseAt(progress),
          pressure: pressureAt(progress),
          placement: placementOf.get(state.input.id) ?? 1,
          speed: round(state.speed, 1),
          runSpeed: round(runSpeed, 1),
          ceiling: round(ceiling, 1),
          accel: turn === 1 ? 0 : round(state.speed - previousSpeed, 1),
          curveLoss: 0,
          staminaCost: round(staminaCost, 1),
          staminaSave: round(save, 3),
          stamina: round(state.stamina, 1),
          staminaRange: Math.round(staminaRange),
          remaining: Math.round(remaining),
          pace: tired ? "rushed" : paceFor(staminaRange, remaining),
          tired,
          effects: [...new Set(state.effects.map((effect) => effect.kind))]
        };
        telemetry.push(record);
      }

      // --- movement --------------------------------------------------------------
      const advance = runSpeed * (1 - NOISE + rng() * NOISE * 2);
      advances[lane] = advance;

      if (advance >= remaining) {
        // Crossed the line inside this turn: the fraction of the turn it took decides
        // photo finishes, so two runners finishing in the same turn never tie.
        finishFractions[lane] = remaining / advance;
        state.distance = track.distance;
        state.finishTime = Number((turn - 1 + remaining / advance).toFixed(4));
        return;
      }

      const before = segmentIndexAt(segments, state.distance);
      state.distance += advance;
      const after = segmentIndexAt(segments, state.distance);

      // The leftover metres carry into the next segment; every corner entered on the
      // way costs speed for the next turn.
      const speedBeforeCorners = state.speed;
      for (let index = before + 1; index <= after; index += 1) {
        if (segments[index].isCorner) state.speed /= CURVE_DIVISOR;
      }
      if (record) record.curveLoss = round(speedBeforeCorners - state.speed, 1);
    });

    // Regular samples, plus one at the exact moment each finisher crossed the line, so
    // the animation shows photo finishes at their real time and in their real order.
    const samples = Array.from({ length: FRAME_SUBSTEPS }, (_, index) => {
      const fraction = (index + 1) / FRAME_SUBSTEPS;
      return { fraction, t: Number((turn - 1 + fraction).toFixed(2)) };
    });
    states.forEach((state, lane) => {
      const fraction = finishFractions[lane];
      if (fraction === null) return;
      const sameTime = samples.find((sample) => sample.t === state.finishTime);
      if (sameTime) {
        // A finish that rounds onto a regular sample shares it, at the crossing instant.
        sameTime.fraction = Math.max(sameTime.fraction, fraction);
      } else {
        samples.push({ fraction, t: state.finishTime! });
      }
    });
    samples.sort((a, b) => a.t - b.t);

    for (const { fraction, t } of samples) {
      frames.push({
        t,
        positions: states.map((state, lane) => {
          const crossing = finishFractions[lane];
          if (crossing !== null && fraction >= crossing) return track.distance;
          const position = Math.round(startDistances[lane] + advances[lane] * fraction);
          // Rounding must never put a runner on the line before she actually crosses it.
          return crossing !== null ? Math.min(track.distance - 1, position) : Math.min(state.distance, position);
        }),
        stamina: states.map((state, lane) =>
          Number((startStamina[lane] + (staminaRatio(state) - startStamina[lane]) * fraction).toFixed(3))
        )
      });
    }
  }

  // Anyone still running when the turns ran out is timed out at the cap.
  for (const state of states) {
    if (state.finishTime === null) {
      state.finishTime = MAX_TURNS;
      state.exhausted = true;
    }
  }

  const results: RaceRunnerResult[] = [...states]
    .sort((a, b) => (a.finishTime ?? 0) - (b.finishTime ?? 0))
    .map((state, index) => ({
      id: state.input.id,
      name: state.input.name,
      isPlayer: state.input.isPlayer,
      runningStyle: state.input.runningStyle,
      placement: index + 1,
      finishTime: state.finishTime ?? MAX_TURNS,
      topSpeed: Number(state.topSpeed.toFixed(1)),
      staminaLeft: Number(staminaRatio(state).toFixed(3)),
      exhausted: state.exhausted,
      skillsActivated: state.activated
    }));

  const shortfalls: RaceSimulation["shortfalls"] = {};
  for (const state of states) {
    const missing = STATS.filter((stat) => state.stats[stat] < track.requirements[stat]).map(
      (stat) => ({
        stat,
        required: track.requirements[stat],
        current: state.stats[stat]
      })
    );
    if (missing.length) {
      shortfalls[state.input.id] = missing;
    }
  }

  return {
    seed,
    trackSlug: track.slug,
    distance: track.distance,
    runners: states.map((state) => ({
      id: state.input.id,
      name: state.input.name,
      isPlayer: state.input.isPlayer,
      isRival: state.input.isRival ?? false,
      runningStyle: state.input.runningStyle
    })),
    rivals: states
      .filter((state) => state.input.isRival)
      .map((state) => ({
        id: state.input.id,
        name: state.input.name,
        runningStyle: state.input.runningStyle,
        // As trained, without passive skills: the same basis as the player's own stats.
        stats: {
          speed: state.input.speed,
          stamina: state.input.stamina,
          power: state.input.power,
          wit: state.input.wit
        },
        skills: state.input.skills.map((skill) => skill.name)
      })),
    frames,
    results,
    activations,
    shortfalls,
    telemetry
  };
};
