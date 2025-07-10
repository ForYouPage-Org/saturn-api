import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate } from '@/middleware/auth';
import { AuthService } from '@/modules/auth/services/auth.service';

// Mock dependencies
jest.mock('@/modules/auth/services/auth.service');
jest.mock('jsonwebtoken');

const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('Auth Middleware Security Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('JWT Token Validation Security', () => {
    it('should reject malformed JWT tokens', async () => {
      mockRequest.headers = {
        authorization: 'Bearer malformed.token.here',
      };

      mockJwt.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      const middleware = authenticate();
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized - Invalid Token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject tokens with invalid signatures', async () => {
      mockRequest.headers = {
        authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.invalid_signature',
      };

      mockJwt.verify.mockImplementation(() => {
        throw new Error('invalid signature');
      });

      const middleware = authenticate();
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject expired tokens', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid.but.expired.token',
      };

      mockJwt.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      const middleware = authenticate();
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject tokens without Bearer prefix', async () => {
      mockRequest.headers = {
        authorization: 'valid.jwt.token',
      };

      const middleware = authenticate();
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });

    it('should handle missing authorization header securely', async () => {
      mockRequest.headers = {};

      const middleware = authenticate();
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });
  });

  describe('User Lookup Security', () => {
    it('should handle user not found scenarios', async () => {
      const validToken = 'valid.jwt.token';
      mockRequest.headers = {
        authorization: `Bearer ${validToken}`,
      };

      mockJwt.verify.mockReturnValue({ id: 'nonexistent-user-id' });
      mockAuthService.findUserById = jest.fn().mockResolvedValue(null);

      const middleware = authenticate();
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized - User not found',
      });
    });

    it('should handle database errors gracefully', async () => {
      const validToken = 'valid.jwt.token';
      mockRequest.headers = {
        authorization: `Bearer ${validToken}`,
      };

      mockJwt.verify.mockReturnValue({ id: 'valid-user-id' });
      mockAuthService.findUserById = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const middleware = authenticate();
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error',
      });
    });
  });

  describe('JWT Secret Security', () => {
    it('should use environment JWT secret', () => {
      const originalSecret = process.env.JWT_SECRET;
      process.env.JWT_SECRET = 'test-secret-key';

      mockRequest.headers = {
        authorization: 'Bearer valid.jwt.token',
      };

      const middleware = authenticate();
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockJwt.verify).toHaveBeenCalledWith(
        'valid.jwt.token',
        'test-secret-key',
        expect.any(Object)
      );

      process.env.JWT_SECRET = originalSecret;
    });

    it('should fail when JWT_SECRET is not set', () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      mockRequest.headers = {
        authorization: 'Bearer valid.jwt.token',
      };

      const middleware = authenticate();
      
      expect(() => {
        middleware(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow('JWT_SECRET environment variable is required');

      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe('Request Object Security', () => {
    it('should not expose sensitive user data in req.user', async () => {
      const validToken = 'valid.jwt.token';
      mockRequest.headers = {
        authorization: `Bearer ${validToken}`,
      };

      const mockUser = {
        _id: 'user-id',
        id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed-password',
        privateKey: 'sensitive-private-key',
        // ... other sensitive fields
      };

      mockJwt.verify.mockReturnValue({ id: 'user-id' });
      mockAuthService.findUserById = jest.fn().mockResolvedValue(mockUser);

      const middleware = authenticate();
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user).not.toHaveProperty('password');
      expect(mockRequest.user).not.toHaveProperty('privateKey');
    });
  });
});