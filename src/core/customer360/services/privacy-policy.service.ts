import { PiiClassification } from '../domain/pii.types';
import { dataProtectionService } from './data-protection';

export class PrivacyPolicyService {
  maskValue(
    value: any,
    classification: PiiClassification,
    role: 'Admin' | 'Owner' | 'Compliance Officer' | 'Marketing' | 'Analyst' | 'Developer' | 'AI Agent'
  ): any {
    if (value === null || value === undefined || value === '') return value;

    // Delegate directly to the Custom Data Protection Policy Engine
    return dataProtectionService.policyEngine(role, '', String(value), classification);
  }
}

export const privacyPolicyService = new PrivacyPolicyService();
