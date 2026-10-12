import { useCallback, useLayoutEffect, useRef, type DependencyList, type RefObject } from "react";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

gsap.registerPlugin(Flip);

/**
 * The children matching `selector` inside `scope` glide to their new places when the
 * list is reordered, instead of jumping (GSAP Flip). Call the returned `capture()` right
 * before the state change that reorders them; the glide plays once `deps` change.
 * React must keep the same DOM nodes (stable keys) for Flip to match them.
 */
export const useFlipReorder = (
  scope: RefObject<HTMLElement | null>,
  selector: string,
  deps: DependencyList
) => {
  const reduced = usePrefersReducedMotion();
  const captured = useRef<Flip.FlipState | null>(null);

  const capture = useCallback(() => {
    const root = scope.current;
    if (!root || reduced) return;
    captured.current = Flip.getState(root.querySelectorAll(selector));
  }, [scope, selector, reduced]);

  useLayoutEffect(() => {
    const state = captured.current;
    captured.current = null;
    if (!state) return;
    const timeline = Flip.from(state, { duration: 0.55, ease: "power3.inOut", stagger: 0.03 });
    return () => {
      timeline.progress(1).kill();
    };
    // The caller decides what counts as a reorder.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return capture;
};
