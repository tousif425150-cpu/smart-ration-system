import { Router } from 'express';
import { getDownloadPage, downloadApk } from '../controllers/downloadController';

const router = Router();

router.get('/', getDownloadPage);
router.get('/apk', downloadApk);

export default router;
