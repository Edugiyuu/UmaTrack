import { Router } from 'express';
import horseRoutes from './horseRoutes';
import userRoutes from './userRoutes'
import trackRoutes from './trackRoutes'

const router = Router();

router.use(horseRoutes);
router.use(userRoutes);
router.use(trackRoutes);

export default router;