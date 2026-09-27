import { ordinal } from "./format";

export interface StandingsRunner {
  id: string;
  name: string;
  color: string;
  isPlayer: boolean;
  /** Metres covered. */
  position: number;
}

export interface RaceStandingsProps {
  /** Runners already sorted, leader first. */
  runners: StandingsRunner[];
}

/** Leaders always shown; the player is added below them when she is further back. */
const TOP = 5;

/**
 * Live standings, with each runner's gap to the leader in metres. A full field does
 * not fit the column, so it shows the leaders and pins the player's row under them.
 */
const RaceStandings = ({ runners }: RaceStandingsProps) => {
  const leader = runners[0]?.position ?? 0;
  const playerIndex = runners.findIndex((runner) => runner.isPlayer);
  const shown = runners
    .map((runner, index) => ({ runner, index }))
    .filter(({ index }) => index < TOP || index === playerIndex);
  const pinned = playerIndex >= TOP;

  return (
    <ol className="RaceStandings">
      {shown.map(({ runner, index }) => (
        <li
          key={runner.id}
          className={[
            runner.isPlayer ? "is-player" : "",
            pinned && runner.isPlayer ? "is-pinned" : ""
          ]
            .filter(Boolean)
            .join(" ") || undefined}
        >
          <span className="RaceStandings__place">{ordinal(index + 1)}</span>
          <span className="RaceStandings__dot" style={{ backgroundColor: runner.color }} aria-hidden="true" />
          <span className="RaceStandings__name">{runner.isPlayer ? `${runner.name} (você)` : runner.name}</span>
          <span className="RaceStandings__gap">
            {index === 0 ? "—" : `+${Math.round(leader - runner.position).toLocaleString("pt-BR")}m`}
          </span>
        </li>
      ))}
    </ol>
  );
};

export default RaceStandings;
