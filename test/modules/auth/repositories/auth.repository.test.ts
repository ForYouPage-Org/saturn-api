import { AuthRepository } from '../../../../src/modules/auth/repositories/auth.repository';
import type { DbUser } from '../../../../src/modules/auth/models/user';
import type { Db } from 'mongodb';
import { MongoServerError } from 'mongodb';
import { jest } from '@jest/globals';

// Mock logger
jest.mock('../../../../src/utils/logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('AuthRepository', () => {
  let mockDb: jest.Mocked<Db>;
  let mockCollection: any;
  let authRepository: AuthRepository;

  beforeEach(() => {
    mockCollection = {
      createIndex: jest.fn(),
      findOne: jest.fn(),
      insertOne: jest.fn(),
      updateOne: jest.fn(),
      deleteOne: jest.fn(),
      countDocuments: jest.fn(),
      find: jest.fn(),
    };

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection),
    } as any;

    authRepository = new AuthRepository(mockDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor and ensureIndexes', () => {
    it('should create indexes during initialization', async () => {
      // Wait for async index creation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockCollection.createIndex).toHaveBeenCalledWith(
        { username: 1 },
        { unique: true }
      );
      expect(mockCollection.createIndex).toHaveBeenCalledWith(
        { email: 1 },
        { unique: true, sparse: true }
      );
    });

    it('should handle IndexOptionsConflict errors gracefully', async () => {
      const indexConflictError = new MongoServerError({
        message: 'index already exists with different options',
        codeName: 'IndexOptionsConflict',
      });

      mockCollection.createIndex.mockRejectedValue(indexConflictError);

      // Create new instance to trigger ensureIndexes
      const newAuthRepository = new AuthRepository(mockDb);

      // Wait for async index creation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockCollection.createIndex).toHaveBeenCalled();
    });

    it('should handle IndexKeySpecsConflict errors gracefully', async () => {
      const indexConflictError = new MongoServerError({
        message: 'index key specs conflict',
        codeName: 'IndexKeySpecsConflict',
      });

      mockCollection.createIndex.mockRejectedValue(indexConflictError);

      // Create new instance to trigger ensureIndexes
      const newAuthRepository = new AuthRepository(mockDb);

      // Wait for async index creation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockCollection.createIndex).toHaveBeenCalled();
    });

    it('should handle "already exists" errors gracefully', async () => {
      const indexExistsError = new MongoServerError({
        message: 'index already exists',
      });

      mockCollection.createIndex.mockRejectedValue(indexExistsError);

      // Create new instance to trigger ensureIndexes
      const newAuthRepository = new AuthRepository(mockDb);

      // Wait for async index creation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockCollection.createIndex).toHaveBeenCalled();
    });

    it('should handle other index creation errors', async () => {
      const otherError = new Error('Some other database error');

      mockCollection.createIndex.mockRejectedValue(otherError);

      // Create new instance to trigger ensureIndexes
      const newAuthRepository = new AuthRepository(mockDb);

      // Wait for async index creation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockCollection.createIndex).toHaveBeenCalled();
    });

    it('should initialize with correct collection name', () => {
      expect(mockDb.collection).toHaveBeenCalledWith('actors');
    });
  });

  describe('findByUsername', () => {
    it('should find user by username', async () => {
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

      mockCollection.findOne.mockResolvedValue(mockUser);

      const result = await authRepository.findByUsername('testuser');

      expect(mockCollection.findOne).toHaveBeenCalledWith({ preferredUsername: 'testuser' });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await authRepository.findByUsername('nonexistent');

      expect(mockCollection.findOne).toHaveBeenCalledWith({ preferredUsername: 'nonexistent' });
      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      mockCollection.findOne.mockRejectedValue(new Error('Database error'));

      await expect(authRepository.findByUsername('testuser')).rejects.toThrow('Database error');
    });

    it('should handle empty username', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await authRepository.findByUsername('');

      expect(mockCollection.findOne).toHaveBeenCalledWith({ preferredUsername: '' });
      expect(result).toBeNull();
    });

    it('should handle special characters in username', async () => {
      const specialUser: DbUser = {
        _id: 'user123',
        id: 'user123',
        username: 'user@domain.com',
        preferredUsername: 'user@domain.com',
        password: 'hashed_password',
        email: 'test@example.com',
        followers: [],
        following: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCollection.findOne.mockResolvedValue(specialUser);

      const result = await authRepository.findByUsername('user@domain.com');

      expect(mockCollection.findOne).toHaveBeenCalledWith({ preferredUsername: 'user@domain.com' });
      expect(result).toEqual(specialUser);
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
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

      mockCollection.findOne.mockResolvedValue(mockUser);

      const result = await authRepository.findByEmail('test@example.com');

      expect(mockCollection.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await authRepository.findByEmail('nonexistent@example.com');

      expect(mockCollection.findOne).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });
      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      mockCollection.findOne.mockRejectedValue(new Error('Database error'));

      await expect(authRepository.findByEmail('test@example.com')).rejects.toThrow('Database error');
    });

    it('should handle invalid email formats', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await authRepository.findByEmail('invalid-email');

      expect(mockCollection.findOne).toHaveBeenCalledWith({ email: 'invalid-email' });
      expect(result).toBeNull();
    });

    it('should handle empty email', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await authRepository.findByEmail('');

      expect(mockCollection.findOne).toHaveBeenCalledWith({ email: '' });
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find user by _id field', async () => {
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

      mockCollection.findOne.mockResolvedValue(mockUser);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = await authRepository.findById('user123');

      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: 'user123' });
      expect(result).toEqual(mockUser);
      expect(consoleSpy).toHaveBeenCalledWith('[AuthRepository] Looking up user by id:', 'user123');
      expect(consoleSpy).toHaveBeenCalledWith('[AuthRepository] findById result:', 'Found');

      consoleSpy.mockRestore();
    });

    it('should try id field when _id field fails', async () => {
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

      mockCollection.findOne
        .mockResolvedValueOnce(null) // First call with _id returns null
        .mockResolvedValueOnce(mockUser); // Second call with id returns user

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = await authRepository.findById('user123');

      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: 'user123' });
      expect(mockCollection.findOne).toHaveBeenCalledWith({ id: 'user123' });
      expect(result).toEqual(mockUser);

      consoleSpy.mockRestore();
    });

    it('should handle ActivityPub ID format', async () => {
      const mockUser: DbUser = {
        _id: 'user123',
        id: 'https://example.com/users/testuser',
        username: 'testuser',
        preferredUsername: 'testuser',
        password: 'hashed_password',
        email: 'test@example.com',
        followers: [],
        following: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCollection.findOne
        .mockResolvedValueOnce(null) // First call with _id returns null
        .mockResolvedValueOnce(null) // Second call with id returns null
        .mockResolvedValueOnce(mockUser); // Third call with AP ID returns user

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = await authRepository.findById('https://example.com/users/testuser');

      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: 'https://example.com/users/testuser' });
      expect(mockCollection.findOne).toHaveBeenCalledWith({ id: 'https://example.com/users/testuser' });
      expect(result).toEqual(mockUser);
      expect(consoleSpy).toHaveBeenCalledWith('[AuthRepository] Looking up by AP id');
      expect(consoleSpy).toHaveBeenCalledWith('[AuthRepository] Found by AP id');

      consoleSpy.mockRestore();
    });

    it('should try string equality on _id as fallback', async () => {
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

      mockCollection.findOne
        .mockResolvedValueOnce(null) // First call with _id returns null
        .mockResolvedValueOnce(null); // Second call with id returns null

      mockCollection.findOne.mockResolvedValue(mockUser);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = await authRepository.findById('user123');

      expect(mockCollection.findOne).toHaveBeenCalledWith({
        $expr: { $eq: [{ $toString: '$_id' }, 'user123'] },
      });
      expect(consoleSpy).toHaveBeenCalledWith('[AuthRepository] Found with string equality on _id');

      consoleSpy.mockRestore();
    });

    it('should return null when all lookup attempts fail', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = await authRepository.findById('nonexistent');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('[AuthRepository] Failed all lookup attempts');

      consoleSpy.mockRestore();
    });

    it('should handle database errors', async () => {
      mockCollection.findOne.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await expect(authRepository.findById('user123')).rejects.toThrow('Database error');

      consoleSpy.mockRestore();
    });

    it('should handle empty id', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = await authRepository.findById('');

      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: '' });
      expect(result).toBeNull();

      consoleSpy.mockRestore();
    });

    it('should handle special characters in id', async () => {
      const mockUser: DbUser = {
        _id: 'user@123',
        id: 'user@123',
        username: 'testuser',
        preferredUsername: 'testuser',
        password: 'hashed_password',
        email: 'test@example.com',
        followers: [],
        following: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCollection.findOne.mockResolvedValue(mockUser);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = await authRepository.findById('user@123');

      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: 'user@123' });
      expect(result).toEqual(mockUser);

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors in findByUsername', async () => {
      mockCollection.findOne.mockRejectedValue(new Error('Connection refused'));

      await expect(authRepository.findByUsername('testuser')).rejects.toThrow('Connection refused');
    });

    it('should handle connection errors in findByEmail', async () => {
      mockCollection.findOne.mockRejectedValue(new Error('Connection timeout'));

      await expect(authRepository.findByEmail('test@example.com')).rejects.toThrow('Connection timeout');
    });

    it('should handle timeout errors in findById', async () => {
      mockCollection.findOne.mockRejectedValue(new Error('Query timeout'));

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await expect(authRepository.findById('user123')).rejects.toThrow('Query timeout');

      consoleSpy.mockRestore();
    });

    it('should handle malformed query errors', async () => {
      mockCollection.findOne.mockRejectedValue(new Error('Invalid query'));

      await expect(authRepository.findByUsername('testuser')).rejects.toThrow('Invalid query');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete user lookup workflow', async () => {
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

      mockCollection.findOne.mockResolvedValue(mockUser);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      // Test different lookup methods
      const userByUsername = await authRepository.findByUsername('testuser');
      const userByEmail = await authRepository.findByEmail('test@example.com');
      const userById = await authRepository.findById('user123');

      expect(userByUsername).toEqual(mockUser);
      expect(userByEmail).toEqual(mockUser);
      expect(userById).toEqual(mockUser);

      consoleSpy.mockRestore();
    });

    it('should handle user not found across all methods', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const userByUsername = await authRepository.findByUsername('nonexistent');
      const userByEmail = await authRepository.findByEmail('nonexistent@example.com');
      const userById = await authRepository.findById('nonexistent');

      expect(userByUsername).toBeNull();
      expect(userByEmail).toBeNull();
      expect(userById).toBeNull();

      consoleSpy.mockRestore();
    });

    it('should handle partial user data', async () => {
      const partialUser: Partial<DbUser> = {
        _id: 'user123',
        username: 'testuser',
        preferredUsername: 'testuser',
        // Missing some fields
      };

      mockCollection.findOne.mockResolvedValue(partialUser);

      const result = await authRepository.findByUsername('testuser');

      expect(result).toEqual(partialUser);
    });
  });
});