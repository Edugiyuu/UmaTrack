import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { gsap } from "gsap";
import confetti from "canvas-confetti";
import "./Stable.css";
import PurchaseModal from "../PurchaseModal/PurchaseModal";
import { useTransitionNavigate } from "../PageTransition/PageTransition";
import { useScreenEnter } from "../../animations/screen";
import { useBarTween } from "../../animations/useBarTween";
import { useCountUp } from "../../animations/useCountUp";
import { useHoverScale } from "../../animations/useHoverScale";
import { useSegmentSlider } from "../../animations/useSegmentSlider";
import { useStaggerIn } from "../../animations/useStaggerIn";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { verifyToken } from "../../services/authToken";
import { getCurrentUser, purchaseHorse } from "../../services/User";
import { getAllHorses } from "../../services/Horse";
import { horseColors } from "../../constants/horseColors";
import { statRank } from "../../constants/statRank";
import { RUNNING_STYLE_LABEL } from "../../constants/trackVisuals";
import type { HorseResponseProfile } from "../../types/horse";
import { horseAnimation, horseAsset } from "../../utils/horseImage";
import speedIcon from "../../assets/gameIcons/speedIcon.png";
import staminaIcon from "../../assets/gameIcons/staminaIcon.png";
import powerIcon from "../../assets/gameIcons/powerIcon.png";
import witIcon from "../../assets/gameIcons/WitIcon.png";

type Filter = "all" | "owned" | "forSale";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "owned", label: "Desbloqueadas" },
  { id: "forSale", label: "À venda" }
];

const STATS = [
  { key: "speed", label: "Speed", icon: speedIcon },
  { key: "stamina", label: "Stamina", icon: staminaIcon },
  { key: "power", label: "Power", icon: powerIcon },
  { key: "wit", label: "Wit", icon: witIcon }
] as const;

type StatKey = (typeof STATS)[number]["key"];

/** The grades from the bottom up, so a higher index is a better grade. */
const GRADE_ORDER = "GFEDCBAS";

/** The roster always shows at least this many slots; the rest are "?" for horse girls to come. */
const MIN_SLOTS = 24;
const SLOTS_PER_ROW = 8;

const FALLBACK_COLOR = "#6185e0";

const money = (value: number) => `$ ${Math.round(value).toLocaleString("pt-BR")}`;

/**
 * Her copy in the save: a horse girl can have several (retired careers are kept as
 * records), so the stable shows the running one, or the latest when none is running.
 */
const currentCopy = (catalogHorse: HorseResponseProfile, owned: HorseResponseProfile[]) => {
  const copies = owned.filter(
    (copy) => copy.sourceHorseId === catalogHorse._id || copy.name === catalogHorse.name
  );
  return copies.find((copy) => copy.career?.status === "active") ?? copies[copies.length - 1];
};

/** "Sorte de bronze: ganha skill points..." → a name and what it does. */
const splitPassive = (passive?: string) => {
  if (!passive) return null;
  const at = passive.indexOf(":");
  if (at < 0) return { name: "", text: passive };
  return { name: passive.slice(0, at).trim(), text: passive.slice(at + 1).trim() };
};

interface StableStatProps {
  stat: StatKey;
  label: string;
  icon: string;
  value: number;
}

/** One stat with its grade: switching horse counts the number and slides the bar. */
const StableStat = ({ stat, label, icon, value }: StableStatProps) => {
  const rank = statRank(value);
  const valueRef = useCountUp<HTMLElement>(value, { from: 0, duration: 0.7 });
  const barRef = useBarTween<HTMLDivElement>(rank.progress, {
    from: 0,
    duration: 0.7,
    lap: GRADE_ORDER.indexOf(rank.letter)
  });
  const letterRef = useRef<HTMLSpanElement>(null);
  const letterShown = useRef(rank.letter);
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    if (letterShown.current === rank.letter) return;
    letterShown.current = rank.letter;
    if (reduced || !letterRef.current) return;
    const tween = gsap.fromTo(
      letterRef.current,
      { scale: 1.6, rotate: -8 },
      { scale: 1, rotate: 0, duration: 0.45, ease: "back.out(1.8)" }
    );
    return () => {
      tween.revert();
    };
  }, [rank.letter, reduced]);

  return (
    <article className={`StableStat StableStat--${stat}`} data-screen="item">
      <header className="StableStat__head">
        <img src={icon} alt="" />
        <h2>{label}</h2>
      </header>
      <div className="StableStat__body">
        <span ref={letterRef} className="StableStat__rank" aria-label={`Nota ${rank.letter}`}>
          {rank.letter}
        </span>
        <div className="StableStat__info">
          <strong ref={valueRef} className="StableStat__value" />
          <div className="StableStat__bar" aria-hidden="true">
            <div ref={barRef} />
          </div>
          <span className="StableStat__next">
            {rank.toNext === null ? "nota máxima" : `próxima nota em ${rank.toNext} pts`}
          </span>
        </div>
      </div>
    </article>
  );
};

/**
 * The stable, v2 (docs/tasks/28-ui-v2-stable.md, Figma "Desktop - 5 v2 (Estábulo)").
 * The horse girl picked is a big card on the left; on the right, her grades, her
 * passive and the roster, where the ones still for sale carry a lock and a price.
 */
const Stable = () => {
  const [catalog, setCatalog] = useState<HorseResponseProfile[]>([]);
  const [ownedHorses, setOwnedHorses] = useState<HorseResponseProfile[]>([]);
  const [monies, setMonies] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loggedOut, setLoggedOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [buying, setBuying] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  /** The horse girl just bought, so her tile pops once. */
  const [justBought, setJustBought] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLUListElement>(null);
  const shownId = useRef<string | null>(null);
  const reduced = usePrefersReducedMotion();
  const go = useTransitionNavigate();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const token = await verifyToken();
      if (!token.valid) {
        if (!cancelled) {
          setLoggedOut(true);
          setLoading(false);
        }
        return;
      }

      try {
        const [horses, user] = await Promise.all([getAllHorses(), getCurrentUser()]);
        if (cancelled) return;
        setCatalog(horses);
        setOwnedHorses(user.horses);
        setMonies(user.monies);
        // Open on the one in a career, else the first she owns, else the first for sale.
        const running = horses.find(
          (horse: HorseResponseProfile) => currentCopy(horse, user.horses)?.career?.status === "active"
        );
        const owned = horses.find((horse: HorseResponseProfile) => currentCopy(horse, user.horses));
        setSelectedId((running ?? owned ?? horses[0])?._id ?? null);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Erro ao carregar o estábulo.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const entries = useMemo(
    () =>
      catalog.map((horse, index) => ({
        horse,
        number: index + 1,
        copy: currentCopy(horse, ownedHorses)
      })),
    [catalog, ownedHorses]
  );

  const selected = entries.find((entry) => entry.horse._id === selectedId) ?? null;
  const ownedCount = entries.filter((entry) => entry.copy).length;
  const visible = entries.filter(({ copy }) =>
    filter === "owned" ? copy : filter === "forSale" ? !copy : true
  );
  const emptySlots =
    filter === "all"
      ? Math.max(MIN_SLOTS, Math.ceil(entries.length / SLOTS_PER_ROW) * SLOTS_PER_ROW) - entries.length
      : 0;

  useScreenEnter(rootRef, !loading);
  useHoverScale(rootRef, ".Stable__back, .Stable__cta", { hover: 1.03 });
  useHoverScale(rootRef, ".StableTile:not(.StableTile--empty)", { hover: 1.06, press: 0.94 });
  useStaggerIn(gridRef, ".StableTile", [filter, loading], { delay: filter === "all" ? 0.3 : 0, stagger: 0.025 });
  const thumbRef = useSegmentSlider<HTMLSpanElement>(FILTERS.findIndex(({ id }) => id === filter));
  const balanceRef = useCountUp<HTMLElement>(monies, { duration: 0.8, format: (value) => Math.round(value).toLocaleString("pt-BR") });

  const color = selected ? horseColors[selected.horse.name] ?? FALLBACK_COLOR : FALLBACK_COLOR;

  // Switching horse: her colour fades across the card, the art and the watermark slide in.
  useLayoutEffect(() => {
    const hero = heroRef.current;
    if (!hero || !selected) return;
    const first = shownId.current === null;
    shownId.current = selected.horse._id;
    if (first || reduced) {
      gsap.set(hero, { "--hero-color": color });
      return;
    }
    const context = gsap.context(() => {
      gsap.to(hero, { "--hero-color": color, duration: 0.5, ease: "power2.out" });
      gsap.fromTo(".Stable__art", { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: "power3.out" });
      gsap.fromTo(".Stable__watermark", { x: -50, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: "power3.out" });
      gsap.fromTo(".Stable__namecard > *", { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.04, ease: "power2.out" });
      gsap.fromTo(".Stable__badge", { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2)" });
    }, hero);
    return () => context.revert();
    // Plays only when another horse girl is picked.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.horse._id, reduced]);

  // The picked tile's ring springs in; a tile just bought pops out of its lock.
  useLayoutEffect(() => {
    if (reduced || !gridRef.current) return;
    const context = gsap.context(() => {
      gsap.fromTo(".StableTile.is-selected .StableTile__ring", { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2.2)" });
      if (justBought) {
        gsap.fromTo(`[data-id="${justBought}"] .StableTile__portrait`, { scale: 0.4, rotate: -12 }, { scale: 1, rotate: 0, duration: 0.6, ease: "elastic.out(1, 0.55)" });
      }
    }, gridRef);
    return () => context.revert();
  }, [selectedId, justBought, filter, reduced]);

  const handlePurchase = async () => {
    if (!selected || purchasing || selected.copy) return;
    const horse = selected.horse;
    if (monies < horse.cost) return;

    try {
      setPurchasing(true);
      const result = await purchaseHorse(horse._id);
      if (result) {
        setOwnedHorses(result.user.horses);
        setMonies(result.user.monies);
        setBuying(false);
        setJustBought(horse._id);
        confetti({ particleCount: 300, spread: 200, origin: { y: 0.6 }, zIndex: 9999, scalar: 1.4 });
      }
    } catch (purchaseError) {
      console.error("Erro ao comprar a égua:", purchaseError);
    } finally {
      setPurchasing(false);
    }
  };

  const startCareer = () => {
    if (!selected?.copy) return;
    go(`/HorseSelector/Career/${selected.horse._id}`, { color });
  };

  if (loggedOut) {
    return (
      <div className="Stable Stable--message">
        <div className="Stable__notice" role="alertdialog" aria-labelledby="Stable-login">
          <h2 id="Stable-login">Entre para ver o estábulo</h2>
          <p>Você precisa estar logado para escolher sua égua.</p>
          <button type="button" className="Stable__cta" onClick={() => go("/Login")}>
            Ir para o login
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <div className="Stable Stable--message">Carregando...</div>;

  if (error || !selected) {
    return (
      <div className="Stable Stable--message" role="alert">
        {error ?? "Nenhuma égua no catálogo."}
      </div>
    );
  }

  const { horse, copy, number } = selected;
  const shown = copy ?? horse;
  const passive = splitPassive(horse.passiveBuff);
  const career = copy?.career;
  const retired = career?.status === "completed" || career?.status === "failed";
  const shortfall = horse.cost - monies;

  const badge = !copy ? "À VENDA" : retired ? "APOSENTADA" : career?.results.length ? "★ EM CARREIRA" : "★ PRONTA";
  const chips = copy
    ? [
        `Estilo: ${RUNNING_STYLE_LABEL[copy.runningStyle ?? "pace"]}`,
        `${copy.racesWon ?? 0} vitória${copy.racesWon === 1 ? "" : "s"}`,
        `${(copy.fans ?? 0).toLocaleString("pt-BR")} fãs`
      ]
    : [`Preço: ${money(horse.cost)}`, "Ainda não é sua"];

  let cta: { label: string; hint: string; disabled: boolean; onClick: () => void };
  if (!copy) {
    cta =
      shortfall > 0
        ? { label: "SALDO INSUFICIENTE", hint: `faltam ${money(shortfall)}`, disabled: true, onClick: () => undefined }
        : { label: `COMPRAR · ${money(horse.cost)}`, hint: `adicionar ${horse.name} ao estábulo`, disabled: false, onClick: () => setBuying(true) };
  } else if (retired) {
    cta = { label: "VER CARREIRA", hint: `${horse.name} está aposentada`, disabled: false, onClick: startCareer };
  } else if (career?.results.length) {
    cta = { label: "CONTINUAR CARREIRA!", hint: `com ${horse.name}`, disabled: false, onClick: startCareer };
  } else {
    cta = { label: "COMEÇAR CARREIRA!", hint: `com ${horse.name}`, disabled: false, onClick: startCareer };
  }

  return (
    <div ref={rootRef} className="Stable">
      <section
        ref={heroRef}
        className={`Stable__hero${copy ? "" : " is-for-sale"}`}
        aria-label={horse.name}
        data-screen="wedge"
      >
        <span className="Stable__glow" aria-hidden="true" />
        <span className="Stable__watermark" aria-hidden="true">
          {horse.name.split(" ")[0]}
        </span>
        <span className="Stable__badge">{badge}</span>
        <img
          key={horse._id}
          {...horseAnimation(horse.name, "Profile1.gif")}
          alt=""
          className="Stable__art"
          data-screen="art"
        />
        <div className="Stable__namecard">
          <span className="Stable__number">
            Nº {String(number).padStart(2, "0")} · {copy ? "no seu estábulo" : "à venda"}
          </span>
          <h2 className="Stable__name">{horse.name}</h2>
          <ul className="Stable__chips">
            {chips.map((chip) => (
              <li key={chip}>{chip}</li>
            ))}
          </ul>
        </div>
      </section>

      <main className="Stable__content">
        <header className="Stable__header">
          <div data-screen="item">
            <span className="Stable__eyebrow">Estábulo · escolha sua égua</span>
            <div className="Stable__titlerow">
              <h1 className="Stable__title">Estábulo</h1>
              <span className="Stable__count">
                {ownedCount} de {entries.length} desbloqueadas
              </span>
            </div>
          </div>
          <div className="Stable__balance" data-screen="item">
            <span className="Stable__coin" aria-hidden="true">$</span>
            <div>
              <span>Saldo</span>
              <strong ref={balanceRef} />
            </div>
          </div>
        </header>

        <div className="Stable__stats">
          {STATS.map(({ key, label, icon }) => (
            <StableStat key={key} stat={key} label={label} icon={icon} value={shown[key]} />
          ))}
        </div>

        {passive && (
          <div className="Stable__passive" data-screen="item">
            <span className="Stable__passive-tag">Passiva</span>
            {passive.name && <strong>{passive.name}</strong>}
            <p>{passive.text}</p>
          </div>
        )}

        <section className="Stable__roster" aria-labelledby="Stable-roster" data-screen="item">
          <header className="Stable__roster-head">
            <h2 id="Stable-roster">Suas éguas</h2>
            <span className="Stable__count">
              {ownedCount} / {entries.length}
            </span>
            <div className="Stable__filter" role="radiogroup" aria-label="Filtrar éguas">
              <span ref={thumbRef} className="Stable__filter-thumb" aria-hidden="true" />
              {FILTERS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={filter === id}
                  className={filter === id ? "is-active" : undefined}
                  onClick={() => setFilter(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </header>

          <ul ref={gridRef} className="Stable__grid">
            {visible.map((entry) => {
              const isSelected = entry.horse._id === selectedId;
              return (
                <li key={entry.horse._id} data-id={entry.horse._id}>
                  <button
                    type="button"
                    className={
                      "StableTile" +
                      (entry.copy ? "" : " StableTile--locked") +
                      (isSelected ? " is-selected" : "")
                    }
                    style={{ "--tile-color": horseColors[entry.horse.name] ?? FALLBACK_COLOR } as CSSProperties}
                    aria-pressed={isSelected}
                    aria-label={entry.copy ? entry.horse.name : `${entry.horse.name}, à venda por ${money(entry.horse.cost)}`}
                    onClick={() => setSelectedId(entry.horse._id)}
                  >
                    {entry.copy ? (
                      <img className="StableTile__portrait" src={horseAsset(entry.horse.name, "Selection.png")} alt="" />
                    ) : (
                      <>
                        <img className="StableTile__ghost" src={horseAsset(entry.horse.name, "Selection.png")} alt="" />
                        <span className="StableTile__lock" aria-hidden="true" />
                        <span className="StableTile__price">{money(entry.horse.cost)}</span>
                      </>
                    )}
                    {isSelected && (
                      <span className="StableTile__ring" aria-hidden="true">
                        {entry.copy && <span className="StableTile__check">✓</span>}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
            {Array.from({ length: emptySlots }, (_, index) => (
              <li key={`empty-${index}`} aria-hidden="true">
                <span className="StableTile StableTile--empty">?</span>
              </li>
            ))}
          </ul>
          {visible.length === 0 && (
            <p className="Stable__empty">
              {filter === "owned" ? "Você ainda não tem nenhuma égua." : "Você já tem todas as éguas à venda!"}
            </p>
          )}
        </section>

        <footer className="Stable__actions" data-screen="item">
          <button type="button" className="Stable__back" onClick={() => go("/")}>
            VOLTAR
            <span>menu principal</span>
          </button>
          <button type="button" className="Stable__cta" disabled={cta.disabled} onClick={cta.onClick}>
            {cta.label}
            <span>{cta.hint}</span>
          </button>
        </footer>
      </main>

      {buying && !copy && (
        <PurchaseModal
          horse={horse}
          userMoney={monies}
          onPurchase={handlePurchase}
          onCancel={() => setBuying(false)}
          isPurchasing={purchasing}
        />
      )}
    </div>
  );
};

export default Stable;
