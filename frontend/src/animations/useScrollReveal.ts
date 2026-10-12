import { useLayoutEffect, type DependencyList, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealOptions {
  /**
   * Elements inside each revealed one that also wipe in from the left as it arrives,
   * e.g. a track's elevation profile drawing itself.
   */
  wipe?: string;
}

/**
 * The children matching `selector` inside `scope` stay hidden until they scroll into
 * view, then rise in, the ones arriving together one after the other. Plays once per
 * element; set up again whenever `deps` change (e.g. data that arrived late).
 */
export const useScrollReveal = (
  scope: RefObject<HTMLElement | null>,
  selector: string,
  deps: DependencyList,
  { wipe }: ScrollRevealOptions = {}
) => {
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const root = scope.current;
    if (reduced || !root) return;
    const targets = root.querySelectorAll<HTMLElement>(selector);
    if (!targets.length) return;

    const context = gsap.context(() => {
      gsap.set(targets, { autoAlpha: 0, y: 28 });
      const wiped = wipe ? root.querySelectorAll(wipe) : [];
      if (wiped.length) gsap.set(wiped, { clipPath: "inset(0% 100% 0% 0%)" });

      ScrollTrigger.batch(targets, {
        start: "top 90%",
        once: true,
        onEnter: (batch) => {
          gsap.to(batch, {
            autoAlpha: 1,
            y: 0,
            duration: 0.55,
            ease: "power3.out",
            stagger: 0.08,
            overwrite: true
          });
          if (!wipe) return;
          batch.forEach((element, index) => {
            const inner = element.querySelectorAll(wipe);
            if (!inner.length) return;
            gsap.to(inner, {
              clipPath: "inset(0% 0% 0% 0%)",
              duration: 0.9,
              ease: "power2.inOut",
              delay: 0.2 + index * 0.08
            });
          });
        }
      });
    }, root);

    return () => context.revert();
    // The caller decides when the elements are set up again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reduced]);
};
