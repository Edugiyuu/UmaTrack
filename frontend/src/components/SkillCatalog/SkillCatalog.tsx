import { useEffect, useMemo, useState } from "react";
import { getSkills } from "../../services/Race";
import { STAT_LABEL } from "../../constants/trackVisuals";
import type { SkillResponse, StatName } from "../../types/race";
import "./SkillCatalog.css";

const STATS: StatName[] = ["speed", "stamina", "power", "wit"];

const RARITY_LABEL: Record<SkillResponse["rarity"], string> = {
  common: "Comum",
  rare: "Rara",
  unique: "Única"
};

const PHASE_LABEL: Record<string, string> = {
  any: "qualquer momento",
  opening: "largada",
  middle: "meio da prova",
  final: "reta final",
  spurt: "últimos 20%"
};

const TERRAIN_LABEL: Record<string, string> = {
  any: "qualquer terreno",
  uphill: "subida",
  downhill: "descida",
  corner: "curva",
  straight: "reta"
};

/** Plain-language summary of what the race engine will do with this skill. */
const describeEffect = (skill: SkillResponse) => {
  const { kind, stat, value, duration } = skill.effect;
  const turns = duration > 0 ? ` por ${duration} ${duration === 1 ? "turno" : "turnos"}` : "";

  switch (kind) {
    case "speedBoost":
      return `+${value} m/turno de velocidade${turns}`;
    case "startDash":
      return `+${value} m/turno na largada${turns}`;
    case "cornerBoost":
      return `+${value} m/turno nas curvas${turns}`;
    case "accelBoost":
      return `+${Math.round(value * 100)}% de aceleração${turns}`;
    case "staminaSave":
      return `-${Math.round(value * 100)}% de gasto de fôlego${turns}`;
    case "staminaRecover":
      return `recupera ${Math.round(value * 100)}% do fôlego`;
    case "inclineBoost":
      return `anula ${Math.round(value * 100)}% da perda em subida${turns}`;
    case "flatStat":
      return `+${value} de ${stat ? STAT_LABEL[stat] : "atributo"} durante a prova`;
    default:
      return `${kind} ${value}`;
  }
};

const describeTrigger = (skill: SkillResponse) => {
  const parts = [PHASE_LABEL[skill.trigger.phase] ?? skill.trigger.phase];
  if (skill.trigger.terrain !== "any") {
    parts.push(TERRAIN_LABEL[skill.trigger.terrain] ?? skill.trigger.terrain);
  }
  if (skill.trigger.maxStaminaRatio !== undefined) {
    parts.push(`fôlego abaixo de ${Math.round(skill.trigger.maxStaminaRatio * 100)}%`);
  }
  if (skill.trigger.minPosition !== undefined) {
    parts.push(`do ${skill.trigger.minPosition}º lugar para trás`);
  }
  return parts.join(" · ");
};

const SkillCatalog = () => {
  const [skills, setSkills] = useState<SkillResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rarity, setRarity] = useState<"all" | SkillResponse["rarity"]>("all");

  useEffect(() => {
    const controller = new AbortController();

    getSkills(controller.signal)
      .then(setSkills)
      .catch((fetchError: unknown) => {
        if (controller.signal.aborted) return;
        setError(fetchError instanceof Error ? fetchError.message : "Erro ao buscar skills.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const visible = useMemo(
    () => (rarity === "all" ? skills : skills.filter((skill) => skill.rarity === rarity)),
    [skills, rarity]
  );

  if (loading || error) {
    return (
      <div className="SkillCatalog">
        <p className="SkillCatalog__state" role={error ? "alert" : undefined}>
          {error ?? "Carregando skills..."}
        </p>
      </div>
    );
  }

  return (
    <div className="SkillCatalog">
      <header className="SkillCatalog__header">
        <div>
          <h1>Skills</h1>
          <p>
            Treinar rende <strong>skill points</strong>. Gaste-os na tela de carreira da sua
            garota-cavalo para aprender skills — elas disparam sozinhas durante a corrida,
            quando o gatilho acontece.
          </p>
        </div>
        <div className="SkillCatalog__filters">
          {(["all", "common", "rare", "unique"] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={rarity === option ? "is-active" : ""}
              onClick={() => setRarity(option)}
            >
              {option === "all" ? "Todas" : RARITY_LABEL[option]}
            </button>
          ))}
        </div>
      </header>

      <div className="SkillCatalog__grid">
        {visible.map((skill) => (
          <article key={skill._id} className={`SkillCatalog__card SkillCatalog__card--${skill.rarity}`}>
            <header>
              <h2>{skill.name}</h2>
              <span className="SkillCatalog__cost">{skill.cost} SP</span>
            </header>
            <span className="SkillCatalog__rarity">{RARITY_LABEL[skill.rarity]}</span>
            <p className="SkillCatalog__description">{skill.description}</p>

            <dl className="SkillCatalog__detail">
              <dt>Efeito</dt>
              <dd>{describeEffect(skill)}</dd>
              <dt>Dispara em</dt>
              <dd>{describeTrigger(skill)}</dd>
            </dl>

            {STATS.some((stat) => skill.requirements[stat] > 0) && (
              <ul className="SkillCatalog__requirements">
                {STATS.filter((stat) => skill.requirements[stat] > 0).map((stat) => (
                  <li key={stat}>{STAT_LABEL[stat]} {skill.requirements[stat]}</li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>

      {visible.length === 0 && <p className="SkillCatalog__state">Nenhuma skill nesse filtro.</p>}
    </div>
  );
};

export default SkillCatalog;
