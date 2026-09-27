import { memo } from "react";
import Meter from "../ui/Meter/Meter";
import { ordinal } from "./format";

export interface RaceLaneProps {
  name: string;
  isPlayer: boolean;
  /** Lane colour, already resolved by the caller. */
  color: string;
  /** 0..1 along the course. */
  progress: number;
  placement: number;
  /** Remaining stamina, 0..1. Only the player's lane shows it. */
  stamina: number;
}

/** Relative luminance of a `#rrggbb` (or `#rrggbbaa`) colour, or null for anything else. */
const luminance = (color: string) => {
  const match = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(color);
  if (!match) return null;
  const [r, g, b] = [0, 2, 4].map((offset) => {
    const channel = parseInt(match[1].slice(offset, offset + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Light or dark name text, whichever reads better on the pill. The dark text is the
 * site's near-black (luminance ~0.01), so white wins below ~0.18.
 */
const nameColor = (color: string) => {
  const value = luminance(color);
  return value !== null && value < 0.18 ? "var(--on-solid)" : "var(--text)";
};

/**
 * One runner's lane. Re-rendered on every animation frame, so it stays free of hooks
 * and memoises on its props — the thirteen lanes are the hot path of this screen.
 */
const RaceLane = ({ name, isPlayer, color, progress, placement, stamina }: RaceLaneProps) => (
  <div className={`RaceRunner__lane${isPlayer ? " RaceRunner__lane--player" : ""}`}>
    <span className="RaceRunner__lane-place">{ordinal(placement)}</span>

    <div className="RaceRunner__track">
      <div
        className="RaceRunner__runner"
        style={{ left: `${Math.min(100, progress * 100)}%`, backgroundColor: color, color: nameColor(color) }}
      >
        <span className="RaceRunner__runner-name">{name}</span>
      </div>
    </div>

    {isPlayer && (
      <div className="RaceRunner__lane-stamina">
        <Meter
          value={stamina}
          label="Fôlego"
          caption={`${Math.round(stamina * 100)}%`}
          tone="stamina"
        />
      </div>
    )}
  </div>
);

export default memo(RaceLane);
