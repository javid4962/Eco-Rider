export interface StoredObject {
  data: Buffer;
  mimeType?: string;
  metadata?: Record<string, string>;
  sizeBytes: number;
}

export interface SignedTokenPayload {
  documentId: string;
  storageKey: string;
  userId: string;
  exp: number; // Expiration timestamp in milliseconds
}

export interface TokenVerificationResult {
  isValid: boolean;
  payload?: SignedTokenPayload;
  error?: string;
}

export interface IObjectStoreAdapter {
  putObject(key: string, buffer: Buffer, metadata?: Record<string, string>): Promise<void>;
  getObject(key: string): Promise<StoredObject>;
  deleteObject(key: string): Promise<void>;
  objectExists(key: string): Promise<boolean>;
  generateSignedToken(payload: SignedTokenPayload): string;
  verifySignedToken(token: string): TokenVerificationResult;
}
