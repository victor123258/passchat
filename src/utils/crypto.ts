/**
 * End-to-End Encryption utility using PBKDF2 + AES-256-GCM
 */

const ITERATIONS = 100000;
const ALGO = 'AES-GCM';

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  const chunkSize = 0x8000; // 32KB chunks to prevent call stack overflow
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array | null {
  try {
    const binString = atob(base64);
    const len = binString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binString.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

async function deriveKey(passkey: string, salt: string): Promise<CryptoKey> {
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
  if (!text || !passkey) return text;
  try {
    const key = await deriveKey(passkey, roomId);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const encrypted = await crypto.subtle.encrypt(
      { name: ALGO, iv },
      key,
      enc.encode(text)
    );

    // Combine IV (12 bytes) + ciphertext
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return `enc:v1:${bytesToBase64(combined)}`;
  } catch (err) {
    console.error('Encryption error:', err);
    return text;
  }
}

export async function decryptText(encryptedText: string, passkey: string, roomId: string): Promise<string> {
  if (!encryptedText || !passkey) return encryptedText;

  // Check if encrypted with prefix or legacy raw base64
  let base64Data = encryptedText;
  if (encryptedText.startsWith('enc:v1:')) {
    base64Data = encryptedText.substring(7);
  }

  const combined = base64ToBytes(base64Data);
  if (!combined || combined.length <= 12) {
    // Plain text or unencrypted system message
    return encryptedText;
  }

  try {
    const key = await deriveKey(passkey, roomId);
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGO, iv },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch {
    // If decryption fails (e.g. wrong passkey or system message), return original
    return encryptedText;
  }
}
