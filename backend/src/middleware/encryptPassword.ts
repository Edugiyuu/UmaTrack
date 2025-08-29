import bcrypt from 'bcrypt';
import { NextFunction, Request, Response } from 'express';

export const encryptPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.body.password) {
      const salt = await bcrypt.genSalt(12);
      req.body.password = await bcrypt.hash(req.body.password, salt);
    }
    next();
  } catch (error) {
    next(error);
  }
};