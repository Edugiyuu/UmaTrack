import type { CourseStop } from "./fieldModel";

export interface RaceCourseProps {
  stops: CourseStop[];
  /** Metres she has covered. */
  covered: number;
  distance: number;
}

/**
 * The course as a checklist (Race v3): the stretches behind her ticked off, the one
 * she is on highlighted, and the finish at the bottom.
 */
const RaceCourse = ({ stops, covered, distance }: RaceCourseProps) => {
  const arrived = covered >= distance;
  const current = arrived ? -1 : stops.findIndex((stop) => covered < stop.end);

  return (
    <section className="RaceCourse" aria-labelledby="race-course-title">
      <h2 id="race-course-title" className="RaceCourse__title">
        Percurso
      </h2>
      <ol className="RaceCourse__list">
        {stops.map((stop, index) => {
          const state = arrived || index < current ? "done" : index === current ? "current" : "next";
          return (
            <li
              key={`${stop.label}-${index}`}
              className={`RaceCourse__stop is-${state}${stop.grade > 0 ? " is-uphill" : ""}`}
              aria-current={state === "current" ? "step" : undefined}
            >
              <span className="RaceCourse__dot" aria-hidden="true" />
              <span className="RaceCourse__label">
                {stop.label}
                {stop.grade > 0 && ` ▲ ${stop.grade}%`}
                {stop.grade < 0 && ` ▼ ${Math.abs(stop.grade)}%`}
                {state === "current" && <em> · ela está aqui</em>}
              </span>
              <span className="RaceCourse__metres">{stop.end.toLocaleString("pt-BR")} m</span>
            </li>
          );
        })}
        <li className={`RaceCourse__stop RaceCourse__stop--finish${arrived ? " is-current" : ""}`}>
          <span className="RaceCourse__dot" aria-hidden="true">{arrived ? "★" : ""}</span>
          <span className="RaceCourse__label">{arrived ? "META · chegou!" : "META"}</span>
          <span className="RaceCourse__metres">{distance.toLocaleString("pt-BR")} m</span>
        </li>
      </ol>
    </section>
  );
};

export default RaceCourse;
