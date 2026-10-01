import { useCallback, useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";
import { gsap } from "gsap";
import VerticalName from "../ui/VerticalName/VerticalName";
import { useScreenEnter, useScreenExit } from "../../animations/screen";
import { useBarTween } from "../../animations/useBarTween";
import { useCountUp } from "../../animations/useCountUp";
import { useHoverScale } from "../../animations/useHoverScale";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { horseColors } from "../../constants/horseColors";
import { horseAnimation } from "../../utils/horseImage";
import type { HorseResponseProfile } from "../../types/horse";
import nightSky from "../../assets/rest/nightSky.svg";
import moon from "../../assets/rest/moon.svg";
import trackIcon from "../../assets/rest/trackIcon.png";
import "./RestScreen.css";

/** Mirrors TRAINING_ENERGY_COST on the server. */
const TRAINING_ENERGY_COST = 20;
/** The bar starts filling once the card is in, and the gain chip pops when it is full. */
const FILL_DELAY = 0.5;
const FILL_SECONDS = 0.9;

interface RestScreenProps {
  horse: HorseResponseProfile;
  energyBefore: number;
  rest: { energyRecovered: number; energy: number; turnSpent: boolean };
  onContinue: () => void;
}

const trainingsLeft = (energy: number) => {
  const sessions = Math.floor(energy / TRAINING_ENERGY_COST);
  if (sessions <= 0) return "Ainda cansada: descanse de novo antes de treinar.";
  return `Pronta para mais ${sessions} ${sessions === 1 ? "treino" : "treinos"} (−${TRAINING_ENERGY_COST} energia cada).`;
};

/**
 * The rest screen, v2 (docs/tasks/27-ui-v2-rest-track.md, Figma "RestScreen v2").
 * Opens over the training screen with what the rest endpoint returned: her yawning
 * under a night sky, the energy before and after, and what is next.
 */
const RestScreen = ({ horse, energyBefore, rest, onContinue }: RestScreenProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();

  useScreenEnter(rootRef, true, { overlay: true });
  const exit = useScreenExit(rootRef, { overlay: true });
  useHoverScale(rootRef, ".RestScreen__continue");

  const fillRef = useBarTween<HTMLSpanElement>(rest.energy / 100, {
    from: energyBefore / 100,
    delay: FILL_DELAY,
    duration: FILL_SECONDS
  });
  const energyRef = useCountUp<HTMLElement>(rest.energy, {
    from: energyBefore,
    delay: FILL_DELAY,
    duration: FILL_SECONDS
  });

  // The "Z z z" floats; the gain chip pops in once the bar is full.
  useLayoutEffect(() => {
    if (reduced) return;
    const context = gsap.context(() => {
      gsap.to(".RestScreen__z", {
        y: -10,
        duration: 1.3,
        ease: "sine.inOut",
        stagger: { each: 0.22, repeat: -1, yoyo: true }
      });
      gsap.from(chipRef.current, {
        scale: 0,
        opacity: 0,
        duration: 0.45,
        ease: "back.out(2.4)",
        delay: FILL_DELAY + FILL_SECONDS
      });
    }, rootRef);
    return () => context.revert();
  }, [reduced]);

  const close = useCallback(() => {
    exit().then(onContinue);
  }, [exit, onContinue]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close]);

  const nextRace = horse.career?.status === "active" ? horse.career.nextRace : null;
  const raceDue = horse.career?.raceDue ?? false;
  const turnsLeft = horse.turnsLeft ?? 0;

  return (
    <div
      ref={rootRef}
      className="RestScreen"
      role="dialog"
      aria-modal="true"
      aria-labelledby="RestScreen-title"
      style={{ "--horse-color": horseColors[horse.name] ?? "var(--brand-red)" } as CSSProperties}
    >
      <img src={nightSky} alt="" className="RestScreen__sky" aria-hidden="true" />
      <img src={moon} alt="" className="RestScreen__moon" aria-hidden="true" />
      <div className="RestScreen__corner" data-screen="corner" aria-hidden="true" />

      <section className="RestScreen__hero" aria-hidden="true">
        <div className="RestScreen__wedge" data-screen="wedge" />
        <VerticalName name={horse.name} />
        <img
          {...horseAnimation(horse.name, "Rest1.gif")}
          alt=""
          className="RestScreen__art"
          data-screen="art"
        />
        <span className="RestScreen__zzz" data-screen="name">
          {["Z", "z", "z", ".."].map((letter, index) => (
            <span key={index} className="RestScreen__z">{letter}</span>
          ))}
        </span>
      </section>

      <main className="RestScreen__content">
        <header className="RestScreen__header">
          <span className="RestScreen__eyebrow" data-screen="item">Carreira · Descanso</span>
          <h1 id="RestScreen-title" className="RestScreen__title" data-screen="item">Well rested!</h1>
          <p className="RestScreen__subtitle" data-screen="item">
            Ela dormiu a noite toda e acordou com as forças renovadas.
          </p>
        </header>

        <section className="RestScreen__energy" data-screen="item" aria-label="Energia">
          <div className="RestScreen__energy-head">
            <span className="RestScreen__label">Energia</span>
            <span ref={chipRef} className="RestScreen__gain">+{rest.energyRecovered}</span>
          </div>
          <p className="RestScreen__reading">
            <span className="RestScreen__before">{energyBefore}</span>
            <span className="RestScreen__arrow" aria-hidden="true">→</span>
            <strong ref={energyRef} className="RestScreen__after" />
            <span className="RestScreen__max">/100</span>
          </p>
          <div
            className="RestScreen__bar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={rest.energy}
          >
            <span ref={fillRef} className="RestScreen__bar-fill" />
            <span className="RestScreen__bar-before" style={{ width: `${energyBefore}%` }} />
          </div>
          <p className="RestScreen__hint">{trainingsLeft(rest.energy)}</p>
        </section>

        <div className="RestScreen__tiles">
          <section className="RestScreen__tile" data-screen="item">
            <span className="RestScreen__label">Turno</span>
            <strong>{rest.turnSpent ? "1 turno usado" : "Saiu de graça"}</strong>
            {!rest.turnSpent && <span className="RestScreen__tile-note">sem turnos, não gastou nada</span>}
          </section>

          {nextRace && (
            <section className="RestScreen__tile RestScreen__tile--race" data-screen="item">
              <img src={trackIcon} alt="" />
              <div>
                <span className="RestScreen__label">Próxima corrida</span>
                <strong>{raceDue ? "é hoje!" : `em ${turnsLeft} ${turnsLeft === 1 ? "turno" : "turnos"}`}</strong>
                <span className="RestScreen__tile-note">{nextRace.trackName}</span>
              </div>
            </section>
          )}
        </div>

        <button type="button" className="RestScreen__continue" data-screen="item" onClick={close} autoFocus>
          CONTINUAR
          <span>voltar ao treino</span>
        </button>
      </main>
    </div>
  );
};

export default RestScreen;
