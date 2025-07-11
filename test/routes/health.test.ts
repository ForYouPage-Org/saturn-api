import request from 'supertest';
import express from 'express';
import { MongoClient } from 'mongodb';
import healthRouter from '../../src/routes/health';
import { jest } from '@jest/globals';

// Mock MongoDB
jest.mock('mongodb');

const MockMongoClient = MongoClient as jest.MockedClass<typeof MongoClient>;

describe('Health Routes', () => {
  let app: express.Application;
  let mockClient: jest.Mocked<MongoClient>;
  let mockDb: any;
  let mockAdmin: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/', healthRouter);

    mockAdmin = {
      ping: jest.fn().mockResolvedValue({ ok: 1 }),
    };

    mockDb = {
      admin: jest.fn().mockReturnValue(mockAdmin),
    };

    mockClient = {
      connect: jest.fn().mockResolvedValue(undefined),
      db: jest.fn().mockReturnValue(mockDb),
      close: jest.fn().mockResolvedValue(undefined),
    } as any;

    MockMongoClient.mockImplementation(() => mockClient);

    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return basic health information', async () => {
      process.env.MONGO_URI = 'mongodb://localhost:27017/test';

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        environment: expect.any(String),
        version: expect.any(String),
        services: {
          database: 'connected',
          memory: expect.objectContaining({
            rss: expect.any(Number),
            heapTotal: expect.any(Number),
            heapUsed: expect.any(Number),
            external: expect.any(Number),
          }),
        },
      });
    });

    it('should connect to MongoDB and test database connection', async () => {
      process.env.MONGO_URI = 'mongodb://localhost:27017/test';

      await request(app).get('/health');

      expect(MockMongoClient).toHaveBeenCalledWith(
        'mongodb://localhost:27017/test',
        {
          serverSelectionTimeoutMS: 2000,
          connectTimeoutMS: 2000,
        }
      );
      expect(mockClient.connect).toHaveBeenCalled();
      expect(mockClient.db).toHaveBeenCalled();
      expect(mockAdmin.ping).toHaveBeenCalled();
      expect(mockClient.close).toHaveBeenCalled();
    });

    it('should use auth service for database check when available', async () => {
      const mockAuthService = {
        verifyToken: jest.fn().mockResolvedValue(null),
      };

      // Mock the request to have services
      app.use((req, res, next) => {
        req.services = { authService: mockAuthService };
        next();
      });

      app.use('/', healthRouter);

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.services.database).toBe('connected');
      expect(mockAuthService.verifyToken).toHaveBeenCalledWith('health-check-dummy-token');
      expect(MockMongoClient).not.toHaveBeenCalled();
    });

    it('should handle database connection failure', async () => {
      process.env.MONGO_URI = 'mongodb://localhost:27017/test';
      mockClient.connect.mockRejectedValue(new Error('Connection failed'));

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.services.database).toBe('error');
      expect(response.body.status).toBe('ok');
    });

    it('should handle missing MONGO_URI', async () => {
      delete process.env.MONGO_URI;

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.services.database).toBe('no_uri');
      expect(MockMongoClient).not.toHaveBeenCalled();
    });

    it('should include environment variables in response', async () => {
      process.env.NODE_ENV = 'test';
      process.env.npm_package_version = '2.0.0';
      process.env.MONGO_URI = 'mongodb://localhost:27017/test';

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.environment).toBe('test');
      expect(response.body.version).toBe('2.0.0');
    });

    it('should use default values when environment variables are not set', async () => {
      delete process.env.NODE_ENV;
      delete process.env.npm_package_version;
      process.env.MONGO_URI = 'mongodb://localhost:27017/test';

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.environment).toBe('development');
      expect(response.body.version).toBe('1.0.0');
    });

    it('should include memory usage information', async () => {
      process.env.MONGO_URI = 'mongodb://localhost:27017/test';

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.services.memory).toEqual({
        rss: expect.any(Number),
        heapTotal: expect.any(Number),
        heapUsed: expect.any(Number),
        external: expect.any(Number),
        arrayBuffers: expect.any(Number),
      });
    });

    it('should include uptime information', async () => {
      process.env.MONGO_URI = 'mongodb://localhost:27017/test';

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.uptime).toBeGreaterThan(0);
      expect(typeof response.body.uptime).toBe('number');
    });

    it('should include ISO timestamp', async () => {
      process.env.MONGO_URI = 'mongodb://localhost:27017/test';

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should handle auth service database check failure', async () => {
      const mockAuthService = {
        verifyToken: jest.fn().mockRejectedValue(new Error('Auth service failed')),
      };

      process.env.MONGO_URI = 'mongodb://localhost:27017/test';

      app.use((req, res, next) => {
        req.services = { authService: mockAuthService };
        next();
      });

      app.use('/', healthRouter);

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.services.database).toBe('connected');
      expect(mockAuthService.verifyToken).toHaveBeenCalledWith('health-check-dummy-token');
      // Should fall back to direct MongoDB connection
      expect(MockMongoClient).toHaveBeenCalled();
    });

    it('should handle MongoDB ping failure', async () => {
      process.env.MONGO_URI = 'mongodb://localhost:27017/test';
      mockAdmin.ping.mockRejectedValue(new Error('Ping failed'));

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.services.database).toBe('error');
      expect(mockClient.connect).toHaveBeenCalled();
      expect(mockAdmin.ping).toHaveBeenCalled();
      expect(mockClient.close).toHaveBeenCalled();
    });

    it('should handle MongoDB client creation failure', async () => {
      process.env.MONGO_URI = 'mongodb://localhost:27017/test';
      MockMongoClient.mockImplementation(() => {
        throw new Error('Client creation failed');
      });

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.services.database).toBe('error');
    });

    it('should close MongoDB connection even if ping fails', async () => {
      process.env.MONGO_URI = 'mongodb://localhost:27017/test';
      mockAdmin.ping.mockRejectedValue(new Error('Ping failed'));

      await request(app).get('/health');

      expect(mockClient.connect).toHaveBeenCalled();
      expect(mockClient.close).toHaveBeenCalled();
    });

    it('should handle connection close failure gracefully', async () => {
      process.env.MONGO_URI = 'mongodb://localhost:27017/test';
      mockClient.close.mockRejectedValue(new Error('Close failed'));

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.services.database).toBe('connected');
      expect(mockClient.close).toHaveBeenCalled();
    });
  });

  describe('GET /ready', () => {
    it('should return readiness status', async () => {
      process.env.MONGO_URI = 'mongodb://localhost:27017/test';

      const response = await request(app).get('/ready');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'ready',
        timestamp: expect.any(String),
        checks: {
          database: 'connected',
          application: 'ready',
        },
      });
    });

    it('should return 503 when database is not connected', async () => {
      process.env.MONGO_URI = 'mongodb://localhost:27017/test';
      mockClient.connect.mockRejectedValue(new Error('Connection failed'));

      const response = await request(app).get('/ready');

      expect(response.status).toBe(503);
      expect(response.body.status).toBe('not_ready');
      expect(response.body.checks.database).toBe('error');
    });

    it('should return 503 when no MONGO_URI is configured', async () => {
      delete process.env.MONGO_URI;

      const response = await request(app).get('/ready');

      expect(response.status).toBe(503);
      expect(response.body.status).toBe('not_ready');
      expect(response.body.checks.database).toBe('no_uri');
    });
  });

  describe('GET /live', () => {
    it('should return liveness status', async () => {
      const response = await request(app).get('/live');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'alive',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        pid: expect.any(Number),
      });
    });

    it('should include process information', async () => {
      const response = await request(app).get('/live');

      expect(response.status).toBe(200);
      expect(response.body.pid).toBe(process.pid);
      expect(response.body.uptime).toBeGreaterThan(0);
    });

    it('should always return 200 for liveness probe', async () => {
      // Even if other services are down, the liveness probe should always succeed
      const response = await request(app).get('/live');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('alive');
    });
  });
});