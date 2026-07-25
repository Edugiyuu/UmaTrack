import User from "../models/user";
import Horse from "../models/horse";
import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import mongoose from 'mongoose';

import jwt from 'jsonwebtoken';
import type { AuthenticatedRequest } from '../middleware/authMiddleware';

export const create = async (req: Request, res: Response) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return res.status(422).json({ msg: 'USER_MESSAGES.EMAIL_AND_PASSWORD_AND_USERNAME_REQUIRED' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedUsername = String(username).trim();
  const userExist = await User.findOne({ email: normalizedEmail });

  if (userExist) {
    return res.status(422).json({ msg: "Esse Email já está em uso" });
  }
  
  const horseCount = await Horse.countDocuments();
  const randomIndex = Math.floor(Math.random() * horseCount);
  const randomHorse = await Horse.findOne().skip(randomIndex).lean();

  if (!randomHorse) {
    return res.status(404).json({ msg: "Cavalo não encontrado" });
  }

  const user = new User({
    username: normalizedUsername,
    email: normalizedEmail,
    password,
    horses: [{
      sourceHorseId: randomHorse._id,
      name: randomHorse.name,
      passiveBuff: randomHorse.passiveBuff,
      stamina: randomHorse.stamina,
      power: randomHorse.power,
      speed: randomHorse.speed,
      wit: randomHorse.wit,
      cost: randomHorse.cost,
      turnsLeft: 5
    }]
  });

  try {
    await user.save();

    const { password, ...userWithoutPassword } = user.toObject();

    res.status(201).json({
      msg: 'USER_MESSAGES.USER_SAVED_SUCCESSFULLY',
      user: userWithoutPassword
    });

  } catch (error) {
    res.status(500).json({ msg: 'USER_MESSAGES.ERROR_SAVING_USER' });
  }
};


export const login = async  (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(422).json({ msg: 'O email é obrigatório' });
  }
  if (!password) {
    return res.status(422).json({ msg: 'A senha é obrigatória' });
  }

  const user = await User.findOne({ email: String(email).trim().toLowerCase() });

  if (!user) {
    return res.status(422).json({ msg: 'Usuário não encontrado' });
  }

  const checkPassword = await bcrypt.compare(password, user.password);

  if (!checkPassword) {
    return res.status(422).json({ msg: 'Senha inválida' });
  }

  try {
    const secret = process.env.SECRET_KEY;
    if (!secret) {
      return res.status(500).json({ msg: 'Configuração de autenticação ausente' });
    }

    const token = jwt.sign(
      { id: user._id, userName: user.username },
      secret,
      { expiresIn: '1h' }
    );    
    res.status(200).json({
      msg: 'Autenticação feita com sucesso',
      token,
      id: user._id
    });
  } catch (err) {
    return res.status(500).json({ msg: 'Algum erro ocorreu' });
  }
};

export const update = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ error: 'USER_MESSAGES.USER_NOT_FOUND' });
    }

    const { password, ...userWithoutPassword } = updatedUser.toObject();

    return res.json({ message: 'USER_MESSAGES.USER_UPDATED_SUCCESSFULLY', user: userWithoutPassword });
  } catch (error) {
    return res.status(500).json({ message: 'USER_MESSAGES.ERROR_UPDATING_USER', error });
  }
};

export const getUser = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'USER_MESSAGES.UNAUTHORIZED' });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'USER_MESSAGES.USER_NOT_FOUND' });
    }

    const { password, ...userWithoutPassword } = user.toObject();

    return res.json(userWithoutPassword);
  } catch {
    return res.status(500).json({ msg: 'USER_MESSAGES.ERROR_GETTING_USER' });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ error: 'USER_MESSAGES.USER_NOT_FOUND' });
    }
    return res.status(200).json({ msg: 'USER_MESSAGES.USER_DELETED_SUCCESSFULLY' });
  } catch (error) {
    return res.status(500).json({ msg: 'USER_MESSAGES.ERROR_DELETING_USER', error });
  }
}

export const purchaseHorse = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { horseId } = req.body;

  if (!userId) {
    return res.status(401).json({ msg: 'Usuário não autenticado' });
  }

  if (!horseId || !mongoose.isValidObjectId(horseId)) {
    return res.status(422).json({ msg: 'Horse ID é obrigatório' });
  }

  try {
    const horse = await Horse.findById(horseId);
    if (!horse) {
      return res.status(404).json({ msg: "Cavalo não encontrado" });
    }

    if (!Number.isFinite(horse.cost) || horse.cost <= 0) {
      return res.status(422).json({ msg: "Preço do cavalo inválido" });
    }

    const updatedUser = await User.findOneAndUpdate(
      {
        _id: userId,
        monies: { $gte: horse.cost },
        'horses.sourceHorseId': { $ne: horse._id },
        'horses.name': { $ne: horse.name }
      },
      {
        $inc: { monies: -horse.cost },
        $push: {
          horses: {
            sourceHorseId: horse._id,
            name: horse.name,
            passiveBuff: horse.passiveBuff,
            stamina: horse.stamina,
            power: horse.power,
            speed: horse.speed,
            wit: horse.wit,
            cost: horse.cost,
            turnsLeft: 5
          }
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      const user = await User.findById(userId).select('monies horses.name horses.sourceHorseId');
      if (!user) {
        return res.status(404).json({ msg: "Usuário não encontrado" });
      }

      const alreadyOwned = user.horses.some((ownedHorse) =>
        ownedHorse.name === horse.name || ownedHorse.sourceHorseId?.toString() === horse.id
      );
      if (alreadyOwned) {
        return res.status(409).json({ msg: "Cavalo já pertence ao usuário" });
      }

      return res.status(400).json({
        msg: "Dinheiro insuficiente",
        required: horse.cost,
        available: user.monies
      });
    }

    const { password, ...userWithoutPassword } = updatedUser.toObject();

    return res.status(200).json({
      msg: "Cavalo comprado com sucesso!",
      user: userWithoutPassword,
      purchasedHorse: horse
    });
  } catch {
    return res.status(500).json({ msg: 'Erro interno do servidor' });
  }
};
const findOwnedHorse = async (userId: string, horseId: string) => {
  if (!mongoose.isValidObjectId(horseId)) {
    return null;
  }

  const horse = await Horse.findById(horseId);
  if (!horse) {
    return null;
  }

  const user = await User.findById(userId);
  if (!user) {
    return null;
  }

  const ownedHorse = user.horses.find((candidate) =>
    candidate.sourceHorseId?.toString() === horse.id || candidate.name === horse.name
  );

  return ownedHorse ? { horse, ownedHorse, user } : null;
};

const serializeOwnedHorse = (catalogHorse: InstanceType<typeof Horse>, ownedHorse: Record<string, unknown>) => ({
  ...ownedHorse,
  _id: catalogHorse.id,
  sourceHorseId: catalogHorse.id,
  cost: catalogHorse.cost,
  turnsLeft: ownedHorse.turnsLeft ?? 5
});

export const getOwnedHorse = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { horseId } = req.params;
  if (!userId) {
    return res.status(401).json({ msg: 'Usuário não autenticado' });
  }

  try {
    const result = await findOwnedHorse(userId, horseId);
    if (!result) {
      return res.status(404).json({ msg: 'Cavalo não pertence ao usuário' });
    }

    const { horse, ownedHorse, user } = result;
    if (!ownedHorse.sourceHorseId || ownedHorse.turnsLeft === undefined || ownedHorse.cost === undefined) {
      ownedHorse.sourceHorseId = horse._id;
      ownedHorse.turnsLeft ??= 5;
      ownedHorse.cost ??= horse.cost;
      await user.save();
    }

    return res.json(serializeOwnedHorse(horse, ownedHorse.toObject()));
  } catch {
    return res.status(500).json({ msg: 'Erro ao buscar cavalo do usuário' });
  }
};

const trainTypes = ['speed', 'stamina', 'power', 'wit'] as const;

export const trainHorse = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { horseId } = req.params;
  const { trainType, points } = req.body as { trainType?: string; points?: number };

  if (!userId) {
    return res.status(401).json({ msg: 'Usuário não autenticado' });
  }
  if (!trainTypes.includes(trainType as typeof trainTypes[number])) {
    return res.status(422).json({ msg: 'Tipo de treino inválido' });
  }
  if (points === undefined || !Number.isInteger(points) || points < 0 || points > 10) {
    return res.status(422).json({ msg: 'Pontuação de treino inválida' });
  }

  try {
    const result = await findOwnedHorse(userId, horseId);
    if (!result) {
      return res.status(404).json({ msg: 'Cavalo não pertence ao usuário' });
    }

    const { horse, ownedHorse, user } = result;
    if (!ownedHorse.sourceHorseId || ownedHorse.turnsLeft === undefined || ownedHorse.cost === undefined) {
      ownedHorse.sourceHorseId = horse._id;
      ownedHorse.turnsLeft ??= 5;
      ownedHorse.cost ??= horse.cost;
      await user.save();
    }

    if (ownedHorse.turnsLeft <= 0) {
      return res.status(409).json({ msg: 'Não há turnos restantes' });
    }

    const statPath = `horses.$.${trainType}`;
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: userId,
        horses: { $elemMatch: { _id: ownedHorse._id, turnsLeft: { $gt: 0 } } }
      },
      {
        $inc: {
          [statPath]: points,
          'horses.$.turnsLeft': -1
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(409).json({ msg: 'Treino não pôde ser concluído' });
    }

    const updatedOwnedHorse = updatedUser.horses.id(ownedHorse._id);
    if (!updatedOwnedHorse) {
      return res.status(500).json({ msg: 'Cavalo atualizado não encontrado' });
    }

    return res.json({ horse: serializeOwnedHorse(horse, updatedOwnedHorse.toObject()) });
  } catch {
    return res.status(500).json({ msg: 'Erro ao salvar treino' });
  }
};
