import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import confetti from "canvas-confetti";
import Button from "../ui/Button/Button";
import RaceCam from "./RaceCam";
import RaceHeader from "./RaceHeader";
import RaceHud from "./RaceHud";
import RaceOval from "./RaceOval";
import RaceResults from "./RaceResults";
import RaceRivals from "./RaceRivals";
import RaceStandings from "./RaceStandings";
import TrackStrip from "./TrackStrip";
import { ordinal } from "./format";
import { useRacePlayback } from "./useRacePlayback";
import { getTracks, runRace, type RunRaceResponse } from "../../services/Race";
import { horseColors } from "../../constants/horseColors";
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
  /** Held until the player has seen her rivals and sent the field off. */
  const [started, setStarted] = useState(false);
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
  // Races from before rivals existed have none to introduce, so they start right away.
  const introducingRivals = !started && (simulation?.rivals?.length ?? 0) > 0;
  const playback = useRacePlayback(simulation, {
    speed,
    playing: !introducingRivals && !showResults && !paused
  });

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
    if (!simulation || showResults || introducingRivals) return;

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
  }, [simulation, showResults, introducingRivals, togglePause, stepForward, stepBack]);

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
  const playerCovered = playerLane >= 0 ? (playback.positions[playerLane] ?? 0) : 0;
  const playerProgress = playerCovered / simulation.distance;
  const playerPlacement = playback.order.indexOf(playerLane) + 1;
  const latestActivations = playback.activations.slice(-4).reverse();

  const colorOf = (lane: number) => {
    const runner = simulation.runners[lane];
    return runner.isPlayer
      ? horseColors[runner.name] ?? "var(--brand-turf)"
      : RIVAL_COLORS[lane % RIVAL_COLORS.length];
  };

  const standings = playback.order.map((lane) => ({
    ...simulation.runners[lane],
    color: colorOf(lane),
    position: playback.positions[lane] ?? 0
  }));
  const leader = standings[0];
  const player = playerLane >= 0 ? simulation.runners[playerLane] : null;
  const leaderLead = standings.length > 1 ? leader.position - standings[1].position : 0;
  const playerGap = leader ? leader.position - playerCovered : 0;

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

      <div className="RaceRunner__stage">
        <section className="RaceRunner__course" aria-label="Corrida em andamento">
          <RaceOval
            runners={simulation.runners.map((runner, lane) => ({
              id: runner.id,
              color: colorOf(lane),
              isPlayer: runner.isPlayer,
              progress: (playback.positions[lane] ?? 0) / simulation.distance,
              lane
            }))}
            playerPlacement={playerPlacement}
            covered={playerCovered}
            distance={simulation.distance}
            segmentLabel={currentSegment?.label}
          />
        </section>

        <aside className="RaceRunner__side RaceRunner__side--left">
          {player && (
            <RaceCam
              title="LIVE"
              tone="live"
              name={player.name}
              caption={
                playerPlacement === 1
                  ? "1º · liderando"
                  : `${ordinal(playerPlacement)} · ${Math.round(playerGap)}m do líder`
              }
              color={colorOf(playerLane)}
              hasArt
            />
          )}
          <section className="RaceRunner__panel" aria-labelledby="race-standings-title">
            <header className="RaceRunner__panel-head">
              <h2 id="race-standings-title">Classificação</h2>
              <span>{standings.length} corredoras</span>
            </header>
            <RaceStandings runners={standings} />
          </section>
        </aside>

        <aside className="RaceRunner__side RaceRunner__side--right">
          {leader && (
            <RaceCam
              title="1º LUGAR"
              tone="leader"
              name={leader.name}
              caption={`${Math.round(leaderLead)}m à frente`}
              color={leader.color}
              hasArt={leader.isPlayer}
            />
          )}
          <section className="RaceRunner__panel" aria-labelledby="race-skills-title">
            <header className="RaceRunner__panel-head">
              <h2 id="race-skills-title">Skills</h2>
              <span>{playback.activations.length} no páreo</span>
            </header>
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
          </section>
        </aside>
      </div>

      <section className="RaceRunner__hud">
        {playback.telemetry && hudScale && (
          <RaceHud
            telemetry={playback.telemetry}
            topCeiling={hudScale.topCeiling}
            maxStamina={hudScale.maxStamina}
            hidden={hudHidden}
            onToggle={toggleHud}
          />
        )}
        <TrackStrip segments={track.segments} progress={playerProgress} />
      </section>

      {introducingRivals && (
        <RaceRivals
          rivals={simulation.rivals.map((rival) => ({
            ...rival,
            color: colorOf(simulation.runners.findIndex((runner) => runner.id === rival.id))
          }))}
          playerName={race.horse.name}
          playerStats={{
            speed: race.horse.speed,
            stamina: race.horse.stamina,
            power: race.horse.power,
            wit: race.horse.wit
          }}
          onStart={() => setStarted(true)}
        />
      )}

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
