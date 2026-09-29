import { useEffect, useState } from "react";
import TrackProfile from "../TrackProfile/TrackProfile";
import { getTracks } from "../../services/Race";
import {
  CATEGORY_LABEL,
  RUNNING_STYLE_HINT,
  RUNNING_STYLE_LABEL,
  SURFACE_LABEL,
  TERRAIN_LABEL
} from "../../constants/trackVisuals";
import type { RunningStyle, TrackResponse } from "../../types/race";
import speedIcon from "../../assets/gameIcons/speedIcon.png";
import staminaIcon from "../../assets/gameIcons/staminaIcon.png";
import powerIcon from "../../assets/gameIcons/powerIcon.png";
import witIcon from "../../assets/gameIcons/witIcon.png";
import "./GuideContent.css";

const STYLES: RunningStyle[] = ["front", "pace", "late", "end"];

const ATTRIBUTES = [
  {
    icon: speedIcon,
    name: "Speed",
    text: "É o teto: a velocidade máxima que ela alcança, em metros por turno. Correr mais rápido também gasta mais fôlego."
  },
  {
    icon: staminaIcon,
    name: "Stamina",
    text: "É o tamanho do tanque. Cada turno gasta mais quanto mais rápido ela corre e quanto mais perto do fim. Se zerar, a velocidade máxima cai pela metade."
  },
  {
    icon: powerIcon,
    name: "Power",
    text: "A arrancada: ela larga com metade do Power e ganha Power ÷ 6 por turno até o teto. É o que a faz recuperar a velocidade perdida em cada curva."
  },
  {
    icon: witIcon,
    name: "Wit",
    text: "Economiza fôlego (150 de Wit gasta 30% menos) e aumenta a chance de as skills dispararem."
  }
];

const GuideContent = () => {
  const [tracks, setTracks] = useState<TrackResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="GuideContent">
      <header className="GuideContent__intro">
        <h1>Como jogar</h1>
        <p>
          O ciclo do jogo: comprar uma garota-cavalo, treinar durante os turnos, gastar os
          skill points em skills e levar ela para a pista certa. O prêmio da corrida devolve
          os turnos e paga o próximo treino.
        </p>
        <ol className="GuideContent__loop">
          <li><span>1</span> Comprar</li>
          <li><span>2</span> Treinar</li>
          <li><span>3</span> Aprender skills</li>
          <li><span>4</span> Correr</li>
          <li><span>5</span> Repetir</li>
        </ol>
      </header>

      <section className="GuideContent__section">
        <h2>Os quatro atributos</h2>
        <div className="GuideContent__attributes">
          {ATTRIBUTES.map((attribute) => (
            <article key={attribute.name}>
              <img src={attribute.icon} alt="" />
              <h3>{attribute.name}</h3>
              <p>{attribute.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="GuideContent__section">
        <h2>Treino</h2>
        <p className="GuideContent__text">
          Cada treino gasta <strong>1 turno</strong> e <strong>20 de energia</strong>. O ganho
          não é fixo: depende de quanto você acertou no minigame, da afinidade dela com aquele
          tipo de treino, da energia que sobrou e de quão alto o atributo já está —
          quanto mais alto, mais caro fica cada ponto. Treinar também rende skill points, com
          bônus se o round for perfeito.
        </p>
        <p className="GuideContent__text">
          Com a energia baixa o treino rende menos e pode até dar errado. <strong>Descansar</strong>{" "}
          gasta um turno e devolve energia. Terminar uma corrida abre a próxima
          temporada e repõe os turnos.
        </p>
      </section>

      <section className="GuideContent__section">
        <h2>Estratégias de corrida</h2>
        <p className="GuideContent__text">
          Por enquanto a estratégia escolhida ainda não muda a corrida: todas correm do mesmo
          jeito. Ela volta a valer numa próxima versão do motor.
        </p>
        <div className="GuideContent__styles">
          {STYLES.map((style) => (
            <article key={style}>
              <h3>{RUNNING_STYLE_LABEL[style]}</h3>
              <p>{RUNNING_STYLE_HINT[style]}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="GuideContent__section">
        <h2>As pistas</h2>
        <p className="GuideContent__text">
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
              <article key={track._id}>
                <header>
                  <h3>{track.name}</h3>
                  <span>{track.distance}m · {CATEGORY_LABEL[track.category]} · {SURFACE_LABEL[track.surface]}</span>
                </header>
                <TrackProfile segments={track.segments} distance={track.distance} height={48} />
                <p className="GuideContent__track-terrain">
                  {TERRAIN_LABEL[track.terrain]}
                  {maxGrade > 0 && ` · subida máxima de ${maxGrade}%`}
                </p>
                <p className="GuideContent__track-req">
                  Recomendado: Speed {track.requirements.speed} · Stamina {track.requirements.stamina} ·
                  {" "}Power {track.requirements.power} · Wit {track.requirements.wit}
                </p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default GuideContent;
