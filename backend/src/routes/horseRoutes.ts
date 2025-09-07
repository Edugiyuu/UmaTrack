import { Router } from 'express';
import { getAllHorses, getHorse, patchHorse, postHorses} from '../controllers/horseController';

const router = Router();

router.get('/horse/:id', getHorse);
router.get('/horse', getAllHorses);
router.post('/horse/post', postHorses);
router.patch('/horse/:id', patchHorse);

export default router;