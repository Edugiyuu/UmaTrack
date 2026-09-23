import { useMemo } from "react";
import type { TrackSegment } from "../../types/race";
import "./TrackProfile.css";

interface TrackProfileProps {
  segments: TrackSegment[];
  distance: number;
  /** 0..1 marker for where a runner currently is. */
  progress?: number;
  height?: number;
  showLabels?: boolean;
}

/**
 * Side view of the course. Elevation is integrated from each segment's grade, so a
 * climb on the catalogue really shows up as a hill here.
 */
const TrackProfile = ({
  segments,
  distance,
  progress,
  height = 64,
  showLabels = false
}: TrackProfileProps) => {
  const { points, areaPoints, climbs } = useMemo(() => {
    const width = 100;
    let x = 0;
    let elevation = 0;
    const raw: { x: number; y: number }[] = [{ x: 0, y: 0 }];
    const climbSpans: { x: number; width: number; grade: number }[] = [];

    for (const segment of segments) {
      const segmentLength = segment.lengthRatio * distance;
      elevation += (segment.grade / 100) * segmentLength;
      const nextX = x + segment.lengthRatio * width;
      if (segment.grade > 0.8) {
        climbSpans.push({ x, width: nextX - x, grade: segment.grade });
      }
      raw.push({ x: nextX, y: elevation });
      x = nextX;
    }

    const elevations = raw.map((point) => point.y);
    const min = Math.min(...elevations);
    const max = Math.max(...elevations);
    const range = Math.max(max - min, 1);

    // 6..30 keeps a flat course as a readable line instead of a wobble.
    const toY = (value: number) => 30 - ((value - min) / range) * 24;
    const scaled = raw.map((point) => ({ x: point.x, y: toY(point.y) }));

    return {
      points: scaled.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" "),
      areaPoints: `0,34 ${scaled
        .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
        .join(" ")} 100,34`,
      climbs: climbSpans
    };
  }, [segments, distance]);

  return (
    <div className="TrackProfile" style={{ height }}>
      <svg viewBox="0 0 100 34" preserveAspectRatio="none" role="img" aria-label="Perfil da pista">
        {climbs.map((climb, index) => (
          <rect
            key={`${climb.x}-${index}`}
            x={climb.x}
            y={0}
            width={climb.width}
            height={34}
            className="TrackProfile__climb"
            opacity={Math.min(0.55, 0.12 + climb.grade * 0.06)}
          />
        ))}
        <polygon points={areaPoints} className="TrackProfile__area" />
        <polyline points={points} className="TrackProfile__line" />
        {progress !== undefined && (
          <line
            x1={progress * 100}
            x2={progress * 100}
            y1={0}
            y2={34}
            className="TrackProfile__marker"
          />
        )}
      </svg>
      {showLabels && (
        <div className="TrackProfile__labels">
          {segments.map((segment, index) => (
            <span
              key={`${segment.label}-${index}`}
              style={{ width: `${segment.lengthRatio * 100}%` }}
              title={`${segment.label} · ${segment.grade > 0 ? "+" : ""}${segment.grade}%`}
            >
              {segment.grade > 0 ? "▲" : segment.grade < 0 ? "▼" : "—"}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrackProfile;
