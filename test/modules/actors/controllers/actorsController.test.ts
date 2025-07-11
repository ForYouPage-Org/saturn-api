import { ActorsController } from '../../../../src/modules/actors/controllers/actorsController';
import type { ActorService } from '../../../../src/modules/actors/services/actorService';
import type { UploadService } from '../../../../src/modules/media/services/upload.service';
import type { PostService } from '../../../../src/modules/posts/services/postService';
import type { Request, Response, NextFunction } from 'express';
import { AppError, ErrorType } from '../../../../src/utils/errors';
import { ObjectId } from 'mongodb';
import { jest } from '@jest/globals';

// Define interfaces for testing
interface CreateActorControllerDTO {
  username: string;
  email: string;
  password?: string;
  displayName?: string;
  summary?: string;
}

interface UserWithAdminStatus {
  preferredUsername?: string;
  isAdmin?: boolean;
}

interface ActorProfileUpdate {
  displayName?: string;
  summary?: string;
  icon?: {
    type: 'Image';
    mediaType: string;
    url: string;
  };
}

interface RequestWithUser extends Request {
  user?: UserWithAdminStatus;
}

describe('ActorsController', () => {
  let mockActorService: jest.Mocked<ActorService>;
  let mockUploadService: jest.Mocked<UploadService>;
  let mockPostService: jest.Mocked<PostService>;
  let actorsController: ActorsController;
  let mockRequest: Partial<RequestWithUser>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockActorService = {
      getActorByUsername: jest.fn(),
      getActorById: jest.fn(),
      createLocalActor: jest.fn(),
      updateActorProfile: jest.fn(),
      updateActor: jest.fn(),
      deleteActor: jest.fn(),
      searchActors: jest.fn(),
      followActor: jest.fn(),
      unfollowActor: jest.fn(),
    } as any;

    mockUploadService = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
      getFileUrl: jest.fn(),
    } as any;

    mockPostService = {
      getPostById: jest.fn(),
      createPost: jest.fn(),
      updatePost: jest.fn(),
      deletePost: jest.fn(),
      likePost: jest.fn(),
      unlikePost: jest.fn(),
      sharePost: jest.fn(),
      unsharePost: jest.fn(),
    } as any;

    actorsController = new ActorsController(
      mockActorService,
      mockUploadService,
      mockPostService,
      'example.com'
    );

    mockRequest = {
      body: {},
      params: {},
      query: {},
      user: undefined,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('searchActors', () => {
    it('should search actors with query parameter', async () => {
      const mockActors = [
        {
          id: 'actor1',
          preferredUsername: 'testuser1',
          displayName: 'Test User 1',
          summary: 'Test bio 1',
        },
        {
          id: 'actor2',
          preferredUsername: 'testuser2',
          displayName: 'Test User 2',
          summary: 'Test bio 2',
        },
      ];

      mockRequest.query = { q: 'test' };
      mockActorService.searchActors.mockResolvedValue(mockActors);

      const result = await actorsController.searchActors(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockActorService.searchActors).toHaveBeenCalledWith('test');
      expect(mockResponse.json).toHaveBeenCalledWith(mockActors);
    });

    it('should handle empty query parameter', async () => {
      const mockActors = [];

      mockRequest.query = {};
      mockActorService.searchActors.mockResolvedValue(mockActors);

      const result = await actorsController.searchActors(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockActorService.searchActors).toHaveBeenCalledWith('');
      expect(mockResponse.json).toHaveBeenCalledWith(mockActors);
    });

    it('should handle service errors', async () => {
      mockRequest.query = { q: 'test' };
      mockActorService.searchActors.mockRejectedValue(new Error('Service error'));

      await expect(
        actorsController.searchActors(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow('Service error');
    });
  });

  describe('createActor', () => {
    it('should create a new actor successfully', async () => {
      const actorData: CreateActorControllerDTO = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
        summary: 'Test bio',
      };

      const mockCreatedActor = {
        id: 'actor123',
        preferredUsername: 'testuser',
        displayName: 'Test User',
        summary: 'Test bio',
      };

      mockRequest.body = actorData;
      mockActorService.createLocalActor.mockResolvedValue(mockCreatedActor);

      await actorsController.createActor(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockActorService.createLocalActor).toHaveBeenCalledWith(actorData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        id: 'actor123',
        username: 'testuser',
      });
    });

    it('should throw error for missing username', async () => {
      const actorData = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockRequest.body = actorData;

      await actorsController.createActor(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Missing required fields (username, email, password)',
          statusCode: 400,
          type: ErrorType.BAD_REQUEST,
        })
      );
    });

    it('should throw error for missing email', async () => {
      const actorData = {
        username: 'testuser',
        password: 'password123',
      };

      mockRequest.body = actorData;

      await actorsController.createActor(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Missing required fields (username, email, password)',
          statusCode: 400,
          type: ErrorType.BAD_REQUEST,
        })
      );
    });

    it('should throw error for missing password', async () => {
      const actorData = {
        username: 'testuser',
        email: 'test@example.com',
      };

      mockRequest.body = actorData;

      await actorsController.createActor(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Missing required fields (username, email, password)',
          statusCode: 400,
          type: ErrorType.BAD_REQUEST,
        })
      );
    });

    it('should handle service errors', async () => {
      const actorData: CreateActorControllerDTO = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      mockRequest.body = actorData;
      mockActorService.createLocalActor.mockRejectedValue(new Error('Service error'));

      await actorsController.createActor(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getActorByUsername', () => {
    it('should return actor without sensitive information', async () => {
      const mockActor = {
        id: 'actor123',
        preferredUsername: 'testuser',
        displayName: 'Test User',
        summary: 'Test bio',
        password: 'hashed_password',
        email: 'test@example.com',
      };

      mockRequest.params = { username: 'testuser' };
      mockActorService.getActorByUsername.mockResolvedValue(mockActor);

      const result = await actorsController.getActorByUsername(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockActorService.getActorByUsername).toHaveBeenCalledWith('testuser');
      expect(mockResponse.json).toHaveBeenCalledWith({
        id: 'actor123',
        preferredUsername: 'testuser',
        displayName: 'Test User',
        summary: 'Test bio',
      });
    });

    it('should return 404 when actor not found', async () => {
      mockRequest.params = { username: 'nonexistent' };
      mockActorService.getActorByUsername.mockResolvedValue(null);

      const result = await actorsController.getActorByUsername(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockActorService.getActorByUsername).toHaveBeenCalledWith('nonexistent');
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Actor not found' });
    });

    it('should handle service errors', async () => {
      mockRequest.params = { username: 'testuser' };
      mockActorService.getActorByUsername.mockRejectedValue(new Error('Service error'));

      await expect(
        actorsController.getActorByUsername(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow('Service error');
    });
  });

  describe('updateActor', () => {
    it('should update actor successfully', async () => {
      const updates: ActorProfileUpdate = {
        displayName: 'Updated Name',
        summary: 'Updated bio',
      };

      const mockUpdatedActor = {
        id: 'actor123',
        preferredUsername: 'testuser',
        displayName: 'Updated Name',
        summary: 'Updated bio',
      };

      mockRequest.params = { id: 'actor123' };
      mockRequest.body = updates;
      mockActorService.updateActorProfile.mockResolvedValue(mockUpdatedActor);

      await actorsController.updateActor(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockActorService.updateActorProfile).toHaveBeenCalledWith('actor123', updates);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        id: 'actor123',
        username: 'testuser',
      });
    });

    it('should handle update failure', async () => {
      const updates: ActorProfileUpdate = {
        displayName: 'Updated Name',
      };

      mockRequest.params = { id: 'actor123' };
      mockRequest.body = updates;
      mockActorService.updateActorProfile.mockResolvedValue(null);

      await actorsController.updateActor(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Actor not found or update failed',
          statusCode: 404,
          type: ErrorType.NOT_FOUND,
        })
      );
    });

    it('should handle service errors', async () => {
      const updates: ActorProfileUpdate = {
        displayName: 'Updated Name',
      };

      mockRequest.params = { id: 'actor123' };
      mockRequest.body = updates;
      mockActorService.updateActorProfile.mockRejectedValue(new Error('Service error'));

      await actorsController.updateActor(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('deleteActor', () => {
    it('should delete actor successfully', async () => {
      mockRequest.params = { id: 'actor123' };
      mockActorService.deleteActor.mockResolvedValue(true);

      await actorsController.deleteActor(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockActorService.deleteActor).toHaveBeenCalledWith('actor123');
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should handle delete failure and retry', async () => {
      mockRequest.params = { id: new ObjectId().toHexString() };
      mockActorService.deleteActor
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce(true);

      await actorsController.deleteActor(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockActorService.deleteActor).toHaveBeenCalledTimes(2);
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should handle actor not found', async () => {
      mockRequest.params = { id: new ObjectId().toHexString() };
      mockActorService.deleteActor
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce(false);

      await actorsController.deleteActor(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Actor not found',
          statusCode: 404,
          type: ErrorType.NOT_FOUND,
        })
      );
    });

    it('should handle service errors', async () => {
      mockRequest.params = { id: 'actor123' };
      mockActorService.deleteActor.mockRejectedValue(new Error('Service error'));

      await actorsController.deleteActor(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getActorPosts', () => {
    it('should return placeholder response with default pagination', () => {
      mockRequest.params = { username: 'testuser' };
      mockRequest.query = {};

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      actorsController.getActorPosts(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'getPostsByActorUsername not implemented in PostService'
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        posts: [],
        total: 0,
        limit: 10,
        offset: 0,
      });

      consoleSpy.mockRestore();
    });

    it('should handle custom pagination parameters', () => {
      mockRequest.params = { username: 'testuser' };
      mockRequest.query = { limit: '5', offset: '10' };

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      actorsController.getActorPosts(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        posts: [],
        total: 0,
        limit: 5,
        offset: 10,
      });

      consoleSpy.mockRestore();
    });

    it('should handle invalid pagination parameters', () => {
      mockRequest.params = { username: 'testuser' };
      mockRequest.query = { limit: 'invalid', offset: 'invalid' };

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      actorsController.getActorPosts(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        posts: [],
        total: 0,
        limit: 10,
        offset: 0,
      });

      consoleSpy.mockRestore();
    });

    it('should handle errors', () => {
      mockRequest.params = { username: 'testuser' };
      mockRequest.query = {};
      mockResponse.json = jest.fn().mockImplementation(() => {
        throw new Error('Response error');
      });

      actorsController.getActorPosts(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('updateActorByUsername', () => {
    it('should update actor by username successfully', async () => {
      const updates: ActorProfileUpdate = {
        displayName: 'Updated Name',
        summary: 'Updated bio',
      };

      const mockActor = {
        _id: new ObjectId(),
        id: 'actor123',
        preferredUsername: 'testuser',
        displayName: 'Test User',
        summary: 'Test bio',
      };

      const mockUpdatedActor = {
        id: 'actor123',
        preferredUsername: 'testuser',
        displayName: 'Updated Name',
        summary: 'Updated bio',
      };

      mockRequest.params = { username: 'testuser' };
      mockRequest.body = updates;
      mockRequest.user = { preferredUsername: 'testuser' };
      mockActorService.getActorByUsername.mockResolvedValue(mockActor);
      mockActorService.updateActor.mockResolvedValue(mockUpdatedActor);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await actorsController.updateActorByUsername(
        mockRequest as RequestWithUser,
        mockResponse as Response,
        mockNext
      );

      expect(mockActorService.getActorByUsername).toHaveBeenCalledWith('testuser');
      expect(mockActorService.updateActor).toHaveBeenCalledWith('testuser', {
        displayName: 'Updated Name',
        summary: 'Updated bio',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        id: 'actor123',
        username: 'testuser',
        displayName: 'Updated Name',
      });

      consoleSpy.mockRestore();
    });

    it('should allow admin to update any actor', async () => {
      const updates: ActorProfileUpdate = {
        displayName: 'Updated Name',
      };

      const mockActor = {
        _id: new ObjectId(),
        id: 'actor123',
        preferredUsername: 'testuser',
        displayName: 'Test User',
      };

      const mockUpdatedActor = {
        id: 'actor123',
        preferredUsername: 'testuser',
        displayName: 'Updated Name',
      };

      mockRequest.params = { username: 'testuser' };
      mockRequest.body = updates;
      mockRequest.user = { preferredUsername: 'admin', isAdmin: true };
      mockActorService.getActorByUsername.mockResolvedValue(mockActor);
      mockActorService.updateActor.mockResolvedValue(mockUpdatedActor);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await actorsController.updateActorByUsername(
        mockRequest as RequestWithUser,
        mockResponse as Response,
        mockNext
      );

      expect(mockActorService.updateActor).toHaveBeenCalledWith('testuser', {
        displayName: 'Updated Name',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);

      consoleSpy.mockRestore();
    });

    it('should reject unauthorized update', async () => {
      const updates: ActorProfileUpdate = {
        displayName: 'Updated Name',
      };

      mockRequest.params = { username: 'testuser' };
      mockRequest.body = updates;
      mockRequest.user = { preferredUsername: 'otheruser' };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await actorsController.updateActorByUsername(
        mockRequest as RequestWithUser,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Not authorized to update this actor',
          statusCode: 403,
          type: ErrorType.FORBIDDEN,
        })
      );

      consoleSpy.mockRestore();
    });

    it('should handle actor not found', async () => {
      const updates: ActorProfileUpdate = {
        displayName: 'Updated Name',
      };

      mockRequest.params = { username: 'nonexistent' };
      mockRequest.body = updates;
      mockRequest.user = { preferredUsername: 'nonexistent' };
      mockActorService.getActorByUsername.mockResolvedValue(null);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await actorsController.updateActorByUsername(
        mockRequest as RequestWithUser,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Actor not found with username: nonexistent',
          statusCode: 404,
          type: ErrorType.NOT_FOUND,
        })
      );

      consoleSpy.mockRestore();
    });

    it('should handle update service errors', async () => {
      const updates: ActorProfileUpdate = {
        displayName: 'Updated Name',
      };

      const mockActor = {
        _id: new ObjectId(),
        id: 'actor123',
        preferredUsername: 'testuser',
        displayName: 'Test User',
      };

      mockRequest.params = { username: 'testuser' };
      mockRequest.body = updates;
      mockRequest.user = { preferredUsername: 'testuser' };
      mockActorService.getActorByUsername.mockResolvedValue(mockActor);
      mockActorService.updateActor.mockRejectedValue(new Error('Update failed'));

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await actorsController.updateActorByUsername(
        mockRequest as RequestWithUser,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Actor update failed: Update failed',
          statusCode: 500,
          type: ErrorType.INTERNAL_SERVER_ERROR,
        })
      );

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle null update result', async () => {
      const updates: ActorProfileUpdate = {
        displayName: 'Updated Name',
      };

      const mockActor = {
        _id: new ObjectId(),
        id: 'actor123',
        preferredUsername: 'testuser',
        displayName: 'Test User',
      };

      mockRequest.params = { username: 'testuser' };
      mockRequest.body = updates;
      mockRequest.user = { preferredUsername: 'testuser' };
      mockActorService.getActorByUsername.mockResolvedValue(mockActor);
      mockActorService.updateActor.mockResolvedValue(null);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await actorsController.updateActorByUsername(
        mockRequest as RequestWithUser,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Actor update failed',
          statusCode: 500,
          type: ErrorType.INTERNAL_SERVER_ERROR,
        })
      );

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Constructor', () => {
    it('should initialize with correct services and domain', () => {
      const controller = new ActorsController(
        mockActorService,
        mockUploadService,
        mockPostService,
        'test.domain'
      );

      expect(controller['actorService']).toBe(mockActorService);
      expect(controller['uploadService']).toBe(mockUploadService);
      expect(controller['postService']).toBe(mockPostService);
      expect(controller['domain']).toBe('test.domain');
    });
  });
});