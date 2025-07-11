import { AuthService } from '../../../../src/modules/auth/services/auth.service';
import type { AuthRepository } from '../../../../src/modules/auth/repositories/auth.repository';
import type { DbUser } from '../../../../src/modules/auth/models/user';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../../../src/utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
}));

describe('AuthService', () => {
  let mockAuthRepository: jest.Mocked<AuthRepository>;
  let authService: AuthService;

  beforeEach(() => {
    mockAuthRepository = {
      findByUsername: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    authService = new AuthService(mockAuthRepository);

    // Set up environment variable
    process.env.JWT_SECRET = 'test-secret';

    // Mock console.log
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('authenticateUser', () => {
    it('should authenticate user with valid credentials', async () => {
      const mockUser: DbUser = {
        _id: 'user123',
        id: 'user123',
        username: 'testuser',
        preferredUsername: 'testuser',
        password: 'hashed_password',
        email: 'test@example.com',
        followers: [],
        following: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockToken = 'generated-jwt-token';

      mockAuthRepository.findByUsername.mockResolvedValue(mockUser);
      (bcryptjs.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const result = await authService.authenticateUser('testuser', 'password123');

      expect(mockAuthRepository.findByUsername).toHaveBeenCalledWith('testuser');
      expect(bcryptjs.compare).toHaveBeenCalledWith('password123', 'hashed_password');
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'user123', username: 'testuser' },
        'test-secret',
        { expiresIn: '24h', algorithm: 'HS256' }
      );
      expect(result).toEqual({
        actor: {
          _id: 'user123',
          id: 'user123',
          username: 'testuser',
          preferredUsername: 'testuser',
          email: 'test@example.com',
          followers: [],
          following: [],
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
        token: mockToken,
      });
    });

    it('should return null when user not found', async () => {
      mockAuthRepository.findByUsername.mockResolvedValue(null);

      const result = await authService.authenticateUser('nonexistent', 'password123');

      expect(mockAuthRepository.findByUsername).toHaveBeenCalledWith('nonexistent');
      expect(bcryptjs.compare).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      const mockUser: DbUser = {
        _id: 'user123',
        id: 'user123',
        username: 'testuser',
        preferredUsername: 'testuser',
        password: 'hashed_password',
        email: 'test@example.com',
        followers: [],
        following: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthRepository.findByUsername.mockResolvedValue(mockUser);
      (bcryptjs.compare as jest.Mock).mockResolvedValue(false);

      const result = await authService.authenticateUser('testuser', 'wrong_password');

      expect(mockAuthRepository.findByUsername).toHaveBeenCalledWith('testuser');
      expect(bcryptjs.compare).toHaveBeenCalledWith('wrong_password', 'hashed_password');
      expect(result).toBeNull();
    });

    it('should throw error when JWT_SECRET is not defined', async () => {
      delete process.env.JWT_SECRET;

      const mockUser: DbUser = {
        _id: 'user123',
        id: 'user123',
        username: 'testuser',
        preferredUsername: 'testuser',
        password: 'hashed_password',
        email: 'test@example.com',
        followers: [],
        following: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthRepository.findByUsername.mockResolvedValue(mockUser);
      (bcryptjs.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        authService.authenticateUser('testuser', 'password123')
      ).rejects.toThrow('JWT_SECRET environment variable is not defined');
    });

    it('should handle repository errors', async () => {
      mockAuthRepository.findByUsername.mockRejectedValue(new Error('Database error'));

      await expect(
        authService.authenticateUser('testuser', 'password123')
      ).rejects.toThrow('Database error');
    });

    it('should handle bcrypt errors', async () => {
      const mockUser: DbUser = {
        _id: 'user123',
        id: 'user123',
        username: 'testuser',
        preferredUsername: 'testuser',
        password: 'hashed_password',
        email: 'test@example.com',
        followers: [],
        following: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthRepository.findByUsername.mockResolvedValue(mockUser);
      (bcryptjs.compare as jest.Mock).mockRejectedValue(new Error('Bcrypt error'));

      await expect(
        authService.authenticateUser('testuser', 'password123')
      ).rejects.toThrow('Bcrypt error');
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const mockToken = 'generated-jwt-token';
      const mockObjectId = new ObjectId().toString();

      mockAuthRepository.findByUsername.mockResolvedValue(null);
      mockAuthRepository.findByEmail.mockResolvedValue(null);
      mockAuthRepository.create.mockResolvedValue(undefined);
      (bcryptjs.hash as jest.Mock).mockResolvedValue('hashed_password');
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      // Mock ObjectId constructor
      jest.spyOn(ObjectId.prototype, 'toString').mockReturnValue(mockObjectId);

      const result = await authService.createUser('testuser', 'password123', 'test@example.com');

      expect(mockAuthRepository.findByUsername).toHaveBeenCalledWith('testuser');
      expect(mockAuthRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcryptjs.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockAuthRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'testuser',
          preferredUsername: 'testuser',
          email: 'test@example.com',
          password: 'hashed_password',
          followers: [],
          following: [],
        })
      );
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: expect.any(String), username: 'testuser' },
        'test-secret',
        { expiresIn: '24h', algorithm: 'HS256' }
      );
      expect(result).toEqual({
        actor: expect.objectContaining({
          username: 'testuser',
          preferredUsername: 'testuser',
          email: 'test@example.com',
          followers: [],
          following: [],
        }),
        token: mockToken,
      });
    });

    it('should throw error when username already exists', async () => {
      const existingUser: DbUser = {
        _id: 'user123',
        id: 'user123',
        username: 'testuser',
        preferredUsername: 'testuser',
        password: 'hashed_password',
        email: 'existing@example.com',
        followers: [],
        following: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthRepository.findByUsername.mockResolvedValue(existingUser);

      await expect(
        authService.createUser('testuser', 'password123', 'test@example.com')
      ).rejects.toThrow('Username or email already exists');

      expect(mockAuthRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error when email already exists', async () => {
      const existingUser: DbUser = {
        _id: 'user123',
        id: 'user123',
        username: 'existinguser',
        preferredUsername: 'existinguser',
        password: 'hashed_password',
        email: 'test@example.com',
        followers: [],
        following: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthRepository.findByUsername.mockResolvedValue(null);
      mockAuthRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(
        authService.createUser('testuser', 'password123', 'test@example.com')
      ).rejects.toThrow('Username or email already exists');

      expect(mockAuthRepository.create).not.toHaveBeenCalled();
    });

    it('should handle MongoDB duplicate key error', async () => {
      mockAuthRepository.findByUsername.mockResolvedValue(null);
      mockAuthRepository.findByEmail.mockResolvedValue(null);
      (bcryptjs.hash as jest.Mock).mockResolvedValue('hashed_password');
      
      const duplicateKeyError = new Error('E11000 duplicate key error');
      mockAuthRepository.create.mockRejectedValue(duplicateKeyError);

      await expect(
        authService.createUser('testuser', 'password123', 'test@example.com')
      ).rejects.toThrow('Username or email already exists');
    });

    it('should handle duplicate key error with different message format', async () => {
      mockAuthRepository.findByUsername.mockResolvedValue(null);
      mockAuthRepository.findByEmail.mockResolvedValue(null);
      (bcryptjs.hash as jest.Mock).mockResolvedValue('hashed_password');
      
      const duplicateKeyError = new Error('duplicate key error collection');
      mockAuthRepository.create.mockRejectedValue(duplicateKeyError);

      await expect(
        authService.createUser('testuser', 'password123', 'test@example.com')
      ).rejects.toThrow('Username or email already exists');
    });

    it('should re-throw non-duplicate key errors', async () => {
      mockAuthRepository.findByUsername.mockResolvedValue(null);
      mockAuthRepository.findByEmail.mockResolvedValue(null);
      (bcryptjs.hash as jest.Mock).mockResolvedValue('hashed_password');
      
      const otherError = new Error('Some other database error');
      mockAuthRepository.create.mockRejectedValue(otherError);

      await expect(
        authService.createUser('testuser', 'password123', 'test@example.com')
      ).rejects.toThrow('Some other database error');
    });

    it('should handle bcrypt hash errors', async () => {
      mockAuthRepository.findByUsername.mockResolvedValue(null);
      mockAuthRepository.findByEmail.mockResolvedValue(null);
      (bcryptjs.hash as jest.Mock).mockRejectedValue(new Error('Hash error'));

      await expect(
        authService.createUser('testuser', 'password123', 'test@example.com')
      ).rejects.toThrow('Hash error');
    });

    it('should throw error when JWT_SECRET is not defined', async () => {
      delete process.env.JWT_SECRET;

      mockAuthRepository.findByUsername.mockResolvedValue(null);
      mockAuthRepository.findByEmail.mockResolvedValue(null);
      mockAuthRepository.create.mockResolvedValue(undefined);
      (bcryptjs.hash as jest.Mock).mockResolvedValue('hashed_password');

      await expect(
        authService.createUser('testuser', 'password123', 'test@example.com')
      ).rejects.toThrow('JWT_SECRET environment variable is not defined');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token and return user', async () => {
      const mockUser: DbUser = {
        _id: 'user123',
        id: 'user123',
        username: 'testuser',
        preferredUsername: 'testuser',
        password: 'hashed_password',
        email: 'test@example.com',
        followers: [],
        following: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockDecoded = {
        id: 'user123',
        username: 'testuser',
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);
      mockAuthRepository.findById.mockResolvedValue(mockUser);

      const result = await authService.verifyToken('valid-token');

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret', {
        algorithms: ['HS256'],
      });
      expect(mockAuthRepository.findById).toHaveBeenCalledWith('user123');
      expect(result).toEqual(mockUser);
    });

    it('should return null when JWT_SECRET is not defined', async () => {
      delete process.env.JWT_SECRET;

      const result = await authService.verifyToken('valid-token');

      expect(result).toBeNull();
      expect(jwt.verify).not.toHaveBeenCalled();
    });

    it('should return null when token is invalid', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await authService.verifyToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null when user is not found', async () => {
      const mockDecoded = {
        id: 'user123',
        username: 'testuser',
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);
      mockAuthRepository.findById.mockResolvedValue(null);

      const result = await authService.verifyToken('valid-token');

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret', {
        algorithms: ['HS256'],
      });
      expect(mockAuthRepository.findById).toHaveBeenCalledWith('user123');
      expect(result).toBeNull();
    });

    it('should handle repository errors', async () => {
      const mockDecoded = {
        id: 'user123',
        username: 'testuser',
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);
      mockAuthRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await authService.verifyToken('valid-token');

      expect(result).toBeNull();
    });

    it('should handle JWT verification errors', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('jwt malformed');
      });

      const result = await authService.verifyToken('malformed-token');

      expect(result).toBeNull();
    });

    it('should handle JWT expiration errors', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.TokenExpiredError('jwt expired', new Date());
      });

      const result = await authService.verifyToken('expired-token');

      expect(result).toBeNull();
    });
  });

  describe('generateToken (private method)', () => {
    it('should generate token with correct payload', async () => {
      const mockUser: DbUser = {
        _id: 'user123',
        id: 'user123',
        username: 'testuser',
        preferredUsername: 'testuser',
        password: 'hashed_password',
        email: 'test@example.com',
        followers: [],
        following: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockToken = 'generated-jwt-token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      // Test generateToken indirectly through authenticateUser
      mockAuthRepository.findByUsername.mockResolvedValue(mockUser);
      (bcryptjs.compare as jest.Mock).mockResolvedValue(true);

      await authService.authenticateUser('testuser', 'password123');

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'user123', username: 'testuser' },
        'test-secret',
        { expiresIn: '24h', algorithm: 'HS256' }
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors during authentication', async () => {
      mockAuthRepository.findByUsername.mockRejectedValue(new Error('Network timeout'));

      await expect(
        authService.authenticateUser('testuser', 'password123')
      ).rejects.toThrow('Network timeout');
    });

    it('should handle network errors during user creation', async () => {
      mockAuthRepository.findByUsername.mockRejectedValue(new Error('Connection refused'));

      await expect(
        authService.createUser('testuser', 'password123', 'test@example.com')
      ).rejects.toThrow('Connection refused');
    });

    it('should handle network errors during token verification', async () => {
      const mockDecoded = {
        id: 'user123',
        username: 'testuser',
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);
      mockAuthRepository.findById.mockRejectedValue(new Error('Connection timeout'));

      const result = await authService.verifyToken('valid-token');

      expect(result).toBeNull();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete user registration and login flow', async () => {
      const mockToken = 'generated-jwt-token';
      const mockObjectId = new ObjectId().toString();

      // Mock registration
      mockAuthRepository.findByUsername.mockResolvedValue(null);
      mockAuthRepository.findByEmail.mockResolvedValue(null);
      mockAuthRepository.create.mockResolvedValue(undefined);
      (bcryptjs.hash as jest.Mock).mockResolvedValue('hashed_password');
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      jest.spyOn(ObjectId.prototype, 'toString').mockReturnValue(mockObjectId);

      // Create user
      const createResult = await authService.createUser('testuser', 'password123', 'test@example.com');

      expect(createResult.actor.username).toBe('testuser');
      expect(createResult.token).toBe(mockToken);

      // Mock login
      const mockUser: DbUser = {
        _id: mockObjectId,
        id: mockObjectId,
        username: 'testuser',
        preferredUsername: 'testuser',
        password: 'hashed_password',
        email: 'test@example.com',
        followers: [],
        following: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthRepository.findByUsername.mockResolvedValue(mockUser);
      (bcryptjs.compare as jest.Mock).mockResolvedValue(true);

      // Login user
      const loginResult = await authService.authenticateUser('testuser', 'password123');

      expect(loginResult?.actor.username).toBe('testuser');
      expect(loginResult?.token).toBe(mockToken);
    });

    it('should handle token verification for logged-in user', async () => {
      const mockUser: DbUser = {
        _id: 'user123',
        id: 'user123',
        username: 'testuser',
        preferredUsername: 'testuser',
        password: 'hashed_password',
        email: 'test@example.com',
        followers: [],
        following: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockDecoded = {
        id: 'user123',
        username: 'testuser',
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);
      mockAuthRepository.findById.mockResolvedValue(mockUser);

      const result = await authService.verifyToken('valid-token');

      expect(result).toEqual(mockUser);
    });
  });
});