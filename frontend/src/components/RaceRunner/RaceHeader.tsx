import { useSyncExternalStore } from "react";
import Button from "../ui/Button/Button";
import Pill from "../ui/Pill/Pill";
import { currentTurn } from "./format";
import {
  RUNNING_STYLE_LABEL,
  SURFACE_LABEL,
  TERRAIN_LABEL,
  CATEGORY_LABEL
} from "../../constants/trackVisuals";
import { raceAudio } from "../../services/raceAudio";
import type { RunningStyle, TrackResponse } from "../../types/race";

export interface RaceHeaderProps {
  track: TrackResponse;
  style: RunningStyle;
  /** Race time being shown, in turns. */
  time: number;
  /** Last turn of the race, so the clock never counts past the finish. */
  lastTurn: number;
  speed: number;
  speeds: readonly number[];
  onSpeedChange: (speed: number) => void;
  paused: boolean;
  onTogglePause: () => void;
  /** Step one whole turn; the replay pauses so the turn can be read. */
  onStepBack: () => void;
  onStepForward: () => void;
  onSkip: () => void;
}

/** Sound on or off for the race; the choice is kept for the next one. */
const SoundToggle = () => {
  const muted = useSyncExternalStore(raceAudio.subscribe, raceAudio.isMuted);
  return (
    <Button
      size="sm"
      variant="ghost"
      aria-pressed={muted}
      aria-label={muted ? "Ligar o som" : "Desligar o som"}
      title={muted ? "Ligar o som" : "Desligar o som"}
      onClick={() => raceAudio.setMuted(!muted)}
    >
      <span aria-hidden="true">{muted ? "🔇" : "🔊"}</span>
    </Button>
  );
};

/**
 * The title block: which race this is, on the left, and the clock and playback
 * controls on the right. The track name sits on the game's tilted band.
 */
const RaceHeader = ({
  track,
  style,
  time,
  lastTurn,
  speed,
  speeds,
  onSpeedChange,
  paused,
  onTogglePause,
  onStepBack,
  onStepForward,
  onSkip
}: RaceHeaderProps) => (
  <header className="RaceRunner__header">
    <div className="RaceRunner__identity">
      <h1 className="RaceRunner__title">{track.name}</h1>
      <div className="RaceRunner__tags">
        <Pill solid>{track.distance}m</Pill>
        <Pill>{CATEGORY_LABEL[track.category]}</Pill>
        <Pill>{SURFACE_LABEL[track.surface]}</Pill>
        <Pill tone={track.terrain === "incline" ? "uphill" : "neutral"}>
          {TERRAIN_LABEL[track.terrain]}
        </Pill>
        <Pill tone="accent">{RUNNING_STYLE_LABEL[style]}</Pill>
      </div>
    </div>

    <div className="RaceRunner__clock">
      <div className="RaceRunner__time" role="timer" aria-label={`Turno ${currentTurn(time, lastTurn)} de ${lastTurn}`}>
        <span className="RaceRunner__time-label">Turno</span>
        <strong>{currentTurn(time, lastTurn)}</strong>
        <span className="RaceRunner__time-total">/ {lastTurn}</span>
      </div>
      <div className="RaceRunner__controls">
        <div className="RaceRunner__transport" role="group" aria-label="Controle da corrida">
          <Button
            size="sm"
            variant="ghost"
            aria-label="Turno anterior"
            aria-keyshortcuts="ArrowLeft"
            disabled={time <= 0}
            onClick={onStepBack}
          >
            ◀ Turno
          </Button>
          <Button
            size="sm"
            variant={paused ? "primary" : "ghost"}
            aria-pressed={paused}
            aria-keyshortcuts="Space"
            onClick={onTogglePause}
          >
            {paused ? "Continuar" : "Pausar"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            aria-label="Próximo turno"
            aria-keyshortcuts="ArrowRight"
            onClick={onStepForward}
          >
            Turno ▶
          </Button>
        </div>
        <div
          className="RaceRunner__speeds"
          role="group"
          aria-label="Velocidade da transmissão"
        >
          {speeds.map((option) => (
            <Button
              key={option}
              size="sm"
              variant={speed === option ? "primary" : "ghost"}
              aria-pressed={speed === option}
              onClick={() => onSpeedChange(option)}
            >
              {option}x
            </Button>
          ))}
        </div>
        <SoundToggle />
        <Button size="sm" variant="ink" onClick={onSkip}>
          Pular para o resultado
        </Button>
      </div>
      <p className="RaceRunner__shortcuts">Espaço pausa · ← → mudam de turno</p>
    </div>
  </header>
);

export default RaceHeader;
