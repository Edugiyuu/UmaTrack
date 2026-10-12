import { useEffect, useRef, useState } from "react";
import TrackProfile from "../TrackProfile/TrackProfile";
import { getTracks } from "../../services/Race";
import {
  CATEGORY_LABEL,
  RUNNING_STYLE_HINT,
  RUNNING_STYLE_LABEL,
  STAT_LABEL,
  SURFACE_LABEL,
  TERRAIN_LABEL
} from "../../constants/trackVisuals";
import { useScreenEnter } from "../../animations/screen";
import { useHoverScale } from "../../animations/useHoverScale";
import { useScrollReveal } from "../../animations/useScrollReveal";
import type { RunningStyle, StatName, TrackResponse } from "../../types/race";
import speedIcon from "../../assets/gameIcons/speedIcon.png";
import staminaIcon from "../../assets/gameIcons/staminaIcon.png";
import powerIcon from "../../assets/gameIcons/powerIcon.png";
import witIcon from "../../assets/gameIcons/witIcon.png";
import "../CatalogPage/CatalogPage.css";
import "./GuideContent.css";

const STATS: StatName[] = ["speed", "stamina", "power", "wit"];

const LOOP = ["Comprar", "Treinar", "Aprender skills", "Correr", "Repetir"];

/** Where each style sits in the pack: dot 1 is the front, dot 5 the back. */
const STYLES: { style: RunningStyle; spot: number; place: string }[] = [
  { style: "front", spot: 0, place: "Frente do pelotão" },
  { style: "pace", spot: 1, place: "Logo atrás da líder" },
  { style: "late", spot: 3, place: "Meio para trás" },
  { style: "end", spot: 4, place: "Fundo do pelotão" }
];

const ATTRIBUTES: { stat: StatName; icon: string; text: string }[] = [
  {
    stat: "speed",
    icon: speedIcon,
    text: "É o teto: a velocidade máxima que ela alcança, em metros por turno. Correr mais rápido também gasta mais fôlego."
  },
  {
    stat: "stamina",
    icon: staminaIcon,
    text: "É o tamanho do tanque. Cada turno gasta mais quanto mais rápido ela corre e quanto mais perto do fim. Se zerar, a velocidade máxima cai pela metade."
  },
  {
    stat: "power",
    icon: powerIcon,
    text: "A arrancada: ela larga com metade do Power e ganha Power ÷ 6 por turno até o teto. É o que a faz recuperar a velocidade perdida em cada curva."
  },
  {
    stat: "wit",
    icon: witIcon,
    text: "Economiza fôlego (150 de Wit gasta 30% menos) e aumenta a chance de as skills dispararem."
  }
];

/**
 * How to play, v2 (Figma "GuideScreen v2"): the game loop, the four stats, training,
 * running styles and the tracks with their elevation. The intro assembles on load; each
 * section rises in as it scrolls into view and the track profiles draw themselves.
 */
const GuideContent = () => {
  const [tracks, setTracks] = useState<TrackResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    getTracks(controller.signal)
      .then(setTracks)
      .catch((fetchError: unknown) => {
        if (controller.signal.aborted) return;
        setError(fetchError instanceof Error ? fetchError.message : "Erro ao buscar pistas.");
      });

    return () => controller.abort();
  }, []);

  useScreenEnter(rootRef);
  useScrollReveal(rootRef, "[data-reveal]", [tracks.length], { wipe: ".TrackProfile" });
  useHoverScale(rootRef, ".GuideContent__track, .GuideContent__attribute", { hover: 1.015, press: 1 });

  return (
    <div className="CatalogPage GuideContent" ref={rootRef}>
      <div className="CatalogPage__inner">
        <header className="GuideContent__intro">
          <p className="CatalogPage__eyebrow" data-screen="item">Guia · Como jogar</p>
          <h1 className="CatalogPage__title" data-screen="item">Como jogar</h1>
          <p className="CatalogPage__lead" data-screen="item">
            O ciclo do jogo: comprar uma garota-cavalo, treinar durante os turnos, gastar os
            skill points em skills e levar ela para a pista certa. O prêmio da corrida devolve
            os turnos e paga o próximo treino.
          </p>
          <ol className="GuideContent__loop">
            {LOOP.map((step, index) => (
              <li key={step} data-screen="item">
                <span>{index + 1}</span>
                {step}
                {index === LOOP.length - 1 && <i aria-hidden="true"> ↺</i>}
              </li>
            ))}
          </ol>
        </header>

        <section className="GuideContent__section">
          <h2 className="CatalogPage__section-title" data-reveal>Os quatro atributos</h2>
          <div className="GuideContent__attributes">
            {ATTRIBUTES.map(({ stat, icon, text }) => (
              <article key={stat} className={`GuideContent__attribute GuideContent__attribute--${stat}`} data-reveal>
                <header>
                  <span className="GuideContent__attribute-icon">
                    <img src={icon} alt="" />
                  </span>
                  <h3>{STAT_LABEL[stat]}</h3>
                </header>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="GuideContent__section">
          <h2 className="CatalogPage__section-title" data-reveal>Treino</h2>
          <div className="GuideContent__training">
            <div className="GuideContent__training-text CatalogPage__card" data-reveal>
              <p>
                Cada treino gasta <strong>1 turno</strong> e <strong>20 de energia</strong>. O
                ganho não é fixo: depende de quanto você acertou no minigame, da afinidade dela
                com aquele tipo de treino, da energia que sobrou e de quão alto o atributo já
                está — quanto mais alto, mais caro fica cada ponto. Treinar também rende skill
                points, com bônus se o round for perfeito.
              </p>
              <p>
                Com a energia baixa o treino rende menos e pode até dar errado.{" "}
                <strong>Descansar</strong> gasta um turno e devolve energia. Terminar uma corrida
                abre a próxima temporada e repõe os turnos.
              </p>
            </div>
            <ul className="GuideContent__tiles">
              <li data-reveal>
                <strong>1 turno</strong>
                <span>por treino</span>
              </li>
              <li className="GuideContent__tile--energy" data-reveal>
                <strong>−20</strong>
                <span>de energia por treino</span>
              </li>
              <li className="GuideContent__tile--sp" data-reveal>
                <strong>+SP</strong>
                <span>bônus no round perfeito</span>
              </li>
              <li className="GuideContent__tile--rest" data-reveal>
                <strong>Descansar</strong>
                <span>1 turno · devolve energia</span>
              </li>
            </ul>
          </div>
        </section>

        <section className="GuideContent__section">
          <h2 className="CatalogPage__section-title" data-reveal>Estratégias de corrida</h2>
          <p className="GuideContent__notice" data-reveal>
            <span aria-hidden="true">!</span>
            Por enquanto a estratégia escolhida ainda não muda a corrida: todas correm do mesmo
            jeito. Ela volta a valer numa próxima versão do motor.
          </p>
          <div className="GuideContent__styles">
            {STYLES.map(({ style, spot, place }) => (
              <article key={style} className="CatalogPage__card" data-reveal>
                <header>
                  <h3>{RUNNING_STYLE_LABEL[style]}</h3>
                  <span className="GuideContent__pack" aria-label={place}>
                    {[0, 1, 2, 3, 4].map((dot) => (
                      <i key={dot} className={dot === spot ? "is-her" : undefined} />
                    ))}
                  </span>
                </header>
                <p>{RUNNING_STYLE_HINT[style]}</p>
                <small>{place}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="GuideContent__section">
          <h2 className="CatalogPage__section-title" data-reveal>As pistas</h2>
          <p className="GuideContent__text" data-reveal>
            A corrida acontece em turnos: a cada turno ela avança tantos metros quanto a
            velocidade dela, e cada curva divide essa velocidade por 1,2. Os mínimos abaixo são{" "}
            <strong>recomendados</strong>: quem está exatamente neles chega no limite do fôlego.
            Abaixo disso, o tanque tende a secar antes da linha.
          </p>

          {error && <p className="GuideContent__error" role="alert">{error}</p>}

          <div className="GuideContent__tracks">
            {tracks.map((track) => {
              const maxGrade = track.segments.reduce((max, segment) => Math.max(max, segment.grade), 0);
              return (
                <article key={track._id} className="GuideContent__track CatalogPage__card" data-reveal>
                  <header>
                    <div>
                      <h3>{track.name}</h3>
                      <span>{CATEGORY_LABEL[track.category]} · {SURFACE_LABEL[track.surface]}</span>
                    </div>
                    <strong className="GuideContent__distance">{track.distance}m</strong>
                  </header>
                  <TrackProfile segments={track.segments} distance={track.distance} height={60} />
                  <p className="GuideContent__terrain">
                    {TERRAIN_LABEL[track.terrain]}
                    {maxGrade > 0 && ` · subida máxima de ${maxGrade}%`}
                  </p>
                  <div className="GuideContent__requirements">
                    <span>Recomendado</span>
                    <ul>
                      {STATS.map((stat) => (
                        <li key={stat} className={`GuideContent__req GuideContent__req--${stat}`}>
                          {STAT_LABEL[stat]} {track.requirements[stat]}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default GuideContent;
