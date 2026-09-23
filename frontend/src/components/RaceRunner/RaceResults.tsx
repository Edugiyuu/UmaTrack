import { useEffect, useRef } from "react";
import Button from "../ui/Button/Button";
import Pill from "../ui/Pill/Pill";
import { formatTime, money, ordinal } from "./format";
import { STAT_LABEL } from "../../constants/trackVisuals";
import type { RaceRewards, RaceRunnerResult, StatName } from "../../types/race";
import "./RaceResults.css";

export interface RaceResultsProps {
  rewards: RaceRewards;
  playerResult: RaceRunnerResult;
  /** Every runner, already ordered by placement. */
  results: RaceRunnerResult[];
  /** Stats the player's girl was short on for this track. */
  shortfalls: { stat: StatName; required: number; current: number }[];
  onAnotherTrack: () => void;
  onBackToTraining: () => void;
}

interface Reward {
  label: string;
  value: string;
  tone?: "gain" | "cost";
}

const RaceResults = ({
  rewards,
  playerResult,
  results,
  shortfalls,
  onAnotherTrack,
  onBackToTraining
}: RaceResultsProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // The race just ended and the page behind is still animating, so the dialog takes
  // focus to become the keyboard's starting point.
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const won = rewards.placement === 1;

  const rewardList: Reward[] = [
    { label: "Prêmio", value: `+${money(rewards.prizeMoney)}`, tone: "gain" },
    { label: "Inscrição", value: `-${money(rewards.entryFee)}`, tone: "cost" },
    { label: "Skill points", value: `+${rewards.skillPointsEarned}`, tone: "gain" },
    { label: "Fãs", value: `+${money(rewards.fansEarned)}`, tone: "gain" },
    { label: "Energia", value: `-${rewards.energySpent}`, tone: "cost" },
    { label: "Turnos de treino", value: `${rewards.turnsLeft}` }
  ];

  return (
    <div className="RaceResults__backdrop">
      <div
        className="RaceResults"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="RaceResults__headline"
        tabIndex={-1}
      >
        <header className="RaceResults__header">
          <p className="RaceResults__eyebrow">Resultado</p>
          <h2 className="RaceResults__headline" id="RaceResults__headline">
            {won ? "Vitória!" : `${ordinal(rewards.placement)} lugar`}
          </h2>
          <p className="RaceResults__summary">
            {formatTime(playerResult.finishTime)} · velocidade máxima {playerResult.topSpeed} m/s
          </p>
          {playerResult.exhausted && (
            <Pill tone="danger">Ficou sem fôlego antes da linha</Pill>
          )}
        </header>

        <ul className="RaceResults__rewards">
          {rewardList.map((reward) => (
            <li key={reward.label} className={reward.tone ? `is-${reward.tone}` : undefined}>
              <span className="RaceResults__reward-label">{reward.label}</span>
              <strong className="RaceResults__reward-value">{reward.value}</strong>
            </li>
          ))}
        </ul>

        {playerResult.skillsActivated.length > 0 && (
          <p className="RaceResults__skills">
            <span className="RaceResults__section-label">Skills ativadas</span>
            {playerResult.skillsActivated.join(" · ")}
          </p>
        )}

        {shortfalls.length > 0 && (
          <p className="RaceResults__warning" role="note">
            Ela correu abaixo do recomendado em{" "}
            <strong>{shortfalls.map((entry) => STAT_LABEL[entry.stat]).join(", ")}</strong>.
            Treine antes de voltar aqui.
          </p>
        )}

        <div className="RaceResults__standings">
          <span className="RaceResults__section-label">Chegada</span>
          <ol>
            {results.slice(0, 6).map((result) => (
              <li key={result.id} className={result.isPlayer ? "is-player" : undefined}>
                <span className="RaceResults__standing-place">{ordinal(result.placement)}</span>
                <span className="RaceResults__standing-name">{result.name}</span>
                <span className="RaceResults__standing-time">
                  {formatTime(result.finishTime)}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="RaceResults__actions">
          <Button variant="ink" onClick={onAnotherTrack}>
            Outra pista
          </Button>
          <Button variant="ghost" onClick={onBackToTraining}>
            Voltar ao treino
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RaceResults;
