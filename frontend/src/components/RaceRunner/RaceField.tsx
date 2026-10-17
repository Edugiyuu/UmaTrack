import RunnerAvatar from "./RunnerAvatar";
import { byPlacement, staminaTone, type FieldRunner, type FieldSkill } from "./fieldModel";

export interface RaceFieldProps {
  field: FieldRunner[];
  /** She has crossed the line: the list becomes the result. */
  arrived: boolean;
}

const SkillPill = ({ skill }: { skill: FieldSkill }) => (
  <span className={`RaceField__skill is-${skill.state}`}>
    {skill.state === "used" ? "✓" : "✦"} {skill.name}
    {skill.state === "used" && skill.turn !== undefined && <small> · T{skill.turn}</small>}
    {skill.state === "firing" && "!"}
  </span>
);

/** Firing first, then waiting, then spent: what can still change the race comes first. */
const RANK = { firing: 0, ready: 1, used: 2 } as const;

/**
 * The field down the left column (Race v3): each runner's face in her stamina ring,
 * her pace over the last turn, what she has left, and her skills. A full field is long,
 * so the list scrolls; she is highlighted wherever she is.
 */
const RaceField = ({ field, arrived }: RaceFieldProps) => {
  const sorted = byPlacement(field);

  return (
    <section className="RaceField" aria-labelledby="race-field-title">
      <header className="RaceField__head">
        <h2 id="race-field-title">
          {!arrived && <span className="RaceField__live" aria-hidden="true" />}
          {arrived ? "Resultado" : "Pelotão"}
        </h2>
        <span>{arrived ? "fôlego final" : "ao vivo"}</span>
      </header>
      <ol className="RaceField__list">
        {sorted.map((runner) => {
          const skills = [...runner.skills].sort((a, b) => RANK[a.state] - RANK[b.state]).slice(0, 2);
          const tone = staminaTone(runner.stamina);
          return (
            <li
              key={runner.id}
              className={[
                "RaceField__row",
                runner.isPlayer ? "is-player" : "",
                arrived && runner.placement === 1 ? "is-winner" : "",
                runner.skills.some((skill) => skill.state === "firing") ? "is-firing" : ""
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <RunnerAvatar
                name={runner.name}
                color={runner.color}
                isPlayer={runner.isPlayer}
                stamina={runner.stamina}
                size={runner.isPlayer || runner.isRival ? 40 : 30}
              />
              <div className="RaceField__body">
                <p className="RaceField__name">
                  <span className="RaceField__place" style={{ color: runner.color }}>
                    {runner.placement}
                  </span>
                  {runner.isPlayer ? `Você · ${runner.name}` : runner.name}
                  {runner.isRival && !runner.isPlayer && <span className="RaceField__rival">rival</span>}
                </p>
                <p className="RaceField__line">
                  <span>
                    {arrived || runner.finished
                      ? runner.placement === 1
                        ? "venceu"
                        : `+${Math.round(runner.gap).toLocaleString("pt-BR")} m`
                      : `${runner.speed.toFixed(1).replace(".", ",")} m/turno`}
                  </span>
                  <strong className={`is-${tone}`}>
                    {Math.round(runner.stamina * 100)}%
                    {!runner.finished && runner.staminaDrop >= 0.04 && (
                      <small> ▼{Math.round(runner.staminaDrop * 100)}</small>
                    )}
                  </strong>
                </p>
                <span className="RaceField__bar" aria-hidden="true">
                  <span className={`is-${tone}`} style={{ width: `${Math.round(runner.stamina * 100)}%` }} />
                </span>
                {skills.length > 0 && (
                  <span className="RaceField__skills">
                    {skills.map((skill) => (
                      <SkillPill key={skill.slug} skill={skill} />
                    ))}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <footer className="RaceField__legend" aria-label="Como ler">
        <span><i className="RaceField__legend-ring" /> anel = fôlego</span>
        <span><i className="RaceField__legend-pip is-ready">✦</i> guardada</span>
        <span><i className="RaceField__legend-pip">✓</i> usada</span>
      </footer>
    </section>
  );
};

export default RaceField;
