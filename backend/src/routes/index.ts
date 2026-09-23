import { Router } from 'express';
import horseRoutes from './horseRoutes';
import userRoutes from './userRoutes'
import trackRoutes from './trackRoutes'
import skillRoutes from './skillRoutes'
import raceRoutes from './raceRoutes'

const router = Router();

router.use(horseRoutes);
router.use(userRoutes);
router.use(trackRoutes);
router.use(skillRoutes);
router.use(raceRoutes);

export default router;