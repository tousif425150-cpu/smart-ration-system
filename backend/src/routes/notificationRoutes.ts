import { Router } from 'express';
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  getFamilyNotifications,
  createNotification,
  sendMonthlyReminders,
} from '../controllers/notificationController';
import { protect, restrictTo } from '../middleware/auth';

const router = Router();

router.get('/notifications', protect, restrictTo('USER'), getMyNotifications);

router.put('/notifications/:id/read', protect, restrictTo('USER'), markAsRead);

router.put('/notifications/read-all', protect, restrictTo('USER'), markAllAsRead);

router.get(
  '/admin/notifications',
  protect,
  restrictTo('ADMIN'),
  getFamilyNotifications
);

router.post(
  '/admin/notifications',
  protect,
  restrictTo('ADMIN'),
  createNotification
);

router.post(
  '/admin/notifications/send-reminders',
  protect,
  restrictTo('ADMIN'),
  sendMonthlyReminders
);

export default router;
