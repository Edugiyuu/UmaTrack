import { Router } from 'express';
import { getAllTracks, getTrack } from '../controllers/trackController';

const router = Router();

router.get('/track', getAllTracks);
router.get('/track/:id', getTrack);

export default router;
