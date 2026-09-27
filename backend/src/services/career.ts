import type { Types } from "mongoose";
import { careerFor } from "../data/careers";
import { TRACK_CATALOG } from "../data/tracks";
import type { OwnedHorseDoc } from "./ownedHorse";

/**
 * Career rules (docs/tasks/17-horse-career.md). Each horse girl has a calendar of races;
 * `turnsLeft` counts down to the next one. At zero the career race is mandatory, and
 * missing its goal ends the career. A finished career (completed or failed) retires the
 * horse: she stays in the save as a record and can no longer train or race.
 */

const trackName = (slug: string) =>
  TRACK_CATALOG.find((track) => track.slug === slug)?.name ?? slug;

export interface CareerRaceView {
  index: number;
  trackSlug: string;
  trackName: string;
  turnsBefore: number;
  /** Worst placement that keeps the career going. */
  goal: number;
}

export const careerCalendar = (name: string): CareerRaceView[] =>
  careerFor(name).map((race, index) => ({ index, ...race, trackName: trackName(race.trackSlug) }));

export const isRetired = (ownedHorse: OwnedHorseDoc) => ownedHorse.career?.status !== "active";

/** The race her turns are counting down to, or null once the career is over. */
export const nextCareerRace = (ownedHorse: OwnedHorseDoc): CareerRaceView | null => {
  if (isRetired(ownedHorse)) return null;
  return careerCalendar(ownedHorse.name)[ownedHorse.career.raceIndex] ?? null;
};

/** At zero turns the only race she may run is the career one. */
export const isCareerRaceDue = (ownedHorse: OwnedHorseDoc) =>
  !isRetired(ownedHorse) && ownedHorse.turnsLeft <= 0;

export type CareerOutcome =
  | { kind: "passed"; goal: number; placement: number; next: CareerRaceView }
  | { kind: "completed"; goal: number; placement: number }
  | { kind: "failed"; goal: number; placement: number };

/**
 * Records a career race and moves the calendar on: the next race and its turns when
 * she met the goal, retirement when she did not or when it was the last one.
 */
export const applyCareerResult = (
  ownedHorse: OwnedHorseDoc,
  placement: number,
  fieldSize: number
): CareerOutcome => {
  const calendar = careerCalendar(ownedHorse.name);
  const race = calendar[ownedHorse.career.raceIndex];
  const passed = placement <= race.goal;

  ownedHorse.career.results.push({
    raceIndex: race.index,
    trackSlug: race.trackSlug,
    trackName: race.trackName,
    goal: race.goal,
    placement,
    fieldSize,
    passed,
    ranAt: new Date()
  });

  if (!passed) {
    ownedHorse.career.status = "failed";
    ownedHorse.career.endedAt = new Date();
    return { kind: "failed", goal: race.goal, placement };
  }

  const next = calendar[race.index + 1];
  if (!next) {
    ownedHorse.career.status = "completed";
    ownedHorse.career.endedAt = new Date();
    return { kind: "completed", goal: race.goal, placement };
  }

  ownedHorse.career.raceIndex = next.index;
  ownedHorse.turnsLeft = next.turnsBefore;
  return { kind: "passed", goal: race.goal, placement, next };
};

/** The catalogue fields a new copy is built from (a document or a lean one). */
interface CatalogHorseFields {
  _id: Types.ObjectId;
  name: string;
  passiveBuff?: string | null;
  stamina: number;
  power: number;
  speed: number;
  wit: number;
  cost: number;
}

/** A horse girl at her catalogue stats, at the start of her career. */
export const freshOwnedHorse = (catalogHorse: CatalogHorseFields) => ({
  sourceHorseId: catalogHorse._id,
  name: catalogHorse.name,
  passiveBuff: catalogHorse.passiveBuff,
  stamina: catalogHorse.stamina,
  power: catalogHorse.power,
  speed: catalogHorse.speed,
  wit: catalogHorse.wit,
  cost: catalogHorse.cost,
  turnsLeft: careerFor(catalogHorse.name)[0].turnsBefore
});

/** What the frontend needs to draw the career: status, calendar, results, next race. */
export const careerView = (ownedHorse: OwnedHorseDoc) => {
  const career = ownedHorse.career;
  return {
    status: career.status,
    raceIndex: career.raceIndex,
    races: careerCalendar(ownedHorse.name),
    results: career.results.map((result) => ({
      raceIndex: result.raceIndex,
      trackSlug: result.trackSlug,
      trackName: result.trackName,
      goal: result.goal,
      placement: result.placement,
      fieldSize: result.fieldSize,
      passed: result.passed,
      ranAt: result.ranAt
    })),
    endedAt: career.endedAt ?? null,
    nextRace: nextCareerRace(ownedHorse),
    raceDue: isCareerRaceDue(ownedHorse)
  };
};
