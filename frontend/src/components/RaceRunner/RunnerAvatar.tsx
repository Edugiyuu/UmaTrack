import { memo, useState, type CSSProperties } from "react";
import { horseAsset } from "../../utils/horseImage";
import { staminaTone } from "./fieldModel";

export interface RunnerAvatarProps {
  name: string;
  color: string;
  isPlayer: boolean;
  /** Stamina left, 0..1: the ring around the face. */
  stamina: number;
  /** Diameter of the face, in px; the ring sits outside it. */
  size: number;
  className?: string;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

/**
 * A runner's face inside her stamina ring (Race v3). The player's horse girl has a
 * portrait; the rivals are generated, so they wear their initials on their colour.
 */
const RunnerAvatar = ({ name, color, isPlayer, stamina, size, className }: RunnerAvatarProps) => {
  const [broken, setBroken] = useState(false);
  const ring = Math.max(4, Math.round(size * 0.1));
  const outer = size + ring * 2 + 4;
  const radius = (outer - ring) / 2;
  const filled = Math.max(0, Math.min(1, stamina)) * 100;

  return (
    <span
      className={["RunnerAvatar", `is-${staminaTone(stamina)}`, isPlayer ? "is-player" : "", className]
        .filter(Boolean)
        .join(" ")}
      style={{ "--avatar-size": `${outer}px`, "--runner-color": color } as CSSProperties}
    >
      <svg className="RunnerAvatar__ring" viewBox={`0 0 ${outer} ${outer}`} aria-hidden="true">
        <circle className="RunnerAvatar__track" cx={outer / 2} cy={outer / 2} r={radius} strokeWidth={ring} />
        {filled > 0 && (
          <circle
            className="RunnerAvatar__fill"
            cx={outer / 2}
            cy={outer / 2}
            r={radius}
            strokeWidth={ring}
            pathLength={100}
            strokeDasharray={`${filled} 100`}
            transform={`rotate(-90 ${outer / 2} ${outer / 2})`}
          />
        )}
      </svg>
      <span className="RunnerAvatar__face" style={{ width: size, height: size }}>
        {isPlayer && !broken ? (
          <img src={horseAsset(name, "Selection.png")} alt="" onError={() => setBroken(true)} />
        ) : (
          <span className="RunnerAvatar__initials" style={{ fontSize: Math.max(10, size * 0.36) }}>
            {initials(name)}
          </span>
        )}
      </span>
    </span>
  );
};

export default memo(RunnerAvatar);
