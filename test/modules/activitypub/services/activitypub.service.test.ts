import { ActivityPubService } from '../../../../src/modules/activitypub/services/activitypub.service';
import type { ActivityPubRepository } from '../../../../src/modules/activitypub/repositories/activitypub.repository';
import type { ActivityPubActivity } from '../../../../src/modules/activitypub/models/activitypub';
import { jest } from '@jest/globals';

describe('ActivityPubService', () => {
  let mockRepository: jest.Mocked<ActivityPubRepository>;
  let activityPubService: ActivityPubService;

  beforeEach(() => {
    mockRepository = {
      saveActivity: jest.fn(),
      getActivity: jest.fn(),
      getActivitiesByActor: jest.fn(),
      deleteActivity: jest.fn(),
      findActivitiesByType: jest.fn(),
    } as any;

    activityPubService = new ActivityPubService(mockRepository, 'example.com');
  });

  describe('processIncomingActivity', () => {
    it('should process and save a Follow activity', async () => {
      const followActivity: ActivityPubActivity = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Follow',
        actor: 'https://remote.example/users/follower',
        object: 'https://example.com/users/testuser',
        id: 'https://remote.example/activities/123',
      };

      const targetUsername = 'testuser';
      mockRepository.saveActivity.mockResolvedValue(undefined);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await activityPubService.processIncomingActivity(followActivity, targetUsername);

      expect(consoleSpy).toHaveBeenCalledWith(
        `Processing activity for ${targetUsername}:`,
        followActivity
      );
      expect(mockRepository.saveActivity).toHaveBeenCalledWith(followActivity, targetUsername);

      consoleSpy.mockRestore();
    });

    it('should process and save a Like activity', async () => {
      const likeActivity: ActivityPubActivity = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Like',
        actor: 'https://remote.example/users/liker',
        object: 'https://example.com/posts/123',
        id: 'https://remote.example/activities/456',
      };

      const targetUsername = 'testuser';
      mockRepository.saveActivity.mockResolvedValue(undefined);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await activityPubService.processIncomingActivity(likeActivity, targetUsername);

      expect(consoleSpy).toHaveBeenCalledWith(
        `Processing activity for ${targetUsername}:`,
        likeActivity
      );
      expect(mockRepository.saveActivity).toHaveBeenCalledWith(likeActivity, targetUsername);

      consoleSpy.mockRestore();
    });

    it('should process and save a Create activity', async () => {
      const createActivity: ActivityPubActivity = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Create',
        actor: 'https://remote.example/users/creator',
        object: {
          type: 'Note',
          id: 'https://remote.example/posts/789',
          content: 'Hello world!',
          attributedTo: 'https://remote.example/users/creator',
        },
        id: 'https://remote.example/activities/789',
      };

      const targetUsername = 'testuser';
      mockRepository.saveActivity.mockResolvedValue(undefined);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await activityPubService.processIncomingActivity(createActivity, targetUsername);

      expect(consoleSpy).toHaveBeenCalledWith(
        `Processing activity for ${targetUsername}:`,
        createActivity
      );
      expect(mockRepository.saveActivity).toHaveBeenCalledWith(createActivity, targetUsername);

      consoleSpy.mockRestore();
    });

    it('should process and save an Announce activity', async () => {
      const announceActivity: ActivityPubActivity = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Announce',
        actor: 'https://remote.example/users/announcer',
        object: 'https://example.com/posts/456',
        id: 'https://remote.example/activities/announce-123',
      };

      const targetUsername = 'testuser';
      mockRepository.saveActivity.mockResolvedValue(undefined);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await activityPubService.processIncomingActivity(announceActivity, targetUsername);

      expect(consoleSpy).toHaveBeenCalledWith(
        `Processing activity for ${targetUsername}:`,
        announceActivity
      );
      expect(mockRepository.saveActivity).toHaveBeenCalledWith(announceActivity, targetUsername);

      consoleSpy.mockRestore();
    });

    it('should process and save an Undo activity', async () => {
      const undoActivity: ActivityPubActivity = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Undo',
        actor: 'https://remote.example/users/undoer',
        object: {
          type: 'Follow',
          actor: 'https://remote.example/users/undoer',
          object: 'https://example.com/users/testuser',
          id: 'https://remote.example/activities/original-follow',
        },
        id: 'https://remote.example/activities/undo-123',
      };

      const targetUsername = 'testuser';
      mockRepository.saveActivity.mockResolvedValue(undefined);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await activityPubService.processIncomingActivity(undoActivity, targetUsername);

      expect(consoleSpy).toHaveBeenCalledWith(
        `Processing activity for ${targetUsername}:`,
        undoActivity
      );
      expect(mockRepository.saveActivity).toHaveBeenCalledWith(undoActivity, targetUsername);

      consoleSpy.mockRestore();
    });

    it('should handle repository errors', async () => {
      const followActivity: ActivityPubActivity = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Follow',
        actor: 'https://remote.example/users/follower',
        object: 'https://example.com/users/testuser',
        id: 'https://remote.example/activities/123',
      };

      const targetUsername = 'testuser';
      mockRepository.saveActivity.mockRejectedValue(new Error('Repository error'));

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await expect(
        activityPubService.processIncomingActivity(followActivity, targetUsername)
      ).rejects.toThrow('Repository error');

      expect(consoleSpy).toHaveBeenCalledWith(
        `Processing activity for ${targetUsername}:`,
        followActivity
      );
      expect(mockRepository.saveActivity).toHaveBeenCalledWith(followActivity, targetUsername);

      consoleSpy.mockRestore();
    });

    it('should handle empty target username', async () => {
      const followActivity: ActivityPubActivity = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Follow',
        actor: 'https://remote.example/users/follower',
        object: 'https://example.com/users/testuser',
        id: 'https://remote.example/activities/123',
      };

      const targetUsername = '';
      mockRepository.saveActivity.mockResolvedValue(undefined);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await activityPubService.processIncomingActivity(followActivity, targetUsername);

      expect(consoleSpy).toHaveBeenCalledWith(
        `Processing activity for ${targetUsername}:`,
        followActivity
      );
      expect(mockRepository.saveActivity).toHaveBeenCalledWith(followActivity, targetUsername);

      consoleSpy.mockRestore();
    });

    it('should handle activity with minimal required fields', async () => {
      const minimalActivity: ActivityPubActivity = {
        type: 'Follow',
        actor: 'https://remote.example/users/follower',
      };

      const targetUsername = 'testuser';
      mockRepository.saveActivity.mockResolvedValue(undefined);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await activityPubService.processIncomingActivity(minimalActivity, targetUsername);

      expect(consoleSpy).toHaveBeenCalledWith(
        `Processing activity for ${targetUsername}:`,
        minimalActivity
      );
      expect(mockRepository.saveActivity).toHaveBeenCalledWith(minimalActivity, targetUsername);

      consoleSpy.mockRestore();
    });

    it('should handle activity with complex object structure', async () => {
      const complexActivity: ActivityPubActivity = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Create',
        actor: 'https://remote.example/users/creator',
        object: {
          type: 'Note',
          id: 'https://remote.example/posts/complex',
          content: 'Complex post with mentions',
          attributedTo: 'https://remote.example/users/creator',
          to: ['https://www.w3.org/ns/activitystreams#Public'],
          cc: ['https://example.com/users/testuser'],
          tag: [
            {
              type: 'Mention',
              href: 'https://example.com/users/testuser',
              name: '@testuser@example.com',
            },
          ],
          attachment: [
            {
              type: 'Document',
              mediaType: 'image/jpeg',
              url: 'https://remote.example/images/photo.jpg',
            },
          ],
        },
        id: 'https://remote.example/activities/complex-create',
        to: ['https://www.w3.org/ns/activitystreams#Public'],
        cc: ['https://example.com/users/testuser'],
      };

      const targetUsername = 'testuser';
      mockRepository.saveActivity.mockResolvedValue(undefined);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await activityPubService.processIncomingActivity(complexActivity, targetUsername);

      expect(consoleSpy).toHaveBeenCalledWith(
        `Processing activity for ${targetUsername}:`,
        complexActivity
      );
      expect(mockRepository.saveActivity).toHaveBeenCalledWith(complexActivity, targetUsername);

      consoleSpy.mockRestore();
    });
  });

  describe('Constructor', () => {
    it('should initialize with repository and domain', () => {
      const service = new ActivityPubService(mockRepository, 'test.domain');

      expect(service['repository']).toBe(mockRepository);
      expect(service['domain']).toBe('test.domain');
    });

    it('should handle empty domain', () => {
      const service = new ActivityPubService(mockRepository, '');

      expect(service['repository']).toBe(mockRepository);
      expect(service['domain']).toBe('');
    });
  });
});