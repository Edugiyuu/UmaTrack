import { useEffect, useMemo, useState } from "react";
import { getAllHorses } from "../../services/Horse";
import { horseColors } from "../../constants/horseColors";
import { STAT_LABEL } from "../../constants/trackVisuals";
import type { HorseResponseProfile } from "../../types/horse";
import type { StatName } from "../../types/race";
import speedIcon from "../../assets/gameIcons/speedIcon.png";
import staminaIcon from "../../assets/gameIcons/staminaIcon.png";
import powerIcon from "../../assets/gameIcons/powerIcon.png";
import witIcon from "../../assets/gameIcons/witIcon.png";
import "./HorseCatalog.css";

const STAT_ICON: Record<StatName, string> = {
  speed: speedIcon,
  stamina: staminaIcon,
  power: powerIcon,
  wit: witIcon
};

const STATS: StatName[] = ["speed", "stamina", "power", "wit"];

/** The stat a horse girl leans on, which is also the one she trains fastest. */
const specialityOf = (horse: HorseResponseProfile): StatName =>
  STATS.reduce((best, stat) => (horse[stat] > horse[best] ? stat : best), STATS[0]);

const folderFor = (name: string) => name.replace(/\s+/g, "");

const HorseCatalog = () => {
  const [horses, setHorses] = useState<HorseResponseProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<StatName | "cost">("cost");

  useEffect(() => {
    let cancelled = false;

    getAllHorses()
      .then((data: HorseResponseProfile[]) => {
        if (!cancelled) setHorses(data);
      })
      .catch((fetchError: unknown) => {
        if (cancelled) return;
        setError(fetchError instanceof Error ? fetchError.message : "Erro ao buscar cavalos.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = useMemo(
    () => [...horses].sort((a, b) => b[sortBy] - a[sortBy]),
    [horses, sortBy]
  );

  const maxStat = useMemo(
    () => Math.max(120, ...horses.flatMap((horse) => STATS.map((stat) => horse[stat]))),
    [horses]
  );

  if (loading || error) {
    return (
      <div className="HorseCatalog">
        <p className="HorseCatalog__state" role={error ? "alert" : undefined}>
          {error ?? "Carregando elenco..."}
        </p>
      </div>
    );
  }

  return (
    <div className="HorseCatalog">
      <header className="HorseCatalog__header">
        <div>
          <h1>Elenco</h1>
          <p>
            Cada garota-cavalo começa forte num atributo — e é nele que ela treina mais
            rápido. Compre e treine no <strong>Play</strong>.
          </p>
        </div>
        <label className="HorseCatalog__sort">
          Ordenar por
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as StatName | "cost")}>
            <option value="cost">Preço</option>
            {STATS.map((stat) => (
              <option key={stat} value={stat}>{STAT_LABEL[stat]}</option>
            ))}
          </select>
        </label>
      </header>

      <div className="HorseCatalog__grid">
        {sorted.map((horse) => {
          const speciality = specialityOf(horse);
          const folder = folderFor(horse.name);

          return (
            <article
              key={horse._id}
              className="HorseCatalog__card"
              style={{ borderTopColor: horseColors[horse.name] ?? "#24bb6d" }}
            >
              <div
                className="HorseCatalog__art"
                style={{ backgroundColor: horseColors[horse.name] ?? "#24bb6d" }}
              >
                <img
                  src={`${import.meta.env.BASE_URL}horses/${folder}/${folder}1.png`}
                  alt={horse.name}
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.style.visibility = "hidden";
                  }}
                />
              </div>

              <div className="HorseCatalog__body">
                <h2>{horse.name}</h2>
                <span className={`HorseCatalog__speciality HorseCatalog__speciality--${speciality}`}>
                  Tipo {STAT_LABEL[speciality]}
                </span>
                <p className="HorseCatalog__passive">{horse.passiveBuff}</p>

                <ul className="HorseCatalog__stats">
                  {STATS.map((stat) => (
                    <li key={stat}>
                      <img src={STAT_ICON[stat]} alt="" />
                      <span className="HorseCatalog__stat-name">{STAT_LABEL[stat]}</span>
                      <span className="HorseCatalog__bar">
                        <span style={{ width: `${(horse[stat] / maxStat) * 100}%` }} />
                      </span>
                      <strong>{horse[stat]}</strong>
                    </li>
                  ))}
                </ul>

                <footer>Preço: <strong>{horse.cost.toLocaleString("pt-BR")}</strong></footer>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default HorseCatalog;
