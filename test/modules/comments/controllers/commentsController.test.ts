import { CommentsController } from '../../../../src/modules/comments/controllers/comments.controller';
import type { CommentService } from '../../../../src/modules/comments/services/comment.service';
import type { Request, Response } from 'express';
import { jest } from '@jest/globals';

describe('CommentsController', () => {
  let mockCommentService: jest.Mocked<CommentService>;
  let commentsController: CommentsController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockCommentService = {
      createComment: jest.fn(),
      getCommentsByPostId: jest.fn(),
      getCommentById: jest.fn(),
      updateComment: jest.fn(),
      deleteComment: jest.fn(),
      likeComment: jest.fn(),
      unlikeComment: jest.fn(),
    } as any;

    commentsController = new CommentsController(mockCommentService);

    mockRequest = {
      params: {},
      body: {},
      user: {
        id: 'user123',
        username: 'testuser',
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('createComment', () => {
    it('should create a new comment', async () => {
      const commentData = {
        content: 'Test comment',
        postId: 'post123',
      };

      const mockComment = {
        id: 'comment123',
        content: 'Test comment',
        postId: 'post123',
        authorId: 'user123',
        createdAt: new Date(),
      };

      mockRequest.body = commentData;
      mockCommentService.createComment.mockResolvedValue(mockComment);

      await commentsController.createComment(mockRequest as Request, mockResponse as Response);

      expect(mockCommentService.createComment).toHaveBeenCalledWith({
        ...commentData,
        authorId: 'user123',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockComment,
      });
    });

    it('should handle comment creation errors', async () => {
      mockRequest.body = {
        content: 'Test comment',
        postId: 'post123',
      };

      mockCommentService.createComment.mockRejectedValue(new Error('Creation failed'));

      await expect(
        commentsController.createComment(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow('Creation failed');
    });
  });

  describe('getCommentsByPostId', () => {
    it('should get comments for a post', async () => {
      const mockComments = [
        {
          id: 'comment1',
          content: 'First comment',
          postId: 'post123',
          authorId: 'user1',
        },
        {
          id: 'comment2',
          content: 'Second comment',
          postId: 'post123',
          authorId: 'user2',
        },
      ];

      mockRequest.params = { postId: 'post123' };
      mockCommentService.getCommentsByPostId.mockResolvedValue(mockComments);

      await commentsController.getCommentsByPostId(mockRequest as Request, mockResponse as Response);

      expect(mockCommentService.getCommentsByPostId).toHaveBeenCalledWith('post123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockComments,
      });
    });

    it('should handle missing postId parameter', async () => {
      mockRequest.params = {};

      await commentsController.getCommentsByPostId(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Post ID is required',
      });
    });
  });

  describe('getCommentById', () => {
    it('should get a comment by id', async () => {
      const mockComment = {
        id: 'comment123',
        content: 'Test comment',
        postId: 'post123',
        authorId: 'user123',
      };

      mockRequest.params = { commentId: 'comment123' };
      mockCommentService.getCommentById.mockResolvedValue(mockComment);

      await commentsController.getCommentById(mockRequest as Request, mockResponse as Response);

      expect(mockCommentService.getCommentById).toHaveBeenCalledWith('comment123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockComment,
      });
    });

    it('should handle comment not found', async () => {
      mockRequest.params = { commentId: 'nonexistent' };
      mockCommentService.getCommentById.mockResolvedValue(null);

      await commentsController.getCommentById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Comment not found',
      });
    });
  });

  describe('updateComment', () => {
    it('should update a comment', async () => {
      const updateData = {
        content: 'Updated comment content',
      };

      const mockUpdatedComment = {
        id: 'comment123',
        content: 'Updated comment content',
        postId: 'post123',
        authorId: 'user123',
        updatedAt: new Date(),
      };

      mockRequest.params = { commentId: 'comment123' };
      mockRequest.body = updateData;
      mockCommentService.updateComment.mockResolvedValue(mockUpdatedComment);

      await commentsController.updateComment(mockRequest as Request, mockResponse as Response);

      expect(mockCommentService.updateComment).toHaveBeenCalledWith(
        'comment123',
        updateData,
        'user123'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedComment,
      });
    });

    it('should handle unauthorized update', async () => {
      mockRequest.params = { commentId: 'comment123' };
      mockRequest.body = { content: 'Updated content' };
      mockCommentService.updateComment.mockRejectedValue(new Error('Unauthorized'));

      await expect(
        commentsController.updateComment(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment', async () => {
      mockRequest.params = { commentId: 'comment123' };
      mockCommentService.deleteComment.mockResolvedValue(true);

      await commentsController.deleteComment(mockRequest as Request, mockResponse as Response);

      expect(mockCommentService.deleteComment).toHaveBeenCalledWith('comment123', 'user123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Comment deleted successfully',
      });
    });

    it('should handle comment not found for deletion', async () => {
      mockRequest.params = { commentId: 'nonexistent' };
      mockCommentService.deleteComment.mockResolvedValue(false);

      await commentsController.deleteComment(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Comment not found',
      });
    });
  });

  describe('likeComment', () => {
    it('should like a comment', async () => {
      mockRequest.params = { commentId: 'comment123' };
      mockCommentService.likeComment.mockResolvedValue(true);

      await commentsController.likeComment(mockRequest as Request, mockResponse as Response);

      expect(mockCommentService.likeComment).toHaveBeenCalledWith('comment123', 'user123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Comment liked successfully',
      });
    });

    it('should handle like errors', async () => {
      mockRequest.params = { commentId: 'comment123' };
      mockCommentService.likeComment.mockResolvedValue(false);

      await commentsController.likeComment(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unable to like comment',
      });
    });
  });

  describe('unlikeComment', () => {
    it('should unlike a comment', async () => {
      mockRequest.params = { commentId: 'comment123' };
      mockCommentService.unlikeComment.mockResolvedValue(true);

      await commentsController.unlikeComment(mockRequest as Request, mockResponse as Response);

      expect(mockCommentService.unlikeComment).toHaveBeenCalledWith('comment123', 'user123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Comment unliked successfully',
      });
    });

    it('should handle unlike errors', async () => {
      mockRequest.params = { commentId: 'comment123' };
      mockCommentService.unlikeComment.mockResolvedValue(false);

      await commentsController.unlikeComment(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unable to unlike comment',
      });
    });
  });
});