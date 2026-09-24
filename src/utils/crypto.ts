
/**
 * Simple E2EE utility using AES-GCM
 */

const ITERATIONS = 100000;
const ALGO = 'AES-GCM';

async function deriveKey(passkey: string, salt: string) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passkey),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGO, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptText(text: string, passkey: string, roomId: string): Promise<string> {
  try {
    const key = await deriveKey(passkey, roomId);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const encrypted = await crypto.subtle.encrypt(
      { name: ALGO, iv },
      key,
      enc.encode(text)
    );

    // Combine IV and ciphertext: [iv(12 bytes) + ciphertext]
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Return as base64
    return btoa(String.fromCharCode(...combined));
  } catch (err) {
    console.error('Encryption error:', err);
    return text; // Fallback to plain text if error (should not happen)
  }
}

export async function decryptText(encryptedBase64: string, passkey: string, roomId: string): Promise<string> {
  try {
    const key = await deriveKey(passkey, roomId);
    const combined = new Uint8Array(
      atob(encryptedBase64)
        .split('')
        .map((c) => c.charCodeAt(0))
    );

    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGO, iv },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (err) {
    // If decryption fails, it might be a system message or plain text
    return encryptedBase64;
  }
}
