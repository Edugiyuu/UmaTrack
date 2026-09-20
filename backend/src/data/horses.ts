export interface HorseSeed {
  name: string;
  passiveBuff: string;
  speed: number;
  stamina: number;
  power: number;
  wit: number;
  cost: number;
}

/**
 * Starting roster. Only the horse girls that already have selection art in
 * `frontend/public/horses/<Name>/Selection.png` are seeded, so the shop never shows a
 * broken card; add a new entry here once the art for another one lands.
 *
 * The numbers are tuned against the easiest track (Sapporo Sprint, which asks for
 * speed 60 / stamina 35 / power 50 / wit 30), so a fresh save can already enter a race
 * and still has a long way to go before Tokyo or Kokura are realistic.
 */
export const HORSE_CATALOG: HorseSeed[] = [
  {
    name: "Nice Nature",
    passiveBuff: "Sorte de bronze: ganha skill points extras ao terminar no pódio.",
    speed: 58,
    stamina: 62,
    power: 54,
    wit: 78,
    cost: 600
  },
  {
    name: "Silence Suzuka",
    passiveBuff: "Fuga silenciosa: larga na frente e brilha em pistas planas.",
    speed: 84,
    stamina: 48,
    power: 60,
    wit: 52,
    cost: 1400
  },
  {
    name: "Special Week",
    passiveBuff: "Coração de campeã: rende mais quanto mais longa for a prova.",
    speed: 66,
    stamina: 74,
    power: 64,
    wit: 58,
    cost: 1100
  },
  {
    name: "Oguri Cap",
    passiveBuff: "Monstro cinzento: força bruta para subidas e piso pesado.",
    speed: 62,
    stamina: 66,
    power: 82,
    wit: 50,
    cost: 1200
  },
  {
    name: "Grass Wonder",
    passiveBuff: "Asas de vidro: aceleração explosiva na reta final.",
    speed: 72,
    stamina: 58,
    power: 70,
    wit: 62,
    cost: 1000
  }
];
