import { auth, authenticateToken, authenticate, requireAuth, generateToken } from '../../src/middleware/auth';
import type { Request, Response, NextFunction } from 'express';
import type { DbUser } from '../../src/modules/auth/models/user';
import type { AuthService } from '../../src/modules/auth/services/auth.service';
import type { Db } from 'mongodb';
import jwt from 'jsonwebtoken';
import { AppError, ErrorType } from '../../src/utils/errors';
import { jest } from '@jest/globals';

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
}));

// Mock jwt
jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockDb: jest.Mocked<Db>;
  let mockCollection: any;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      path: '/test',
      method: 'GET',
      ip: '127.0.0.1',
      app: {
        locals: {},
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    mockCollection = {
      findOne: jest.fn(),
    };

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection),
    } as any;

    mockAuthService = {
      verifyToken: jest.fn(),
      createUser: jest.fn(),
      loginUser: jest.fn(),
      getUserById: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
    } as any;

    // Set up environment variable
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate a JWT token for a user', () => {
      const mockUser: DbUser = {
        _id: 'user123',
        preferredUsername: 'testuser',
        email: 'test@example.com',
        password: 'hashed_password',
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockToken = 'generated-jwt-token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const result = generateToken(mockUser);

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: 'user123',
          username: 'testuser',
        },
        'test-secret',
        {
          expiresIn: '7d',
          algorithm: 'HS256',
        }
      );
      expect(result).toBe(mockToken);
    });

    it('should handle user with id field instead of _id', () => {
      const mockUser: DbUser = {
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed_password',
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockToken = 'generated-jwt-token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const result = generateToken(mockUser);

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: 'user123',
          username: 'testuser',
        },
        'test-secret',
        expect.any(Object)
      );
      expect(result).toBe(mockToken);
    });

    it('should throw error when JWT_SECRET is not defined', () => {
      delete process.env.JWT_SECRET;

      const mockUser: DbUser = {
        _id: 'user123',
        preferredUsername: 'testuser',
        email: 'test@example.com',
        password: 'hashed_password',
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => generateToken(mockUser)).toThrow('JWT_SECRET is not defined');
    });
  });

  describe('auth (deprecated)', () => {
    beforeEach(() => {
      mockRequest.app!.locals.db = mockDb;
    });

    it('should authenticate user with valid token', async () => {
      const mockUser: DbUser = {
        _id: 'user123',
        preferredUsername: 'testuser',
        email: 'test@example.com',
        password: 'hashed_password',
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      (jwt.verify as jest.Mock).mockReturnValue({
        id: 'user123',
        username: 'testuser',
      });

      mockCollection.findOne.mockResolvedValue(mockUser);

      await auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret', {
        algorithms: ['HS256'],
      });
      expect(mockCollection.findOne).toHaveBeenCalledWith({
        $or: [{ _id: 'user123' }, { preferredUsername: 'testuser' }],
      });
      expect(mockRequest.user).toBe(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when authorization header is missing', async () => {
      await auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authorization header required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header does not start with Bearer', async () => {
      mockRequest.headers = {
        authorization: 'Basic token',
      };

      await auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authorization header required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token is missing', async () => {
      mockRequest.headers = {
        authorization: 'Bearer ',
      };

      await auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'No token provided',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 when JWT_SECRET is not defined', async () => {
      delete process.env.JWT_SECRET;

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      await auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server configuration error',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 when database is not available', async () => {
      mockRequest.app!.locals.db = undefined;
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      (jwt.verify as jest.Mock).mockReturnValue({
        id: 'user123',
        username: 'testuser',
      });

      await auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server configuration error',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not found in database', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      (jwt.verify as jest.Mock).mockReturnValue({
        id: 'user123',
        username: 'testuser',
      });

      mockCollection.findOne.mockResolvedValue(null);

      await auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token verification fails', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      (jwt.verify as jest.Mock).mockReturnValue({
        id: 'user123',
        username: 'testuser',
      });

      mockCollection.findOne.mockRejectedValue(new Error('Database error'));

      await auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('authenticateToken (deprecated)', () => {
    it('should authenticate user with valid token', () => {
      const mockUser: DbUser = {
        _id: 'user123',
        preferredUsername: 'testuser',
        email: 'test@example.com',
        password: 'hashed_password',
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockUser);

      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret', {
        algorithms: ['HS256'],
      });
      expect(mockRequest.user).toBe(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when no token is provided', () => {
      mockRequest.headers = {};

      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'No token provided',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 when JWT_SECRET is not defined', () => {
      delete process.env.JWT_SECRET;

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Server configuration error',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when token verification fails', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('authenticate (recommended)', () => {
    let authenticateMiddleware: ReturnType<typeof authenticate>;

    beforeEach(() => {
      authenticateMiddleware = authenticate(mockAuthService);
    });

    it('should authenticate user with valid token', async () => {
      const mockUser: DbUser = {
        _id: 'user123',
        preferredUsername: 'testuser',
        email: 'test@example.com',
        password: 'hashed_password',
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      mockAuthService.verifyToken.mockResolvedValue(mockUser);

      await authenticateMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(mockRequest.user).toBe(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when authorization header is missing', async () => {
      await authenticateMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authorization header required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header does not start with Bearer', async () => {
      mockRequest.headers = {
        authorization: 'Basic token',
      };

      await authenticateMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authorization header required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token is missing', async () => {
      mockRequest.headers = {
        authorization: 'Bearer ',
      };

      await authenticateMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'No token provided',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when user verification fails', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      mockAuthService.verifyToken.mockResolvedValue(null);

      await authenticateMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with AppError when auth service throws error', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      mockAuthService.verifyToken.mockRejectedValue(new Error('Auth service error'));

      await authenticateMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication failed',
          statusCode: 401,
          type: ErrorType.AUTHENTICATION,
        })
      );
    });

    it('should handle non-Error exceptions', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      mockAuthService.verifyToken.mockRejectedValue('String error');

      await authenticateMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication failed',
          statusCode: 401,
          type: ErrorType.AUTHENTICATION,
        })
      );
    });
  });

  describe('requireAuth', () => {
    it('should proceed when user is authenticated', () => {
      mockRequest.user = {
        _id: 'user123',
        preferredUsername: 'testuser',
        email: 'test@example.com',
        password: 'hashed_password',
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      mockRequest.user = undefined;

      requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when user is null', () => {
      mockRequest.user = null as any;

      requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete authentication flow', async () => {
      const mockUser: DbUser = {
        _id: 'user123',
        preferredUsername: 'testuser',
        email: 'test@example.com',
        password: 'hashed_password',
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Generate token
      const mockToken = 'generated-jwt-token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);
      const token = generateToken(mockUser);

      // Use token in authenticate middleware
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockAuthService.verifyToken.mockResolvedValue(mockUser);

      const authenticateMiddleware = authenticate(mockAuthService);
      await authenticateMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toBe(mockUser);
      expect(mockNext).toHaveBeenCalled();

      // Test requireAuth middleware
      requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(2);
    });

    it('should handle edge cases with malformed tokens', async () => {
      const testCases = [
        'Bearer',
        'Bearer  ',
        'Bearer token-with-spaces token',
        'Bearer token-with-newlines\n',
        'Bearer token-with-tabs\t',
      ];

      const authenticateMiddleware = authenticate(mockAuthService);

      for (const authHeader of testCases) {
        mockRequest.headers = { authorization: authHeader };
        mockNext.mockClear();
        (mockResponse.status as jest.Mock).mockClear();
        (mockResponse.json as jest.Mock).mockClear();

        await authenticateMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockNext).not.toHaveBeenCalled();
      }
    });
  });
});