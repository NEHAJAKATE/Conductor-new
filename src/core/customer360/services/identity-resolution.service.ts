import { UuidService } from './uuid.service';
import { IdentityLink } from '../domain/identity.types';

export class IdentityResolutionService {
  // Normalize phone numbers to clean E.164 format (digits only, strip formatting)
  normalizePhone(phone: string): string {
    if (!phone) return '';
    const clean = phone.replace(/[^0-9]/g, '');
    // If it starts with local country prefixes, trim or align them (basic version)
    return clean;
  }

  // Levenshtein distance helper
  levenshteinDistance(a: string, b: string): number {
    const tmp: number[][] = [];
    for (let i = 0; i <= a.length; i++) {
      tmp[i] = [i];
    }
    for (let j = 0; j <= b.length; j++) {
      tmp[0][j] = j;
    }
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        tmp[i][j] = Math.min(
          tmp[i - 1][j] + 1,
          tmp[i][j - 1] + 1,
          tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
    }
    return tmp[a.length][b.length];
  }

  // Calculate string similarity between 0 and 1
  calculateSimilarity(a: string, b: string): number {
    const s1 = a.toLowerCase().trim();
    const s2 = b.toLowerCase().trim();
    if (s1 === s2) return 1.0;
    if (s1.length === 0 || s2.length === 0) return 0.0;
    
    const distance = this.levenshteinDistance(s1, s2);
    const maxLen = Math.max(s1.length, s2.length);
    return (maxLen - distance) / maxLen;
  }

  // Identify matching golden UUID or create new one using deterministic namespace
  resolveIdentity(
    record: Record<string, any>,
    existingLinks: Map<string, string> // maps lookupKeys (email, phone, govId, customerId) to goldenUuid
  ): { goldenUuid: string; confidence: number; matches: string[] } {
    const email = String(record.email || record.user_email || '').toLowerCase().trim();
    const phone = this.normalizePhone(String(record.phone || record.mobile || ''));
    const pan = String(record.pan || '').toUpperCase().trim();
    const aadhaar = String(record.aadhaar || '').replace(/\s/g, '').trim();
    const passport = String(record.passport || '').toUpperCase().trim();
    const customerId = String(record.customerId || record.customer_id || '').trim();
    const name = String(record.name || record.first_name || '').toLowerCase().trim();
    const dob = String(record.dob || '').trim();

    let resolvedUuid: string | null = null;
    let confidence = 0;
    const matches: string[] = [];

    // Match exact vectors
    if (email && existingLinks.has(`email:${email}`)) {
      resolvedUuid = existingLinks.get(`email:${email}`)!;
      confidence += 40;
      matches.push('Email Exact Match');
    }
    if (phone && existingLinks.has(`phone:${phone}`)) {
      if (!resolvedUuid) resolvedUuid = existingLinks.get(`phone:${phone}`)!;
      confidence += 30;
      matches.push('Phone Exact Match');
    }
    if (pan && existingLinks.has(`pan:${pan}`)) {
      if (!resolvedUuid) resolvedUuid = existingLinks.get(`pan:${pan}`)!;
      confidence += 50;
      matches.push('PAN Card Exact Match');
    }
    if (aadhaar && existingLinks.has(`aadhaar:${aadhaar}`)) {
      if (!resolvedUuid) resolvedUuid = existingLinks.get(`aadhaar:${aadhaar}`)!;
      confidence += 50;
      matches.push('Aadhaar Exact Match');
    }
    if (passport && existingLinks.has(`passport:${passport}`)) {
      if (!resolvedUuid) resolvedUuid = existingLinks.get(`passport:${passport}`)!;
      confidence += 50;
      matches.push('Passport Exact Match');
    }
    if (customerId && existingLinks.has(`cust:${customerId}`)) {
      if (!resolvedUuid) resolvedUuid = existingLinks.get(`cust:${customerId}`)!;
      confidence += 40;
      matches.push('Customer ID Exact Match');
    }

    // If no exact ID match, check composites or generate new
    if (!resolvedUuid) {
      // Use email, aadhaar, PAN, phone or customerId as canonical anchor to generate UUID
      const anchor = email || aadhaar || pan || passport || phone || customerId || name || `rand-${Math.random()}`;
      resolvedUuid = UuidService.generateGoldenUuid(anchor);
      confidence = 100; // Original profile seed
      matches.push('New Seed Identity');
    } else {
      confidence = Math.min(100, confidence);
    }

    // Register this record's keys to point to the resolved UUID
    if (email) existingLinks.set(`email:${email}`, resolvedUuid);
    if (phone) existingLinks.set(`phone:${phone}`, resolvedUuid);
    if (pan) existingLinks.set(`pan:${pan}`, resolvedUuid);
    if (aadhaar) existingLinks.set(`aadhaar:${aadhaar}`, resolvedUuid);
    if (passport) existingLinks.set(`passport:${passport}`, resolvedUuid);
    if (customerId) existingLinks.set(`cust:${customerId}`, resolvedUuid);

    return { goldenUuid: resolvedUuid, confidence, matches };
  }
}
export const identityResolutionService = new IdentityResolutionService();
