import { memo } from "react";
import { ordinal } from "./format";

export interface OvalRunner {
  id: string;
  color: string;
  isPlayer: boolean;
  /** 0..1 along the race. */
  progress: number;
  /** Lane in the field, used to spread the dots across the track. */
  lane: number;
}

export interface RaceOvalProps {
  runners: OvalRunner[];
  playerPlacement: number;
  /** Metres the player has covered, and the race distance. */
  covered: number;
  distance: number;
  /** Label of the stretch she is on, e.g. "Reta oposta". */
  segmentLabel?: string;
}

/* The oval is a stadium: two straights of 2·HALF joined by two half circles, drawn in a
   fixed viewBox and scaled by CSS. Radii are measured from each bend's centre. */
const WIDTH = 860;
const HEIGHT = 470;
const CX = WIDTH / 2;
const CY = 244;
const HALF = 220;
const BAND_INNER = 110;
const BAND_OUTER = 190;
const BAND_MID = (BAND_INNER + BAND_OUTER) / 2;
/** Three running lines, so thirteen dots do not collapse into one. */
const LANE_RADII = [128, 150, 172];
/** Start and finish share a post on the home (bottom) straight. */
const FINISH_X = CX + 120;

const stadium = (radius: number) =>
  `M ${CX - HALF} ${CY - radius} H ${CX + HALF} ` +
  `A ${radius} ${radius} 0 0 1 ${CX + HALF} ${CY + radius} H ${CX - HALF} ` +
  `A ${radius} ${radius} 0 0 1 ${CX - HALF} ${CY - radius} Z`;

/**
 * The point `progress` of the way round, on a line of the given radius. One lap is the
 * whole race whatever its distance: from the post, left along the home straight, round
 * the far bend, along the back straight and home.
 */
const pointOnLap = (progress: number, radius: number) => {
  const toBend = FINISH_X - (CX - HALF);
  const bend = Math.PI * radius;
  const straight = 2 * HALF;
  const lap = 2 * straight + 2 * bend;
  let s = Math.min(1, Math.max(0, progress)) * lap;

  if (s <= toBend) return { x: FINISH_X - s, y: CY + radius };
  s -= toBend;
  if (s <= bend) {
    const angle = Math.PI / 2 + s / radius;
    return { x: CX - HALF + radius * Math.cos(angle), y: CY + radius * Math.sin(angle) };
  }
  s -= bend;
  if (s <= straight) return { x: CX - HALF + s, y: CY - radius };
  s -= straight;
  if (s <= bend) {
    const angle = -Math.PI / 2 + s / radius;
    return { x: CX + HALF + radius * Math.cos(angle), y: CY + radius * Math.sin(angle) };
  }
  s -= bend;
  return { x: CX + HALF - s, y: CY + radius };
};

const metres = (value: number) => `${Math.round(value).toLocaleString("pt-BR")}m`;

/**
 * The race seen from above. Re-rendered on every animation frame, so it stays a pure
 * function of its props; the rivals are drawn first and the player last, on top.
 */
const RaceOval = ({ runners, playerPlacement, covered, distance, segmentLabel }: RaceOvalProps) => {
  const ordered = [...runners].sort((a, b) => Number(a.isPlayer) - Number(b.isPlayer));
  const player = runners.find((runner) => runner.isPlayer);
  const playerPoint = player
    ? pointOnLap(player.progress, LANE_RADII[player.lane % LANE_RADII.length])
    : null;
  const share = distance > 0 ? Math.min(1, covered / distance) : 0;
  const bubble = `VOCÊ · ${ordinal(playerPlacement)}`;
  const bubbleWidth = bubble.length * 8.4 + 22;

  return (
    <svg
      className="RaceOval"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`Pista vista de cima. Você está em ${ordinal(playerPlacement)}, com ${metres(covered)} de ${metres(distance)}.`}
    >
      <defs>
        <pattern id="RaceOval-mow" width="96" height="10" patternUnits="userSpaceOnUse">
          <rect width="48" height="10" className="RaceOval__mow" />
        </pattern>
        <pattern id="RaceOval-finish" width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" className="RaceOval__finish-light" />
          <rect width="6" height="6" className="RaceOval__finish-dark" />
          <rect x="6" y="6" width="6" height="6" className="RaceOval__finish-dark" />
        </pattern>
      </defs>

      <path d={stadium(BAND_MID)} className="RaceOval__shadow" strokeWidth={BAND_OUTER - BAND_INNER} />
      <path d={stadium(BAND_MID)} className="RaceOval__band" strokeWidth={BAND_OUTER - BAND_INNER} />
      <path d={stadium(139)} className="RaceOval__lane-line" />
      <path d={stadium(161)} className="RaceOval__lane-line" />
      <path d={stadium(BAND_INNER - 2)} className="RaceOval__infield" />
      <path d={stadium(BAND_INNER - 2)} fill="url(#RaceOval-mow)" />
      <path d={stadium(BAND_INNER)} className="RaceOval__rail" />

      <rect
        x={FINISH_X - 6}
        y={CY + BAND_INNER}
        width={12}
        height={BAND_OUTER - BAND_INNER}
        fill="url(#RaceOval-finish)"
      />
      <text x={FINISH_X} y={CY + BAND_OUTER + 20} className="RaceOval__finish-label">
        META
      </text>

      <g className="RaceOval__readout">
        <text x={CX} y={CY - 44} className="RaceOval__kicker">
          DISTÂNCIA
        </text>
        <text x={CX} y={CY + 6} className="RaceOval__distance">
          {metres(covered)}
          <tspan className="RaceOval__distance-total"> / {metres(distance)}</tspan>
        </text>
        <rect x={CX - 130} y={CY + 22} width={260} height={10} rx={5} className="RaceOval__progress-track" />
        <rect x={CX - 130} y={CY + 22} width={260 * share} height={10} rx={5} className="RaceOval__progress-fill" />
        <text x={CX} y={CY + 56} className="RaceOval__segment">
          {segmentLabel ? `${segmentLabel} · ` : ""}faltam {metres(Math.max(0, distance - covered))}
        </text>
      </g>

      {ordered.map((runner) => {
        const { x, y } = pointOnLap(runner.progress, LANE_RADII[runner.lane % LANE_RADII.length]);
        return runner.isPlayer ? (
          <g key={runner.id} className="RaceOval__player">
            <circle cx={x} cy={y} r={24} className="RaceOval__halo" />
            <circle cx={x} cy={y} r={16} fill={runner.color} className="RaceOval__dot" />
          </g>
        ) : (
          <circle key={runner.id} cx={x} cy={y} r={11} fill={runner.color} className="RaceOval__dot" />
        );
      })}

      {playerPoint && (
        <g className="RaceOval__bubble" transform={`translate(${playerPoint.x} ${playerPoint.y - 40})`}>
          <rect x={-bubbleWidth / 2} y={-13} width={bubbleWidth} height={26} rx={13} />
          <text y={5}>{bubble}</text>
        </g>
      )}
    </svg>
  );
};

export default memo(RaceOval);
