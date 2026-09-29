import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { gsap } from "gsap";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import "./RaceBanner.css";

export type SealTone = "skill" | "player" | "good" | "bad";

export interface Seal {
  id: number;
  /** Race time it belongs to, in turns: a seal left behind by stepping ahead is dropped. */
  at: number;
  tone: SealTone;
  /** Runner colour, for a rival's skill. */
  color?: string;
  /** "VOCÊ ativou", "Rival B ativou", "BOA LARGADA!". */
  lead: string;
  /** The skill, in bold. */
  name?: string;
  /** "largada +7 m/turno". */
  detail?: string;
}

/**
 * The one seal on the course at a time (task 23): a skill someone fired, or how she
 * left the gates. Queued by the runner so they never pile up; each one rises in.
 */
export const RaceSeal = ({ seal }: { seal: Seal }) => {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    if (reduced || !ref.current) return;
    const tween = gsap.from(ref.current, { y: 14, opacity: 0, duration: 0.25, ease: "power2.out" });
    return () => {
      tween.revert();
    };
  }, [reduced]);

  return (
    <p
      ref={ref}
      className={`RaceSeal RaceSeal--${seal.tone}`}
      style={seal.color ? ({ "--seal-color": seal.color } as CSSProperties) : undefined}
      role="status"
    >
      {seal.tone === "skill" || seal.tone === "player" ? (
        <span className="RaceSeal__dot" aria-hidden="true" />
      ) : null}
      <span>{seal.lead}</span>
      {seal.name && <strong>✦ {seal.name}</strong>}
      {seal.detail && <span className="RaceSeal__detail">· {seal.detail}</span>}
    </p>
  );
};

/** How long the final-stretch banner stays on screen. */
export const BANNER_MS = 1500;

/**
 * The tilted "RETA FINAL" band (frame 6): once, when she enters the last 20% of the
 * race. It crosses the stage in from the left, holds, and leaves to the right.
 */
export const RaceFinalBanner = ({ remaining }: { remaining: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    if (reduced || !ref.current) return;
    const total = BANNER_MS / 1000;
    const timeline = gsap
      .timeline()
      .fromTo(
        ref.current,
        { xPercent: -110 },
        { xPercent: 0, duration: total * 0.2, ease: "power3.out" }
      )
      .from(
        ref.current.querySelector(".RaceFinalBanner__title"),
        { scale: 1.25, duration: total * 0.25, ease: "back.out(2)" },
        "<"
      )
      .to(ref.current, { xPercent: 110, duration: total * 0.2, ease: "power3.in" }, total * 0.8);
    return () => {
      timeline.kill();
    };
  }, [reduced]);

  return (
    <div ref={ref} className="RaceFinalBanner" role="status">
      <span className="RaceFinalBanner__left">
        FALTAM {Math.round(remaining).toLocaleString("pt-BR")} m
      </span>
      <strong className="RaceFinalBanner__title">RETA FINAL</strong>
    </div>
  );
};
