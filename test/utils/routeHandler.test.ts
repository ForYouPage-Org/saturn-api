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
    it('should wrap synchronous functions', async () => {
      const syncHandler = (req: Request, res: Response) => {
        res.json({ message: 'success' });
      };

      const wrappedHandler = wrapAsync(syncHandler);
      
      await wrappedHandler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'success' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should wrap asynchronous functions', async () => {
      const asyncHandler = async (req: Request, res: Response) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        res.json({ message: 'async success' });
      };

      const wrappedHandler = wrapAsync(asyncHandler);
      
      await wrappedHandler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'async success' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should catch synchronous errors', async () => {
      const errorHandler = (req: Request, res: Response) => {
        throw new Error('Sync error');
      };

      const wrappedHandler = wrapAsync(errorHandler);
      
      await wrappedHandler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Sync error'
      }));
    });

    it('should catch asynchronous errors', async () => {
      const asyncErrorHandler = async (req: Request, res: Response) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        throw new Error('Async error');
      };

      const wrappedHandler = wrapAsync(asyncErrorHandler);
      
      await wrappedHandler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Async error'
      }));
    });

    it('should handle Promise rejection', async () => {
      const rejectionHandler = (req: Request, res: Response) => {
        return Promise.reject(new Error('Promise rejected'));
      };

      const wrappedHandler = wrapAsync(rejectionHandler);
      
      await wrappedHandler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Promise rejected'
      }));
    });

    it('should handle handlers with next parameter', async () => {
      const handlerWithNext = (req: Request, res: Response, next: NextFunction) => {
        next();
      };

      const wrappedHandler = wrapAsync(handlerWithNext);
      
      await wrappedHandler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle handlers that call next with error', async () => {
      const handlerWithError = (req: Request, res: Response, next: NextFunction) => {
        next(new Error('Handler error'));
      };

      const wrappedHandler = wrapAsync(handlerWithError);
      
      await wrappedHandler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Handler error'
      }));
    });

    it('should preserve request and response objects', async () => {
      const handler = (req: Request, res: Response) => {
        expect(req).toBe(mockRequest);
        expect(res).toBe(mockResponse);
        res.json({ success: true });
      };

      const wrappedHandler = wrapAsync(handler);
      
      await wrappedHandler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({ success: true });
    });

    it('should handle multiple async operations', async () => {
      const multiAsyncHandler = async (req: Request, res: Response) => {
        await Promise.all([
          new Promise(resolve => setTimeout(resolve, 5)),
          new Promise(resolve => setTimeout(resolve, 10)),
          new Promise(resolve => setTimeout(resolve, 15))
        ]);
        res.json({ message: 'all done' });
      };

      const wrappedHandler = wrapAsync(multiAsyncHandler);
      
      await wrappedHandler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'all done' });
    });

    it('should handle complex error objects', async () => {
      const complexError = {
        name: 'CustomError',
        message: 'Complex error message',
        code: 'ERR_CUSTOM',
        details: { field: 'test' }
      };

      const errorHandler = (req: Request, res: Response) => {
        throw complexError;
      };

      const wrappedHandler = wrapAsync(errorHandler);
      
      await wrappedHandler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(complexError);
    });

    it('should handle null and undefined returns', async () => {
      const nullHandler = (req: Request, res: Response) => {
        res.status(204).send();
        return null;
      };

      const wrappedHandler = wrapAsync(nullHandler);
      
      await wrappedHandler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should work with different response methods', async () => {
      const handler = (req: Request, res: Response) => {
        res.status(201).json({ created: true });
      };

      const wrappedHandler = wrapAsync(handler);
      
      await wrappedHandler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({ created: true });
    });
  });
});