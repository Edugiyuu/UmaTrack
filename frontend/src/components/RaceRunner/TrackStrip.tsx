import type { TrackSegment } from "../../types/race";

export interface TrackStripProps {
  segments: TrackSegment[];
  /** 0..1, where the player is. */
  progress: number;
}

const segmentKind = (segment: TrackSegment) => {
  if (segment.grade > 0) return "uphill";
  if (segment.grade < 0) return "downhill";
  if (segment.curve >= 0.4) return "curve";
  return "straight";
};

const segmentText = (segment: TrackSegment) => {
  if (segment.grade > 0) return `▲ ${segment.label} ${segment.grade}%`;
  if (segment.grade < 0) return `▼ ${segment.label} ${Math.abs(segment.grade)}%`;
  return segment.label;
};

/** The track as a strip of its stretches, with a marker where the player is. */
const TrackStrip = ({ segments, progress }: TrackStripProps) => (
  <div className="TrackStrip" aria-label="Trechos da pista">
    {segments.map((segment, index) => (
      <span
        key={`${segment.label}-${index}`}
        className={`TrackStrip__segment TrackStrip__segment--${segmentKind(segment)}`}
        style={{ flexGrow: segment.lengthRatio }}
        title={segmentText(segment)}
      >
        {segmentText(segment)}
      </span>
    ))}
    <span
      className="TrackStrip__marker"
      style={{ left: `${Math.min(100, Math.max(0, progress * 100))}%` }}
      aria-hidden="true"
    >
      VOCÊ
    </span>
  </div>
);

export default TrackStrip;
