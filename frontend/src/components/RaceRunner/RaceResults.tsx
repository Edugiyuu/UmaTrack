import { useEffect, useRef } from "react";
import Button from "../ui/Button/Button";
import Pill from "../ui/Pill/Pill";
import { money, ordinal } from "./format";
import { formatTurns } from "../../utils/raceTime";
import { STAT_LABEL } from "../../constants/trackVisuals";
import { goalLabel } from "../../constants/career";
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
    { label: "Turnos restantes", value: `${rewards.turnsLeft}` }
  ];

  const career = rewards.career;
  const careerLine = !career
    ? null
    : career.kind === "passed"
      ? `Meta batida (${goalLabel(career.goal)})! Próxima prova: ${career.next.trackName} em ${career.next.turnsBefore} turnos, meta ${goalLabel(career.next.goal)}.`
      : career.kind === "completed"
        ? "Carreira completa! Ela se aposenta com honra e fica guardada no seu perfil."
        : `Meta não batida: precisava ${goalLabel(career.goal)} e chegou em ${ordinal(career.placement)}. A carreira terminou; ela fica guardada no seu perfil.`;

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
            {formatTurns(playerResult.finishTime)} · velocidade máxima {playerResult.topSpeed} m/turno
          </p>
          {playerResult.exhausted && (
            <Pill tone="danger">Ficou sem fôlego antes da linha</Pill>
          )}
        </header>

        {careerLine && (
          <p className={`RaceResults__career is-${career!.kind}`} role="status">
            <span className="RaceResults__section-label">Carreira</span>
            {careerLine}
          </p>
        )}

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
                  {formatTurns(result.finishTime)}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="RaceResults__actions">
          {/* After a career race the next step is training (or the retirement screen). */}
          {!career && (
            <Button variant="ink" onClick={onAnotherTrack}>
              Outra pista
            </Button>
          )}
          <Button variant={career ? "primary" : "ghost"} onClick={onBackToTraining}>
            Voltar ao treino
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RaceResults;
