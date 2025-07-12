import { z } from "zod";
import type { PaginationQueryType } from "../../shared/schemas/common.schemas";
import { paginationQuerySchema } from "../../shared/schemas/common.schemas";

/**
 * Schema for username URL parameter
 */
export const usernameParamSchema = z.object({
  username: z.string().min(1).max(50),
});

/**
 * Schema for follow/unfollow pagination query parameters
 */
export const followListQuerySchema = paginationQuerySchema.extend({
  // Override the limit to be more restrictive for follow lists
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(
      z.number().int().min(1).max(50, {
        message: "Limit must be between 1 and 50",
      })
    ),
});

// Define the output type for follow list query
export type FollowListQueryType = PaginationQueryType & {
  limit: number; // Override to match our stricter limit
};

/**
 * Schema for follow/unfollow response
 */
export const followResponseSchema = z.object({
  status: z.literal("success"),
  message: z.string(),
  isFollowing: z.boolean(),
});

/**
 * Schema for followers/following list response
 */
export const followListResponseSchema = z.object({
  status: z.literal("success"),
  followers: z
    .array(
      z.object({
        id: z.string(),
        username: z.string(),
        preferredUsername: z.string(),
        displayName: z.string().optional(),
        iconUrl: z.string().optional(),
      })
    )
    .optional(),
  following: z
    .array(
      z.object({
        id: z.string(),
        username: z.string(),
        preferredUsername: z.string(),
        displayName: z.string().optional(),
        iconUrl: z.string().optional(),
      })
    )
    .optional(),
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  limit: z.number().int().min(1).max(50),
  hasMore: z.boolean(),
});

// Export types
export type FollowResponseType = z.infer<typeof followResponseSchema>;
export type FollowListResponseType = z.infer<typeof followListResponseSchema>;
export type UsernameParamType = z.infer<typeof usernameParamSchema>;
