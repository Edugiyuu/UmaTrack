import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

export interface BarTweenOptions {
  /** Where the fill starts when the element appears; without it, no fill then. */
  from?: number;
  duration?: number;
  delay?: number;
  ease?: string;
  /**
   * A counter that goes up when the bar wraps around, e.g. a grade going from D to C:
   * the bar then fills to the end, empties and fills to the new ratio, instead of
   * running backwards.
   */
  lap?: number;
}

const clamp = (ratio: number) => Math.min(1, Math.max(0, Number.isFinite(ratio) ? ratio : 0));

/**
 * A bar fill that tweens its `scaleX` from the ratio it showed to the new one. The
 * element needs `transform-origin: left`; its width stays 100%. The ref is a callback,
 * so an element that shows up after a fetch is picked up too.
 */
export const useBarTween = <T extends HTMLElement = HTMLElement>(
  ratio: number,
  { from, duration = 0.6, delay = 0, ease = "power2.out", lap = 0 }: BarTweenOptions = {}
) => {
  const [node, setNode] = useState<T | null>(null);
  const reduced = usePrefersReducedMotion();
  const attached = useRef<T | null>(null);
  const shown = useRef(clamp(ratio));
  const lapShown = useRef(lap);

  useLayoutEffect(() => {
    if (!node) return;
    const target = clamp(ratio);
    if (attached.current !== node) {
      attached.current = node;
      shown.current = clamp(from ?? ratio);
      lapShown.current = lap;
    }
    const lapsed = lap > lapShown.current;
    const previousLap = lapShown.current;
    lapShown.current = lap;

    if (reduced || (!lapsed && shown.current === target)) {
      shown.current = target;
      gsap.set(node, { scaleX: target });
      return;
    }

    gsap.set(node, { scaleX: shown.current });
    const timeline = gsap.timeline({ delay });
    if (lapsed) {
      timeline
        .to(node, { scaleX: 1, duration: duration * 0.5, ease: "power1.in" })
        .set(node, { scaleX: 0 })
        .to(node, { scaleX: target, duration: duration * 0.5, ease });
    } else {
      timeline.to(node, { scaleX: target, duration, ease });
    }

    return () => {
      // Killed before it started (StrictMode's second run): the lap is still to come.
      if (timeline.progress() === 0) lapShown.current = previousLap;
      timeline.kill();
      shown.current = Number(gsap.getProperty(node, "scaleX"));
    };
    // The timing options are fixed per call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node, ratio, lap, reduced]);

  return setNode;
};
