import type { Request, Response, NextFunction } from 'express';
import type { PostService } from '@/modules/posts/services/postService';
import type { ActorService } from '@/modules/actors/services/actorService';
import type { UploadService } from '@/modules/media/services/upload.service';
import { AppError, ErrorType } from '@/utils/errors';
import type { Post, Attachment } from '@/modules/posts/models/post';
import type { Actor } from '@/modules/actors/models/actor';
import { ObjectId } from 'mongodb';
import type {
  CreatePostData,
  UpdatePostData,
} from '@/modules/posts/services/postService';
import {
  createPostSchema as _createPostSchema,
  updatePostSchema as _updatePostSchema,
} from '@/modules/posts/schemas/post.schema';

// --- Define DTOs for Request Validation ---
// Define outside the class

// DTO for creating a post

// DTO for updating a post (adjust properties as needed)

// Define response DTO (can be refined further)
interface PostResponseDTO {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    preferredUsername: string;
    displayName?: string;
    iconUrl?: string;
  };
  published: string;
  sensitive: boolean;
  summary?: string;
  attachments?: Attachment[];
  likes: number;
  likedByUser: boolean;
  shares: number;
  sharedByUser: boolean;
  replyCount: number;
  visibility: 'public' | 'followers' | 'unlisted' | 'direct';
  url: string;
}

export class PostsController {
  private postService: PostService;
  private actorService: ActorService;
  private uploadService: UploadService;
  private domain: string;

  constructor(
    postService: PostService,
    actorService: ActorService,
    uploadService: UploadService,
    domain: string
  ) {
    this.postService = postService;
    this.actorService = actorService;
    this.uploadService = uploadService;
    this.domain = domain;
  }

  /**
   * Helper function to convert post to response format
   */
  private async formatPostResponse(
    post: Post,
    requestingActorId?: string // Optional ID of the user making the request
  ): Promise<PostResponseDTO> {
    // Use defined DTO
    if (!post.actorId) {
      throw new AppError(
        'Post author information is missing.',
        500,
        ErrorType.INTERNAL_SERVER_ERROR
      );
    }

    // Fetch author details if not already populated
    let author: Pick<
      Actor,
      'id' | 'username' | 'preferredUsername' | 'displayName' | 'icon' | 'name'
    > | null;
    if (post.actor?.id) {
      // Use pre-populated actor summary if available
      author = post.actor;
    } else {
      author = await this.actorService.getActorById(post.actorId);
    }

    // Handle case where author doesn't exist anymore
    if (!author) {
      console.warn(
        `Author not found for post ${post.id} with actorId ${post.actorId}`
      );
      // Create placeholder author for deleted accounts
      author = {
        id: post.actorId.toString(),
        username: 'deleted-user',
        preferredUsername: 'deleted-user',
        displayName: 'Deleted Account',
        name: 'Deleted Account',
      };
    }

    // Convert potential ObjectId to string for comparison
    const reqActorIdStr = requestingActorId
      ? new ObjectId(requestingActorId).toHexString()
      : undefined;

    // Check if the requesting user has liked/shared this post
    const likedByUser = reqActorIdStr
      ? post.likedBy?.some(id => id.toHexString() === reqActorIdStr)
      : false;
    const sharedByUser = reqActorIdStr
      ? post.sharedBy?.some(id => id.toHexString() === reqActorIdStr)
      : false;

    return {
      id: post.id,
      content: post.content,
      author: {
        id: author.id,
        username: author.username, // Use full username
        preferredUsername: author.preferredUsername,
        displayName: author.displayName || author.name,
        iconUrl: author.icon?.url,
      },
      published: post.published.toISOString(),
      sensitive: post.sensitive,
      summary: post.summary,
      attachments: post.attachments,
      likes: post.likesCount || 0,
      likedByUser: likedByUser ?? false,
      shares: post.sharesCount || 0,
      sharedByUser: sharedByUser ?? false,
      replyCount: post.replyCount || 0,
      visibility: post.visibility,
      url: post.url,
    };
  }

  /**
   * Create a new post
   */
  async createPost(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(
          'Authentication required',
          401,
          ErrorType.UNAUTHORIZED
        );
      }

      // Use id field consistently - this is what the JWT token uses
      const actorId = req.user.id;

      console.log('[PostsController] Creating post with actor ID:', actorId);
      console.log('[PostsController] User object:', {
        id: req.user.id,
        _id: req.user._id,
        username: req.user.username,
      });

      // Data has already been validated by the Zod schema middleware
      // We can safely typecast here
      const validatedData = req.body;

      // Construct postData with validated data
      const postData: CreatePostData = {
        ...validatedData,
        actorId,
      };

      const newPost = await this.postService.createPost(postData);
      const formattedPost = await this.formatPostResponse(
        newPost,
        actorId.toString()
      );
      res.status(201).json(formattedPost);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get feed (public timeline)
   */
  async getFeed(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(
          'Authentication required',
          401, // Unauthorized
          ErrorType.AUTHENTICATION
        );
      }
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const userId = req.user.id; // Get authenticated user ID if available

      // Pass options object to service
      const { posts, hasMore } = await this.postService.getFeed({
        page,
        limit,
      }); // <<< Use options object

      // Format posts
      const formattedPosts = await Promise.all(
        posts.map(post => this.formatPostResponse(post, userId.toString()))
      );

      res.json({
        posts: formattedPosts,
        hasMore,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single post by ID
   */
  async getPostById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const postId = req.params.id;
      const post = await this.postService.getPostById(postId);
      if (!post) {
        throw new AppError('Post not found', 404, ErrorType.NOT_FOUND);
      }
      const userId = req.user ? req.user.id : undefined;
      const formattedPost = await this.formatPostResponse(
        post,
        userId?.toString()
      );
      res.json(formattedPost);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get posts by username
   */
  async getPostsByUsername(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { username } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      // Calculate offset from page and limit
      const offset = (page - 1) * limit;

      // Get user ID for like/share status if user is authenticated
      const userId = req.user ? req.user.id : undefined;

      // Call the service method to get posts by username
      const result = await this.postService.getPostsByUsername(username, {
        limit,
        offset,
      });

      // Format posts
      const formattedPosts = await Promise.all(
        result.posts.map((post: Post) =>
          this.formatPostResponse(post, userId?.toString())
        )
      );

      // Calculate if there are more posts
      const hasMore = offset + formattedPosts.length < result.total;

      res.json({
        posts: formattedPosts,
        hasMore,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update post
   */
  async updatePost(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(
          'Authentication required',
          401,
          ErrorType.UNAUTHORIZED
        );
      }
      const actorId = req.user.id;
      const postId = req.params.id;

      // Data has already been validated by the Zod schema middleware
      const validatedData = req.body;

      // Use imported UpdatePostData type
      const updateData: UpdatePostData = validatedData;

      const updatedPost = await this.postService.updatePost(
        postId,
        actorId,
        updateData
      );
      if (!updatedPost) {
        throw new AppError(
          'Post not found or user not authorized',
          404,
          ErrorType.NOT_FOUND
        );
      }

      // Format post
      const formattedPost = await this.formatPostResponse(
        updatedPost,
        actorId.toString()
      );

      res.json(formattedPost);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete post
   */
  async deletePost(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(
          'Authentication required',
          401,
          ErrorType.UNAUTHORIZED
        );
      }
      const actorId = req.user.id;
      const postId = req.params.id;

      const deleted = await this.postService.deletePost(postId, actorId);
      if (!deleted) {
        throw new AppError(
          'Post not found or user not authorized',
          404,
          ErrorType.NOT_FOUND
        );
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Like a post
   */
  async likePost(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(
          'Authentication required',
          401,
          ErrorType.UNAUTHORIZED
        );
      }
      const actorId = req.user.id;
      const postId = req.params.id;

      const updatedPost = await this.postService.likePost(postId, actorId);
      if (!updatedPost) {
        throw new AppError('Post not found', 404, ErrorType.NOT_FOUND);
      }

      const formattedPost = await this.formatPostResponse(
        updatedPost,
        actorId.toString()
      );
      res.json(formattedPost);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unlike a post
   */
  async unlikePost(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(
          'Authentication required',
          401,
          ErrorType.UNAUTHORIZED
        );
      }
      const actorId = req.user.id;
      const postId = req.params.id;

      const updatedPost = await this.postService.unlikePost(postId, actorId);
      if (!updatedPost) {
        throw new AppError('Post not found', 404, ErrorType.NOT_FOUND);
      }

      const formattedPost = await this.formatPostResponse(
        updatedPost,
        actorId.toString()
      );
      res.json(formattedPost);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Share a post (aka reblog/boost)
   */
  async sharePost(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(
          'Authentication required',
          401,
          ErrorType.UNAUTHORIZED
        );
      }
      const actorId = req.user.id;
      const postId = req.params.id;

      const updatedPost = await this.postService.sharePost(postId, actorId);
      if (!updatedPost) {
        throw new AppError('Post not found', 404, ErrorType.NOT_FOUND);
      }

      const formattedPost = await this.formatPostResponse(
        updatedPost,
        actorId.toString()
      );
      res.json(formattedPost);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unshare a post
   */
  async unsharePost(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(
          'Authentication required',
          401,
          ErrorType.UNAUTHORIZED
        );
      }
      const actorId = req.user.id;
      const postId = req.params.id;

      const updatedPost = await this.postService.unsharePost(postId, actorId);
      if (!updatedPost) {
        throw new AppError('Post not found', 404, ErrorType.NOT_FOUND);
      }

      const formattedPost = await this.formatPostResponse(
        updatedPost,
        actorId.toString()
      );
      res.json(formattedPost);
    } catch (error) {
      next(error);
    }
  }
}
