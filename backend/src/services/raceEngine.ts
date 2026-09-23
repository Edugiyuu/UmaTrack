import type {
  RaceFrame,
  RacePhase,
  RaceRunnerInput,
  RaceRunnerResult,
  RaceSimulation,
  RaceSkill,
  RaceTrackInput,
  SkillActivation,
  StatBlock
} from "../types/race";
import type { RunningStyle } from "../models/user";

/** Simulation step, in seconds. */
const TICK = 0.1;
/** One replay frame every N ticks, to keep the payload small. */
const FRAME_EVERY = 5;
/** Pace a runner that exactly meets every requirement settles into. */
const REFERENCE_SPEED = 16;
/** Safety net so a hopeless runner still crosses the line. */
const MAX_RACE_SECONDS = 400;

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

/**
 * Where a runner stands relative to what the track asks for, shaped by how much the
 * track cares about that stat. A ratio of 1 means "exactly meets the requirement", so
 * the whole engine is calibrated around 1.0 and behaves the same at 1200m and 2400m.
 */
const statRatio = (value: number, requirement: number, weight: number) =>
  Math.pow(clamp(value / Math.max(requirement, 1), 0.3, 2.2), weight);

const PHASE_SPEED: Record<RacePhase, number> = {
  opening: 0.93,
  middle: 0.97,
  final: 1.02,
  spurt: 1.07
};

const STYLE_SPEED: Record<RunningStyle, Record<RacePhase, number>> = {
  front: { opening: 1.07, middle: 1.03, final: 0.98, spurt: 0.97 },
  pace: { opening: 1.02, middle: 1.01, final: 1.0, spurt: 1.02 },
  late: { opening: 0.97, middle: 0.99, final: 1.04, spurt: 1.06 },
  end: { opening: 0.92, middle: 0.97, final: 1.06, spurt: 1.11 }
};

const phaseAt = (progress: number): RacePhase => {
  if (progress >= 0.8) return "spurt";
  if (progress >= 0.66) return "final";
  if (progress >= 0.16) return "middle";
  return "opening";
};

interface ResolvedSegment {
  start: number;
  end: number;
  grade: number;
  curve: number;
}

/** Turns the ratio-based segments into absolute metre ranges. */
const resolveSegments = (track: RaceTrackInput): ResolvedSegment[] => {
  const segments: ResolvedSegment[] = [];
  let cursor = 0;

  track.segments.forEach((segment, index) => {
    const isLast = index === track.segments.length - 1;
    const end = isLast ? track.distance : cursor + segment.lengthRatio * track.distance;
    segments.push({ start: cursor, end, grade: segment.grade, curve: segment.curve });
    cursor = end;
  });

  return segments;
};

const segmentAt = (segments: ResolvedSegment[], distance: number) => {
  for (const segment of segments) {
    if (distance < segment.end) return segment;
  }
  return segments[segments.length - 1];
};

const matchesTerrain = (skill: RaceSkill, segment: ResolvedSegment) => {
  switch (skill.trigger.terrain) {
    case "uphill":
      return segment.grade > 0.8;
    case "downhill":
      return segment.grade < -0.8;
    case "corner":
      return segment.curve >= 0.4;
    case "straight":
      return segment.curve < 0.2 && Math.abs(segment.grade) < 1;
    default:
      return true;
  }
};

interface ActiveEffect {
  kind: RaceSkill["effect"]["kind"];
  value: number;
  expiresAt: number;
}

interface RunnerState {
  input: RaceRunnerInput;
  stats: StatBlock;
  ratios: StatBlock;
  maxStamina: number;
  stamina: number;
  baseDrain: number;
  accel: number;
  witSave: number;
  distance: number;
  velocity: number;
  topSpeed: number;
  finishTime: number | null;
  exhausted: boolean;
  pendingSkills: RaceSkill[];
  effects: ActiveEffect[];
  activated: string[];
}

const buildRunnerState = (runner: RaceRunnerInput, track: RaceTrackInput): RunnerState => {
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

  const ratios: StatBlock = {
    speed: statRatio(stats.speed, track.requirements.speed, track.statWeights.speed),
    stamina: statRatio(stats.stamina, track.requirements.stamina, track.statWeights.stamina),
    power: statRatio(stats.power, track.requirements.power, track.statWeights.power),
    wit: statRatio(stats.wit, track.requirements.wit, track.statWeights.wit)
  };

  // 100 stamina units is exactly enough to hold the reference pace to the line.
  const maxStamina = 100 * (0.45 + 0.55 * ratios.stamina);
  const referenceTime = track.distance / REFERENCE_SPEED;

  return {
    input: runner,
    stats,
    ratios,
    maxStamina,
    stamina: maxStamina,
    baseDrain: 100 / referenceTime,
    accel: 0.6 + 1.4 * ratios.power,
    witSave: Math.min(0.25, 0.1 * ratios.wit),
    distance: 0,
    velocity: 0,
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

const maxEffect = (state: RunnerState, kind: ActiveEffect["kind"]) =>
  state.effects.reduce(
    (best, effect) => (effect.kind === kind ? Math.max(best, effect.value) : best),
    0
  );

export interface SimulateRaceOptions {
  track: RaceTrackInput;
  runners: RaceRunnerInput[];
  seed: number;
}

/**
 * Runs the whole race. The result is fully determined by the seed, so the same input
 * always produces the same replay and the client can be handed the frames to animate
 * without ever being able to influence the outcome.
 */
export const simulateRace = ({ track, runners, seed }: SimulateRaceOptions): RaceSimulation => {
  const rng = createRng(seed);
  const segments = resolveSegments(track);
  const states = runners.map((runner) => buildRunnerState(runner, track));

  const frames: RaceFrame[] = [];
  const activations: SkillActivation[] = [];

  let time = 0;
  let tickIndex = 0;

  while (states.some((state) => state.finishTime === null) && time < MAX_RACE_SECONDS) {
    // Placement is read before anyone moves, so every runner sees the same snapshot.
    const standings = [...states].sort((a, b) => b.distance - a.distance);
    const placementOf = new Map(standings.map((state, index) => [state.input.id, index + 1]));

    for (const state of states) {
      if (state.finishTime !== null) continue;

      const segment = segmentAt(segments, state.distance);
      const progress = state.distance / track.distance;
      const phase = phaseAt(progress);
      const staminaRatio = state.stamina / state.maxStamina;

      state.effects = state.effects.filter((effect) => effect.expiresAt > time);

      for (let index = state.pendingSkills.length - 1; index >= 0; index -= 1) {
        const skill = state.pendingSkills[index];
        const { trigger } = skill;

        if (trigger.phase !== "any" && trigger.phase !== phase) continue;
        if (!matchesTerrain(skill, segment)) continue;
        if (trigger.maxStaminaRatio !== undefined && staminaRatio > trigger.maxStaminaRatio) continue;
        if (trigger.minPosition !== undefined) {
          const placement = placementOf.get(state.input.id) ?? 1;
          if (placement < trigger.minPosition) continue;
        }

        const chancePerSecond = trigger.baseChance + state.stats.wit * 0.0004;
        if (rng() > Math.min(1, chancePerSecond) * TICK) continue;

        state.pendingSkills.splice(index, 1);
        state.activated.push(skill.name);
        activations.push({
          runnerId: state.input.id,
          runnerName: state.input.name,
          skillSlug: skill.slug,
          skillName: skill.name,
          time: Number(time.toFixed(1)),
          distance: Math.round(state.distance)
        });

        if (skill.effect.kind === "staminaRecover") {
          state.stamina = Math.min(
            state.maxStamina,
            state.stamina + skill.effect.value * state.maxStamina
          );
        } else {
          state.effects.push({
            kind: skill.effect.kind,
            value: skill.effect.value,
            expiresAt: time + skill.effect.duration
          });
        }
      }

      // --- target speed ---------------------------------------------------
      const inclineRelief = Math.min(0.9, maxEffect(state, "inclineBoost"));
      const powerRatio = clamp(state.stats.power / Math.max(track.requirements.power, 1), 0, 1.8);

      // Uphill costs speed, and how much of it you keep is down to Power.
      const gradeSpeedFactor =
        segment.grade > 0
          ? 1 - (segment.grade / 100) * (3.2 - 1.6 * powerRatio) * (1 - inclineRelief)
          : 1 + (-segment.grade / 100) * 0.9;

      const curvePenalty = segment.curve * 0.05 * (1 - 0.3 * Math.min(state.ratios.wit, 1.5));
      const speedBonus = sumEffects(state, ["speedBoost", "startDash", "cornerBoost"]);

      let targetSpeed =
        REFERENCE_SPEED *
          (0.84 + 0.16 * state.ratios.speed) *
          PHASE_SPEED[phase] *
          STYLE_SPEED[state.input.runningStyle][phase] *
          Math.max(0.55, gradeSpeedFactor) *
          (1 - curvePenalty) +
        speedBonus;

      if (state.stamina <= 0) {
        state.exhausted = true;
        targetSpeed *= 0.62;
      }

      // --- acceleration ----------------------------------------------------
      const accel =
        state.accel * (1 + sumEffects(state, ["accelBoost"])) * (state.stamina <= 0 ? 0.5 : 1);
      const delta = targetSpeed - state.velocity;
      const step = delta > 0 ? Math.min(delta, accel * TICK) : Math.max(delta, -accel * 2 * TICK);
      state.velocity = Math.max(0, state.velocity + step);
      state.topSpeed = Math.max(state.topSpeed, state.velocity);

      // --- stamina ---------------------------------------------------------
      const gradeDrain =
        segment.grade > 0
          ? 1 + (segment.grade * 0.09) / Math.max(powerRatio, 0.4)
          : 1 - Math.min(0.25, -segment.grade * 0.04);
      const save = Math.min(0.55, state.witSave + sumEffects(state, ["staminaSave"]));
      const surfaceDrain = track.surface === "dirt" ? 1.08 : 1;

      state.stamina -=
        state.baseDrain *
        Math.pow(state.velocity / REFERENCE_SPEED, 2.4) *
        gradeDrain *
        surfaceDrain *
        (1 - save) *
        TICK;

      // A touch of noise keeps two identical runners from finishing in lockstep.
      const advance = state.velocity * TICK * (0.997 + rng() * 0.006);
      state.distance += advance;

      if (state.distance >= track.distance) {
        // Interpolate inside the tick so photo finishes are decided by the runners
        // rather than by their order in the array.
        const overshoot = state.distance - track.distance;
        const fraction = advance > 0 ? 1 - overshoot / advance : 1;
        state.distance = track.distance;
        state.finishTime = Number((time + TICK * fraction).toFixed(4));
      }
    }

    time += TICK;
    tickIndex += 1;

    if (tickIndex % FRAME_EVERY === 0) {
      frames.push({
        t: Number(time.toFixed(1)),
        positions: states.map((state) => Math.round(state.distance)),
        stamina: states.map((state) =>
          Number(clamp(state.stamina / state.maxStamina, 0, 1).toFixed(3))
        )
      });
    }
  }

  // Anyone still running when the clock ran out is timed out at the cap.
  for (const state of states) {
    if (state.finishTime === null) {
      state.finishTime = MAX_RACE_SECONDS;
      state.exhausted = true;
    }
  }

  frames.push({
    t: Number(time.toFixed(1)),
    positions: states.map((state) => Math.round(state.distance)),
    stamina: states.map((state) =>
      Number(clamp(state.stamina / state.maxStamina, 0, 1).toFixed(3))
    )
  });

  const results: RaceRunnerResult[] = [...states]
    .sort((a, b) => (a.finishTime ?? 0) - (b.finishTime ?? 0))
    .map((state, index) => ({
      id: state.input.id,
      name: state.input.name,
      isPlayer: state.input.isPlayer,
      runningStyle: state.input.runningStyle,
      placement: index + 1,
      finishTime: state.finishTime ?? MAX_RACE_SECONDS,
      topSpeed: Number(state.topSpeed.toFixed(2)),
      staminaLeft: Number(clamp(state.stamina / state.maxStamina, 0, 1).toFixed(3)),
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
      runningStyle: state.input.runningStyle
    })),
    frames,
    results,
    activations,
    shortfalls
  };
};
