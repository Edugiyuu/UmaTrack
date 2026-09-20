import HakodateTrack from "../assets/tracks/HakodateTrack.png";
import KokuraTrack from "../assets/tracks/KokuraTrack.png";
import KyotoTrack from "../assets/tracks/KyotoTrack.png";
import NiigataTrack from "../assets/tracks/NiigataTrack.png";
import SapporoTrack from "../assets/tracks/SapporoTrack.png";
import TokyoTrack from "../assets/tracks/TokyoTrack.png";
import type { TrackCategory, TrackSurface, TrackTerrain } from "../types/race";

/** Track art, keyed by the `image` file name the backend catalogue declares. */
const TRACK_IMAGES: Record<string, string> = {
  "HakodateTrack.png": HakodateTrack,
  "KokuraTrack.png": KokuraTrack,
  "KyotoTrack.png": KyotoTrack,
  "NiigataTrack.png": NiigataTrack,
  "SapporoTrack.png": SapporoTrack,
  "TokyoTrack.png": TokyoTrack
};

export const trackImage = (image?: string) => (image ? TRACK_IMAGES[image] : undefined);

export const TERRAIN_LABEL: Record<TrackTerrain, string> = {
  flat: "Plana",
  incline: "Íngreme",
  rolling: "Ondulada",
  technical: "Técnica"
};

export const SURFACE_LABEL: Record<TrackSurface, string> = {
  turf: "Grama",
  dirt: "Areia"
};

export const CATEGORY_LABEL: Record<TrackCategory, string> = {
  sprint: "Sprint",
  mile: "Milha",
  medium: "Média",
  long: "Longa"
};

export const STAT_LABEL = {
  speed: "Speed",
  stamina: "Stamina",
  power: "Power",
  wit: "Wit"
} as const;

export const RUNNING_STYLE_LABEL = {
  front: "Fugitiva",
  pace: "Ponta",
  late: "Perseguidora",
  end: "Fechadora"
} as const;

export const RUNNING_STYLE_HINT = {
  front: "Dispara na largada e tenta segurar até o fim.",
  pace: "Ritmo constante do início ao fim.",
  late: "Guarda energia e ataca na reta final.",
  end: "Fica no fundo e aposta tudo nos últimos 20%."
} as const;
