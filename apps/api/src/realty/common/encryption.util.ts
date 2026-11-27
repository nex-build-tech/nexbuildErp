import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

// Fallback encryption secret for Aadhaar storage (32 bytes required for AES-256)
const DEFAULT_KEY_STRING = 'build_erp_realty_secure_key_32_b';

function getEncryptionKey(secret?: string): Buffer {
  const keySource = secret || process.env.AADHAAR_ENCRYPTION_KEY || process.env.JWT_ACCESS_SECRET || DEFAULT_KEY_STRING;
  return crypto.createHash('sha256').update(keySource).digest();
}

/**
 * Encrypts Aadhaar number using AES-256-GCM.
 * Output format: base64(iv + authTag + ciphertext)
 */
export function encryptAadhaar(plainText: string, secret?: string): string {
  if (!plainText) return '';
  const key = getEncryptionKey(secret);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString('base64');
}

/**
 * Decrypts AES-256-GCM encrypted Aadhaar ciphertext.
 */
export function decryptAadhaar(cipherTextBase64: string, secret?: string): string {
  if (!cipherTextBase64) return '';
  const key = getEncryptionKey(secret);
  const combined = Buffer.from(cipherTextBase64, 'base64');

  if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error('Invalid ciphertext length');
  }

  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Masks an Aadhaar number to show only the last 4 digits (e.g. XXXX-XXXX-1234 or XXXX 1234).
 */
export function maskAadhaar(aadhaar: string): string {
  if (!aadhaar) return '';
  const cleaned = aadhaar.replace(/[^0-9]/g, '');
  if (cleaned.length < 4) return 'XXXX';
  const last4 = cleaned.slice(-4);
  return `XXXX-XXXX-${last4}`;
}
