import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import confetti from "canvas-confetti";
import TrackProfile from "../TrackProfile/TrackProfile";
import Button from "../ui/Button/Button";
import Panel from "../ui/Panel/Panel";
import Pill from "../ui/Pill/Pill";
import RaceHeader from "./RaceHeader";
import RaceHud from "./RaceHud";
import RaceLane from "./RaceLane";
import RaceResults from "./RaceResults";
import { useRacePlayback } from "./useRacePlayback";
import { getTracks, runRace, type RunRaceResponse } from "../../services/Race";
import { horseColors } from "../../constants/horseColors";
import { trackImage } from "../../constants/trackVisuals";
import type { RunningStyle, TrackResponse } from "../../types/race";
import "./RaceRunner.css";

const RIVAL_COLORS = [
  "#4a90d9", "#e0a100", "#7b5ea7", "#e4572e", "#2aa198",
  "#c2185b", "#5d6d7e", "#8bc34a", "#ff7043", "#6d4c41",
  "#00838f", "#9e9d24", "#ad1457"
];

const PLAYBACK_SPEEDS = [1, 2, 4] as const;

const RaceRunner = () => {
  const { horseId, trackSlug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [track, setTrack] = useState<TrackResponse | null>(null);
  const [race, setRace] = useState<RunRaceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [speed, setSpeed] = useState<number>(1);
  const [showResults, setShowResults] = useState(false);
  const [paused, setPaused] = useState(false);
  /** The player's call; it holds until the race ends. */
  const [hudHidden, setHudHidden] = useState(false);
  const toggleHud = useCallback(() => setHudHidden((hidden) => !hidden), []);

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
  const playback = useRacePlayback(simulation, { speed, playing: !showResults && !paused });

  // The step handlers read the time through a ref, so they (and the keyboard listener
  // below) stay stable instead of being rebuilt on every animation frame.
  const timeRef = useRef(0);
  timeRef.current = playback.time;
  const { seek } = playback;

  const togglePause = useCallback(() => setPaused((current) => !current), []);
  /**
   * Moves to the end of the turn after (or before) the one on the clock, where the HUD
   * shows everything that turn decided. The ref moves with it, so several presses
   * between two renders still count as several turns.
   */
  const stepTo = useCallback(
    (direction: 1 | -1) => {
      setPaused(true);
      const turn = timeRef.current < 1e-6 ? 0 : Math.ceil(timeRef.current - 1e-6);
      timeRef.current = seek(turn + direction);
    },
    [seek]
  );
  const stepForward = useCallback(() => stepTo(1), [stepTo]);
  const stepBack = useCallback(() => stepTo(-1), [stepTo]);

  useEffect(() => {
    if (!simulation || showResults) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.altKey || event.metaKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;

      if (event.key === " ") {
        // A focused button already answers Space with a click of its own.
        if (target?.closest("button")) return;
        event.preventDefault();
        togglePause();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        stepForward();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        stepBack();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [simulation, showResults, togglePause, stepForward, stepBack]);

  const playerLane = useMemo(
    () => simulation?.runners.findIndex((runner) => runner.isPlayer) ?? -1,
    [simulation]
  );

  /**
   * The references the HUD measures against, read once from the telemetry: her ceiling
   * before tiring, and the stamina she left the gates with (turn 1's leftover plus its cost).
   */
  const hudScale = useMemo(() => {
    const turns = simulation?.telemetry ?? [];
    if (!turns.length) return null;
    return {
      topCeiling: Math.max(...turns.map((turn) => turn.ceiling)),
      maxStamina: turns[0].stamina + turns[0].staminaCost
    };
  }, [simulation]);

  /** Placement by lane, so a lane does not have to search the standings itself. */
  const placements = useMemo(() => {
    const byLane: number[] = [];
    playback.order.forEach((lane, index) => {
      byLane[lane] = index + 1;
    });
    return byLane;
  }, [playback.order]);

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

  if (error) {
    return (
      <div className="RaceRunner RaceRunner--state">
        <div className="RaceRunner__state-card">
          <h1 className="RaceRunner__state-title">A corrida não aconteceu</h1>
          <p role="alert">{error}</p>
          <Button variant="primary" onClick={() => navigate(`/Race/${horseId}`)}>
            Voltar às pistas
          </Button>
        </div>
      </div>
    );
  }

  if (!race || !simulation || !track) {
    return (
      <div className="RaceRunner RaceRunner--state">
        <div className="RaceRunner__state-card">
          <h1 className="RaceRunner__state-title">Preparando os portões</h1>
          <div className="RaceRunner__gates" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <p aria-live="polite">Montando o páreo e aquecendo as corredoras...</p>
        </div>
      </div>
    );
  }

  const playerResult = simulation.results.find((result) => result.isPlayer)!;
  const playerProgress =
    playerLane >= 0 ? (playback.positions[playerLane] ?? 0) / simulation.distance : 0;
  const latestActivations = playback.activations.slice(-4).reverse();
  const art = trackImage(track.image);

  return (
    <div className="RaceRunner">
      <RaceHeader
        track={track}
        style={style}
        time={playback.time}
        lastTurn={Math.ceil(simulation.frames.at(-1)?.t ?? 1)}
        speed={speed}
        speeds={PLAYBACK_SPEEDS}
        onSpeedChange={setSpeed}
        paused={paused}
        onTogglePause={togglePause}
        onStepBack={stepBack}
        onStepForward={stepForward}
        onSkip={() => setShowResults(true)}
      />

      <section
        className="RaceRunner__course"
        style={art ? { backgroundImage: `url(${art})` } : undefined}
        aria-label="Corrida em andamento"
      >
        <div className="RaceRunner__lanes">
          {simulation.runners.map((runner, lane) => (
            <RaceLane
              key={runner.id}
              name={runner.name}
              isPlayer={runner.isPlayer}
              color={
                runner.isPlayer
                  ? horseColors[runner.name] ?? "var(--brand-turf)"
                  : RIVAL_COLORS[lane % RIVAL_COLORS.length]
              }
              progress={(playback.positions[lane] ?? 0) / simulation.distance}
              placement={placements[lane] ?? lane + 1}
              stamina={playback.stamina[lane] ?? 0}
            />
          ))}
        </div>
      </section>

      {playback.telemetry && hudScale && (
        <RaceHud
          telemetry={playback.telemetry}
          topCeiling={hudScale.topCeiling}
          maxStamina={hudScale.maxStamina}
          hidden={hudHidden}
          onToggle={toggleHud}
        />
      )}

      <section className="RaceRunner__panels">
        <Panel
          title="Perfil da pista"
          action={<span>{Math.round(playerProgress * track.distance)}m</span>}
        >
          <TrackProfile
            segments={track.segments}
            distance={track.distance}
            progress={playerProgress}
            height={96}
            showLabels
          />
          {currentSegment && (
            <p className="RaceRunner__segment">
              <span className="RaceRunner__segment-label">{currentSegment.label}</span>
              {currentSegment.grade > 0 && (
                <Pill tone="uphill">▲ subida {currentSegment.grade}%</Pill>
              )}
              {currentSegment.grade < 0 && (
                <Pill tone="downhill">▼ descida {Math.abs(currentSegment.grade)}%</Pill>
              )}
              {currentSegment.curve >= 0.4 && <Pill tone="curve">↩ curva</Pill>}
            </p>
          )}
        </Panel>

        <Panel title="Skills" action={<span>{playback.activations.length} no páreo</span>}>
          {latestActivations.length === 0 ? (
            <p className="RaceRunner__muted">Nenhuma skill ativada ainda.</p>
          ) : (
            <ul className="RaceRunner__activations">
              {latestActivations.map((activation, index) => (
                <li
                  key={`${activation.runnerId}-${activation.skillSlug}-${index}`}
                  className={activation.runnerId === "player" ? "is-player" : undefined}
                >
                  <strong>{activation.skillName}</strong>
                  <span>
                    {activation.runnerName} · {activation.distance}m
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>

      {showResults && (
        <RaceResults
          rewards={race.rewards}
          playerResult={playerResult}
          results={simulation.results}
          shortfalls={simulation.shortfalls.player ?? []}
          onAnotherTrack={() => navigate(`/Race/${horseId}`)}
          onBackToTraining={() => navigate(`/HorseSelector/Career/${horseId}`)}
        />
      )}
    </div>
  );
};

export default RaceRunner;
