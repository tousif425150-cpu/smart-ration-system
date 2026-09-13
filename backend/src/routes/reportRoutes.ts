import { Router } from 'express';
import { getDashboardReport } from '../controllers/reportController';
import { protect, restrictTo } from '../middleware/auth';

const router = Router();

router.get(
  '/admin/reports/dashboard',
  protect,
  restrictTo('ADMIN'),
  getDashboardReport
);

export default router;
