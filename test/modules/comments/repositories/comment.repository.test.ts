import { CommentRepository } from '../../../../src/modules/comments/repositories/comment.repository';
import type { Comment } from '../../../../src/modules/comments/models/comment';
import type { Db } from 'mongodb';
import { ObjectId } from 'mongodb';
import { jest } from '@jest/globals';

describe('CommentRepository', () => {
  let mockDb: jest.Mocked<Db>;
  let mockCollection: any;
  let commentRepository: CommentRepository;

  beforeEach(() => {
    mockCollection = {
      find: jest.fn(),
      findOne: jest.fn(),
      insertOne: jest.fn(),
      updateOne: jest.fn(),
      deleteOne: jest.fn(),
      countDocuments: jest.fn(),
      createIndex: jest.fn(),
    };

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection),
    } as any;

    commentRepository = new CommentRepository(mockDb);
  });

  describe('constructor', () => {
    it('should create indexes during initialization', () => {
      expect(mockCollection.createIndex).toHaveBeenCalledWith({ postId: 1, createdAt: 1 });
      expect(mockCollection.createIndex).toHaveBeenCalledWith({ authorId: 1 });
      expect(mockCollection.createIndex).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it('should initialize with correct collection name', () => {
      expect(mockDb.collection).toHaveBeenCalledWith('comments');
    });
  });

  describe('findCommentsByPostId', () => {
    it('should find comments for a post with pagination', async () => {
      const mockComments = [
        {
          _id: new ObjectId(),
          postId: 'post123',
          authorId: 'user123',
          content: 'First comment',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        },
        {
          _id: new ObjectId(),
          postId: 'post123',
          authorId: 'user456',
          content: 'Second comment',
          createdAt: new Date('2023-01-02'),
          updatedAt: new Date('2023-01-02'),
        },
      ];

      mockCollection.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              toArray: jest.fn().mockResolvedValue(mockComments),
            }),
          }),
        }),
      });

      mockCollection.countDocuments.mockResolvedValue(2);

      const result = await commentRepository.findCommentsByPostId('post123', {
        limit: 10,
        offset: 0,
      });

      expect(mockCollection.find).toHaveBeenCalledWith({ postId: 'post123' });
      expect(result).toEqual({
        comments: mockComments,
        total: 2,
      });
    });

    it('should apply pagination parameters correctly', async () => {
      const mockComments = [
        {
          _id: new ObjectId(),
          postId: 'post123',
          authorId: 'user123',
          content: 'Comment',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockSort = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue(mockComments),
          }),
        }),
      });

      const mockSkip = jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue(mockComments),
        }),
      });

      const mockLimit = jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockComments),
      });

      mockCollection.find.mockReturnValue({
        sort: mockSort,
      });

      mockSort.mockReturnValue({
        skip: mockSkip,
      });

      mockSkip.mockReturnValue({
        limit: mockLimit,
      });

      mockCollection.countDocuments.mockResolvedValue(1);

      await commentRepository.findCommentsByPostId('post123', {
        limit: 5,
        offset: 10,
      });

      expect(mockSort).toHaveBeenCalledWith({ createdAt: 1 });
      expect(mockSkip).toHaveBeenCalledWith(10);
      expect(mockLimit).toHaveBeenCalledWith(5);
    });

    it('should return empty result when no comments found', async () => {
      mockCollection.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              toArray: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      mockCollection.countDocuments.mockResolvedValue(0);

      const result = await commentRepository.findCommentsByPostId('post123', {
        limit: 10,
        offset: 0,
      });

      expect(result).toEqual({
        comments: [],
        total: 0,
      });
    });

    it('should handle database errors', async () => {
      mockCollection.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              toArray: jest.fn().mockRejectedValue(new Error('Database error')),
            }),
          }),
        }),
      });

      await expect(
        commentRepository.findCommentsByPostId('post123', {
          limit: 10,
          offset: 0,
        })
      ).rejects.toThrow('Database error');
    });

    it('should handle count errors', async () => {
      mockCollection.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              toArray: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      mockCollection.countDocuments.mockRejectedValue(new Error('Count error'));

      await expect(
        commentRepository.findCommentsByPostId('post123', {
          limit: 10,
          offset: 0,
        })
      ).rejects.toThrow('Count error');
    });

    it('should handle large pagination values', async () => {
      mockCollection.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              toArray: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      mockCollection.countDocuments.mockResolvedValue(0);

      const result = await commentRepository.findCommentsByPostId('post123', {
        limit: 1000,
        offset: 9999,
      });

      expect(result).toEqual({
        comments: [],
        total: 0,
      });
    });
  });

  describe('deleteByIdAndAuthorId', () => {
    it('should delete comment by ID and author ID', async () => {
      const commentId = new ObjectId().toHexString();
      const authorId = 'user123';

      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await commentRepository.deleteByIdAndAuthorId(commentId, authorId);

      expect(mockCollection.deleteOne).toHaveBeenCalledWith({
        _id: new ObjectId(commentId),
        authorId,
      });
      expect(result).toEqual({ deletedCount: 1 });
    });

    it('should return 0 for invalid ObjectId', async () => {
      const invalidId = 'invalid-id';
      const authorId = 'user123';

      const result = await commentRepository.deleteByIdAndAuthorId(invalidId, authorId);

      expect(mockCollection.deleteOne).not.toHaveBeenCalled();
      expect(result).toEqual({ deletedCount: 0 });
    });

    it('should return 0 when comment not found', async () => {
      const commentId = new ObjectId().toHexString();
      const authorId = 'user123';

      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

      const result = await commentRepository.deleteByIdAndAuthorId(commentId, authorId);

      expect(mockCollection.deleteOne).toHaveBeenCalledWith({
        _id: new ObjectId(commentId),
        authorId,
      });
      expect(result).toEqual({ deletedCount: 0 });
    });

    it('should return 0 when author does not match', async () => {
      const commentId = new ObjectId().toHexString();
      const authorId = 'user123';

      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

      const result = await commentRepository.deleteByIdAndAuthorId(commentId, authorId);

      expect(result).toEqual({ deletedCount: 0 });
    });

    it('should handle database errors', async () => {
      const commentId = new ObjectId().toHexString();
      const authorId = 'user123';

      mockCollection.deleteOne.mockRejectedValue(new Error('Database error'));

      await expect(
        commentRepository.deleteByIdAndAuthorId(commentId, authorId)
      ).rejects.toThrow('Database error');
    });

    it('should handle empty commentId', async () => {
      const result = await commentRepository.deleteByIdAndAuthorId('', 'user123');

      expect(mockCollection.deleteOne).not.toHaveBeenCalled();
      expect(result).toEqual({ deletedCount: 0 });
    });

    it('should handle empty authorId', async () => {
      const commentId = new ObjectId().toHexString();

      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

      const result = await commentRepository.deleteByIdAndAuthorId(commentId, '');

      expect(mockCollection.deleteOne).toHaveBeenCalledWith({
        _id: new ObjectId(commentId),
        authorId: '',
      });
      expect(result).toEqual({ deletedCount: 0 });
    });
  });

  describe('countByPostId', () => {
    it('should count comments for a post', async () => {
      mockCollection.countDocuments.mockResolvedValue(5);

      const result = await commentRepository.countByPostId('post123');

      expect(mockCollection.countDocuments).toHaveBeenCalledWith({ postId: 'post123' });
      expect(result).toBe(5);
    });

    it('should return 0 for post with no comments', async () => {
      mockCollection.countDocuments.mockResolvedValue(0);

      const result = await commentRepository.countByPostId('post123');

      expect(mockCollection.countDocuments).toHaveBeenCalledWith({ postId: 'post123' });
      expect(result).toBe(0);
    });

    it('should handle database errors', async () => {
      mockCollection.countDocuments.mockRejectedValue(new Error('Database error'));

      await expect(commentRepository.countByPostId('post123')).rejects.toThrow('Database error');
    });

    it('should handle empty postId', async () => {
      mockCollection.countDocuments.mockResolvedValue(0);

      const result = await commentRepository.countByPostId('');

      expect(mockCollection.countDocuments).toHaveBeenCalledWith({ postId: '' });
      expect(result).toBe(0);
    });

    it('should handle special characters in postId', async () => {
      const specialPostId = 'post-with-special-chars_123!@#';
      mockCollection.countDocuments.mockResolvedValue(2);

      const result = await commentRepository.countByPostId(specialPostId);

      expect(mockCollection.countDocuments).toHaveBeenCalledWith({ postId: specialPostId });
      expect(result).toBe(2);
    });
  });

  describe('Inherited Methods', () => {
    it('should inherit base repository methods', () => {
      expect(commentRepository.findById).toBeDefined();
      expect(commentRepository.create).toBeDefined();
      expect(commentRepository.update).toBeDefined();
      expect(commentRepository.delete).toBeDefined();
      expect(commentRepository.findOne).toBeDefined();
      expect(commentRepository.findAll).toBeDefined();
    });

    it('should create comment using inherited create method', async () => {
      const commentData = {
        postId: 'post123',
        authorId: 'user123',
        content: 'Test comment',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResult = {
        insertedId: new ObjectId(),
        acknowledged: true,
      };

      mockCollection.insertOne.mockResolvedValue(mockResult);

      const result = await commentRepository.create(commentData);

      expect(mockCollection.insertOne).toHaveBeenCalledWith(commentData);
      expect(result).toEqual(mockResult);
    });

    it('should find comment by ID using inherited method', async () => {
      const commentId = new ObjectId().toHexString();
      const mockComment = {
        _id: new ObjectId(commentId),
        postId: 'post123',
        authorId: 'user123',
        content: 'Test comment',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCollection.findOne.mockResolvedValue(mockComment);

      const result = await commentRepository.findById(commentId);

      expect(mockCollection.findOne).toHaveBeenCalled();
      expect(result).toEqual(mockComment);
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors', async () => {
      mockCollection.countDocuments.mockRejectedValue(new Error('Connection refused'));

      await expect(commentRepository.countByPostId('post123')).rejects.toThrow('Connection refused');
    });

    it('should handle timeout errors', async () => {
      mockCollection.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              toArray: jest.fn().mockRejectedValue(new Error('Timeout')),
            }),
          }),
        }),
      });

      await expect(
        commentRepository.findCommentsByPostId('post123', {
          limit: 10,
          offset: 0,
        })
      ).rejects.toThrow('Timeout');
    });

    it('should handle malformed data', async () => {
      mockCollection.deleteOne.mockRejectedValue(new Error('BSON parse error'));

      const commentId = new ObjectId().toHexString();
      await expect(
        commentRepository.deleteByIdAndAuthorId(commentId, 'user123')
      ).rejects.toThrow('BSON parse error');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete comment workflow', async () => {
      const postId = 'post123';
      const authorId = 'user123';
      const commentData = {
        postId,
        authorId,
        content: 'Test comment',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Create comment
      const mockCreateResult = {
        insertedId: new ObjectId(),
        acknowledged: true,
      };
      mockCollection.insertOne.mockResolvedValue(mockCreateResult);

      await commentRepository.create(commentData);

      // Find comments for post
      const mockComments = [
        {
          _id: mockCreateResult.insertedId,
          ...commentData,
        },
      ];

      mockCollection.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              toArray: jest.fn().mockResolvedValue(mockComments),
            }),
          }),
        }),
      });

      mockCollection.countDocuments.mockResolvedValue(1);

      const { comments, total } = await commentRepository.findCommentsByPostId(postId, {
        limit: 10,
        offset: 0,
      });

      expect(comments).toHaveLength(1);
      expect(total).toBe(1);

      // Count comments
      const count = await commentRepository.countByPostId(postId);
      expect(count).toBe(1);

      // Delete comment
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });
      const deleteResult = await commentRepository.deleteByIdAndAuthorId(
        mockCreateResult.insertedId.toHexString(),
        authorId
      );
      expect(deleteResult.deletedCount).toBe(1);
    });

    it('should handle bulk operations efficiently', async () => {
      const postId = 'post123';
      const mockComments = Array.from({ length: 50 }, (_, i) => ({
        _id: new ObjectId(),
        postId,
        authorId: `user${i}`,
        content: `Comment ${i}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      mockCollection.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              toArray: jest.fn().mockResolvedValue(mockComments.slice(0, 20)),
            }),
          }),
        }),
      });

      mockCollection.countDocuments.mockResolvedValue(50);

      const result = await commentRepository.findCommentsByPostId(postId, {
        limit: 20,
        offset: 0,
      });

      expect(result.comments).toHaveLength(20);
      expect(result.total).toBe(50);
    });
  });
});