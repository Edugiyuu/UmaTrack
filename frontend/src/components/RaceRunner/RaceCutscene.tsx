import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { horseFolder, withImageFallback } from "../../utils/horseImage";
import { metres } from "../../constants/raceTelemetry";
import { skillEffectText } from "./useRaceEffects";
import type { SkillActivation, SkillResponse } from "../../types/race";
import "./RaceCutscene.css";

/** How long the cutscene holds the race before it lets go on its own. */
export const CUTSCENE_MS = 1800;

export interface RaceCutsceneProps {
  activation: SkillActivation;
  skill: SkillResponse;
  horseName: string;
  /** "TOKYO CLASSIC · TURNO 38 / 42 · RETA FINAL". */
  context: string;
  /** Metres left to the line when it fired. */
  remaining: number;
  onClose: () => void;
}

/**
 * The full-screen moment of a `unique` skill of the player's girl (frame 2). A modal
 * dialog: the race waits behind it, it closes by itself after CUTSCENE_MS, and a click,
 * Space or Esc skip it. Its only control is the dialog itself, so focus stays there.
 */
const RaceCutscene = ({
  activation,
  skill,
  horseName,
  context,
  remaining,
  onClose
}: RaceCutsceneProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // The entrance: bars close in, the band sweeps across, the girl and the name slide in.
  useLayoutEffect(() => {
    const root = dialogRef.current;
    if (!root) return;
    const context = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(root, { opacity: 0, duration: 0.2 })
        .from(".RaceCutscene__bar--top", { yPercent: -100, duration: 0.3 }, 0)
        .from(".RaceCutscene__bar--bottom", { yPercent: 100, duration: 0.3 }, 0)
        .from(".RaceCutscene__band", { xPercent: -100, duration: 0.35 }, 0.05)
        .from(".RaceCutscene__art", { xPercent: -30, opacity: 0, duration: 0.45 }, 0.1)
        .from(".RaceCutscene__copy > *", { x: 60, opacity: 0, duration: 0.4, stagger: 0.06 }, 0.15)
        .from(".RaceCutscene__name", { scale: 1.3, duration: 0.5, ease: "back.out(2)" }, 0.2);
    }, root);
    return () => context.revert();
  }, []);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const timer = window.setTimeout(() => onCloseRef.current(), CUTSCENE_MS);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === " " || event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
      } else if (event.key === "Tab") {
        event.preventDefault();
      }
    };
    // Capture, so the race's own Space (pause) never sees the key that closed this.
    window.addEventListener("keydown", onKeyDown, true);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown, true);
      previous?.focus?.();
    };
  }, []);

  const effect = skillEffectText(skill);

  return (
    <div
      ref={dialogRef}
      className="RaceCutscene"
      role="dialog"
      aria-modal="true"
      aria-label={`Skill única: ${skill.name}`}
      tabIndex={-1}
      onClick={onClose}
    >
      <div className="RaceCutscene__bar RaceCutscene__bar--top">
        <span>{context}</span>
      </div>
      <div className="RaceCutscene__band" aria-hidden="true" />
      <img
        {...withImageFallback(horseName, [`${horseFolder(horseName)}1.png`, "Profile1.gif"])}
        alt=""
        className="RaceCutscene__art"
      />
      <div className="RaceCutscene__copy">
        <span className="RaceCutscene__tag">★ Skill única</span>
        <strong className="RaceCutscene__name">{activation.skillName}</strong>
        <p className="RaceCutscene__desc">
          {horseName} · faltam {metres(remaining)} — {skill.description}
        </p>
        {effect && <span className="RaceCutscene__chip">▲ {effect}</span>}
      </div>
      <div className="RaceCutscene__bar RaceCutscene__bar--bottom">
        <span>toque para pular ›</span>
      </div>
    </div>
  );
};

export default RaceCutscene;
