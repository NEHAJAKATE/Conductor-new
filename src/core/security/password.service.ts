import crypto from 'crypto';

export class PasswordService {
  /**
   * Hashes a plaintext password using standard scrypt key derivation with a random 16-byte salt
   */
  static hash(password: string): string {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return `$scrypt$N=16384,r=8,p=1$${salt}$${derivedKey.toString('hex')}`;
  }

  /**
   * Verifies a plaintext password against a stored cryptographic hash in constant time
   */
  static compare(password: string, storedHash: string): boolean {
    try {
      if (!password || !storedHash || typeof password !== 'string' || typeof storedHash !== 'string') {
        return false;
      }
      const parts = storedHash.split('$');
      if (parts.length !== 5 || parts[1] !== 'scrypt') {
        return false;
      }
      const salt = parts[3];
      const originalKey = Buffer.from(parts[4], 'hex');
      const testKey = crypto.scryptSync(password, salt, originalKey.length);

      return crypto.timingSafeEqual(originalKey, testKey);
    } catch {
      return false;
    }
  }
}

export const bcrypt = {
  hash: (pwd: string) => Promise.resolve(PasswordService.hash(pwd)),
  compare: (pwd: string, hash: string) => Promise.resolve(PasswordService.compare(pwd, hash)),
};
