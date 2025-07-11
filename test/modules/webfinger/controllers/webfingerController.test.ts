import { WebFingerController } from '../../../../src/modules/webfinger/controllers/webfingerController';
import type { ActorService } from '../../../../src/modules/actors/services/actorService';
import type { WebfingerService } from '../../../../src/modules/webfinger/services/webfinger.service';
import type { Request, Response } from 'express';
import type { ServiceContainer } from '../../../../src/utils/container';
import { jest } from '@jest/globals';

// Extend Request type for testing
interface RequestWithServices extends Request {
  services: ServiceContainer;
}

describe('WebFingerController', () => {
  let mockActorService: jest.Mocked<ActorService>;
  let mockWebfingerService: jest.Mocked<WebfingerService>;
  let mockServiceContainer: jest.Mocked<ServiceContainer>;
  let webfingerController: WebFingerController;
  let mockRequest: Partial<RequestWithServices>;
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

    mockWebfingerService = {
      repository: {} as any,
      domain: 'example.com',
    } as any;

    mockServiceContainer = {
      get: jest.fn(),
      set: jest.fn(),
      has: jest.fn(),
      resolve: jest.fn(),
    } as any;

    webfingerController = new WebFingerController(
      mockActorService,
      mockWebfingerService,
      'example.com'
    );

    mockRequest = {
      query: {},
      services: mockServiceContainer,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('getResource', () => {
    it('should return WebFinger response for valid resource', async () => {
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

      mockRequest.query = { resource: 'acct:testuser@example.com' };
      mockActorService.getActorByUsername.mockResolvedValue(mockActor);

      const result = await webfingerController.getResource(
        mockRequest as RequestWithServices,
        mockResponse as Response
      );

      expect(mockActorService.getActorByUsername).toHaveBeenCalledWith('testuser');
      expect(mockResponse.json).toHaveBeenCalledWith({
        subject: 'acct:testuser@example.com',
        links: [
          {
            rel: 'self',
            type: 'application/activity+json',
            href: 'https://example.com/users/testuser',
          },
        ],
      });
    });

    it('should return 400 when resource parameter is missing', async () => {
      mockRequest.query = {};

      const result = await webfingerController.getResource(
        mockRequest as RequestWithServices,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Resource query parameter is required',
      });
      expect(mockActorService.getActorByUsername).not.toHaveBeenCalled();
    });

    it('should return 400 when resource parameter is empty', async () => {
      mockRequest.query = { resource: '' };

      const result = await webfingerController.getResource(
        mockRequest as RequestWithServices,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Resource query parameter is required',
      });
      expect(mockActorService.getActorByUsername).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid resource format', async () => {
      mockRequest.query = { resource: 'invalid-format' };

      const result = await webfingerController.getResource(
        mockRequest as RequestWithServices,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid resource format',
      });
      expect(mockActorService.getActorByUsername).not.toHaveBeenCalled();
    });

    it('should return 400 for resource without acct: prefix', async () => {
      mockRequest.query = { resource: 'testuser@example.com' };

      const result = await webfingerController.getResource(
        mockRequest as RequestWithServices,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid resource format',
      });
      expect(mockActorService.getActorByUsername).not.toHaveBeenCalled();
    });

    it('should return 400 for resource without @ symbol', async () => {
      mockRequest.query = { resource: 'acct:testuser' };

      const result = await webfingerController.getResource(
        mockRequest as RequestWithServices,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid resource format',
      });
      expect(mockActorService.getActorByUsername).not.toHaveBeenCalled();
    });

    it('should return 404 for wrong domain', async () => {
      mockRequest.query = { resource: 'acct:testuser@wrong.domain' };

      const result = await webfingerController.getResource(
        mockRequest as RequestWithServices,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Resource not found',
      });
      expect(mockActorService.getActorByUsername).not.toHaveBeenCalled();
    });

    it('should return 404 when actor not found', async () => {
      mockRequest.query = { resource: 'acct:nonexistent@example.com' };
      mockActorService.getActorByUsername.mockResolvedValue(null);

      const result = await webfingerController.getResource(
        mockRequest as RequestWithServices,
        mockResponse as Response
      );

      expect(mockActorService.getActorByUsername).toHaveBeenCalledWith('nonexistent');
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'User not found',
      });
    });

    it('should handle actor service errors', async () => {
      mockRequest.query = { resource: 'acct:testuser@example.com' };
      mockActorService.getActorByUsername.mockRejectedValue(new Error('Service error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await webfingerController.getResource(
        mockRequest as RequestWithServices,
        mockResponse as Response
      );

      expect(consoleSpy).toHaveBeenCalledWith('WebFinger error:', expect.any(Error));
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Server error',
      });

      consoleSpy.mockRestore();
    });

    it('should handle database connection errors', async () => {
      mockRequest.query = { resource: 'acct:testuser@example.com' };
      mockActorService.getActorByUsername.mockRejectedValue(new Error('Database connection failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await webfingerController.getResource(
        mockRequest as RequestWithServices,
        mockResponse as Response
      );

      expect(consoleSpy).toHaveBeenCalledWith('WebFinger error:', expect.any(Error));
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Server error',
      });

      consoleSpy.mockRestore();
    });

    it('should handle special characters in username', async () => {
      const mockActor = {
        id: 'https://example.com/users/user_with-special.chars',
        type: 'Person',
        preferredUsername: 'user_with-special.chars',
        name: 'Special User',
        summary: 'User with special chars',
        inbox: 'https://example.com/users/user_with-special.chars/inbox',
        outbox: 'https://example.com/users/user_with-special.chars/outbox',
        followers: 'https://example.com/users/user_with-special.chars/followers',
      };

      mockRequest.query = { resource: 'acct:user_with-special.chars@example.com' };
      mockActorService.getActorByUsername.mockResolvedValue(mockActor);

      const result = await webfingerController.getResource(
        mockRequest as RequestWithServices,
        mockResponse as Response
      );

      expect(mockActorService.getActorByUsername).toHaveBeenCalledWith('user_with-special.chars');
      expect(mockResponse.json).toHaveBeenCalledWith({
        subject: 'acct:user_with-special.chars@example.com',
        links: [
          {
            rel: 'self',
            type: 'application/activity+json',
            href: 'https://example.com/users/user_with-special.chars',
          },
        ],
      });
    });

    it('should handle subdomain in resource', async () => {
      const webfingerWithSubdomain = new WebFingerController(
        mockActorService,
        mockWebfingerService,
        'sub.example.com'
      );

      const mockActor = {
        id: 'https://sub.example.com/users/testuser',
        type: 'Person',
        preferredUsername: 'testuser',
        name: 'Test User',
        summary: 'Test bio',
        inbox: 'https://sub.example.com/users/testuser/inbox',
        outbox: 'https://sub.example.com/users/testuser/outbox',
        followers: 'https://sub.example.com/users/testuser/followers',
      };

      mockRequest.query = { resource: 'acct:testuser@sub.example.com' };
      mockActorService.getActorByUsername.mockResolvedValue(mockActor);

      const result = await webfingerWithSubdomain.getResource(
        mockRequest as RequestWithServices,
        mockResponse as Response
      );

      expect(mockActorService.getActorByUsername).toHaveBeenCalledWith('testuser');
      expect(mockResponse.json).toHaveBeenCalledWith({
        subject: 'acct:testuser@sub.example.com',
        links: [
          {
            rel: 'self',
            type: 'application/activity+json',
            href: 'https://sub.example.com/users/testuser',
          },
        ],
      });
    });

    it('should handle case sensitivity in domain comparison', async () => {
      mockRequest.query = { resource: 'acct:testuser@EXAMPLE.COM' };

      const result = await webfingerController.getResource(
        mockRequest as RequestWithServices,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Resource not found',
      });
      expect(mockActorService.getActorByUsername).not.toHaveBeenCalled();
    });
  });

  describe('Constructor', () => {
    it('should initialize with correct services and domain', () => {
      const controller = new WebFingerController(
        mockActorService,
        mockWebfingerService,
        'test.domain'
      );

      expect(controller['actorService']).toBe(mockActorService);
      expect(controller['webfingerService']).toBe(mockWebfingerService);
      expect(controller['domain']).toBe('test.domain');
    });
  });
});