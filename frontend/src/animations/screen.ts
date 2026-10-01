import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { gsap } from "gsap";
import { prefersReducedMotion, usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { usePageReveal } from "../components/PageTransition/PageTransition";

/**
 * The parts of a v2 screen that take part in its entrance and exit, marked in the JSX
 * with `data-screen`: the wedge in her colour, the corner block, her name, her art and
 * the content on the right (`item`, in reading order).
 */
const PART = {
  wedge: "[data-screen='wedge']",
  corner: "[data-screen='corner']",
  name: "[data-screen='name']",
  art: "[data-screen='art']",
  item: "[data-screen='item']"
} as const;

type Vars = gsap.TweenVars;

/** Adds a tween for one part, skipping the parts a screen does not have. */
const addPart = (
  timeline: gsap.core.Timeline,
  root: HTMLElement,
  selector: string,
  method: "from" | "to",
  vars: Vars,
  position: number
) => {
  const targets = root.querySelectorAll(selector);
  if (targets.length) timeline[method](targets, vars, position);
};

interface ScreenOptions {
  /** A screen opened over the training screen: it also fades its own background. */
  overlay?: boolean;
}

/**
 * The v2 screens assemble in order (docs/tasks/27): the wedge slides in from the left,
 * her art rises from the bottom and the content on the right cascades in. For a route
 * it also lifts the page curtain once `ready` (its data arrived).
 */
export const useScreenEnter = (
  scope: RefObject<HTMLElement | null>,
  ready = true,
  { overlay = false }: ScreenOptions = {}
) => {
  const reduced = usePrefersReducedMotion();
  usePageReveal(ready);

  useLayoutEffect(() => {
    const root = scope.current;
    if (!ready || reduced || !root) return;
    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
      const part = (selector: string, vars: Vars, position: number) =>
        addPart(timeline, root, selector, "from", vars, position);
      if (overlay) timeline.from(root, { autoAlpha: 0, duration: 0.2, ease: "power1.out" }, 0);
      part(PART.wedge, { xPercent: -100, duration: 0.5 }, 0);
      part(PART.corner, { xPercent: 100, duration: 0.5 }, 0.05);
      part(PART.name, { opacity: 0, duration: 0.4, ease: "power1.out" }, 0.2);
      part(PART.art, { y: 90, opacity: 0, duration: 0.55 }, 0.12);
      part(PART.item, { y: 18, opacity: 0, duration: 0.4, ease: "power2.out", stagger: 0.06 }, 0.18);
    }, root);
    return () => context.revert();
  }, [scope, ready, reduced, overlay]);
};

/**
 * The entrance played backwards, for a screen that closes over the training screen.
 * `exit()` resolves when it is done (at once with reduced motion), so the caller
 * unmounts the screen only then. Calls while one is running share it.
 */
export const useScreenExit = (scope: RefObject<HTMLElement | null>, { overlay = false }: ScreenOptions = {}) => {
  const running = useRef<{ timeline: gsap.core.Timeline; done: Promise<void> } | null>(null);

  useEffect(
    () => () => {
      running.current?.timeline.kill();
    },
    []
  );

  return useCallback(() => {
    const root = scope.current;
    if (running.current) return running.current.done;
    if (!root || prefersReducedMotion()) return Promise.resolve();

    const timeline = gsap.timeline({ defaults: { ease: "power2.in", overwrite: "auto" } });
    const done = new Promise<void>((resolve) => timeline.eventCallback("onComplete", () => resolve()));
    const part = (selector: string, vars: Vars, position: number) =>
      addPart(timeline, root, selector, "to", vars, position);
    part(PART.item, { y: 14, opacity: 0, duration: 0.2, stagger: { each: 0.03, from: "end" } }, 0);
    part(PART.art, { y: 70, opacity: 0, duration: 0.3 }, 0.05);
    part(PART.name, { opacity: 0, duration: 0.2 }, 0.05);
    part(PART.wedge, { xPercent: -100, duration: 0.3 }, 0.1);
    part(PART.corner, { xPercent: 100, duration: 0.3 }, 0.1);
    if (overlay) timeline.to(root, { autoAlpha: 0, duration: 0.18, ease: "power1.in" }, 0.28);
    running.current = { timeline, done };
    return done;
  }, [scope, overlay]);
};
