import { Router } from 'express';
import { getHealth, getPing } from '../controllers/healthController';

const router = Router();

router.get('/', getHealth);
router.get('/ping', getPing);

export default router;
