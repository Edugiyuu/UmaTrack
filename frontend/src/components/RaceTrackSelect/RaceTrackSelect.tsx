import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useParams } from "react-router-dom";
import { gsap } from "gsap";
import TrackCard, { checkRequirements } from "../TrackCard/TrackCard";
import VerticalName from "../ui/VerticalName/VerticalName";
import { useTransitionNavigate } from "../PageTransition/PageTransition";
import { useScreenEnter } from "../../animations/screen";
import { useHoverScale } from "../../animations/useHoverScale";
import { useSegmentSlider } from "../../animations/useSegmentSlider";
import { useStaggerIn } from "../../animations/useStaggerIn";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { useFreshGif } from "../../hooks/useFreshGif";
import { getTracks } from "../../services/Race";
import { getCurrentUser, getOwnedHorse } from "../../services/User";
import { horseColors } from "../../constants/horseColors";
import { goalLabel } from "../../constants/career";
import { RUNNING_STYLE_HINT, RUNNING_STYLE_LABEL, STAT_LABEL } from "../../constants/trackVisuals";
import { horseAnimation } from "../../utils/horseImage";
import type { HorseResponseProfile } from "../../types/horse";
import type { RunningStyle, TrackResponse } from "../../types/race";
import "./RaceTrackSelect.css";

const RUNNING_STYLES: RunningStyle[] = ["front", "pace", "late", "end"];
/** Mirrors RACE_ENERGY_COST on the server. */
const RACE_ENERGY_COST = 35;

/**
 * The track screen, v2 (docs/tasks/27-ui-v2-rest-track.md, Figma "ChooseTrackScreen v2"):
 * her art running on the left; the tracks, the strategy and START RACE! on the right.
 * The rules did not change: the career race is the only track when it is due, and the
 * same blockers (career over, money, energy) keep START RACE! disabled.
 */
const RaceTrackSelect = () => {
  const { horseId } = useParams();
  const go = useTransitionNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();

  const [horse, setHorse] = useState<HorseResponseProfile | null>(null);
  const [tracks, setTracks] = useState<TrackResponse[]>([]);
  const [monies, setMonies] = useState(0);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [style, setStyle] = useState<RunningStyle>("pace");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!horseId) return;
    const controller = new AbortController();

    const load = async () => {
      try {
        const [ownedHorse, trackList, user] = await Promise.all([
          getOwnedHorse(horseId, controller.signal),
          getTracks(controller.signal),
          getCurrentUser()
        ]);
        setHorse(ownedHorse);
        setTracks(trackList);
        setMonies(user.monies);
        setStyle(ownedHorse.runningStyle ?? "pace");
        // When the career race is due it is the only track on offer.
        const due = ownedHorse.career?.raceDue ? ownedHorse.career.nextRace?.trackSlug : null;
        setSelectedSlug((current) => due ?? current ?? trackList[0]?.slug ?? null);
        setError(null);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar as pistas.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [horseId]);

  useScreenEnter(rootRef, !loading);
  useStaggerIn(gridRef, ".TrackCard", [loading], { delay: 0.25, stagger: 0.05 });
  useHoverScale(rootRef, ".TrackSelect__back, .TrackSelect__start");
  useHoverScale(rootRef, ".TrackCard__face", { hover: 1.025, press: 0.985 });
  const styleThumbRef = useSegmentSlider<HTMLSpanElement>(RUNNING_STYLES.indexOf(style));
  // Her run plays once and holds the last frame; a fresh copy replays it on every visit.
  const runArt = horse ? horseAnimation(horse.name, "Run1.gif") : null;
  const freshRun = useFreshGif(runArt?.src ?? null);

  const selectedTrack = useMemo(
    () => tracks.find((track) => track.slug === selectedSlug) ?? null,
    [tracks, selectedSlug]
  );

  // The START RACE! line swaps with a short fade when the pick changes.
  const summaryShown = useRef(selectedSlug);
  useLayoutEffect(() => {
    const summary = summaryRef.current;
    if (!summary || summaryShown.current === selectedSlug) return;
    const first = summaryShown.current === null;
    summaryShown.current = selectedSlug;
    if (first || reduced) return;
    const tween = gsap.fromTo(summary, { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: 0.25, ease: "power1.out" });
    return () => {
      tween.revert();
    };
  }, [selectedSlug, reduced]);

  const career = horse?.career;
  const careerRace = career?.raceDue ? career.nextRace : null;
  const retired = career !== undefined && career.status !== "active";
  const horseColor = horse ? horseColors[horse.name] ?? "var(--brand-red)" : "var(--brand-red)";
  // The career race has no entry fee.
  const entryFee = careerRace ? 0 : selectedTrack?.entryFee ?? 0;

  const blockers = useMemo(() => {
    if (!selectedTrack || !horse) return [];
    const reasons: string[] = [];
    if (retired) {
      reasons.push("A carreira dela terminou. Comece uma nova carreira no treino.");
    }
    if (monies < entryFee) {
      reasons.push(`Faltam ${entryFee - monies} para a inscrição.`);
    }
    if ((horse.energy ?? 0) < RACE_ENERGY_COST) {
      reasons.push(`Energia insuficiente: precisa de ${RACE_ENERGY_COST}. Descanse no treino.`);
    }
    return reasons;
  }, [selectedTrack, horse, monies, entryFee, retired]);

  const startRace = useCallback(() => {
    if (!horseId || !selectedTrack || blockers.length) return;
    go(`/Race/${horseId}/${selectedTrack.slug}?style=${style}`, { color: horseColor });
  }, [horseId, selectedTrack, blockers, go, style, horseColor]);

  const backToTraining = () => go(`/HorseSelector/Career/${horseId}`, { color: horseColor });

  if (loading || !horse) {
    return (
      <div className="TrackSelect TrackSelect--empty">
        <p className="TrackSelect__state" role={error ? "alert" : undefined}>
          {loading ? "Carregando pistas..." : error ?? "Cavalo não encontrado."}
        </p>
      </div>
    );
  }

  const unmet = selectedTrack ? checkRequirements(selectedTrack, horse).filter((check) => !check.met) : [];
  const shownTracks = tracks.filter((track) => !careerRace || track.slug === careerRace.trackSlug);
  const summary = selectedTrack
    ? [
        selectedTrack.name,
        `−${RACE_ENERGY_COST} energia`,
        careerRace ? "sem inscrição" : entryFee > 0 ? `inscrição ${entryFee}` : "grátis"
      ].join(" · ")
    : "escolha uma pista";

  return (
    <div
      ref={rootRef}
      className="TrackSelect"
      style={{ "--horse-color": horseColor } as CSSProperties}
    >
      <div className="TrackSelect__corner" data-screen="corner" aria-hidden="true" />

      <section className="TrackSelect__hero" aria-hidden="true">
        <div className="TrackSelect__wedge" data-screen="wedge" />
        <VerticalName name={horse.name} />
        <img
          {...runArt}
          src={freshRun ?? runArt?.src}
          alt=""
          className="TrackSelect__art"
          data-screen="art"
        />
      </section>

      <main className="TrackSelect__content">
        <header className="TrackSelect__header">
          <span className="TrackSelect__eyebrow" data-screen="item">Carreira · Corrida</span>
          <h1 className="TrackSelect__title" data-screen="item">
            {careerRace ? "Prova da carreira" : "Escolha a pista"}
          </h1>
          {careerRace ? (
            <p className="TrackSelect__context is-due" data-screen="item">
              Os turnos acabaram: hoje é <strong>{careerRace.trackName}</strong>, meta{" "}
              <strong>{goalLabel(careerRace.goal)}</strong>. Sem inscrição. Se não bater a meta, a
              carreira termina aqui.
            </p>
          ) : (
            <p className="TrackSelect__context" data-screen="item">
              Prova avulsa: gasta 1 turno e {RACE_ENERGY_COST} de energia.
              {career?.nextRace && (
                <>
                  {" "}Próxima prova da carreira: <strong>{career.nextRace.trackName}</strong> em{" "}
                  {horse.turnsLeft ?? 0} turnos (meta {goalLabel(career.nextRace.goal)}).
                </>
              )}
            </p>
          )}
        </header>

        <div ref={gridRef} className="TrackSelect__grid">
          {shownTracks.map((track) => (
            <TrackCard
              key={track._id}
              track={track}
              horse={horse}
              selected={track.slug === selectedSlug}
              free={careerRace !== null}
              onSelect={() => setSelectedSlug(track.slug)}
            />
          ))}
        </div>

        <section className="TrackSelect__strategy" data-screen="item">
          <span className="TrackSelect__label" id="TrackSelect-style">Estratégia</span>
          <div className="TrackSelect__segmented" role="radiogroup" aria-labelledby="TrackSelect-style">
            <span ref={styleThumbRef} className="TrackSelect__segmented-thumb" aria-hidden="true" />
            {RUNNING_STYLES.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={style === option}
                className={style === option ? "is-active" : undefined}
                title={RUNNING_STYLE_HINT[option]}
                onClick={() => setStyle(option)}
              >
                {RUNNING_STYLE_LABEL[option]}
              </button>
            ))}
          </div>
          <p className="TrackSelect__hint">{RUNNING_STYLE_HINT[style]}</p>
        </section>

        {(blockers.length > 0 || unmet.length > 0 || error) && (
          <div className="TrackSelect__notes" data-screen="item">
            {blockers.map((reason) => (
              <p key={reason} className="TrackSelect__blocker" role="alert">{reason}</p>
            ))}
            {!blockers.length && unmet.length > 0 && (
              <p className="TrackSelect__warning">
                Abaixo do recomendado em {unmet.map((check) => STAT_LABEL[check.stat]).join(", ")}: dá
                para correr, mas treinar antes ajuda muito.
              </p>
            )}
            {error && <p className="TrackSelect__blocker" role="alert">{error}</p>}
          </div>
        )}

        <div className="TrackSelect__actions" data-screen="item">
          <button type="button" className="TrackSelect__back" onClick={backToTraining}>
            VOLTAR
            <span>ao treino</span>
          </button>
          <button
            type="button"
            className="TrackSelect__start"
            disabled={!selectedTrack || blockers.length > 0}
            onClick={startRace}
          >
            START RACE!
            <span ref={summaryRef}>{summary}</span>
          </button>
        </div>
      </main>
    </div>
  );
};

export default RaceTrackSelect;
