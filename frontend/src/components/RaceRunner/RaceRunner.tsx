import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import TrackProfile from "../TrackProfile/TrackProfile";
import { useRacePlayback } from "./useRacePlayback";
import { getTracks, runRace, type RunRaceResponse } from "../../services/Race";
import { horseColors } from "../../constants/horseColors";
import {
  RUNNING_STYLE_LABEL,
  SURFACE_LABEL,
  TERRAIN_LABEL,
  trackImage
} from "../../constants/trackVisuals";
import type { RunningStyle, TrackResponse } from "../../types/race";
import confetti from "canvas-confetti";
import "./RaceRunner.css";

const RIVAL_COLORS = [
  "#4a90d9", "#e0a100", "#7b5ea7", "#e4572e", "#2aa198",
  "#c2185b", "#5d6d7e", "#8bc34a", "#ff7043", "#6d4c41",
  "#00838f", "#9e9d24", "#ad1457"
];

const PLAYBACK_SPEEDS = [1, 2, 4];

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds - minutes * 60;
  return minutes > 0 ? `${minutes}:${rest.toFixed(2).padStart(5, "0")}` : `${rest.toFixed(2)}s`;
};

const ordinal = (placement: number) => `${placement}º`;

const RaceRunner = () => {
  const { horseId, trackSlug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [track, setTrack] = useState<TrackResponse | null>(null);
  const [race, setRace] = useState<RunRaceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1);
  const [showResults, setShowResults] = useState(false);

  const style = (searchParams.get("style") ?? "pace") as RunningStyle;

  useEffect(() => {
    if (!horseId || !trackSlug) return;
    let cancelled = false;

    const start = async () => {
      try {
        const tracks = await getTracks();
        const selected = tracks.find((candidate) => candidate.slug === trackSlug) ?? null;
        if (cancelled) return;
        setTrack(selected);

        const result = await runRace(horseId, trackSlug, style);
        if (cancelled) return;
        setRace(result);
      } catch (raceError) {
        if (cancelled) return;
        setError(raceError instanceof Error ? raceError.message : "Não foi possível correr.");
      }
    };

    start();
    return () => {
      cancelled = true;
    };
  }, [horseId, trackSlug, style]);

  const simulation = race?.simulation ?? null;
  const playback = useRacePlayback(simulation, { speed, playing: !showResults });

  const playerLane = useMemo(
    () => simulation?.runners.findIndex((runner) => runner.isPlayer) ?? -1,
    [simulation]
  );

  useEffect(() => {
    if (!playback.finished || !race || showResults) return;
    setShowResults(true);
    if (race.rewards.placement === 1) {
      confetti({ particleCount: 320, spread: 200, origin: { y: 0.6 }, zIndex: 9999, scalar: 1.5 });
    }
  }, [playback.finished, race, showResults]);

  const currentSegment = useMemo(() => {
    if (!track || playerLane < 0) return null;
    const distance = playback.positions[playerLane] ?? 0;
    let cursor = 0;
    for (const segment of track.segments) {
      cursor += segment.lengthRatio * track.distance;
      if (distance < cursor) return segment;
    }
    return track.segments.at(-1) ?? null;
  }, [track, playback.positions, playerLane]);

  const latestActivations = playback.activations.slice(-4).reverse();

  if (error) {
    return (
      <div className="RaceRunner__state">
        <p role="alert">{error}</p>
        <button type="button" onClick={() => navigate(`/Race/${horseId}`)}>Voltar às pistas</button>
      </div>
    );
  }

  if (!race || !simulation || !track) {
    return <div className="RaceRunner__state"><p>Preparando os portões...</p></div>;
  }

  const playerResult = simulation.results.find((result) => result.isPlayer)!;
  const playerProgress = playerLane >= 0 ? (playback.positions[playerLane] ?? 0) / simulation.distance : 0;

  return (
    <div className="RaceRunner">
      <header className="RaceRunner__header">
        <div>
          <h1>{track.name}</h1>
          <p>
            {track.distance}m · {SURFACE_LABEL[track.surface]} · {TERRAIN_LABEL[track.terrain]} ·
            {" "}{RUNNING_STYLE_LABEL[style]}
          </p>
        </div>
        <div className="RaceRunner__clock">
          <span>{formatTime(playback.time)}</span>
          <div className="RaceRunner__speeds">
            {PLAYBACK_SPEEDS.map((option) => (
              <button
                key={option}
                type="button"
                className={speed === option ? "is-active" : ""}
                onClick={() => setSpeed(option)}
              >
                {option}x
              </button>
            ))}
            <button type="button" onClick={() => setShowResults(true)}>Pular</button>
          </div>
        </div>
      </header>

      <section
        className="RaceRunner__course"
        style={{ backgroundImage: trackImage(track.image) ? `url(${trackImage(track.image)})` : undefined }}
      >
        <div className="RaceRunner__lanes">
          {simulation.runners.map((runner, lane) => {
            const progress = (playback.positions[lane] ?? 0) / simulation.distance;
            const color = runner.isPlayer
              ? horseColors[runner.name] ?? "#24bb6d"
              : RIVAL_COLORS[lane % RIVAL_COLORS.length];

            return (
              <div
                key={runner.id}
                className={`RaceRunner__lane${runner.isPlayer ? " RaceRunner__lane--player" : ""}`}
              >
                <span className="RaceRunner__lane-place">
                  {ordinal(playback.order.indexOf(lane) + 1)}
                </span>
                <div className="RaceRunner__track">
                  <div
                    className="RaceRunner__runner"
                    style={{ left: `${Math.min(100, progress * 100)}%`, backgroundColor: color }}
                    title={runner.name}
                  >
                    <span>{runner.name}</span>
                  </div>
                </div>
                {runner.isPlayer && (
                  <progress
                    className="RaceRunner__stamina"
                    max={1}
                    value={playback.stamina[lane] ?? 0}
                    title="Fôlego"
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="RaceRunner__panels">
        <div className="RaceRunner__panel">
          <h2>Perfil da pista</h2>
          <TrackProfile
            segments={track.segments}
            distance={track.distance}
            progress={playerProgress}
            height={88}
            showLabels
          />
          {currentSegment && (
            <p className="RaceRunner__segment">
              {currentSegment.label}
              {currentSegment.grade > 0 && <strong className="is-uphill"> ▲ subida {currentSegment.grade}%</strong>}
              {currentSegment.grade < 0 && <strong className="is-downhill"> ▼ descida {Math.abs(currentSegment.grade)}%</strong>}
              {currentSegment.curve >= 0.4 && <strong className="is-curve"> ↩ curva</strong>}
            </p>
          )}
        </div>

        <div className="RaceRunner__panel">
          <h2>Skills</h2>
          {latestActivations.length === 0 ? (
            <p className="RaceRunner__muted">Nenhuma skill ativada ainda.</p>
          ) : (
            <ul className="RaceRunner__activations">
              {latestActivations.map((activation, index) => (
                <li
                  key={`${activation.runnerId}-${activation.skillSlug}-${index}`}
                  className={activation.runnerId === "player" ? "is-player" : ""}
                >
                  <strong>{activation.skillName}</strong>
                  <span>{activation.runnerName} · {activation.distance}m</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {showResults && (
        <div className="RaceRunner__results-backdrop">
          <div className="RaceRunner__results">
            <h2>{race.rewards.placement === 1 ? "Vitória! 🏆" : `${ordinal(race.rewards.placement)} lugar`}</h2>
            <p className="RaceRunner__results-time">
              {formatTime(playerResult.finishTime)} · vel. máx {playerResult.topSpeed} m/s
              {playerResult.exhausted && " · ficou sem fôlego"}
            </p>

            <ul className="RaceRunner__rewards">
              <li>Prêmio <strong>+{race.rewards.prizeMoney.toLocaleString("pt-BR")}</strong></li>
              <li>Inscrição <strong>-{race.rewards.entryFee.toLocaleString("pt-BR")}</strong></li>
              <li>Skill points <strong>+{race.rewards.skillPointsEarned}</strong></li>
              <li>Fãs <strong>+{race.rewards.fansEarned.toLocaleString("pt-BR")}</strong></li>
              <li>Energia <strong>-{race.rewards.energySpent}</strong></li>
              <li>Turnos de treino <strong>{race.rewards.turnsLeft}</strong></li>
            </ul>

            {playerResult.skillsActivated.length > 0 && (
              <p className="RaceRunner__results-skills">
                Skills ativadas: {playerResult.skillsActivated.join(", ")}
              </p>
            )}

            {simulation.shortfalls.player?.length > 0 && (
              <p className="RaceRunner__results-warning">
                Ela correu abaixo do recomendado em{" "}
                {simulation.shortfalls.player.map((entry) => entry.stat).join(", ")}. Treine antes de
                voltar aqui.
              </p>
            )}

            <ol className="RaceRunner__standings">
              {simulation.results.slice(0, 6).map((result) => (
                <li key={result.id} className={result.isPlayer ? "is-player" : ""}>
                  <span>{ordinal(result.placement)}</span>
                  <span>{result.name}</span>
                  <span>{formatTime(result.finishTime)}</span>
                </li>
              ))}
            </ol>

            <div className="RaceRunner__results-actions">
              <button type="button" onClick={() => navigate(`/Race/${horseId}`)}>Outra pista</button>
              <button type="button" onClick={() => navigate(`/HorseSelector/Career/${horseId}`)}>
                Voltar ao treino
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RaceRunner;
