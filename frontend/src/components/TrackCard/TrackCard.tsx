import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { CATEGORY_LABEL, STAT_LABEL, SURFACE_LABEL, trackImage } from "../../constants/trackVisuals";
import type { StatName, TrackResponse } from "../../types/race";
import type { HorseResponseProfile } from "../../types/horse";
import "./TrackCard.css";

const STATS: StatName[] = ["speed", "stamina", "power", "wit"];

export interface TrackRequirementCheck {
  stat: StatName;
  required: number;
  current: number;
  met: boolean;
}

export const checkRequirements = (
  track: TrackResponse,
  horse: HorseResponseProfile
): TrackRequirementCheck[] =>
  STATS.map((stat) => ({
    stat,
    required: track.requirements[stat],
    current: horse[stat],
    met: horse[stat] >= track.requirements[stat]
  }));

interface TrackCardProps {
  track: TrackResponse;
  horse: HorseResponseProfile;
  selected: boolean;
  /** The career race has no entry fee. */
  free?: boolean;
  onSelect: () => void;
}

/**
 * A track on the track screen, v2 (docs/tasks/27, Figma "ChooseTrackScreen v2"): the
 * picture with whether she is ready and how hard it is, then name, distance, prize and
 * fee. The description and the stat checks moved to the tooltip.
 */
const TrackCard = ({ track, horse, selected, free = false, onSelect }: TrackCardProps) => {
  const checks = checkRequirements(track, horse);
  const unmet = checks.filter((check) => !check.met);
  const art = trackImage(track.image);
  const fee = free ? "Sem inscrição" : track.entryFee > 0 ? `Inscrição ${track.entryFee}` : "Grátis";
  const tooltip = [
    track.description,
    `Recomendado: ${checks.map((check) => `${STAT_LABEL[check.stat]} ${check.current}/${check.required}`).join(" · ")}`
  ].join("\n");

  // Picking a card: it grows a little and the green frame fades in.
  const cardRef = useRef<HTMLButtonElement>(null);
  const ringRef = useRef<HTMLSpanElement>(null);
  const placed = useRef(false);
  const reduced = usePrefersReducedMotion();
  useLayoutEffect(() => {
    const card = cardRef.current;
    const ring = ringRef.current;
    if (!card || !ring) return;
    const scale = selected ? 1.035 : 1;
    const opacity = selected ? 1 : 0;
    if (reduced || !placed.current) {
      placed.current = true;
      gsap.set(card, { scale });
      gsap.set(ring, { opacity });
      return;
    }
    const tweens = [
      gsap.to(card, { scale, duration: 0.3, ease: selected ? "back.out(2)" : "power2.out" }),
      gsap.to(ring, { opacity, duration: 0.25, ease: "power1.out" })
    ];
    return () => tweens.forEach((tween) => tween.kill());
  }, [selected, reduced]);

  return (
    <button
      ref={cardRef}
      type="button"
      className={`TrackCard${selected ? " is-selected" : ""}`}
      onClick={onSelect}
      aria-pressed={selected}
      title={tooltip}
    >
      <span className="TrackCard__face">
        <span ref={ringRef} className="TrackCard__ring" aria-hidden="true" />
        <span className="TrackCard__thumb">
          {art ? <img src={art} alt="" /> : <span className="TrackCard__thumb-empty" />}
          <span className={`TrackCard__chip ${unmet.length ? "is-below" : "is-ready"}`}>
            {unmet.length ? "! Abaixo" : "✓ Pronta"}
          </span>
          <span className="TrackCard__chip TrackCard__chip--difficulty">Dif. {track.difficulty}</span>
        </span>
        <span className="TrackCard__body">
          <strong className="TrackCard__name">{track.name}</strong>
          <span className="TrackCard__meta">
            {track.distance} m · {CATEGORY_LABEL[track.category]} · {SURFACE_LABEL[track.surface]}
          </span>
          <span className="TrackCard__footer">
            <span className="TrackCard__prize">🏆 {track.prizeMoney[0]?.toLocaleString("pt-BR")}</span>
            <span className="TrackCard__fee">{fee}</span>
          </span>
        </span>
      </span>
    </button>
  );
};

export default TrackCard;
