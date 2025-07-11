import { MediaController } from '../../../../src/modules/media/controllers/media.controller';
import type { MediaService } from '../../../../src/modules/media/services/media.service';
import type { Request, Response } from 'express';
import { jest } from '@jest/globals';

describe('MediaController', () => {
  let mockMediaService: jest.Mocked<MediaService>;
  let mediaController: MediaController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockMediaService = {
      uploadFile: jest.fn(),
      getFileById: jest.fn(),
      deleteFile: jest.fn(),
      getUserFiles: jest.fn(),
      validateFile: jest.fn(),
    } as any;

    mediaController = new MediaController(mockMediaService);

    mockRequest = {
      params: {},
      body: {},
      user: {
        id: 'user123',
        username: 'testuser',
      },
      file: undefined,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  describe('uploadFile', () => {
    it('should upload a file successfully', async () => {
      const mockFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const mockUploadResult = {
        id: 'file123',
        filename: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        url: 'https://example.com/files/file123',
        uploadedBy: 'user123',
        createdAt: new Date(),
      };

      mockRequest.file = mockFile;
      mockMediaService.uploadFile.mockResolvedValue(mockUploadResult);

      await mediaController.uploadFile(mockRequest as Request, mockResponse as Response);

      expect(mockMediaService.uploadFile).toHaveBeenCalledWith(mockFile, 'user123');
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUploadResult,
      });
    });

    it('should handle missing file', async () => {
      mockRequest.file = undefined;

      await mediaController.uploadFile(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'No file provided',
      });
    });

    it('should handle upload errors', async () => {
      const mockFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      mockRequest.file = mockFile;
      mockMediaService.uploadFile.mockRejectedValue(new Error('Upload failed'));

      await expect(
        mediaController.uploadFile(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow('Upload failed');
    });
  });

  describe('getFileById', () => {
    it('should get a file by id', async () => {
      const mockFile = {
        id: 'file123',
        filename: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        data: Buffer.from('test'),
        uploadedBy: 'user123',
        createdAt: new Date(),
      };

      mockRequest.params = { fileId: 'file123' };
      mockMediaService.getFileById.mockResolvedValue(mockFile);

      await mediaController.getFileById(mockRequest as Request, mockResponse as Response);

      expect(mockMediaService.getFileById).toHaveBeenCalledWith('file123');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'image/jpeg');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Length', 1024);
      expect(mockResponse.send).toHaveBeenCalledWith(mockFile.data);
    });

    it('should handle file not found', async () => {
      mockRequest.params = { fileId: 'nonexistent' };
      mockMediaService.getFileById.mockResolvedValue(null);

      await mediaController.getFileById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'File not found',
      });
    });

    it('should handle missing fileId parameter', async () => {
      mockRequest.params = {};

      await mediaController.getFileById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'File ID is required',
      });
    });
  });

  describe('deleteFile', () => {
    it('should delete a file', async () => {
      mockRequest.params = { fileId: 'file123' };
      mockMediaService.deleteFile.mockResolvedValue(true);

      await mediaController.deleteFile(mockRequest as Request, mockResponse as Response);

      expect(mockMediaService.deleteFile).toHaveBeenCalledWith('file123', 'user123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'File deleted successfully',
      });
    });

    it('should handle file not found for deletion', async () => {
      mockRequest.params = { fileId: 'nonexistent' };
      mockMediaService.deleteFile.mockResolvedValue(false);

      await mediaController.deleteFile(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'File not found or unauthorized',
      });
    });

    it('should handle missing fileId parameter', async () => {
      mockRequest.params = {};

      await mediaController.deleteFile(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'File ID is required',
      });
    });
  });

  describe('getUserFiles', () => {
    it('should get user files', async () => {
      const mockFiles = [
        {
          id: 'file1',
          filename: 'file1.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
          url: 'https://example.com/files/file1',
          uploadedBy: 'user123',
          createdAt: new Date(),
        },
        {
          id: 'file2',
          filename: 'file2.png',
          mimetype: 'image/png',
          size: 2048,
          url: 'https://example.com/files/file2',
          uploadedBy: 'user123',
          createdAt: new Date(),
        },
      ];

      mockMediaService.getUserFiles.mockResolvedValue(mockFiles);

      await mediaController.getUserFiles(mockRequest as Request, mockResponse as Response);

      expect(mockMediaService.getUserFiles).toHaveBeenCalledWith('user123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockFiles,
      });
    });

    it('should handle empty file list', async () => {
      mockMediaService.getUserFiles.mockResolvedValue([]);

      await mediaController.getUserFiles(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: [],
      });
    });
  });

  describe('validateFile', () => {
    it('should validate a file', async () => {
      const mockFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      mockRequest.file = mockFile;
      mockMediaService.validateFile.mockResolvedValue(true);

      await mediaController.validateFile(mockRequest as Request, mockResponse as Response);

      expect(mockMediaService.validateFile).toHaveBeenCalledWith(mockFile);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'File is valid',
      });
    });

    it('should handle invalid file', async () => {
      const mockFile = {
        originalname: 'test.exe',
        mimetype: 'application/octet-stream',
        size: 1024,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      mockRequest.file = mockFile;
      mockMediaService.validateFile.mockResolvedValue(false);

      await mediaController.validateFile(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid file type or size',
      });
    });

    it('should handle missing file for validation', async () => {
      mockRequest.file = undefined;

      await mediaController.validateFile(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'No file provided',
      });
    });
  });
});