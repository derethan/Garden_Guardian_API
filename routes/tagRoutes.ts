import { Router } from 'express';
import { getTaggedPlant } from '../controllers/dataController';

const router = Router();

router.get('/tags/:tagId', getTaggedPlant);

export default router;
