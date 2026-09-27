import "./Meter.css";

export type MeterTone = "accent" | "stamina" | "speed" | "power" | "wit" | "curve" | "danger";

export interface MeterProps {
  /** 0..1. Values outside the range are clamped rather than overflowing the bar. */
  value: number;
  label: string;
  /** Shown beside the label — the reading that gives the bar meaning. */
  caption?: string;
  tone?: MeterTone;
  /** Hides the label visually but keeps it for screen readers. */
  compact?: boolean;
  /** 0..1: a tick for the reference the value is measured against, such as a ceiling. */
  marker?: number;
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/**
 * A labelled bar. Used for stamina today and for the telemetry readings the HUD will
 * add, so it takes its colour from a tone token rather than hard-coding one.
 */
const Meter = ({
  value,
  label,
  caption,
  tone = "accent",
  compact = false,
  marker
}: MeterProps) => {
  const ratio = clamp(Number.isFinite(value) ? value : 0);
  const percent = Math.round(ratio * 100);

  return (
    <div className={["Meter", compact ? "Meter--compact" : ""].filter(Boolean).join(" ")}>
      <div className="Meter__labels">
        <span className="Meter__label">{label}</span>
        {caption && <span className="Meter__caption">{caption}</span>}
      </div>
      <div
        className={`Meter__track Meter__track--${tone}`}
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={caption ? `${label}: ${caption}` : `${label}: ${percent}%`}
        aria-label={compact ? label : undefined}
      >
        <div className="Meter__fill" style={{ width: `${percent}%` }} />
        {marker !== undefined && (
          <div
            className="Meter__marker"
            style={{ left: `${Math.round(clamp(marker) * 100)}%` }}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
};

export default Meter;
