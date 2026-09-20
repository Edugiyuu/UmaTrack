import { Router } from 'express';
import { getRaceHistory, runRace } from '../controllers/raceController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/race/run', authMiddleware, runRace);
router.get('/user/me/races', authMiddleware, getRaceHistory);

export default router;
