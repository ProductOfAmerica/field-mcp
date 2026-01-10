import sodium from 'npm:libsodium-wrappers@0.7.15';
import { getSupabaseClient } from '../supabase-client.ts';

// Initialize libsodium
await sodium.ready;

const NONCE_LENGTH = 12; // ChaCha20-Poly1305 IETF uses 12-byte nonce

// Cache of encryption keys by version (per cold start)
const keyCache = new Map<number, Uint8Array>();

// Cached current version from DB
let cachedVersion: number | null = null;

/**
 * Get the current encryption version from the database.
 * Cached for the lifetime of the Edge Function instance.
 */
async function getConfigVersion(): Promise<number> {
  if (cachedVersion !== null) {
    return cachedVersion;
  }

  const supabase = getSupabaseClient();

  // Try the new RPC function first
  const { data, error } = await supabase.rpc('get_current_encryption_version');

  if (error || data === null) {
    // Fallback to direct query if RPC doesn't exist yet
    const { data: configData } = await supabase
      .from('encryption_key_config')
      .select('current_version')
      .eq('id', 1)
      .single();

    if (configData?.current_version) {
      cachedVersion = configData.current_version;
      return cachedVersion;
    }

    // Default to version 1 if config doesn't exist
    console.warn('encryption_key_config not found, defaulting to version 1');
    cachedVersion = 1;
    return cachedVersion;
  }

  cachedVersion = data as number;
  return cachedVersion;
}

/**
 * Get an encryption key by version from Supabase Vault.
 * Keys are cached for the lifetime of the Edge Function instance.
 */
async function getEncryptionKeyByVersion(version: number): Promise<Uint8Array> {
  const cached = keyCache.get(version);
  if (cached) {
    return cached;
  }

  const supabase = getSupabaseClient();
  const keyName = `token_encryption_key_v${version}`;

  const { data, error } = await supabase.rpc('get_encryption_key', {
    key_name: keyName,
  });

  if (error || !data) {
    throw new Error(
      `Failed to retrieve encryption key v${version} from Vault: ${error?.message ?? 'Key not found'}`,
    );
  }

  // Key is stored as base64 string
  const keyBytes = sodium.from_base64(
    data as string,
    sodium.base64_variants.ORIGINAL,
  );

  if (keyBytes.length !== 32) {
    throw new Error(
      `Invalid encryption key length: expected 32 bytes, got ${keyBytes.length}`,
    );
  }

  keyCache.set(version, keyBytes);
  return keyBytes;
}

/**
 * Encrypt a plaintext token using ChaCha20-Poly1305 IETF.
 * Compatible with pgsodium's crypto_aead_ietf_encrypt.
 *
 * Output format: base64([version byte][12 bytes nonce][ciphertext + auth tag])
 */
export async function encryptToken(plaintext: string): Promise<string> {
  const version = await getConfigVersion();
  const key = await getEncryptionKeyByVersion(version);

  // Generate random 12-byte nonce
  const nonce = sodium.randombytes_buf(NONCE_LENGTH);

  // Encrypt using ChaCha20-Poly1305 IETF (compatible with pgsodium)
  const ciphertext = sodium.crypto_aead_chacha20poly1305_ietf_encrypt(
    sodium.from_string(plaintext),
    null, // no additional data
    null, // no secret nonce
    nonce,
    key,
  );

  // Combine: [version:1][nonce:12][ciphertext+tag]
  const combined = new Uint8Array(1 + NONCE_LENGTH + ciphertext.length);
  combined[0] = version;
  combined.set(nonce, 1);
  combined.set(ciphertext, 1 + NONCE_LENGTH);

  return sodium.to_base64(combined, sodium.base64_variants.ORIGINAL);
}

/**
 * Decrypt an encrypted token using ChaCha20-Poly1305 IETF.
 * Automatically uses the correct key version based on the version byte in the data.
 *
 * Expects format: base64([version byte][12 bytes nonce][ciphertext + auth tag])
 */
export async function decryptToken(encrypted: string): Promise<string> {
  const combined = sodium.from_base64(
    encrypted,
    sodium.base64_variants.ORIGINAL,
  );

  if (combined.length < 1 + NONCE_LENGTH + 16) {
    throw new Error('Invalid encrypted token: too short');
  }

  const version = combined[0];
  if (version < 1 || version > 255) {
    throw new Error(`Invalid encryption version: ${version}`);
  }

  const nonce = combined.slice(1, 1 + NONCE_LENGTH);
  const ciphertext = combined.slice(1 + NONCE_LENGTH);

  // Automatically fetch the correct key for this version
  const key = await getEncryptionKeyByVersion(version);

  const plaintext = sodium.crypto_aead_chacha20poly1305_ietf_decrypt(
    null, // no secret nonce
    ciphertext,
    null, // no additional data
    nonce,
    key,
  );

  return sodium.to_string(plaintext);
}

/**
 * Check if a value is encrypted (vs legacy Base64 encoding).
 *
 * Encrypted values start with a version byte (0x01-0x0A).
 * Legacy JWT tokens start with "eyJ" (base64 of '{"').
 */
export function isEncrypted(value: string): boolean {
  if (!value || value.length < 20) {
    return false;
  }

  try {
    const decoded = sodium.from_base64(value, sodium.base64_variants.ORIGINAL);
    // Version bytes are 1-10, legacy JWTs would decode to 0x7b ('{')
    return decoded[0] >= 1 && decoded[0] <= 10;
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

/**
 * Clear all cached encryption keys and version.
 * Useful for testing or when rotating keys.
 */
export function clearKeyCache(): void {
  keyCache.clear();
  cachedVersion = null;
}

/**
 * Get the current encryption version.
 * New tokens are encrypted with this version.
 */
export async function getCurrentVersion(): Promise<number> {
  return getConfigVersion();
}
