import { Router } from 'express';
import {
  adminLogin,
  userLogin,
  logout,
  changePassword,
  forgotPassword,
  faceVerify,
  updateFcmToken,
} from '../controllers/authController';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/admin/login', adminLogin);
router.post('/user/login', userLogin);
router.post('/logout', logout);
router.post('/change-password', protect, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/face-verify', faceVerify);
router.patch('/fcm-token', protect, updateFcmToken);

export default router;
