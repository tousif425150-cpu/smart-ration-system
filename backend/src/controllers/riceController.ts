import { Response } from 'express';
import { Prisma, RiceDistribution, RiceEntitlement } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { createAuditLog } from '../services/auditService';
import { AuthRequest } from '../middleware/auth';
import * as settingService from '../services/settingService';
import { sendPushNotification } from '../services/fcmService';

const getCurrentMonthYear = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const toNumber = (val: Prisma.Decimal | number | string | null | undefined): number => {
  if (val === null || val === undefined) return 0;
  return Number(val);
};

export const setRiceEntitlement = asyncHandler(
  async (req: AuthRequest, res: Response, next: any) => {
    const { familyId, monthlyQuotaKg, unitPerMemberKg } = req.body;

    if (!familyId || monthlyQuotaKg === undefined || monthlyQuotaKg === null) {
      return next(new AppError('familyId and monthlyQuotaKg are required.', 400));
    }

    const family = await prisma.family.findUnique({
      where: { familyId },
      include: { members: true },
    });

    if (!family) {
      return next(new AppError('Family not found.', 404));
    }

    const memberCount = family.members.length;
    const resolvedUnitPerMemberKg =
      unitPerMemberKg !== undefined && unitPerMemberKg !== null
        ? unitPerMemberKg
        : memberCount > 0
        ? monthlyQuotaKg / memberCount
        : 0;

    const existingEntitlement = await prisma.riceEntitlement.findUnique({
      where: { familyId: family.id },
    });

    const entitlementData = {
      familyId: family.id,
      monthlyQuotaKg: new Prisma.Decimal(monthlyQuotaKg),
      unitPerMemberKg: new Prisma.Decimal(resolvedUnitPerMemberKg),
      effectiveFrom: new Date(),
    };

    let entitlement: RiceEntitlement;
    let actionType: string;

    if (existingEntitlement) {
      entitlement = await prisma.riceEntitlement.update({
        where: { familyId: family.id },
        data: entitlementData,
      });
      actionType = 'RICE_ENTITLEMENT_UPDATED';
    } else {
      entitlement = await prisma.riceEntitlement.create({
        data: entitlementData,
      });
      actionType = 'RICE_ENTITLEMENT_CREATED';
    }

    await createAuditLog({
      adminId: req.user?.adminId,
      action: actionType,
      targetType: 'RICE_ENTITLEMENT',
      targetId: entitlement.id,
      details: {
        familyId: family.familyId,
        monthlyQuotaKg,
        unitPerMemberKg: resolvedUnitPerMemberKg,
      },
      ipAddress: req.ip,
    });

    await prisma.notification.create({
      data: {
        familyId: family.id,
        title: 'Rice Entitlement Updated',
        message: `Your monthly rice entitlement has been set to ${monthlyQuotaKg} KG (${resolvedUnitPerMemberKg} KG per member).`,
        type: 'INFO',
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Rice entitlement saved successfully.',
      data: {
        entitlement: {
          ...entitlement,
          monthlyQuotaKg: toNumber(entitlement.monthlyQuotaKg),
          unitPerMemberKg: toNumber(entitlement.unitPerMemberKg),
        },
      },
    });
  }
);

export const distributeRice = asyncHandler(
  async (req: AuthRequest, res: Response, next: any) => {
    let { familyId, distributedKg, notes, isVerified } = req.body;

    if (req.user?.role === 'USER') {
      familyId = req.user.familyId;
    }

    if (!familyId) {
      return next(new AppError('familyId is required.', 400));
    }

    // Check Face Verification Requirement
    const isFaceReq = await settingService.isFaceVerificationRequired();
    if (isFaceReq && !isVerified) {
      return next(new AppError('Face verification is required for distribution.', 403));
    }

    const family = await prisma.family.findUnique({
      where: { id: familyId },
      include: { riceEntitlement: true }
    });

    if (!family) {
      return next(new AppError('Family not found.', 404));
    }

    const entitlement = family.riceEntitlement;
    if (!entitlement) {
      return next(new AppError('No rice entitlement set for this family.', 400));
    }

    const monthYear = getCurrentMonthYear();
    const monthlyQuota = toNumber(entitlement.monthlyQuotaKg);

    const distributionsThisMonth = await prisma.riceDistribution.findMany({
      where: { familyId: family.id, monthYear },
      select: { distributedKg: true },
    });

    const totalReceived = distributionsThisMonth.reduce(
      (sum, d) => sum + toNumber(d.distributedKg),
      0
    );

    const maxAllowed = monthlyQuota - totalReceived;
    if (maxAllowed <= 0) {
      return next(new AppError('Monthly entitlement already exhausted.', 400));
    }

    // If distributedKg is not provided, distribute full remaining
    const distributionAmount = (distributedKg !== undefined && distributedKg !== null)
      ? Math.min(Number(distributedKg), maxAllowed)
      : maxAllowed;

    if (distributionAmount <= 0) {
      return next(new AppError('Invalid distribution amount.', 400));
    }

    const remaining = maxAllowed - distributionAmount;

    const distribution = await prisma.riceDistribution.create({
      data: {
        familyId: family.id,
        distributedKg: new Prisma.Decimal(distributionAmount),
        remainingKg: new Prisma.Decimal(remaining),
        distributedBy: req.user?.adminId ?? 0,
        distributionDate: new Date(),
        monthYear,
        status: 'COMPLETED',
        notes: notes || (isVerified ? 'Verified via Face Recognition' : 'Standard Distribution'),
      },
    });

    await createAuditLog({
      adminId: req.user?.adminId,
      action: 'RICE_DISTRIBUTED',
      targetType: 'RICE_DISTRIBUTION',
      targetId: distribution.id,
      details: {
        familyId: family.familyId,
        distributedKg: distributionAmount,
        remainingKg: remaining,
        totalReceivedThisMonth: totalReceived + distributionAmount,
        monthlyQuotaKg: monthlyQuota,
      },
      ipAddress: req.ip,
    });

    await prisma.notification.createMany({
      data: [
        {
          familyId: family.id,
          title: 'Rice Distribution Successful',
          message: `${distributionAmount} KG rice has been distributed to your family.`,
          type: 'SUCCESS',
        },
        {
          familyId: family.id,
          title: 'Rice Distribution Confirmation',
          message: `${distributionAmount} KG rice has been distributed. Remaining ${remaining} KG for this month.`,
          type: 'INFO',
        },
      ],
    });

    // Send Push Notification
    if (req.user?.role === 'USER') {
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (user?.fcmToken) {
        await sendPushNotification(
          user.fcmToken,
          'Rice Distribution Successful',
          `${distributionAmount} KG rice has been distributed. Remaining: ${remaining} KG.`,
          { type: 'SUCCESS', remainingKg: remaining.toString() }
        );
      }
    }

    res.status(201).json({
      status: 'success',
      message: 'Rice distributed successfully.',
      data: {
        distribution: {
          ...distribution,
          distributedKg: toNumber(distribution.distributedKg),
          remainingKg: toNumber(distribution.remainingKg),
        },
        totalReceivedThisMonth: totalReceived + distributionAmount,
        remaining,
        monthlyQuota,
      },
    });
  }
);

export const getRiceInfo = asyncHandler(
  async (req: AuthRequest, res: Response, next: any) => {
    const familyId = req.user?.familyId;

    if (!familyId) {
      return next(new AppError('User is not associated with a family.', 400));
    }

    const monthYear = getCurrentMonthYear();

    const [entitlement, distributions, familyWithMembers] = await Promise.all([
      prisma.riceEntitlement.findUnique({ where: { familyId } }),
      prisma.riceDistribution.findMany({
        where: { familyId, monthYear },
        orderBy: { distributionDate: 'desc' },
      }),
      prisma.family.findUnique({
        where: { id: familyId },
        include: { members: true },
      }),
    ]);

    if (!entitlement) {
      return res.status(200).json({
        status: 'success',
        message: 'No entitlement found for this family.',
        data: {
          monthlyEntitlementKg: 0,
          totalReceivedKg: 0,
          remainingKg: 0,
          lastDistributionDate: null,
          familyMemberCount: familyWithMembers?.members.length ?? 0,
          familyId: familyWithMembers?.familyId || '',
          headName: familyWithMembers?.headName || null,
          mobileNumber: familyWithMembers?.mobileNumber || null,
          isFaceVerificationRequired: await settingService.isFaceVerificationRequired(),
        },
      });
    }

    const totalReceivedCurrentMonth = distributions.reduce(
      (sum, d) => sum + toNumber(d.distributedKg),
      0
    );
    const monthlyQuota = entitlement ? toNumber(entitlement.monthlyQuotaKg) : 0;
    const remaining = monthlyQuota - totalReceivedCurrentMonth;
    const lastDistribution = distributions[0] ?? null;

    res.status(200).json({
      status: 'success',
      message: 'Rice info retrieved successfully.',
      data: {
        monthlyEntitlementKg: monthlyQuota,
        totalReceivedKg: totalReceivedCurrentMonth,
        remainingKg: remaining,
        lastDistributionDate: lastDistribution ? lastDistribution.distributionDate : null,
        familyMemberCount: familyWithMembers?.members.length ?? 0,
        familyId: familyWithMembers?.familyId || '',
        headName: familyWithMembers?.headName || null,
        mobileNumber: familyWithMembers?.mobileNumber || null,
        isFaceVerificationRequired: await settingService.isFaceVerificationRequired(),
      },
    });
  }
);

export const getRiceHistory = asyncHandler(
  async (req: AuthRequest, res: Response, next: any) => {
    const familyId = req.user?.familyId;

    if (!familyId) {
      return next(new AppError('User is not associated with a family.', 400));
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    const [total, distributions] = await Promise.all([
      prisma.riceDistribution.count({ where: { familyId } }),
      prisma.riceDistribution.findMany({
        where: { familyId },
        orderBy: { distributionDate: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    res.status(200).json({
      status: 'success',
      message: 'Rice history retrieved successfully.',
      results: distributions.length,
      data: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        distributions: distributions.map((d) => {
          const dateObj = new Date(d.distributionDate);
          return {
            id: d.id,
            date: dateObj.toISOString().split('T')[0],
            time: dateObj.toTimeString().split(' ')[0],
            distributedKg: toNumber(d.distributedKg),
            remainingKg: toNumber(d.remainingKg),
            status: d.status,
            notes: d.notes,
          };
        }),
      },
    });
  }
);

export const getAdminRiceHistory = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const familyIdQuery = req.query.familyId as string;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    let whereClause: any = {};
    if (familyIdQuery) {
      const family = await prisma.family.findUnique({
        where: { familyId: familyIdQuery },
      });
      if (family) {
        whereClause.familyId = family.id;
      } else {
        whereClause.familyId = -1;
      }
    }

    const [total, distributions] = await Promise.all([
      prisma.riceDistribution.count({ where: whereClause }),
      prisma.riceDistribution.findMany({
        where: whereClause,
        orderBy: { distributionDate: 'desc' },
        skip,
        take: limit,
        include: {
          family: {
            select: {
              familyId: true,
              headName: true,
              mobileNumber: true,
            },
          },
        },
      }),
    ]);

    res.status(200).json({
      status: 'success',
      results: distributions.length,
      data: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        distributions: distributions.map((d: RiceDistribution & { family: { familyId: string; headName: string; mobileNumber: string } }) => ({
          id: d.id,
          familyId: d.family.familyId,
          familyHeadName: d.family.headName,
          mobileNumber: d.family.mobileNumber,
          distributedKg: toNumber(d.distributedKg),
          remainingKg: toNumber(d.remainingKg),
          distributedBy: d.distributedBy,
          distributionDate: d.distributionDate,
          monthYear: d.monthYear,
          status: d.status,
          notes: d.notes,
        })),
      },
    });
  }
);
