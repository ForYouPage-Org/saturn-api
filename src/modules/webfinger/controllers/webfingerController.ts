import type { Request, Response, NextFunction } from "express";
import type { ActorService } from "@/modules/actors/services/actorService";
import type { WebfingerService } from "../services/webfinger.service";
import type { ServiceContainer } from "../../../utils/container";

import { AppError, ErrorType } from "../../../utils/errors";
// Extend Request type locally for this controller
interface RequestWithServices extends Request {
  services: ServiceContainer; // Changed to required property to match expected type
}

export class WebFingerController {
  private actorService: ActorService;
  private webfingerService: WebfingerService;
  private domain: string;

  constructor(
    actorService: ActorService,
    webfingerService: WebfingerService,
    domain: string
  ) {
    this.actorService = actorService;
    this.webfingerService = webfingerService;
    this.domain = domain;
  }

  /**
   * Get WebFinger resource for actor discovery
   */
  async getResource(
    req: RequestWithServices,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const resource = req.query.resource as string;

      if (!resource) {
        return res
          .status(400)
          .json({ error: "Resource query parameter is required" });
      }

      // Parse the resource URI (acct:username@domain)
      const match = /^acct:([^@]+)@(.+)$/.exec(resource);

      if (!match) {
        return next(
          new AppError("Invalid resource format", 400, ErrorType.VALIDATION)
        );
      }

      const [, username, resourceDomain] = match;
      const serverDomain = this.domain;

      // Verify this is for our domain
      if (resourceDomain !== serverDomain) {
        return next(
          new AppError("Resource not found", 404, ErrorType.NOT_FOUND)
        );
      }

      // Look up the actor
      const actor = await this.actorService.getActorByUsername(username);

      if (!actor) {
        return next(new AppError("User not found", 404, ErrorType.NOT_FOUND));
      }

      // Return WebFinger response
      return res.json({
        subject: `acct:${username}@${this.domain}`,
        links: [
          {
            rel: "self",
            type: "application/activity+json",
            href: `https://${this.domain}/users/${username}`,
          },
        ],
      });
    } catch (error) {
      console.error("WebFinger error:", error);
      return next(new AppError("Server error", 500, ErrorType.SERVER_ERROR));
    }
  }
}
