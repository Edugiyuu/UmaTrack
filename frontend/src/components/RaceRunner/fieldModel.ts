import type {
  RaceFrame,
  RaceSimulation,
  RunnerTelemetry,
  RunningStyle,
  SkillActivation,
  SkillResponse,
  TrackResponse,
  TrackSegment
} from "../../types/race";
import type { LearnedSkill } from "../../types/horse";
import { skillEffectText } from "./useRaceEffects";

/**
 * Race v3 (docs/tasks/32-race-v3.md): what the drone view, the field list, the trainer's
 * notebook and the tension bar show at one instant of the replay. Everything here is a
 * pure function of the simulation and the clock, so pausing, stepping and seeking just
 * work; nothing is invented on top of what the engine recorded.
 */

/** Positions and stamina (0..1) of every runner at `time`, interpolated between frames. */
export const sampleFrames = (frames: RaceFrame[], time: number) => {
  if (!frames.length) return { positions: [] as number[], stamina: [] as number[] };
  let index = frames.findIndex((frame) => frame.t >= time);
  if (index === -1) index = frames.length - 1;
  const current = frames[index];
  const previous = frames[Math.max(0, index - 1)];
  const span = current.t - previous.t;
  const ratio = span > 0 ? Math.min(1, Math.max(0, (time - previous.t) / span)) : 1;
  return {
    positions: current.positions.map(
      (position, lane) => previous.positions[lane] + (position - previous.positions[lane]) * ratio
    ),
    stamina: current.stamina.map(
      (value, lane) => previous.stamina[lane] + (value - previous.stamina[lane]) * ratio
    )
  };
};

export type SkillState = "ready" | "firing" | "used";

export interface FieldSkill {
  slug: string;
  name: string;
  state: SkillState;
  /** Turn it fired in, counted from 1, once it has. */
  turn?: number;
}

export interface FieldRunner {
  id: string;
  name: string;
  isPlayer: boolean;
  isRival: boolean;
  runningStyle: RunningStyle;
  /** Index in the simulation, which is also her lane on the drone view. */
  lane: number;
  color: string;
  /** Metres covered. */
  position: number;
  /** Stamina left, 0..1. */
  stamina: number;
  /** Stamina spent over the last turn, 0..1 (0 once she has crossed the line). */
  staminaDrop: number;
  /** Metres run over the last turn. */
  speed: number;
  /** 1 = leading. */
  placement: number;
  /** Metres behind the leader. */
  gap: number;
  finished: boolean;
  skills: FieldSkill[];
}

/** The tank colours of the design: green, then amber, then red below a quarter. */
export const staminaTone = (stamina: number) =>
  stamina > 0.5 ? "high" : stamina >= 0.25 ? "mid" : "low";

interface BuildFieldOptions {
  simulation: RaceSimulation;
  time: number;
  colorOf: (lane: number) => string;
  /** The skill catalogue, for names and effects; may be empty while it loads. */
  skills: Map<string, SkillResponse>;
  /** What the player's horse has learned: the ones that have not fired are still waiting. */
  playerSkills: LearnedSkill[];
}

const skillName = (slug: string, skills: Map<string, SkillResponse>, fired?: SkillActivation) =>
  fired?.skillName ?? skills.get(slug)?.name ?? slug;

/** Every runner at `time`, in simulation order. */
export const buildField = ({
  simulation,
  time,
  colorOf,
  skills,
  playerSkills
}: BuildFieldOptions): FieldRunner[] => {
  const now = sampleFrames(simulation.frames, time);
  const before = sampleFrames(simulation.frames, Math.max(0, time - 1));
  const leader = Math.max(0, ...now.positions);
  // Runners past the line all sit on it: among them, whoever crossed first is ahead.
  const finishTimes = new Map(simulation.results.map((result) => [result.id, result.finishTime]));
  // Once home, a runner's gap is how far back she was when the winner crossed.
  const winnerTime = Math.min(...simulation.results.map((result) => result.finishTime));
  const atWinner = sampleFrames(simulation.frames, winnerTime);
  const order = now.positions
    .map((position, lane) => ({
      position,
      lane,
      crossed: position >= simulation.distance ? finishTimes.get(simulation.runners[lane].id) ?? Infinity : null
    }))
    .sort((a, b) =>
      a.crossed !== null && b.crossed !== null ? a.crossed - b.crossed : b.position - a.position
    )
    .map((entry) => entry.lane);
  const profiles = new Map(simulation.rivals.map((rival) => [rival.id, rival]));

  return simulation.runners.map((runner, lane) => {
    const position = now.positions[lane] ?? 0;
    const finished = position >= simulation.distance;
    const fired = simulation.activations.filter(
      (activation) => activation.runnerId === runner.id && activation.time < time
    );
    const known = runner.isPlayer
      ? playerSkills.map((skill) => skill.slug)
      : profiles.get(runner.id)?.skills ?? [];
    const slugs = [...new Set([...known, ...fired.map((activation) => activation.skillSlug)])];

    const runnerSkills = slugs.map<FieldSkill>((slug) => {
      const activation = fired.find((candidate) => candidate.skillSlug === slug);
      if (!activation) return { slug, name: skillName(slug, skills), state: "ready" };
      return {
        slug,
        name: skillName(slug, skills, activation),
        state: time <= activation.time + 1 ? "firing" : "used",
        turn: activation.time + 1
      };
    });

    return {
      id: runner.id,
      name: runner.name,
      isPlayer: runner.isPlayer,
      isRival: runner.isRival,
      runningStyle: runner.runningStyle,
      lane,
      color: colorOf(lane),
      position,
      stamina: Math.max(0, now.stamina[lane] ?? 0),
      staminaDrop: finished ? 0 : Math.max(0, (before.stamina[lane] ?? 0) - (now.stamina[lane] ?? 0)),
      speed: finished ? 0 : Math.max(0, position - (before.positions[lane] ?? 0)),
      placement: order.indexOf(lane) + 1,
      gap: finished
        ? Math.max(0, simulation.distance - (atWinner.positions[lane] ?? simulation.distance))
        : Math.max(0, leader - position),
      finished,
      skills: runnerSkills
    };
  });
};

/** The field sorted leader first. */
export const byPlacement = (field: FieldRunner[]) =>
  [...field].sort((a, b) => a.placement - b.placement);

// --- the course ----------------------------------------------------------------------

export interface CourseStop {
  label: string;
  /** Metres from the gates where the stretch ends. */
  end: number;
  grade: number;
  curve: number;
}

/** The track's stretches in order, with where each one ends. */
export const courseStops = (track: TrackResponse): CourseStop[] => {
  let cursor = 0;
  return track.segments.map((segment: TrackSegment) => {
    cursor += segment.lengthRatio * track.distance;
    return { label: segment.label, end: Math.round(cursor), grade: segment.grade, curve: segment.curve };
  });
};

// --- the projection ------------------------------------------------------------------

export interface Projection {
  /** Who she would pass: the runner right ahead of her. */
  target: FieldRunner;
  /** Turn (from 1) she draws level, at the current speeds. */
  turn: number;
}

/**
 * At the speeds of the last turn, does she reach the runner right ahead before the line?
 * Only a projection: the engine keeps deciding turn by turn.
 */
export const projectPass = (
  field: FieldRunner[],
  distance: number,
  time: number
): Projection | null => {
  const player = field.find((runner) => runner.isPlayer);
  if (!player || player.finished || player.placement === 1) return null;
  const target = field.find((runner) => runner.placement === player.placement - 1);
  if (!target || target.finished) return null;
  const closing = player.speed - target.speed;
  if (closing <= 0.05 || player.speed <= 0) return null;
  const gap = target.position - player.position;
  const turnsToCatch = gap / closing;
  const turnsLeft = (distance - player.position) / player.speed;
  if (turnsToCatch > turnsLeft) return null;
  return { target, turn: Math.max(1, Math.ceil(time)) + Math.ceil(turnsToCatch) };
};

// --- tension -------------------------------------------------------------------------

export type TensionLevel = "low" | "mid" | "high" | "over";

export const TENSION_LABEL: Record<TensionLevel, string> = {
  low: "BAIXA",
  mid: "MÉDIA",
  high: "ALTA",
  over: "ACABOU!"
};

/**
 * How tight the race is for her right now: calm early, higher as the line nears, and
 * higher still with a runner within a few metres on either side.
 */
export const tensionAt = (
  field: FieldRunner[],
  telemetry: RunnerTelemetry | null,
  arrived: boolean
): TensionLevel => {
  if (arrived) return "over";
  const player = field.find((runner) => runner.isPlayer);
  if (!player || !telemetry) return "low";
  const close = field.some(
    (runner) => !runner.isPlayer && Math.abs(runner.position - player.position) < 4
  );
  if (telemetry.phase === "spurt" || telemetry.phase === "final") return "high";
  if (telemetry.phase === "middle") return close ? "high" : "mid";
  return close ? "mid" : "low";
};

// --- the trainer's notebook ----------------------------------------------------------

export type NoteTone = "info" | "good" | "warn" | "bad" | "skill";

export interface Note {
  tone: NoteTone;
  title: string;
  detail: string;
}

const STYLE_PLAN: Record<RunningStyle, string> = {
  front: "Ela é fugitiva: precisa abrir vantagem cedo.",
  pace: "Ela corre de ponta: perto da frente o tempo todo.",
  late: "Ela é perseguidora: o forte dela é o fim.",
  end: "Ela é fechadora: guarda tudo para o final."
};

const metres = (value: number) => `${Math.max(0, Math.round(value)).toLocaleString("pt-BR")} m`;
const share = (value: number) => `${Math.round(value * 100)}%`;

interface NotebookOptions {
  field: FieldRunner[];
  track: TrackResponse;
  time: number;
  telemetry: RunnerTelemetry | null;
  projection: Projection | null;
  skills: Map<string, SkillResponse>;
  /** She has crossed the line. */
  arrived: boolean;
  /** Gap to the runner right behind (a win) or to the winner (otherwise), in metres. */
  finishGap: number;
}

/**
 * Up to two observations and one verdict, written the way a trainer would jot them down.
 * The verdict is the last note and the notebook circles it.
 */
export const notebookNotes = ({
  field,
  track,
  time,
  telemetry,
  projection,
  skills,
  arrived,
  finishGap
}: NotebookOptions): { notes: Note[]; verdict: string } => {
  const player = field.find((runner) => runner.isPlayer);
  if (!player) return { notes: [], verdict: "" };
  const others = field.filter((runner) => !runner.isPlayer);
  const notes: Note[] = [];
  const turn = Math.max(1, Math.ceil(time));

  // A skill of hers that fired in the last few turns.
  const recentSkill = player.skills
    .filter((skill) => skill.turn !== undefined && turn - skill.turn <= 3)
    .sort((a, b) => (b.turn ?? 0) - (a.turn ?? 0))[0];

  if (arrived) {
    const lastSkill = player.skills
      .filter((skill) => skill.turn !== undefined)
      .sort((a, b) => (b.turn ?? 0) - (a.turn ?? 0))[0];
    if (lastSkill) {
      notes.push({
        tone: "skill",
        title: `${lastSkill.name} no T${lastSkill.turn}!`,
        detail: skillEffectText(skills.get(lastSkill.slug)) || "a skill dela entrou na corrida"
      });
    }
    const emptiest = [...others].sort((a, b) => a.stamina - b.stamina)[0];
    if (emptiest && emptiest.stamina < 0.1) {
      notes.push({ tone: "bad", title: `${emptiest.name} zerou o fôlego`, detail: "chegou sem nada no tanque" });
    }
    const verdict =
      player.placement === 1
        ? finishGap < 1.5
          ? "Ganhou por um focinho!!"
          : `Ganhou com ${metres(finishGap)} de folga!`
        : `Chegou em ${player.placement}º, a ${metres(finishGap)} da vencedora.`;
    return { notes: notes.slice(0, 2), verdict };
  }

  if (time < 2) {
    const fugitive = others.find((runner) => runner.runningStyle === "front" && runner.isRival);
    if (fugitive) {
      notes.push({ tone: "info", title: `${fugitive.name} é fugitiva`, detail: "dispara na frente e costuma cansar" });
    }
    const climb = courseStops(track).find((stop) => stop.grade > 0);
    if (climb) {
      notes.push({ tone: "warn", title: `Subida de ${climb.grade}%`, detail: `${climb.label}, pesa no fôlego` });
    }
    return { notes: notes.slice(0, 2), verdict: STYLE_PLAN[player.runningStyle] };
  }

  if (recentSkill) {
    notes.push({
      tone: "skill",
      title: `${recentSkill.name} na hora certa!`,
      detail: skillEffectText(skills.get(recentSkill.slug)) || `disparou no turno ${recentSkill.turn}`
    });
  }

  // Someone near the front running out.
  const tiring = others
    .filter((runner) => runner.placement <= Math.max(3, player.placement) && runner.stamina < 0.3)
    .sort((a, b) => a.placement - b.placement)[0];
  if (tiring) {
    notes.push({
      tone: "bad",
      title: tiring.placement === 1 ? `${tiring.name} não chega inteira` : `${tiring.name} está cansando`,
      detail:
        tiring.stamina < 0.01
          ? "já está sem fôlego nenhum"
          : `${share(tiring.stamina)} e perdendo ${share(tiring.staminaDrop)} por turno`
    });
  }

  // Someone right behind her, and coming.
  const chaser = others
    .filter((runner) => runner.placement === player.placement + 1)
    .find((runner) => player.position - runner.position < 5 && runner.speed >= player.speed);
  if (chaser) {
    notes.push({
      tone: "warn",
      title: `${chaser.name} colando atrás`,
      detail: `a ${metres(player.position - chaser.position)}, com ${share(chaser.stamina)} de fôlego`
    });
  }

  const waiting = player.skills.find((skill) => skill.state === "ready");
  if (waiting) {
    notes.push({ tone: "skill", title: `${waiting.name} ainda guardada`, detail: "pode disparar a qualquer turno" });
  }

  let verdict = STYLE_PLAN[player.runningStyle];
  if (projection) {
    verdict = `No ritmo atual, passa a ${projection.target.name} no T${projection.turn}!`;
  } else if (telemetry) {
    const left = Math.max(1, Math.ceil(telemetry.remaining / Math.max(1, telemetry.runSpeed)));
    if (telemetry.pace === "safe") verdict = `Dá! O fôlego cobre os ~${left} turnos que faltam.`;
    else if (telemetry.pace === "tight") verdict = "No limite: o fôlego mal cobre o resto.";
    else verdict = `Não vai dar: o fôlego acaba ~${metres(telemetry.remaining - telemetry.staminaRange)} antes.`;
  }

  return { notes: notes.slice(0, 2), verdict };
};
