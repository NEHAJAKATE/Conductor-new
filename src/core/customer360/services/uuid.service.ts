import { v5 as uuidv5 } from 'uuid';
import { config } from '../../config';

export class UuidService {
  private static NAMESPACE = config.identity.namespace;

  static generateUnifiedUuid(canonicalString: string): string {
    // Generate deterministic UUIDv5 using standard namespace and clean string
    const normalized = canonicalString.toLowerCase().trim().replace(/[^a-z0-9@.-]/g, '');
    return uuidv5(normalized, this.NAMESPACE);
  }

  static generateGoldenUuid(canonicalString: string): string {
    return this.generateUnifiedUuid(canonicalString);
  }
}
