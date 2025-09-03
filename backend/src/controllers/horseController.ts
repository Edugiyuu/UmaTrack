import { Request, Response } from 'express';
import Horse from '../models/horse';


export const getHorse = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const horse = await Horse.findById(id);

        if (!horse) {
            res.status(404).json({ error: 'Cavalo não encontrado.' });
        }

        res.status(200).json(horse);
    } catch (error) {
        res.status(500).json({ error: 'Erro interno.' });
    }
};

export const getAllHorses = async (req: Request, res: Response) => {
    try {
        const horses = await Horse.find();
        res.status(200).json(horses);
    } catch (error) {
        console.error('Erro ao buscar músicas:', error);
        res.status(500).json({ error: 'Erro interno.' });
    }
};

export const postHorses = async (req: Request, res: Response) => {
    try {
        const newHorse = new Horse({
            name: req.body.name,
            passiveBuff: req.body.passiveBuff,
            stamina: req.body.stamina,
            power: req.body.power,
            speed: req.body.speed,
            wit: req.body.wit,
            cost: req.body.cost
        });
        
        await newHorse.save();
        res.status(200).json(newHorse);
    } catch (error) {
        console.error('Erro ao buscar músicas:', error);
        res.status(500).json({ error: 'Erro interno.' });
    }
};