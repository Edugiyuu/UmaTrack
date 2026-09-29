import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import confetti from "canvas-confetti";
import Button from "../ui/Button/Button";
import { RaceFinalBanner, RaceSeal, BANNER_MS, type Seal } from "./RaceBanner";
import RaceCam from "./RaceCam";
import RaceCountdown, { type CountdownStep } from "./RaceCountdown";
import RaceCutscene from "./RaceCutscene";
import RaceFxOverlay from "./RaceFxOverlay";
import RaceHeader from "./RaceHeader";
import RaceHud from "./RaceHud";
import RaceOval from "./RaceOval";
import RaceResults from "./RaceResults";
import RaceRivals from "./RaceRivals";
import RaceStandings from "./RaceStandings";
import TrackStrip from "./TrackStrip";
import { ordinal } from "./format";
import { useRacePlayback } from "./useRacePlayback";
import { skillEffectText, useRaceEffects, type RaceEvent } from "./useRaceEffects";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { getSkills, getTracks, runRace, type RunRaceResponse } from "../../services/Race";
import { raceAudio } from "../../services/raceAudio";
import { horseColors } from "../../constants/horseColors";
import type {
  RaceSimulation,
  RunningStyle,
  SkillActivation,
  SkillResponse,
  TrackResponse
} from "../../types/race";
import "./RaceRunner.css";

const RIVAL_COLORS = [
  "#4a90d9", "#e0a100", "#7b5ea7", "#e4572e", "#2aa198",
  "#c2185b", "#5d6d7e", "#8bc34a", "#ff7043", "#6d4c41",
  "#00838f", "#9e9d24", "#ad1457"
];

const PLAYBACK_SPEEDS = [1, 2, 4] as const;

/** At most this many seals wait their turn; the rest are dropped, rivals' first. */
const SEAL_QUEUE = 3;
/** A seal older than this, in turns of race time, is stale and never shown. */
const SEAL_TTL = 2;

const segmentAt = (track: TrackResponse, distance: number) => {
  let cursor = 0;
  for (const segment of track.segments) {
    cursor += segment.lengthRatio * track.distance;
    if (distance < cursor) return segment;
  }
  return track.segments.at(-1) ?? null;
};

/** Stand-in while the race loads, so the effects hook can run before there is one. */
const EMPTY_SIMULATION: RaceSimulation = {
  seed: 0,
  trackSlug: "",
  distance: 0,
  runners: [],
  rivals: [],
  frames: [],
  results: [],
  activations: [],
  shortfalls: {},
  telemetry: []
};

interface CutsceneState {
  activation: SkillActivation;
  skill: SkillResponse;
  remaining: number;
}

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
  const [skills, setSkills] = useState<Map<string, SkillResponse>>(() => new Map());
  /** 3, 2, 1, "VAI!" (0), then -1 once the gates are open for good. Runs once per race. */
  const [countdown, setCountdown] = useState<CountdownStep | -1>(3);
  const [seals, setSeals] = useState<Seal[]>([]);
  const sealId = useRef(0);
  const [banner, setBanner] = useState<{ remaining: number } | null>(null);
  const [cutscene, setCutscene] = useState<CutsceneState | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  const style = (searchParams.get("style") ?? "pace") as RunningStyle;

  useEffect(() => {
    if (!horseId || !trackSlug) return;
    let cancelled = false;

    const start = async () => {
      try {
        // The catalogue says what each skill is; without it the race still runs, just
        // without the cutscene and the effect details.
        getSkills()
          .then((catalogue) => {
            if (!cancelled) setSkills(new Map(catalogue.map((skill) => [skill.slug, skill])));
          })
          .catch(() => undefined);
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
  const counting = Boolean(simulation) && !introducingRivals && !showResults && countdown > 0;
  const playback = useRacePlayback(simulation, {
    speed,
    // The countdown and the cutscene hold the race; "VAI!" (step 0) lets it go.
    playing: !introducingRivals && !showResults && !paused && countdown <= 0 && !cutscene
  });

  // --- the countdown: one number per beat, shorter at 4x ---------------------------
  const countdownBeat = speed >= 4 ? 250 : 600;
  useEffect(() => {
    if (!simulation || introducingRivals || showResults || countdown < 0) return;
    raceAudio.play(countdown === 0 ? "gatesOpen" : "countdownTick");
    const timer = window.setTimeout(
      () => setCountdown((step) => (step <= 0 ? -1 : ((step - 1) as CountdownStep))),
      countdownBeat
    );
    return () => window.clearTimeout(timer);
  }, [simulation, introducingRivals, showResults, countdown, countdownBeat]);

  const skipCountdown = useCallback(() => {
    setCountdown((step) => {
      if (step > 0) raceAudio.play("gatesOpen");
      return -1;
    });
  }, []);

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
        if (counting) skipCountdown();
        else togglePause();
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
  }, [
    simulation,
    showResults,
    introducingRivals,
    counting,
    skipCountdown,
    togglePause,
    stepForward,
    stepBack
  ]);

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
    return segmentAt(track, playback.positions[playerLane] ?? 0);
  }, [track, playback.positions, playerLane]);

  // --- effects: toasts, the banner and the cutscene come from one-off race events ----
  const colorOfRunner = useCallback(
    (runnerId: string) => {
      if (!simulation) return undefined;
      const lane = simulation.runners.findIndex((runner) => runner.id === runnerId);
      return lane >= 0 ? RIVAL_COLORS[lane % RIVAL_COLORS.length] : undefined;
    },
    [simulation]
  );

  const pushSeal = useCallback((seal: Omit<Seal, "id">) => {
    sealId.current += 1;
    const next = { ...seal, id: sealId.current };
    setSeals((waiting) => {
      let queue = waiting.filter((queued) => queued.at >= next.at - SEAL_TTL);
      const isRival = next.tone === "skill";
      if (queue.length >= SEAL_QUEUE) {
        // Full: make room by dropping the last waiting rival seal, or drop this rival one.
        const dropAt = queue.map((queued) => queued.tone).lastIndexOf("skill");
        if (dropAt < 1 || isRival) return queue;
        queue = [...queue.slice(0, dropAt), ...queue.slice(dropAt + 1)];
      }
      if (isRival) return [...queue, next];
      // Hers (and the start verdict) go ahead of the rivals still waiting.
      const at = queue.findIndex((queued, index) => index > 0 && queued.tone === "skill");
      return at < 0 ? [...queue, next] : [...queue.slice(0, at), next, ...queue.slice(at)];
    });
  }, []);

  const onRaceEvent = useCallback(
    (event: RaceEvent) => {
      if (!simulation) return;
      if (event.type === "skill") {
        const { activation, skill } = event.active;
        const isPlayer = activation.runnerId === "player";
        raceAudio.play("skillActivate");
        // Only her `unique` skills get the full-screen moment, and not when it would
        // hold up a fast replay or a player who asked for less motion.
        if (isPlayer && skill?.rarity === "unique" && speed < 4 && !reducedMotion) {
          raceAudio.play("cutscene");
          setCutscene({
            activation,
            skill,
            remaining:
              simulation.telemetry?.[activation.time]?.remaining ??
              simulation.distance - activation.distance
          });
          return;
        }
        pushSeal({
          tone: isPlayer ? "player" : "skill",
          color: isPlayer ? undefined : colorOfRunner(activation.runnerId),
          at: activation.time,
          lead: isPlayer ? "VOCÊ ativou" : `${activation.runnerName} ativou`,
          name: activation.skillName,
          detail: skillEffectText(skill)
        });
      } else if (event.type === "startVerdict") {
        pushSeal({
          tone: event.good ? "good" : "bad",
          at: 1,
          lead: event.good ? "BOA LARGADA!" : "LARGOU MAL",
          detail: `${ordinal(event.placement)} após o turno 1`
        });
      } else if (event.type === "finalStretch") {
        raceAudio.play("finalStretch");
        setBanner({ remaining: event.remaining });
      } else if (event.type === "finish") {
        raceAudio.play("finish");
      }
    },
    [simulation, speed, reducedMotion, pushSeal, colorOfRunner]
  );

  const effects = useRaceEffects({
    simulation: simulation ?? EMPTY_SIMULATION,
    time: playback.time,
    skills,
    maxStamina: hudScale?.maxStamina ?? 0,
    live: Boolean(simulation) && !introducingRivals && !showResults && countdown <= 0,
    onEvent: onRaceEvent
  });

  // One seal at a time; the banner and the cutscene go first, and a pause holds it.
  const holdSeals = Boolean(banner || cutscene) || paused;
  const currentSeal = seals[0];
  const staleSeal = currentSeal ? currentSeal.at < playback.time - SEAL_TTL : false;
  useEffect(() => {
    if (!currentSeal) return;
    if (staleSeal) {
      setSeals((queue) => queue.slice(1));
      return;
    }
    if (holdSeals) return;
    const timer = window.setTimeout(
      () => setSeals((queue) => queue.slice(1)),
      speed >= 4 ? 700 : 1300
    );
    return () => window.clearTimeout(timer);
  }, [currentSeal, staleSeal, holdSeals, speed]);

  // The banner waits for a cutscene to close, then crosses once.
  useEffect(() => {
    if (!banner || cutscene) return;
    const timer = window.setTimeout(() => setBanner(null), BANNER_MS);
    return () => window.clearTimeout(timer);
  }, [banner, cutscene]);

  // Skipping to the result drops whatever was still on screen.
  useEffect(() => {
    if (!showResults) return;
    setSeals([]);
    setBanner(null);
    setCutscene(null);
    setCountdown(-1);
  }, [showResults]);

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
  const lastTurn = Math.ceil(simulation.frames.at(-1)?.t ?? 1);

  const { playerSkill, boost, heal } = effects;
  const ovalBubble = heal
    ? { text: `+${Math.round(heal.gain * 100)}% FÔLEGO`, tone: "heal" as const }
    : playerSkill
      ? { text: `✦ ${playerSkill.activation.skillName}!`, tone: "skill" as const }
      : boost && boost.gain > 0
        ? { text: `▲ +${Math.round(boost.gain)} m/turno`, tone: "boost" as const }
        : undefined;
  const cutsceneSegment = cutscene ? segmentAt(track, cutscene.activation.distance) : null;

  return (
    <div
      className={[
        "RaceRunner",
        paused || cutscene ? "is-paused" : "",
        boost && !counting ? "has-boost" : ""
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <RaceHeader
        track={track}
        style={style}
        time={playback.time}
        lastTurn={lastTurn}
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
            fx={{
              highlights: [...effects.highlights.keys()].map((runnerId) => ({
                id: runnerId,
                color:
                  runnerId === "player" ? "var(--fx-skill)" : colorOfRunner(runnerId) ?? "var(--fx-skill)"
              })),
              dimOthers: Boolean(playerSkill),
              player: heal ? "heal" : boost ? "boost" : null,
              bubble: ovalBubble,
              gates: countdown > 0
            }}
          />
          {boost && !counting && <RaceFxOverlay paused={paused || Boolean(cutscene)} />}
          {counting || countdown === 0 ? (
            <RaceCountdown
              step={countdown as CountdownStep}
              beat={countdownBeat / 1000}
              onSkip={skipCountdown}
            />
          ) : (
            currentSeal &&
            !staleSeal &&
            !banner &&
            !cutscene && <RaceSeal key={currentSeal.id} seal={currentSeal} />
          )}
        </section>

        {banner && !cutscene && (
          <div className="RaceFinalBanner-slot">
            <RaceFinalBanner remaining={banner.remaining} />
          </div>
        )}

        <aside className="RaceRunner__side RaceRunner__side--left">
          {player && (
            <RaceCam
              title={playerSkill ? "✦ SKILL · VOCÊ" : "LIVE"}
              tone={playerSkill ? "skill" : "live"}
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
                    className={
                      [
                        activation.runnerId === "player" ? "is-player" : "",
                        playback.time - activation.time <= 1 ? "is-fresh" : ""
                      ]
                        .filter(Boolean)
                        .join(" ") || undefined
                    }
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
            fx={{
              boost: counting ? null : boost,
              heal,
              lowStamina: effects.lowStamina,
              speedTrend: effects.speedTrend,
              skillGlow: Boolean(playerSkill),
              notice: counting
                ? {
                    title: "Largada",
                    body: "Portões fechados: a corrida começa no VAI! (clique para pular)"
                  }
                : undefined
            }}
          />
        )}
        <TrackStrip
          segments={track.segments}
          progress={playerProgress}
          finalStretch={effects.finalStretch}
        />
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

      {cutscene && player && (
        <RaceCutscene
          activation={cutscene.activation}
          skill={cutscene.skill}
          horseName={player.name}
          context={[
            track.name,
            `turno ${cutscene.activation.time + 1} / ${lastTurn}`,
            cutsceneSegment?.label
          ]
            .filter(Boolean)
            .join(" · ")}
          remaining={cutscene.remaining}
          onClose={() => setCutscene(null)}
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
