import { Router } from 'express';
import horseRoutes from './horseRoutes';
import userRoutes from './userRoutes'

const router = Router();

router.use(horseRoutes);
router.use(userRoutes);

export default router;