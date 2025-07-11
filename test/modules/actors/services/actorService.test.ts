import { ActorService, CreateActorData } from '../../../../src/modules/actors/services/actorService';
import type { ActorRepository } from '../../../../src/modules/actors/repositories/actorRepository';
import type { NotificationService } from '../../../../src/modules/notifications/services/notification.service';
import type { Actor } from '../../../../src/modules/actors/models/actor';
import { AppError, ErrorType } from '../../../../src/utils/errors';
import { ObjectId } from 'mongodb';
import { jest } from '@jest/globals';

describe('ActorService', () => {
  let mockActorRepository: jest.Mocked<ActorRepository>;
  let mockNotificationService: jest.Mocked<NotificationService>;
  let actorService: ActorService;

  beforeEach(() => {
    mockActorRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      findByPreferredUsername: jest.fn(),
      search: jest.fn(),
      updateProfile: jest.fn(),
      updateProfileByUsername: jest.fn(),
      deleteByUsername: jest.fn(),
      addFollowing: jest.fn(),
      removeFollowing: jest.fn(),
      findFollowers: jest.fn(),
      findFollowing: jest.fn(),
      usernameExists: jest.fn(),
    } as any;

    mockNotificationService = {
      createNotification: jest.fn(),
      getNotifications: jest.fn(),
      markRead: jest.fn(),
      markAllRead: jest.fn(),
      getUnreadCount: jest.fn(),
    } as any;

    actorService = new ActorService(mockActorRepository, 'example.com');
    actorService.setNotificationService(mockNotificationService);
  });

  describe('createLocalActor', () => {
    it('should create a local actor successfully', async () => {
      const actorData: CreateActorData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
        summary: 'Test bio',
        isAdmin: false,
        isVerified: false,
      };

      const mockCreatedActor = {
        _id: new ObjectId(),
        id: 'https://example.com/actors/testuser',
        type: 'Person',
        username: 'testuser@example.com',
        preferredUsername: 'testuser',
        name: 'Test User',
        displayName: 'Test User',
        summary: 'Test bio',
        email: 'test@example.com',
        password: 'password123',
        inbox: 'https://example.com/actors/testuser/inbox',
        outbox: 'https://example.com/actors/testuser/outbox',
        followers: 'https://example.com/actors/testuser/followers',
        following: [],
        isAdmin: false,
        isVerified: false,
        isRemote: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockActorRepository.findOne.mockResolvedValue(null); // Username and email don't exist
      mockActorRepository.create.mockResolvedValue(mockCreatedActor);

      const result = await actorService.createLocalActor(actorData);

      expect(mockActorRepository.findOne).toHaveBeenCalledWith({
        preferredUsername: 'testuser',
      });
      expect(mockActorRepository.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
      expect(mockActorRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          preferredUsername: 'testuser',
          email: 'test@example.com',
          displayName: 'Test User',
          summary: 'Test bio',
          isAdmin: false,
          isVerified: false,
          isRemote: false,
        })
      );
      expect(result).toEqual(mockCreatedActor);
    });

    it('should use username as default display name', async () => {
      const actorData: CreateActorData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const mockCreatedActor = {
        _id: new ObjectId(),
        preferredUsername: 'testuser',
        displayName: 'testuser',
        name: 'testuser',
      };

      mockActorRepository.findOne.mockResolvedValue(null);
      mockActorRepository.create.mockResolvedValue(mockCreatedActor);

      const result = await actorService.createLocalActor(actorData);

      expect(mockActorRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          displayName: 'testuser',
          name: 'testuser',
        })
      );
      expect(result).toEqual(mockCreatedActor);
    });

    it('should throw error when password is missing', async () => {
      const actorData: CreateActorData = {
        username: 'testuser',
        email: 'test@example.com',
        // password missing
      };

      await expect(actorService.createLocalActor(actorData)).rejects.toThrow(
        expect.objectContaining({
          message: 'Password is required for local actor creation',
          statusCode: 400,
          type: ErrorType.BAD_REQUEST,
        })
      );

      expect(mockActorRepository.findOne).not.toHaveBeenCalled();
      expect(mockActorRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error when username already exists', async () => {
      const actorData: CreateActorData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const existingActor = {
        _id: new ObjectId(),
        preferredUsername: 'testuser',
      };

      mockActorRepository.findOne.mockResolvedValueOnce(existingActor);

      await expect(actorService.createLocalActor(actorData)).rejects.toThrow(
        expect.objectContaining({
          message: 'Username already taken',
          statusCode: 409,
          type: ErrorType.CONFLICT,
        })
      );

      expect(mockActorRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error when email already exists', async () => {
      const actorData: CreateActorData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const existingActor = {
        _id: new ObjectId(),
        email: 'test@example.com',
      };

      mockActorRepository.findOne
        .mockResolvedValueOnce(null) // Username doesn't exist
        .mockResolvedValueOnce(existingActor); // Email exists

      await expect(actorService.createLocalActor(actorData)).rejects.toThrow(
        expect.objectContaining({
          message: 'Email already registered',
          statusCode: 409,
          type: ErrorType.CONFLICT,
        })
      );

      expect(mockActorRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getActorById', () => {
    it('should return null for null/undefined id', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result1 = await actorService.getActorById(null as any);
      const result2 = await actorService.getActorById(undefined as any);

      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(mockActorRepository.findById).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should find actor by ObjectId', async () => {
      const actorId = new ObjectId();
      const mockActor = {
        _id: actorId,
        id: 'https://example.com/actors/testuser',
        preferredUsername: 'testuser',
      };

      mockActorRepository.findById.mockResolvedValue(mockActor);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = await actorService.getActorById(actorId);

      expect(mockActorRepository.findById).toHaveBeenCalledWith(actorId);
      expect(result).toEqual(mockActor);

      consoleSpy.mockRestore();
    });

    it('should find actor by valid ObjectId string', async () => {
      const actorId = new ObjectId();
      const mockActor = {
        _id: actorId,
        id: 'https://example.com/actors/testuser',
        preferredUsername: 'testuser',
      };

      mockActorRepository.findById.mockResolvedValue(mockActor);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = await actorService.getActorById(actorId.toString());

      expect(mockActorRepository.findById).toHaveBeenCalledWith(actorId);
      expect(result).toEqual(mockActor);

      consoleSpy.mockRestore();
    });

    it('should try multiple lookup strategies', async () => {
      const actorId = new ObjectId();
      const mockActor = {
        _id: actorId,
        id: 'https://example.com/actors/testuser',
        preferredUsername: 'testuser',
      };

      mockActorRepository.findById.mockResolvedValue(null);
      mockActorRepository.findOne.mockResolvedValue(mockActor);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = await actorService.getActorById(actorId);

      expect(mockActorRepository.findById).toHaveBeenCalledWith(actorId);
      expect(mockActorRepository.findOne).toHaveBeenCalledWith({ _id: actorId });
      expect(result).toEqual(mockActor);

      consoleSpy.mockRestore();
    });

    it('should handle URL-like string IDs', async () => {
      const apId = 'https://example.com/actors/testuser';
      const mockActor = {
        _id: new ObjectId(),
        id: apId,
        preferredUsername: 'testuser',
      };

      mockActorRepository.findById.mockResolvedValue(null);
      mockActorRepository.findOne.mockResolvedValue(mockActor);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = await actorService.getActorById(apId);

      expect(mockActorRepository.findById).toHaveBeenCalledWith(apId);
      expect(mockActorRepository.findOne).toHaveBeenCalledWith({ id: apId });
      expect(result).toEqual(mockActor);

      consoleSpy.mockRestore();
    });

    it('should handle errors gracefully', async () => {
      const actorId = new ObjectId();

      mockActorRepository.findById.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await actorService.getActorById(actorId);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ActorService] Error in getActorById:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle invalid ObjectId strings', async () => {
      const invalidId = 'invalid-id';
      const mockActor = {
        _id: new ObjectId(),
        id: 'https://example.com/actors/testuser',
        preferredUsername: 'testuser',
      };

      mockActorRepository.findById.mockResolvedValue(mockActor);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = await actorService.getActorById(invalidId);

      expect(mockActorRepository.findById).toHaveBeenCalledWith(invalidId);
      expect(result).toEqual(mockActor);

      consoleSpy.mockRestore();
    });
  });

  describe('getActorByApId', () => {
    it('should find actor by ActivityPub ID', async () => {
      const apId = 'https://example.com/actors/testuser';
      const mockActor = {
        _id: new ObjectId(),
        id: apId,
        preferredUsername: 'testuser',
      };

      mockActorRepository.findOne.mockResolvedValue(mockActor);

      const result = await actorService.getActorByApId(apId);

      expect(mockActorRepository.findOne).toHaveBeenCalledWith({ id: apId });
      expect(result).toEqual(mockActor);
    });

    it('should return null when actor not found', async () => {
      const apId = 'https://example.com/actors/nonexistent';

      mockActorRepository.findOne.mockResolvedValue(null);

      const result = await actorService.getActorByApId(apId);

      expect(result).toBeNull();
    });
  });

  describe('getActorByUsername', () => {
    it('should find actor by preferred username', async () => {
      const username = 'testuser';
      const mockActor = {
        _id: new ObjectId(),
        id: 'https://example.com/actors/testuser',
        preferredUsername: username,
      };

      mockActorRepository.findByPreferredUsername.mockResolvedValue(mockActor);

      const result = await actorService.getActorByUsername(username);

      expect(mockActorRepository.findByPreferredUsername).toHaveBeenCalledWith(username);
      expect(result).toEqual(mockActor);
    });

    it('should return null when actor not found', async () => {
      const username = 'nonexistent';

      mockActorRepository.findByPreferredUsername.mockResolvedValue(null);

      const result = await actorService.getActorByUsername(username);

      expect(result).toBeNull();
    });
  });

  describe('getActorByFullUsername', () => {
    it('should find actor by full username', async () => {
      const fullUsername = 'testuser@example.com';
      const mockActor = {
        _id: new ObjectId(),
        id: 'https://example.com/actors/testuser',
        username: fullUsername,
        preferredUsername: 'testuser',
      };

      mockActorRepository.findOne.mockResolvedValue(mockActor);

      const result = await actorService.getActorByFullUsername(fullUsername);

      expect(mockActorRepository.findOne).toHaveBeenCalledWith({ username: fullUsername });
      expect(result).toEqual(mockActor);
    });

    it('should return null when actor not found', async () => {
      const fullUsername = 'nonexistent@example.com';

      mockActorRepository.findOne.mockResolvedValue(null);

      const result = await actorService.getActorByFullUsername(fullUsername);

      expect(result).toBeNull();
    });
  });

  describe('searchActors', () => {
    it('should search actors with default limit', async () => {
      const query = 'test';
      const mockActors = [
        {
          _id: new ObjectId(),
          id: 'https://example.com/actors/testuser1',
          preferredUsername: 'testuser1',
        },
        {
          _id: new ObjectId(),
          id: 'https://example.com/actors/testuser2',
          preferredUsername: 'testuser2',
        },
      ];

      mockActorRepository.search.mockResolvedValue(mockActors);

      const result = await actorService.searchActors(query);

      expect(mockActorRepository.search).toHaveBeenCalledWith(query, 10);
      expect(result).toEqual(mockActors);
    });

    it('should search actors with custom limit', async () => {
      const query = 'test';
      const limit = 5;
      const mockActors = [
        {
          _id: new ObjectId(),
          id: 'https://example.com/actors/testuser1',
          preferredUsername: 'testuser1',
        },
      ];

      mockActorRepository.search.mockResolvedValue(mockActors);

      const result = await actorService.searchActors(query, limit);

      expect(mockActorRepository.search).toHaveBeenCalledWith(query, limit);
      expect(result).toEqual(mockActors);
    });

    it('should return empty array when no actors found', async () => {
      const query = 'nonexistent';

      mockActorRepository.search.mockResolvedValue([]);

      const result = await actorService.searchActors(query);

      expect(result).toEqual([]);
    });
  });

  describe('updateActorProfile', () => {
    it('should update actor profile successfully', async () => {
      const actorId = new ObjectId();
      const updates = {
        displayName: 'Updated Name',
        summary: 'Updated bio',
      };

      const mockUpdatedActor = {
        _id: actorId,
        id: 'https://example.com/actors/testuser',
        preferredUsername: 'testuser',
        displayName: 'Updated Name',
        summary: 'Updated bio',
      };

      mockActorRepository.updateProfile.mockResolvedValue(mockUpdatedActor);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = await actorService.updateActorProfile(actorId, updates);

      expect(mockActorRepository.updateProfile).toHaveBeenCalledWith(actorId, updates);
      expect(result).toEqual(mockUpdatedActor);

      consoleSpy.mockRestore();
    });

    it('should return null for invalid actorId', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await actorService.updateActorProfile(null as any, {
        displayName: 'Updated Name',
      });

      expect(result).toBeNull();
      expect(mockActorRepository.updateProfile).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ActorService] updateActorProfile called with null/undefined actorId'
      );

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should return null for empty updates', async () => {
      const actorId = new ObjectId();

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await actorService.updateActorProfile(actorId, {});

      expect(result).toBeNull();
      expect(mockActorRepository.updateProfile).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ActorService] Empty update payload provided');

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle repository errors', async () => {
      const actorId = new ObjectId();
      const updates = { displayName: 'Updated Name' };

      mockActorRepository.updateProfile.mockRejectedValue(new Error('Repository error'));

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(actorService.updateActorProfile(actorId, updates)).rejects.toThrow(
        'Repository error'
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in updateActorProfile'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('updateActor', () => {
    it('should update actor by username', async () => {
      const username = 'testuser';
      const updates = {
        displayName: 'Updated Name',
        summary: 'Updated bio',
      };

      const mockUpdatedActor = {
        _id: new ObjectId(),
        preferredUsername: username,
        displayName: 'Updated Name',
        summary: 'Updated bio',
      };

      mockActorRepository.updateProfileByUsername.mockResolvedValue(mockUpdatedActor);

      const result = await actorService.updateActor(username, updates);

      expect(mockActorRepository.updateProfileByUsername).toHaveBeenCalledWith(username, updates);
      expect(result).toEqual(mockUpdatedActor);
    });

    it('should return null when actor not found', async () => {
      const username = 'nonexistent';
      const updates = { displayName: 'Updated Name' };

      mockActorRepository.updateProfileByUsername.mockResolvedValue(null);

      const result = await actorService.updateActor(username, updates);

      expect(result).toBeNull();
    });
  });

  describe('deleteActor', () => {
    it('should delete actor by username successfully', async () => {
      const username = 'testuser';

      mockActorRepository.deleteByUsername.mockResolvedValue(true);

      const result = await actorService.deleteActor(username);

      expect(mockActorRepository.deleteByUsername).toHaveBeenCalledWith(username);
      expect(result).toBe(true);
    });

    it('should return false when actor not found', async () => {
      const username = 'nonexistent';

      mockActorRepository.deleteByUsername.mockResolvedValue(false);

      const result = await actorService.deleteActor(username);

      expect(result).toBe(false);
    });
  });

  describe('follow', () => {
    it('should follow actor successfully', async () => {
      const followerId = new ObjectId();
      const followeeApId = 'https://example.com/actors/followee';

      const mockFollower = {
        _id: followerId,
        id: 'https://example.com/actors/follower',
        preferredUsername: 'follower',
      };

      const mockFollowee = {
        _id: new ObjectId(),
        id: followeeApId,
        preferredUsername: 'followee',
      };

      mockActorRepository.findById.mockResolvedValue(mockFollower);
      mockActorRepository.findOne.mockResolvedValue(mockFollowee);
      mockActorRepository.addFollowing.mockResolvedValue(true);

      const result = await actorService.follow(followerId, followeeApId);

      expect(mockActorRepository.addFollowing).toHaveBeenCalledWith(followerId, followeeApId);
      expect(result).toBe(true);
    });

    it('should throw error when follower not found', async () => {
      const followerId = new ObjectId();
      const followeeApId = 'https://example.com/actors/followee';

      mockActorRepository.findById.mockResolvedValue(null);

      await expect(actorService.follow(followerId, followeeApId)).rejects.toThrow(
        expect.objectContaining({
          message: 'Follower not found',
          statusCode: 404,
          type: ErrorType.NOT_FOUND,
        })
      );
    });

    it('should throw error when followee not found', async () => {
      const followerId = new ObjectId();
      const followeeApId = 'https://example.com/actors/followee';

      const mockFollower = {
        _id: followerId,
        id: 'https://example.com/actors/follower',
        preferredUsername: 'follower',
      };

      mockActorRepository.findById.mockResolvedValue(mockFollower);
      mockActorRepository.findOne.mockResolvedValue(null);

      await expect(actorService.follow(followerId, followeeApId)).rejects.toThrow(
        expect.objectContaining({
          message: 'Followee not found',
          statusCode: 404,
          type: ErrorType.NOT_FOUND,
        })
      );
    });
  });

  describe('unfollow', () => {
    it('should unfollow actor successfully', async () => {
      const followerId = new ObjectId();
      const followeeApId = 'https://example.com/actors/followee';

      const mockFollower = {
        _id: followerId,
        id: 'https://example.com/actors/follower',
        preferredUsername: 'follower',
      };

      mockActorRepository.findById.mockResolvedValue(mockFollower);
      mockActorRepository.removeFollowing.mockResolvedValue(true);

      const result = await actorService.unfollow(followerId, followeeApId);

      expect(mockActorRepository.removeFollowing).toHaveBeenCalledWith(followerId, followeeApId);
      expect(result).toBe(true);
    });

    it('should throw error when follower not found', async () => {
      const followerId = new ObjectId();
      const followeeApId = 'https://example.com/actors/followee';

      mockActorRepository.findById.mockResolvedValue(null);

      await expect(actorService.unfollow(followerId, followeeApId)).rejects.toThrow(
        expect.objectContaining({
          message: 'Follower not found',
          statusCode: 404,
          type: ErrorType.NOT_FOUND,
        })
      );
    });
  });

  describe('getFollowers', () => {
    it('should get followers with default pagination', async () => {
      const actorApId = 'https://example.com/actors/testuser';
      const mockFollowers = [
        {
          _id: new ObjectId(),
          id: 'https://example.com/actors/follower1',
          preferredUsername: 'follower1',
        },
        {
          _id: new ObjectId(),
          id: 'https://example.com/actors/follower2',
          preferredUsername: 'follower2',
        },
      ];

      mockActorRepository.findFollowers.mockResolvedValue(mockFollowers);

      const result = await actorService.getFollowers(actorApId);

      expect(mockActorRepository.findFollowers).toHaveBeenCalledWith(actorApId, 1, 20);
      expect(result).toEqual(mockFollowers);
    });

    it('should get followers with custom pagination', async () => {
      const actorApId = 'https://example.com/actors/testuser';
      const mockFollowers = [
        {
          _id: new ObjectId(),
          id: 'https://example.com/actors/follower1',
          preferredUsername: 'follower1',
        },
      ];

      mockActorRepository.findFollowers.mockResolvedValue(mockFollowers);

      const result = await actorService.getFollowers(actorApId, 2, 10);

      expect(mockActorRepository.findFollowers).toHaveBeenCalledWith(actorApId, 2, 10);
      expect(result).toEqual(mockFollowers);
    });
  });

  describe('getFollowing', () => {
    it('should get following with default pagination', async () => {
      const actorId = new ObjectId();
      const mockFollowing = [
        {
          _id: new ObjectId(),
          id: 'https://example.com/actors/following1',
          preferredUsername: 'following1',
        },
        {
          _id: new ObjectId(),
          id: 'https://example.com/actors/following2',
          preferredUsername: 'following2',
        },
      ];

      mockActorRepository.findFollowing.mockResolvedValue(mockFollowing);

      const result = await actorService.getFollowing(actorId);

      expect(mockActorRepository.findFollowing).toHaveBeenCalledWith(actorId, 1, 20);
      expect(result).toEqual(mockFollowing);
    });

    it('should get following with custom pagination', async () => {
      const actorId = new ObjectId();
      const mockFollowing = [
        {
          _id: new ObjectId(),
          id: 'https://example.com/actors/following1',
          preferredUsername: 'following1',
        },
      ];

      mockActorRepository.findFollowing.mockResolvedValue(mockFollowing);

      const result = await actorService.getFollowing(actorId, 2, 10);

      expect(mockActorRepository.findFollowing).toHaveBeenCalledWith(actorId, 2, 10);
      expect(result).toEqual(mockFollowing);
    });
  });

  describe('fetchRemoteActor', () => {
    it('should return null and log warning for not implemented method', async () => {
      const actorUrl = 'https://remote.example.com/actors/testuser';

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await actorService.fetchRemoteActor(actorUrl);

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        `Fetching remote actor ${actorUrl} not implemented`
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('usernameExists', () => {
    it('should return true when username exists', async () => {
      const username = 'testuser';

      mockActorRepository.usernameExists.mockResolvedValue(true);

      const result = await actorService.usernameExists(username);

      expect(mockActorRepository.usernameExists).toHaveBeenCalledWith(username);
      expect(result).toBe(true);
    });

    it('should return false when username does not exist', async () => {
      const username = 'nonexistent';

      mockActorRepository.usernameExists.mockResolvedValue(false);

      const result = await actorService.usernameExists(username);

      expect(result).toBe(false);
    });
  });

  describe('Service Dependencies', () => {
    it('should set notification service', () => {
      const newNotificationService = mockNotificationService;
      actorService.setNotificationService(newNotificationService);

      expect(actorService['notificationService']).toBe(newNotificationService);
    });
  });
});