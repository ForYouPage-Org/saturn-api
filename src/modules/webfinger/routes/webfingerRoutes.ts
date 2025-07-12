import type { Request, Response, NextFunction, Router } from "express";
import express from "express";
import { WebFingerController } from "../controllers/webfingerController";
import type { ServiceContainer } from "../../../utils/container";
import { wrapAsync } from "../../../utils/routeHandler";

/**
 * Configure WebFinger routes for actor discovery
 */
export function configureWebFingerRoutes(
  serviceContainer: ServiceContainer
): Router {
  const router = express.Router();
  const { actorService, webfingerService, domain } = serviceContainer;

  // Create controller with injected services
  const webFingerController = new WebFingerController(
    actorService,
    webfingerService,
    domain
  );

  // WebFinger resource endpoint
  router.get(
    "/.well-known/webfinger",
    wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
      return webFingerController.getResource(
        req as Request & { services: ServiceContainer },
        res,
        next
      );
    })
  );

  return router;
}

export default configureWebFingerRoutes;
