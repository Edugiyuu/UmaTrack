/**
 * Letter grades for the training screen (docs/tasks/15-ui-v2-train-race.md).
 *
 * Display only: the engine never reads a grade. The steps are calibrated on the track
 * requirements — Sapporo, the easiest, asks for 30–60; Kokura, the hardest, up to 175 —
 * so a fresh horse sits around E/D and a horse ready for every track reaches B/A.
 */
const RANKS: { letter: string; from: number }[] = [
  { letter: "G", from: 0 },
  { letter: "F", from: 40 },
  { letter: "E", from: 60 },
  { letter: "D", from: 80 },
  { letter: "C", from: 100 },
  { letter: "B", from: 125 },
  { letter: "A", from: 150 },
  { letter: "S", from: 180 }
];

export interface StatRank {
  letter: string;
  /** 0..1 from this grade's threshold to the next one; 1 at the top grade. */
  progress: number;
  /** Points still missing for the next grade, or null at the top grade. */
  toNext: number | null;
}

export const statRank = (value: number): StatRank => {
  let index = 0;
  while (index + 1 < RANKS.length && value >= RANKS[index + 1].from) index += 1;

  const current = RANKS[index];
  const next = RANKS[index + 1];
  if (!next) return { letter: current.letter, progress: 1, toNext: null };

  return {
    letter: current.letter,
    progress: (value - current.from) / (next.from - current.from),
    toNext: Math.ceil(next.from - value)
  };
};
