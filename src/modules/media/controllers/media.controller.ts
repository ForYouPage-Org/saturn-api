// Media controller implementation
import type { Request, Response, NextFunction } from "express";
import type { MediaService } from "../services/media.service";
import { UploadService } from "../services/upload.service";
import path from "path";
import config from "../../../config";
import { ObjectId } from "mongodb";
import { AppError, ErrorType } from "../../../utils/errors";

export class MediaController {
  private service: MediaService;
  private uploadService: UploadService;

  constructor(service: MediaService) {
    this.service = service;
    this.uploadService = new UploadService();
  }

  // Handler for uploading media
  async uploadMedia(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Configure multer middleware for media uploads
      const upload = this.uploadService.configureMediaUploadMiddleware({
        fileSizeLimitMB: 10,
        uploadDir: config.uploads.tempDir,
        allowedTypes: ["image/", "video/", "audio/"],
      });

      // Use multer to handle the file upload
      upload.single("file")(req as any, res as any, async (err) => {
        if (err) {
          return next(new AppError(err.message, 400, ErrorType.VALIDATION));
        }

        if (!req.file) {
          return next(
            new AppError("No file provided", 400, ErrorType.VALIDATION)
          );
        }

        if (!req.user?.id) {
          return next(
            new AppError("User not authenticated", 401, ErrorType.UNAUTHORIZED)
          );
        }

        try {
          // Move file to permanent location
          const fileInfo = await this.uploadService.moveUploadedFile(
            req.file,
            config.uploads.mediaDir
          );

          // Save media record to database
          const mediaId = new ObjectId().toString();
          const media = await this.service.createMedia({
            id: mediaId,
            filename: fileInfo.filename,
            originalFilename: fileInfo.originalName,
            mimeType: fileInfo.mimetype,
            size: fileInfo.size,
            path: fileInfo.path,
            userId: req.user.id,
            uploadedAt: new Date(),
          });

          // Return media info
          res.status(201).json({
            id: media.id,
            url: `/api/media/${media.id}`,
            type: media.mimeType,
            size: media.size,
          });
        } catch (error) {
          console.error("Error saving media:", error);
          return next(
            new AppError("Failed to save media", 500, ErrorType.SERVER_ERROR)
          );
        }
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error uploading media:", error.message, {
          stack: error.stack,
        });
      } else {
        console.error("Unknown error uploading media:", error);
      }
      return next(
        new AppError("Failed to upload media", 500, ErrorType.SERVER_ERROR)
      );
    }
  }

  // Handler for retrieving media
  async getMedia(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const media = await this.service.getMediaById(id);

      if (!media) {
        return next(new AppError("Media not found", 404, ErrorType.NOT_FOUND));
      }

      res.json({
        id: media.id,
        url: `/api/media/${media.id}`,
        type: media.mimeType,
        size: media.size,
        createdAt: media.uploadedAt,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error retrieving media:", error.message, {
          stack: error.stack,
        });
      } else {
        console.error("Unknown error retrieving media:", error);
      }
      return next(
        new AppError("Failed to retrieve media", 500, ErrorType.SERVER_ERROR)
      );
    }
  }

  // Handler for deleting media
  async deleteMedia(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      if (!req.user?.id) {
        return next(
          new AppError("User not authenticated", 401, ErrorType.UNAUTHORIZED)
        );
      }

      const media = await this.service.getMediaById(id);
      if (!media) {
        return next(new AppError("Media not found", 404, ErrorType.NOT_FOUND));
      }

      // Check if user owns the media
      if (media.userId !== req.user.id) {
        return next(
          new AppError(
            "Not authorized to delete this media",
            403,
            ErrorType.FORBIDDEN
          )
        );
      }

      await this.service.deleteMedia(id);
      res.status(204).send();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error deleting media:", error.message, {
          stack: error.stack,
        });
      } else {
        console.error("Unknown error deleting media:", error);
      }
      return next(
        new AppError("Failed to delete media", 500, ErrorType.SERVER_ERROR)
      );
    }
  }
}
