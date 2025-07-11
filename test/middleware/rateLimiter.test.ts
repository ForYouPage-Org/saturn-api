import {
  defaultRateLimiter,
  authRateLimiter,
  createPostRateLimiter,
  mediaUploadRateLimiter,
  engagementRateLimiter,
} from '../../src/middleware/rateLimiter';
import { ErrorType } from '../../src/utils/errors';
import type { Request, Response, NextFunction } from 'express';
import { jest } from '@jest/globals';

// Mock express-rate-limit
jest.mock('express-rate-limit', () => {
  return jest.fn().mockImplementation((options) => {
    return jest.fn().mockImplementation((req: Request, res: Response, next: NextFunction) => {
      // Mock implementation that can be controlled in tests
      if (req.headers['x-test-rate-limit'] === 'exceeded') {
        return res.status(429).json(options.message);
      }
      next();
    });
  });
});

describe('Rate Limiter Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      ip: '127.0.0.1',
      method: 'GET',
      path: '/test',
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('defaultRateLimiter', () => {
    it('should allow requests within limit', () => {
      defaultRateLimiter(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should block requests when rate limit is exceeded', () => {
      mockRequest.headers = { 'x-test-rate-limit': 'exceeded' };

      defaultRateLimiter(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        type: ErrorType.RATE_LIMIT,
        message: 'Too many requests, please try again later',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should have correct configuration', () => {
      const rateLimit = require('express-rate-limit');
      expect(rateLimit).toHaveBeenCalledWith({
        windowMs: 15 * 60 * 1000, // 15 minutes
        limit: 100,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        message: {
          status: 'error',
          type: ErrorType.RATE_LIMIT,
          message: 'Too many requests, please try again later',
        },
      });
    });
  });

  describe('authRateLimiter', () => {
    it('should allow authentication requests within limit', () => {
      authRateLimiter(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should block authentication requests when rate limit is exceeded', () => {
      mockRequest.headers = { 'x-test-rate-limit': 'exceeded' };

      authRateLimiter(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        type: ErrorType.RATE_LIMIT,
        message: 'Too many authentication attempts, please try again later',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should have correct configuration', () => {
      const rateLimit = require('express-rate-limit');
      expect(rateLimit).toHaveBeenCalledWith({
        windowMs: 15 * 60 * 1000, // 15 minutes
        limit: 10,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        message: {
          status: 'error',
          type: ErrorType.RATE_LIMIT,
          message: 'Too many authentication attempts, please try again later',
        },
      });
    });
  });

  describe('createPostRateLimiter', () => {
    it('should allow post creation requests within limit', () => {
      createPostRateLimiter(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should block post creation requests when rate limit is exceeded', () => {
      mockRequest.headers = { 'x-test-rate-limit': 'exceeded' };

      createPostRateLimiter(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        type: ErrorType.RATE_LIMIT,
        message: 'You are posting too frequently, please try again later',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should have correct configuration', () => {
      const rateLimit = require('express-rate-limit');
      expect(rateLimit).toHaveBeenCalledWith({
        windowMs: 5 * 60 * 1000, // 5 minutes
        limit: 20,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        message: {
          status: 'error',
          type: ErrorType.RATE_LIMIT,
          message: 'You are posting too frequently, please try again later',
        },
      });
    });
  });

  describe('mediaUploadRateLimiter', () => {
    it('should allow media upload requests within limit', () => {
      mediaUploadRateLimiter(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should block media upload requests when rate limit is exceeded', () => {
      mockRequest.headers = { 'x-test-rate-limit': 'exceeded' };

      mediaUploadRateLimiter(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        type: ErrorType.RATE_LIMIT,
        message: 'Too many file uploads, please try again later',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should have correct configuration', () => {
      const rateLimit = require('express-rate-limit');
      expect(rateLimit).toHaveBeenCalledWith({
        windowMs: 60 * 60 * 1000, // 1 hour
        limit: 50,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        message: {
          status: 'error',
          type: ErrorType.RATE_LIMIT,
          message: 'Too many file uploads, please try again later',
        },
      });
    });
  });

  describe('engagementRateLimiter', () => {
    it('should allow engagement requests within limit', () => {
      engagementRateLimiter(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should block engagement requests when rate limit is exceeded', () => {
      mockRequest.headers = { 'x-test-rate-limit': 'exceeded' };

      engagementRateLimiter(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        type: ErrorType.RATE_LIMIT,
        message: 'Too many interactions, please try again later',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should have correct configuration', () => {
      const rateLimit = require('express-rate-limit');
      expect(rateLimit).toHaveBeenCalledWith({
        windowMs: 5 * 60 * 1000, // 5 minutes
        limit: 100,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        message: {
          status: 'error',
          type: ErrorType.RATE_LIMIT,
          message: 'Too many interactions, please try again later',
        },
      });
    });
  });

  describe('Rate Limiter Behavior', () => {
    it('should handle different IP addresses independently', () => {
      // Test with first IP
      mockRequest.ip = '127.0.0.1';
      defaultRateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);

      // Test with second IP
      mockRequest.ip = '192.168.1.1';
      defaultRateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(2);
    });

    it('should handle requests with different methods', () => {
      // Test GET request
      mockRequest.method = 'GET';
      defaultRateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);

      // Test POST request
      mockRequest.method = 'POST';
      defaultRateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(2);
    });

    it('should handle requests with different paths', () => {
      // Test first path
      mockRequest.path = '/api/posts';
      defaultRateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);

      // Test second path
      mockRequest.path = '/api/users';
      defaultRateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(2);
    });

    it('should handle missing IP address', () => {
      mockRequest.ip = undefined;
      defaultRateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Rate Limiter Configuration Validation', () => {
    it('should have different limits for different types of operations', () => {
      const rateLimit = require('express-rate-limit');
      const calls = (rateLimit as jest.Mock).mock.calls;

      // Extract limit values from the configuration calls
      const limits = calls.map(call => call[0].limit);
      
      // Verify that different rate limiters have different limits
      expect(limits).toContain(100); // defaultRateLimiter
      expect(limits).toContain(10);  // authRateLimiter
      expect(limits).toContain(20);  // createPostRateLimiter
      expect(limits).toContain(50);  // mediaUploadRateLimiter
      expect(limits).toContain(100); // engagementRateLimiter
    });

    it('should have different time windows for different operations', () => {
      const rateLimit = require('express-rate-limit');
      const calls = (rateLimit as jest.Mock).mock.calls;

      // Extract windowMs values from the configuration calls
      const windows = calls.map(call => call[0].windowMs);
      
      // Verify that different rate limiters have different time windows
      expect(windows).toContain(15 * 60 * 1000); // 15 minutes
      expect(windows).toContain(5 * 60 * 1000);  // 5 minutes
      expect(windows).toContain(60 * 60 * 1000); // 1 hour
    });

    it('should use consistent header configuration', () => {
      const rateLimit = require('express-rate-limit');
      const calls = (rateLimit as jest.Mock).mock.calls;

      calls.forEach(call => {
        expect(call[0].standardHeaders).toBe('draft-7');
        expect(call[0].legacyHeaders).toBe(false);
      });
    });

    it('should have appropriate error messages for each limiter', () => {
      const rateLimit = require('express-rate-limit');
      const calls = (rateLimit as jest.Mock).mock.calls;

      const messages = calls.map(call => call[0].message.message);
      
      expect(messages).toContain('Too many requests, please try again later');
      expect(messages).toContain('Too many authentication attempts, please try again later');
      expect(messages).toContain('You are posting too frequently, please try again later');
      expect(messages).toContain('Too many file uploads, please try again later');
      expect(messages).toContain('Too many interactions, please try again later');
    });
  });
});