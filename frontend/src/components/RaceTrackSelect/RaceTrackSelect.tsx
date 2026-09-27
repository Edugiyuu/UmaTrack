import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TrackCard, { checkRequirements } from "../TrackCard/TrackCard";
import { getTracks } from "../../services/Race";
import { getCurrentUser, getOwnedHorse } from "../../services/User";
import { horseColors } from "../../constants/horseColors";
import { goalLabel } from "../../constants/career";
import { RUNNING_STYLE_HINT, RUNNING_STYLE_LABEL } from "../../constants/trackVisuals";
import type { HorseResponseProfile } from "../../types/horse";
import type { RunningStyle, TrackResponse } from "../../types/race";
import speedIcon from "../../assets/gameIcons/speedIcon.png";
import staminaIcon from "../../assets/gameIcons/staminaIcon.png";
import powerIcon from "../../assets/gameIcons/powerIcon.png";
import witIcon from "../../assets/gameIcons/witIcon.png";
import "./RaceTrackSelect.css";

const RUNNING_STYLES: RunningStyle[] = ["front", "pace", "late", "end"];
/** Mirrors RACE_ENERGY_COST on the server. */
const RACE_ENERGY_COST = 35;

const RaceTrackSelect = () => {
  const { horseId } = useParams();
  const navigate = useNavigate();

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

  const selectedTrack = useMemo(
    () => tracks.find((track) => track.slug === selectedSlug) ?? null,
    [tracks, selectedSlug]
  );

  const career = horse?.career;
  const careerRace = career?.raceDue ? career.nextRace : null;
  const retired = career !== undefined && career.status !== "active";

  const blockers = useMemo(() => {
    if (!selectedTrack || !horse) return [];
    const reasons: string[] = [];
    if (retired) {
      reasons.push("A carreira dela terminou. Comece uma nova carreira no treino.");
    }
    // The career race has no entry fee.
    const entryFee = careerRace ? 0 : selectedTrack.entryFee;
    if (monies < entryFee) {
      reasons.push(`Faltam ${entryFee - monies} para a inscrição.`);
    }
    if ((horse.energy ?? 0) < RACE_ENERGY_COST) {
      reasons.push(`Energia insuficiente: precisa de ${RACE_ENERGY_COST}. Descanse no treino.`);
    }
    return reasons;
  }, [selectedTrack, horse, monies, careerRace, retired]);

  const startRace = useCallback(() => {
    if (!horseId || !selectedTrack || blockers.length) return;
    navigate(`/Race/${horseId}/${selectedTrack.slug}?style=${style}`);
  }, [horseId, selectedTrack, blockers, navigate, style]);

  if (loading || !horse) {
    return (
      <div className="RaceTrackSelect RaceTrackSelect--empty">
        <p className="RaceTrackSelect__state" role={error ? "alert" : undefined}>
          {loading ? "Carregando pistas..." : error ?? "Cavalo não encontrado."}
        </p>
      </div>
    );
  }

  const unmet = selectedTrack ? checkRequirements(selectedTrack, horse).filter((check) => !check.met) : [];

  return (
    <div className="RaceTrackSelect">
      <aside
        className="RaceTrackSelect__horse"
        style={{ borderTopColor: horseColors[horse.name] ?? "#24bb6d" }}
      >
        <h2>{horse.name}</h2>
        <p className="RaceTrackSelect__passive">{horse.passiveBuff}</p>

        <ul className="RaceTrackSelect__stats">
          <li><img src={speedIcon} alt="" /> Speed <strong>{horse.speed}</strong></li>
          <li><img src={staminaIcon} alt="" /> Stamina <strong>{horse.stamina}</strong></li>
          <li><img src={powerIcon} alt="" /> Power <strong>{horse.power}</strong></li>
          <li><img src={witIcon} alt="" /> Wit <strong>{horse.wit}</strong></li>
        </ul>

        <div className="RaceTrackSelect__meters">
          <label>
            Energia
            <progress max={100} value={horse.energy ?? 0} />
            <span>{horse.energy ?? 0}/100</span>
          </label>
          <p>Humor: {"★".repeat(horse.mood ?? 3)}{"☆".repeat(Math.max(0, 5 - (horse.mood ?? 3)))}</p>
          <p>Skill points: <strong>{horse.skillPoints ?? 0}</strong></p>
          <p>Skills: {horse.skills?.length ? horse.skills.map((skill) => skill.name).join(", ") : "nenhuma"}</p>
          <p>Carteira: <strong>{monies.toLocaleString("pt-BR")}</strong></p>
        </div>

        <fieldset className="RaceTrackSelect__styles">
          <legend>Estratégia</legend>
          {RUNNING_STYLES.map((option) => (
            <label key={option} title={RUNNING_STYLE_HINT[option]}>
              <input
                type="radio"
                name="runningStyle"
                value={option}
                checked={style === option}
                onChange={() => setStyle(option)}
              />
              {RUNNING_STYLE_LABEL[option]}
            </label>
          ))}
          <p className="RaceTrackSelect__style-hint">{RUNNING_STYLE_HINT[style]}</p>
        </fieldset>

        <button
          type="button"
          className="RaceTrackSelect__start"
          disabled={!selectedTrack || blockers.length > 0}
          onClick={startRace}
        >
          {careerRace
            ? `Correr a prova da carreira`
            : selectedTrack
              ? `Correr em ${selectedTrack.name}`
              : "Escolha uma pista"}
        </button>

        {blockers.map((reason) => (
          <p key={reason} className="RaceTrackSelect__blocker" role="alert">{reason}</p>
        ))}
        {!blockers.length && unmet.length > 0 && (
          <p className="RaceTrackSelect__blocker">
            Ela está abaixo do recomendado nesta pista. Treinar antes ajuda muito.
          </p>
        )}
        {error && <p className="RaceTrackSelect__blocker" role="alert">{error}</p>}

        <button type="button" className="RaceTrackSelect__back" onClick={() => navigate(`/HorseSelector/Career/${horseId}`)}>
          Voltar ao treino
        </button>
      </aside>

      <section className="RaceTrackSelect__tracks">
        <h1>{careerRace ? "Prova da carreira" : "Escolha a pista"}</h1>
        {careerRace ? (
          <p className="RaceTrackSelect__career is-due">
            Os turnos acabaram: hoje é <strong>{careerRace.trackName}</strong>, meta{" "}
            <strong>{goalLabel(careerRace.goal)}</strong>. Sem inscrição. Se não bater a meta, a
            carreira termina aqui.
          </p>
        ) : career?.nextRace ? (
          <p className="RaceTrackSelect__career">
            Prova avulsa: gasta <strong>1 turno</strong> e energia, e rende fãs e skill points.
            A próxima prova da carreira é <strong>{career.nextRace.trackName}</strong> em{" "}
            {horse.turnsLeft ?? 0} turnos (meta {goalLabel(career.nextRace.goal)}).
          </p>
        ) : null}
        <p className="RaceTrackSelect__intro">
          Cada pista cobra um atributo diferente. Subidas pedem POWER, provas longas pedem
          STAMINA e curvas fechadas pedem WIT.
        </p>
        <div className="RaceTrackSelect__grid">
          {tracks
            .filter((track) => !careerRace || track.slug === careerRace.trackSlug)
            .map((track) => (
            <TrackCard
              key={track._id}
              track={track}
              horse={horse}
              selected={track.slug === selectedSlug}
              onSelect={() => setSelectedSlug(track.slug)}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default RaceTrackSelect;
