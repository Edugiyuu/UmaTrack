import { Router } from 'express';
import { getAllHorses, getHorse, postHorses} from '../controllers/horseController';

const router = Router();

router.get('/horse/:id', getHorse);
router.get('/horse', getAllHorses);
router.post('/horse/post', postHorses);

export default router;