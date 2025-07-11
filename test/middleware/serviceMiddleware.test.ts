import { serviceMiddleware } from '../../src/middleware/serviceMiddleware';
import type { ServiceContainer } from '../../src/utils/container';
import type { Request, Response, NextFunction } from 'express';
import { jest } from '@jest/globals';

describe('Service Middleware', () => {
  let mockServiceContainer: jest.Mocked<ServiceContainer>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockServiceContainer = {
      get: jest.fn(),
      set: jest.fn(),
      has: jest.fn(),
      resolve: jest.fn(),
    } as any;

    mockRequest = {
      method: 'GET',
      path: '/test',
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('serviceMiddleware', () => {
    it('should inject service container into request object', () => {
      const middleware = serviceMiddleware(mockServiceContainer);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).services).toBe(mockServiceContainer);
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next without arguments on success', () => {
      const middleware = serviceMiddleware(mockServiceContainer);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should work with different service container instances', () => {
      const anotherContainer = {
        get: jest.fn(),
        set: jest.fn(),
        has: jest.fn(),
        resolve: jest.fn(),
      } as any;

      const middleware = serviceMiddleware(anotherContainer);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).services).toBe(anotherContainer);
      expect((mockRequest as any).services).not.toBe(mockServiceContainer);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle multiple requests independently', () => {
      const middleware = serviceMiddleware(mockServiceContainer);
      
      const mockRequest1 = { method: 'GET', path: '/test1' };
      const mockRequest2 = { method: 'POST', path: '/test2' };
      const mockNext1 = jest.fn();
      const mockNext2 = jest.fn();

      middleware(mockRequest1 as Request, mockResponse as Response, mockNext1);
      middleware(mockRequest2 as Request, mockResponse as Response, mockNext2);

      expect((mockRequest1 as any).services).toBe(mockServiceContainer);
      expect((mockRequest2 as any).services).toBe(mockServiceContainer);
      expect(mockNext1).toHaveBeenCalled();
      expect(mockNext2).toHaveBeenCalled();
    });

    it('should not modify the original service container', () => {
      const originalContainer = { ...mockServiceContainer };
      const middleware = serviceMiddleware(mockServiceContainer);
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockServiceContainer.get).toEqual(originalContainer.get);
      expect(mockServiceContainer.set).toEqual(originalContainer.set);
      expect(mockServiceContainer.has).toEqual(originalContainer.has);
      expect(mockServiceContainer.resolve).toEqual(originalContainer.resolve);
    });

    it('should handle errors during container assignment', () => {
      // Create a request object that throws when trying to assign properties
      const problematicRequest = {};
      Object.defineProperty(problematicRequest, 'services', {
        set: () => {
          throw new Error('Assignment error');
        },
        configurable: true,
      });

      const middleware = serviceMiddleware(mockServiceContainer);
      middleware(problematicRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Assignment error',
        })
      );
    });

    it('should handle null service container', () => {
      const middleware = serviceMiddleware(null as any);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).services).toBeNull();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle undefined service container', () => {
      const middleware = serviceMiddleware(undefined as any);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).services).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should preserve existing request properties', () => {
      mockRequest.body = { test: 'data' };
      mockRequest.params = { id: '123' };
      mockRequest.query = { page: '1' };

      const middleware = serviceMiddleware(mockServiceContainer);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body).toEqual({ test: 'data' });
      expect(mockRequest.params).toEqual({ id: '123' });
      expect(mockRequest.query).toEqual({ page: '1' });
      expect((mockRequest as any).services).toBe(mockServiceContainer);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should work with request objects that already have services property', () => {
      const existingServices = { existing: 'service' };
      (mockRequest as any).services = existingServices;

      const middleware = serviceMiddleware(mockServiceContainer);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).services).toBe(mockServiceContainer);
      expect((mockRequest as any).services).not.toBe(existingServices);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle service container with all methods', () => {
      const fullServiceContainer = {
        get: jest.fn().mockReturnValue('service'),
        set: jest.fn(),
        has: jest.fn().mockReturnValue(true),
        resolve: jest.fn().mockReturnValue('resolved'),
        clear: jest.fn(),
        keys: jest.fn().mockReturnValue(['key1', 'key2']),
        values: jest.fn().mockReturnValue(['value1', 'value2']),
      } as any;

      const middleware = serviceMiddleware(fullServiceContainer);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).services).toBe(fullServiceContainer);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle concurrent requests', () => {
      const middleware = serviceMiddleware(mockServiceContainer);
      
      const requests = Array.from({ length: 5 }, (_, i) => ({
        method: 'GET',
        path: `/test${i}`,
      }));
      
      const nextFunctions = requests.map(() => jest.fn());

      // Process all requests concurrently
      requests.forEach((req, index) => {
        middleware(req as Request, mockResponse as Response, nextFunctions[index]);
      });

      // Verify all requests were processed
      requests.forEach((req, index) => {
        expect((req as any).services).toBe(mockServiceContainer);
        expect(nextFunctions[index]).toHaveBeenCalled();
      });
    });

    it('should be reusable across different routes', () => {
      const middleware = serviceMiddleware(mockServiceContainer);
      
      const scenarios = [
        { method: 'GET', path: '/users' },
        { method: 'POST', path: '/posts' },
        { method: 'PUT', path: '/comments' },
        { method: 'DELETE', path: '/media' },
      ];

      scenarios.forEach(scenario => {
        const request = { ...scenario };
        const next = jest.fn();
        
        middleware(request as Request, mockResponse as Response, next);
        
        expect((request as any).services).toBe(mockServiceContainer);
        expect(next).toHaveBeenCalled();
      });
    });

    it('should handle service container with proxy', () => {
      const proxyContainer = new Proxy(mockServiceContainer, {
        get: (target, prop) => {
          if (prop === 'get') {
            return jest.fn().mockReturnValue('proxied service');
          }
          return target[prop as keyof ServiceContainer];
        },
      });

      const middleware = serviceMiddleware(proxyContainer);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).services).toBe(proxyContainer);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle errors thrown during middleware execution', () => {
      // Mock the property assignment to throw an error
      const errorRequest = {};
      Object.defineProperty(errorRequest, 'services', {
        set: () => {
          throw new Error('Property assignment failed');
        },
        configurable: true,
      });

      const middleware = serviceMiddleware(mockServiceContainer);
      middleware(errorRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Property assignment failed',
        })
      );
    });

    it('should handle TypeError during assignment', () => {
      const readOnlyRequest = {};
      Object.defineProperty(readOnlyRequest, 'services', {
        value: 'readonly',
        writable: false,
        configurable: false,
      });

      const middleware = serviceMiddleware(mockServiceContainer);
      middleware(readOnlyRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle unexpected errors gracefully', () => {
      // Create a request object that throws an unexpected error
      const problematicRequest = new Proxy({}, {
        set: () => {
          throw new TypeError('Unexpected error');
        },
      });

      const middleware = serviceMiddleware(mockServiceContainer);
      middleware(problematicRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Unexpected error',
        })
      );
    });

    it('should not interfere with response object', () => {
      const middleware = serviceMiddleware(mockServiceContainer);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });
});