import { Router, Request, Response } from 'express';
import { create, getUser, login } from '../controllers/userController';
import { encryptPassword } from '../middleware/encryptPassword';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

interface AuthenticatedRequest extends Request {
  user?: any;
}

router.get('/verify-token', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({ valid: true, user: req.user });
});
router.post('/user/create', encryptPassword, create);
router.post('/user/login', login);
router.get('/user/:id',authMiddleware, getUser);
/* router.get('/users', getAllHorses);
router.post('/user/create', postHorses); */

export default router;