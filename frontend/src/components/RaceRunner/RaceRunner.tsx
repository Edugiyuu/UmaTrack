import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import confetti from "canvas-confetti";
import Button from "../ui/Button/Button";
import { usePageReveal, useTransitionNavigate } from "../PageTransition/PageTransition";
import RaceCountdown, { type CountdownStep } from "./RaceCountdown";
import RaceCourse from "./RaceCourse";
import RaceCutscene from "./RaceCutscene";
import RaceDrone from "./RaceDrone";
import RaceField from "./RaceField";
import RaceFxOverlay from "./RaceFxOverlay";
import RaceMoment, { BANNER_MS, type RaceMomentProps, type Seal } from "./RaceMoment";
import RaceNotebook from "./RaceNotebook";
import RaceResults from "./RaceResults";
import RaceRivals from "./RaceRivals";
import RaceTensionBar from "./RaceTensionBar";
import { currentTurn, ordinal } from "./format";
import {
  buildField,
  courseStops,
  notebookNotes,
  projectPass,
  sampleFrames,
  tensionAt
} from "./fieldModel";
import { useRacePlayback } from "./useRacePlayback";
import { skillEffectText, useRaceEffects, type RaceEvent } from "./useRaceEffects";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { getSkills, getTracks, runRace, type RunRaceResponse } from "../../services/Race";
import { raceAudio } from "../../services/raceAudio";
import { horseColors } from "../../constants/horseColors";
import { RUNNING_STYLE_LABEL } from "../../constants/trackVisuals";
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
/** The projection is only worth showing in the last part of the race. */
const PROJECTION_FROM = 0.6;

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

const metres = (value: number) => `${Math.max(0, Math.round(value)).toLocaleString("pt-BR")} m`;

/**
 * The race screen, v3 (docs/tasks/32-race-v3.md, Figma "Race v3 · G1–G4"): the field
 * down the left, the drone view in the middle, the distance, the trainer's notebook and
 * the course on the right, and the tension line with the replay controls at the bottom.
 */
const RaceRunner = () => {
  const { horseId, trackSlug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const go = useTransitionNavigate();

  const [track, setTrack] = useState<TrackResponse | null>(null);
  const [race, setRace] = useState<RunRaceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [speed, setSpeed] = useState<number>(1);
  const [showResults, setShowResults] = useState(false);
  const [paused, setPaused] = useState(false);
  /** Held until the player has seen her rivals and sent the field off. */
  const [started, setStarted] = useState(false);
  const [skills, setSkills] = useState<Map<string, SkillResponse>>(() => new Map());
  /** 3, 2, 1, "VAI!" (0), then -1 once the gates are open for good. Runs once per race. */
  const [countdown, setCountdown] = useState<CountdownStep | -1>(3);
  const [seals, setSeals] = useState<Seal[]>([]);
  const sealId = useRef(0);
  const [banner, setBanner] = useState<{ remaining: number } | null>(null);
  const [cutscene, setCutscene] = useState<CutsceneState | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  const style = (searchParams.get("style") ?? "pace") as RunningStyle;
  // The page curtain from the track screen lifts once the race is in (or failed).
  usePageReveal(race !== null || error !== null);

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
   * Moves to the end of the turn after (or before) the one on the clock, where the
   * screen shows everything that turn decided. The ref moves with it, so several presses
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

  /** Stamina she left the gates with (turn 1's leftover plus its cost): the effects' scale. */
  const maxStamina = useMemo(() => {
    const first = simulation?.telemetry?.[0];
    return first ? first.stamina + first.staminaCost : 0;
  }, [simulation]);

  const colorOf = useCallback(
    (lane: number) => {
      const runner = simulation?.runners[lane];
      if (!runner) return "var(--brand-turf)";
      return runner.isPlayer
        ? horseColors[runner.name] ?? "var(--brand-turf)"
        : RIVAL_COLORS[lane % RIVAL_COLORS.length];
    },
    [simulation]
  );

  const colorOfRunner = useCallback(
    (runnerId: string) => {
      if (!simulation) return undefined;
      const lane = simulation.runners.findIndex((runner) => runner.id === runnerId);
      return lane >= 0 ? colorOf(lane) : undefined;
    },
    [simulation, colorOf]
  );

  const playerResult = simulation?.results.find((result) => result.isPlayer) ?? null;
  /** She has crossed the line: the screen turns into the finish (G4). */
  const arrived = Boolean(playerResult) && playback.time >= (playerResult?.finishTime ?? Infinity);

  useEffect(() => {
    if (!playback.finished || !race || showResults) return;
    setShowResults(true);
    if (race.rewards.placement === 1) {
      confetti({ particleCount: 320, spread: 200, origin: { y: 0.6 }, zIndex: 9999, scalar: 1.5 });
    }
  }, [playback.finished, race, showResults]);

  // --- effects: moments and the cutscene come from one-off race events --------------
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
    maxStamina,
    live: Boolean(simulation) && !introducingRivals && !showResults && countdown <= 0,
    onEvent: onRaceEvent
  });

  // One seal at a time; the final stretch and the cutscene go first, and a pause holds it.
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

  // The final stretch waits for a cutscene to close, then shows once.
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

  // --- the field at this instant ------------------------------------------------------
  const field = useMemo(
    () =>
      simulation
        ? buildField({
            simulation,
            time: playback.time,
            colorOf,
            skills,
            playerSkills: race?.horse.skills ?? []
          })
        : [],
    [simulation, playback.time, colorOf, skills, race]
  );

  const stops = useMemo(() => (track ? courseStops(track) : []), [track]);

  /** How far ahead of the next runner she won by, or how far behind the winner she was. */
  const finishGap = useMemo(() => {
    if (!simulation || !playerResult) return 0;
    const placeLane = (placement: number) =>
      simulation.runners.findIndex(
        (runner) => runner.id === simulation.results.find((result) => result.placement === placement)?.id
      );
    if (playerResult.placement === 1) {
      const second = placeLane(2);
      if (second < 0) return 0;
      const at = sampleFrames(simulation.frames, playerResult.finishTime);
      return simulation.distance - (at.positions[second] ?? 0);
    }
    const winner = simulation.results.find((result) => result.placement === 1);
    if (!winner) return 0;
    const at = sampleFrames(simulation.frames, winner.finishTime);
    return simulation.distance - (at.positions[playerLane] ?? 0);
  }, [simulation, playerResult, playerLane]);

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

  if (!race || !simulation || !track || !playerResult) {
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

  const player = field.find((runner) => runner.isPlayer) ?? null;
  const playerCovered = player?.position ?? 0;
  const remaining = simulation.distance - playerCovered;
  const lastTurn = Math.ceil(simulation.frames.at(-1)?.t ?? 1);
  const turn = currentTurn(playback.time, lastTurn);
  const segment = segmentAt(track, playerCovered);
  const telemetry = playback.telemetry;

  const projection =
    !arrived && playerCovered >= simulation.distance * PROJECTION_FROM
      ? projectPass(field, simulation.distance, playback.time)
      : null;
  const notebook = notebookNotes({
    field,
    track,
    time: countdown > 0 ? 0 : playback.time,
    telemetry,
    projection,
    skills,
    arrived,
    finishGap
  });
  const tension = tensionAt(field, telemetry, arrived);
  const turnsLeft = telemetry
    ? Math.max(1, Math.ceil(telemetry.remaining / Math.max(1, telemetry.runSpeed)))
    : 0;

  // --- the moment over the drone view -------------------------------------------------
  let moment: RaceMomentProps | null = null;
  if (arrived) {
    moment =
      playerResult.placement === 1
        ? {
            kind: "win",
            title: "VITÓRIA!",
            detail: finishGap < 1.5 ? "por um focinho · photo finish" : `por ${metres(finishGap)}`
          }
        : {
            kind: "placed",
            title: `${ordinal(playerResult.placement)} LUGAR`,
            detail: `a ${metres(finishGap)} da vencedora`
          };
  } else if (!counting && countdown !== 0 && !cutscene) {
    if (banner) {
      moment = {
        kind: "final",
        title: "RETA FINAL",
        detail: `faltam ${metres(banner.remaining)} · uns ${turnsLeft} turnos`
      };
    } else if (currentSeal && !staleSeal) {
      if (currentSeal.tone === "player") {
        moment = {
          kind: "skill",
          kicker: `✦ SKILL ATIVOU · TURNO ${currentSeal.at + 1}`,
          title: currentSeal.name ?? "",
          detail: currentSeal.detail
        };
      } else if (currentSeal.tone === "skill") {
        moment = {
          kind: "rival",
          kicker: currentSeal.lead,
          title: `✦ ${currentSeal.name ?? ""}`,
          detail: currentSeal.detail,
          color: currentSeal.color
        };
      } else {
        moment = { kind: currentSeal.tone, title: currentSeal.lead, detail: currentSeal.detail };
      }
    } else if (playback.time < 1.2) {
      moment = { kind: "start", title: "LARGADA!", detail: "todas saem com o fôlego cheio" };
    }
  }

  const momentLabel = arrived ? "CHEGADA" : countdown > 0 || playback.time < 1 ? "LARGADA" : segment?.label;
  const { boost } = effects;

  return (
    <div
      className={["RaceRunner", paused || cutscene ? "is-paused" : "", boost && !counting ? "has-boost" : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <aside className="RaceRunner__left">
        <RaceField field={field} arrived={arrived} />
      </aside>

      <section className="RaceRunner__course" aria-label="Corrida em andamento">
        <RaceDrone
          field={field}
          distance={simulation.distance}
          gatesShut={countdown > 0}
          projection={projection}
          grade={segment?.grade ?? 0}
        >
          {moment && <RaceMoment key={`${moment.kind}-${moment.title}`} {...moment} />}
        </RaceDrone>
        {boost && !counting && !arrived && <RaceFxOverlay paused={paused || Boolean(cutscene)} />}
        {(counting || countdown === 0) && (
          <RaceCountdown step={countdown as CountdownStep} beat={countdownBeat / 1000} onSkip={skipCountdown} />
        )}
      </section>

      <aside className="RaceRunner__right">
        <section className={`RaceRunner__distance${arrived && playerResult.placement === 1 ? " is-win" : ""}`} aria-label="Distância">
          <p className="RaceRunner__distance-label">
            {track.name} · {momentLabel}
          </p>
          <p className="RaceRunner__distance-value">
            {arrived ? `${ordinal(playerResult.placement)} lugar` : metres(remaining)}
          </p>
          <p className="RaceRunner__distance-sub">
            {arrived
              ? `turno ${turn} de ${lastTurn} · ${RUNNING_STYLE_LABEL[style]}`
              : `turno ${turn} de ${lastTurn} · ${playback.time < 1 ? "distância total" : "faltam"}`}
          </p>
        </section>
        <RaceNotebook notes={notebook.notes} verdict={notebook.verdict} />
        <RaceCourse stops={stops} covered={playerCovered} distance={simulation.distance} />
      </aside>

      <RaceTensionBar
        level={tension}
        turn={turn}
        lastTurn={lastTurn}
        time={playback.time}
        speed={speed}
        speeds={PLAYBACK_SPEEDS}
        onSpeedChange={setSpeed}
        paused={paused}
        onTogglePause={togglePause}
        onStepBack={stepBack}
        onStepForward={stepForward}
        arrived={arrived}
        onSkip={() => setShowResults(true)}
      />

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
            segmentAt(track, cutscene.activation.distance)?.label
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
          onAnotherTrack={() => go(`/Race/${horseId}`, { color: horseColors[race.horse.name] })}
          onBackToTraining={() =>
            go(`/HorseSelector/Career/${horseId}`, { color: horseColors[race.horse.name] })
          }
        />
      )}
    </div>
  );
};

export default RaceRunner;
