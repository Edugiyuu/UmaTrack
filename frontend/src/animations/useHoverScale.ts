import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

const isDisabled = (element: Element) =>
  element.matches(":disabled, [aria-disabled='true']");

/**
 * Hover and press feedback for every element matching `selector` inside `scope`: a short
 * GSAP `scale`, instead of a CSS `:hover` transition. One set of listeners per screen,
 * on the document, so a screen that renders its content after a fetch is covered too.
 */
export const useHoverScale = (
  scope: RefObject<HTMLElement | null>,
  selector: string,
  { hover = 1.03, press = 0.97 }: { hover?: number; press?: number } = {}
) => {
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;

    const target = (event: Event) => {
      const root = scope.current;
      const element = (event.target as Element | null)?.closest?.(selector);
      return root && element && root.contains(element) ? (element as HTMLElement) : null;
    };
    const touched = new Set<HTMLElement>();
    const scaleTo = (element: HTMLElement, scale: number, duration = 0.18) => {
      touched.add(element);
      gsap.to(element, { scale, duration, ease: "power2.out", overwrite: "auto" });
    };

    const onOver = (event: PointerEvent) => {
      const element = target(event);
      if (!element || element.contains(event.relatedTarget as Node | null)) return;
      if (!isDisabled(element)) scaleTo(element, hover);
    };
    const onOut = (event: PointerEvent) => {
      const element = target(event);
      if (!element || element.contains(event.relatedTarget as Node | null)) return;
      scaleTo(element, 1);
    };
    const onDown = (event: PointerEvent) => {
      const element = target(event);
      if (element && !isDisabled(element)) scaleTo(element, press, 0.1);
    };
    const onUp = (event: PointerEvent) => {
      const element = target(event);
      if (element) scaleTo(element, isDisabled(element) ? 1 : hover);
    };

    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerout", onOut);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("pointerup", onUp);
    return () => {
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerup", onUp);
      gsap.killTweensOf([...touched], "scale");
    };
  }, [scope, selector, hover, press, reduced]);
};
