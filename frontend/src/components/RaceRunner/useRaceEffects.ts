import { useEffect, useMemo, useRef } from "react";
import type {
  RaceSimulation,
  SkillActivation,
  SkillEffectKind,
  SkillResponse
} from "../../types/race";

/**
 * The race's visual effects (docs/tasks/23-race-skill-fx.md), derived from the replay
 * and the instant being shown. Nothing is recomputed from the stats: every effect reads
 * what the engine already recorded, so pausing, stepping and seeking just work.
 */

/** Skill effects that make her faster, and so draw the speed lines. */
const SPEED_KINDS: SkillEffectKind[] = ["speedBoost", "accelBoost", "startDash"];

/** Below this share of the tank the stamina card pulses red. */
export const LOW_STAMINA = 0.25;

export interface ActiveSkill {
  activation: SkillActivation;
  /** Undefined when the catalogue did not load; the highlight still shows. */
  skill?: SkillResponse;
  kind?: SkillEffectKind;
}

export interface RaceEffects {
  /** Skills firing right now, by runner id: each lights its runner for one turn. */
  highlights: Map<string, ActiveSkill>;
  /** The player's own skill firing right now, if any. */
  playerSkill: ActiveSkill | null;
  /** A speed skill working this turn, with the m/turn it added (0 for acceleration). */
  boost: { gain: number; skillName: string | null } | null;
  /** Stamina a recovery skill gave back this turn, as a share of the tank. */
  heal: { gain: number; skillName: string } | null;
  /** Stamina left, as a share of the tank. */
  staminaShare: number;
  lowStamina: boolean;
  /** Speed change against the previous turn, m/turn. */
  speedTrend: number;
  /** She has entered the last 20% of the race. */
  finalStretch: boolean;
}

export type RaceEvent =
  | { type: "skill"; active: ActiveSkill }
  | { type: "startVerdict"; good: boolean; placement: number }
  | { type: "finalStretch"; remaining: number }
  | { type: "finish" };

const EMPTY_HIGHLIGHTS = new Map<string, ActiveSkill>();

const percent = (value: number) => Math.round(value * 100);

/** "+8 m/turno", "+18% de fôlego": what a skill does, in the words of the HUD. */
export const skillEffectText = (skill?: SkillResponse) => {
  if (!skill) return "";
  const { kind, value, stat } = skill.effect;
  switch (kind as SkillEffectKind) {
    case "speedBoost":
      return `+${value} m/turno`;
    case "startDash":
      return `largada +${value} m/turno`;
    case "cornerBoost":
      return `+${value} m/turno na curva`;
    case "accelBoost":
      return `aceleração +${percent(value)}%`;
    case "staminaRecover":
      return `+${percent(value)}% de fôlego`;
    case "staminaSave":
      return `−${percent(value)}% de gasto de fôlego`;
    case "inclineBoost":
      return `−${percent(value)}% de perda na subida`;
    case "flatStat":
      return `+${value} de ${stat ?? "atributo"}`;
    default:
      return "";
  }
};

interface UseRaceEffectsOptions {
  simulation: RaceSimulation;
  /** Race time being shown, in turns. */
  time: number;
  skills: Map<string, SkillResponse>;
  /** Stamina at the gates, the HUD's reference. */
  maxStamina: number;
  /**
   * The race is really running: not behind the rivals' introduction, the countdown or the
   * results. One-off events (toasts, banner, cutscene, sounds) and skill effects wait for it.
   */
  live: boolean;
  onEvent: (event: RaceEvent) => void;
}

export const useRaceEffects = ({
  simulation,
  time,
  skills,
  maxStamina,
  live,
  onEvent
}: UseRaceEffectsOptions): RaceEffects => {
  const turns = useMemo(() => simulation.telemetry ?? [], [simulation]);

  const described = useMemo(
    () =>
      simulation.activations.map<ActiveSkill>((activation) => {
        const skill = skills.get(activation.skillSlug);
        return { activation, skill, kind: skill?.effect.kind as SkillEffectKind | undefined };
      }),
    [simulation, skills]
  );

  /** Index of the first turn in the spurt, or -1 for a race too short to have one. */
  const spurtIndex = useMemo(() => turns.findIndex((turn) => turn.phase === "spurt"), [turns]);
  const playerFinish = useMemo(
    () => simulation.results.find((result) => result.isPlayer)?.finishTime ?? Infinity,
    [simulation]
  );

  // --- one-off events: fired when the clock crosses them, once per race -------------
  const seen = useRef(new Set<string>());
  const previous = useRef<number | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    seen.current = new Set();
    previous.current = null;
  }, [simulation]);

  useEffect(() => {
    if (!live) {
      previous.current = null;
      return;
    }
    // The first live instant counts everything at the gates (time 0) as crossed.
    const from = previous.current ?? -1;
    previous.current = time;
    // Going back never replays anything; the highlights below are derived and do.
    if (time <= from) return;

    /** An instant (turn 1 over, the finish line) the clock has just passed. */
    const crossed = (at: number) => from < at && at <= time;
    /**
     * Turn `index` (0-based, as activations count) has just started playing. A turn is
     * the span (index, index + 1], so stepping to the end of the turn before does not
     * give away what happens in the next one.
     */
    const entered = (index: number) => from <= index && index < time;
    const once = (key: string, event: RaceEvent) => {
      if (seen.current.has(key)) return;
      seen.current.add(key);
      onEventRef.current(event);
    };

    described.forEach((active, index) => {
      if (entered(active.activation.time)) once(`skill-${index}`, { type: "skill", active });
    });

    if (crossed(1) && turns.length > 1) {
      // Where she stands once turn 1 is run, against the field.
      const placement = turns[1].placement;
      const good = placement <= Math.ceil(simulation.runners.length / 2);
      once("start", { type: "startVerdict", good, placement });
    }

    if (spurtIndex >= 0 && entered(spurtIndex)) {
      once("final", { type: "finalStretch", remaining: turns[spurtIndex].remaining });
    }

    if (crossed(playerFinish)) once("finish", { type: "finish" });
  }, [time, live, described, turns, spurtIndex, playerFinish, simulation]);

  // --- derived state: a pure function of the instant --------------------------------
  const turnIndex = turns.length ? Math.min(turns.length, Math.max(1, Math.ceil(time))) - 1 : -1;

  return useMemo<RaceEffects>(() => {
    const highlights = new Map<string, ActiveSkill>();
    const playerSkills: ActiveSkill[] = [];
    // Nothing lights up behind the rivals' introduction or the countdown. A skill lights
    // its runner for the turn it fired in: (at, at + 1].
    for (const active of live ? described : []) {
      const { time: at, runnerId } = active.activation;
      if (at < time && time <= at + 1) {
        highlights.set(runnerId, active);
        if (runnerId === "player") playerSkills.push(active);
      }
    }
    // Two of hers in one turn: the `unique` one has the stage.
    const playerSkill =
      playerSkills.find((active) => active.skill?.rarity === "unique") ?? playerSkills.at(-1) ?? null;
    const recovery = playerSkills.find((active) => active.kind === "staminaRecover");
    const turn = turnIndex >= 0 ? turns[turnIndex] : null;
    // Past her last turn she has crossed the line: no boost, refill or trend is live.
    const running = Math.ceil(time) <= turns.length;

    let boost: RaceEffects["boost"] = null;
    if (live && running && turn && turn.effects.some((kind) => SPEED_KINDS.includes(kind))) {
      const source = [...described]
        .reverse()
        .find(
          (active) =>
            active.activation.runnerId === "player" &&
            active.kind &&
            SPEED_KINDS.includes(active.kind) &&
            active.activation.time <= turnIndex
        );
      boost = {
        gain: Math.max(0, turn.runSpeed - turn.speed),
        skillName: source?.activation.skillName ?? null
      };
    }

    let heal: RaceEffects["heal"] = null;
    if (recovery && running && maxStamina > 0) {
      const index = recovery.activation.time;
      const after = turns[index];
      if (after) {
        const before = index > 0 ? turns[index - 1].stamina : maxStamina;
        const gain = (after.stamina - (before - after.staminaCost)) / maxStamina;
        if (gain > 0) heal = { gain, skillName: recovery.activation.skillName };
      }
    }

    const staminaShare = turn && maxStamina > 0 ? Math.max(0, turn.stamina) / maxStamina : 1;
    const previousTurn = turnIndex > 0 ? turns[turnIndex - 1] : null;

    return {
      highlights: highlights.size ? highlights : EMPTY_HIGHLIGHTS,
      playerSkill,
      boost,
      heal,
      staminaShare,
      lowStamina: staminaShare < LOW_STAMINA,
      speedTrend: running && turn && previousTurn ? turn.runSpeed - previousTurn.runSpeed : 0,
      finalStretch: live && spurtIndex >= 0 && time > spurtIndex
    };
  }, [described, live, time, turnIndex, turns, maxStamina, spurtIndex]);
};
