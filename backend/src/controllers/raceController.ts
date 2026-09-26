import { Response } from 'express';
import mongoose from 'mongoose';
import Track from '../models/track';
import Skill from '../models/skill';
import RaceResult from '../models/raceResult';
import { MAX_ENERGY, MAX_MOOD, RUNNING_STYLES, type RunningStyle } from '../models/user';
import type { AuthenticatedRequest } from '../middleware/authMiddleware';
import { findOwnedHorse, serializeOwnedHorse } from '../services/ownedHorse';
import { simulateRace } from '../services/raceEngine';
import { generateRivals } from '../services/rivalGenerator';
import type { RaceSkill, RaceTrackInput } from '../types/race';

/** Energy a single race burns. */
const RACE_ENERGY_COST = 35;
/** Training turns handed back once a race is over, i.e. the next season. */
const TURNS_PER_SEASON = 5;

/** Share of the track rewards handed out for each finishing position. */
const placementFactor = (placement: number) => {
  if (placement === 1) return 1;
  if (placement === 2) return 0.6;
  if (placement === 3) return 0.42;
  if (placement <= 5) return 0.28;
  return 0.15;
};

const toRaceSkill = (skill: InstanceType<typeof Skill>): RaceSkill => ({
  slug: skill.slug,
  name: skill.name,
  effect: {
    kind: skill.effect!.kind,
    stat: skill.effect!.stat ?? undefined,
    value: skill.effect!.value,
    duration: skill.effect!.duration
  },
  trigger: {
    phase: skill.trigger!.phase,
    terrain: skill.trigger!.terrain,
    baseChance: skill.trigger!.baseChance,
    maxStaminaRatio: skill.trigger!.maxStaminaRatio ?? undefined,
    minPosition: skill.trigger!.minPosition ?? undefined
  }
});

export const runRace = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { horseId, trackId, runningStyle } = req.body as {
    horseId?: string;
    trackId?: string;
    runningStyle?: string;
  };

  if (!userId) {
    return res.status(401).json({ msg: 'Usuário não autenticado' });
  }
  if (!horseId || !trackId) {
    return res.status(422).json({ msg: 'Cavalo e pista são obrigatórios' });
  }
  if (runningStyle !== undefined && !RUNNING_STYLES.includes(runningStyle as RunningStyle)) {
    return res.status(422).json({ msg: 'Estilo de corrida inválido' });
  }

  try {
    const track = mongoose.isValidObjectId(trackId)
      ? await Track.findById(trackId)
      : await Track.findOne({ slug: trackId });

    if (!track) {
      return res.status(404).json({ msg: 'Pista não encontrada' });
    }

    const owned = await findOwnedHorse(userId, horseId);
    if (!owned) {
      return res.status(404).json({ msg: 'Cavalo não pertence ao usuário' });
    }

    const { horse, ownedHorse, user } = owned;

    if (ownedHorse.energy < RACE_ENERGY_COST) {
      return res.status(409).json({
        msg: 'Energia insuficiente para correr. Descanse antes da prova.',
        required: RACE_ENERGY_COST,
        available: ownedHorse.energy
      });
    }

    if (user.monies < track.entryFee) {
      return res.status(400).json({
        msg: 'Dinheiro insuficiente para a inscrição',
        required: track.entryFee,
        available: user.monies
      });
    }

    if (runningStyle) {
      ownedHorse.runningStyle = runningStyle as RunningStyle;
    }

    const learnedSlugs = ownedHorse.skills.map((skill) => skill.slug);
    const [learnedSkills, skillPool] = await Promise.all([
      learnedSlugs.length ? Skill.find({ slug: { $in: learnedSlugs } }) : Promise.resolve([]),
      Skill.find({ rarity: { $in: ['common', 'rare'] } })
    ]);

    const raceTrack: RaceTrackInput = {
      slug: track.slug,
      name: track.name,
      distance: track.distance,
      category: track.category,
      surface: track.surface,
      terrain: track.terrain,
      segments: track.segments.map((segment) => ({
        label: segment.label,
        lengthRatio: segment.lengthRatio,
        grade: segment.grade,
        curve: segment.curve
      })),
      statWeights: track.statWeights!,
      requirements: track.requirements!
    };

    const seed = Math.floor(Math.random() * 0xffffffff);

    const rivals = generateRivals({
      track: raceTrack,
      count: Math.max(1, track.fieldSize - 1),
      difficulty: track.difficulty,
      seed,
      skillPool: skillPool.map(toRaceSkill),
      excludeName: ownedHorse.name
    });

    const simulation = simulateRace({
      track: raceTrack,
      seed,
      runners: [
        {
          id: 'player',
          name: ownedHorse.name,
          isPlayer: true,
          runningStyle: ownedHorse.runningStyle,
          speed: ownedHorse.speed,
          stamina: ownedHorse.stamina,
          power: ownedHorse.power,
          wit: ownedHorse.wit,
          skills: learnedSkills.map(toRaceSkill)
        },
        ...rivals
      ]
    });

    const playerResult = simulation.results.find((result) => result.isPlayer)!;
    const factor = placementFactor(playerResult.placement);

    const prizeMoney = track.prizeMoney[playerResult.placement - 1] ?? 0;
    const skillPointsEarned = Math.round(track.skillPointReward * factor);
    const fansEarned = Math.round(track.fansReward * factor);

    user.monies = Math.max(0, user.monies - track.entryFee + prizeMoney);
    ownedHorse.skillPoints += skillPointsEarned;
    ownedHorse.fans += fansEarned;
    ownedHorse.energy = Math.max(0, ownedHorse.energy - RACE_ENERGY_COST);
    ownedHorse.racesRun += 1;
    if (playerResult.placement === 1) {
      ownedHorse.racesWon += 1;
      ownedHorse.mood = Math.min(MAX_MOOD, ownedHorse.mood + 1);
    } else if (playerResult.placement > Math.ceil(track.fieldSize / 2)) {
      ownedHorse.mood = Math.max(1, ownedHorse.mood - 1);
    }
    // A finished race opens the next season, so the training turns come back.
    ownedHorse.turnsLeft = Math.max(ownedHorse.turnsLeft, TURNS_PER_SEASON);

    await user.save();

    await RaceResult.create({
      userId,
      trackId: track._id,
      trackSlug: track.slug,
      trackName: track.name,
      distance: track.distance,
      horseName: ownedHorse.name,
      sourceHorseId: ownedHorse.sourceHorseId,
      runningStyle: ownedHorse.runningStyle,
      seed,
      placement: playerResult.placement,
      fieldSize: simulation.results.length,
      finishTime: playerResult.finishTime,
      timeUnit: 'turns',
      exhausted: playerResult.exhausted,
      skillsActivated: playerResult.skillsActivated,
      statsSnapshot: {
        speed: ownedHorse.speed,
        stamina: ownedHorse.stamina,
        power: ownedHorse.power,
        wit: ownedHorse.wit
      },
      prizeMoney,
      skillPointsEarned,
      fansEarned,
      entryFee: track.entryFee
    });

    return res.status(200).json({
      msg: playerResult.placement === 1 ? 'Vitória!' : 'Corrida concluída',
      simulation,
      rewards: {
        placement: playerResult.placement,
        prizeMoney,
        entryFee: track.entryFee,
        skillPointsEarned,
        fansEarned,
        energySpent: RACE_ENERGY_COST,
        turnsLeft: ownedHorse.turnsLeft
      },
      horse: serializeOwnedHorse(horse, ownedHorse),
      monies: user.monies
    });
  } catch (error) {
    console.error('Erro ao simular corrida:', error);
    return res.status(500).json({ msg: 'Erro ao simular corrida' });
  }
};

export const getRaceHistory = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ msg: 'Usuário não autenticado' });
  }

  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const skip = Math.max(0, Number(req.query.skip) || 0);

  try {
    const [races, total] = await Promise.all([
      RaceResult.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      RaceResult.countDocuments({ userId })
    ]);

    return res.status(200).json({ races, total, limit, skip });
  } catch {
    return res.status(500).json({ msg: 'Erro ao buscar histórico de corridas' });
  }
};

export const RACE_CONSTANTS = { RACE_ENERGY_COST, TURNS_PER_SEASON, MAX_ENERGY };
