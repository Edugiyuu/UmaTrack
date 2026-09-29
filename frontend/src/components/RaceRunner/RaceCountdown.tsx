import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import "./RaceCountdown.css";

/** 3, 2, 1, then 0 for "VAI!". */
export type CountdownStep = 3 | 2 | 1 | 0;

const STEPS: CountdownStep[] = [3, 2, 1, 0];
const label = (step: CountdownStep) => (step === 0 ? "VAI!" : String(step));

export interface RaceCountdownProps {
  step: CountdownStep;
  /** Seconds each number stays, so the landing fits inside it at 4x too. */
  beat: number;
  onSkip: () => void;
}

/**
 * The gates before turn 0 (frame 5): the course darkens and counts down, each number
 * landing big and shrinking. The whole overlay is one button that skips to the start.
 */
const RaceCountdown = ({ step, beat, onSkip }: RaceCountdownProps) => {
  const numberRef = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    if (reduced || !numberRef.current) return;
    const tween = gsap.fromTo(
      numberRef.current,
      { scale: 1.8, opacity: 0 },
      { scale: 1, opacity: 1, duration: Math.min(0.45, beat * 0.8), ease: "back.out(2)" }
    );
    return () => {
      tween.kill();
    };
  }, [step, beat, reduced]);

  return (
    <button
      type="button"
      className={`RaceCountdown${step === 0 ? " is-go" : ""}`}
      onClick={onSkip}
      aria-label="Pular a contagem e largar"
    >
      <span className="RaceCountdown__kicker">{step === 0 ? "LARGARAM!" : "PREPARAR..."}</span>
      <span ref={numberRef} className="RaceCountdown__number" aria-live="assertive">
        {label(step)}
      </span>
      <span className="RaceCountdown__steps" aria-hidden="true">
        {STEPS.map((candidate) => (
          <span key={candidate} className={candidate === step ? "is-current" : undefined}>
            {label(candidate)}
          </span>
        ))}
      </span>
    </button>
  );
};

export default RaceCountdown;
