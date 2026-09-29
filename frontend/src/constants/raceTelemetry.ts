import type { PaceVerdict, RunnerTelemetry, SkillEffectKind } from "../types/race";

/**
 * Words and thresholds for the race HUD (docs/tasks/13-race-telemetry-hud.md).
 * Nothing here recomputes the race: every number comes from the engine's telemetry,
 * this file only decides how to say it.
 */

/** How loud a HUD reading is: quiet when normal, loud only when it needs attention. */
export type HudTone = "quiet" | "normal" | "accent" | "curve" | "danger" | "boost" | "heal";

export const PACE_LABEL: Record<PaceVerdict, string> = {
  safe: "com sobra",
  tight: "no limite",
  rushed: "forçando"
};

/** `tight` is the one to aim for, so it is the only verdict that reads as good news. */
export const PACE_TONE: Record<PaceVerdict, HudTone> = {
  safe: "quiet",
  tight: "accent",
  rushed: "danger"
};

export const EFFECT_LABEL: Record<SkillEffectKind, string> = {
  speedBoost: "velocidade",
  accelBoost: "aceleração",
  staminaRecover: "recuperação",
  staminaSave: "economia de fôlego",
  startDash: "largada",
  inclineBoost: "subida",
  cornerBoost: "curva",
  flatStat: "atributo"
};

/** Which third of the race each pressure belongs to. */
export const PRESSURE_LABEL: Record<number, string> = {
  1: "1º terço",
  1.25: "2º terço",
  1.5: "último terço"
};

const number = (value: number, digits = 0, minDigits = digits) =>
  value.toLocaleString("pt-BR", { minimumFractionDigits: minDigits, maximumFractionDigits: digits });

// A no-break space keeps a number and its unit on the same line on a phone.
export const metres = (value: number) => `${number(value)}\u00a0m`;
export const perTurn = (value: number) => `${number(value)}\u00a0m/turno`;
/** "×1", "×1,25", "×1,5". */
export const multiplier = (value: number) => `×${number(value, 2, 0)}`;
export const decimal = (value: number) => number(value, 1);

export interface SpeedReading {
  /** "acelerando (+16)", "no teto", "perdeu 20 na curva", "cansada". */
  state: string;
  tone: HudTone;
}

/**
 * The speed state in words. Tired wins, then the corner (the loss lands at the end of
 * the turn, so the next turns show the climb back), then accelerating, then cruising.
 */
export const speedReading = (turn: RunnerTelemetry): SpeedReading => {
  if (turn.tired) return { state: "cansada", tone: "danger" };
  if (turn.curveLoss > 0) {
    return { state: `perdeu ${number(turn.curveLoss)} na curva`, tone: "curve" };
  }
  if (turn.turn === 1) return { state: "largada", tone: "normal" };
  if (turn.accel >= 0.5) return { state: `acelerando (+${number(turn.accel)})`, tone: "normal" };
  if (turn.speed >= turn.ceiling) return { state: "no teto", tone: "quiet" };
  return { state: "abaixo do teto", tone: "normal" };
};

/**
 * "sobra ~340 m" or "seca ~480 m antes da linha", against the track left. A `tight`
 * shortfall of a few metres is inside the projection's margin (corners cut the cost),
 * so it reads as reaching the line, not as running dry.
 */
export const rangeReading = (turn: RunnerTelemetry) => {
  if (turn.tired) return "sem fôlego";
  const surplus = turn.staminaRange - turn.remaining;
  if (surplus >= 0) return `sobra ~${metres(surplus)}`;
  if (turn.pace === "tight") return "chega na linha no limite";
  return `seca ~${metres(-surplus)} antes da linha`;
};

/**
 * The one line of text the HUD raises, or null when nothing needs saying. Only one at
 * a time: tired outranks rushed, because by then it is the whole story.
 */
export const hudAlert = (turn: RunnerTelemetry, topCeiling: number) => {
  if (turn.tired) {
    return {
      title: "Cansada",
      body: `O fôlego acabou: o teto caiu de ${perTurn(topCeiling)} para ${perTurn(turn.ceiling)} até o fim da prova.`
    };
  }
  if (turn.pace === "rushed") {
    return {
      title: "Forçando",
      body: `Nesse ritmo o fôlego dá para ~${metres(turn.staminaRange)} e faltam ${metres(turn.remaining)}. Stamina (ou Wit, que economiza) resolve.`
    };
  }
  return null;
};

/** "Turno 7 · 3º · 116 m/turno · −8,1 de fôlego · entrou na curva". */
export const turnLine = (turn: RunnerTelemetry) => {
  const parts = [
    `Turno ${turn.turn}`,
    `${turn.placement}º`,
    perTurn(turn.runSpeed),
    `−${decimal(turn.staminaCost)} de fôlego`
  ];
  if (turn.tired) parts.push("cansada");
  else if (turn.curveLoss > 0) parts.push("entrou na curva");
  else if (turn.turn === 1) parts.push("largada");
  else if (turn.accel >= 0.5) parts.push("acelerando");
  else if (turn.speed >= turn.ceiling) parts.push("no teto");
  return parts.join(" · ");
};
