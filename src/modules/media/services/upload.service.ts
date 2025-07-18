import multer from 'multer';
import path from 'path';
import fs from 'fs/promises'; // Use async promises version
import { moveUploadedFile } from '../../../utils/fileUpload';

// Define File interface locally to remove dependency
interface File {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
}

export class UploadService {
  /**
   * Configures multer storage with dynamic destination
   * @param uploadDir Optional custom upload directory path
   * @returns Configured multer storage
   */
  private configureStorage(uploadDir?: string): multer.StorageEngine {
    const defaultDir = path.join(process.cwd(), 'uploads');
    const destination = uploadDir || defaultDir;

    return multer.diskStorage({
      destination: (req, file, cb) => {
        // Instead of awaiting the promise directly, which causes the linting error,
        // we'll handle it with a .then() chain to keep the callback synchronous
        void fs
          .mkdir(destination, { recursive: true })
          .then(() => {
            cb(null, destination);
          })
          .catch(err => {
            cb(err instanceof Error ? err : new Error(String(err)), '');
          });
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
      },
    });
  }

  /**
   * Creates a multer middleware configured for image uploads
   * @param options Configuration options
   * @returns Configured multer middleware
   */
  public configureImageUploadMiddleware(options?: {
    fileSizeLimitMB?: number;
    uploadDir?: string;
  }): multer.Multer {
    const fileSizeLimit = (options?.fileSizeLimitMB || 5) * 1024 * 1024; // Default 5MB

    return multer({
      storage: this.configureStorage(options?.uploadDir),
      limits: { fileSize: fileSizeLimit },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true); // Accept file
        } else {
          cb(new Error('Invalid file type: Only image files are allowed.')); // Reject file
        }
      },
    });
  }

  /**
   * Creates a multer middleware configured for media uploads (images, videos, audio)
   * @param options Configuration options
   * @returns Configured multer middleware
   */
  public configureMediaUploadMiddleware(options?: {
    fileSizeLimitMB?: number;
    uploadDir?: string;
    allowedTypes?: string[];
  }): multer.Multer {
    const fileSizeLimit = (options?.fileSizeLimitMB || 10) * 1024 * 1024; // Default 10MB
    const allowedTypes = options?.allowedTypes || [
      'image/',
      'video/',
      'audio/',
    ];

    return multer({
      storage: this.configureStorage(options?.uploadDir),
      limits: { fileSize: fileSizeLimit },
      fileFilter: (req, file, cb) => {
        const isAllowed = allowedTypes.some(type =>
          file.mimetype.startsWith(type)
        );

        if (isAllowed) {
          cb(null, true); // Accept file
        } else {
          cb(
            new Error(
              `Invalid file type: Only ${allowedTypes.join(', ').replace(/\//g, '')} files are allowed.`
            )
          ); // Reject file
        }
      },
    });
  }

  /**
   * Moves an uploaded file from temporary storage to a permanent location
   * @param file The uploaded file from multer
   * @param targetDir Target directory path
   * @param customFilename Optional custom filename
   * @returns Object containing the new file path and URL information
   */
  public async moveUploadedFile(
    file: Express.Multer.File,
    targetDir: string,
    customFilename?: string
  ): Promise<{
    path: string;
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
  }> {
    // Create target directory if it doesn't exist
    await fs.mkdir(targetDir, { recursive: true });

    // Generate filename if not provided
    const fileName =
      customFilename ||
      `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;

    const finalPath = path.join(targetDir, fileName);

    // Move file using async fs.rename
    await fs.rename(file.path, finalPath);

    return {
      path: finalPath,
      filename: fileName,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };
  }

  /**
   * Alternative moveUploadedFile method that uses a subdirectory approach
   * @param file The uploaded file from multer
   * @param subDirectory Optional subdirectory within uploads
   * @returns File information
   */
  async moveUploadedFileToSubdir(
    file: Express.Multer.File,
    subDirectory?: string
  ): Promise<File> {
    const destinationDir = path.join(
      process.cwd(),
      'uploads',
      subDirectory || 'media'
    );

    // Move file from temp to permanent location
    const filePath = moveUploadedFile(file.path, destinationDir, file.filename);

    // Get the relative path from cwd
    const relativePath = path.relative(process.cwd(), filePath);

    return {
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: relativePath,
    };
  }
}
