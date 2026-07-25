import { Router } from 'express';
import { getAllHorses, getHorse } from '../controllers/horseController';

const router = Router();

router.get('/horse/:id', getHorse);
router.get('/horse', getAllHorses);

export default router;