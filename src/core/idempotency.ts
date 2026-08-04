import crypto from 'crypto';

export class IdempotencyService {
  private static seenChecksums = new Set<string>();

  static getSHA256(content: string | Buffer): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  static register(checksum: string): boolean {
    if (this.seenChecksums.has(checksum)) {
      return false; // Already processed
    }
    this.seenChecksums.add(checksum);
    return true; // New checksum registered
  }

  static clear() {
    this.seenChecksums.clear();
  }
}
