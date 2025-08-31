import User from "../models/user";
import Horse from "../models/horse";
import bcrypt from 'bcrypt';
import { Request, Response } from 'express';

import jwt from 'jsonwebtoken';

export const create = async (req: Request, res: Response) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return res.status(422).json({ msg: 'USER_MESSAGES.EMAIL_AND_PASSWORD_AND_USERNAME_REQUIRED' });
  }

  const userExist = await User.findOne({ email });

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
    username,
    email,
    password,
    horses: [randomHorse]
  });

  try {
    await user.save();

    const { password, ...userWithoutPassword } = user.toObject();

    res.status(201).json({
      msg: 'USER_MESSAGES.USER_SAVED_SUCCESSFULLY',
      user: userWithoutPassword
    });

  } catch (error) {
    res.status(500).json({ msg: 'USER_MESSAGES.ERROR_SAVING_USER', error });
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

  const user = await User.findOne({ email: email });

  if (!user) {
    return res.status(422).json({ msg: 'Usuário não encontrado' });
  }

  const checkPassword = await bcrypt.compare(password, user.password);

  if (!checkPassword) {
    return res.status(422).json({ msg: 'Senha inválida' });
  }

  try {
    const secret = process.env.SECRET_KEY as string;

    const token = jwt.sign(
      { id: user._id, userName: user.username },
      secret
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

export const getUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ error: 'USER_MESSAGES.USER_NOT_FOUND' });
    }

    const { password, ...userWithoutPassword } = user.toObject();

    return res.json(userWithoutPassword);
  } catch (error) {
    return res.status(500).json({ msg: 'USER_MESSAGES.USER_NOT_FOUND', error });
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