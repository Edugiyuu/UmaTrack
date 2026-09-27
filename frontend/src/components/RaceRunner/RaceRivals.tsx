import { useEffect, useRef } from "react";
import Button from "../ui/Button/Button";
import { RUNNING_STYLE_LABEL, STAT_LABEL } from "../../constants/trackVisuals";
import type { RivalProfile, StatBlock, StatName } from "../../types/race";
import "./RaceRivals.css";

export interface RaceRivalsProps {
  rivals: (RivalProfile & { color: string })[];
  /** The player's girl and her stats, the yardstick every rival is built on. */
  playerName: string;
  playerStats: StatBlock;
  onStart: () => void;
}

const STATS: StatName[] = ["speed", "stamina", "power", "wit"];

/**
 * Shown before the gates open: the three rivals the field was built around, each stat
 * next to the difference to the player's own, so she knows who to watch.
 */
const RaceRivals = ({ rivals, playerName, playerStats, onStart }: RaceRivalsProps) => {
  const startRef = useRef<HTMLButtonElement>(null);

  // The dialog opens over a page nobody has touched yet, so the call to action takes focus.
  useEffect(() => {
    startRef.current?.focus();
  }, []);

  return (
    <div className="RaceRivals__backdrop">
      <div className="RaceRivals" role="dialog" aria-modal="true" aria-labelledby="race-rivals-title">
        <header className="RaceRivals__header">
          <p className="RaceRivals__eyebrow">Antes da largada</p>
          <h1 id="race-rivals-title" className="RaceRivals__headline">Suas rivais</h1>
          <p className="RaceRivals__summary">
            Montadas em cima de {playerName}: cada atributo delas fica entre 90% e 130% do seu.
            O resto do páreo segue o nível da pista.
          </p>
        </header>

        <ul className="RaceRivals__list">
          {rivals.map((rival) => (
            <li key={rival.id} className="RaceRivals__card">
              <div className="RaceRivals__name">
                <span className="RaceRivals__dot" style={{ backgroundColor: rival.color }} aria-hidden="true" />
                <strong>{rival.name}</strong>
                <span className="RaceRivals__style">{RUNNING_STYLE_LABEL[rival.runningStyle]}</span>
              </div>
              <dl className="RaceRivals__stats">
                {STATS.map((stat) => {
                  const diff = rival.stats[stat] - playerStats[stat];
                  const tone = diff > 0 ? "is-above" : diff < 0 ? "is-below" : "";
                  return (
                    <div key={stat} className={`RaceRivals__stat RaceRivals__stat--${stat}`}>
                      <dt>{STAT_LABEL[stat]}</dt>
                      <dd>
                        {rival.stats[stat]}
                        <span className={`RaceRivals__diff ${tone}`}>
                          {diff === 0 ? "=" : `${diff > 0 ? "+" : "−"}${Math.abs(diff)}`}
                        </span>
                      </dd>
                    </div>
                  );
                })}
              </dl>
              <p className="RaceRivals__skills">
                {rival.skills.length ? rival.skills.join(" · ") : "Sem skills"}
              </p>
            </li>
          ))}
        </ul>

        <Button ref={startRef} variant="primary" block onClick={onStart}>
          Largar!
        </Button>
      </div>
    </div>
  );
};

export default RaceRivals;
