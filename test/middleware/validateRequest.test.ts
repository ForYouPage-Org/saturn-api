import { validateRequestBody, validateRequestQuery, validateRequestParams } from '../../src/middleware/validateRequest';
import { AppError, ErrorType } from '../../src/utils/errors';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { jest } from '@jest/globals';

describe('Request Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockRequest = {
      method: 'POST',
      path: '/test',
      headers: {},
      body: {},
      query: {},
      params: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    // Set NODE_ENV to test to suppress console.log
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateRequestBody', () => {
    const userSchema = z.object({
      username: z.string().min(3, 'Username must be at least 3 characters'),
      email: z.string().email('Invalid email format'),
      age: z.number().min(0, 'Age must be non-negative').optional(),
    });

    it('should validate valid request body', () => {
      const validBody = {
        username: 'testuser',
        email: 'test@example.com',
        age: 25,
      };

      mockRequest.body = validBody;

      const middleware = validateRequestBody(userSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body).toEqual(validBody);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should validate valid request body without optional fields', () => {
      const validBody = {
        username: 'testuser',
        email: 'test@example.com',
      };

      mockRequest.body = validBody;

      const middleware = validateRequestBody(userSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body).toEqual(validBody);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject invalid request body', () => {
      const invalidBody = {
        username: 'ab', // Too short
        email: 'invalid-email', // Invalid format
        age: -5, // Negative age
      };

      mockRequest.body = invalidBody;

      const middleware = validateRequestBody(userSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: expect.any(Object),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request body with missing required fields', () => {
      const incompleteBody = {
        username: 'testuser',
        // Missing email
      };

      mockRequest.body = incompleteBody;

      const middleware = validateRequestBody(userSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: expect.any(Object),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should skip validation for multipart/form-data requests', () => {
      mockRequest.headers = {
        'content-type': 'multipart/form-data; boundary=something',
      };
      mockRequest.body = {}; // Empty body that would normally fail validation

      const middleware = validateRequestBody(userSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle unexpected validation errors', () => {
      const faultySchema = {
        safeParse: jest.fn().mockImplementation(() => {
          throw new Error('Unexpected validation error');
        }),
      } as any;

      mockRequest.body = { username: 'testuser', email: 'test@example.com' };

      const middleware = validateRequestBody(faultySchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Internal Server Error during validation',
          statusCode: 500,
          type: ErrorType.INTERNAL_SERVER_ERROR,
        })
      );
    });

    it('should handle empty request body', () => {
      mockRequest.body = {};

      const middleware = validateRequestBody(userSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: expect.any(Object),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle null request body', () => {
      mockRequest.body = null;

      const middleware = validateRequestBody(userSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: expect.any(Object),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle content-type with different casing', () => {
      mockRequest.headers = {
        'Content-Type': 'multipart/form-data; boundary=something',
      };
      mockRequest.body = {}; // Empty body that would normally fail validation

      const middleware = validateRequestBody(userSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('validateRequestQuery', () => {
    const querySchema = z.object({
      page: z.string().transform(val => parseInt(val, 10)).refine(val => val > 0, 'Page must be positive'),
      limit: z.string().transform(val => parseInt(val, 10)).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100').optional(),
      search: z.string().optional(),
    });

    it('should validate valid query parameters', () => {
      const validQuery = {
        page: '1',
        limit: '10',
        search: 'test',
      };

      mockRequest.query = validQuery;

      const middleware = validateRequestQuery(querySchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.query).toEqual({
        page: 1,
        limit: 10,
        search: 'test',
      });
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should validate query parameters without optional fields', () => {
      const validQuery = {
        page: '1',
      };

      mockRequest.query = validQuery;

      const middleware = validateRequestQuery(querySchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.query).toEqual({
        page: 1,
      });
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject invalid query parameters', () => {
      const invalidQuery = {
        page: '0', // Invalid page
        limit: '200', // Invalid limit
      };

      mockRequest.query = invalidQuery;

      const middleware = validateRequestQuery(querySchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Query validation failed',
        details: expect.any(Object),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle missing required query parameters', () => {
      mockRequest.query = {}; // Missing required page parameter

      const middleware = validateRequestQuery(querySchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Query validation failed',
        details: expect.any(Object),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle unexpected validation errors', () => {
      const faultySchema = {
        safeParse: jest.fn().mockImplementation(() => {
          throw new Error('Unexpected validation error');
        }),
      } as any;

      mockRequest.query = { page: '1' };

      const middleware = validateRequestQuery(faultySchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Internal Server Error during query validation',
          statusCode: 500,
          type: ErrorType.INTERNAL_SERVER_ERROR,
        })
      );
    });

    it('should handle non-numeric string values', () => {
      const invalidQuery = {
        page: 'not-a-number',
        limit: 'also-not-a-number',
      };

      mockRequest.query = invalidQuery;

      const middleware = validateRequestQuery(querySchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Query validation failed',
        details: expect.any(Object),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('validateRequestParams', () => {
    const paramsSchema = z.object({
      id: z.string().uuid('Invalid UUID format'),
      slug: z.string().min(1, 'Slug cannot be empty').optional(),
    });

    it('should validate valid URL parameters', () => {
      const validParams = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        slug: 'test-slug',
      };

      mockRequest.params = validParams;

      const middleware = validateRequestParams(paramsSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.params).toEqual(validParams);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should validate URL parameters without optional fields', () => {
      const validParams = {
        id: '123e4567-e89b-12d3-a456-426614174000',
      };

      mockRequest.params = validParams;

      const middleware = validateRequestParams(paramsSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.params).toEqual(validParams);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject invalid URL parameters', () => {
      const invalidParams = {
        id: 'not-a-uuid',
        slug: '', // Empty slug
      };

      mockRequest.params = invalidParams;

      const middleware = validateRequestParams(paramsSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid UUID format', // Should use the custom error message
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle missing required URL parameters', () => {
      mockRequest.params = {}; // Missing required id parameter

      const middleware = validateRequestParams(paramsSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: expect.any(String),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should use default error message when no custom message is available', () => {
      const schemaWithoutCustomMessage = z.object({
        id: z.string().uuid(), // No custom message
      });

      mockRequest.params = {
        id: 'not-a-uuid',
      };

      const middleware = validateRequestParams(schemaWithoutCustomMessage);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'URL parameter validation failed',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle unexpected validation errors', () => {
      const faultySchema = {
        safeParse: jest.fn().mockImplementation(() => {
          throw new Error('Unexpected validation error');
        }),
      } as any;

      mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };

      const middleware = validateRequestParams(faultySchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Internal Server Error during URL parameter validation',
          statusCode: 500,
          type: ErrorType.INTERNAL_SERVER_ERROR,
        })
      );
    });

    it('should handle multiple validation errors and use the first one', () => {
      const invalidParams = {
        id: 'not-a-uuid',
        slug: '',
      };

      mockRequest.params = invalidParams;

      const middleware = validateRequestParams(paramsSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: expect.any(String),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Logging behavior', () => {
    it('should not log in test environment', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const userSchema = z.object({
        username: z.string(),
        email: z.string().email(),
      });

      mockRequest.body = {
        username: 'testuser',
        email: 'test@example.com',
      };

      const middleware = validateRequestBody(userSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should log in non-test environment', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const userSchema = z.object({
        username: z.string(),
        email: z.string().email(),
      });

      mockRequest.body = {
        username: 'testuser',
        email: 'test@example.com',
      };

      const middleware = validateRequestBody(userSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(consoleSpy).toHaveBeenCalled();

      // Restore original environment
      process.env.NODE_ENV = originalNodeEnv;
      consoleSpy.mockRestore();
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined headers', () => {
      const userSchema = z.object({
        username: z.string(),
        email: z.string().email(),
      });

      mockRequest.headers = undefined;
      mockRequest.body = {
        username: 'testuser',
        email: 'test@example.com',
      };

      const middleware = validateRequestBody(userSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle content-type header as array', () => {
      const userSchema = z.object({
        username: z.string(),
        email: z.string().email(),
      });

      mockRequest.headers = {
        'content-type': ['multipart/form-data', 'boundary=something'] as any,
      };
      mockRequest.body = {};

      const middleware = validateRequestBody(userSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Should not skip validation because content-type is array, not string
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle complex nested validation schemas', () => {
      const complexSchema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string(),
            settings: z.object({
              notifications: z.boolean(),
              privacy: z.enum(['public', 'private']),
            }),
          }),
        }),
        metadata: z.array(z.string()).optional(),
      });

      const validComplexBody = {
        user: {
          profile: {
            name: 'Test User',
            settings: {
              notifications: true,
              privacy: 'public',
            },
          },
        },
        metadata: ['tag1', 'tag2'],
      };

      mockRequest.body = validComplexBody;

      const middleware = validateRequestBody(complexSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body).toEqual(validComplexBody);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});