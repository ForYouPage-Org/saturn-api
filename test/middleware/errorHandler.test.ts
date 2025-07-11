import { errorHandler } from '../../src/middleware/errorHandler';
import { AppError, ErrorType } from '../../src/utils/errors';
import type { Request, Response, NextFunction } from 'express';
import { jest } from '@jest/globals';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      url: '/test',
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      locals: {},
    };

    mockNext = jest.fn();
  });

  describe('AppError Handling', () => {
    it('should handle AppError with proper status code', () => {
      const error = new AppError('Test error', 400, ErrorType.VALIDATION);
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        type: ErrorType.VALIDATION,
        error: 'Test error',
      });
    });

    it('should handle NOT_FOUND errors', () => {
      const error = new AppError('Resource not found', 404, ErrorType.NOT_FOUND);
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        type: ErrorType.NOT_FOUND,
        error: 'Resource not found',
      });
    });

    it('should handle UNAUTHORIZED errors', () => {
      const error = new AppError('Unauthorized access', 401, ErrorType.UNAUTHORIZED);
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        type: ErrorType.UNAUTHORIZED,
        error: 'Unauthorized access',
      });
    });

    it('should handle FORBIDDEN errors', () => {
      const error = new AppError('Forbidden', 403, ErrorType.FORBIDDEN);
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        type: ErrorType.FORBIDDEN,
        error: 'Forbidden',
      });
    });
  });

  describe('Generic Error Handling', () => {
    it('should handle generic Error objects', () => {
      const error = new Error('Generic error message');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        type: ErrorType.SERVER_ERROR,
        error: 'Generic error message',
      });
    });

    it('should handle unknown error types', () => {
      const error = 'String error';
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        type: ErrorType.SERVER_ERROR,
        error: 'Unknown error',
      });
    });

    it('should handle null errors', () => {
      const error = null;
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        type: ErrorType.SERVER_ERROR,
        error: 'Unknown error',
      });
    });
  });

  describe('Environment-Specific Behavior', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should show detailed error in development', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Test error');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        type: ErrorType.SERVER_ERROR,
        error: 'Test error',
      });
    });

    it('should hide error details in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Test error');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        type: ErrorType.SERVER_ERROR,
        error: 'Internal server error',
      });
    });
  });
});