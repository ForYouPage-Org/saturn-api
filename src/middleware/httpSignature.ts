import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { fetchRemoteActor } from '../utils/federation';

import { AppError, ErrorType } from '../utils/errors';
interface ParsedSignature {
  keyId: string;
  algorithm: string;
  headers: string[];
  signature: string;
}

/**
 * Parse HTTP Signature header
 */
function parseSignatureHeader(signatureHeader: string): ParsedSignature {
  const parts = signatureHeader.split(',').map(part => part.trim());
  const parsed: any = {};

  for (const part of parts) {
    const [key, value] = part.split('=', 2);
    if (value) {
      parsed[key] = value.replace(/^"/, '').replace(/"$/, '');
    }
  }

  if (
    !parsed.keyId ||
    !parsed.algorithm ||
    !parsed.headers ||
    !parsed.signature
  ) {
    throw new Error('Invalid signature header format');
  }

  return {
    keyId: parsed.keyId,
    algorithm: parsed.algorithm,
    headers: parsed.headers.split(' '),
    signature: parsed.signature,
  };
}

/**
 * Create signature string from request headers
 */
function createSignatureString(req: Request, headers: string[]): string {
  const parts: string[] = [];

  for (const header of headers) {
    if (header === '(request-target)') {
      parts.push(`(request-target): ${req.method.toLowerCase()} ${req.url}`);
    } else {
      const value = req.headers[header.toLowerCase()];
      if (value) {
        parts.push(`${header.toLowerCase()}: ${value}`);
      } else {
        throw new Error(`Missing required header: ${header}`);
      }
    }
  }

  return parts.join('\n');
}

/**
 * Verify HTTP signature for ActivityPub federation
 */
export async function verifyHttpSignature(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Only verify signatures for ActivityPub inbox endpoints
    if (!req.path.includes('/inbox')) {
      return next();
    }

    const signatureHeader = req.headers.signature as string;
    if (!signatureHeader) {
      next(new AppError('Missing signature header', 401, ErrorType.UNAUTHORIZED));
      return;
    }

    // Parse the signature header
    const parsedSig = parseSignatureHeader(signatureHeader);

    // Only support RSA-SHA256 for now
    if (parsedSig.algorithm !== 'rsa-sha256') {
      next(new AppError('Unsupported signature algorithm', 400, ErrorType.VALIDATION));
      return;
    }

    // Extract actor URL from keyId (remove #main-key or similar fragment)
    const actorUrl = parsedSig.keyId.split('#')[0];

    // Fetch the remote actor to get their public key
    let remoteActor: any;
    try {
      remoteActor = await fetchRemoteActor(actorUrl);
    } catch (error) {
      console.error(
        'Failed to fetch remote actor for signature verification:',
        error
      );
      next(new AppError('Could not fetch actor public key', 401, ErrorType.UNAUTHORIZED));
      return;
    }

    // Extract public key
    let publicKeyPem: string;
    if (remoteActor.publicKey?.publicKeyPem) {
      publicKeyPem = remoteActor.publicKey.publicKeyPem;
    } else {
      next(new AppError('No public key found for actor', 401, ErrorType.UNAUTHORIZED));
      return;
    }

    // Create the signature string from the request
    const signatureString = createSignatureString(req, parsedSig.headers);

    // Verify the signature
    const verifier = crypto.createVerify('sha256');
    verifier.update(signatureString);

    const isValid = verifier.verify(
      publicKeyPem,
      parsedSig.signature,
      'base64'
    );

    if (!isValid) {
      next(new AppError('Invalid signature', 401, ErrorType.UNAUTHORIZED));
      return;
    }

    // Store the verified actor info for use in controllers
    req.verifiedActor = remoteActor;

    next();
  } catch (error) {
    console.error('HTTP signature verification error:', error);
    next(new AppError('Signature verification failed', 400, ErrorType.VALIDATION));
  }
}

// Extend Request interface to include verifiedActor
declare global {
  namespace Express {
    interface Request {
      verifiedActor?: any;
    }
  }
}
