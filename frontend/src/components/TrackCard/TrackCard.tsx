import TrackProfile from "../TrackProfile/TrackProfile";
import {
  CATEGORY_LABEL,
  STAT_LABEL,
  SURFACE_LABEL,
  TERRAIN_LABEL,
  trackImage
} from "../../constants/trackVisuals";
import type { StatName, TrackResponse } from "../../types/race";
import type { HorseResponseProfile } from "../../types/horse";
import "./TrackCard.css";

const STATS: StatName[] = ["speed", "stamina", "power", "wit"];

export interface TrackRequirementCheck {
  stat: StatName;
  required: number;
  current: number;
  met: boolean;
}

export const checkRequirements = (
  track: TrackResponse,
  horse: HorseResponseProfile
): TrackRequirementCheck[] =>
  STATS.map((stat) => ({
    stat,
    required: track.requirements[stat],
    current: horse[stat],
    met: horse[stat] >= track.requirements[stat]
  }));

interface TrackCardProps {
  track: TrackResponse;
  horse: HorseResponseProfile;
  selected: boolean;
  onSelect: () => void;
}

const TrackCard = ({ track, horse, selected, onSelect }: TrackCardProps) => {
  const checks = checkRequirements(track, horse);
  const unmet = checks.filter((check) => !check.met);
  const maxGrade = track.segments.reduce((max, segment) => Math.max(max, segment.grade), 0);

  return (
    <button
      type="button"
      className={`TrackCard${selected ? " TrackCard--selected" : ""}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <div className="TrackCard__art">
        {trackImage(track.image) ? (
          <img src={trackImage(track.image)} alt={track.name} />
        ) : (
          <div className="TrackCard__art-placeholder" />
        )}
        <span className={`TrackCard__terrain TrackCard__terrain--${track.terrain}`}>
          {TERRAIN_LABEL[track.terrain]}
          {maxGrade > 0 && ` · +${maxGrade}%`}
        </span>
      </div>

      <div className="TrackCard__body">
        <header>
          <h3>{track.name}</h3>
          <span className="TrackCard__location">{track.location}</span>
        </header>

        <div className="TrackCard__badges">
          <span>{track.distance}m</span>
          <span>{CATEGORY_LABEL[track.category]}</span>
          <span>{SURFACE_LABEL[track.surface]}</span>
          <span>Dif. {track.difficulty}/10</span>
        </div>

        <TrackProfile segments={track.segments} distance={track.distance} height={54} />

        <p className="TrackCard__description">{track.description}</p>

        <ul className="TrackCard__requirements">
          {checks.map((check) => (
            <li key={check.stat} className={check.met ? "is-met" : "is-missing"}>
              <span>{STAT_LABEL[check.stat]}</span>
              <strong>
                {check.current}/{check.required}
              </strong>
            </li>
          ))}
        </ul>

        <footer className="TrackCard__footer">
          <span className="TrackCard__prize">🏆 {track.prizeMoney[0]?.toLocaleString("pt-BR")}</span>
          <span>💎 {track.skillPointReward} SP</span>
          <span>{track.entryFee > 0 ? `Inscrição ${track.entryFee}` : "Grátis"}</span>
        </footer>

        {unmet.length > 0 && (
          <p className="TrackCard__warning">
            Abaixo do recomendado em {unmet.map((check) => STAT_LABEL[check.stat]).join(", ")} — dá
            para correr, mas ela vai sofrer.
          </p>
        )}
      </div>
    </button>
  );
};

export default TrackCard;
