import { useLayoutEffect, type DependencyList, type RefObject } from "react";
import { gsap } from "gsap";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

/**
 * The children matching `selector` inside `scope` come in one after the other, each
 * rising a little as it fades in. Plays again whenever `deps` change (e.g. a filter).
 */
export const useStaggerIn = (
  scope: RefObject<HTMLElement | null>,
  selector: string,
  deps: DependencyList,
  { delay = 0, stagger = 0.045 }: { delay?: number; stagger?: number } = {}
) => {
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    if (reduced || !scope.current) return;
    const context = gsap.context(() => {
      gsap.from(selector, { y: 16, opacity: 0, duration: 0.35, ease: "power2.out", delay, stagger });
    }, scope);
    return () => context.revert();
    // The caller decides when the cascade plays again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reduced]);
};
