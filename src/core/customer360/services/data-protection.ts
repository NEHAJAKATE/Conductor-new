import * as crypto from 'crypto';
import { piiDetectorService } from './pii-detector.service';
import { UnifiedCustomerProfile } from '../domain/types';

// In-Memory Token Vault for tokenized PII mapping
const tokenVault = new Map<string, { original: string; classification: string }>();

// Encryption Key (Derived from secret or generated statically for demo reliability)
const ENCRYPTION_KEY = crypto.scryptSync('conductor-secret-key-2026', 'conductor-salt-2026', 32);
const IV_LENGTH = 16;
const SALT = 'conductor-salted-hash-2026';

export class DataProtectionService {
  /**
   * Generates a salted SHA-256 hash of a string value (e.g., for anonymous matching)
   */
  saltedHash(value: string): string {
    if (!value) return '';
    return crypto
      .createHmac('sha256', SALT)
      .update(value.trim().toLowerCase())
      .digest('hex');
  }

  /**
   * Encrypts a string value using AES-256-CBC
   */
  aesEncrypt(value: string): string {
    if (!value) return '';
    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
      let encrypted = cipher.update(value, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return `${iv.toString('hex')}:${encrypted}`;
    } catch (err) {
      console.error('[Security] Encryption failed:', err);
      return 'ENCRYPTION_ERROR';
    }
  }

  /**
   * Decrypts a previously AES-encrypted value
   */
  aesDecrypt(encryptedValue: string): string {
    if (!encryptedValue || !encryptedValue.includes(':')) return encryptedValue;
    try {
      const parts = encryptedValue.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encryptedText = Buffer.from(parts[1], 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
      const decrypted = Buffer.concat([
        decipher.update(encryptedText),
        decipher.final()
      ]);
      return decrypted.toString('utf8');
    } catch (err) {
      console.error('[Security] Decryption failed:', err);
      return 'DECRYPTION_ERROR';
    }
  }

  /**
   * Tokenizes a value, stores it in the token vault, and returns the token id
   */
  tokenize(value: string, classification: string): string {
    if (!value) return '';
    const hash = this.saltedHash(value);
    const tokenId = `TOK-${classification}-${hash.slice(0, 12).toUpperCase()}`;
    if (!tokenVault.has(tokenId)) {
      tokenVault.set(tokenId, { original: value, classification });
    }
    return tokenId;
  }

  /**
   * Detokenizes a token id back to its original value if authorized
   */
  detokenize(tokenId: string): string {
    const entry = tokenVault.get(tokenId);
    return entry ? entry.original : tokenId;
  }

  /**
   * Custom Policy Engine enforcing role-based decryptions/views
   */
  policyEngine(
    role: 'Admin' | 'Owner' | 'Compliance Officer' | 'Marketing' | 'Analyst' | 'Developer' | 'AI Agent',
    fieldName: string,
    value: string,
    classification: string
  ): string {
    if (!value) return '';

    // Owners and Compliance Officers get full raw values
    if (role === 'Owner' || role === 'Admin' || role === 'Compliance Officer') {
      return value;
    }

    // Analysts and AI Agents get tokenized keys only - no raw values
    if (role === 'Analyst' || role === 'AI Agent') {
      return this.tokenize(value, classification);
    }

    // Marketing role gets salted hashes or partial masks
    if (role === 'Marketing') {
      if (classification === 'EMAIL') {
        const parts = value.split('@');
        return parts.length === 2 ? `${parts[0][0]}***@${parts[1]}` : '***@example.com';
      }
      if (classification === 'PHONE') {
        return value.length > 4 ? `******${value.slice(-4)}` : '******';
      }
      return `HASH-${this.saltedHash(value).slice(0, 8).toUpperCase()}`;
    }

    // Default fallback: return tokenized form
    return this.tokenize(value, classification);
  }

  /**
   * Transforms a Customer Profile into an "Agent Safe Dataset" format
   */
  getAgentSafeDataset(profile: UnifiedCustomerProfile): any {
    return {
      uuid: profile.uuid,
      confidence: profile.confidence,
      identitySummary: {
        segment: profile.identity.segment,
        riskScore: profile.identity.riskScore,
        completionRate: profile.identity.completionRate,
        status: profile.identity.status,
        gender: profile.identity.gender,
        country: profile.identity.country,
        // Hashed/Tokenized fields for agent tracking
        nameHash: this.saltedHash(profile.identity.name || ''),
        emailToken: this.tokenize(profile.identity.email || '', 'EMAIL'),
        phoneToken: this.tokenize(profile.identity.phone || '', 'PHONE')
      },
      behavioralEvents: profile.behavioralEvents.map(e => ({
        eventId: e.eventId,
        type: e.type,
        timestamp: e.timestamp,
        source: e.source,
        details: e.details
      })),
      financialSummary: {
        creditScore: profile.financial.creditScore,
        totalInvoiceAmount: profile.financial.invoices.reduce((acc, inv) => acc + inv.amount, 0),
        unpaidBalance: profile.financial.invoices
          .filter(inv => inv.status === 'Unpaid' || inv.status === 'Overdue')
          .reduce((acc, inv) => acc + inv.amount, 0),
        activeSubscriptionsCount: profile.financial.subscriptions.filter(s => s.status === 'Active').length,
        lifetimeValue: profile.financial.subscriptions.reduce((acc, s) => acc + s.cost, 0) * 12
      }
    };
  }
}

export const dataProtectionService = new DataProtectionService();
