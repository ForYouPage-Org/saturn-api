import type { Request, Response, NextFunction } from 'express';
import type { ServiceContainer } from '../utils/container';

/**
 * Middleware factory to inject the service container onto the request object.
 */
export const serviceMiddleware = (container: ServiceContainer) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Assign the container to req.services with type assertion
      (req as Request & { services: ServiceContainer }).services = container;
      next();
    } catch (error) {
      // Catch potential errors during assignment
      next(error);
    }
  };
};
