import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import { ErrorType } from "../utils/errors";
import logger from "../utils/logger";

/**
 * Standard Error Response DTO Schema
 */
export const errorResponseSchema = z.object({
  status: z.literal("error"),
  type: z.enum([
    ErrorType.VALIDATION,
    ErrorType.UNAUTHORIZED,
    ErrorType.FORBIDDEN,
    ErrorType.NOT_FOUND,
    ErrorType.CONFLICT,
    ErrorType.RATE_LIMIT,
    ErrorType.SERVER_ERROR,
  ]),
  error: z.string(),
  details: z.any().optional(),
});

/**
 * Standard Success Response DTO Schema
 */
export const successResponseSchema = z
  .object({
    status: z.literal("success").optional(),
  })
  .passthrough(); // Allow additional properties

/**
 * Actor/User Response DTO Schema
 */
export const actorResponseSchema = z.object({
  id: z.string(),
  username: z.string(),
  preferredUsername: z.string(),
  displayName: z.string().optional(),
  iconUrl: z.string().optional(),
  email: z.string().optional(),
  followers: z.array(z.string()).optional(),
  following: z.array(z.string()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

/**
 * Post Response DTO Schema
 */
export const postResponseSchema = z.object({
  id: z.string(),
  content: z.string(),
  author: z.object({
    id: z.string(),
    username: z.string(),
    preferredUsername: z.string(),
    displayName: z.string().optional(),
    iconUrl: z.string().optional(),
  }),
  published: z.string(),
  sensitive: z.boolean(),
  summary: z.string().optional(),
  attachments: z.array(z.any()).optional(),
  likes: z.number(),
  likedByUser: z.boolean(),
  shares: z.number(),
  sharedByUser: z.boolean(),
  replyCount: z.number(),
  visibility: z.enum(["public", "followers", "unlisted", "direct"]),
  url: z.string(),
});

/**
 * Comment Response DTO Schema
 */
export const commentResponseSchema = z.object({
  id: z.string(),
  content: z.string(),
  author: z.object({
    id: z.string(),
    username: z.string(),
    preferredUsername: z.string(),
    displayName: z.string().optional(),
    iconUrl: z.string().optional(),
  }),
  published: z.string(),
  postId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

/**
 * Feed Response DTO Schema
 */
export const feedResponseSchema = z.object({
  posts: z.array(postResponseSchema),
  hasMore: z.boolean(),
});

/**
 * Notification Response DTO Schema
 */
export const notificationResponseSchema = z.object({
  id: z.string(),
  type: z.enum(["LIKE", "COMMENT", "FOLLOW", "MENTION", "SHARE"]),
  read: z.boolean(),
  createdAt: z.string(),
  actor: z.object({
    id: z.string(),
    username: z.string(),
    preferredUsername: z.string(),
    displayName: z.string().optional(),
    iconUrl: z.string().optional(),
  }),
  object: z
    .object({
      id: z.string(),
      type: z.enum(["Post", "Comment", "User"]),
      content: z.string().optional(),
    })
    .optional(),
});

/**
 * Authentication Response DTO Schema
 */
export const authResponseSchema = z.object({
  actor: actorResponseSchema,
  token: z.string(),
});

/**
 * DTO Validation Registry
 */
export const dtoValidationRegistry = new Map<string, z.ZodSchema>([
  // Authentication endpoints
  ["POST:/api/auth/login", authResponseSchema],
  ["POST:/api/auth/register", authResponseSchema],
  ["GET:/api/auth/me", actorResponseSchema],

  // Posts endpoints
  ["GET:/api/posts", feedResponseSchema],
  ["POST:/api/posts", postResponseSchema],
  ["GET:/api/posts/:id", postResponseSchema],

  // Comments endpoints
  [
    "GET:/api/comments/:postId",
    z.object({
      comments: z.array(commentResponseSchema),
      total: z.number(),
      limit: z.number(),
      offset: z.number(),
    }),
  ],
  ["POST:/api/comments", commentResponseSchema],

  // Actors endpoints
  ["GET:/api/actors/:username", actorResponseSchema],
  [
    "GET:/api/actors/search",
    z.object({
      actors: z.array(actorResponseSchema),
    }),
  ],

  // Notifications endpoints
  [
    "GET:/api/notifications",
    z.object({
      notifications: z.array(notificationResponseSchema),
    }),
  ],

  // Error responses (all endpoints)
  ["error", errorResponseSchema],
]);

/**
 * Runtime DTO validation middleware
 */
export function runtimeDtoValidation(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const originalJson = res.json;

  res.json = function (data: any) {
    // Get the route key for validation
    const routeKey = `${req.method}:${req.route?.path || req.path}`;
    const isError = res.statusCode >= 400;

    // Validate response against schema
    validateResponseDto(data, routeKey, isError, req.path);

    return originalJson.call(this, data);
  };

  next();
}

/**
 * Validate response against registered DTO schemas
 */
function validateResponseDto(
  data: any,
  routeKey: string,
  isError: boolean,
  path: string
): void {
  try {
    // Skip validation in test environment for performance
    if (process.env.NODE_ENV === "test") {
      return;
    }

    // Use error schema for error responses
    if (isError) {
      const errorSchema = dtoValidationRegistry.get("error");
      if (errorSchema) {
        const result = errorSchema.safeParse(data);
        if (!result.success) {
          logger.warn(
            {
              path,
              routeKey,
              errors: result.error.errors.map((err) => ({
                path: err.path,
                message: err.message,
                code: err.code,
              })),
            },
            "Error response DTO validation failed"
          );
        }
      }
      return;
    }

    // Find matching schema for success responses
    const schema = findMatchingSchema(routeKey);
    if (!schema) {
      logger.debug(
        {
          path,
          routeKey,
          availableRoutes: Array.from(dtoValidationRegistry.keys()),
        },
        "No DTO schema found for route"
      );
      return;
    }

    // Validate response
    const result = schema.safeParse(data);
    if (!result.success) {
      logger.warn(
        {
          path,
          routeKey,
          errors: result.error.errors.map((err) => ({
            path: err.path,
            message: err.message,
            code: err.code,
          })),
        },
        "Response DTO validation failed"
      );

      // In development, throw error for immediate feedback
      if (process.env.NODE_ENV === "development") {
        throw new Error(
          `DTO validation failed for ${routeKey}: ${result.error.errors
            .map((err) => `${err.path.join(".")}: ${err.message}`)
            .join(", ")}`
        );
      }
    }
  } catch (error) {
    logger.error(
      {
        path,
        routeKey,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      "DTO validation error"
    );
  }
}

/**
 * Find the matching schema for a given route key.
 * This function handles pattern matching for routes like /api/posts/:id.
 */
function findMatchingSchema(routeKey: string): z.ZodSchema | undefined {
  // Try exact match first
  const exactMatch = dtoValidationRegistry.get(routeKey);
  if (exactMatch) {
    return exactMatch;
  }

  // Try pattern matching
  for (const [key, schema] of dtoValidationRegistry.entries()) {
    if (key.includes(":") && matchesRoutePattern(routeKey, key)) {
      return schema;
    }
  }

  return undefined;
}

/**
 * Check if route matches a pattern (e.g., /api/posts/:id matches /api/posts/123)
 */
function matchesRoutePattern(
  actualRoute: string,
  patternRoute: string
): boolean {
  const [actualMethod, actualPath] = actualRoute.split(":");
  const [patternMethod, patternPath] = patternRoute.split(":");

  if (actualMethod !== patternMethod) {
    return false;
  }

  const actualSegments = actualPath.split("/");
  const patternSegments = patternPath.split("/");

  if (actualSegments.length !== patternSegments.length) {
    return false;
  }

  for (let i = 0; i < actualSegments.length; i++) {
    const actualSegment = actualSegments[i];
    const patternSegment = patternSegments[i];

    if (patternSegment.startsWith(":")) {
      // This is a parameter, so it matches any value
      continue;
    }

    if (actualSegment !== patternSegment) {
      return false;
    }
  }

  return true;
}

/**
 * Strict DTO validation for development
 */
export function strictDtoValidation(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "test"
  ) {
    runtimeDtoValidation(req, res, next);
  } else {
    next();
  }
}

/**
 * Custom DTO validation for specific routes
 */
export function validateDto<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;

    res.json = function (data: any) {
      const result = schema.safeParse(data);

      if (!result.success) {
        const errorDetails = result.error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        }));

        logger.error(
          {
            path: req.path,
            validationErrors: errorDetails,
            responseData: data,
          },
          "Custom DTO validation failed"
        );

        if (process.env.NODE_ENV === "development") {
          throw new Error(
            `Custom DTO validation failed: ${JSON.stringify(
              errorDetails,
              null,
              2
            )}`
          );
        }
      }

      return originalJson.call(this, data);
    };

    next();
  };
}

/**
 * Performance monitoring for DTO validation
 */
export function dtoValidationPerformanceMonitoring(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();
  const originalJson = res.json;

  res.json = function (data: any) {
    const validationTime = Date.now() - startTime;

    if (validationTime > 100) {
      logger.warn(
        {
          path: req.path,
          validationTime,
        },
        "DTO validation took longer than expected"
      );
    }

    return originalJson.call(this, data);
  };

  next();
}

export default runtimeDtoValidation;
 