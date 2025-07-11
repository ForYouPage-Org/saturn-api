import { PostService, CreatePostData, UpdatePostData } from '../../../../src/modules/posts/services/postService';
import type { PostRepository } from '../../../../src/modules/posts/repositories/postRepository';
import type { ActorService } from '../../../../src/modules/actors/services/actorService';
import type { NotificationService } from '../../../../src/modules/notifications/services/notification.service';
import type { ActorRepository } from '../../../../src/modules/actors/repositories/actorRepository';
import type { Post } from '../../../../src/modules/posts/models/post';
import { AppError, ErrorType } from '../../../../src/utils/errors';
import { ObjectId } from 'mongodb';
import { jest } from '@jest/globals';

// Mock uuid
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-1234',
}));

describe('PostService', () => {
  let mockPostRepository: jest.Mocked<PostRepository>;
  let mockActorService: jest.Mocked<ActorService>;
  let mockNotificationService: jest.Mocked<NotificationService>;
  let mockActorRepository: jest.Mocked<ActorRepository>;
  let postService: PostService;

  beforeEach(() => {
    mockPostRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      findFeed: jest.fn(),
      findByActorId: jest.fn(),
      countByActorId: jest.fn(),
      update: jest.fn(),
      deleteById: jest.fn(),
      isOwner: jest.fn(),
      findOneAndUpdate: jest.fn(),
    } as any;

    mockActorService = {
      getActorById: jest.fn(),
      getActorByApId: jest.fn(),
      getActorByUsername: jest.fn(),
      createActor: jest.fn(),
      updateActor: jest.fn(),
      deleteActor: jest.fn(),
      followActor: jest.fn(),
      unfollowActor: jest.fn(),
    } as any;

    mockNotificationService = {
      createNotification: jest.fn(),
      getNotifications: jest.fn(),
      markRead: jest.fn(),
      markAllRead: jest.fn(),
      getUnreadCount: jest.fn(),
    } as any;

    mockActorRepository = {
      findById: jest.fn(),
      findByUsername: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
    } as any;

    postService = new PostService(
      mockPostRepository,
      mockActorService,
      'example.com',
      mockActorRepository
    );

    postService.setNotificationService(mockNotificationService);
  });

  describe('createPost', () => {
    it('should create a post successfully with string actorId', async () => {
      const actorId = new ObjectId();
      const mockActor = {
        _id: actorId,
        id: `https://example.com/users/testuser`,
        preferredUsername: 'testuser',
        followers: 'https://example.com/users/testuser/followers',
      };

      const postData: CreatePostData = {
        content: 'Test post content',
        visibility: 'public',
        sensitive: false,
        actorId: actorId.toString(),
      };

      const mockCreatedPost = {
        _id: new ObjectId(),
        id: 'https://example.com/posts/test-uuid-1234',
        content: 'Test post content',
        actorId,
        visibility: 'public',
        sensitive: false,
        published: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockActorService.getActorById.mockResolvedValue(mockActor);
      mockPostRepository.create.mockResolvedValue(mockCreatedPost);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = await postService.createPost(postData);

      expect(mockActorService.getActorById).toHaveBeenCalledWith(actorId);
      expect(mockPostRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'https://example.com/posts/test-uuid-1234',
          content: 'Test post content',
          actorId,
          visibility: 'public',
          sensitive: false,
          to: ['https://www.w3.org/ns/activitystreams#Public'],
          cc: [mockActor.followers],
        })
      );
      expect(result).toEqual(mockCreatedPost);

      consoleSpy.mockRestore();
    });

    it('should create a post successfully with ObjectId actorId', async () => {
      const actorId = new ObjectId();
      const mockActor = {
        _id: actorId,
        id: `https://example.com/users/testuser`,
        preferredUsername: 'testuser',
        followers: 'https://example.com/users/testuser/followers',
      };

      const postData: CreatePostData = {
        content: 'Test post content',
        visibility: 'followers',
        sensitive: true,
        summary: 'Content warning',
        actorId,
      };

      const mockCreatedPost = {
        _id: new ObjectId(),
        id: 'https://example.com/posts/test-uuid-1234',
        content: 'Test post content',
        actorId,
        visibility: 'followers',
        sensitive: true,
        summary: 'Content warning',
        published: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockActorService.getActorById.mockResolvedValue(mockActor);
      mockPostRepository.create.mockResolvedValue(mockCreatedPost);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = await postService.createPost(postData);

      expect(mockActorService.getActorById).toHaveBeenCalledWith(actorId);
      expect(mockPostRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Test post content',
          visibility: 'followers',
          sensitive: true,
          summary: 'Content warning',
          to: [mockActor.followers],
          cc: [],
        })
      );
      expect(result).toEqual(mockCreatedPost);

      consoleSpy.mockRestore();
    });

    it('should throw error for invalid actorId format', async () => {
      const postData: CreatePostData = {
        content: 'Test post content',
        actorId: 'invalid-actor-id',
      };

      await expect(postService.createPost(postData)).rejects.toThrow(
        expect.objectContaining({
          message: 'Invalid actor ID format',
          statusCode: 400,
          type: ErrorType.BAD_REQUEST,
        })
      );
    });

    it('should try multiple actor lookup methods', async () => {
      const actorId = new ObjectId();
      const mockActor = {
        _id: actorId,
        id: `https://example.com/users/testuser`,
        preferredUsername: 'testuser',
        followers: 'https://example.com/users/testuser/followers',
      };

      const postData: CreatePostData = {
        content: 'Test post content',
        actorId: actorId.toString(),
      };

      const mockCreatedPost = {
        _id: new ObjectId(),
        id: 'https://example.com/posts/test-uuid-1234',
        content: 'Test post content',
        actorId,
      };

      // First two attempts fail, third succeeds
      mockActorService.getActorById
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      mockActorService.getActorByUsername.mockResolvedValue(mockActor);
      mockPostRepository.create.mockResolvedValue(mockCreatedPost);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = await postService.createPost(postData);

      expect(mockActorService.getActorById).toHaveBeenCalledTimes(2);
      expect(mockActorService.getActorByUsername).toHaveBeenCalledWith(actorId.toString());
      expect(result).toEqual(mockCreatedPost);

      consoleSpy.mockRestore();
    });

    it('should try actor repository as last resort', async () => {
      const actorId = new ObjectId();
      const mockActor = {
        _id: actorId,
        id: `https://example.com/users/testuser`,
        preferredUsername: 'testuser',
        followers: 'https://example.com/users/testuser/followers',
      };

      const postData: CreatePostData = {
        content: 'Test post content',
        actorId: actorId.toString(),
      };

      const mockCreatedPost = {
        _id: new ObjectId(),
        id: 'https://example.com/posts/test-uuid-1234',
        content: 'Test post content',
        actorId,
      };

      // All actor service methods fail
      mockActorService.getActorById.mockResolvedValue(null);
      mockActorService.getActorByUsername.mockResolvedValue(null);
      mockActorService.getActorByApId.mockResolvedValue(null);
      // Actor repository succeeds
      mockActorRepository.findById.mockResolvedValue(mockActor);
      mockPostRepository.create.mockResolvedValue(mockCreatedPost);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = await postService.createPost(postData);

      expect(mockActorRepository.findById).toHaveBeenCalledWith(actorId);
      expect(result).toEqual(mockCreatedPost);

      consoleSpy.mockRestore();
    });

    it('should throw error when actor not found', async () => {
      const actorId = new ObjectId();
      const postData: CreatePostData = {
        content: 'Test post content',
        actorId: actorId.toString(),
      };

      // All lookup methods fail
      mockActorService.getActorById.mockResolvedValue(null);
      mockActorService.getActorByUsername.mockResolvedValue(null);
      mockActorService.getActorByApId.mockResolvedValue(null);
      mockActorRepository.findById.mockResolvedValue(null);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await expect(postService.createPost(postData)).rejects.toThrow(
        expect.objectContaining({
          message: 'Author not found',
          statusCode: 404,
          type: ErrorType.NOT_FOUND,
        })
      );

      consoleSpy.mockRestore();
    });

    it('should handle URL-like actorId', async () => {
      const actorId = 'https://example.com/users/testuser';
      const mockActor = {
        _id: new ObjectId(),
        id: actorId,
        preferredUsername: 'testuser',
        followers: 'https://example.com/users/testuser/followers',
      };

      const postData: CreatePostData = {
        content: 'Test post content',
        actorId,
      };

      // First attempts fail, getActorByApId succeeds
      mockActorService.getActorById.mockResolvedValue(null);
      mockActorService.getActorByApId.mockResolvedValue(mockActor);
      mockPostRepository.create.mockResolvedValue({} as any);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await expect(postService.createPost(postData)).rejects.toThrow('Invalid actor ID format');

      consoleSpy.mockRestore();
    });
  });

  describe('getPostById', () => {
    it('should return post by ID', async () => {
      const postId = 'https://example.com/posts/test-post';
      const mockPost = {
        _id: new ObjectId(),
        id: postId,
        content: 'Test post content',
        actorId: new ObjectId(),
      };

      mockPostRepository.findOne.mockResolvedValue(mockPost);

      const result = await postService.getPostById(postId);

      expect(mockPostRepository.findOne).toHaveBeenCalledWith({ id: postId });
      expect(result).toEqual(mockPost);
    });

    it('should return null when post not found', async () => {
      const postId = 'https://example.com/posts/nonexistent';

      mockPostRepository.findOne.mockResolvedValue(null);

      const result = await postService.getPostById(postId);

      expect(mockPostRepository.findOne).toHaveBeenCalledWith({ id: postId });
      expect(result).toBeNull();
    });
  });

  describe('getFeed', () => {
    it('should return paginated feed with default options', async () => {
      const mockPosts = [
        {
          _id: new ObjectId(),
          id: 'post1',
          content: 'Post 1',
          actorId: new ObjectId(),
          published: new Date(),
        },
        {
          _id: new ObjectId(),
          id: 'post2',
          content: 'Post 2',
          actorId: new ObjectId(),
          published: new Date(),
        },
      ];

      const mockActor = {
        _id: new ObjectId(),
        id: 'actor1',
        preferredUsername: 'testuser',
      };

      mockPostRepository.findFeed.mockResolvedValue(mockPosts);
      mockActorService.getActorById.mockResolvedValue(mockActor);

      const result = await postService.getFeed();

      expect(mockPostRepository.findFeed).toHaveBeenCalledWith({
        sort: { published: -1 },
        skip: 0,
        limit: 21,
      });
      expect(result.posts).toHaveLength(2);
      expect(result.hasMore).toBe(false);
      expect(result.posts[0].actor).toEqual(mockActor);
    });

    it('should return paginated feed with custom options', async () => {
      const mockPosts = Array.from({ length: 11 }, (_, i) => ({
        _id: new ObjectId(),
        id: `post${i}`,
        content: `Post ${i}`,
        actorId: new ObjectId(),
        published: new Date(),
      }));

      mockPostRepository.findFeed.mockResolvedValue(mockPosts);
      mockActorService.getActorById.mockResolvedValue({
        _id: new ObjectId(),
        id: 'actor1',
        preferredUsername: 'testuser',
      });

      const result = await postService.getFeed({ page: 2, limit: 10 });

      expect(mockPostRepository.findFeed).toHaveBeenCalledWith({
        sort: { published: -1 },
        skip: 10,
        limit: 11,
      });
      expect(result.posts).toHaveLength(10);
      expect(result.hasMore).toBe(true);
    });

    it('should handle actor population errors gracefully', async () => {
      const mockPosts = [
        {
          _id: new ObjectId(),
          id: 'post1',
          content: 'Post 1',
          actorId: new ObjectId(),
          published: new Date(),
        },
      ];

      mockPostRepository.findFeed.mockResolvedValue(mockPosts);
      mockActorService.getActorById.mockRejectedValue(new Error('Actor lookup failed'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await postService.getFeed();

      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].actor).toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to populate actor'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getPostsByUsername', () => {
    it('should return posts by username', async () => {
      const username = 'testuser';
      const actorId = new ObjectId();
      const mockActor = {
        _id: actorId,
        preferredUsername: username,
      };

      const mockPosts = [
        {
          _id: new ObjectId(),
          id: 'post1',
          content: 'Post 1',
          actorId,
        },
      ];

      mockActorRepository.findByUsername.mockResolvedValue(mockActor);
      mockPostRepository.findByActorId.mockResolvedValue(mockPosts);
      mockPostRepository.countByActorId.mockResolvedValue(1);

      const result = await postService.getPostsByUsername(username, { limit: 10, offset: 0 });

      expect(mockActorRepository.findByUsername).toHaveBeenCalledWith(username);
      expect(mockPostRepository.findByActorId).toHaveBeenCalledWith(actorId.toString(), {
        limit: 10,
        offset: 0,
      });
      expect(result.posts).toEqual(mockPosts);
      expect(result.total).toBe(1);
      expect(result.offset).toBe(0);
    });

    it('should return empty result when actor not found', async () => {
      const username = 'nonexistent';

      mockActorRepository.findByUsername.mockResolvedValue(null);

      const result = await postService.getPostsByUsername(username, { limit: 10, offset: 0 });

      expect(result.posts).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.offset).toBe(0);
    });

    it('should handle errors gracefully', async () => {
      const username = 'testuser';

      mockActorRepository.findByUsername.mockRejectedValue(new Error('Database error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await postService.getPostsByUsername(username, { limit: 10, offset: 0 });

      expect(result.posts).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.offset).toBe(0);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error fetching posts for username'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('updatePost', () => {
    it('should update post when user is owner', async () => {
      const postId = 'https://example.com/posts/test-post';
      const actorId = new ObjectId();
      const updates: UpdatePostData = {
        content: 'Updated content',
        visibility: 'followers',
      };

      const mockUpdatedPost = {
        _id: new ObjectId(),
        id: postId,
        content: 'Updated content',
        visibility: 'followers',
        actorId,
      };

      mockPostRepository.isOwner.mockResolvedValue(true);
      mockPostRepository.update.mockResolvedValue(mockUpdatedPost);

      const result = await postService.updatePost(postId, actorId, updates);

      expect(mockPostRepository.isOwner).toHaveBeenCalledWith(postId, actorId);
      expect(mockPostRepository.update).toHaveBeenCalledWith(postId, updates);
      expect(result).toEqual(mockUpdatedPost);
    });

    it('should throw error when user is not owner', async () => {
      const postId = 'https://example.com/posts/test-post';
      const actorId = new ObjectId();
      const updates: UpdatePostData = {
        content: 'Updated content',
      };

      mockPostRepository.isOwner.mockResolvedValue(false);

      await expect(postService.updatePost(postId, actorId, updates)).rejects.toThrow(
        expect.objectContaining({
          message: 'User not authorized to update this post',
          statusCode: 403,
          type: ErrorType.FORBIDDEN,
        })
      );

      expect(mockPostRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('deletePost', () => {
    it('should delete post when user is owner', async () => {
      const postId = 'https://example.com/posts/test-post';
      const actorId = new ObjectId();

      mockPostRepository.isOwner.mockResolvedValue(true);
      mockPostRepository.deleteById.mockResolvedValue(true);

      const result = await postService.deletePost(postId, actorId);

      expect(mockPostRepository.isOwner).toHaveBeenCalledWith(postId, actorId);
      expect(mockPostRepository.deleteById).toHaveBeenCalledWith(postId);
      expect(result).toBe(true);
    });

    it('should throw error when user is not owner', async () => {
      const postId = 'https://example.com/posts/test-post';
      const actorId = new ObjectId();

      mockPostRepository.isOwner.mockResolvedValue(false);

      await expect(postService.deletePost(postId, actorId)).rejects.toThrow(
        expect.objectContaining({
          message: 'User not authorized to delete this post',
          statusCode: 403,
          type: ErrorType.FORBIDDEN,
        })
      );

      expect(mockPostRepository.deleteById).not.toHaveBeenCalled();
    });
  });

  describe('likePost', () => {
    it('should like post successfully', async () => {
      const postId = 'https://example.com/posts/test-post';
      const actorId = new ObjectId();

      const mockUpdatedPost = {
        _id: new ObjectId(),
        id: postId,
        content: 'Test content',
        actorId: new ObjectId(),
        likedBy: [actorId],
        likesCount: 1,
      };

      mockPostRepository.findOneAndUpdate.mockResolvedValue(mockUpdatedPost);

      const result = await postService.likePost(postId, actorId);

      expect(mockPostRepository.findOneAndUpdate).toHaveBeenCalledWith(
        { id: postId },
        {
          $addToSet: { likedBy: actorId },
          $inc: { likesCount: 1 },
          $set: { updatedAt: expect.any(Date) },
        }
      );
      expect(result).toEqual(mockUpdatedPost);
    });

    it('should handle string actorId', async () => {
      const postId = 'https://example.com/posts/test-post';
      const actorId = new ObjectId();

      const mockUpdatedPost = {
        _id: new ObjectId(),
        id: postId,
        content: 'Test content',
        actorId: new ObjectId(),
        likedBy: [actorId],
        likesCount: 1,
      };

      mockPostRepository.findOneAndUpdate.mockResolvedValue(mockUpdatedPost);

      const result = await postService.likePost(postId, actorId.toString());

      expect(mockPostRepository.findOneAndUpdate).toHaveBeenCalledWith(
        { id: postId },
        {
          $addToSet: { likedBy: actorId },
          $inc: { likesCount: 1 },
          $set: { updatedAt: expect.any(Date) },
        }
      );
      expect(result).toEqual(mockUpdatedPost);
    });

    it('should return null when post not found', async () => {
      const postId = 'https://example.com/posts/nonexistent';
      const actorId = new ObjectId();

      mockPostRepository.findOneAndUpdate.mockResolvedValue(null);

      const result = await postService.likePost(postId, actorId);

      expect(result).toBeNull();
    });
  });

  describe('unlikePost', () => {
    it('should unlike post successfully', async () => {
      const postId = 'https://example.com/posts/test-post';
      const actorId = new ObjectId();

      const mockUpdatedPost = {
        _id: new ObjectId(),
        id: postId,
        content: 'Test content',
        actorId: new ObjectId(),
        likedBy: [],
        likesCount: 0,
      };

      mockPostRepository.findOneAndUpdate.mockResolvedValue(mockUpdatedPost);

      const result = await postService.unlikePost(postId, actorId);

      expect(mockPostRepository.findOneAndUpdate).toHaveBeenCalledWith(
        { id: postId, likedBy: actorId },
        {
          $pull: { likedBy: actorId },
          $inc: { likesCount: -1 },
          $set: { updatedAt: expect.any(Date) },
        }
      );
      expect(result).toEqual(mockUpdatedPost);
    });

    it('should handle string actorId', async () => {
      const postId = 'https://example.com/posts/test-post';
      const actorId = new ObjectId();

      mockPostRepository.findOneAndUpdate.mockResolvedValue(null);

      const result = await postService.unlikePost(postId, actorId.toString());

      expect(mockPostRepository.findOneAndUpdate).toHaveBeenCalledWith(
        { id: postId, likedBy: actorId },
        {
          $pull: { likedBy: actorId },
          $inc: { likesCount: -1 },
          $set: { updatedAt: expect.any(Date) },
        }
      );
      expect(result).toBeNull();
    });
  });

  describe('sharePost', () => {
    it('should share post successfully', async () => {
      const postId = 'https://example.com/posts/test-post';
      const actorId = new ObjectId();

      const mockUpdatedPost = {
        _id: new ObjectId(),
        id: postId,
        content: 'Test content',
        actorId: new ObjectId(),
        sharedBy: [actorId],
        sharesCount: 1,
      };

      mockPostRepository.findOneAndUpdate.mockResolvedValue(mockUpdatedPost);

      const result = await postService.sharePost(postId, actorId);

      expect(mockPostRepository.findOneAndUpdate).toHaveBeenCalledWith(
        { id: postId },
        {
          $addToSet: { sharedBy: actorId },
          $inc: { sharesCount: 1 },
          $set: { updatedAt: expect.any(Date) },
        }
      );
      expect(result).toEqual(mockUpdatedPost);
    });

    it('should handle string actorId', async () => {
      const postId = 'https://example.com/posts/test-post';
      const actorId = new ObjectId();

      mockPostRepository.findOneAndUpdate.mockResolvedValue(null);

      const result = await postService.sharePost(postId, actorId.toString());

      expect(mockPostRepository.findOneAndUpdate).toHaveBeenCalledWith(
        { id: postId },
        {
          $addToSet: { sharedBy: actorId },
          $inc: { sharesCount: 1 },
          $set: { updatedAt: expect.any(Date) },
        }
      );
      expect(result).toBeNull();
    });
  });

  describe('unsharePost', () => {
    it('should unshare post successfully', async () => {
      const postId = 'https://example.com/posts/test-post';
      const actorId = new ObjectId();

      const mockUpdatedPost = {
        _id: new ObjectId(),
        id: postId,
        content: 'Test content',
        actorId: new ObjectId(),
        sharedBy: [],
        sharesCount: 0,
      };

      mockPostRepository.findOneAndUpdate.mockResolvedValue(mockUpdatedPost);

      const result = await postService.unsharePost(postId, actorId);

      expect(mockPostRepository.findOneAndUpdate).toHaveBeenCalledWith(
        { id: postId, sharedBy: actorId },
        {
          $pull: { sharedBy: actorId },
          $inc: { sharesCount: -1 },
          $set: { updatedAt: expect.any(Date) },
        }
      );
      expect(result).toEqual(mockUpdatedPost);
    });

    it('should handle string actorId', async () => {
      const postId = 'https://example.com/posts/test-post';
      const actorId = new ObjectId();

      mockPostRepository.findOneAndUpdate.mockResolvedValue(null);

      const result = await postService.unsharePost(postId, actorId.toString());

      expect(mockPostRepository.findOneAndUpdate).toHaveBeenCalledWith(
        { id: postId, sharedBy: actorId },
        {
          $pull: { sharedBy: actorId },
          $inc: { sharesCount: -1 },
          $set: { updatedAt: expect.any(Date) },
        }
      );
      expect(result).toBeNull();
    });
  });

  describe('isOwner', () => {
    it('should check ownership using repository method', async () => {
      const postId = 'https://example.com/posts/test-post';
      const actorId = new ObjectId();

      mockPostRepository.isOwner.mockResolvedValue(true);

      const result = await postService.isOwner(postId, actorId);

      expect(mockPostRepository.isOwner).toHaveBeenCalledWith(postId, actorId);
      expect(result).toBe(true);
    });

    it('should return false when not owner', async () => {
      const postId = 'https://example.com/posts/test-post';
      const actorId = new ObjectId();

      mockPostRepository.isOwner.mockResolvedValue(false);

      const result = await postService.isOwner(postId, actorId);

      expect(result).toBe(false);
    });
  });

  describe('Service Dependencies', () => {
    it('should set notification service', () => {
      const newNotificationService = mockNotificationService;
      postService.setNotificationService(newNotificationService);

      expect(postService['notificationService']).toBe(newNotificationService);
    });

    it('should set actor service', () => {
      const newActorService = mockActorService;
      postService.setActorService(newActorService);

      expect(postService['actorService']).toBe(newActorService);
    });
  });
});