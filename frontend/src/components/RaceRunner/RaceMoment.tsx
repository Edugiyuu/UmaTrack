import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { gsap } from "gsap";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

export type SealTone = "skill" | "player" | "good" | "bad";

export interface Seal {
  id: number;
  /** Race time it belongs to, in turns: a seal left behind by stepping ahead is dropped. */
  at: number;
  tone: SealTone;
  /** Runner colour, for a rival's skill. */
  color?: string;
  /** "VOCÊ ativou", "Amber Comet ativou", "BOA LARGADA!". */
  lead: string;
  /** The skill, in bold. */
  name?: string;
  /** "largada +7 m/turno". */
  detail?: string;
}

/** How long the final-stretch moment stays on screen. */
export const BANNER_MS = 1500;

export type MomentKind = "start" | "skill" | "rival" | "good" | "bad" | "final" | "win" | "placed";

export interface RaceMomentProps {
  kind: MomentKind;
  /** Small caps over the title: "✦ SKILL ATIVOU · TURNO 13". */
  kicker?: string;
  title: string;
  detail?: string;
  /** A rival's colour, for her skill. */
  color?: string;
}

/**
 * The one moment over the drone view (Race v3): "LARGADA!", a skill firing (gold card
 * for hers, a quieter one for a rival's), how she left the gates, "RETA FINAL", and the
 * finish. It drops in with GSAP and the runner decides how long it stays.
 */
const RaceMoment = ({ kind, kicker, title, detail, color }: RaceMomentProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    if (reduced || !ref.current) return;
    const tween = gsap.from(ref.current, {
      y: -18,
      scale: 0.9,
      opacity: 0,
      duration: 0.35,
      ease: "back.out(2)"
    });
    return () => {
      tween.revert();
    };
  }, [reduced, kind, title]);

  return (
    <div
      ref={ref}
      className={`RaceMoment RaceMoment--${kind}`}
      style={color ? ({ "--moment-color": color } as CSSProperties) : undefined}
      role="status"
    >
      {kicker && <span className="RaceMoment__kicker">{kicker}</span>}
      <strong className="RaceMoment__title">{title}</strong>
      {detail && <span className="RaceMoment__detail">{detail}</span>}
    </div>
  );
};

export default RaceMoment;
