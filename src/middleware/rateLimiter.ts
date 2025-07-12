import rateLimit from "express-rate-limit";
import { AppError as _AppError, ErrorType } from "../utils/errors";

/**
 * Creates a rate limiter middleware for different API endpoints
 * Environment-specific configurations to prevent cross-team friction
 */

// Environment-specific rate limiting configurations
const isDevelopment = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";
const isProduction = process.env.NODE_ENV === "production";

// Development/Test configurations (very permissive)
const DEV_CONFIG = {
  windowMs: 1 * 60 * 1000, // 1 minute
  authLimit: 1000, // 1000 attempts per minute
  defaultLimit: 10000, // 10000 requests per minute
  postLimit: 1000, // 1000 posts per minute
  mediaLimit: 500, // 500 uploads per minute
  engagementLimit: 5000, // 5000 interactions per minute
};

// Production configurations (secure)
const PROD_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  authLimit: 10, // 10 attempts per 15 minutes
  defaultLimit: 100, // 100 requests per 15 minutes
  postLimit: 20, // 20 posts per 5 minutes (overridden below)
  mediaLimit: 50, // 50 uploads per hour (overridden below)
  engagementLimit: 100, // 100 interactions per 5 minutes (overridden below)
};

// Select configuration based on environment
const config = isDevelopment || isTest ? DEV_CONFIG : PROD_CONFIG;

// Standardized error response format
const createErrorResponse = (message: string) => ({
  status: "error",
  type: ErrorType.RATE_LIMIT,
  error: message,
});

// Default rate limiter for general API endpoints
export const defaultRateLimiter = rateLimit({
  windowMs: config.windowMs,
  limit: config.defaultLimit,
  standardHeaders: "draft-7", // Use draft-7 header format (RateLimit-*)
  legacyHeaders: false, // Disable the X-RateLimit-* headers
  message: createErrorResponse("Too many requests, please try again later"),
});

// More strict rate limiter for authentication endpoints
export const authRateLimiter = rateLimit({
  windowMs: config.windowMs,
  limit: config.authLimit,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: createErrorResponse(
    "Too many authentication attempts, please try again later"
  ),
});

// Rate limiter for creating posts
export const createPostRateLimiter = rateLimit({
  windowMs: isDevelopment || isTest ? config.windowMs : 5 * 60 * 1000, // 5 minutes in prod
  limit: config.postLimit,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: createErrorResponse(
    "You are posting too frequently, please try again later"
  ),
});

// Rate limiter for media uploads
export const mediaUploadRateLimiter = rateLimit({
  windowMs: isDevelopment || isTest ? config.windowMs : 60 * 60 * 1000, // 1 hour in prod
  limit: config.mediaLimit,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: createErrorResponse("Too many file uploads, please try again later"),
});

// Rate limiter for post engagements (likes, shares, etc.)
export const engagementRateLimiter = rateLimit({
  windowMs: isDevelopment || isTest ? config.windowMs : 5 * 60 * 1000, // 5 minutes in prod
  limit: config.engagementLimit,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: createErrorResponse("Too many interactions, please try again later"),
});

// Export configuration for documentation
export const RATE_LIMIT_CONFIG = {
  environment: process.env.NODE_ENV,
  development: DEV_CONFIG,
  production: PROD_CONFIG,
  current: config,
};
