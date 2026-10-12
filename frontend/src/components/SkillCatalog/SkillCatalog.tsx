import { useEffect, useMemo, useRef, useState } from "react";
import { getSkills } from "../../services/Race";
import { RARITY_LABEL, describeEffect, describeTrigger } from "../../constants/skillText";
import { skillIcon } from "../../constants/skillIcons";
import { useScreenEnter } from "../../animations/screen";
import { useHoverScale } from "../../animations/useHoverScale";
import { useStaggerIn } from "../../animations/useStaggerIn";
import Segmented, { type SegmentedOption } from "../CatalogPage/Segmented";
import type { SkillResponse } from "../../types/race";
import "../CatalogPage/CatalogPage.css";
import "./SkillCatalog.css";

type Rarity = "all" | SkillResponse["rarity"];

const RARITIES: Rarity[] = ["all", "common", "rare", "unique"];

/**
 * Every skill in the game, v2 (Figma "SkillsCatalog v2"): a card per skill with its
 * rarity stripe, cost in skill points, what it does and when it fires. Skills are
 * bought on the career screen; this page only shows them.
 */
const SkillCatalog = () => {
  const [skills, setSkills] = useState<SkillResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rarity, setRarity] = useState<Rarity>("all");
  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

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

  useScreenEnter(rootRef, !loading);
  useStaggerIn(gridRef, ".CatalogSkill", [rarity, loading], { delay: 0.1, stagger: 0.035 });
  useHoverScale(rootRef, ".CatalogSkill", { hover: 1.015, press: 1 });

  const options = useMemo<SegmentedOption<Rarity>[]>(
    () =>
      RARITIES.map((option) => {
        const count =
          option === "all" ? skills.length : skills.filter((skill) => skill.rarity === option).length;
        const label = option === "all" ? "Todas" : RARITY_LABEL[option];
        return { id: option, label: `${label} · ${count}` };
      }),
    [skills]
  );

  const visible = useMemo(
    () => (rarity === "all" ? skills : skills.filter((skill) => skill.rarity === rarity)),
    [skills, rarity]
  );

  return (
    <div className="CatalogPage SkillCatalog" ref={rootRef}>
      <div className="CatalogPage__inner">
        <header className="CatalogPage__header">
          <div className="CatalogPage__intro">
            <p className="CatalogPage__eyebrow" data-screen="item">Catálogo · Skills</p>
            <h1 className="CatalogPage__title" data-screen="item">Skills</h1>
            <p className="CatalogPage__lead" data-screen="item">
              Treinar rende <strong>skill points</strong>. Gaste-os na tela de carreira da sua
              garota-cavalo para aprender skills — elas disparam sozinhas durante a corrida,
              quando o gatilho acontece.
            </p>
          </div>
          {!loading && !error && (
            <Segmented label="Raridade" options={options} value={rarity} onChange={setRarity} />
          )}
        </header>

        {loading || error ? (
          <p className="CatalogPage__state" role={error ? "alert" : undefined}>
            {error ?? "Carregando skills..."}
          </p>
        ) : (
          <div className="SkillCatalog__grid" ref={gridRef}>
            {visible.map((skill) => (
              <article key={skill._id} className={`CatalogSkill CatalogSkill--${skill.rarity}`}>
                <header className="CatalogSkill__head">
                  <span className="CatalogSkill__icon">
                    <img src={skillIcon(skill)} alt="" />
                  </span>
                  <div>
                    <h2>{skill.name}</h2>
                    <div className="CatalogSkill__chips">
                      <span className="CatalogSkill__rarity">{RARITY_LABEL[skill.rarity]}</span>
                      <span className="CatalogSkill__cost">{skill.cost} SP</span>
                    </div>
                  </div>
                </header>

                <p className="CatalogSkill__description">{skill.description}</p>

                <dl className="CatalogSkill__detail">
                  <div>
                    <dt>Efeito</dt>
                    <dd className="CatalogSkill__effect">{describeEffect(skill)}</dd>
                  </div>
                  <div>
                    <dt>Quando</dt>
                    <dd>{describeTrigger(skill)}</dd>
                  </div>
                </dl>
              </article>
            ))}

            <aside className="CatalogSkill CatalogSkill--tip">
              <header className="CatalogSkill__head">
                <span className="CatalogSkill__coin" aria-hidden="true">SP</span>
                <div>
                  <h2>Como ganhar skill points</h2>
                  <span className="CatalogSkill__tip-kicker">dica rápida</span>
                </div>
              </header>
              <p className="CatalogSkill__description">
                Cada treino rende SP — com bônus se o round for perfeito. Gaste na tela de
                carreira.
              </p>
              <p className="CatalogSkill__tip-strong">Wit alto = mais chance de a skill disparar.</p>
            </aside>
          </div>
        )}

        {!loading && !error && visible.length === 0 && (
          <p className="CatalogPage__state">Nenhuma skill nesse filtro.</p>
        )}
      </div>
    </div>
  );
};

export default SkillCatalog;
