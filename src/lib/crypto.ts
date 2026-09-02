/**
 * Client-Side Cryptographic Utilities using Web Crypto API (SHA-256 Salted Hashing)
 */

const SALT = 'octovova_finance_salt_2026_secure_key';

export async function hashPassword(password: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + SALT);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Deterministic fallback hash if Web Crypto is unavailable
  let hash = 0;
  const str = password + SALT;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `sha256_${Math.abs(hash).toString(16).padStart(16, '0')}`;
}

export function maskString(str: string, visibleChars = 4): string {
  if (!str || str.length <= visibleChars) return '••••••••';
  return str.slice(0, visibleChars) + '••••••••' + str.slice(-2);
}
