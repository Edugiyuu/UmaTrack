import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Track from '../models/track';

export const getAllTracks = async (_req: Request, res: Response) => {
  try {
    const tracks = await Track.find().sort({ difficulty: 1, distance: 1 });
    return res.status(200).json(tracks);
  } catch {
    return res.status(500).json({ msg: 'Erro ao buscar pistas.' });
  }
};

export const getTrack = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const track = mongoose.isValidObjectId(id)
      ? await Track.findById(id)
      : await Track.findOne({ slug: id });

    if (!track) {
      return res.status(404).json({ msg: 'Pista não encontrada.' });
    }

    return res.status(200).json(track);
  } catch {
    return res.status(500).json({ msg: 'Erro ao buscar pista.' });
  }
};
