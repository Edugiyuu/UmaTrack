import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode
} from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { prefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import "./PageTransition.css";

/** The curtain sweeps in, the route changes under it, and it sweeps out: ~0.6 s. */
const COVER_SECONDS = 0.28;
const LIFT_SECONDS = 0.3;
/** How long the curtain waits for a screen still fetching before it lifts anyway. */
const MAX_WAIT_SECONDS = 0.25;

interface TransitionApi {
  /** Navigates behind a curtain in `color` (her colour); ignored while one is running. */
  go: (to: string, options?: { color?: string }) => void;
  /** The new screen is ready: the curtain may lift. */
  reveal: () => void;
}

const TransitionContext = createContext<TransitionApi>({
  go: () => undefined,
  reveal: () => undefined
});

/**
 * The curtain between the career screens (docs/tasks/27-ui-v2-rest-track.md). Mounted
 * once around the routes. React Router does not animate route changes, so a click that
 * should animate goes through `useTransitionNavigate`; the browser's back and forward
 * buttons skip the curtain and only play the new screen's entrance.
 */
const PageTransition = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const curtainRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  /** Set while the curtain covers the window and waits for the new screen. */
  const waiting = useRef<gsap.core.Tween | null>(null);
  const running = useRef<gsap.core.Animation | null>(null);

  useLayoutEffect(() => {
    const curtain = curtainRef.current;
    if (curtain) gsap.set(curtain, { xPercent: -100, autoAlpha: 0 });
    return () => {
      running.current?.kill();
      waiting.current?.kill();
    };
  }, []);

  const lift = useCallback(() => {
    const curtain = curtainRef.current;
    waiting.current?.kill();
    waiting.current = null;
    if (!curtain) return;
    running.current = gsap.to(curtain, {
      xPercent: 100,
      duration: LIFT_SECONDS,
      ease: "power2.out",
      onComplete: () => {
        gsap.set(curtain, { xPercent: -100, autoAlpha: 0 });
        busy.current = false;
      }
    });
  }, []);

  const go = useCallback<TransitionApi["go"]>(
    (to, options) => {
      if (busy.current) return;
      const curtain = curtainRef.current;
      if (!curtain || prefersReducedMotion()) {
        navigate(to);
        return;
      }
      busy.current = true;
      curtain.style.setProperty("--curtain-color", options?.color ?? "var(--brand-red)");
      running.current = gsap.fromTo(
        curtain,
        { xPercent: -100, autoAlpha: 1 },
        {
          xPercent: 0,
          duration: COVER_SECONDS,
          ease: "power2.in",
          onComplete: () => {
            waiting.current = gsap.delayedCall(MAX_WAIT_SECONDS, lift);
            navigate(to);
          }
        }
      );
    },
    [navigate, lift]
  );

  const reveal = useCallback(() => {
    if (waiting.current) lift();
  }, [lift]);

  const api = useMemo(() => ({ go, reveal }), [go, reveal]);

  return (
    <TransitionContext.Provider value={api}>
      {children}
      <div ref={curtainRef} className="PageTransition" aria-hidden="true" />
    </TransitionContext.Provider>
  );
};

/** `navigate()` behind the curtain. */
// eslint-disable-next-line react-refresh/only-export-components
export const useTransitionNavigate = () => useContext(TransitionContext).go;

/** Lifts the curtain once the screen has what it needs to show (`ready`). */
// eslint-disable-next-line react-refresh/only-export-components
export const usePageReveal = (ready = true) => {
  const { reveal } = useContext(TransitionContext);
  useLayoutEffect(() => {
    if (ready) reveal();
  }, [ready, reveal]);
};

export default PageTransition;
