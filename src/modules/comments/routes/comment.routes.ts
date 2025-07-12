import { Router } from "express";
import type { ServiceContainer } from "../../../utils/container";
import { CommentsController as _CommentsController } from "../controllers/comments.controller";
import { authenticate } from "../../../middleware/auth";
import type { Request, Response, NextFunction } from "express";
import { wrapAsync } from "../../../utils/routeHandler";
import {
  validateRequestParams,
  validateRequestQuery,
} from "../../../middleware/validateRequest";
import {
  commentIdParamSchema,
  postIdParamSchema,
  routeCommentsQuerySchema,
} from "../schemas/comments.schemas";

/**
 * Configure comment routes with the controller
 */
export default function configureCommentRoutes(
  container: ServiceContainer
): Router {
  const router = Router();
  const commentsController = container.commentsController;

  // Get comments for a specific post
  router.get(
    "/:postId",
    wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
      return commentsController.getComments(req, res, next);
    })
  );

  // Protected routes
  router.post(
    "/",
    authenticate(container.authService),
    wrapAsync((req: Request, res: Response, next: NextFunction) =>
      commentsController.createComment(req, res, next)
    )
  );

  // Delete a comment
  router.delete(
    "/:commentId",
    authenticate(container.authService),
    validateRequestParams(commentIdParamSchema),
    wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
      return commentsController.deleteComment(req, res, next);
    })
  );

  return router;
}
