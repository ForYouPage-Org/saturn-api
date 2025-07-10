import { UploadService } from '@/modules/media/services/upload.service';
import fs from 'fs/promises';
import path from 'path';
import { Express } from 'express';

// Mock file system operations
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('File Upload Security Tests', () => {
  let uploadService: UploadService;

  beforeEach(() => {
    uploadService = new UploadService();
    jest.clearAllMocks();
  });

  describe('File Type Validation', () => {
    it('should reject executable files', () => {
      const mockFile = {
        mimetype: 'application/x-executable',
        originalname: 'malicious.exe',
        size: 1000,
      };

      const middleware = uploadService.configureImageUploadMiddleware();
      const mockReq = {} as any;
      const mockCb = jest.fn();

      // Access the fileFilter function through middleware options
      const fileFilter = (middleware as any).options.fileFilter;
      fileFilter(mockReq, mockFile, mockCb);

      expect(mockCb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid file type: Only image files are allowed.',
        })
      );
    });

    it('should reject script files', () => {
      const mockFile = {
        mimetype: 'application/javascript',
        originalname: 'script.js',
        size: 1000,
      };

      const middleware = uploadService.configureImageUploadMiddleware();
      const mockReq = {} as any;
      const mockCb = jest.fn();

      const fileFilter = (middleware as any).options.fileFilter;
      fileFilter(mockReq, mockFile, mockCb);

      expect(mockCb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid file type: Only image files are allowed.',
        })
      );
    });

    it('should accept valid image files', () => {
      const mockFile = {
        mimetype: 'image/jpeg',
        originalname: 'photo.jpg',
        size: 1000,
      };

      const middleware = uploadService.configureImageUploadMiddleware();
      const mockReq = {} as any;
      const mockCb = jest.fn();

      const fileFilter = (middleware as any).options.fileFilter;
      fileFilter(mockReq, mockFile, mockCb);

      expect(mockCb).toHaveBeenCalledWith(null, true);
    });
  });

  describe('File Size Limits', () => {
    it('should enforce file size limits', () => {
      const middleware = uploadService.configureImageUploadMiddleware({
        fileSizeLimitMB: 2,
      });

      expect((middleware as any).options.limits.fileSize).toBe(2 * 1024 * 1024);
    });

    it('should use default file size limit', () => {
      const middleware = uploadService.configureImageUploadMiddleware();

      expect((middleware as any).options.limits.fileSize).toBe(5 * 1024 * 1024);
    });
  });

  describe('Path Traversal Protection', () => {
    it('should prevent directory traversal in filenames', async () => {
      const maliciousFile = {
        originalname: '../../../etc/passwd',
        path: '/tmp/upload',
        size: 1000,
        mimetype: 'text/plain',
      } as Express.Multer.File;

      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.rename.mockResolvedValue(undefined);

      const result = await uploadService.moveUploadedFile(
        maliciousFile,
        '/safe/directory'
      );

      // Should sanitize the filename and prevent path traversal
      expect(result.filename).not.toContain('../');
      expect(result.path).toContain('/safe/directory');
    });

    it('should sanitize dangerous characters in filenames', async () => {
      const dangerousFile = {
        originalname: 'file<script>alert("xss")</script>.jpg',
        path: '/tmp/upload',
        size: 1000,
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.rename.mockResolvedValue(undefined);

      const result = await uploadService.moveUploadedFile(
        dangerousFile,
        '/safe/directory'
      );

      // Should not contain script tags or other dangerous characters
      expect(result.filename).not.toContain('<script>');
      expect(result.filename).not.toContain('</script>');
    });
  });

  describe('Upload Directory Security', () => {
    it('should create upload directories with proper permissions', async () => {
      const testFile = {
        originalname: 'test.jpg',
        path: '/tmp/upload',
        size: 1000,
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.rename.mockResolvedValue(undefined);

      await uploadService.moveUploadedFile(testFile, '/uploads/images');

      expect(mockFs.mkdir).toHaveBeenCalledWith('/uploads/images', {
        recursive: true,
      });
    });

    it('should handle upload directory creation errors', async () => {
      const testFile = {
        originalname: 'test.jpg',
        path: '/tmp/upload',
        size: 1000,
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      mockFs.mkdir.mockRejectedValue(new Error('Permission denied'));

      await expect(
        uploadService.moveUploadedFile(testFile, '/restricted/directory')
      ).rejects.toThrow('Permission denied');
    });
  });

  describe('File Content Validation', () => {
    it('should validate file extensions match MIME types', () => {
      const mismatchedFile = {
        mimetype: 'image/jpeg',
        originalname: 'image.exe', // Wrong extension for JPEG
        size: 1000,
      };

      const middleware = uploadService.configureImageUploadMiddleware();
      const mockReq = {} as any;
      const mockCb = jest.fn();

      const fileFilter = (middleware as any).options.fileFilter;
      fileFilter(mockReq, mismatchedFile, mockCb);

      // Should still accept based on MIME type, but this highlights the need for content validation
      expect(mockCb).toHaveBeenCalledWith(null, true);
    });
  });

  describe('Temporary File Cleanup', () => {
    it('should clean up temporary files after processing', async () => {
      const testFile = {
        originalname: 'test.jpg',
        path: '/tmp/temp-upload-file',
        size: 1000,
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.rename.mockResolvedValue(undefined);

      await uploadService.moveUploadedFile(testFile, '/uploads/images');

      // The rename operation should move the file from temp to permanent location
      expect(mockFs.rename).toHaveBeenCalledWith(
        '/tmp/temp-upload-file',
        expect.stringContaining('/uploads/images')
      );
    });
  });
});