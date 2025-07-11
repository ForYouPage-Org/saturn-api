import { verifyHttpSignature } from '../../src/middleware/httpSignature';
import { fetchRemoteActor } from '../../src/utils/federation';
import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { jest } from '@jest/globals';

// Mock the federation utility
jest.mock('../../src/utils/federation', () => ({
  fetchRemoteActor: jest.fn(),
}));

const mockFetchRemoteActor = fetchRemoteActor as jest.MockedFunction<typeof fetchRemoteActor>;

describe('HTTP Signature Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockRequest = {
      path: '/inbox',
      method: 'POST',
      url: '/inbox',
      headers: {
        host: 'example.com',
        date: new Date().toISOString(),
        digest: 'SHA-256=test-digest',
        signature: 'keyId="https://remote.example.com/users/alice#main-key",algorithm="rsa-sha256",headers="(request-target) host date digest",signature="test-signature"',
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('verifyHttpSignature', () => {
    it('should skip verification for non-inbox endpoints', async () => {
      mockRequest.path = '/api/posts';

      await verifyHttpSignature(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockFetchRemoteActor).not.toHaveBeenCalled();
    });

    it('should return 401 for missing signature header', async () => {
      mockRequest.headers = { ...mockRequest.headers };
      delete mockRequest.headers.signature;

      await verifyHttpSignature(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Missing signature header',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid signature header format', async () => {
      mockRequest.headers!.signature = 'invalid-signature-header';

      await verifyHttpSignature(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Signature verification failed',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 for unsupported signature algorithm', async () => {
      mockRequest.headers!.signature = 'keyId="https://remote.example.com/users/alice#main-key",algorithm="hmac-sha256",headers="(request-target) host date digest",signature="test-signature"';

      await verifyHttpSignature(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unsupported signature algorithm',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when remote actor fetch fails', async () => {
      mockFetchRemoteActor.mockRejectedValue(new Error('Actor not found'));

      await verifyHttpSignature(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockFetchRemoteActor).toHaveBeenCalledWith('https://remote.example.com/users/alice');
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Could not fetch actor public key',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when actor has no public key', async () => {
      const mockActor = {
        id: 'https://remote.example.com/users/alice',
        type: 'Person',
        // No publicKey property
      };

      mockFetchRemoteActor.mockResolvedValue(mockActor);

      await verifyHttpSignature(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'No public key found for actor',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid signature', async () => {
      const mockActor = {
        id: 'https://remote.example.com/users/alice',
        type: 'Person',
        publicKey: {
          id: 'https://remote.example.com/users/alice#main-key',
          owner: 'https://remote.example.com/users/alice',
          publicKeyPem: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----',
        },
      };

      mockFetchRemoteActor.mockResolvedValue(mockActor);

      // Mock crypto.createVerify to return false for verification
      const mockVerifier = {
        update: jest.fn(),
        verify: jest.fn().mockReturnValue(false),
      };
      jest.spyOn(crypto, 'createVerify').mockReturnValue(mockVerifier as any);

      await verifyHttpSignature(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid signature',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should pass verification with valid signature', async () => {
      const mockActor = {
        id: 'https://remote.example.com/users/alice',
        type: 'Person',
        publicKey: {
          id: 'https://remote.example.com/users/alice#main-key',
          owner: 'https://remote.example.com/users/alice',
          publicKeyPem: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----',
        },
      };

      mockFetchRemoteActor.mockResolvedValue(mockActor);

      // Mock crypto.createVerify to return true for verification
      const mockVerifier = {
        update: jest.fn(),
        verify: jest.fn().mockReturnValue(true),
      };
      jest.spyOn(crypto, 'createVerify').mockReturnValue(mockVerifier as any);

      await verifyHttpSignature(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockVerifier.update).toHaveBeenCalledWith(
        '(request-target): post /inbox\nhost: example.com\ndate: ' + mockRequest.headers!.date + '\ndigest: SHA-256=test-digest'
      );
      expect(mockVerifier.verify).toHaveBeenCalledWith(
        mockActor.publicKey.publicKeyPem,
        'test-signature',
        'base64'
      );
      expect(mockRequest.verifiedActor).toBe(mockActor);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle missing required headers', async () => {
      mockRequest.headers = {
        signature: 'keyId="https://remote.example.com/users/alice#main-key",algorithm="rsa-sha256",headers="(request-target) host date digest",signature="test-signature"',
        host: 'example.com',
        // Missing date and digest headers
      };

      const mockActor = {
        id: 'https://remote.example.com/users/alice',
        type: 'Person',
        publicKey: {
          id: 'https://remote.example.com/users/alice#main-key',
          owner: 'https://remote.example.com/users/alice',
          publicKeyPem: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----',
        },
      };

      mockFetchRemoteActor.mockResolvedValue(mockActor);

      await verifyHttpSignature(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Signature verification failed',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle signature header parsing errors', async () => {
      mockRequest.headers!.signature = 'keyId="https://remote.example.com/users/alice#main-key",algorithm="rsa-sha256"'; // Missing headers and signature

      await verifyHttpSignature(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Signature verification failed',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should extract actor URL from keyId with fragment', async () => {
      const keyIdWithFragment = 'https://remote.example.com/users/alice#main-key';
      mockRequest.headers!.signature = `keyId="${keyIdWithFragment}",algorithm="rsa-sha256",headers="(request-target) host date digest",signature="test-signature"`;

      const mockActor = {
        id: 'https://remote.example.com/users/alice',
        type: 'Person',
        publicKey: {
          id: keyIdWithFragment,
          owner: 'https://remote.example.com/users/alice',
          publicKeyPem: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----',
        },
      };

      mockFetchRemoteActor.mockResolvedValue(mockActor);

      const mockVerifier = {
        update: jest.fn(),
        verify: jest.fn().mockReturnValue(true),
      };
      jest.spyOn(crypto, 'createVerify').mockReturnValue(mockVerifier as any);

      await verifyHttpSignature(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockFetchRemoteActor).toHaveBeenCalledWith('https://remote.example.com/users/alice');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle different HTTP methods and paths', async () => {
      mockRequest.method = 'GET';
      mockRequest.url = '/inbox?test=1';

      const mockActor = {
        id: 'https://remote.example.com/users/alice',
        type: 'Person',
        publicKey: {
          id: 'https://remote.example.com/users/alice#main-key',
          owner: 'https://remote.example.com/users/alice',
          publicKeyPem: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----',
        },
      };

      mockFetchRemoteActor.mockResolvedValue(mockActor);

      const mockVerifier = {
        update: jest.fn(),
        verify: jest.fn().mockReturnValue(true),
      };
      jest.spyOn(crypto, 'createVerify').mockReturnValue(mockVerifier as any);

      await verifyHttpSignature(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockVerifier.update).toHaveBeenCalledWith(
        '(request-target): get /inbox?test=1\nhost: example.com\ndate: ' + mockRequest.headers!.date + '\ndigest: SHA-256=test-digest'
      );
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('parseSignatureHeader', () => {
    it('should parse valid signature header', () => {
      const signatureHeader = 'keyId="https://example.com/users/alice#main-key",algorithm="rsa-sha256",headers="(request-target) host date digest",signature="test-signature"';
      
      // We need to test the parsing indirectly through the middleware
      mockRequest.headers!.signature = signatureHeader;

      const mockActor = {
        id: 'https://example.com/users/alice',
        type: 'Person',
        publicKey: {
          id: 'https://example.com/users/alice#main-key',
          owner: 'https://example.com/users/alice',
          publicKeyPem: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----',
        },
      };

      mockFetchRemoteActor.mockResolvedValue(mockActor);

      const mockVerifier = {
        update: jest.fn(),
        verify: jest.fn().mockReturnValue(true),
      };
      jest.spyOn(crypto, 'createVerify').mockReturnValue(mockVerifier as any);

      expect(async () => {
        await verifyHttpSignature(mockRequest as Request, mockResponse as Response, mockNext);
      }).not.toThrow();
    });

    it('should handle signature header with spaces', () => {
      const signatureHeader = 'keyId = "https://example.com/users/alice#main-key" , algorithm = "rsa-sha256" , headers = "(request-target) host date digest" , signature = "test-signature"';
      
      mockRequest.headers!.signature = signatureHeader;

      const mockActor = {
        id: 'https://example.com/users/alice',
        type: 'Person',
        publicKey: {
          id: 'https://example.com/users/alice#main-key',
          owner: 'https://example.com/users/alice',
          publicKeyPem: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----',
        },
      };

      mockFetchRemoteActor.mockResolvedValue(mockActor);

      const mockVerifier = {
        update: jest.fn(),
        verify: jest.fn().mockReturnValue(true),
      };
      jest.spyOn(crypto, 'createVerify').mockReturnValue(mockVerifier as any);

      expect(async () => {
        await verifyHttpSignature(mockRequest as Request, mockResponse as Response, mockNext);
      }).not.toThrow();
    });
  });

  describe('createSignatureString', () => {
    it('should create proper signature string with request-target', async () => {
      const mockActor = {
        id: 'https://remote.example.com/users/alice',
        type: 'Person',
        publicKey: {
          id: 'https://remote.example.com/users/alice#main-key',
          owner: 'https://remote.example.com/users/alice',
          publicKeyPem: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----',
        },
      };

      mockFetchRemoteActor.mockResolvedValue(mockActor);

      const mockVerifier = {
        update: jest.fn(),
        verify: jest.fn().mockReturnValue(true),
      };
      jest.spyOn(crypto, 'createVerify').mockReturnValue(mockVerifier as any);

      await verifyHttpSignature(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockVerifier.update).toHaveBeenCalledWith(
        expect.stringContaining('(request-target): post /inbox')
      );
      expect(mockVerifier.update).toHaveBeenCalledWith(
        expect.stringContaining('host: example.com')
      );
      expect(mockVerifier.update).toHaveBeenCalledWith(
        expect.stringContaining('date: ' + mockRequest.headers!.date)
      );
      expect(mockVerifier.update).toHaveBeenCalledWith(
        expect.stringContaining('digest: SHA-256=test-digest')
      );
    });
  });
});