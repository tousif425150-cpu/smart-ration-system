import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth';
import * as settingService from '../services/settingService';
import { AppError } from '../utils/AppError';
import { createAuditLog } from '../services/auditService';

export const getSystemSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const faceReq = await settingService.getSetting(settingService.SETTING_KEYS.FACE_VERIFICATION_DISTRIBUTION, 'true');

  res.status(200).json({
    status: 'success',
    data: {
      isFaceVerificationRequiredForDistribution: faceReq === 'true',
    },
  });
});

export const updateSystemSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { isFaceVerificationRequiredForDistribution } = req.body;

  if (isFaceVerificationRequiredForDistribution === undefined) {
    throw new AppError('isFaceVerificationRequiredForDistribution field is required', 400);
  }

  await settingService.setSetting(
    settingService.SETTING_KEYS.FACE_VERIFICATION_DISTRIBUTION,
    String(isFaceVerificationRequiredForDistribution),
    'Requirement for face verification before ration distribution'
  );

  await createAuditLog({
    adminId: req.user?.adminId,
    action: 'UPDATE_SYSTEM_SETTINGS',
    targetType: 'SYSTEM',
    details: { isFaceVerificationRequiredForDistribution },
    ipAddress: req.ip,
  });

  res.status(200).json({
    status: 'success',
    message: 'System settings updated successfully',
  });
});
