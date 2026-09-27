import { goalLabel } from "../../constants/career";
import { horseColors } from "../../constants/horseColors";
import type { HorseResponseProfile } from "../../types/horse";
import { horseFolder, withImageFallback } from "../../utils/horseImage";
import "./RetiredHorses.css";

interface RetiredHorsesProps {
  horses: HorseResponseProfile[];
}

const dateLabel = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("pt-BR") : "";

/**
 * Horse girls whose career is over (docs/tasks/17-horse-career.md), kept as records:
 * final stats and every career race with its placement.
 */
const RetiredHorses = ({ horses }: RetiredHorsesProps) => {
  const retired = horses.filter((horse) => horse.career && horse.career.status !== "active");
  if (!retired.length) return null;

  return (
    <section className="RetiredHorses" aria-labelledby="retired-horses-title">
      <h2 id="retired-horses-title">Carreiras encerradas</h2>
      <ul className="RetiredHorses__list">
        {retired.map((horse, index) => {
          const career = horse.career!;
          const completed = career.status === "completed";
          return (
            <li
              key={horse.ownedHorseId ?? `${horse.name}-${index}`}
              className="RetiredHorses__card"
              style={{ borderTopColor: horseColors[horse.name] ?? "var(--accent)" }}
            >
              <img
                {...withImageFallback(horse.name, [`${horseFolder(horse.name)}1.png`, "Profile1.gif"])}
                alt=""
                className="RetiredHorses__art"
              />
              <div className="RetiredHorses__body">
                <header>
                  <strong>{horse.name}</strong>
                  <span className={`RetiredHorses__status is-${career.status}`}>
                    {completed ? "Carreira completa" : "Encerrada"}
                  </span>
                </header>
                <p className="RetiredHorses__stats">
                  Speed {horse.speed} · Stamina {horse.stamina} · Power {horse.power} · Wit {horse.wit}
                </p>
                <ol className="RetiredHorses__races">
                  {career.results.map((result) => (
                    <li key={result.raceIndex} className={result.passed ? "is-passed" : "is-failed"}>
                      {result.trackName}: {result.placement}º{" "}
                      <span>(meta {goalLabel(result.goal)})</span>
                    </li>
                  ))}
                </ol>
                <p className="RetiredHorses__meta">
                  {horse.racesWon ?? 0} vitórias em {horse.racesRun ?? 0} corridas ·{" "}
                  {(horse.fans ?? 0).toLocaleString("pt-BR")} fãs
                  {career.endedAt ? ` · ${dateLabel(career.endedAt)}` : ""}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default RetiredHorses;
