/**
 * NOTIFICATION SERVICE
 * ====================
 * 
 * Centralized service for creating and managing notifications.
 * Supports multiple notification types and delivery channels.
 * 
 * @module services/notification
 */

import { prisma } from '../lib/prisma';

// Notification templates for consistent messaging
const NOTIFICATION_TEMPLATES = {
  BOOKING_CONFIRMED: {
    title: 'Booking Confirmed',
    getMessage: (data) => `Your booking at ${data.venueName} for ${data.date} at ${data.time} has been confirmed.`
  },
  BOOKING_CANCELLED: {
    title: 'Booking Cancelled',
    getMessage: (data) => `Your booking at ${data.venueName} for ${data.date} has been cancelled. ${data.reason || ''}`
  },
  BOOKING_REMINDER: {
    title: 'Upcoming Booking Reminder',
    getMessage: (data) => `Reminder: You have a booking at ${data.venueName} on ${data.date} at ${data.time}.`
  },
  PAYMENT_SUCCESS: {
    title: 'Payment Successful',
    getMessage: (data) => `Payment of ₹${data.amount} for your booking at ${data.venueName} was successful.`
  },
  PAYMENT_FAILED: {
    title: 'Payment Failed',
    getMessage: (data) => `Payment of ₹${data.amount} for your booking at ${data.venueName} failed. Please try again.`
  },
  REFUND_PROCESSED: {
    title: 'Refund Processed',
    getMessage: (data) => `Your refund of ₹${data.amount} has been processed. It will be credited within 5-7 business days.`
  },
  REVIEW_RESPONSE: {
    title: 'Owner Responded to Your Review',
    getMessage: (data) => `The owner of ${data.venueName} responded to your review.`
  },
  VENUE_APPROVED: {
    title: 'Venue Approved',
    getMessage: (data) => `Congratulations! Your venue "${data.venueName}" has been approved and is now live.`
  },
  VENUE_REJECTED: {
    title: 'Venue Not Approved',
    getMessage: (data) => `Your venue "${data.venueName}" was not approved. Reason: ${data.reason}`
  },
  SYSTEM_ALERT: {
    title: 'System Notification',
    getMessage: (data) => data.message || 'You have a new system notification.'
  },
  PROMOTIONAL: {
    title: 'Special Offer',
    getMessage: (data) => data.message || 'Check out our latest offers!'
  }
};

/**
 * Create a new notification for a user
 * 
 * @param {Object} params - Notification parameters
 * @param {string} params.userId - Recipient user ID
 * @param {string} params.type - Notification type (from NotificationType enum)
 * @param {Object} params.data - Additional data for the notification
 * @param {string} [params.customTitle] - Custom title (overrides template)
 * @param {string} [params.customMessage] - Custom message (overrides template)
 * @param {Date} [params.expiresAt] - Optional expiration date
 * @returns {Promise<Object>} Created notification
 */
export async function createNotification({
  userId,
  type,
  data = {},
  customTitle,
  customMessage,
  expiresAt
}) {
  try {
    const template = NOTIFICATION_TEMPLATES[type];
    
    if (!template && !customTitle) {
      throw new Error(`Unknown notification type: ${type}`);
    }

    const title = customTitle || template?.title || 'Notification';
    const message = customMessage || template?.getMessage(data) || 'You have a new notification.';

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data,
        expiresAt
      }
    });

    // TODO: Add email/SMS/push notification delivery based on user preferences
    // await sendEmailNotification(userId, title, message);
    // await sendPushNotification(userId, title, message);

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    throw error;
  }
}

/**
 * Create notifications for multiple users
 * 
 * @param {string[]} userIds - Array of user IDs
 * @param {string} type - Notification type
 * @param {Object} data - Notification data
 * @returns {Promise<number>} Count of notifications created
 */
export async function createBulkNotifications(userIds, type, data = {}) {
  try {
    const template = NOTIFICATION_TEMPLATES[type];
    const title = template?.title || 'Notification';
    const message = template?.getMessage(data) || 'You have a new notification.';

    const result = await prisma.notification.createMany({
      data: userIds.map(userId => ({
        userId,
        type,
        title,
        message,
        data
      }))
    });

    return result.count;
  } catch (error) {
    console.error('Failed to create bulk notifications:', error);
    throw error;
  }
}

/**
 * Get user notifications with pagination
 * 
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Notifications with pagination info
 */
export async function getUserNotifications(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    unreadOnly = false,
    type = null
  } = options;

  const skip = (page - 1) * limit;

  const where = {
    userId,
    ...(unreadOnly && { isRead: false }),
    ...(type && { type }),
    OR: [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } }
    ]
  };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: {
        userId,
        isRead: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    })
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + notifications.length < total
    },
    unreadCount
  };
}

/**
 * Mark notification as read
 * 
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID (for verification)
 * @returns {Promise<Object>} Updated notification
 */
export async function markAsRead(notificationId, userId) {
  return prisma.notification.update({
    where: { 
      id: notificationId,
      userId // Ensure user owns this notification
    },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });
}

/**
 * Mark all notifications as read for a user
 * 
 * @param {string} userId - User ID
 * @returns {Promise<number>} Count of notifications marked as read
 */
export async function markAllAsRead(userId) {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false
    },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });

  return result.count;
}

/**
 * Delete a notification
 * 
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID (for verification)
 * @returns {Promise<Object>} Deleted notification
 */
export async function deleteNotification(notificationId, userId) {
  return prisma.notification.delete({
    where: {
      id: notificationId,
      userId
    }
  });
}

/**
 * Delete all read notifications for a user
 * 
 * @param {string} userId - User ID
 * @returns {Promise<number>} Count of notifications deleted
 */
export async function deleteReadNotifications(userId) {
  const result = await prisma.notification.deleteMany({
    where: {
      userId,
      isRead: true
    }
  });

  return result.count;
}

/**
 * Get notification statistics for a user
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Notification statistics
 */
export async function getNotificationStats(userId) {
  const [total, unread, byType] = await Promise.all([
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
    prisma.notification.groupBy({
      by: ['type'],
      where: { userId },
      _count: { type: true }
    })
  ]);

  return {
    total,
    unread,
    read: total - unread,
    byType: byType.reduce((acc, item) => {
      acc[item.type] = item._count.type;
      return acc;
    }, {})
  };
}

// ==========================================
// BOOKING-SPECIFIC NOTIFICATIONS
// ==========================================

/**
 * Send booking confirmation notification
 */
export async function notifyBookingConfirmed(booking, venue, court) {
  return createNotification({
    userId: booking.userId,
    type: 'BOOKING_CONFIRMED',
    data: {
      bookingId: booking.id,
      venueId: venue.id,
      venueName: venue.name,
      courtName: court.name,
      date: booking.bookingDate,
      time: booking.startTime,
      amount: booking.totalAmount
    }
  });
}

/**
 * Send booking cancellation notification
 */
export async function notifyBookingCancelled(booking, venue, reason) {
  return createNotification({
    userId: booking.userId,
    type: 'BOOKING_CANCELLED',
    data: {
      bookingId: booking.id,
      venueId: venue.id,
      venueName: venue.name,
      date: booking.bookingDate,
      reason
    }
  });
}

/**
 * Send booking reminder notification
 */
export async function notifyBookingReminder(booking, venue, court) {
  return createNotification({
    userId: booking.userId,
    type: 'BOOKING_REMINDER',
    data: {
      bookingId: booking.id,
      venueId: venue.id,
      venueName: venue.name,
      courtName: court.name,
      date: booking.bookingDate,
      time: booking.startTime
    }
  });
}

// ==========================================
// PAYMENT-SPECIFIC NOTIFICATIONS
// ==========================================

/**
 * Send payment success notification
 */
export async function notifyPaymentSuccess(payment, venue) {
  return createNotification({
    userId: payment.userId,
    type: 'PAYMENT_SUCCESS',
    data: {
      paymentId: payment.id,
      amount: payment.totalAmount,
      venueName: venue.name
    }
  });
}

/**
 * Send payment failure notification
 */
export async function notifyPaymentFailed(userId, amount, venueName) {
  return createNotification({
    userId,
    type: 'PAYMENT_FAILED',
    data: {
      amount,
      venueName
    }
  });
}

/**
 * Send refund processed notification
 */
export async function notifyRefundProcessed(refund) {
  return createNotification({
    userId: refund.userId,
    type: 'REFUND_PROCESSED',
    data: {
      refundId: refund.id,
      amount: refund.amount
    }
  });
}

// ==========================================
// VENUE-SPECIFIC NOTIFICATIONS
// ==========================================

/**
 * Send venue approval notification to owner
 */
export async function notifyVenueApproved(venue) {
  return createNotification({
    userId: venue.ownerId,
    type: 'VENUE_APPROVED',
    data: {
      venueId: venue.id,
      venueName: venue.name
    }
  });
}

/**
 * Send venue rejection notification to owner
 */
export async function notifyVenueRejected(venue, reason) {
  return createNotification({
    userId: venue.ownerId,
    type: 'VENUE_REJECTED',
    data: {
      venueId: venue.id,
      venueName: venue.name,
      reason
    }
  });
}

export default {
  createNotification,
  createBulkNotifications,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
  getNotificationStats,
  notifyBookingConfirmed,
  notifyBookingCancelled,
  notifyBookingReminder,
  notifyPaymentSuccess,
  notifyPaymentFailed,
  notifyRefundProcessed,
  notifyVenueApproved,
  notifyVenueRejected
};
