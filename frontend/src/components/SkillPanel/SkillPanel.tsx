import { useEffect, useMemo, useState } from "react";
import { getSkills, learnSkill } from "../../services/Race";
import type { HorseResponseProfile } from "../../types/horse";
import type { SkillResponse } from "../../types/race";
import "./SkillPanel.css";

const RARITY_LABEL: Record<SkillResponse["rarity"], string> = {
  common: "Comum",
  rare: "Rara",
  unique: "Única"
};

interface SkillPanelProps {
  horse: HorseResponseProfile;
  horseId: string;
  onHorseUpdated: (horse: HorseResponseProfile) => void;
}

/**
 * What is stopping this skill from being learned right now, if anything. Skill points
 * are the only price: there are no stat minimums (task 16).
 */
const blockerFor = (skill: SkillResponse, horse: HorseResponseProfile) => {
  if (horse.skills?.some((learned) => learned.slug === skill.slug)) return "learned" as const;
  if ((horse.skillPoints ?? 0) < skill.cost) return "points" as const;
  return null;
};

const SkillPanel = ({ horse, horseId, onHorseUpdated }: SkillPanelProps) => {
  const [skills, setSkills] = useState<SkillResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [onlyAvailable, setOnlyAvailable] = useState(false);

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

  const entries = useMemo(
    () => skills.map((skill) => ({ skill, blocker: blockerFor(skill, horse) })),
    [skills, horse]
  );

  const visible = onlyAvailable ? entries.filter((entry) => entry.blocker === null) : entries;

  const handleLearn = async (skill: SkillResponse) => {
    if (busySlug) return;
    try {
      setBusySlug(skill.slug);
      setError(null);
      const updated = await learnSkill(horseId, skill._id);
      onHorseUpdated(updated);
    } catch (learnError) {
      setError(learnError instanceof Error ? learnError.message : "Erro ao aprender skill.");
    } finally {
      setBusySlug(null);
    }
  };

  if (loading) return <p className="SkillPanel__state">Carregando skills...</p>;

  return (
    <section className="SkillPanel">
      <header className="SkillPanel__header">
        <h2>Skills</h2>
        <span className="SkillPanel__points">💎 {horse.skillPoints ?? 0} SP</span>
        <label className="SkillPanel__filter">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(event) => setOnlyAvailable(event.target.checked)}
          />
          Só as que posso aprender
        </label>
      </header>

      {error && <p className="SkillPanel__error" role="alert">{error}</p>}

      <ul className="SkillPanel__list">
        {visible.map(({ skill, blocker }) => {
          const learned = blocker === "learned";
          return (
            <li
              key={skill._id}
              className={`SkillPanel__card SkillPanel__card--${skill.rarity}${learned ? " is-learned" : ""}`}
            >
              <div className="SkillPanel__card-head">
                <strong>{skill.name}</strong>
                <span className="SkillPanel__rarity">{RARITY_LABEL[skill.rarity]}</span>
              </div>
              <p className="SkillPanel__description">{skill.description}</p>

              <div className="SkillPanel__card-foot">
                <span>{skill.cost} SP</span>
                {learned ? (
                  <span className="SkillPanel__learned">Aprendida ✓</span>
                ) : (
                  <button
                    type="button"
                    disabled={blocker !== null || busySlug !== null}
                    onClick={() => handleLearn(skill)}
                  >
                    {busySlug === skill.slug ? "Aprendendo..." : "Aprender"}
                  </button>
                )}
              </div>

              {blocker === "points" && (
                <p className="SkillPanel__blocker">
                  Faltam {skill.cost - (horse.skillPoints ?? 0)} SP.
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {visible.length === 0 && (
        <p className="SkillPanel__state">Nenhuma skill disponível ainda. Treine e corra para juntar skill points.</p>
      )}
    </section>
  );
};

export default SkillPanel;
