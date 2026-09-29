import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import "./RaceFxOverlay.css";

/** Where each speed line runs, as a share of the course height, and how long it is. */
const LINES = [
  { top: 8, width: 38, delay: 0 },
  { top: 19, width: 24, delay: 0.22 },
  { top: 31, width: 44, delay: 0.1 },
  { top: 44, width: 28, delay: 0.34 },
  { top: 56, width: 36, delay: 0.05 },
  { top: 67, width: 22, delay: 0.28 },
  { top: 79, width: 40, delay: 0.16 },
  { top: 91, width: 26, delay: 0.4 }
];

export interface RaceFxOverlayProps {
  /** The race is paused: the lines freeze where they are. */
  paused: boolean;
}

/**
 * Speed lines over the course while a speed skill works (frame 4). Decoration only:
 * `pointer-events: none`, looped by GSAP on transform and opacity, and absent with
 * reduced motion. The blue edge glow of the whole screen is a class on the runner.
 */
const RaceFxOverlay = ({ paused }: RaceFxOverlayProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    if (reduced || !ref.current) return;
    const context = gsap.context(() => {
      const lines = gsap.utils.toArray<HTMLElement>(".RaceFx__line");
      const loop = gsap.timeline();
      lines.forEach((line, index) => {
        loop.fromTo(
          line,
          { xPercent: -160, opacity: 0 },
          {
            xPercent: 30,
            duration: 0.7,
            ease: "none",
            repeat: -1,
            keyframes: { opacity: [0, 0.8, 0.8, 0] }
          },
          LINES[index].delay
        );
      });
      timeline.current = loop;
    }, ref);
    return () => {
      context.revert();
      timeline.current = null;
    };
  }, [reduced]);

  useLayoutEffect(() => {
    timeline.current?.paused(paused);
  }, [paused]);

  if (reduced) return null;

  return (
    <div ref={ref} className="RaceFx" aria-hidden="true">
      {LINES.map((line) => (
        <span
          key={line.top}
          className="RaceFx__line"
          style={{ top: `${line.top}%`, width: `${line.width}%` }}
        />
      ))}
    </div>
  );
};

export default RaceFxOverlay;
