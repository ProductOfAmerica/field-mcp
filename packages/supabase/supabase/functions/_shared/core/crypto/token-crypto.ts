import { getSupabaseClient } from '../supabase-client.ts';

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // 96 bits, standard for GCM
const VERSION_BYTE = 0x01; // Key version 1

// Cached encryption key (per cold start)
let cachedKey: CryptoKey | null = null;
let _cachedKeyVersion: number | null = null;

/**
 * Get the encryption key from Supabase Vault via RPC function.
 * Caches the key for the lifetime of the Edge Function instance.
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  if (cachedKey) {
    return cachedKey;
  }

  const supabase = getSupabaseClient();

  // Call the RPC function that securely accesses the vault
  const { data, error } = await supabase.rpc('get_encryption_key', {
    key_name: 'token_encryption_key_v1',
  });

  if (error || !data) {
    throw new Error(
      `Failed to retrieve encryption key from Vault: ${error?.message ?? 'Key not found'}`,
    );
  }

  // Key is stored as hex string (64 chars = 32 bytes = 256 bits)
  const keyHex = data;
  const keyBytes = hexToBytes(keyHex);

  if (keyBytes.length !== 32) {
    throw new Error(
      `Invalid encryption key length: expected 32 bytes, got ${keyBytes.length}`,
    );
  }

  cachedKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: ALGORITHM },
    false, // not extractable
    ['encrypt', 'decrypt'],
  );

  _cachedKeyVersion = VERSION_BYTE;
  return cachedKey;
}

/**
 * Encrypt a plaintext token using AES-256-GCM.
 *
 * Output format: base64([version byte][12 bytes IV][ciphertext + auth tag])
 */
export async function encryptToken(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();

  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Encode plaintext to bytes
  const plaintextBytes = new TextEncoder().encode(plaintext);

  // Encrypt (GCM automatically appends 16-byte auth tag)
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    plaintextBytes,
  );

  // Combine: [version][iv][ciphertext+tag]
  const combined = new Uint8Array(
    1 + IV_LENGTH + new Uint8Array(ciphertext).length,
  );
  combined[0] = VERSION_BYTE;
  combined.set(iv, 1);
  combined.set(new Uint8Array(ciphertext), 1 + IV_LENGTH);

  // Encode as base64 for storage in TEXT column
  return bytesToBase64(combined);
}

/**
 * Decrypt an encrypted token using AES-256-GCM.
 *
 * Expects format: base64([version byte][12 bytes IV][ciphertext + auth tag])
 */
export async function decryptToken(encrypted: string): Promise<string> {
  const combined = base64ToBytes(encrypted);

  if (combined.length < 1 + IV_LENGTH + 16) {
    throw new Error('Invalid encrypted token: too short');
  }

  const version = combined[0];
  if (version !== VERSION_BYTE) {
    throw new Error(`Unsupported encryption version: ${version}`);
  }

  const iv = combined.slice(1, 1 + IV_LENGTH);
  const ciphertext = combined.slice(1 + IV_LENGTH);

  const key = await getEncryptionKey();

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext,
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Check if a value is encrypted (vs legacy Base64 encoding).
 *
 * Encrypted values start with version byte 0x01, which encodes to "AQ" in base64.
 * Legacy JWT tokens start with "eyJ" (base64 of '{"').
 */
export function isEncrypted(value: string): boolean {
  if (!value || value.length < 20) {
    return false;
  }

  try {
    const decoded = base64ToBytes(value);
    // Check for version byte
    return decoded[0] === VERSION_BYTE;
  } catch {
    return false;
  }
}

/**
 * Decrypt a token, handling both encrypted and legacy Base64 formats.
 * Use this during migration period for backwards compatibility.
 */
export async function decryptTokenCompat(encrypted: string): Promise<string> {
  if (isEncrypted(encrypted)) {
    return decryptToken(encrypted);
  }

  // Legacy format: plain Base64 encoding
  try {
    return atob(encrypted);
  } catch {
    throw new Error('Invalid token format: not encrypted or valid Base64');
  }
}

// Helper functions for byte/string conversions

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Clear the cached encryption key.
 * Useful for testing or when rotating keys.
 */
export function clearKeyCache(): void {
  cachedKey = null;
  _cachedKeyVersion = null;
}
