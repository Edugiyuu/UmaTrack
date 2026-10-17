import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { gsap } from "gsap";
import RunnerAvatar from "./RunnerAvatar";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import type { FieldRunner, Projection } from "./fieldModel";

/** The drone never zooms in closer than this many metres of track. */
const MIN_WINDOW = 120;
/** Room left behind the last runner and ahead of the first, as a share of the field's spread. */
const PAD_BEHIND = 0.08;
const PAD_AHEAD = 0.2;
/** Length on the track of one turf stripe and its gap, and of one lane dash and its gap. */
const STRIPE_METRES = 20;
const DASH_METRES = 6;
/** A distance post every this many metres, counting down to the line. */
const POST_EVERY = 100;
/** The band's top and bottom, as a share of the card's height. */
const BAND_TOP = 26;
const BAND_BOTTOM = 76;

export interface RaceDroneProps {
  field: FieldRunner[];
  distance: number;
  /** Shut gates in front of the field, before "VAI!". */
  gatesShut: boolean;
  projection: Projection | null;
  /** The track ahead of her climbs or falls, in percent. */
  grade: number;
  /** The moment on screen (countdown, skill, final stretch, finish), over the top of the view. */
  children?: ReactNode;
}

/** The burst behind a runner whose skill fires this turn; pulses with GSAP. */
const SkillBurst = () => {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();
  useLayoutEffect(() => {
    if (reduced || !ref.current) return;
    const tween = gsap.fromTo(
      ref.current,
      { scale: 0.6, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2)" }
    );
    const spin = gsap.to(ref.current, { rotation: 30, duration: 2.4, ease: "none", repeat: -1, yoyo: true });
    return () => {
      tween.kill();
      spin.kill();
    };
  }, [reduced]);
  return <span ref={ref} className="RaceDrone__burst" aria-hidden="true" />;
};

/**
 * Race v3's main view (Figma "Race v3 · G"): the field seen from above on a straight
 * stretch. The field spreads over hundreds of metres, so the drone frames all of it,
 * from the last runner to the first; that keeps the gates in view at the start and the
 * finish at the end. Each runner is her face in a stamina ring, with a pip for a skill
 * still waiting (✦) or already spent (✓).
 */
const RaceDrone = ({ field, distance, gatesShut, projection, grade, children }: RaceDroneProps) => {
  const player = field.find((runner) => runner.isPlayer);
  const anchor = player?.position ?? 0;
  const positions = field.map((runner) => Math.min(distance, runner.position));
  const last = positions.length ? Math.min(...positions) : 0;
  const first = positions.length ? Math.max(...positions) : 0;
  const spread = Math.max(MIN_WINDOW, first - last);
  const start = last - spread * PAD_BEHIND;
  const view = spread * (1 + PAD_BEHIND + PAD_AHEAD);
  const toX = (metres: number) => ((metres - start) / view) * 100;

  // The ground scrolls with the camera, in metres: the turf stripes and the lane dashes
  // are drawn at a fixed length on the track, so they slide as the field moves on.
  const cardRef = useRef<HTMLElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    setWidth(card.clientWidth);
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(card);
    return () => observer.disconnect();
  }, []);
  const pxPerMetre = width / view;
  const ground = (period: number) => {
    const size = Math.max(4, period * pxPerMetre);
    return { size: `${size}px`, offset: `${-((start * pxPerMetre) % size)}px` };
  };
  const stripes = ground(STRIPE_METRES);
  const dashes = ground(DASH_METRES);
  const groundStyle = {
    "--stripe-size": stripes.size,
    "--stripe-offset": stripes.offset,
    "--dash-size": dashes.size,
    "--dash-offset": dashes.offset
  } as CSSProperties;
  const posts: number[] = [];
  for (let metre = Math.ceil(Math.max(1, start) / POST_EVERY) * POST_EVERY; metre < Math.min(distance, start + view); metre += POST_EVERY) {
    posts.push(metre);
  }

  const lanes = Math.max(1, field.length);
  const laneY = (lane: number) => BAND_TOP + ((lane + 0.5) * (BAND_BOTTOM - BAND_TOP)) / lanes;
  const crowded = lanes > 10;

  const finishX = toX(distance);
  const gateX = toX(0);
  const placed = new Map(
    field.map((runner) => {
      const raw = toX(runner.position);
      return [runner.id, { x: Math.min(97, Math.max(3, raw)), y: laneY(runner.lane), off: raw < 3 ? "behind" : raw > 97 ? "ahead" : null }];
    })
  );

  const tagged = (runner: FieldRunner) =>
    runner.isPlayer || runner.isRival || runner.placement === 1 || runner.skills.some((skill) => skill.state === "firing");

  const playerSpot = player ? placed.get(player.id) : undefined;
  const targetSpot = projection ? placed.get(projection.target.id) : undefined;

  return (
    <section
      ref={cardRef}
      className={`RaceDrone${grade > 0 ? " is-uphill" : ""}`}
      style={groundStyle}
      aria-label="Corrida vista de cima"
    >
      <div className="RaceDrone__turf RaceDrone__turf--top" aria-hidden="true" />
      <div className="RaceDrone__band" aria-hidden="true" style={{ top: `${BAND_TOP - 3}%`, bottom: `${100 - BAND_BOTTOM - 3}%` }}>
        {Array.from({ length: lanes - 1 }, (_, index) => (
          <span key={index} className="RaceDrone__lane" style={{ top: `${((index + 1) / lanes) * 100}%` }} />
        ))}
      </div>
      <div className="RaceDrone__turf RaceDrone__turf--bottom" aria-hidden="true" />

      {posts.map((metre) => (
        <span key={metre} className="RaceDrone__post" style={{ left: `${toX(metre)}%` }} aria-hidden="true">
          {(distance - metre).toLocaleString("pt-BR")} m
        </span>
      ))}

      {grade > 0 && (
        <span className="RaceDrone__sign RaceDrone__sign--grade" style={{ left: "82%" }}>
          ▲ SUBIDA {grade}%
        </span>
      )}

      {gateX > -5 && gateX < 105 && (
        <div className={`RaceDrone__gates${gatesShut ? " is-shut" : ""}`} style={{ left: `${gateX}%` }} aria-hidden="true">
          <span className="RaceDrone__sign">{distance.toLocaleString("pt-BR")} m</span>
        </div>
      )}

      {finishX > -5 && finishX < 105 && (
        <div className="RaceDrone__finish" style={{ left: `${finishX}%` }} aria-hidden="true">
          <span className="RaceDrone__sign RaceDrone__sign--finish">META</span>
        </div>
      )}

      {projection && playerSpot && targetSpot && (
        <svg className="RaceDrone__projection" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <line x1={playerSpot.x} y1={playerSpot.y} x2={Math.min(97, targetSpot.x + 6)} y2={targetSpot.y} />
        </svg>
      )}

      <ul className={`RaceDrone__field${crowded ? " is-crowded" : ""}`}>
        {field.map((runner) => {
          const spot = placed.get(runner.id)!;
          const size = runner.isPlayer ? (crowded ? 54 : 64) : runner.isRival ? (crowded ? 36 : 44) : crowded ? 26 : 34;
          const firing = runner.skills.some((skill) => skill.state === "firing");
          const waiting = runner.skills.some((skill) => skill.state === "ready");
          const spent = runner.skills.some((skill) => skill.state === "used");
          return (
            <li
              key={runner.id}
              className={[
                "RaceDrone__runner",
                runner.isPlayer ? "is-player" : "",
                firing ? "is-firing" : "",
                // Near the right edge the name goes on the left, so it is not cut off.
                spot.x > 78 ? "is-flipped" : "",
                spot.off ? `is-${spot.off}` : ""
              ]
                .filter(Boolean)
                .join(" ")}
              style={{ left: `${spot.x}%`, top: `${spot.y}%`, "--runner-color": runner.color, zIndex: runner.isPlayer ? 5 : firing ? 4 : 2 } as CSSProperties}
              title={`${runner.placement}º · ${runner.name} · fôlego ${Math.round(runner.stamina * 100)}%`}
            >
              {firing && <SkillBurst />}
              {!spot.off && runner.speed > 0 && (
                <span className="RaceDrone__trail" style={{ width: `${Math.min(90, runner.speed * 3)}px` }} aria-hidden="true" />
              )}
              <RunnerAvatar
                name={runner.name}
                color={runner.color}
                isPlayer={runner.isPlayer}
                stamina={runner.stamina}
                size={size}
                className={firing ? "is-firing" : undefined}
              />
              {(waiting || spent) && (
                <span className={`RaceDrone__pip${waiting ? " is-ready" : ""}`} aria-hidden="true">
                  {waiting ? "✦" : "✓"}
                </span>
              )}
              {spot.off ? (
                <span className="RaceDrone__offscreen">
                  {spot.off === "behind" ? "◀" : ""} {Math.round(Math.abs(runner.position - anchor))} m {spot.off === "ahead" ? "▶" : ""}
                </span>
              ) : (
                tagged(runner) && (
                  <span className="RaceDrone__tag">
                    {runner.placement}º · {runner.isPlayer ? "VOCÊ" : runner.name}
                  </span>
                )
              )}
              {projection?.target.id === runner.id && !spot.off && (
                <span className="RaceDrone__callout" role="note">
                  <small>PREVISÃO NO RITMO ATUAL</small>
                  passa no T{projection.turn}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <div className="RaceDrone__moment">{children}</div>
    </section>
  );
};

export default RaceDrone;
