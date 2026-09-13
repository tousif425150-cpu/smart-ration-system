import { Router } from 'express';
import {
  setRiceEntitlement,
  distributeRice,
  getRiceInfo,
  getRiceHistory,
  getAdminRiceHistory,
} from '../controllers/riceController';
import { protect, restrictTo } from '../middleware/auth';

const router = Router();

router.post(
  '/admin/rice/entitlement',
  protect,
  restrictTo('ADMIN'),
  setRiceEntitlement
);

router.post(
  '/admin/rice/distribute',
  protect,
  restrictTo('ADMIN'),
  distributeRice
);

router.post(
  '/rice/distribute',
  protect,
  restrictTo('USER'),
  distributeRice
);

router.get('/rice', protect, restrictTo('USER'), getRiceInfo);

router.get('/rice/history', protect, restrictTo('USER'), getRiceHistory);

router.get(
  '/admin/rice/history',
  protect,
  restrictTo('ADMIN'),
  getAdminRiceHistory
);

export default router;
