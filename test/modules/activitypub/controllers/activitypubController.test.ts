import { ActivityPubController } from '../../../../src/modules/activitypub/controllers/activitypubController';
import type { ActorService } from '../../../../src/modules/actors/services/actorService';
import type { ActivityPubService } from '../../../../src/modules/activitypub/services/activitypub.service';
import type { Request, Response } from 'express';
import { jest } from '@jest/globals';

describe('ActivityPubController', () => {
  let mockActorService: jest.Mocked<ActorService>;
  let mockActivityPubService: jest.Mocked<ActivityPubService>;
  let activityPubController: ActivityPubController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockActorService = {
      getActorByUsername: jest.fn(),
      getActorById: jest.fn(),
      createActor: jest.fn(),
      updateActor: jest.fn(),
      deleteActor: jest.fn(),
      followActor: jest.fn(),
      unfollowActor: jest.fn(),
    } as any;

    mockActivityPubService = {
      processIncomingActivity: jest.fn(),
    } as any;

    activityPubController = new ActivityPubController(
      mockActorService,
      mockActivityPubService,
      'example.com'
    );

    mockRequest = {
      params: {},
      body: {},
      hostname: 'example.com',
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      contentType: jest.fn().mockReturnThis(),
    };
  });

  describe('getActor', () => {
    it('should return actor profile in ActivityPub format', async () => {
      const mockActor = {
        id: 'https://example.com/users/testuser',
        type: 'Person',
        preferredUsername: 'testuser',
        displayName: 'Test User',
        name: 'Test User',
        summary: 'Test bio',
        inbox: 'https://example.com/users/testuser/inbox',
        outbox: 'https://example.com/users/testuser/outbox',
        followers: 'https://example.com/users/testuser/followers',
        publicKey: {
          id: 'https://example.com/users/testuser#main-key',
          owner: 'https://example.com/users/testuser',
          publicKeyPem: 'PUBLIC_KEY_PEM',
        },
        icon: 'https://example.com/avatar.jpg',
      };

      mockRequest.params = { username: 'testuser' };
      mockActorService.getActorByUsername.mockResolvedValue(mockActor);

      await activityPubController.getActor(mockRequest as Request, mockResponse as Response);

      expect(mockActorService.getActorByUsername).toHaveBeenCalledWith('testuser');
      expect(mockResponse.contentType).toHaveBeenCalledWith('application/activity+json');
      expect(mockResponse.json).toHaveBeenCalledWith({
        '@context': [
          'https://www.w3.org/ns/activitystreams',
          'https://w3id.org/security/v1',
        ],
        id: mockActor.id,
        type: mockActor.type,
        preferredUsername: mockActor.preferredUsername,
        name: mockActor.displayName,
        summary: mockActor.summary,
        inbox: mockActor.inbox,
        outbox: mockActor.outbox,
        followers: mockActor.followers,
        following: 'https://example.com/users/testuser/following',
        publicKey: mockActor.publicKey,
        icon: mockActor.icon,
      });
    });

    it('should return 404 when actor not found', async () => {
      mockRequest.params = { username: 'nonexistent' };
      mockActorService.getActorByUsername.mockResolvedValue(null);

      await activityPubController.getActor(mockRequest as Request, mockResponse as Response);

      expect(mockActorService.getActorByUsername).toHaveBeenCalledWith('nonexistent');
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.send).toHaveBeenCalledWith('Actor not found');
    });

    it('should handle actor without displayName', async () => {
      const mockActor = {
        id: 'https://example.com/users/testuser',
        type: 'Person',
        preferredUsername: 'testuser',
        name: 'Test User',
        summary: 'Test bio',
        inbox: 'https://example.com/users/testuser/inbox',
        outbox: 'https://example.com/users/testuser/outbox',
        followers: 'https://example.com/users/testuser/followers',
        publicKey: {
          id: 'https://example.com/users/testuser#main-key',
          owner: 'https://example.com/users/testuser',
          publicKeyPem: 'PUBLIC_KEY_PEM',
        },
      };

      mockRequest.params = { username: 'testuser' };
      mockActorService.getActorByUsername.mockResolvedValue(mockActor);

      await activityPubController.getActor(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test User',
        })
      );
    });

    it('should handle actor service errors', async () => {
      mockRequest.params = { username: 'testuser' };
      mockActorService.getActorByUsername.mockRejectedValue(new Error('Service error'));

      await expect(
        activityPubController.getActor(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow('Service error');
    });
  });

  describe('receiveActivity', () => {
    it('should process valid ActivityPub activity', async () => {
      const mockActivity = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Follow',
        actor: 'https://remote.example/users/follower',
        object: 'https://example.com/users/testuser',
        id: 'https://remote.example/activities/123',
      };

      mockRequest.body = mockActivity;
      mockRequest.params = { username: 'testuser' };
      mockActivityPubService.processIncomingActivity.mockResolvedValue();

      const result = await activityPubController.receiveActivity(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockActivityPubService.processIncomingActivity).toHaveBeenCalledWith(
        mockActivity,
        'testuser'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(202);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Activity accepted' });
    });

    it('should reject invalid activity without type', async () => {
      const invalidActivity = {
        actor: 'https://remote.example/users/follower',
        object: 'https://example.com/users/testuser',
      };

      mockRequest.body = invalidActivity;
      mockRequest.params = { username: 'testuser' };

      const result = await activityPubController.receiveActivity(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockActivityPubService.processIncomingActivity).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid ActivityPub activity format',
      });
    });

    it('should reject invalid activity without actor', async () => {
      const invalidActivity = {
        type: 'Follow',
        object: 'https://example.com/users/testuser',
      };

      mockRequest.body = invalidActivity;
      mockRequest.params = { username: 'testuser' };

      const result = await activityPubController.receiveActivity(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockActivityPubService.processIncomingActivity).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid ActivityPub activity format',
      });
    });

    it('should handle service errors', async () => {
      const mockActivity = {
        type: 'Follow',
        actor: 'https://remote.example/users/follower',
        object: 'https://example.com/users/testuser',
      };

      mockRequest.body = mockActivity;
      mockRequest.params = { username: 'testuser' };
      mockActivityPubService.processIncomingActivity.mockRejectedValue(new Error('Service error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await activityPubController.receiveActivity(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error processing activity:',
        'Service error',
        expect.any(Object)
      );
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Failed to process activity',
      });

      consoleSpy.mockRestore();
    });

    it('should handle non-Error exceptions', async () => {
      const mockActivity = {
        type: 'Follow',
        actor: 'https://remote.example/users/follower',
        object: 'https://example.com/users/testuser',
      };

      mockRequest.body = mockActivity;
      mockRequest.params = { username: 'testuser' };
      mockActivityPubService.processIncomingActivity.mockRejectedValue('String error');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await activityPubController.receiveActivity(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(consoleSpy).toHaveBeenCalledWith('Unknown error processing activity:', 'String error');
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Failed to process activity',
      });

      consoleSpy.mockRestore();
    });
  });

  describe('getOutbox', () => {
    it('should return empty ordered collection', () => {
      mockRequest.params = { username: 'testuser' };

      const result = activityPubController.getOutbox(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith({
        '@context': 'https://www.w3.org/ns/activitystreams',
        id: 'https://example.com/users/testuser/outbox',
        type: 'OrderedCollection',
        totalItems: 0,
        orderedItems: [],
      });
    });

    it('should handle errors gracefully', () => {
      mockRequest.params = { username: 'testuser' };
      // Mock response.json to throw an error
      mockResponse.json = jest.fn().mockImplementation(() => {
        throw new Error('JSON error');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = activityPubController.getOutbox(mockRequest as Request, mockResponse as Response);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching outbox:',
        'JSON error',
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });

    it('should handle non-Error exceptions in outbox', () => {
      mockRequest.params = { username: 'testuser' };
      // Mock response.json to throw a non-Error
      mockResponse.json = jest.fn().mockImplementation(() => {
        throw 'String error';
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = activityPubController.getOutbox(mockRequest as Request, mockResponse as Response);

      expect(consoleSpy).toHaveBeenCalledWith('Unknown error fetching outbox:', 'String error');

      consoleSpy.mockRestore();
    });
  });

  describe('Constructor', () => {
    it('should initialize with correct services and domain', () => {
      const controller = new ActivityPubController(
        mockActorService,
        mockActivityPubService,
        'test.domain'
      );

      expect(controller['actorService']).toBe(mockActorService);
      expect(controller['activityPubService']).toBe(mockActivityPubService);
      expect(controller['domain']).toBe('test.domain');
    });
  });
});