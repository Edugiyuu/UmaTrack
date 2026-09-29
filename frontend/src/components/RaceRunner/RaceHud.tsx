import { memo, useLayoutEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { useTween } from "../../hooks/useTween";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import Button from "../ui/Button/Button";
import Meter from "../ui/Meter/Meter";
import {
  EFFECT_LABEL,
  PACE_LABEL,
  PACE_TONE,
  PRESSURE_LABEL,
  decimal,
  hudAlert,
  metres,
  multiplier,
  perTurn,
  rangeReading,
  speedReading,
  turnLine,
  type HudTone
} from "../../constants/raceTelemetry";
import type { RunnerTelemetry } from "../../types/race";
import type { RaceEffects } from "./useRaceEffects";
import "./RaceHud.css";

/** What the race effects add to the HUD this turn (task 23). */
export interface HudFx {
  boost: RaceEffects["boost"];
  heal: RaceEffects["heal"];
  lowStamina: boolean;
  /** Speed change against the previous turn, m/turn. */
  speedTrend: number;
  /** One of her skills is firing: the "Skills ativas" card glows. */
  skillGlow: boolean;
  /** Takes the alert's place, e.g. at the gates. */
  notice?: { title: string; body: string };
}

type AlertTone = "danger" | "heal" | "boost" | "info";

export interface RaceHudProps {
  /** The player's telemetry for the turn being played. */
  telemetry: RunnerTelemetry;
  /** Her ceiling before tiring, so a halved ceiling shows as half the bar. */
  topCeiling: number;
  /** Stamina at the gates, so what is left reads as a share of the tank. */
  maxStamina: number;
  hidden: boolean;
  onToggle: () => void;
  fx?: HudFx;
}

interface ReadingProps {
  label: string;
  tone: HudTone;
  value: ReactNode;
  detail: ReactNode;
  /** Dropped first on a phone, where only speed, stamina and pace fit. */
  secondary?: boolean;
  /** The reading the player watches most: wider, and in its own colour. */
  featured?: boolean;
  /** Red and beating: stamina running out. */
  pulse?: boolean;
  /** Lit for the turn a skill of hers fires. */
  glow?: boolean;
  /** A chip on the corner: "+15%", "▲ 0,6". */
  badge?: ReactNode;
  children?: ReactNode;
}

/** One HUD card. Its tone decides how loud it is; quiet is the normal state. */
const Reading = ({
  label,
  tone,
  value,
  detail,
  secondary,
  featured,
  pulse,
  glow,
  badge,
  children
}: ReadingProps) => (
  <div
    className={[
      "RaceHud__reading",
      `RaceHud__reading--${tone}`,
      secondary ? "RaceHud__reading--secondary" : "",
      featured ? "RaceHud__reading--featured" : "",
      pulse ? "RaceHud__reading--pulse" : "",
      glow ? "RaceHud__reading--glow" : ""
    ]
      .filter(Boolean)
      .join(" ")}
  >
    <span className="RaceHud__label">{label}</span>
    {badge && <span className="RaceHud__badge">{badge}</span>}
    <strong className="RaceHud__value">{value}</strong>
    {children}
    <span className="RaceHud__detail">{detail}</span>
  </div>
);

/**
 * The one sentence the HUD says. A moment (the gates, a skill paying off) outranks the
 * running warnings; among those, tired outranks low stamina, which outranks a forced pace.
 */
const pickAlert = (
  turn: RunnerTelemetry,
  topCeiling: number,
  staminaShare: number,
  fx?: HudFx
): { title: string; body: string; tone: AlertTone } | null => {
  if (fx?.notice) return { ...fx.notice, tone: "info" };
  if (fx?.heal) {
    return {
      title: `✦ ${fx.heal.skillName}`,
      body: `Recuperou ${Math.round(fx.heal.gain * 100)}% de fôlego · ${rangeReading(turn)}.`,
      tone: "heal"
    };
  }
  if (fx?.boost?.skillName && fx.boost.gain > 0 && !turn.tired) {
    return {
      title: `✦ ${fx.boost.skillName}`,
      body: `+${decimal(fx.boost.gain)} m/turno de velocidade neste turno.`,
      tone: "boost"
    };
  }
  if (!turn.tired && fx?.lowStamina) {
    const surplus = turn.staminaRange - turn.remaining;
    return {
      title: "Fôlego baixo",
      body:
        surplus >= 0 || turn.pace === "tight"
          ? `${staminaShare}% de fôlego · ainda dá para chegar na meta.`
          : `${staminaShare}% de fôlego · nesse ritmo ela zera ~${metres(-surplus)} antes da meta.`,
      tone: "danger"
    };
  }
  const warning = hudAlert(turn, topCeiling);
  return warning ? { ...warning, tone: "danger" } : null;
};

/**
 * The part of the range bar a refill paid for: the bar's fill, in the proportion the
 * refill makes of the stamina she now has.
 */
const rangeGain = (turn: RunnerTelemetry, gain: number, staminaRatio: number) => {
  if (staminaRatio <= 0) return undefined;
  const fill = turn.remaining > 0 ? Math.min(1, turn.staminaRange / turn.remaining) : 1;
  return fill * Math.min(1, gain / staminaRatio);
};

/**
 * What the player's girl is doing this turn, and why. Every number is measured against
 * a reference (the ceiling, the track left), readings stay quiet while they are normal,
 * and only one alert is raised at a time. Memoised: its props change once per turn, not
 * on every animation frame.
 */
const RaceHud = ({ telemetry: turn, topCeiling, maxStamina, hidden, onToggle, fx }: RaceHudProps) => {
  const speed = speedReading(turn);
  const stamina = Math.max(0, turn.stamina);
  const staminaRatio = maxStamina > 0 ? stamina / maxStamina : 0;
  const staminaShare = Math.round(staminaRatio * 100);
  const boost = turn.tired ? null : fx?.boost ?? null;
  const heal = fx?.heal ?? null;
  const lowStamina = fx?.lowStamina ?? false;

  // The numbers roll to each turn's value instead of jumping (the HUD changes per turn).
  const shownSpeed = useTween(turn.runSpeed);
  const shownStamina = useTween(staminaShare);
  const shownPressure = useTween(turn.pressure);

  // The pace card and the alert already carry a forced pace; the stamina card turns
  // red once the tank runs low, and green for the turn a skill refills it.
  const staminaTone: HudTone = heal
    ? "heal"
    : turn.tired || lowStamina
      ? "danger"
      : turn.pace === "safe"
        ? "quiet"
        : "normal";

  const alert = pickAlert(turn, topCeiling, staminaShare, fx);
  const trend = fx?.speedTrend ?? 0;

  // The alert slides in whenever its sentence changes.
  const alertRef = useRef<HTMLParagraphElement>(null);
  const alertText = alert ? `${alert.title}${alert.body}` : "";
  const reduced = usePrefersReducedMotion();
  useLayoutEffect(() => {
    if (reduced || !alertRef.current) return;
    const tween = gsap.from(alertRef.current, { x: 16, opacity: 0, duration: 0.3, ease: "power2.out" });
    return () => {
      tween.revert();
    };
  }, [alertText, reduced, hidden]);

  return (
    <section className="RaceHud" aria-label="Desempenho da sua corredora">
      <header className="RaceHud__bar">
        <p className="RaceHud__line">{turnLine(turn)}</p>
        {/* Announced when it changes, which is rarely; the readings are not. */}
        <div className="RaceHud__alert-slot" aria-live="polite">
          {!hidden && alert && (
            <p
              ref={alertRef}
              className={`RaceHud__alert RaceHud__alert--${alert.tone}`}
            >
              <strong>{alert.title}</strong> {alert.body}
            </p>
          )}
        </div>
        <Button size="sm" variant="ghost" aria-expanded={!hidden} onClick={onToggle}>
          {hidden ? "Mostrar HUD" : "Esconder HUD"}
        </Button>
      </header>

      {!hidden && (
        <>
          <div className="RaceHud__readings">
            <Reading
              label="Velocidade"
              tone={boost ? "boost" : speed.tone}
              value={perTurn(shownSpeed)}
              badge={
                Math.abs(trend) >= 0.1 ? (
                  <span className={trend > 0 ? "is-up" : "is-down"}>
                    {trend > 0 ? "▲" : "▼"} {decimal(Math.abs(trend))}
                  </span>
                ) : undefined
              }
              detail={
                boost && boost.gain > 0
                  ? `▲ +${decimal(boost.gain)}${boost.skillName ? ` com ${boost.skillName}` : ""} · teto ${turn.ceiling.toLocaleString("pt-BR")}`
                  : `${speed.state} · teto ${turn.ceiling.toLocaleString("pt-BR")}`
              }
            >
              <Meter
                compact
                label="Velocidade contra o teto"
                value={turn.runSpeed / topCeiling}
                marker={turn.ceiling < topCeiling ? turn.ceiling / topCeiling : undefined}
                caption={`teto ${perTurn(turn.ceiling)}`}
                tone={turn.tired ? "danger" : turn.curveLoss > 0 ? "curve" : "speed"}
              />
            </Reading>

            <Reading
              label="Fôlego"
              tone={staminaTone}
              featured
              pulse={lowStamina && !heal}
              value={`${Math.round(shownStamina)}%`}
              badge={heal ? `+${Math.round(heal.gain * 100)}%` : undefined}
              detail={
                heal
                  ? `+${Math.round(heal.gain * 100)}% com ${heal.skillName}`
                  : lowStamina && !turn.tired
                    ? `abaixo de 25% · −${decimal(turn.staminaCost)} no turno`
                    : `−${decimal(turn.staminaCost)} no turno`
              }
            >
              <Meter
                label="Alcance"
                value={turn.remaining > 0 ? turn.staminaRange / turn.remaining : 1}
                caption={`${metres(turn.staminaRange)} de ${metres(turn.remaining)}`}
                tone={turn.pace === "rushed" || turn.tired || lowStamina ? "danger" : "stamina"}
                gain={heal ? rangeGain(turn, heal.gain, staminaRatio) : undefined}
              />
            </Reading>

            <Reading
              label="Ritmo"
              tone={turn.tired ? "danger" : PACE_TONE[turn.pace]}
              value={turn.tired ? "cansada" : PACE_LABEL[turn.pace]}
              detail={turn.tired ? "teto pela metade até o fim" : rangeReading(turn)}
            />

            <Reading
              label="Pressão"
              tone={turn.pressure > 1 ? "normal" : "quiet"}
              value={multiplier(Math.round(shownPressure * 100) / 100)}
              detail={`${PRESSURE_LABEL[turn.pressure] ?? ""} · gasto de fôlego`}
              secondary
            />

            <Reading
              label="Skills ativas"
              tone={turn.effects.length ? "accent" : "quiet"}
              glow={fx?.skillGlow}
              value={turn.effects.length ? turn.effects.length : "—"}
              detail={
                turn.effects.length
                  ? turn.effects.map((effect) => EFFECT_LABEL[effect]).join(" · ")
                  : "nenhuma neste turno"
              }
              secondary
            />
          </div>
        </>
      )}
    </section>
  );
};

export default memo(RaceHud);
