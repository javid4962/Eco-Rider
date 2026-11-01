import { Injectable, Logger, Optional } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  IObjectStoreAdapter,
  StoredObject,
  SignedTokenPayload,
  TokenVerificationResult,
} from './object-store.interface';

@Injectable()
export class PrivateDiskStorageAdapter implements IObjectStoreAdapter {
  private readonly logger = new Logger(PrivateDiskStorageAdapter.name);
  private baseStorageDir: string;
  private signingSecret: string;
  private readonly memoryCache = new Map<
    string,
    { buffer: Buffer; metadata?: Record<string, string> }
  >();

  constructor(@Optional() options?: { baseDir?: string; signingSecret?: string }) {
    this.baseStorageDir = path.resolve(
      options?.baseDir || process.env.STORAGE_BASE_DIR || './data/private_storage',
    );
    this.signingSecret =
      options?.signingSecret ||
      process.env.STORAGE_SIGNING_SECRET ||
      'ecoride_private_kyc_storage_hmac_secret_2026';

    try {
      if (!fs.existsSync(this.baseStorageDir)) {
        fs.mkdirSync(this.baseStorageDir, { recursive: true });
      }
    } catch (err) {
      this.logger.warn(`Could not create base storage directory ${this.baseStorageDir}: ${err}`);
    }
  }

  configure(options: { baseDir?: string; signingSecret?: string }): void {
    if (options.baseDir) {
      this.baseStorageDir = path.resolve(options.baseDir);
      try {
        if (!fs.existsSync(this.baseStorageDir)) {
          fs.mkdirSync(this.baseStorageDir, { recursive: true });
        }
      } catch (err) {
        this.logger.warn(`Could not create base storage directory ${this.baseStorageDir}: ${err}`);
      }
    }
    if (options.signingSecret) {
      this.signingSecret = options.signingSecret;
    }
  }

  private resolveSafePath(key: string): string {
    // Sanitize key against directory traversal attacks
    const sanitizedKey = key.replace(/^[/\\]+/, '').replace(/\.\.[/\\]/g, '');
    const resolvedPath = path.resolve(this.baseStorageDir, sanitizedKey);

    // Verify resolved path stays strictly within base directory
    if (!resolvedPath.startsWith(this.baseStorageDir)) {
      throw new Error(`Path traversal attempt detected with key: ${key}`);
    }

    return resolvedPath;
  }

  async putObject(key: string, buffer: Buffer, metadata?: Record<string, string>): Promise<void> {
    const filePath = this.resolveSafePath(key);
    const parentDir = path.dirname(filePath);

    try {
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(filePath, buffer);
    } catch {
      // Fallback to in-memory store for sandboxed or read-only directories
      this.memoryCache.set(key, { buffer, metadata });
    }

    this.memoryCache.set(key, { buffer, metadata });
  }

  async getObject(key: string): Promise<StoredObject> {
    // Check in-memory cache first
    const cached = this.memoryCache.get(key);
    if (cached) {
      return {
        data: cached.buffer,
        sizeBytes: cached.buffer.length,
        metadata: cached.metadata,
      };
    }

    const filePath = this.resolveSafePath(key);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Object not found in storage: ${key}`);
    }

    const data = fs.readFileSync(filePath);
    return {
      data,
      sizeBytes: data.length,
    };
  }

  async deleteObject(key: string): Promise<void> {
    this.memoryCache.delete(key);

    try {
      const filePath = this.resolveSafePath(key);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      this.logger.warn(`Failed to delete file from disk: ${err}`);
    }
  }

  async objectExists(key: string): Promise<boolean> {
    if (this.memoryCache.has(key)) {
      return true;
    }
    const filePath = this.resolveSafePath(key);
    return fs.existsSync(filePath);
  }

  generateSignedToken(payload: SignedTokenPayload): string {
    const payloadStr = JSON.stringify(payload);
    const encodedPayload = Buffer.from(payloadStr, 'utf8').toString('base64url');

    const hmac = crypto.createHmac('sha256', this.signingSecret);
    hmac.update(encodedPayload);
    const signature = hmac.digest('base64url');

    return `${encodedPayload}.${signature}`;
  }

  verifySignedToken(token: string): TokenVerificationResult {
    if (!token || typeof token !== 'string') {
      return { isValid: false, error: 'Missing or empty signed access token' };
    }

    const parts = token.split('.');
    if (parts.length !== 2) {
      return { isValid: false, error: 'Malformed signed access token structure' };
    }

    const [encodedPayload, providedSignature] = parts;

    // Verify cryptographic signature
    const hmac = crypto.createHmac('sha256', this.signingSecret);
    hmac.update(encodedPayload);
    const expectedSignature = hmac.digest('base64url');

    try {
      const isSignatureValid = crypto.timingSafeEqual(
        Buffer.from(providedSignature),
        Buffer.from(expectedSignature),
      );
      if (!isSignatureValid) {
        return { isValid: false, error: 'Invalid or tampered signed access token' };
      }
    } catch {
      return { isValid: false, error: 'Invalid or tampered signed access token' };
    }

    // Decode and parse payload
    try {
      const jsonStr = Buffer.from(encodedPayload, 'base64url').toString('utf8');
      const payload: SignedTokenPayload = JSON.parse(jsonStr);

      if (!payload.documentId || !payload.exp || !payload.storageKey) {
        return { isValid: false, error: 'Incomplete signed token payload' };
      }

      // Verify expiration timestamp
      if (Date.now() > payload.exp) {
        return { isValid: false, error: 'Signed access link has expired', payload };
      }

      return { isValid: true, payload };
    } catch {
      return { isValid: false, error: 'Failed to decode signed token payload' };
    }
  }
}
