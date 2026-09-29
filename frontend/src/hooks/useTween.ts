import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/**
 * A number that rolls to `target` over `duration` ms instead of jumping, starting from
 * wherever it is when the target changes. Driven by GSAP; with reduced motion it jumps.
 */
export const useTween = (target: number, duration = 300) => {
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState(target);
  const state = useRef({ value: target });

  useEffect(() => {
    if (reduced || !Number.isFinite(target)) {
      state.current.value = target;
      setValue(target);
      return;
    }
    const tween = gsap.to(state.current, {
      value: target,
      duration: duration / 1000,
      ease: "power2.out",
      onUpdate: () => setValue(state.current.value)
    });
    return () => {
      tween.kill();
    };
  }, [target, duration, reduced]);

  return value;
};
