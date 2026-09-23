import type { TrackCategory, TrackSurface, TrackTerrain } from "../models/track";

export interface TrackSegmentSeed {
  label: string;
  lengthRatio: number;
  grade: number;
  curve: number;
}

export interface TrackSeed {
  slug: string;
  name: string;
  location: string;
  description: string;
  image: string;
  distance: number;
  category: TrackCategory;
  surface: TrackSurface;
  terrain: TrackTerrain;
  segments: TrackSegmentSeed[];
  statWeights: { speed: number; stamina: number; power: number; wit: number };
  requirements: { speed: number; stamina: number; power: number; wit: number };
  fieldSize: number;
  difficulty: number;
  entryFee: number;
  prizeMoney: number[];
  fansReward: number;
  skillPointReward: number;
}

/**
 * Starting track catalogue. Every track leans on a different stat so that a horse
 * girl trained in a single direction cannot win everywhere: Sapporo rewards raw
 * speed, Kokura is a climb that demands power, Tokyo punishes a thin stamina bar.
 */
export const TRACK_CATALOG: TrackSeed[] = [
  {
    slug: "sapporo-sprint",
    name: "Sapporo Sprint",
    location: "Sapporo",
    description:
      "Pista curta e totalmente plana. Quem tem velocidade pura larga na frente e não olha para trás.",
    image: "SapporoTrack.png",
    distance: 1200,
    category: "sprint",
    surface: "turf",
    terrain: "flat",
    segments: [
      { label: "Largada", lengthRatio: 0.2, grade: 0, curve: 0 },
      { label: "Reta de fundo", lengthRatio: 0.35, grade: 0, curve: 0.1 },
      { label: "Curva final", lengthRatio: 0.2, grade: 0, curve: 0.55 },
      { label: "Reta final", lengthRatio: 0.25, grade: 0, curve: 0 }
    ],
    statWeights: { speed: 1.35, stamina: 0.55, power: 1.05, wit: 0.85 },
    requirements: { speed: 60, stamina: 35, power: 50, wit: 30 },
    fieldSize: 8,
    difficulty: 1,
    entryFee: 0,
    prizeMoney: [900, 450, 240, 120, 60],
    fansReward: 300,
    skillPointReward: 25
  },
  {
    slug: "niigata-mile",
    name: "Niigata Mile",
    location: "Niigata",
    description:
      "Reta longuíssima e sem desníveis. Posicionamento e leitura de corrida valem tanto quanto velocidade.",
    image: "NiigataTrack.png",
    distance: 1600,
    category: "mile",
    surface: "turf",
    terrain: "flat",
    segments: [
      { label: "Largada", lengthRatio: 0.15, grade: 0, curve: 0 },
      { label: "Primeira curva", lengthRatio: 0.2, grade: -0.5, curve: 0.45 },
      { label: "Reta de fundo", lengthRatio: 0.3, grade: 0, curve: 0 },
      { label: "Curva final", lengthRatio: 0.15, grade: 0.5, curve: 0.5 },
      { label: "Reta final", lengthRatio: 0.2, grade: 0, curve: 0 }
    ],
    statWeights: { speed: 1.15, stamina: 0.9, power: 0.95, wit: 1.15 },
    requirements: { speed: 75, stamina: 65, power: 60, wit: 70 },
    fieldSize: 10,
    difficulty: 3,
    entryFee: 120,
    prizeMoney: [1800, 900, 480, 240, 120],
    fansReward: 700,
    skillPointReward: 40
  },
  {
    slug: "hakodate-rolling",
    name: "Hakodate Rolling",
    location: "Hakodate",
    description:
      "Sobe e desce o tempo todo. Trocar de ritmo a cada ondulação cansa quem não tem fôlego.",
    image: "HakodateTrack.png",
    distance: 1800,
    category: "mile",
    surface: "turf",
    terrain: "rolling",
    segments: [
      { label: "Largada", lengthRatio: 0.12, grade: 1.5, curve: 0 },
      { label: "Primeira subida", lengthRatio: 0.18, grade: 3, curve: 0.3 },
      { label: "Descida do fundo", lengthRatio: 0.2, grade: -3, curve: 0.2 },
      { label: "Segunda subida", lengthRatio: 0.2, grade: 2.5, curve: 0.5 },
      { label: "Descida da curva", lengthRatio: 0.15, grade: -2, curve: 0.6 },
      { label: "Reta final", lengthRatio: 0.15, grade: 1, curve: 0 }
    ],
    statWeights: { speed: 1, stamina: 1.2, power: 1.25, wit: 1 },
    requirements: { speed: 80, stamina: 90, power: 95, wit: 70 },
    fieldSize: 10,
    difficulty: 4,
    entryFee: 200,
    prizeMoney: [2400, 1200, 640, 320, 160],
    fansReward: 950,
    skillPointReward: 50
  },
  {
    slug: "kyoto-downhill",
    name: "Kyoto Downhill",
    location: "Kyoto",
    description:
      "A famosa descida da terceira curva embala quem souber a hora certa de acelerar — e derruba quem errar.",
    image: "KyotoTrack.png",
    distance: 2200,
    category: "medium",
    surface: "turf",
    terrain: "technical",
    segments: [
      { label: "Largada", lengthRatio: 0.1, grade: 0, curve: 0 },
      { label: "Subida da colina", lengthRatio: 0.18, grade: 3.5, curve: 0.25 },
      { label: "Topo", lengthRatio: 0.12, grade: 0, curve: 0.35 },
      { label: "Descida da terceira curva", lengthRatio: 0.2, grade: -4, curve: 0.7 },
      { label: "Quarta curva", lengthRatio: 0.2, grade: 0, curve: 0.8 },
      { label: "Reta final", lengthRatio: 0.2, grade: 0, curve: 0 }
    ],
    statWeights: { speed: 1.05, stamina: 1.15, power: 1.05, wit: 1.35 },
    requirements: { speed: 95, stamina: 110, power: 90, wit: 110 },
    fieldSize: 12,
    difficulty: 6,
    entryFee: 350,
    prizeMoney: [4200, 2100, 1100, 550, 280],
    fansReward: 1600,
    skillPointReward: 65
  },
  {
    slug: "tokyo-classic",
    name: "Tokyo Classic",
    location: "Tokyo",
    description:
      "525 metros de reta final com uma subida traiçoeira no meio. Sem fôlego, ninguém chega inteira.",
    image: "TokyoTrack.png",
    distance: 2400,
    category: "long",
    surface: "turf",
    terrain: "incline",
    segments: [
      { label: "Largada", lengthRatio: 0.1, grade: 0, curve: 0 },
      { label: "Reta de fundo", lengthRatio: 0.25, grade: -1, curve: 0.15 },
      { label: "Terceira curva", lengthRatio: 0.15, grade: 0.5, curve: 0.55 },
      { label: "Quarta curva", lengthRatio: 0.15, grade: 1, curve: 0.65 },
      { label: "Subida da reta final", lengthRatio: 0.2, grade: 4, curve: 0 },
      { label: "Últimos 300m", lengthRatio: 0.15, grade: -0.5, curve: 0 }
    ],
    statWeights: { speed: 1.1, stamina: 1.4, power: 1.15, wit: 1.05 },
    requirements: { speed: 110, stamina: 150, power: 115, wit: 100 },
    fieldSize: 14,
    difficulty: 8,
    entryFee: 600,
    prizeMoney: [8000, 4000, 2100, 1050, 520],
    fansReward: 3000,
    skillPointReward: 85
  },
  {
    slug: "kokura-climb",
    name: "Kokura Mountain Climb",
    location: "Kokura",
    description:
      "A pista mais íngreme do circuito: quase toda em subida e no barro. Só passa quem tem POWER de sobra.",
    image: "KokuraTrack.png",
    distance: 2000,
    category: "medium",
    surface: "dirt",
    terrain: "incline",
    segments: [
      { label: "Largada em rampa", lengthRatio: 0.12, grade: 2.5, curve: 0 },
      { label: "Primeira rampa", lengthRatio: 0.2, grade: 5, curve: 0.3 },
      { label: "Patamar", lengthRatio: 0.13, grade: 1, curve: 0.45 },
      { label: "Parede do fundo", lengthRatio: 0.2, grade: 6.5, curve: 0.35 },
      { label: "Curva de descida", lengthRatio: 0.15, grade: -2.5, curve: 0.75 },
      { label: "Rampa final", lengthRatio: 0.2, grade: 5.5, curve: 0 }
    ],
    statWeights: { speed: 0.85, stamina: 1.25, power: 1.6, wit: 0.95 },
    requirements: { speed: 95, stamina: 130, power: 175, wit: 90 },
    fieldSize: 12,
    difficulty: 9,
    entryFee: 500,
    prizeMoney: [7000, 3500, 1800, 900, 450],
    fansReward: 2600,
    skillPointReward: 90
  }
];
