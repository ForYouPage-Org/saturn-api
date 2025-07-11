import { NotificationController } from '../../../../src/modules/notifications/controllers/notifications.controller';
import type { NotificationService } from '../../../../src/modules/notifications/services/notification.service';
import type { Request, Response } from 'express';
import { jest } from '@jest/globals';

describe('NotificationController', () => {
  let mockNotificationService: jest.Mocked<NotificationService>;
  let notificationController: NotificationController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockNotificationService = {
      createNotification: jest.fn(),
      getUserNotifications: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteNotification: jest.fn(),
      getUnreadCount: jest.fn(),
    } as any;

    notificationController = new NotificationController(mockNotificationService);

    mockRequest = {
      params: {},
      body: {},
      query: {},
      user: {
        id: 'user123',
        username: 'testuser',
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('getUserNotifications', () => {
    it('should get user notifications', async () => {
      const mockNotifications = [
        {
          id: 'notif1',
          type: 'like',
          message: 'User liked your post',
          userId: 'user123',
          read: false,
          createdAt: new Date(),
        },
        {
          id: 'notif2',
          type: 'comment',
          message: 'User commented on your post',
          userId: 'user123',
          read: true,
          createdAt: new Date(),
        },
      ];

      mockNotificationService.getUserNotifications.mockResolvedValue(mockNotifications);

      await notificationController.getUserNotifications(mockRequest as Request, mockResponse as Response);

      expect(mockNotificationService.getUserNotifications).toHaveBeenCalledWith('user123', {});
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockNotifications,
      });
    });

    it('should handle query parameters', async () => {
      mockRequest.query = {
        limit: '10',
        offset: '0',
        unreadOnly: 'true',
      };

      const mockNotifications = [
        {
          id: 'notif1',
          type: 'like',
          message: 'User liked your post',
          userId: 'user123',
          read: false,
          createdAt: new Date(),
        },
      ];

      mockNotificationService.getUserNotifications.mockResolvedValue(mockNotifications);

      await notificationController.getUserNotifications(mockRequest as Request, mockResponse as Response);

      expect(mockNotificationService.getUserNotifications).toHaveBeenCalledWith('user123', {
        limit: 10,
        offset: 0,
        unreadOnly: true,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockNotifications,
      });
    });

    it('should handle empty notifications', async () => {
      mockNotificationService.getUserNotifications.mockResolvedValue([]);

      await notificationController.getUserNotifications(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: [],
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      mockRequest.params = { notificationId: 'notif123' };
      mockNotificationService.markAsRead.mockResolvedValue(true);

      await notificationController.markAsRead(mockRequest as Request, mockResponse as Response);

      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('notif123', 'user123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Notification marked as read',
      });
    });

    it('should handle notification not found', async () => {
      mockRequest.params = { notificationId: 'nonexistent' };
      mockNotificationService.markAsRead.mockResolvedValue(false);

      await notificationController.markAsRead(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Notification not found',
      });
    });

    it('should handle missing notificationId parameter', async () => {
      mockRequest.params = {};

      await notificationController.markAsRead(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Notification ID is required',
      });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      mockNotificationService.markAllAsRead.mockResolvedValue(5);

      await notificationController.markAllAsRead(mockRequest as Request, mockResponse as Response);

      expect(mockNotificationService.markAllAsRead).toHaveBeenCalledWith('user123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'All notifications marked as read',
        count: 5,
      });
    });

    it('should handle no notifications to mark', async () => {
      mockNotificationService.markAllAsRead.mockResolvedValue(0);

      await notificationController.markAllAsRead(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'All notifications marked as read',
        count: 0,
      });
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      mockRequest.params = { notificationId: 'notif123' };
      mockNotificationService.deleteNotification.mockResolvedValue(true);

      await notificationController.deleteNotification(mockRequest as Request, mockResponse as Response);

      expect(mockNotificationService.deleteNotification).toHaveBeenCalledWith('notif123', 'user123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Notification deleted successfully',
      });
    });

    it('should handle notification not found for deletion', async () => {
      mockRequest.params = { notificationId: 'nonexistent' };
      mockNotificationService.deleteNotification.mockResolvedValue(false);

      await notificationController.deleteNotification(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Notification not found',
      });
    });

    it('should handle missing notificationId parameter', async () => {
      mockRequest.params = {};

      await notificationController.deleteNotification(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Notification ID is required',
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should get unread notification count', async () => {
      mockNotificationService.getUnreadCount.mockResolvedValue(3);

      await notificationController.getUnreadCount(mockRequest as Request, mockResponse as Response);

      expect(mockNotificationService.getUnreadCount).toHaveBeenCalledWith('user123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        count: 3,
      });
    });

    it('should handle zero unread notifications', async () => {
      mockNotificationService.getUnreadCount.mockResolvedValue(0);

      await notificationController.getUnreadCount(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        count: 0,
      });
    });
  });

  describe('createNotification', () => {
    it('should create a notification', async () => {
      const notificationData = {
        type: 'like',
        message: 'User liked your post',
        recipientId: 'user456',
        sourceId: 'post123',
      };

      const mockNotification = {
        id: 'notif123',
        ...notificationData,
        read: false,
        createdAt: new Date(),
      };

      mockRequest.body = notificationData;
      mockNotificationService.createNotification.mockResolvedValue(mockNotification);

      await notificationController.createNotification(mockRequest as Request, mockResponse as Response);

      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(notificationData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockNotification,
      });
    });

    it('should handle notification creation errors', async () => {
      mockRequest.body = {
        type: 'like',
        message: 'User liked your post',
        recipientId: 'user456',
      };

      mockNotificationService.createNotification.mockRejectedValue(new Error('Creation failed'));

      await expect(
        notificationController.createNotification(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow('Creation failed');
    });
  });
});