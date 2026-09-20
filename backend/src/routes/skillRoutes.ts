import { Router } from 'express';
import { getAllSkills, learnSkill } from '../controllers/skillController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/skill', getAllSkills);
router.post('/user/me/horses/:horseId/skills', authMiddleware, learnSkill);

export default router;
