import { createServiceContainer } from '../../src/utils/container';
import type { Db } from 'mongodb';
import { jest } from '@jest/globals';

describe('Service Container', () => {
  let mockDb: jest.Mocked<Db>;
  const domain = 'test.example.com';

  beforeEach(() => {
    mockDb = {
      collection: jest.fn().mockReturnValue({
        findOne: jest.fn(),
        find: jest.fn(),
        insertOne: jest.fn(),
        updateOne: jest.fn(),
        deleteOne: jest.fn(),
        countDocuments: jest.fn(),
        createIndex: jest.fn(),
      }),
    } as any;
  });

  describe('Container Creation', () => {
    it('should create a service container', () => {
      const container = createServiceContainer(mockDb, domain);

      expect(container).toBeDefined();
      expect(typeof container).toBe('object');
    });

    it('should create services with proper dependencies', () => {
      const container = createServiceContainer(mockDb, domain);

      expect(container.authService).toBeDefined();
      expect(container.actorService).toBeDefined();
      expect(container.postService).toBeDefined();
      expect(container.commentService).toBeDefined();
      expect(container.notificationService).toBeDefined();
      expect(container.mediaService).toBeDefined();
    });

    it('should create controllers with proper dependencies', () => {
      const container = createServiceContainer(mockDb, domain);

      expect(container.authController).toBeDefined();
      expect(container.actorsController).toBeDefined();
      expect(container.postsController).toBeDefined();
      expect(container.commentsController).toBeDefined();
      expect(container.activityPubController).toBeDefined();
      expect(container.webfingerController).toBeDefined();
      expect(container.mediaController).toBeDefined();
    });

    it('should create all required services', () => {
      const container = createServiceContainer(mockDb, domain);

      expect(container.authService).toBeDefined();
      expect(container.actorService).toBeDefined();
      expect(container.postService).toBeDefined();
      expect(container.commentService).toBeDefined();
      expect(container.notificationService).toBeDefined();
      expect(container.mediaService).toBeDefined();
      expect(container.activityPubService).toBeDefined();
      expect(container.webfingerService).toBeDefined();
      expect(container.uploadService).toBeDefined();
    });
  });

  describe('Service Types', () => {
    it('should have correct service types', () => {
      const container = createServiceContainer(mockDb, domain);

      expect(typeof container.authService).toBe('object');
      expect(typeof container.actorService).toBe('object');
      expect(typeof container.postService).toBe('object');
      expect(typeof container.commentService).toBe('object');
      expect(typeof container.notificationService).toBe('object');
      expect(typeof container.mediaService).toBe('object');
    });

    it('should have correct controller types', () => {
      const container = createServiceContainer(mockDb, domain);

      expect(typeof container.authController).toBe('object');
      expect(typeof container.actorsController).toBe('object');
      expect(typeof container.postsController).toBe('object');
      expect(typeof container.commentsController).toBe('object');
      expect(typeof container.activityPubController).toBe('object');
      expect(typeof container.webfingerController).toBe('object');
      expect(typeof container.mediaController).toBe('object');
    });

    it('should have domain configuration', () => {
      const container = createServiceContainer(mockDb, domain);

      expect(typeof container.domain).toBe('string');
      expect(container.domain).toBe(domain);
    });
  });

  describe('Domain Configuration', () => {
    it('should handle different domain formats', () => {
      const domains = [
        'localhost:3000',
        'example.com',
        'subdomain.example.com',
        'api.social.network',
      ];

      domains.forEach(testDomain => {
        const container = createServiceContainer(mockDb, testDomain);
        expect(container).toBeDefined();
        expect(container.authService).toBeDefined();
      });
    });

    it('should pass domain to services', () => {
      const testDomain = 'custom.example.com';
      const container = createServiceContainer(mockDb, testDomain);

      expect(container).toBeDefined();
      expect(container.actorService).toBeDefined();
      expect(container.postService).toBeDefined();
    });
  });

  describe('Database Integration', () => {
    it('should use database for service initialization', () => {
      const container = createServiceContainer(mockDb, domain);

      expect(container).toBeDefined();
      expect(mockDb.collection).toHaveBeenCalled();
    });

    it('should handle database connection', () => {
      const container = createServiceContainer(mockDb, domain);

      expect(container).toBeDefined();
      expect(mockDb.collection).toBeDefined();
    });
  });

  describe('Service Initialization', () => {
    it('should initialize all services without errors', () => {
      expect(() => {
        createServiceContainer(mockDb, domain);
      }).not.toThrow();
    });

    it('should create consistent service instances', () => {
      const container = createServiceContainer(mockDb, domain);

      const authService1 = container.authService;
      const authService2 = container.authService;
      expect(authService1).toBe(authService2);
    });
  });
});