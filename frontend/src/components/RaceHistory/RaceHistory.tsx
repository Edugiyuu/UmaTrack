import { useEffect, useState } from "react";
import { getRaceHistory } from "../../services/Race";
import type { RaceHistoryEntry } from "../../types/race";
import { formatRaceTime } from "../../utils/raceTime";
import "./RaceHistory.css";

const RaceHistory = () => {
  const [races, setRaces] = useState<RaceHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    getRaceHistory(controller.signal)
      .then((response) => setRaces(response.races))
      .catch((fetchError: unknown) => {
        if (controller.signal.aborted) return;
        setError(fetchError instanceof Error ? fetchError.message : "Erro ao buscar histórico.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  if (loading) return <p className="RaceHistory__state">Carregando corridas...</p>;
  if (error) return <p className="RaceHistory__state" role="alert">{error}</p>;

  const wins = races.filter((race) => race.placement === 1).length;

  return (
    <section className="RaceHistory">
      <header>
        <h2>Corridas</h2>
        {races.length > 0 && <span>{wins} vitória(s) em {races.length} prova(s)</span>}
      </header>

      {races.length === 0 ? (
        <p className="RaceHistory__state">Nenhuma corrida ainda. Treine e leve alguém para a pista!</p>
      ) : (
        <ul>
          {races.map((race) => (
            <li key={race._id} className={race.placement === 1 ? "is-win" : ""}>
              <span className="RaceHistory__place">{race.placement}º</span>
              <span className="RaceHistory__track">
                <strong>{race.trackName}</strong>
                <small>{race.horseName} · {race.distance}m</small>
              </span>
              <span className="RaceHistory__time">{formatRaceTime(race.finishTime, race.timeUnit)}</span>
              <span className="RaceHistory__prize">+{race.prizeMoney.toLocaleString("pt-BR")}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default RaceHistory;
