import { Response } from 'express';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth';

const toNumber = (val: any): number => {
  if (val === null || val === undefined) return 0;
  return Number(val);
};

const getCurrentMonthYear = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const getTodayStartEnd = (): { start: Date; end: Date } => {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  return { start, end };
};

export const getDashboardReport = asyncHandler(
  async (_req: AuthRequest, res: Response) => {
    const monthYear = getCurrentMonthYear();
    const { start: todayStart, end: todayEnd } = getTodayStartEnd();

    const [
      totalFamilies,
      totalActiveFamilies,
      totalMembers,
      distributionsToday,
      distributionsMonth,
      recentTransactions,
      recentFamilies,
    ] = await Promise.all([
      prisma.family.count(),
      prisma.family.count({ where: { isActive: true } }),
      prisma.familyMember.count(),
      prisma.riceDistribution.findMany({
        where: {
          distributionDate: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        select: { distributedKg: true },
      }),
      prisma.riceDistribution.findMany({
        where: { monthYear },
        select: { distributedKg: true },
      }),
      prisma.riceDistribution.findMany({
        take: 10,
        orderBy: { distributionDate: 'desc' },
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
      prisma.family.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { members: true },
          },
        },
      }),
    ]);

    const totalRiceDistributedTodayKg = distributionsToday.reduce(
      (sum, d) => sum + toNumber(d.distributedKg),
      0
    );
    const totalRiceDistributedMonthKg = distributionsMonth.reduce(
      (sum, d) => sum + toNumber(d.distributedKg),
      0
    );

    const activeFamiliesWithEntitlements = await prisma.family.findMany({
      where: { isActive: true },
      include: {
        riceEntitlement: true,
        distributions: {
          where: { monthYear },
          select: { distributedKg: true },
        },
      },
    });

    const pendingCollections = activeFamiliesWithEntitlements
      .filter((f) => f.riceEntitlement)
      .map((f) => {
        const monthlyQuota = toNumber(f.riceEntitlement!.monthlyQuotaKg);
        const totalReceived = f.distributions.reduce(
          (sum, d) => sum + toNumber(d.distributedKg),
          0
        );
        const remaining = monthlyQuota - totalReceived;
        return {
          familyId: f.familyId,
          headName: f.headName,
          mobileNumber: f.mobileNumber,
          monthlyQuotaKg: monthlyQuota,
          totalReceivedKg: totalReceived,
          remainingKg: remaining > 0 ? remaining : 0,
        };
      })
      .filter((f) => f.remainingKg > 0);

    res.status(200).json({
      status: 'success',
      data: {
        totalFamilies,
        totalActiveFamilies,
        totalMembers,
        totalRiceDistributedTodayKg,
        totalRiceDistributedMonthKg,
        recentTransactions: recentTransactions.map((t) => ({
          id: t.id,
          familyId: t.family.familyId,
          familyHeadName: t.family.headName,
          mobileNumber: t.family.mobileNumber,
          distributedKg: toNumber(t.distributedKg),
          remainingKg: toNumber(t.remainingKg),
          distributionDate: t.distributionDate,
          status: t.status,
        })),
        recentFamilies: recentFamilies.map((f) => ({
          familyId: f.familyId,
          headName: f.headName,
          mobileNumber: f.mobileNumber,
          isActive: f.isActive,
          memberCount: f._count.members,
          createdAt: f.createdAt,
        })),
        pendingCollections,
      },
    });
  }
);
