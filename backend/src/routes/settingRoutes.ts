import { Router } from 'express';
import { getSystemSettings, updateSystemSettings } from '../controllers/settingController';
import { protect, restrictTo } from '../middleware/auth';

const router = Router();

// Users can read settings to know if face is required
router.get('/settings', protect, getSystemSettings);

// Only Admins can update settings
router.patch('/admin/settings', protect, restrictTo('ADMIN'), updateSystemSettings);

export default router;
