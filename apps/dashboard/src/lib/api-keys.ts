const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const KEY_LENGTH = 32;
const PREFIX = 'field_live_';

export function generateApiKey(): { key: string; prefix: string } {
  const randomBytes = new Uint8Array(KEY_LENGTH);
  crypto.getRandomValues(randomBytes);

  let randomPart = '';
  for (let i = 0; i < KEY_LENGTH; i++) {
    randomPart += CHARS[randomBytes[i] % CHARS.length];
  }

  const key = PREFIX + randomPart;
  const prefix = key.slice(0, 14);

  return { key, prefix };
}

export async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
