import type { Request, Response, NextFunction } from "express";
import { ErrorType } from "../utils/errors";
import logger from "../utils/logger";

/**
 * Standard API Response Format
 */
interface StandardResponse {
  status?: "success" | "error";
  type?: string;
  error?: string;
  data?: any;
  details?: any;
}

/**
 * Response validation middleware to enforce standardized API response formats
 * VP-level implementation for enterprise-grade API consistency
 */
export function responseValidationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const originalJson = res.json;
  const originalSend = res.send;

  // Override res.json to validate response format
  res.json = function (data: any) {
    const validatedData = validateAndStandardizeResponse(data, res.statusCode);

    // Log response validation for monitoring
    logger.debug(
      {
        path: req.path,
        method: req.method,
        statusCode: res.statusCode,
        responseData: validatedData,
      },
      "API Response Validation"
    );

    return originalJson.call(this, validatedData);
  };

  // Override res.send to handle non-JSON responses
  res.send = function (data: any) {
    // Only validate JSON-like responses
    if (typeof data === "object" && data !== null && !Buffer.isBuffer(data)) {
      const validatedData = validateAndStandardizeResponse(
        data,
        res.statusCode
      );
      return originalSend.call(this, validatedData);
    }

    return originalSend.call(this, data);
  };

  next();
}

/**
 * Validate and standardize API response format
 */
function validateAndStandardizeResponse(
  data: any,
  statusCode: number
): StandardResponse {
  // Handle null/undefined responses
  if (data === null || data === undefined) {
    return {
      status: statusCode >= 400 ? "error" : "success",
      data: null,
    };
  }

  // Handle primitive responses (strings, numbers, booleans)
  if (typeof data !== "object" || Buffer.isBuffer(data)) {
    return {
      status: statusCode >= 400 ? "error" : "success",
      data: data,
    };
  }

  // Handle array responses
  if (Array.isArray(data)) {
    return {
      status: statusCode >= 400 ? "error" : "success",
      data: data,
    };
  }

  // Handle error responses
  if (statusCode >= 400) {
    return validateErrorResponse(data, statusCode);
  }

  // Handle success responses
  return validateSuccessResponse(data);
}

/**
 * Validate error response format
 */
function validateErrorResponse(
  data: any,
  statusCode: number
): StandardResponse {
  // Check if response already has standardized error format
  if (data.status === "error" && data.type && data.error) {
    return data;
  }

  // Handle legacy error format: { error: "message" }
  if (data.error && typeof data.error === "string") {
    return {
      status: "error",
      type: getErrorTypeFromStatusCode(statusCode),
      error: data.error,
      details: data.details,
    };
  }

  // Handle legacy error format: { message: "message" }
  if (data.message && typeof data.message === "string") {
    return {
      status: "error",
      type: getErrorTypeFromStatusCode(statusCode),
      error: data.message,
      details: data.details,
    };
  }

  // Handle unknown error formats
  logger.warn(
    {
      statusCode,
      responseData: data,
    },
    "Non-standard error response format detected"
  );

  return {
    status: "error",
    type: getErrorTypeFromStatusCode(statusCode),
    error: "An error occurred",
    details: data,
  };
}

/**
 * Validate success response format
 */
function validateSuccessResponse(data: any): StandardResponse {
  // If response already has a 'status' field, preserve it
  if (data.status) {
    return data;
  }

  // For success responses, wrap data appropriately
  return {
    status: "success",
    ...data,
  };
}

/**
 * Get error type from HTTP status code
 */
function getErrorTypeFromStatusCode(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return ErrorType.VALIDATION;
    case 401:
      return ErrorType.UNAUTHORIZED;
    case 403:
      return ErrorType.FORBIDDEN;
    case 404:
      return ErrorType.NOT_FOUND;
    case 409:
      return ErrorType.CONFLICT;
    case 429:
      return ErrorType.RATE_LIMIT;
    case 500:
    default:
      return ErrorType.SERVER_ERROR;
  }
}

/**
 * Response format validation for development/testing
 * Throws errors in development if response format is invalid
 */
export function strictResponseValidation(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "test"
  ) {
    const originalJson = res.json;

    res.json = function (data: any) {
      validateResponseFormat(data, res.statusCode, req.path);
      return originalJson.call(this, data);
    };
  }

  next();
}

/**
 * Strict validation for development environment
 */
function validateResponseFormat(
  data: any,
  statusCode: number,
  path: string
): void {
  if (statusCode >= 400) {
    // Error responses must have standard format
    if (!data.status || !data.type || !data.error) {
      throw new Error(
        `Invalid error response format at ${path}. Expected: { status: 'error', type: 'ERROR_TYPE', error: 'message' }`
      );
    }

    // Validate error type
    const validErrorTypes = Object.values(ErrorType);
    if (!validErrorTypes.includes(data.type)) {
      throw new Error(
        `Invalid error type '${
          data.type
        }' at ${path}. Valid types: ${validErrorTypes.join(", ")}`
      );
    }
  }
}

/**
 * Middleware to log response format violations
 */
export function responseFormatMonitoring(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const originalJson = res.json;

  res.json = function (data: any) {
    // Monitor for legacy error formats
    if (res.statusCode >= 400 && data.error && !data.status) {
      logger.warn(
        {
          path: req.path,
          method: req.method,
          statusCode: res.statusCode,
          responseData: data,
        },
        "Legacy error response format detected - consider migrating to standard format"
      );
    }

    return originalJson.call(this, data);
  };

  next();
}

export default responseValidationMiddleware;
