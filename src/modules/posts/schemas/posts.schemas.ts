import { z } from 'zod';
import type {
  OffsetPaginationQueryType} from '../../shared/schemas/common.schemas';
import {
  objectIdSchema,
  offsetPaginationQuerySchema
} from '../../shared/schemas/common.schemas';

/**
 * Schema for post ID that accepts both ObjectId and ActivityPub URL formats
 */
export const postIdSchema = z.string().refine(
  (id) => {
    // Accept MongoDB ObjectId format (24 character hex string)
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      return true;
    }
    // Accept ActivityPub URL format
    if (id.startsWith('http://') || id.startsWith('https://')) {
      try {
        new URL(id);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  },
  {
    message: 'Invalid post ID format. Must be either a valid ObjectId or a valid URL.',
  }
);

/**
 * Schema for post ID URL parameter
 */
export const postIdParamSchema = z.object({
  id: postIdSchema,
});

/**
 * Schema for feed query parameters
 */
export const feedQuerySchema = offsetPaginationQuerySchema.extend({
  type: z.enum(['feed', 'local', 'all']).optional(),
});

// Define the output type for feed query
export type FeedQueryType = OffsetPaginationQueryType & {
  type?: 'feed' | 'local' | 'all';
};

/**
 * Schema for route validation with explicit output type
 * This is a new schema that directly specifies the output types
 */
export const routeFeedQuerySchema = z.object({
  offset: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 0)),
  limit: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 10)),
  type: z.enum(['feed', 'local', 'all']).optional(),
});

/**
 * Schema for username URL parameter
 */
export const usernameParamSchema = z.object({
  username: z.string().min(1).max(50),
});
