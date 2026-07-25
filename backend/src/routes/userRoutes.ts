import { Router, Response } from 'express';
import { create, getOwnedHorse, getUser, login, purchaseHorse, trainHorse } from '../controllers/userController';
import { encryptPassword } from '../middleware/encryptPassword';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

router.get('/verify-token', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({ valid: true, user: req.user });
});
router.post('/user/create', encryptPassword, create);
router.post('/user/login', login);
router.get('/user/me', authMiddleware, getUser);
router.post('/user/me/purchase-horse', authMiddleware, purchaseHorse);
router.get('/user/me/horses/:horseId', authMiddleware, getOwnedHorse);
router.post('/user/me/horses/:horseId/train', authMiddleware, trainHorse);

export default router;