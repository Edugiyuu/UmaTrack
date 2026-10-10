import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { gsap } from "gsap";
import VerticalName from "../ui/VerticalName/VerticalName";
import { useScreenEnter, useScreenExit } from "../../animations/screen";
import { useCountUp } from "../../animations/useCountUp";
import { useHoverScale } from "../../animations/useHoverScale";
import { useSegmentSlider } from "../../animations/useSegmentSlider";
import { useStaggerIn } from "../../animations/useStaggerIn";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { getSkills, learnSkill } from "../../services/Race";
import { horseColors } from "../../constants/horseColors";
import { RARITY_LABEL, describeEffect, describeTrigger } from "../../constants/skillText";
import { horseAnimation } from "../../utils/horseImage";
import type { HorseResponseProfile } from "../../types/horse";
import type { SkillResponse } from "../../types/race";
import speedIcon from "../../assets/skillIcons/speed.png";
import staminaIcon from "../../assets/skillIcons/stamina.png";
import startIcon from "../../assets/skillIcons/start.png";
import "./SkillsScreen.css";

type Filter = "all" | "available" | "learned";
type Blocker = "learned" | "points" | null;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "available", label: "Posso aprender" },
  { id: "learned", label: "Aprendidas" }
];

/** The three icons drawn in the Figma: the start gate, the runner and the sparkle. */
const ICON_BY_KIND: Record<string, string> = {
  startDash: startIcon,
  accelBoost: startIcon,
  staminaRecover: staminaIcon,
  staminaSave: staminaIcon,
  flatStat: staminaIcon
};

const iconFor = (skill: SkillResponse) => ICON_BY_KIND[skill.effect.kind] ?? speedIcon;

/** Skill points are the only price: there are no stat minimums (task 16). */
const blockerFor = (skill: SkillResponse, horse: HorseResponseProfile): Blocker => {
  if (horse.skills?.some((learned) => learned.slug === skill.slug)) return "learned";
  if ((horse.skillPoints ?? 0) < skill.cost) return "points";
  return null;
};

/**
 * A chance of 1 means the skill is on for the whole race (the flat stat ones). "Any
 * moment" only says something when nothing else narrows the trigger down.
 */
const whenText = (skill: SkillResponse) => {
  if (skill.trigger.baseChance >= 1) return "Quando: a prova toda";
  const trigger = describeTrigger(skill).replace(/^qualquer momento · /, "");
  return `Quando: ${trigger} · ${Math.round(skill.trigger.baseChance * 100)}%/turno`;
};

interface SkillsScreenProps {
  horse: HorseResponseProfile;
  horseId: string;
  onHorseUpdated: (horse: HorseResponseProfile) => void;
  onClose: () => void;
}

/**
 * The skill shop, v2 (docs/tasks/27-ui-v2-rest-track.md, Figma "SkillsScreen v2").
 * Opens over the training screen, like the rest screen: her art on the left, the
 * catalogue as a grid of cards on the right, and CONTINUAR goes back to training.
 */
const SkillsScreen = ({ horse, horseId, onHorseUpdated, onClose }: SkillsScreenProps) => {
  const [skills, setSkills] = useState<SkillResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  /** The skill just learned, so its card flashes green once. */
  const [justLearned, setJustLearned] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLUListElement>(null);
  const reduced = usePrefersReducedMotion();

  useScreenEnter(rootRef, true, { overlay: true });
  const exit = useScreenExit(rootRef, { overlay: true });
  useHoverScale(rootRef, ".SkillCard__action, .SkillsScreen__continue", { hover: 1.04 });
  useHoverScale(rootRef, ".SkillCard", { hover: 1.015, press: 1 });
  useStaggerIn(gridRef, ".SkillCard", [filter, loading], { delay: 0.1 });
  const thumbRef = useSegmentSlider<HTMLSpanElement>(FILTERS.findIndex(({ id }) => id === filter));
  const walletRef = useCountUp<HTMLElement>(horse.skillPoints ?? 0, { duration: 0.7 });

  const close = useCallback(() => {
    exit().then(onClose);
  }, [exit, onClose]);

  useEffect(() => {
    const controller = new AbortController();

    getSkills(controller.signal)
      .then(setSkills)
      .catch((fetchError: unknown) => {
        if (controller.signal.aborted) return;
        setError(fetchError instanceof Error ? fetchError.message : "Erro ao buscar skills.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close]);

  // The card of the skill just learned turns "✓ Aprendida" with a green flash.
  useLayoutEffect(() => {
    const flash = justLearned
      ? gridRef.current?.querySelector(`[data-slug="${justLearned}"] .SkillCard__flash`)
      : null;
    if (!flash || reduced) return;
    const timeline = gsap
      .timeline()
      .fromTo(flash, { opacity: 0 }, { opacity: 0.85, duration: 0.12, ease: "power1.out" })
      .to(flash, { opacity: 0, duration: 0.7, ease: "power2.out" });
    return () => {
      timeline.revert();
    };
  }, [justLearned, reduced]);

  const entries = useMemo(
    () => skills.map((skill) => ({ skill, blocker: blockerFor(skill, horse) })),
    [skills, horse]
  );

  const counts: Record<Filter, number> = {
    all: entries.length,
    available: entries.filter((entry) => entry.blocker === null).length,
    learned: entries.filter((entry) => entry.blocker === "learned").length
  };

  const visible = entries.filter(({ blocker }) =>
    filter === "available" ? blocker === null : filter === "learned" ? blocker === "learned" : true
  );

  const handleLearn = async (skill: SkillResponse) => {
    if (busySlug) return;
    try {
      setBusySlug(skill.slug);
      setError(null);
      onHorseUpdated(await learnSkill(horseId, skill._id));
      setJustLearned(skill.slug);
    } catch (learnError) {
      setError(learnError instanceof Error ? learnError.message : "Erro ao aprender skill.");
    } finally {
      setBusySlug(null);
    }
  };

  const skillPoints = horse.skillPoints ?? 0;

  return (
    <div
      ref={rootRef}
      className="SkillsScreen"
      role="dialog"
      aria-modal="true"
      aria-labelledby="SkillsScreen-title"
      style={{ "--horse-color": horseColors[horse.name] ?? "var(--brand-red)" } as CSSProperties}
    >
      <div className="SkillsScreen__corner" data-screen="corner" aria-hidden="true" />

      <section className="SkillsScreen__hero" aria-hidden="true">
        <div className="SkillsScreen__wedge" data-screen="wedge" />
        <VerticalName name={horse.name} />
        <img
          {...horseAnimation(horse.name, "Skills1.gif")}
          alt=""
          className="SkillsScreen__art"
          data-screen="art"
        />
      </section>

      <main className="SkillsScreen__content">
        <header className="SkillsScreen__header">
          <span className="SkillsScreen__eyebrow" data-screen="item">Carreira · Skills</span>
          <h1 id="SkillsScreen-title" className="SkillsScreen__title" data-screen="item">Learn skills!</h1>
          <div className="SkillsScreen__subrow" data-screen="item">
            <p className="SkillsScreen__subtitle">
              Gaste os skill points que ela juntou treinando e correndo.
            </p>
            <div className="SkillsScreen__wallet">
              <span>Skill points</span>
              <strong ref={walletRef} />
            </div>
          </div>
        </header>

        <div className="SkillsScreen__filter" role="radiogroup" aria-label="Filtrar skills" data-screen="item">
          <span ref={thumbRef} className="SkillsScreen__filter-thumb" aria-hidden="true" />
          {FILTERS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={filter === id}
              className={filter === id ? "is-active" : undefined}
              onClick={() => setFilter(id)}
            >
              {label} · {counts[id]}
            </button>
          ))}
        </div>

        {error && <p className="SkillsScreen__error" role="alert">{error}</p>}

        {loading ? (
          <p className="SkillsScreen__state">Carregando skills...</p>
        ) : visible.length === 0 ? (
          <p className="SkillsScreen__state">
            {filter === "learned"
              ? "Ela ainda não aprendeu nenhuma skill."
              : "Nenhuma skill ao alcance ainda. Treine e corra para juntar skill points."}
          </p>
        ) : (
          <ul ref={gridRef} className="SkillsScreen__grid">
            {visible.map(({ skill, blocker }) => (
              <li
                key={skill._id}
                data-slug={skill.slug}
                className={
                  `SkillCard SkillCard--${skill.rarity}` +
                  (blocker === "learned" ? " is-learned" : "") +
                  (blocker === "points" ? " is-locked" : "")
                }
                title={skill.description}
              >
                {blocker === "learned" && <span className="SkillCard__flash" aria-hidden="true" />}
                <span className="SkillCard__icon">
                  <img src={iconFor(skill)} alt="" />
                </span>
                <div className="SkillCard__head">
                  <h2>{skill.name}</h2>
                  <div className="SkillCard__chips">
                    <span className="SkillCard__rarity">{RARITY_LABEL[skill.rarity]}</span>
                    <span className="SkillCard__cost">{skill.cost} SP</span>
                  </div>
                </div>
                <div className="SkillCard__body">
                  <p className="SkillCard__effect">{describeEffect(skill, { brief: true })}</p>
                  <p className="SkillCard__when">{whenText(skill)}</p>
                </div>
                {blocker === "learned" ? (
                  <span className="SkillCard__action SkillCard__action--done">✓ Aprendida</span>
                ) : (
                  <button
                    type="button"
                    className="SkillCard__action"
                    disabled={blocker !== null || busySlug !== null}
                    onClick={() => handleLearn(skill)}
                  >
                    {blocker === "points"
                      ? `Faltam ${skill.cost - skillPoints} SP`
                      : busySlug === skill.slug
                        ? "Aprendendo..."
                        : "Aprender"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        <button type="button" className="SkillsScreen__continue" onClick={close} data-screen="item">
          CONTINUAR
          <span>voltar ao treino</span>
        </button>
      </main>
    </div>
  );
};

export default SkillsScreen;
