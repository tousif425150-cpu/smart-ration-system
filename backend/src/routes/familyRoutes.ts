import { Router } from 'express';
import {
  createFamily,
  getAllFamilies,
  getFamilyById,
  updateFamily,
  toggleFamilyStatus,
  createMember,
  getFamilyMembers,
  updateMember,
  deleteMember,
  createUserCredentialsForMember,
  enrollFace,
  resetFamilyPassword,
} from '../controllers/familyController';
import { protect, restrictTo } from '../middleware/auth';

const router = Router();

router.use(protect);
router.use(restrictTo('ADMIN'));

router.post('/families', createFamily);
router.get('/families', getAllFamilies);
router.get('/families/:id', getFamilyById);
router.put('/families/:id', updateFamily);
router.patch('/families/:id/toggle-status', toggleFamilyStatus);
router.patch('/families/:id/enable', (req, res, next) => {
  req.body.isActive = true;
  toggleFamilyStatus(req, res, next);
});
router.patch('/families/:id/disable', (req, res, next) => {
  req.body.isActive = false;
  toggleFamilyStatus(req, res, next);
});

router.post('/families/:id/members', createMember);
router.get('/families/:id/members', getFamilyMembers);

router.put('/members/:id', updateMember);
router.delete('/members/:id', deleteMember);
router.post('/members/:id/create-user', createUserCredentialsForMember);
router.post('/families/:id/reset-password', resetFamilyPassword);
router.post('/members/:id/enroll-face', enrollFace);

export default router;
