import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Skill from '../models/skill';
import type { AuthenticatedRequest } from '../middleware/authMiddleware';
import { findOwnedHorse, serializeOwnedHorse } from '../services/ownedHorse';
import { isRetired } from '../services/career';

export const getAllSkills = async (_req: Request, res: Response) => {
  try {
    const skills = await Skill.find().sort({ cost: 1, name: 1 });
    return res.status(200).json(skills);
  } catch {
    return res.status(500).json({ msg: 'Erro ao buscar skills.' });
  }
};

export const learnSkill = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { horseId } = req.params;
  const { skillId } = req.body as { skillId?: string };

  if (!userId) {
    return res.status(401).json({ msg: 'Usuário não autenticado' });
  }
  if (!skillId || typeof skillId !== 'string') {
    return res.status(422).json({ msg: 'Skill é obrigatória' });
  }

  try {
    const skill = mongoose.isValidObjectId(skillId)
      ? await Skill.findById(skillId)
      : await Skill.findOne({ slug: skillId });

    if (!skill) {
      return res.status(404).json({ msg: 'Skill não encontrada' });
    }

    const result = await findOwnedHorse(userId, horseId);
    if (!result) {
      return res.status(404).json({ msg: 'Cavalo não pertence ao usuário' });
    }

    const { horse, ownedHorse, user } = result;

    if (isRetired(ownedHorse)) {
      return res.status(409).json({ msg: 'A carreira dela terminou.' });
    }
    if (ownedHorse.skills.some((learned) => learned.slug === skill.slug)) {
      return res.status(409).json({ msg: 'Skill já aprendida' });
    }

    // Skill points are the only price: no stat minimums (task 16).
    if (ownedHorse.skillPoints < skill.cost) {
      return res.status(409).json({
        msg: 'Skill points insuficientes',
        required: skill.cost,
        available: ownedHorse.skillPoints
      });
    }

    ownedHorse.skillPoints -= skill.cost;
    ownedHorse.skills.push({
      skillId: skill._id,
      slug: skill.slug,
      name: skill.name,
      learnedAt: new Date()
    });

    await user.save();

    return res.status(200).json({
      msg: 'Skill aprendida!',
      skill,
      horse: serializeOwnedHorse(horse, ownedHorse)
    });
  } catch {
    return res.status(500).json({ msg: 'Erro ao aprender skill' });
  }
};
