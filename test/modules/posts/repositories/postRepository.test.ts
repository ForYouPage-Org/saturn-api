import { PostRepository } from '../../../../src/modules/posts/repositories/postRepository';
import type { Post } from '../../../../src/modules/posts/models/post';
import type { Db } from 'mongodb';
import { ObjectId } from 'mongodb';
import { jest } from '@jest/globals';

describe('PostRepository', () => {
  let mockDb: jest.Mocked<Db>;
  let mockCollection: any;
  let postRepository: PostRepository;

  beforeEach(() => {
    mockCollection = {
      find: jest.fn(),
      findOne: jest.fn(),
      insertOne: jest.fn(),
      updateOne: jest.fn(),
      deleteOne: jest.fn(),
      countDocuments: jest.fn(),
      createIndex: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection),
    } as any;

    postRepository = new PostRepository(mockDb);
  });

  describe('constructor', () => {
    it('should create indexes during initialization', () => {
      expect(mockCollection.createIndex).toHaveBeenCalledWith({ 'actor.id': 1, createdAt: -1 });
      expect(mockCollection.createIndex).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockCollection.createIndex).toHaveBeenCalledWith({ actorId: 1, published: -1 });
      expect(mockCollection.createIndex).toHaveBeenCalledWith({ id: 1 }, { unique: true });
    });

    it('should initialize with correct collection name', () => {
      expect(mockDb.collection).toHaveBeenCalledWith('posts');
    });
  });

  describe('findByUsername', () => {
    it('should find posts by username with default pagination', async () => {
      const mockPosts = [
        {
          _id: new ObjectId(),
          id: 'post1',
          content: 'Post 1',
          actorId: new ObjectId(),
          createdAt: new Date('2023-01-02'),
        },
        {
          _id: new ObjectId(),
          id: 'post2',
          content: 'Post 2',
          actorId: new ObjectId(),
          createdAt: new Date('2023-01-01'),
        },
      ];

      mockCollection.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              toArray: jest.fn().mockResolvedValue(mockPosts),
            }),
          }),
        }),
      });

      const result = await postRepository.findByUsername('testuser');

      expect(mockCollection.find).toHaveBeenCalledWith({
        'actor.username': 'testuser',
      });
      expect(result).toEqual(mockPosts);
    });

    it('should find posts by username with custom pagination', async () => {
      const mockPosts = [
        {
          _id: new ObjectId(),
          id: 'post1',
          content: 'Post 1',
          actorId: new ObjectId(),
          createdAt: new Date(),
        },
      ];

      const mockSort = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue(mockPosts),
          }),
        }),
      });

      const mockSkip = jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue(mockPosts),
        }),
      });

      const mockLimit = jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockPosts),
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

      await postRepository.findByUsername('testuser', 2, 10);

      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockSkip).toHaveBeenCalledWith(10);
      expect(mockLimit).toHaveBeenCalledWith(10);
    });

    it('should handle empty username', async () => {
      mockCollection.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              toArray: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      const result = await postRepository.findByUsername('');

      expect(mockCollection.find).toHaveBeenCalledWith({
        'actor.username': '',
      });
      expect(result).toEqual([]);
    });
  });

  describe('countByUsername', () => {
    it('should count posts by username', async () => {
      mockCollection.countDocuments.mockResolvedValue(5);

      const result = await postRepository.countByUsername('testuser');

      expect(mockCollection.countDocuments).toHaveBeenCalledWith({
        'actor.username': 'testuser',
      });
      expect(result).toBe(5);
    });

    it('should return 0 for username with no posts', async () => {
      mockCollection.countDocuments.mockResolvedValue(0);

      const result = await postRepository.countByUsername('testuser');

      expect(result).toBe(0);
    });
  });

  describe('findFeed', () => {
    it('should find public posts for feed', async () => {
      const mockPosts = [
        {
          _id: new ObjectId(),
          id: 'post1',
          content: 'Public post 1',
          visibility: 'public',
          published: new Date('2023-01-02'),
        },
        {
          _id: new ObjectId(),
          id: 'post2',
          content: 'Public post 2',
          visibility: 'public',
          published: new Date('2023-01-01'),
        },
      ];

      // Mock the find method chain
      const mockCursor = {
        toArray: jest.fn().mockResolvedValue(mockPosts),
      };

      mockCollection.find.mockReturnValue(mockCursor);

      const result = await postRepository.findFeed();

      expect(mockCollection.find).toHaveBeenCalledWith(
        { visibility: 'public' },
        {
          sort: { published: -1 },
        }
      );
      expect(result).toEqual(mockPosts);
    });

    it('should find feed with custom options', async () => {
      const mockPosts = [
        {
          _id: new ObjectId(),
          id: 'post1',
          content: 'Public post 1',
          visibility: 'public',
          published: new Date(),
        },
      ];

      const mockCursor = {
        toArray: jest.fn().mockResolvedValue(mockPosts),
      };

      mockCollection.find.mockReturnValue(mockCursor);

      const options = { limit: 10, skip: 5 };
      const result = await postRepository.findFeed(options);

      expect(mockCollection.find).toHaveBeenCalledWith(
        { visibility: 'public' },
        {
          sort: { published: -1 },
          ...options,
        }
      );
      expect(result).toEqual(mockPosts);
    });
  });

  describe('countFeed', () => {
    it('should count public posts', async () => {
      mockCollection.countDocuments.mockResolvedValue(15);

      const result = await postRepository.countFeed();

      expect(mockCollection.countDocuments).toHaveBeenCalledWith({ visibility: 'public' });
      expect(result).toBe(15);
    });
  });

  describe('likePost', () => {
    it('should like a post successfully', async () => {
      mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const result = await postRepository.likePost('post123', 'actor456');

      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { id: 'post123' },
        { $addToSet: { likes: 'actor456' } }
      );
      expect(result).toBe(true);
    });

    it('should return false when post not found', async () => {
      mockCollection.updateOne.mockResolvedValue({ modifiedCount: 0 });

      const result = await postRepository.likePost('nonexistent', 'actor456');

      expect(result).toBe(false);
    });
  });

  describe('unlikePost', () => {
    it('should unlike a post successfully', async () => {
      mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const result = await postRepository.unlikePost('post123', 'actor456');

      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { id: 'post123' },
        { $pull: { likes: 'actor456' } }
      );
      expect(result).toBe(true);
    });

    it('should return false when post not found or not liked', async () => {
      mockCollection.updateOne.mockResolvedValue({ modifiedCount: 0 });

      const result = await postRepository.unlikePost('post123', 'actor456');

      expect(result).toBe(false);
    });
  });

  describe('findPostsByAuthorId', () => {
    it('should find posts by author ID with string input', async () => {
      const actorId = new ObjectId();
      const mockPosts = [
        {
          _id: new ObjectId(),
          id: 'post1',
          content: 'Author post 1',
          actorId,
        },
      ];

      const mockCursor = {
        toArray: jest.fn().mockResolvedValue(mockPosts),
      };

      mockCollection.find.mockReturnValue(mockCursor);
      mockCollection.countDocuments.mockResolvedValue(1);

      const result = await postRepository.findPostsByAuthorId(actorId.toString());

      expect(mockCollection.find).toHaveBeenCalledWith({ actorId });
      expect(mockCollection.countDocuments).toHaveBeenCalledWith({ actorId });
      expect(result).toEqual({
        posts: mockPosts,
        total: 1,
      });
    });

    it('should find posts by author ID with ObjectId input', async () => {
      const actorId = new ObjectId();
      const mockPosts = [
        {
          _id: new ObjectId(),
          id: 'post1',
          content: 'Author post 1',
          actorId,
        },
      ];

      const mockCursor = {
        toArray: jest.fn().mockResolvedValue(mockPosts),
      };

      mockCollection.find.mockReturnValue(mockCursor);
      mockCollection.countDocuments.mockResolvedValue(1);

      const result = await postRepository.findPostsByAuthorId(actorId);

      expect(mockCollection.find).toHaveBeenCalledWith({ actorId });
      expect(result).toEqual({
        posts: mockPosts,
        total: 1,
      });
    });

    it('should find posts with custom options', async () => {
      const actorId = new ObjectId();
      const mockPosts = [];

      const mockCursor = {
        toArray: jest.fn().mockResolvedValue(mockPosts),
      };

      mockCollection.find.mockReturnValue(mockCursor);
      mockCollection.countDocuments.mockResolvedValue(0);

      const options = { limit: 5, skip: 10 };
      const result = await postRepository.findPostsByAuthorId(actorId, options);

      expect(mockCollection.find).toHaveBeenCalledWith({ actorId }, options);
      expect(result).toEqual({
        posts: mockPosts,
        total: 0,
      });
    });
  });

  describe('findByIdAndActorId', () => {
    it('should find post by ID and actor ID', async () => {
      const postId = new ObjectId();
      const actorId = new ObjectId();
      const mockPost = {
        _id: postId,
        id: 'post123',
        content: 'Test post',
        actorId,
      };

      mockCollection.findOne.mockResolvedValue(mockPost);

      const result = await postRepository.findByIdAndActorId(postId, actorId);

      expect(mockCollection.findOne).toHaveBeenCalledWith({
        _id: postId,
        actorId,
      });
      expect(result).toEqual(mockPost);
    });

    it('should handle string IDs', async () => {
      const postId = new ObjectId();
      const actorId = new ObjectId();
      const mockPost = {
        _id: postId,
        id: 'post123',
        content: 'Test post',
        actorId,
      };

      mockCollection.findOne.mockResolvedValue(mockPost);

      const result = await postRepository.findByIdAndActorId(
        postId.toString(),
        actorId.toString()
      );

      expect(mockCollection.findOne).toHaveBeenCalledWith({
        _id: postId,
        actorId,
      });
      expect(result).toEqual(mockPost);
    });

    it('should return null when post not found', async () => {
      const postId = new ObjectId();
      const actorId = new ObjectId();

      mockCollection.findOne.mockResolvedValue(null);

      const result = await postRepository.findByIdAndActorId(postId, actorId);

      expect(result).toBeNull();
    });
  });

  describe('isOwner', () => {
    it('should return true when user owns the post', async () => {
      const postId = 'post123';
      const actorId = new ObjectId();
      const mockPost = {
        _id: new ObjectId(),
        id: postId,
        content: 'Test post',
        actorId,
      };

      mockCollection.findOne.mockResolvedValue(mockPost);

      const result = await postRepository.isOwner(postId, actorId);

      expect(mockCollection.findOne).toHaveBeenCalledWith({
        id: postId,
        actorId,
      });
      expect(result).toBe(true);
    });

    it('should return false when user does not own the post', async () => {
      const postId = 'post123';
      const actorId = new ObjectId();

      mockCollection.findOne.mockResolvedValue(null);

      const result = await postRepository.isOwner(postId, actorId);

      expect(result).toBe(false);
    });

    it('should handle string actorId', async () => {
      const postId = 'post123';
      const actorId = new ObjectId();
      const mockPost = {
        _id: new ObjectId(),
        id: postId,
        content: 'Test post',
        actorId,
      };

      mockCollection.findOne.mockResolvedValue(mockPost);

      const result = await postRepository.isOwner(postId, actorId.toString());

      expect(mockCollection.findOne).toHaveBeenCalledWith({
        id: postId,
        actorId,
      });
      expect(result).toBe(true);
    });
  });

  describe('update', () => {
    it('should update post successfully', async () => {
      const postId = 'post123';
      const updates = {
        content: 'Updated content',
        visibility: 'followers' as const,
      };

      const mockUpdatedPost = {
        _id: new ObjectId(),
        id: postId,
        content: 'Updated content',
        visibility: 'followers',
        updatedAt: new Date(),
      };

      mockCollection.findOneAndUpdate.mockResolvedValue(mockUpdatedPost);

      const result = await postRepository.update(postId, updates);

      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { id: postId },
        { $set: { ...updates, updatedAt: expect.any(Date) } }
      );
      expect(result).toEqual(mockUpdatedPost);
    });

    it('should return null when post not found', async () => {
      const postId = 'nonexistent';
      const updates = { content: 'Updated content' };

      mockCollection.findOneAndUpdate.mockResolvedValue(null);

      const result = await postRepository.update(postId, updates);

      expect(result).toBeNull();
    });
  });

  describe('deleteById', () => {
    it('should delete post by ID successfully', async () => {
      const postId = 'post123';

      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await postRepository.deleteById(postId);

      expect(mockCollection.deleteOne).toHaveBeenCalledWith({ id: postId });
      expect(result).toBe(true);
    });

    it('should return false when post not found', async () => {
      const postId = 'nonexistent';

      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

      const result = await postRepository.deleteById(postId);

      expect(result).toBe(false);
    });
  });

  describe('deleteByObjectId', () => {
    it('should delete post by ObjectId successfully', async () => {
      const objectId = new ObjectId();

      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await postRepository.deleteByObjectId(objectId);

      expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: objectId });
      expect(result).toBe(true);
    });

    it('should handle string ObjectId', async () => {
      const objectId = new ObjectId();

      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await postRepository.deleteByObjectId(objectId.toString());

      expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: objectId });
      expect(result).toBe(true);
    });

    it('should return false when post not found', async () => {
      const objectId = new ObjectId();

      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

      const result = await postRepository.deleteByObjectId(objectId);

      expect(result).toBe(false);
    });
  });

  describe('findByActorId', () => {
    it('should find posts by actor ID with pagination', async () => {
      const actorId = new ObjectId();
      const mockPosts = [
        {
          _id: new ObjectId(),
          id: 'post1',
          content: 'Post 1',
          actorId,
          createdAt: new Date('2023-01-02'),
        },
        {
          _id: new ObjectId(),
          id: 'post2',
          content: 'Post 2',
          actorId,
          createdAt: new Date('2023-01-01'),
        },
      ];

      mockCollection.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              toArray: jest.fn().mockResolvedValue(mockPosts),
            }),
          }),
        }),
      });

      const result = await postRepository.findByActorId(actorId.toString(), {
        limit: 10,
        offset: 0,
      });

      expect(mockCollection.find).toHaveBeenCalledWith({ actorId });
      expect(result).toEqual(mockPosts);
    });

    it('should apply pagination correctly', async () => {
      const actorId = new ObjectId();
      const mockPosts = [];

      const mockSort = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue(mockPosts),
          }),
        }),
      });

      const mockSkip = jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue(mockPosts),
        }),
      });

      const mockLimit = jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockPosts),
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

      await postRepository.findByActorId(actorId.toString(), {
        limit: 5,
        offset: 15,
      });

      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockSkip).toHaveBeenCalledWith(15);
      expect(mockLimit).toHaveBeenCalledWith(5);
    });
  });

  describe('countByActorId', () => {
    it('should count posts by actor ID', async () => {
      const actorId = new ObjectId();

      mockCollection.countDocuments.mockResolvedValue(7);

      const result = await postRepository.countByActorId(actorId.toString());

      expect(mockCollection.countDocuments).toHaveBeenCalledWith({ actorId });
      expect(result).toBe(7);
    });

    it('should return 0 for actor with no posts', async () => {
      const actorId = new ObjectId();

      mockCollection.countDocuments.mockResolvedValue(0);

      const result = await postRepository.countByActorId(actorId.toString());

      expect(result).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors in findByUsername', async () => {
      mockCollection.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              toArray: jest.fn().mockRejectedValue(new Error('Database error')),
            }),
          }),
        }),
      });

      await expect(postRepository.findByUsername('testuser')).rejects.toThrow('Database error');
    });

    it('should handle database errors in countByUsername', async () => {
      mockCollection.countDocuments.mockRejectedValue(new Error('Count error'));

      await expect(postRepository.countByUsername('testuser')).rejects.toThrow('Count error');
    });

    it('should handle database errors in likePost', async () => {
      mockCollection.updateOne.mockRejectedValue(new Error('Update error'));

      await expect(postRepository.likePost('post123', 'actor456')).rejects.toThrow('Update error');
    });

    it('should handle database errors in isOwner', async () => {
      mockCollection.findOne.mockRejectedValue(new Error('Find error'));

      await expect(postRepository.isOwner('post123', new ObjectId())).rejects.toThrow('Find error');
    });
  });
});