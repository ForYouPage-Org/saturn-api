import type { Request, Response, NextFunction } from "express";
import express from "express";
import { ActivityPubController } from "../controllers/activitypubController";
import type { ServiceContainer } from "../../../utils/container";
import { wrapAsync } from "../../../utils/routeHandler";
import { verifyHttpSignature } from "../../../middleware/httpSignature";

/**
 * Configure ActivityPub routes for federation
 */
export function configureActivityPubRoutes(
  serviceContainer: ServiceContainer
): express.Router {
  const router = express.Router();
  const { actorService, activityPubService, domain } = serviceContainer;

  // Create controller with injected services
  const activityPubController = new ActivityPubController(
    actorService,
    activityPubService,
    domain
  );

  // Get ActivityPub actor profile
  router.get(
    "/users/:username",
    (req: Request, res: Response, next: NextFunction) => {
      // Add Accept header check for ActivityPub
      if (
        req.headers.accept?.includes("application/activity+json") ||
        req.headers.accept?.includes("application/ld+json")
      ) {
        return activityPubController.getActor(req, res, next);
      }
      return next(); // Pass to next middleware if not ActivityPub request
    }
  );

  // Actor inbox endpoint
  router.post(
    "/users/:username/inbox",
    (req: Request, res: Response, next: NextFunction) => {
      return activityPubController.receiveActivity(req, res, next);
    }
  );

  // Actor outbox endpoint
  router.get(
    "/users/:username/outbox",
    (req: Request, res: Response, next: NextFunction) => {
      return activityPubController.getOutbox(req, res, next);
    }
  );

  return router;
}

export default configureActivityPubRoutes;
