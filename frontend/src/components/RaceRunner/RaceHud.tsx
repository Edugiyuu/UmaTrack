import { memo, type ReactNode } from "react";
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
import "./RaceHud.css";

export interface RaceHudProps {
  /** The player's telemetry for the turn being played. */
  telemetry: RunnerTelemetry;
  /** Her ceiling before tiring, so a halved ceiling shows as half the bar. */
  topCeiling: number;
  /** Stamina at the gates, so what is left reads as a share of the tank. */
  maxStamina: number;
  hidden: boolean;
  onToggle: () => void;
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
  children?: ReactNode;
}

/** One HUD card. Its tone decides how loud it is; quiet is the normal state. */
const Reading = ({ label, tone, value, detail, secondary, featured, children }: ReadingProps) => (
  <div
    className={[
      "RaceHud__reading",
      `RaceHud__reading--${tone}`,
      secondary ? "RaceHud__reading--secondary" : "",
      featured ? "RaceHud__reading--featured" : ""
    ]
      .filter(Boolean)
      .join(" ")}
  >
    <span className="RaceHud__label">{label}</span>
    <strong className="RaceHud__value">{value}</strong>
    {children}
    <span className="RaceHud__detail">{detail}</span>
  </div>
);

/**
 * What the player's girl is doing this turn, and why. Every number is measured against
 * a reference (the ceiling, the track left), readings stay quiet while they are normal,
 * and only one alert is raised at a time. Memoised: its props change once per turn, not
 * on every animation frame.
 */
const RaceHud = ({ telemetry: turn, topCeiling, maxStamina, hidden, onToggle }: RaceHudProps) => {
  const speed = speedReading(turn);
  const alert = hudAlert(turn, topCeiling);
  const stamina = Math.max(0, turn.stamina);
  const staminaShare = maxStamina > 0 ? Math.round((stamina / maxStamina) * 100) : 0;
  // The pace card and the alert already carry a forced pace; the stamina card only
  // turns red once the tank is actually empty.
  const staminaTone: HudTone = turn.tired ? "danger" : turn.pace === "safe" ? "quiet" : "normal";

  return (
    <section className="RaceHud" aria-label="Desempenho da sua corredora">
      <header className="RaceHud__bar">
        <p className="RaceHud__line">{turnLine(turn)}</p>
        {/* Announced when it changes, which is rarely; the readings are not. */}
        <div className="RaceHud__alert-slot" aria-live="polite">
          {!hidden && alert && (
            <p className="RaceHud__alert">
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
              tone={speed.tone}
              value={perTurn(turn.runSpeed)}
              detail={`${speed.state} · teto ${turn.ceiling.toLocaleString("pt-BR")}`}
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
              value={`${staminaShare}%`}
              detail={`−${decimal(turn.staminaCost)} no turno`}
            >
              <Meter
                label="Alcance"
                value={turn.remaining > 0 ? turn.staminaRange / turn.remaining : 1}
                caption={`${metres(turn.staminaRange)} de ${metres(turn.remaining)}`}
                tone={turn.pace === "rushed" || turn.tired ? "danger" : "stamina"}
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
              value={multiplier(turn.pressure)}
              detail={`${PRESSURE_LABEL[turn.pressure] ?? ""} · gasto de fôlego`}
              secondary
            />

            <Reading
              label="Skills ativas"
              tone={turn.effects.length ? "accent" : "quiet"}
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
