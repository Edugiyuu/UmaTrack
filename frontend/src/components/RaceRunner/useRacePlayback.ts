import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RaceSimulation, RunnerTelemetry, SkillActivation } from "../../types/race";

export interface RacePlaybackState {
  /** Race time currently being shown, in turns. */
  time: number;
  /** Metres covered by each runner, interpolated between replay frames. */
  positions: number[];
  /** Remaining stamina per runner, 0..1. */
  stamina: number[];
  /** Runner indexes sorted by how far along they are. */
  order: number[];
  finished: boolean;
  /** Skill activations that have already happened at `time`. */
  activations: SkillActivation[];
  /**
   * The player's telemetry for the turn being played, or her last turn once she has
   * crossed the line. Turn-level on purpose: the engine decides once per turn, so this
   * only changes identity when the turn does, and the HUD can memoise on it.
   */
  telemetry: RunnerTelemetry | null;
  /**
   * Jumps to a race time, in turns, clamped to the replay, and returns where it landed.
   * Stable across renders.
   */
  seek: (time: number) => number;
}

const EMPTY: number[] = [];

/**
 * Real seconds one turn lasts at 1x. The HUD changes once per turn, so this is how long
 * the player has to read it: at one second the race was over before anything sank in.
 */
export const SECONDS_PER_TURN = 2;

/**
 * Plays a simulation back frame by frame. At 1x one turn lasts SECONDS_PER_TURN; the replay
 * is sampled a few times per turn, so positions are interpolated to keep the runners
 * moving smoothly, and the playback speed can be changed or skipped without touching
 * the underlying data.
 */
export const useRacePlayback = (
  simulation: RaceSimulation | null,
  { speed = 1, playing = true }: { speed?: number; playing?: boolean } = {}
): RacePlaybackState => {
  const [time, setTime] = useState(0);
  const frameRef = useRef<number | null>(null);
  const lastTimestamp = useRef<number | null>(null);

  const duration = simulation?.frames.at(-1)?.t ?? 0;

  useEffect(() => {
    setTime(0);
    lastTimestamp.current = null;
  }, [simulation]);

  useEffect(() => {
    if (!simulation || !playing) return;

    const step = (timestamp: number) => {
      if (lastTimestamp.current === null) {
        lastTimestamp.current = timestamp;
      }
      const delta = (timestamp - lastTimestamp.current) / 1000;
      lastTimestamp.current = timestamp;

      setTime((current) => Math.min(duration, current + (delta * speed) / SECONDS_PER_TURN));
      frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      lastTimestamp.current = null;
    };
  }, [simulation, playing, speed, duration]);

  const seek = useCallback(
    (target: number) => {
      const clamped = Math.min(duration, Math.max(0, target));
      setTime(clamped);
      return clamped;
    },
    [duration]
  );

  return useMemo<RacePlaybackState>(() => {
    if (!simulation || !simulation.frames.length) {
      return {
        time: 0,
        positions: EMPTY,
        stamina: EMPTY,
        order: EMPTY,
        finished: false,
        activations: [],
        telemetry: null,
        seek
      };
    }

    const { frames } = simulation;
    let index = frames.findIndex((frame) => frame.t >= time);
    if (index === -1) index = frames.length - 1;

    const current = frames[index];
    const previous = frames[Math.max(0, index - 1)];
    const span = current.t - previous.t;
    const ratio = span > 0 ? Math.min(1, Math.max(0, (time - previous.t) / span)) : 1;

    const positions = current.positions.map(
      (position, lane) => previous.positions[lane] + (position - previous.positions[lane]) * ratio
    );
    const stamina = current.stamina.map(
      (value, lane) => previous.stamina[lane] + (value - previous.stamina[lane]) * ratio
    );

    const order = positions
      .map((position, lane) => ({ position, lane }))
      .sort((a, b) => b.position - a.position)
      .map((entry) => entry.lane);

    // Items are numbered from 1 in order, so the turn is also the index.
    const turns = simulation.telemetry ?? [];
    const turn = Math.max(1, Math.ceil(time));
    const telemetry = turns.length ? turns[Math.min(turn, turns.length) - 1] : null;

    return {
      time,
      positions,
      stamina,
      order,
      finished: time >= duration,
      activations: simulation.activations.filter((activation) => activation.time <= time),
      telemetry,
      seek
    };
  }, [simulation, time, duration, seek]);
};
