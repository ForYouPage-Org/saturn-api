import { wrapAsync } from '../../src/utils/routeHandler';
import type { Request, Response, NextFunction } from 'express';
import { jest } from '@jest/globals';

describe('Route Handler Utilities', () => {
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
      send: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('wrapAsync', () => {
    it('should return a function', () => {
      const handler = async (req: Request, res: Response) => {
        res.json({ message: 'success' });
      };

      const wrappedHandler = wrapAsync(handler);
      
      expect(typeof wrappedHandler).toBe('function');
    });

    it('should catch asynchronous errors', (done) => {
      const asyncErrorHandler = async (req: Request, res: Response) => {
        throw new Error('Async error');
      };

      const wrappedHandler = wrapAsync(asyncErrorHandler);
      
      wrappedHandler(mockRequest as Request, mockResponse as Response, (error) => {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Async error');
        done();
      });
    });

    it('should catch Promise rejection', (done) => {
      const rejectionHandler = async (req: Request, res: Response) => {
        return Promise.reject(new Error('Promise rejected'));
      };

      const wrappedHandler = wrapAsync(rejectionHandler);
      
      wrappedHandler(mockRequest as Request, mockResponse as Response, (error) => {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Promise rejected');
        done();
      });
    });

    it('should handle successful async operations', (done) => {
      const successHandler = async (req: Request, res: Response) => {
        res.json({ success: true });
      };

      const wrappedHandler = wrapAsync(successHandler);
      
      wrappedHandler(mockRequest as Request, mockResponse as Response, (error) => {
        // Should not be called for successful operations
        expect(error).toBeUndefined();
        done();
      });
      
      // Give it a moment to complete
      setTimeout(() => {
        expect(mockResponse.json).toHaveBeenCalledWith({ success: true });
        done();
      }, 10);
    });

    it('should handle handlers that call next', (done) => {
      const handlerWithNext = async (req: Request, res: Response, next: NextFunction) => {
        next();
      };

      const wrappedHandler = wrapAsync(handlerWithNext);
      
      wrappedHandler(mockRequest as Request, mockResponse as Response, () => {
        done();
      });
    });

    it('should handle handlers that call next with error', (done) => {
      const handlerWithError = async (req: Request, res: Response, next: NextFunction) => {
        next(new Error('Handler error'));
      };

      const wrappedHandler = wrapAsync(handlerWithError);
      
      wrappedHandler(mockRequest as Request, mockResponse as Response, (error) => {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Handler error');
        done();
      });
    });
  });
});