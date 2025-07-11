import { MediaService } from '../../../../src/modules/media/services/media.service';
import type { MediaRepository } from '../../../../src/modules/media/repositories/media.repository';
import fs from 'fs/promises';
import { jest } from '@jest/globals';

// Mock fs/promises
jest.mock('fs/promises');

const mockFs = fs as jest.Mocked<typeof fs>;

describe('MediaService', () => {
  let mockRepository: jest.Mocked<MediaRepository>;
  let mediaService: MediaService;
  const uploadPath = '/app/uploads';

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      deleteById: jest.fn(),
      findByUserId: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
    } as any;

    mediaService = new MediaService(mockRepository, uploadPath);

    jest.clearAllMocks();
  });

  describe('createMedia', () => {
    it('should create media successfully', async () => {
      const mediaData = {
        id: 'media123',
        filename: 'test-image.jpg',
        originalFilename: 'original-image.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        path: '/app/uploads/test-image.jpg',
        userId: 'user123',
        uploadedAt: new Date(),
      };

      const mockCreatedMedia = {
        _id: 'media123',
        ...mediaData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockResolvedValue(mockCreatedMedia);

      const result = await mediaService.createMedia(mediaData);

      expect(mockRepository.create).toHaveBeenCalledWith(mediaData);
      expect(result).toEqual(mockCreatedMedia);
    });

    it('should handle creation errors', async () => {
      const mediaData = {
        id: 'media123',
        filename: 'test-image.jpg',
        originalFilename: 'original-image.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        path: '/app/uploads/test-image.jpg',
        userId: 'user123',
        uploadedAt: new Date(),
      };

      mockRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(mediaService.createMedia(mediaData)).rejects.toThrow('Database error');
    });

    it('should handle different media types', async () => {
      const videoData = {
        id: 'media456',
        filename: 'test-video.mp4',
        originalFilename: 'original-video.mp4',
        mimeType: 'video/mp4',
        size: 5120,
        path: '/app/uploads/test-video.mp4',
        userId: 'user456',
        uploadedAt: new Date(),
      };

      const mockCreatedMedia = {
        _id: 'media456',
        ...videoData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockResolvedValue(mockCreatedMedia);

      const result = await mediaService.createMedia(videoData);

      expect(mockRepository.create).toHaveBeenCalledWith(videoData);
      expect(result).toEqual(mockCreatedMedia);
    });
  });

  describe('getMediaById', () => {
    it('should retrieve media by ID', async () => {
      const mockMedia = {
        _id: 'media123',
        id: 'media123',
        filename: 'test-image.jpg',
        originalFilename: 'original-image.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        path: '/app/uploads/test-image.jpg',
        userId: 'user123',
        uploadedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findById.mockResolvedValue(mockMedia);

      const result = await mediaService.getMediaById('media123');

      expect(mockRepository.findById).toHaveBeenCalledWith('media123');
      expect(result).toEqual(mockMedia);
    });

    it('should return null for non-existent media', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await mediaService.getMediaById('nonexistent');

      expect(mockRepository.findById).toHaveBeenCalledWith('nonexistent');
      expect(result).toBeNull();
    });

    it('should handle repository errors', async () => {
      mockRepository.findById.mockRejectedValue(new Error('Database error'));

      await expect(mediaService.getMediaById('media123')).rejects.toThrow('Database error');
    });
  });

  describe('deleteMedia', () => {
    it('should delete media and physical file successfully', async () => {
      const mockMedia = {
        _id: 'media123',
        id: 'media123',
        filename: 'test-image.jpg',
        originalFilename: 'original-image.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        path: '/app/uploads/test-image.jpg',
        userId: 'user123',
        uploadedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findById.mockResolvedValue(mockMedia);
      mockRepository.deleteById.mockResolvedValue(undefined);
      mockFs.unlink.mockResolvedValue(undefined);

      await mediaService.deleteMedia('media123');

      expect(mockRepository.findById).toHaveBeenCalledWith('media123');
      expect(mockFs.unlink).toHaveBeenCalledWith('/app/uploads/test-image.jpg');
      expect(mockRepository.deleteById).toHaveBeenCalledWith('media123');
    });

    it('should handle media not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await mediaService.deleteMedia('nonexistent');

      expect(mockRepository.findById).toHaveBeenCalledWith('nonexistent');
      expect(mockFs.unlink).not.toHaveBeenCalled();
      expect(mockRepository.deleteById).not.toHaveBeenCalled();
    });

    it('should handle file deletion errors gracefully', async () => {
      const mockMedia = {
        _id: 'media123',
        id: 'media123',
        filename: 'test-image.jpg',
        originalFilename: 'original-image.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        path: '/app/uploads/test-image.jpg',
        userId: 'user123',
        uploadedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findById.mockResolvedValue(mockMedia);
      mockRepository.deleteById.mockResolvedValue(undefined);
      mockFs.unlink.mockRejectedValue(new Error('File not found'));

      // Mock console.warn to suppress warning output
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      await mediaService.deleteMedia('media123');

      expect(mockRepository.findById).toHaveBeenCalledWith('media123');
      expect(mockFs.unlink).toHaveBeenCalledWith('/app/uploads/test-image.jpg');
      expect(mockRepository.deleteById).toHaveBeenCalledWith('media123');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to delete physical file:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle database deletion errors', async () => {
      const mockMedia = {
        _id: 'media123',
        id: 'media123',
        filename: 'test-image.jpg',
        originalFilename: 'original-image.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        path: '/app/uploads/test-image.jpg',
        userId: 'user123',
        uploadedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findById.mockResolvedValue(mockMedia);
      mockRepository.deleteById.mockRejectedValue(new Error('Database error'));
      mockFs.unlink.mockResolvedValue(undefined);

      await expect(mediaService.deleteMedia('media123')).rejects.toThrow('Database error');
    });

    it('should handle missing file path gracefully', async () => {
      const mockMedia = {
        _id: 'media123',
        id: 'media123',
        filename: 'test-image.jpg',
        originalFilename: 'original-image.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        path: '', // Empty path
        userId: 'user123',
        uploadedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findById.mockResolvedValue(mockMedia);
      mockRepository.deleteById.mockResolvedValue(undefined);
      mockFs.unlink.mockResolvedValue(undefined);

      await mediaService.deleteMedia('media123');

      expect(mockFs.unlink).toHaveBeenCalledWith('');
      expect(mockRepository.deleteById).toHaveBeenCalledWith('media123');
    });
  });

  describe('getMediaByUserId', () => {
    it('should get media for user with default pagination', async () => {
      const mockMediaList = [
        {
          _id: 'media1',
          id: 'media1',
          filename: 'image1.jpg',
          originalFilename: 'original1.jpg',
          mimeType: 'image/jpeg',
          size: 1024,
          path: '/app/uploads/image1.jpg',
          userId: 'user123',
          uploadedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: 'media2',
          id: 'media2',
          filename: 'image2.jpg',
          originalFilename: 'original2.jpg',
          mimeType: 'image/jpeg',
          size: 2048,
          path: '/app/uploads/image2.jpg',
          userId: 'user123',
          uploadedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRepository.findByUserId.mockResolvedValue(mockMediaList);

      const result = await mediaService.getMediaByUserId('user123');

      expect(mockRepository.findByUserId).toHaveBeenCalledWith('user123', 1, 20);
      expect(result).toEqual(mockMediaList);
    });

    it('should get media for user with custom pagination', async () => {
      const mockMediaList = [
        {
          _id: 'media1',
          id: 'media1',
          filename: 'image1.jpg',
          originalFilename: 'original1.jpg',
          mimeType: 'image/jpeg',
          size: 1024,
          path: '/app/uploads/image1.jpg',
          userId: 'user123',
          uploadedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRepository.findByUserId.mockResolvedValue(mockMediaList);

      const result = await mediaService.getMediaByUserId('user123', 2, 10);

      expect(mockRepository.findByUserId).toHaveBeenCalledWith('user123', 2, 10);
      expect(result).toEqual(mockMediaList);
    });

    it('should return empty array for user with no media', async () => {
      mockRepository.findByUserId.mockResolvedValue([]);

      const result = await mediaService.getMediaByUserId('user123');

      expect(mockRepository.findByUserId).toHaveBeenCalledWith('user123', 1, 20);
      expect(result).toEqual([]);
    });

    it('should handle repository errors', async () => {
      mockRepository.findByUserId.mockRejectedValue(new Error('Database error'));

      await expect(mediaService.getMediaByUserId('user123')).rejects.toThrow('Database error');
    });

    it('should handle invalid pagination parameters', async () => {
      const mockMediaList = [];

      mockRepository.findByUserId.mockResolvedValue(mockMediaList);

      const result = await mediaService.getMediaByUserId('user123', 0, -1);

      expect(mockRepository.findByUserId).toHaveBeenCalledWith('user123', 0, -1);
      expect(result).toEqual(mockMediaList);
    });

    it('should handle very large pagination values', async () => {
      const mockMediaList = [];

      mockRepository.findByUserId.mockResolvedValue(mockMediaList);

      const result = await mediaService.getMediaByUserId('user123', 999, 1000);

      expect(mockRepository.findByUserId).toHaveBeenCalledWith('user123', 999, 1000);
      expect(result).toEqual(mockMediaList);
    });
  });

  describe('Service Configuration', () => {
    it('should initialize with correct upload path', () => {
      const customPath = '/custom/upload/path';
      const customService = new MediaService(mockRepository, customPath);

      expect(customService).toBeDefined();
      expect(customService['uploadPath']).toBe(customPath);
    });

    it('should initialize with repository', () => {
      expect(mediaService['repository']).toBe(mockRepository);
    });

    it('should handle empty upload path', () => {
      const serviceWithEmptyPath = new MediaService(mockRepository, '');

      expect(serviceWithEmptyPath).toBeDefined();
      expect(serviceWithEmptyPath['uploadPath']).toBe('');
    });
  });

  describe('Error Handling', () => {
    it('should handle repository connection errors', async () => {
      mockRepository.findById.mockRejectedValue(new Error('Connection refused'));

      await expect(mediaService.getMediaById('media123')).rejects.toThrow('Connection refused');
    });

    it('should handle filesystem permission errors', async () => {
      const mockMedia = {
        _id: 'media123',
        id: 'media123',
        filename: 'test-image.jpg',
        originalFilename: 'original-image.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        path: '/app/uploads/test-image.jpg',
        userId: 'user123',
        uploadedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findById.mockResolvedValue(mockMedia);
      mockRepository.deleteById.mockResolvedValue(undefined);
      mockFs.unlink.mockRejectedValue(new Error('EACCES: permission denied'));

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      await mediaService.deleteMedia('media123');

      expect(consoleSpy).toHaveBeenCalledWith('Failed to delete physical file:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle invalid media data', async () => {
      const invalidMediaData = {
        id: '',
        filename: '',
        originalFilename: '',
        mimeType: '',
        size: -1,
        path: '',
        userId: '',
        uploadedAt: new Date(),
      };

      mockRepository.create.mockRejectedValue(new Error('Invalid media data'));

      await expect(mediaService.createMedia(invalidMediaData)).rejects.toThrow('Invalid media data');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete media lifecycle', async () => {
      const mediaData = {
        id: 'media123',
        filename: 'test-image.jpg',
        originalFilename: 'original-image.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        path: '/app/uploads/test-image.jpg',
        userId: 'user123',
        uploadedAt: new Date(),
      };

      const mockCreatedMedia = {
        _id: 'media123',
        ...mediaData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Create
      mockRepository.create.mockResolvedValue(mockCreatedMedia);
      const created = await mediaService.createMedia(mediaData);
      expect(created).toBeDefined();

      // Get
      mockRepository.findById.mockResolvedValue(mockCreatedMedia);
      const retrieved = await mediaService.getMediaById('media123');
      expect(retrieved).toEqual(mockCreatedMedia);

      // Delete
      mockRepository.deleteById.mockResolvedValue(undefined);
      mockFs.unlink.mockResolvedValue(undefined);
      await mediaService.deleteMedia('media123');

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.findById).toHaveBeenCalled();
      expect(mockFs.unlink).toHaveBeenCalled();
      expect(mockRepository.deleteById).toHaveBeenCalled();
    });

    it('should handle bulk operations for user media', async () => {
      const userId = 'user123';
      const mockMediaList = Array.from({ length: 5 }, (_, i) => ({
        _id: `media${i}`,
        id: `media${i}`,
        filename: `image${i}.jpg`,
        originalFilename: `original${i}.jpg`,
        mimeType: 'image/jpeg',
        size: 1024 * (i + 1),
        path: `/app/uploads/image${i}.jpg`,
        userId,
        uploadedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      mockRepository.findByUserId.mockResolvedValue(mockMediaList);

      const result = await mediaService.getMediaByUserId(userId);

      expect(result).toHaveLength(5);
      expect(result.every(media => media.userId === userId)).toBe(true);
    });
  });
});