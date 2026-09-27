/**
 * Career calendars (docs/tasks/17-horse-career.md). Each horse girl runs her own list of
 * races, in order. Before each one she gets `turnsBefore` turns to train, rest or run
 * optional races; when the turns run out the career race is mandatory, and finishing
 * outside `goal` (a placement: 3 means top 3) ends her career.
 *
 * The calendars follow each girl's profile and were tuned with `npm run career:check`,
 * which plays every career with a simple training policy. Since the field got three
 * rivals built on the player's own stats (task 19) that policy clears almost none of
 * them; the goals were kept on purpose, so a career is hard but winnable with a plan.
 */
export interface CareerRaceSeed {
  trackSlug: string;
  /** Turns to prepare before this race. */
  turnsBefore: number;
  /** Worst placement that still keeps the career going. */
  goal: number;
}

export const CAREERS: Record<string, CareerRaceSeed[]> = {
  // Speed type who loves flat tracks: sprint and mile, a mile win, and a technical
  // 2200 m as the stretch.
  "Silence Suzuka": [
    { trackSlug: "sapporo-sprint", turnsBefore: 6, goal: 3 },
    { trackSlug: "niigata-mile", turnsBefore: 8, goal: 3 },
    { trackSlug: "hakodate-rolling", turnsBefore: 10, goal: 3 },
    { trackSlug: "niigata-mile", turnsBefore: 10, goal: 1 },
    { trackSlug: "kyoto-downhill", turnsBefore: 14, goal: 3 }
  ],
  // The long-distance girl: builds up to the 2400 m classic.
  "Special Week": [
    { trackSlug: "sapporo-sprint", turnsBefore: 6, goal: 5 },
    { trackSlug: "niigata-mile", turnsBefore: 8, goal: 3 },
    { trackSlug: "hakodate-rolling", turnsBefore: 10, goal: 3 },
    { trackSlug: "kyoto-downhill", turnsBefore: 16, goal: 5 },
    { trackSlug: "tokyo-classic", turnsBefore: 18, goal: 3 }
  ],
  // Power type: the rolling track twice, then the Kokura climb.
  "Oguri Cap": [
    { trackSlug: "sapporo-sprint", turnsBefore: 6, goal: 5 },
    { trackSlug: "hakodate-rolling", turnsBefore: 10, goal: 5 },
    { trackSlug: "hakodate-rolling", turnsBefore: 10, goal: 2 },
    { trackSlug: "kyoto-downhill", turnsBefore: 14, goal: 5 },
    { trackSlug: "kokura-climb", turnsBefore: 18, goal: 5 }
  ],
  // Balanced with a strong finish: mile to medium, ending in Tokyo.
  "Grass Wonder": [
    { trackSlug: "niigata-mile", turnsBefore: 6, goal: 5 },
    { trackSlug: "hakodate-rolling", turnsBefore: 12, goal: 5 },
    { trackSlug: "niigata-mile", turnsBefore: 8, goal: 1 },
    { trackSlug: "kyoto-downhill", turnsBefore: 14, goal: 5 },
    { trackSlug: "tokyo-classic", turnsBefore: 16, goal: 5 }
  ],
  // Bronze collector: generous goals, but every step of the ladder.
  "Nice Nature": [
    { trackSlug: "sapporo-sprint", turnsBefore: 6, goal: 5 },
    { trackSlug: "niigata-mile", turnsBefore: 8, goal: 5 },
    { trackSlug: "hakodate-rolling", turnsBefore: 10, goal: 3 },
    { trackSlug: "kyoto-downhill", turnsBefore: 16, goal: 5 },
    { trackSlug: "tokyo-classic", turnsBefore: 18, goal: 5 }
  ]
};

/** For a horse girl added to the shop before her calendar was written. */
export const DEFAULT_CAREER: CareerRaceSeed[] = [
  { trackSlug: "sapporo-sprint", turnsBefore: 6, goal: 5 },
  { trackSlug: "niigata-mile", turnsBefore: 8, goal: 3 },
  { trackSlug: "hakodate-rolling", turnsBefore: 8, goal: 3 },
  { trackSlug: "kyoto-downhill", turnsBefore: 10, goal: 3 }
];

export const careerFor = (name: string): CareerRaceSeed[] => CAREERS[name] ?? DEFAULT_CAREER;
