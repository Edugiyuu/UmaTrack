import { useEffect, useMemo, useState } from "react";
import { getSkills } from "../../services/Race";
import { RARITY_LABEL, describeEffect, describeTrigger } from "../../constants/skillText";
import type { SkillResponse } from "../../types/race";
import "./SkillCatalog.css";

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

          </article>
        ))}
      </div>

      {visible.length === 0 && <p className="SkillCatalog__state">Nenhuma skill nesse filtro.</p>}
    </div>
  );
};

export default SkillCatalog;
