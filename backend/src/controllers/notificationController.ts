import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth';

export const getMyNotifications = asyncHandler(
  async (req: AuthRequest, res: Response, next: any) => {
    const familyId = req.user?.familyId;

    if (!familyId) {
      return next(new AppError('User is not associated with a family.', 400));
    }

    const notifications = await prisma.notification.findMany({
      where: { familyId },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      status: 'success',
      message: 'Notifications retrieved successfully.',
      results: notifications.length,
      data: {
        notifications,
      },
    });
  }
);

export const markAsRead = asyncHandler(
  async (req: AuthRequest, res: Response, next: any) => {
    const familyId = req.user?.familyId;
    const notificationId = parseInt(req.params.id);

    if (!familyId) {
      return next(new AppError('User is not associated with a family.', 400));
    }

    if (isNaN(notificationId)) {
      return next(new AppError('Invalid notification ID.', 400));
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return next(new AppError('Notification not found.', 404));
    }

    if (notification.familyId !== familyId) {
      return next(
        new AppError('You do not have permission to access this notification.', 403)
      );
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    res.status(200).json({
      status: 'success',
      message: 'Notification marked as read.',
      data: {
        notification: updated,
      },
    });
  }
);

export const markAllAsRead = asyncHandler(
  async (req: AuthRequest, res: Response, next: any) => {
    const familyId = req.user?.familyId;

    if (!familyId) {
      return next(new AppError('User is not associated with a family.', 400));
    }

    const updateResult = await prisma.notification.updateMany({
      where: { familyId, isRead: false },
      data: { isRead: true },
    });

    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read.',
      data: {
        markedCount: updateResult.count,
      },
    });
  }
);

export const getFamilyNotifications = asyncHandler(
  async (req: AuthRequest, res: Response, next: any) => {
    const familyIdQuery = req.query.familyId as string;

    if (!familyIdQuery) {
      return next(new AppError('familyId query parameter is required.', 400));
    }

    const family = await prisma.family.findUnique({
      where: { familyId: familyIdQuery },
    });

    if (!family) {
      return next(new AppError('Family not found.', 404));
    }

    const notifications = await prisma.notification.findMany({
      where: { familyId: family.id },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      status: 'success',
      results: notifications.length,
      data: {
        familyId: family.familyId,
        notifications,
      },
    });
  }
);

export const createNotification = asyncHandler(
  async (req: AuthRequest, res: Response, next: any) => {
    const { familyId, title, message, type } = req.body;

    if (!familyId || !title || !message) {
      return next(new AppError('familyId, title and message are required.', 400));
    }

    const family = await prisma.family.findUnique({ where: { id: Number(familyId) } });
    if (!family) {
      return next(new AppError('Family not found.', 404));
    }

    const notification = await prisma.notification.create({
      data: {
        familyId: family.id,
        title,
        message,
        type: type || 'INFO',
      },
    });

    res.status(201).json({
      status: 'success',
      data: {
        notification,
      },
    });
  }
);

export const sendMonthlyReminders = asyncHandler(
  async (_req: AuthRequest, res: Response, next: any) => {
    const monthYear = new Date().toISOString().slice(0, 7); // YYYY-MM

    try {
      const families = await prisma.family.findMany({
        where: { isActive: true },
        include: {
          riceEntitlement: true,
          distributions: {
            where: { monthYear }
          }
        }
      });

      const reminderSentTo: string[] = [];

      for (const family of families) {
        if (!family.riceEntitlement) continue;

        const totalDistributed = family.distributions.reduce((sum, d) => sum + Number(d.distributedKg), 0);
        const quota = Number(family.riceEntitlement.monthlyQuotaKg);

        if (totalDistributed < quota) {
          await prisma.notification.create({
            data: {
              familyId: family.id,
              title: 'Monthly Ration Reminder',
              message: `You have ${quota - totalDistributed} KG of rice remaining for ${monthYear}. Please collect it from your nearest center.`,
              type: 'ALERT',
            }
          });
          reminderSentTo.push(family.familyId);
        }
      }

      res.status(200).json({
        status: 'success',
        message: `Reminders sent to ${reminderSentTo.length} families.`,
        data: {
          count: reminderSentTo.length,
          familyIds: reminderSentTo
        }
      });
    } catch (error) {
      return next(error);
    }
  }
);
