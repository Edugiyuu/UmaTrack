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
        style={{ left: `${Math.min(100, progress * 100)}%`, backgroundColor: color }}
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
