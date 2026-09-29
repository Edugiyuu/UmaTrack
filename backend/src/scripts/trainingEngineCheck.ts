/**
 * Sanity check for the dynamic training rules:
 *
 *   npm run training:check
 */
import { resolveRest, resolveTraining } from "../services/trainingEngine";
import { MAX_ENERGY } from "../models/user";

const fixedRandom = () => 0.5;

let failures = 0;
const check = (label: string, passed: boolean, detail = "") => {
  console.log(`${passed ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!passed) failures += 1;
};

const base = {
  stats: { speed: 100, stamina: 100, power: 100, wit: 100 },
  trainType: "speed" as const,
  maxScore: 10,
  energy: 100,
  random: fixedRandom
};

const perfect = resolveTraining({ ...base, score: 10 });
const poor = resolveTraining({ ...base, score: 2 });
check("a better round gives more stats", perfect.statGain > poor.statGain,
  `${perfect.statGain} x ${poor.statGain}`);
check("a perfect round pays a skill point bonus", perfect.skillPointsGained > poor.skillPointsGained + 5);
check("even a bad round gives something", poor.statGain >= 1);

const lowStat = resolveTraining({ ...base, score: 10, stats: { ...base.stats, speed: 20 } });
const highStat = resolveTraining({ ...base, score: 10, stats: { ...base.stats, speed: 400 } });
check("gains shrink as the stat grows", highStat.statGain < lowStat.statGain,
  `speed 20 -> ${lowStat.statGain}, speed 400 -> ${highStat.statGain}`);

const tired = resolveTraining({ ...base, score: 10, energy: 15 });
check("low energy cuts the gain", tired.statGain < perfect.statGain,
  `${tired.statGain} x ${perfect.statGain}`);

const powerType = resolveTraining({
  ...base,
  score: 10,
  trainType: "power",
  stats: { speed: 80, stamina: 80, power: 160, wit: 80 }
});
const offType = resolveTraining({
  ...base,
  score: 10,
  trainType: "wit",
  stats: { speed: 80, stamina: 80, power: 160, wit: 80 }
});
check("she grows faster in her own speciality", powerType.statGain > offType.statGain,
  `power ${powerType.statGain} x wit ${offType.statGain}`);

const exhausted = resolveTraining({ ...base, score: 10, energy: 0, random: () => 0.01 });
check("training on an empty tank can go wrong", exhausted.failed);

check("resting refills energy", resolveRest(40).energy > 40);
check("resting never goes over the cap", resolveRest(MAX_ENERGY - 5).energy === MAX_ENERGY);

console.log(failures === 0 ? "\nAll training checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
