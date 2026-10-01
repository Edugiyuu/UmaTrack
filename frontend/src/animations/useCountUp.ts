import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

export interface CountUpOptions {
  /** Where the count starts when the element appears; without it, no count then. */
  from?: number;
  duration?: number;
  delay?: number;
  ease?: string;
  format?: (value: number) => string;
}

const whole = (value: number) => String(Math.round(value));

/**
 * A number that counts from the value it showed to the new one (docs/tasks/27).
 * GSAP writes the text straight into the node, so the element must be rendered
 * empty: `<strong ref={ref} />`. React only keeps the final value. The ref is a
 * callback, so an element that shows up after a fetch is picked up too.
 */
export const useCountUp = <T extends HTMLElement = HTMLElement>(
  value: number,
  { from, duration = 0.6, delay = 0, ease = "power2.out", format = whole }: CountUpOptions = {}
) => {
  const [node, setNode] = useState<T | null>(null);
  const reduced = usePrefersReducedMotion();
  const attached = useRef<T | null>(null);
  const shown = useRef(value);
  const formatRef = useRef(format);
  formatRef.current = format;

  useLayoutEffect(() => {
    if (!node) return;
    if (attached.current !== node) {
      attached.current = node;
      shown.current = from ?? value;
    }
    const write = (current: number) => {
      node.textContent = formatRef.current(current);
    };

    if (reduced || shown.current === value) {
      shown.current = value;
      write(value);
      return;
    }

    const counter = { value: shown.current };
    write(counter.value);
    const tween = gsap.to(counter, {
      value,
      duration,
      delay,
      ease,
      onUpdate: () => write(counter.value)
    });
    return () => {
      tween.kill();
      // Interrupted (or StrictMode's second run): carry on from what is on screen.
      shown.current = counter.value;
    };
    // The timing options are fixed per call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node, value, reduced]);

  return setNode;
};
