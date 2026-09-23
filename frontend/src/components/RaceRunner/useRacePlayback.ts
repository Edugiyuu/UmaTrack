import { useEffect, useMemo, useRef, useState } from "react";
import type { RaceSimulation, SkillActivation } from "../../types/race";

export interface RacePlaybackState {
  /** Race time currently being shown, in seconds. */
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
}

const EMPTY: number[] = [];

/**
 * Plays a simulation back frame by frame. The replay is sampled every 0.5s of race
 * time, so positions are interpolated to keep the runners moving smoothly, and the
 * playback speed can be changed or skipped without touching the underlying data.
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

      setTime((current) => Math.min(duration, current + delta * speed));
      frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      lastTimestamp.current = null;
    };
  }, [simulation, playing, speed, duration]);

  return useMemo<RacePlaybackState>(() => {
    if (!simulation || !simulation.frames.length) {
      return { time: 0, positions: EMPTY, stamina: EMPTY, order: EMPTY, finished: false, activations: [] };
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

    return {
      time,
      positions,
      stamina,
      order,
      finished: time >= duration,
      activations: simulation.activations.filter((activation) => activation.time <= time)
    };
  }, [simulation, time, duration]);
};
