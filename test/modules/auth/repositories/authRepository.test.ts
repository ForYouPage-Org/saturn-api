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
        username: 'testuser',
      };

      mockCollection.findOne.mockResolvedValue(mockUser);

      const result = await authRepository.findByUsername('testuser');

      expect(mockCollection.findOne).toHaveBeenCalledWith({
        username: 'testuser',
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

      expect(mockCollection.insertOne).toHaveBeenCalledWith({
        ...userData,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
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

  describe('updatePassword', () => {
    it('should update user password', async () => {
      const mockResult = {
        modifiedCount: 1,
        acknowledged: true,
      };

      mockCollection.updateOne.mockResolvedValue(mockResult);

      const result = await authRepository.updatePassword('user123', 'new_hashed_password');

      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { _id: 'user123' },
        {
          $set: {
            password: 'new_hashed_password',
            updatedAt: expect.any(Date),
          },
        }
      );
      expect(result).toEqual(mockResult);
    });

    it('should handle update errors', async () => {
      mockCollection.updateOne.mockRejectedValue(new Error('Database error'));

      await expect(authRepository.updatePassword('user123', 'new_password')).rejects.toThrow('Database error');
    });
  });

  describe('deleteUser', () => {
    it('should delete user by id', async () => {
      const mockResult = {
        deletedCount: 1,
        acknowledged: true,
      };

      mockCollection.deleteOne.mockResolvedValue(mockResult);

      const result = await authRepository.deleteUser('user123');

      expect(mockCollection.deleteOne).toHaveBeenCalledWith({
        _id: 'user123',
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle deletion errors', async () => {
      mockCollection.deleteOne.mockRejectedValue(new Error('Database error'));

      await expect(authRepository.deleteUser('user123')).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: 'hashed_password',
        username: 'testuser',
      };

      mockCollection.findOne.mockResolvedValue(mockUser);

      const result = await authRepository.findById('user123');

      expect(mockCollection.findOne).toHaveBeenCalledWith({
        _id: 'user123',
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await authRepository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('userExists', () => {
    it('should return true when user exists', async () => {
      mockCollection.countDocuments.mockResolvedValue(1);

      const result = await authRepository.userExists('test@example.com');

      expect(mockCollection.countDocuments).toHaveBeenCalledWith({
        $or: [
          { email: 'test@example.com' },
          { username: 'test@example.com' },
        ],
      });
      expect(result).toBe(true);
    });

    it('should return false when user does not exist', async () => {
      mockCollection.countDocuments.mockResolvedValue(0);

      const result = await authRepository.userExists('nonexistent@example.com');

      expect(result).toBe(false);
    });
  });
});