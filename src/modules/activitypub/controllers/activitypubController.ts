import type { Request, Response, NextFunction } from "express";
import type { ActorService } from "../../actors/services/actorService";
import type { ActivityPubService } from "../services/activitypub.service";
import { PostService as _PostService } from "@/modules/posts/services/postService";
import { AppError as _AppError, ErrorType as _ErrorType } from "@/utils/errors";
import { Actor as _Actor } from "@/modules/actors/models/actor";
import type { ActivityPubActivity } from "../models/activitypub";

import { AppError, ErrorType } from "../../../utils/errors";
export class ActivityPubController {
  private actorService: ActorService;
  private activityPubService: ActivityPubService;
  private domain: string;

  constructor(
    actorService: ActorService,
    activityPubService: ActivityPubService,
    domain: string
  ) {
    this.actorService = actorService;
    this.activityPubService = activityPubService;
    this.domain = domain;
  }

  /**
   * Get ActivityPub actor profile
   */
  async getActor(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const username = req.params.username;
    // Use getActorByUsername which expects preferredUsername
    const actor = await this.actorService.getActorByUsername(username);

    if (!actor) {
      res.status(404).send("Actor not found");
      return;
    }

    // Format actor for ActivityPub response
    const actorResponse = {
      "@context": [
        "https://www.w3.org/ns/activitystreams",
        "https://w3id.org/security/v1",
      ],
      id: actor.id,
      type: actor.type,
      preferredUsername: actor.preferredUsername,
      name: actor.displayName || actor.name,
      summary: actor.summary,
      inbox: actor.inbox,
      outbox: actor.outbox,
      followers: actor.followers,
      following: `https://${req.hostname}/users/${username}/following`, // Following collection URL
      publicKey: actor.publicKey,
      icon: actor.icon, // Include icon if available
    };

    res.contentType("application/activity+json").json(actorResponse);
  }

  /**
   * Handle incoming activities at actor inbox
   */
  async receiveActivity(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      // Validate that req.body has the required ActivityPubActivity properties
      const activity = req.body as ActivityPubActivity;
      if (!activity.type || !activity.actor) {
        return res
          .status(400)
          .json({ error: "Invalid ActivityPub activity format" });
      }

      // Use ActivityPubService to process the incoming activity
      await this.activityPubService.processIncomingActivity(
        activity,
        req.params.username
      );

      return res.status(202).json({ message: "Activity accepted" });
    } catch (error: unknown) {
      // Type guard for logging
      if (error instanceof Error) {
        console.error("Error processing activity:", error.message, {
          stack: error.stack,
        });
      } else {
        console.error("Unknown error processing activity:", error);
      }
      return next(
        new AppError("Failed to process activity", 500, ErrorType.SERVER_ERROR)
      );
    }
  }

  /**
   * Get actor outbox (collection of actor's activities)
   */
  getOutbox(req: Request, res: Response, next: NextFunction): Response | void {
    try {
      const { username } = req.params;

      // For now, return an empty collection
      // In a full implementation, you would fetch posts and convert to activities
      const outbox = {
        "@context": "https://www.w3.org/ns/activitystreams",
        id: `https://${this.domain}/users/${username}/outbox`,
        type: "OrderedCollection",
        totalItems: 0,
        orderedItems: [],
      };

      return res.json(outbox);
    } catch (error: unknown) {
      // Type guard for logging
      if (error instanceof Error) {
        console.error("Error fetching outbox:", error.message, {
          stack: error.stack,
        });
      } else {
        console.error("Unknown error fetching outbox:", error);
      }
      return next(
        new AppError("Failed to fetch outbox", 500, ErrorType.SERVER_ERROR)
      );
    }
  }
}
