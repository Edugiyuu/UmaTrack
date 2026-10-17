import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import type { Note } from "./fieldModel";

export interface RaceNotebookProps {
  notes: Note[];
  /** The circled line at the bottom: will it work out? */
  verdict: string;
}

/**
 * The trainer's notebook (Race v3): what she would jot down watching from the stands,
 * read straight from the replay. The verdict is circled; a new one is drawn in.
 */
const RaceNotebook = ({ notes, verdict }: RaceNotebookProps) => {
  const circleRef = useRef<HTMLParagraphElement>(null);
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    if (reduced || !circleRef.current) return;
    const tween = gsap.from(circleRef.current, { scale: 0.92, opacity: 0, duration: 0.3, ease: "power2.out" });
    return () => {
      tween.revert();
    };
  }, [verdict, reduced]);

  return (
    <section className="RaceNotebook" aria-labelledby="race-notebook-title">
      <h2 id="race-notebook-title" className="RaceNotebook__title">
        Caderno da treinadora
      </h2>
      <ul className="RaceNotebook__notes">
        {notes.map((note) => (
          <li key={`${note.tone}-${note.title}`} className={`RaceNotebook__note is-${note.tone}`}>
            <strong>{note.title}</strong>
            <span>{note.detail}</span>
          </li>
        ))}
      </ul>
      {verdict && (
        <p ref={circleRef} className="RaceNotebook__verdict">
          {verdict}
        </p>
      )}
    </section>
  );
};

export default RaceNotebook;
