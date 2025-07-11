import { 
  sendSignedRequest, 
  fetchRemoteActor, 
  sendFollowRequest, 
  fetchRemoteObject,
  sendActivity 
} from '../../src/utils/federation';
import type { Actor } from '../../src/modules/actors/models/actor';
import type { ActivityPubActivity } from '../../src/modules/activitypub/models/activitypub';
import { jest } from '@jest/globals';

// Mock node-fetch
jest.mock('node-fetch');
import fetch from 'node-fetch';

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('Federation Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchRemoteActor', () => {
    it('should fetch remote actor profile', async () => {
      const mockActor = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        id: 'https://example.com/users/alice',
        type: 'Person',
        preferredUsername: 'alice',
        name: 'Alice',
        inbox: 'https://example.com/users/alice/inbox',
        outbox: 'https://example.com/users/alice/outbox',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/activity+json'),
        },
        json: jest.fn().mockResolvedValue(mockActor),
      } as any);

      const result = await fetchRemoteActor('https://example.com/users/alice');

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/users/alice', {
        headers: {
          Accept: 'application/activity+json',
        },
      });
      expect(result).toEqual(mockActor);
    });

    it('should handle fetch errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      } as any);

      await expect(fetchRemoteActor('https://example.com/users/nonexistent')).rejects.toThrow(
        'Failed to fetch remote actor: Not Found'
      );
    });

    it('should validate content type', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('text/html'),
        },
      } as any);

      await expect(fetchRemoteActor('https://example.com/users/alice')).rejects.toThrow(
        'Invalid content type received'
      );
    });
  });

  describe('fetchRemoteObject', () => {
    it('should fetch remote object', async () => {
      const mockObject = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        id: 'https://example.com/posts/123',
        type: 'Note',
        content: 'Hello world',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockObject),
      } as any);

      const result = await fetchRemoteObject('https://example.com/posts/123');

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/posts/123', {
        headers: {
          Accept: 'application/activity+json',
        },
      });
      expect(result).toEqual(mockObject);
    });

    it('should handle fetch errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      } as any);

      await expect(fetchRemoteObject('https://example.com/posts/nonexistent')).rejects.toThrow(
        'Failed to fetch remote object: Not Found'
      );
    });
  });

  describe('sendActivity', () => {
    it('should send activity to remote endpoint', async () => {
      const activity: ActivityPubActivity = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        id: 'https://example.com/activities/123',
        type: 'Create',
        actor: 'https://example.com/users/alice',
        object: {
          id: 'https://example.com/posts/123',
          type: 'Note',
          content: 'Hello world',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
      } as any);

      await sendActivity('https://remote.example.com/inbox', activity);

      expect(mockFetch).toHaveBeenCalledWith('https://remote.example.com/inbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/activity+json',
          Accept: 'application/activity+json',
        },
        body: JSON.stringify(activity),
      });
    });

    it('should handle send errors', async () => {
      const activity: ActivityPubActivity = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        id: 'https://example.com/activities/123',
        type: 'Create',
        actor: 'https://example.com/users/alice',
        object: {
          id: 'https://example.com/posts/123',
          type: 'Note',
          content: 'Hello world',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      } as any);

      await expect(sendActivity('https://remote.example.com/inbox', activity)).rejects.toThrow(
        'Failed to send activity: Internal Server Error'
      );
    });
  });

  describe('sendSignedRequest', () => {
    it('should send signed request', async () => {
      const activity: ActivityPubActivity = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        id: 'https://example.com/activities/123',
        type: 'Follow',
        actor: 'https://example.com/users/alice',
        object: 'https://remote.example.com/users/bob',
      };

      const privateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
-----END RSA PRIVATE KEY-----`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
      } as any);

      const result = await sendSignedRequest(
        'https://remote.example.com/inbox',
        activity,
        privateKey,
        'https://example.com/users/alice#main-key'
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://remote.example.com/inbox',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/activity+json',
            Accept: 'application/activity+json',
            Host: 'remote.example.com',
            Date: expect.any(String),
            Digest: expect.any(String),
            Signature: expect.any(String),
          }),
          body: JSON.stringify(activity),
        })
      );
      expect(result).toBeDefined();
    });
  });

  describe('sendFollowRequest', () => {
    it('should send follow request to remote actor', async () => {
      const fromActor: Actor = {
        id: 'https://example.com/users/alice',
        username: 'alice',
        preferredUsername: 'alice',
        name: 'Alice',
        inbox: 'https://example.com/users/alice/inbox',
        outbox: 'https://example.com/users/alice/outbox',
        followers: 'https://example.com/users/alice/followers',
        following: 'https://example.com/users/alice/following',
        publicKey: {
          id: 'https://example.com/users/alice#main-key',
          owner: 'https://example.com/users/alice',
          publicKeyPem: '',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const remoteActor = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        id: 'https://remote.example.com/users/bob',
        type: 'Person',
        inbox: 'https://remote.example.com/users/bob/inbox',
      };

      // Mock fetchRemoteActor
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/activity+json'),
        },
        json: jest.fn().mockResolvedValue(remoteActor),
      } as any);

      // Mock sendSignedRequest
      mockFetch.mockResolvedValueOnce({
        ok: true,
      } as any);

      const privateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
-----END RSA PRIVATE KEY-----`;

      const result = await sendFollowRequest(
        fromActor,
        'https://remote.example.com/users/bob',
        privateKey
      );

      expect(result).toEqual(
        expect.objectContaining({
          '@context': 'https://www.w3.org/ns/activitystreams',
          type: 'Follow',
          actor: 'https://example.com/users/alice',
          object: 'https://remote.example.com/users/bob',
        })
      );
    });

    it('should handle follow request errors', async () => {
      const fromActor: Actor = {
        id: 'https://example.com/users/alice',
        username: 'alice',
        preferredUsername: 'alice',
        name: 'Alice',
        inbox: 'https://example.com/users/alice/inbox',
        outbox: 'https://example.com/users/alice/outbox',
        followers: 'https://example.com/users/alice/followers',
        following: 'https://example.com/users/alice/following',
        publicKey: {
          id: 'https://example.com/users/alice#main-key',
          owner: 'https://example.com/users/alice',
          publicKeyPem: '',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      } as any);

      const privateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
-----END RSA PRIVATE KEY-----`;

      await expect(
        sendFollowRequest(fromActor, 'https://remote.example.com/users/nonexistent', privateKey)
      ).rejects.toThrow('Failed to fetch remote actor: Not Found');
    });
  });
});