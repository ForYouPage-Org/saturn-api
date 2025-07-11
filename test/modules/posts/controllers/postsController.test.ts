import { PostsController } from '../../../../src/modules/posts/controllers/postsController';
import type { PostService } from '../../../../src/modules/posts/services/postService';
import type { ActorService } from '../../../../src/modules/actors/services/actorService';
import type { UploadService } from '../../../../src/modules/media/services/upload.service';
import type { Request, Response } from 'express';
import { AppError, ErrorType } from '../../../../src/utils/errors';
import { jest } from '@jest/globals';

describe('PostsController', () => {
  let mockPostService: jest.Mocked<PostService>;
  let mockActorService: jest.Mocked<ActorService>;
  let mockUploadService: jest.Mocked<UploadService>;
  let postsController: PostsController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  const domain = 'test.example.com';

  beforeEach(() => {
    mockPostService = {
      createPost: jest.fn(),
      getPostById: jest.fn(),
      updatePost: jest.fn(),
      deletePost: jest.fn(),
      getPostsByActor: jest.fn(),
      getTimelinePosts: jest.fn(),
      likePost: jest.fn(),
      unlikePost: jest.fn(),
      sharePost: jest.fn(),
      unsharePost: jest.fn(),
      getPostReplies: jest.fn(),
      searchPosts: jest.fn(),
    } as any;

    mockActorService = {
      getActorById: jest.fn(),
      getActorByUsername: jest.fn(),
      createActor: jest.fn(),
      updateActor: jest.fn(),
      deleteActor: jest.fn(),
      followActor: jest.fn(),
      unfollowActor: jest.fn(),
    } as any;

    mockUploadService = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
      getFileUrl: jest.fn(),
    } as any;

    postsController = new PostsController(
      mockPostService,
      mockActorService,
      mockUploadService,
      domain
    );

    mockRequest = {
      params: {},
      body: {},
      query: {},
      user: {
        id: 'user123',
        username: 'testuser',
        preferredUsername: 'testuser',
      },
      files: [],
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('createPost', () => {
    it('should create a new post successfully', async () => {
      const postData = {
        content: 'Test post content',
        visibility: 'public' as const,
        sensitive: false,
      };

      const mockPost = {
        id: 'post123',
        content: 'Test post content',
        actorId: 'user123',
        published: new Date(),
        visibility: 'public',
        sensitive: false,
        likes: 0,
        shares: 0,
        replyCount: 0,
        url: `https://${domain}/posts/post123`,
      };

      const mockAuthor = {
        id: 'user123',
        username: 'testuser',
        preferredUsername: 'testuser',
        displayName: 'Test User',
        name: 'Test User',
      };

      mockRequest.body = postData;
      mockPostService.createPost.mockResolvedValue(mockPost);
      mockActorService.getActorById.mockResolvedValue(mockAuthor);

      await postsController.createPost(mockRequest as Request, mockResponse as Response);

      expect(mockPostService.createPost).toHaveBeenCalledWith({
        ...postData,
        actorId: 'user123',
        attachments: [],
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: 'post123',
          content: 'Test post content',
          author: expect.objectContaining({
            id: 'user123',
            username: 'testuser',
            preferredUsername: 'testuser',
          }),
        }),
      });
    });

    it('should handle post creation with attachments', async () => {
      const postData = {
        content: 'Post with image',
        visibility: 'public' as const,
        sensitive: false,
      };

      const mockFiles = [
        {
          originalname: 'test.jpg',
          mimetype: 'image/jpeg',
          buffer: Buffer.from('test'),
          size: 1024,
        },
      ];

      const mockPost = {
        id: 'post123',
        content: 'Post with image',
        actorId: 'user123',
        published: new Date(),
        visibility: 'public',
        sensitive: false,
        likes: 0,
        shares: 0,
        replyCount: 0,
        url: `https://${domain}/posts/post123`,
        attachments: [
          {
            id: 'attachment123',
            url: `https://${domain}/media/attachment123`,
            mediaType: 'image/jpeg',
            name: 'test.jpg',
          },
        ],
      };

      const mockAuthor = {
        id: 'user123',
        username: 'testuser',
        preferredUsername: 'testuser',
        displayName: 'Test User',
        name: 'Test User',
      };

      mockRequest.body = postData;
      mockRequest.files = mockFiles;
      mockUploadService.uploadFile.mockResolvedValue({
        id: 'attachment123',
        url: `https://${domain}/media/attachment123`,
        filename: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
      });
      mockPostService.createPost.mockResolvedValue(mockPost);
      mockActorService.getActorById.mockResolvedValue(mockAuthor);

      await postsController.createPost(mockRequest as Request, mockResponse as Response);

      expect(mockUploadService.uploadFile).toHaveBeenCalledWith(mockFiles[0], 'user123');
      expect(mockPostService.createPost).toHaveBeenCalledWith({
        ...postData,
        actorId: 'user123',
        attachments: [
          {
            id: 'attachment123',
            url: `https://${domain}/media/attachment123`,
            mediaType: 'image/jpeg',
            name: 'test.jpg',
          },
        ],
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('should handle post creation errors', async () => {
      const postData = {
        content: 'Test post content',
        visibility: 'public' as const,
      };

      mockRequest.body = postData;
      mockPostService.createPost.mockRejectedValue(new Error('Database error'));

      await expect(
        postsController.createPost(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow('Database error');
    });

    it('should handle missing user', async () => {
      mockRequest.user = undefined;

      await expect(
        postsController.createPost(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(AppError);
    });
  });

  describe('getPost', () => {
    it('should get a post by ID', async () => {
      const mockPost = {
        id: 'post123',
        content: 'Test post content',
        actorId: 'user123',
        published: new Date(),
        visibility: 'public',
        sensitive: false,
        likes: 0,
        shares: 0,
        replyCount: 0,
        url: `https://${domain}/posts/post123`,
      };

      const mockAuthor = {
        id: 'user123',
        username: 'testuser',
        preferredUsername: 'testuser',
        displayName: 'Test User',
        name: 'Test User',
      };

      mockRequest.params = { id: 'post123' };
      mockPostService.getPostById.mockResolvedValue(mockPost);
      mockActorService.getActorById.mockResolvedValue(mockAuthor);

      await postsController.getPost(mockRequest as Request, mockResponse as Response);

      expect(mockPostService.getPostById).toHaveBeenCalledWith('post123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: 'post123',
          content: 'Test post content',
          author: expect.objectContaining({
            id: 'user123',
            username: 'testuser',
          }),
        }),
      });
    });

    it('should handle post not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockPostService.getPostById.mockResolvedValue(null);

      await postsController.getPost(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Post not found',
      });
    });

    it('should handle missing post ID', async () => {
      mockRequest.params = {};

      await postsController.getPost(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Post ID is required',
      });
    });

    it('should handle deleted author gracefully', async () => {
      const mockPost = {
        id: 'post123',
        content: 'Test post content',
        actorId: 'deleteduser',
        published: new Date(),
        visibility: 'public',
        sensitive: false,
        likes: 0,
        shares: 0,
        replyCount: 0,
        url: `https://${domain}/posts/post123`,
      };

      mockRequest.params = { id: 'post123' };
      mockPostService.getPostById.mockResolvedValue(mockPost);
      mockActorService.getActorById.mockResolvedValue(null);

      await postsController.getPost(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: 'post123',
          author: expect.objectContaining({
            id: 'deleteduser',
            username: 'deleted_user',
            preferredUsername: 'deleted_user',
            displayName: 'Deleted User',
          }),
        }),
      });
    });
  });

  describe('updatePost', () => {
    it('should update a post successfully', async () => {
      const updateData = {
        content: 'Updated post content',
        sensitive: true,
      };

      const mockUpdatedPost = {
        id: 'post123',
        content: 'Updated post content',
        actorId: 'user123',
        published: new Date(),
        visibility: 'public',
        sensitive: true,
        likes: 0,
        shares: 0,
        replyCount: 0,
        url: `https://${domain}/posts/post123`,
      };

      const mockAuthor = {
        id: 'user123',
        username: 'testuser',
        preferredUsername: 'testuser',
        displayName: 'Test User',
        name: 'Test User',
      };

      mockRequest.params = { id: 'post123' };
      mockRequest.body = updateData;
      mockPostService.updatePost.mockResolvedValue(mockUpdatedPost);
      mockActorService.getActorById.mockResolvedValue(mockAuthor);

      await postsController.updatePost(mockRequest as Request, mockResponse as Response);

      expect(mockPostService.updatePost).toHaveBeenCalledWith(
        'post123',
        updateData,
        'user123'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: 'post123',
          content: 'Updated post content',
          sensitive: true,
        }),
      });
    });

    it('should handle post not found for update', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockRequest.body = { content: 'Updated content' };
      mockPostService.updatePost.mockResolvedValue(null);

      await postsController.updatePost(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Post not found or unauthorized',
      });
    });

    it('should handle unauthorized update', async () => {
      mockRequest.params = { id: 'post123' };
      mockRequest.body = { content: 'Updated content' };
      mockPostService.updatePost.mockRejectedValue(
        new AppError('Unauthorized', 403, ErrorType.FORBIDDEN)
      );

      await expect(
        postsController.updatePost(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(AppError);
    });
  });

  describe('deletePost', () => {
    it('should delete a post successfully', async () => {
      mockRequest.params = { id: 'post123' };
      mockPostService.deletePost.mockResolvedValue(true);

      await postsController.deletePost(mockRequest as Request, mockResponse as Response);

      expect(mockPostService.deletePost).toHaveBeenCalledWith('post123', 'user123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Post deleted successfully',
      });
    });

    it('should handle post not found for deletion', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockPostService.deletePost.mockResolvedValue(false);

      await postsController.deletePost(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Post not found or unauthorized',
      });
    });
  });

  describe('likePost', () => {
    it('should like a post successfully', async () => {
      mockRequest.params = { id: 'post123' };
      mockPostService.likePost.mockResolvedValue(true);

      await postsController.likePost(mockRequest as Request, mockResponse as Response);

      expect(mockPostService.likePost).toHaveBeenCalledWith('post123', 'user123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Post liked successfully',
      });
    });

    it('should handle like errors', async () => {
      mockRequest.params = { id: 'post123' };
      mockPostService.likePost.mockResolvedValue(false);

      await postsController.likePost(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unable to like post',
      });
    });
  });

  describe('unlikePost', () => {
    it('should unlike a post successfully', async () => {
      mockRequest.params = { id: 'post123' };
      mockPostService.unlikePost.mockResolvedValue(true);

      await postsController.unlikePost(mockRequest as Request, mockResponse as Response);

      expect(mockPostService.unlikePost).toHaveBeenCalledWith('post123', 'user123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Post unliked successfully',
      });
    });

    it('should handle unlike errors', async () => {
      mockRequest.params = { id: 'post123' };
      mockPostService.unlikePost.mockResolvedValue(false);

      await postsController.unlikePost(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unable to unlike post',
      });
    });
  });

  describe('getTimeline', () => {
    it('should get timeline posts', async () => {
      const mockPosts = [
        {
          id: 'post1',
          content: 'First post',
          actorId: 'user1',
          published: new Date(),
          visibility: 'public',
          sensitive: false,
          likes: 0,
          shares: 0,
          replyCount: 0,
          url: `https://${domain}/posts/post1`,
        },
        {
          id: 'post2',
          content: 'Second post',
          actorId: 'user2',
          published: new Date(),
          visibility: 'public',
          sensitive: false,
          likes: 0,
          shares: 0,
          replyCount: 0,
          url: `https://${domain}/posts/post2`,
        },
      ];

      const mockAuthors = [
        {
          id: 'user1',
          username: 'user1',
          preferredUsername: 'user1',
          displayName: 'User One',
          name: 'User One',
        },
        {
          id: 'user2',
          username: 'user2',
          preferredUsername: 'user2',
          displayName: 'User Two',
          name: 'User Two',
        },
      ];

      mockRequest.query = { limit: '10', offset: '0' };
      mockPostService.getTimelinePosts.mockResolvedValue(mockPosts);
      mockActorService.getActorById.mockResolvedValueOnce(mockAuthors[0]);
      mockActorService.getActorById.mockResolvedValueOnce(mockAuthors[1]);

      await postsController.getTimeline(mockRequest as Request, mockResponse as Response);

      expect(mockPostService.getTimelinePosts).toHaveBeenCalledWith('user123', {
        limit: 10,
        offset: 0,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: 'post1',
            content: 'First post',
          }),
          expect.objectContaining({
            id: 'post2',
            content: 'Second post',
          }),
        ]),
      });
    });

    it('should handle empty timeline', async () => {
      mockRequest.query = {};
      mockPostService.getTimelinePosts.mockResolvedValue([]);

      await postsController.getTimeline(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: [],
      });
    });
  });

  describe('formatPostResponse', () => {
    it('should handle post with missing author gracefully', async () => {
      const mockPost = {
        id: 'post123',
        content: 'Test post content',
        actorId: 'user123',
        published: new Date(),
        visibility: 'public' as const,
        sensitive: false,
        likes: 0,
        shares: 0,
        replyCount: 0,
        url: `https://${domain}/posts/post123`,
      };

      mockRequest.params = { id: 'post123' };
      mockPostService.getPostById.mockResolvedValue(mockPost);
      mockActorService.getActorById.mockResolvedValue(null);

      await postsController.getPost(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          author: expect.objectContaining({
            displayName: 'Deleted User',
            username: 'deleted_user',
          }),
        }),
      });
    });

    it('should handle post with missing actorId', async () => {
      const mockPost = {
        id: 'post123',
        content: 'Test post content',
        actorId: null,
        published: new Date(),
        visibility: 'public' as const,
        sensitive: false,
        likes: 0,
        shares: 0,
        replyCount: 0,
        url: `https://${domain}/posts/post123`,
      };

      mockRequest.params = { id: 'post123' };
      mockPostService.getPostById.mockResolvedValue(mockPost);

      await expect(
        postsController.getPost(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(AppError);
    });
  });
});