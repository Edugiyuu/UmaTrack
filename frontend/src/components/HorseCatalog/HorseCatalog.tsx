import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { getAllHorses } from "../../services/Horse";
import { horseColors } from "../../constants/horseColors";
import { STAT_LABEL } from "../../constants/trackVisuals";
import { useScreenEnter } from "../../animations/screen";
import { useBarTween } from "../../animations/useBarTween";
import { useFlipReorder } from "../../animations/useFlipReorder";
import { useHoverScale } from "../../animations/useHoverScale";
import { useStaggerIn } from "../../animations/useStaggerIn";
import Segmented, { type SegmentedOption } from "../CatalogPage/Segmented";
import type { HorseResponseProfile } from "../../types/horse";
import type { StatName } from "../../types/race";
import "../CatalogPage/CatalogPage.css";
import "./HorseCatalog.css";

const STATS: StatName[] = ["speed", "stamina", "power", "wit"];

type SortKey = StatName | "cost";

const SORTS: SegmentedOption<SortKey>[] = [
  { id: "cost", label: "Preço" },
  ...STATS.map((stat) => ({ id: stat, label: STAT_LABEL[stat] }))
];

/** The stat a horse girl leans on, which is also the one she trains fastest. */
const specialityOf = (horse: HorseResponseProfile): StatName =>
  STATS.reduce((best, stat) => (horse[stat] > horse[best] ? stat : best), STATS[0]);

const folderFor = (name: string) => name.replace(/\s+/g, "");

interface StatRowProps {
  stat: StatName;
  value: number;
  max: number;
  /** Position of the card in the cascade, so its bars fill after it arrives. */
  order: number;
}

/** One stat line: dot, name, a bar that GSAP fills from empty, and the value. */
const StatRow = ({ stat, value, max, order }: StatRowProps) => {
  const barRef = useBarTween<HTMLSpanElement>(value / max, {
    from: 0,
    duration: 0.8,
    delay: 0.35 + order * 0.06
  });

  return (
    <li className={`HorseCard__stat HorseCard__stat--${stat}`}>
      <span className="HorseCard__stat-name">{STAT_LABEL[stat]}</span>
      <span className="HorseCard__bar">
        <span ref={barRef} />
      </span>
      <strong>{value}</strong>
    </li>
  );
};

/**
 * The roster, v2 (Figma "HorsesScreen v2"): one card per horse girl with her art in a
 * frame of her colour, the stat she leans on, her passive, her four stats and the price.
 * Sorting makes the cards glide to their new places.
 */
const HorseCatalog = () => {
  const [horses, setHorses] = useState<HorseResponseProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("cost");
  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

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

  useScreenEnter(rootRef, !loading);
  useStaggerIn(gridRef, ".HorseCard", [loading], { delay: 0.15, stagger: 0.07 });
  useHoverScale(rootRef, ".HorseCard", { hover: 1.02, press: 1 });
  const captureOrder = useFlipReorder(gridRef, ".HorseCard", [sortBy]);

  /** Roster number: her place in the catalogue, which sorting does not change. */
  const numbers = useMemo(
    () => new Map(horses.map((horse, index) => [horse._id, index + 1])),
    [horses]
  );

  const sorted = useMemo(
    () => [...horses].sort((a, b) => b[sortBy] - a[sortBy]),
    [horses, sortBy]
  );

  const maxStat = useMemo(
    () => Math.max(120, ...horses.flatMap((horse) => STATS.map((stat) => horse[stat]))),
    [horses]
  );

  const changeSort = (next: SortKey) => {
    if (next === sortBy) return;
    captureOrder();
    setSortBy(next);
  };

  return (
    <div className="CatalogPage HorseCatalog" ref={rootRef}>
      <div className="CatalogPage__inner">
        <header className="CatalogPage__header">
          <div className="CatalogPage__intro">
            <p className="CatalogPage__eyebrow" data-screen="item">Catálogo · Elenco</p>
            <h1 className="CatalogPage__title" data-screen="item">Elenco</h1>
            <p className="CatalogPage__lead" data-screen="item">
              Cada garota-cavalo começa forte num atributo — e é nele que ela treina mais
              rápido. Compre e treine no <strong>Play</strong>.
            </p>
          </div>
          {!loading && !error && (
            <Segmented label="Ordenar por" options={SORTS} value={sortBy} onChange={changeSort} />
          )}
        </header>

        {loading || error ? (
          <p className="CatalogPage__state" role={error ? "alert" : undefined}>
            {error ?? "Carregando elenco..."}
          </p>
        ) : (
          <div className="HorseCatalog__grid" ref={gridRef}>
            {sorted.map((horse, order) => {
              const speciality = specialityOf(horse);
              const folder = folderFor(horse.name);
              const number = String(numbers.get(horse._id) ?? 0).padStart(2, "0");

              return (
                <article
                  key={horse._id}
                  className="HorseCard"
                  style={{ "--horse-color": horseColors[horse.name] ?? "#24bb6d" } as CSSProperties}
                >
                  <div className="HorseCard__art">
                    <img
                      src={`${import.meta.env.BASE_URL}horses/${folder}/Selection.png`}
                      alt={horse.name}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.visibility = "hidden";
                      }}
                    />
                    <span className="HorseCard__number">Nº {number}</span>
                  </div>

                  <div className="HorseCard__body">
                    <h2>{horse.name}</h2>
                    <span className={`HorseCard__type HorseCard__type--${speciality}`}>
                      Tipo {STAT_LABEL[speciality]}
                    </span>
                    <p className="HorseCard__passive">{horse.passiveBuff}</p>

                    <ul className="HorseCard__stats">
                      {STATS.map((stat) => (
                        <StatRow key={stat} stat={stat} value={horse[stat]} max={maxStat} order={order} />
                      ))}
                    </ul>

                    <footer className="HorseCard__price">
                      <span>Preço</span>
                      <strong>
                        <i aria-hidden="true">$</i>
                        {horse.cost.toLocaleString("pt-BR")}
                      </strong>
                    </footer>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HorseCatalog;
