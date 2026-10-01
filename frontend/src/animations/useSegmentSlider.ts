import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

/**
 * The white pill behind the active option of a segmented control slides to the option
 * picked. The options are equal widths and the pill is one option wide, so moving it a
 * whole number of its own widths (`xPercent`) lines it up at any window size. Returns
 * a callback ref for the pill.
 */
export const useSegmentSlider = <T extends HTMLElement = HTMLElement>(activeIndex: number) => {
  const [node, setNode] = useState<T | null>(null);
  const reduced = usePrefersReducedMotion();
  const placed = useRef<T | null>(null);

  useLayoutEffect(() => {
    if (!node) return;
    const xPercent = Math.max(0, activeIndex) * 100;
    if (reduced || placed.current !== node) {
      placed.current = node;
      gsap.set(node, { xPercent });
      return;
    }
    const tween = gsap.to(node, { xPercent, duration: 0.35, ease: "power3.out" });
    return () => {
      tween.kill();
    };
  }, [node, activeIndex, reduced]);

  return setNode;
};
