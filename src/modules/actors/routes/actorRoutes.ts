import type { Request, Response, Router, NextFunction } from "express";
import express from "express";
import { ActorsController } from "../controllers/actorsController";
import { authenticate } from "../../../middleware/auth";
import type { ServiceContainer } from "../../../utils/container";
import { wrapAsync } from "../../../utils/routeHandler";
import {
  validateRequestParams,
  validateRequestQuery,
} from "../../../middleware/validateRequest";
import {
  usernameParamSchema,
  followListQuerySchema,
} from "../schemas/follow.schemas";

/**
 * Configure actor routes with the controller
 */
export default function configureActorRoutes(
  serviceContainer: ServiceContainer
): Router {
  const router = express.Router();
  const { actorService, uploadService, postService, authService } =
    serviceContainer;

  if (!authService) {
    throw new Error(
      "AuthService not found in service container during actor route setup"
    );
  }

  const domain = process.env.DOMAIN || "localhost:4000";

  // Create controller with injected dependencies
  const actorsController = new ActorsController(
    actorService,
    uploadService,
    postService,
    domain
  );

  // Configure image upload middleware with UploadService
  // Temporarily commented out to debug setup
  // const imageUpload = uploadService.configureImageUploadMiddleware({
  //   fileSizeLimitMB: 5, // 5MB limit
  // });

  // Search actors
  router.get(
    "/search",
    (req: Request, res: Response, next: NextFunction): void => {
      void actorsController.searchActors(req, res).catch(next);
    }
  );

  // Create new actor
  router.post("/", (req: Request, res: Response, next: NextFunction): void => {
    void actorsController.createActor(req, res, next);
  });

  // Get actor posts
  router.get(
    "/:username/posts",
    (req: Request, res: Response, next: NextFunction): void => {
      void actorsController.getActorPosts(req, res, next);
    }
  );

  // Get actor by username
  router.get(
    "/:username",
    wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
      return actorsController.getActorByUsername(req, res, next);
    })
  );

  // Update actor by username
  router.put(
    "/username/:username",
    authenticate(authService),
    wrapAsync(actorsController.updateActorByUsername.bind(actorsController))
  );

  // Update actor
  router.put(
    "/:id",
    authenticate(authService),
    wrapAsync(actorsController.updateActor.bind(actorsController))
  );

  // Delete actor
  router.delete(
    "/:id",
    authenticate(authService),
    wrapAsync(actorsController.deleteActor.bind(actorsController))
  );

  // Follow user
  router.post(
    "/:username/follow",
    authenticate(authService),
    validateRequestParams(usernameParamSchema),
    wrapAsync(actorsController.followUser.bind(actorsController))
  );

  // Unfollow user
  router.delete(
    "/:username/follow",
    authenticate(authService),
    validateRequestParams(usernameParamSchema),
    wrapAsync(actorsController.unfollowUser.bind(actorsController))
  );

  // Get followers list
  router.get(
    "/:username/followers",
    validateRequestParams(usernameParamSchema),
    validateRequestQuery(followListQuerySchema),
    wrapAsync(actorsController.getFollowersList.bind(actorsController))
  );

  // Get following list
  router.get(
    "/:username/following",
    validateRequestParams(usernameParamSchema),
    validateRequestQuery(followListQuerySchema),
    wrapAsync(actorsController.getFollowingList.bind(actorsController))
  );

  return router;
}
