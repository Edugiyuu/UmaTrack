import type { SkillEffectKind, SkillPhase, SkillRarity, SkillTerrain, StatName } from "../models/skill";

export interface SkillSeed {
  slug: string;
  name: string;
  description: string;
  rarity: SkillRarity;
  cost: number;
  effect: {
    kind: SkillEffectKind;
    stat?: StatName;
    value: number;
    duration: number;
  };
  trigger: {
    phase: SkillPhase;
    terrain: SkillTerrain;
    baseChance: number;
    maxStaminaRatio?: number;
    minPosition?: number;
  };
}

/**
 * Skill catalogue. `effect.value` is read by the race engine and its unit depends on
 * `effect.kind`: m/turn added on top of the runner's speed for speedBoost / startDash /
 * cornerBoost, a multiplier for accelBoost, a fraction of the stamina bar for
 * staminaRecover / staminaSave, a fraction of the slope penalty cancelled for
 * inclineBoost (no effect while the turn engine ignores slopes), and raw stat points
 * for flatStat. `duration` is in turns and `trigger.baseChance` is per turn.
 */
export const SKILL_CATALOG: SkillSeed[] = [
  // --- Largada ---
  {
    slug: "concentration",
    name: "Concentração",
    description: "Largada limpa: ganha impulso nos primeiros metros da corrida.",
    rarity: "common",
    cost: 60,
    effect: { kind: "startDash", value: 7, duration: 1 },
    trigger: { phase: "opening", terrain: "any", baseChance: 0.75 }
  },
  {
    slug: "gate-burst",
    name: "Explosão de Portão",
    description: "Aceleração brutal logo após o portão abrir.",
    rarity: "rare",
    cost: 130,
    effect: { kind: "accelBoost", value: 0.45, duration: 1 },
    trigger: { phase: "opening", terrain: "any", baseChance: 0.6 }
  },

  // --- Velocidade ---
  {
    slug: "homestretch-surge",
    name: "Arrancada Final",
    description: "Um salto de velocidade quando a reta final aparece.",
    rarity: "common",
    cost: 90,
    effect: { kind: "speedBoost", value: 5, duration: 1 },
    trigger: { phase: "final", terrain: "any", baseChance: 0.25 }
  },
  {
    slug: "lightning-step",
    name: "Passo Relâmpago",
    description: "Cadência perfeita na reta: velocidade extra em piso plano.",
    rarity: "rare",
    cost: 160,
    effect: { kind: "speedBoost", value: 8, duration: 1 },
    trigger: { phase: "middle", terrain: "straight", baseChance: 0.2 }
  },
  {
    slug: "last-spurt",
    name: "Último Fôlego",
    description: "Tudo o que sobrou nos metros finais.",
    rarity: "unique",
    cost: 240,
    effect: { kind: "speedBoost", value: 11, duration: 1 },
    trigger: { phase: "spurt", terrain: "any", baseChance: 0.4 }
  },

  // --- Fôlego ---
  {
    slug: "steady-breathing",
    name: "Respiração Constante",
    description: "Economiza fôlego durante o meio da prova.",
    rarity: "common",
    cost: 80,
    effect: { kind: "staminaSave", value: 0.2, duration: 2 },
    trigger: { phase: "middle", terrain: "any", baseChance: 0.2 }
  },
  {
    slug: "second-wind",
    name: "Segundo Fôlego",
    description: "Recupera fôlego quando o tanque está quase vazio.",
    rarity: "rare",
    cost: 170,
    effect: { kind: "staminaRecover", value: 0.18, duration: 0 },
    trigger: { phase: "any", terrain: "any", baseChance: 0.3, maxStaminaRatio: 0.3 }
  },
  {
    slug: "iron-lungs",
    name: "Pulmões de Ferro",
    description: "Aumenta permanentemente a resistência durante a prova.",
    rarity: "common",
    cost: 110,
    effect: { kind: "flatStat", stat: "stamina", value: 25, duration: 0 },
    trigger: { phase: "any", terrain: "any", baseChance: 1 }
  },

  // --- Subida / Power ---
  {
    slug: "hill-climber",
    name: "Escaladora",
    description: "Reduz boa parte da perda de velocidade nas subidas.",
    rarity: "common",
    cost: 120,
    effect: { kind: "inclineBoost", value: 0.35, duration: 1 },
    trigger: { phase: "any", terrain: "uphill", baseChance: 0.35 }
  },
  {
    slug: "mountain-heart",
    name: "Coração de Montanha",
    description: "Quase ignora a inclinação nas rampas mais duras.",
    rarity: "unique",
    cost: 260,
    effect: { kind: "inclineBoost", value: 0.7, duration: 2 },
    trigger: { phase: "any", terrain: "uphill", baseChance: 0.45 }
  },
  {
    slug: "downhill-glide",
    name: "Planagem",
    description: "Aproveita cada descida para ganhar embalo.",
    rarity: "common",
    cost: 95,
    effect: { kind: "speedBoost", value: 6, duration: 1 },
    trigger: { phase: "any", terrain: "downhill", baseChance: 0.4 }
  },
  {
    slug: "raw-power",
    name: "Força Bruta",
    description: "Empurra o corpo inteiro a cada passada. Power extra na prova.",
    rarity: "common",
    cost: 110,
    effect: { kind: "flatStat", stat: "power", value: 25, duration: 0 },
    trigger: { phase: "any", terrain: "any", baseChance: 1 }
  },

  // --- Curvas / Wit ---
  {
    slug: "corner-adept",
    name: "Especialista em Curva",
    description: "Traça a curva por dentro e perde menos velocidade.",
    rarity: "common",
    cost: 100,
    effect: { kind: "cornerBoost", value: 5, duration: 1 },
    trigger: { phase: "any", terrain: "corner", baseChance: 0.35 }
  },
  {
    slug: "race-reader",
    name: "Leitura de Prova",
    description: "Lê o pelotão e escolhe a hora certa de atacar quando está atrás.",
    rarity: "rare",
    cost: 150,
    effect: { kind: "speedBoost", value: 7, duration: 1 },
    trigger: { phase: "final", terrain: "any", baseChance: 0.3, minPosition: 4 }
  },
  {
    slug: "pace-keeper",
    name: "Ritmista",
    description: "Mantém o ritmo ideal e gasta menos fôlego a prova inteira.",
    rarity: "rare",
    cost: 180,
    effect: { kind: "staminaSave", value: 0.15, duration: 4 },
    trigger: { phase: "any", terrain: "any", baseChance: 0.2 }
  },
  {
    slug: "keen-eye",
    name: "Olhar Aguçado",
    description: "Percepção apurada: Wit extra durante a prova.",
    rarity: "common",
    cost: 110,
    effect: { kind: "flatStat", stat: "wit", value: 25, duration: 0 },
    trigger: { phase: "any", terrain: "any", baseChance: 1 }
  },
  {
    slug: "sprint-gear",
    name: "Marcha de Sprint",
    description: "Velocidade extra durante toda a prova.",
    rarity: "common",
    cost: 110,
    effect: { kind: "flatStat", stat: "speed", value: 25, duration: 0 },
    trigger: { phase: "any", terrain: "any", baseChance: 1 }
  }
];
