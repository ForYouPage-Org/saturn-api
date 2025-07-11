import { AuthRepository } from '../../../../src/modules/auth/repositories/auth.repository';
import type { Db } from 'mongodb';
import { jest } from '@jest/globals';

describe('AuthRepository', () => {
  let mockDb: jest.Mocked<Db>;
  let mockCollection: any;
  let authRepository: AuthRepository;

  beforeEach(() => {
    mockCollection = {
      findOne: jest.fn(),
      insertOne: jest.fn(),
      updateOne: jest.fn(),
      deleteOne: jest.fn(),
      countDocuments: jest.fn(),
    };

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection),
    } as any;

    authRepository = new AuthRepository(mockDb);
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: 'hashed_password',
        username: 'testuser',
      };

      mockCollection.findOne.mockResolvedValue(mockUser);

      const result = await authRepository.findByEmail('test@example.com');

      expect(mockCollection.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await authRepository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('should find user by username', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: 'hashed_password',
        preferredUsername: 'testuser',
      };

      mockCollection.findOne.mockResolvedValue(mockUser);

      const result = await authRepository.findByUsername('testuser');

      expect(mockCollection.findOne).toHaveBeenCalledWith({
        preferredUsername: 'testuser',
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await authRepository.findByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'hashed_password',
        username: 'testuser',
      };

      const mockResult = {
        insertedId: 'user123',
        acknowledged: true,
      };

      mockCollection.insertOne.mockResolvedValue(mockResult);

      const result = await authRepository.create(userData);

      expect(mockCollection.insertOne).toHaveBeenCalledWith(userData);
      expect(result).toEqual(mockResult);
    });

    it('should handle creation errors', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'hashed_password',
        username: 'testuser',
      };

      mockCollection.insertOne.mockRejectedValue(new Error('Database error'));

      await expect(authRepository.create(userData)).rejects.toThrow('Database error');
    });
  });

  describe('ensureIndexes', () => {
    it('should create indexes without throwing', async () => {
      mockCollection.createIndex.mockResolvedValue('index_created');

      // This is called in constructor, so create a new instance
      expect(() => {
        new AuthRepository(mockDb);
      }).not.toThrow();

      expect(mockCollection.createIndex).toHaveBeenCalledWith(
        { username: 1 },
        { unique: true }
      );
      expect(mockCollection.createIndex).toHaveBeenCalledWith(
        { email: 1 },
        { unique: true, sparse: true }
      );
    });

    it('should handle index creation errors gracefully', async () => {
      const indexError = new Error('Index already exists');
      indexError.message = 'Index already exists';
      mockCollection.createIndex.mockRejectedValue(indexError);

      expect(() => {
        new AuthRepository(mockDb);
      }).not.toThrow();
    });
  });

  describe('findById', () => {
    it('should find user by _id field', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: 'hashed_password',
        preferredUsername: 'testuser',
      };

      mockCollection.findOne.mockResolvedValueOnce(mockUser);

      const result = await authRepository.findById('user123');

      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: 'user123' });
      expect(result).toEqual(mockUser);
    });

    it('should try id field if _id not found', async () => {
      const mockUser = {
        _id: 'user123',
        id: 'https://example.com/users/testuser',
        email: 'test@example.com',
        password: 'hashed_password',
        preferredUsername: 'testuser',
      };

      mockCollection.findOne.mockResolvedValueOnce(null); // First call (_id)
      mockCollection.findOne.mockResolvedValueOnce(mockUser); // Second call (id)

      const result = await authRepository.findById('https://example.com/users/testuser');

      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: 'https://example.com/users/testuser' });
      expect(mockCollection.findOne).toHaveBeenCalledWith({ id: 'https://example.com/users/testuser' });
      expect(result).toEqual(mockUser);
    });

    it('should try ActivityPub ID lookup for URL-like IDs', async () => {
      const mockUser = {
        _id: 'user123',
        id: 'https://example.com/users/testuser',
        email: 'test@example.com',
        preferredUsername: 'testuser',
      };

      mockCollection.findOne.mockResolvedValueOnce(null); // First call (_id)
      mockCollection.findOne.mockResolvedValueOnce(null); // Second call (id)
      mockCollection.findOne.mockResolvedValueOnce(mockUser); // Third call (AP lookup)

      const result = await authRepository.findById('https://example.com/users/testuser');

      expect(result).toEqual(mockUser);
    });

    it('should try string equality fallback', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        preferredUsername: 'testuser',
      };

      mockCollection.findOne.mockResolvedValue(null);
      mockCollection.findOne.mockResolvedValue(mockUser);

      const result = await authRepository.findById('user123');

      expect(mockCollection.findOne).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await authRepository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });
});