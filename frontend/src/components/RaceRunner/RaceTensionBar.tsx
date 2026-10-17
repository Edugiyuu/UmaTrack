import { useLayoutEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { gsap } from "gsap";
import Button from "../ui/Button/Button";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { raceAudio } from "../../services/raceAudio";
import { TENSION_LABEL, type TensionLevel } from "./fieldModel";

/** One heartbeat of the line, in the SVG's units; the loop scrolls by exactly this. */
const PERIOD = 120;
const BEATS = 12;
const MID = 22;

/** How tall the spikes are and how fast the line runs, by level. */
const PULSE: Record<TensionLevel, { height: number; seconds: number }> = {
  low: { height: 5, seconds: 2.4 },
  mid: { height: 12, seconds: 1.5 },
  high: { height: 20, seconds: 0.8 },
  over: { height: 0, seconds: 0 }
};

const beatPath = (height: number) => {
  let d = `M0 ${MID}`;
  for (let beat = 0; beat < BEATS; beat += 1) {
    const x = beat * PERIOD;
    d +=
      ` L${x + 50} ${MID} L${x + 58} ${MID - height * 0.35} L${x + 64} ${MID}` +
      ` L${x + 70} ${MID - height} L${x + 78} ${MID + height} L${x + 84} ${MID - height * 0.3}` +
      ` L${x + 90} ${MID} L${x + PERIOD} ${MID}`;
  }
  return d;
};

export interface RaceTensionBarProps {
  level: TensionLevel;
  turn: number;
  lastTurn: number;
  time: number;
  speed: number;
  speeds: readonly number[];
  onSpeedChange: (speed: number) => void;
  paused: boolean;
  onTogglePause: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  /** She has crossed the line: the controls give way to the result. */
  arrived: boolean;
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
 * The bottom bar of Race v3: a heartbeat line that beats faster as the race tightens,
 * then the replay controls. Once she is home the line goes flat and the skip button
 * reads "Ver resultado".
 */
const RaceTensionBar = ({
  level,
  turn,
  lastTurn,
  time,
  speed,
  speeds,
  onSpeedChange,
  paused,
  onTogglePause,
  onStepBack,
  onStepForward,
  arrived,
  onSkip
}: RaceTensionBarProps) => {
  const lineRef = useRef<SVGGElement>(null);
  const reduced = usePrefersReducedMotion();
  const pulse = PULSE[level];
  const path = useMemo(() => beatPath(pulse.height), [pulse.height]);

  useLayoutEffect(() => {
    if (reduced || !lineRef.current || !pulse.seconds) return;
    const tween = gsap.fromTo(
      lineRef.current,
      { x: 0 },
      { x: -PERIOD, duration: pulse.seconds, ease: "none", repeat: -1 }
    );
    if (paused) tween.pause();
    return () => {
      tween.kill();
    };
  }, [pulse.seconds, reduced, paused]);

  return (
    <section className={`RaceTensionBar is-${level}`} aria-label="Tensão e controles da corrida">
      <p className="RaceTensionBar__level">
        <span>Tensão</span>
        <strong>{TENSION_LABEL[level]}</strong>
      </p>
      <svg className="RaceTensionBar__line" viewBox={`0 0 ${PERIOD * 4} 44`} preserveAspectRatio="none" aria-hidden="true">
        <g ref={lineRef}>
          <path d={path} />
        </g>
      </svg>

      <div className="RaceTensionBar__controls">
        <span className="RaceTensionBar__turn" role="timer" aria-label={`Turno ${turn} de ${lastTurn}`}>
          T {turn}/{lastTurn}
        </span>
        <div className="RaceTensionBar__group" role="group" aria-label="Controle da corrida">
          <Button size="sm" variant="ghost" aria-label="Turno anterior" aria-keyshortcuts="ArrowLeft" disabled={time <= 0} onClick={onStepBack}>
            ◀
          </Button>
          <Button size="sm" variant={paused ? "primary" : "ghost"} aria-pressed={paused} aria-keyshortcuts="Space" onClick={onTogglePause}>
            {paused ? "Continuar" : "Pausar"}
          </Button>
          <Button size="sm" variant="ghost" aria-label="Próximo turno" aria-keyshortcuts="ArrowRight" onClick={onStepForward}>
            ▶
          </Button>
        </div>
        <div className="RaceTensionBar__group" role="group" aria-label="Velocidade da transmissão">
          {speeds.map((option) => (
            <Button
              key={option}
              size="sm"
              variant={speed === option ? "ink" : "ghost"}
              aria-pressed={speed === option}
              onClick={() => onSpeedChange(option)}
            >
              {option}x
            </Button>
          ))}
        </div>
        <SoundToggle />
        <Button size="sm" variant={arrived ? "primary" : "ghost"} onClick={onSkip}>
          {arrived ? "Ver resultado →" : "Pular para o resultado"}
        </Button>
      </div>
    </section>
  );
};

export default RaceTensionBar;
