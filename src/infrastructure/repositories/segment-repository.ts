import { UnifiedCustomerProfile } from '../../core/customer360/domain/types';
import { customerRepository } from './customer-repository';

export interface SegmentRule {
  field: 'country' | 'spent' | 'purchase_count' | 'email_exists' | 'campaign' | 'device' | 'risk_score' | 'ltv' | 'pii_count' | 'quality_score';
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'greater_than_or_equal' | 'less_than_or_equal' | 'contains' | 'does_not_contain' | 'starts_with' | 'ends_with' | 'regex' | 'exists' | 'does_not_exist' | 'in_list' | 'not_in_list' | 'between' | 'not_between' | 'empty' | 'not_empty' | 'date_before' | 'date_after' | 'last_7_days' | 'last_30_days' | 'last_90_days';
  value: string;
}

export interface SegmentDefinition {
  id: string;
  name: string;
  description: string;
  rules: SegmentRule[];
  createdAt: string;
}

// Global in-memory segment store with initial dynamic segment examples
let segmentStore: SegmentDefinition[] = [
  {
    id: 'seg-premium-india',
    name: 'Premium Indian Customers',
    description: 'Customers in India who spent more than 5,000 INR.',
    rules: [
      { field: 'country', operator: 'equals', value: 'India' },
      { field: 'spent', operator: 'greater_than', value: '5000' }
    ],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 'seg-active-campaign',
    name: 'Active Campaign Target Group',
    description: 'Customers active in Summer Sale 2026 campaign using mobile devices.',
    rules: [
      { field: 'campaign', operator: 'equals', value: 'Summer Sale 2026' },
      { field: 'device', operator: 'equals', value: 'Mobile' }
    ],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

export class SegmentRepository {
  async list(): Promise<SegmentDefinition[]> {
    return segmentStore;
  }

  async save(segment: SegmentDefinition): Promise<void> {
    const idx = segmentStore.findIndex(s => s.id === segment.id);
    if (idx >= 0) {
      segmentStore[idx] = segment;
    } else {
      segmentStore.push(segment);
    }
  }

  async delete(id: string): Promise<boolean> {
    const initialLen = segmentStore.length;
    segmentStore = segmentStore.filter(s => s.id !== id);
    return segmentStore.length < initialLen;
  }

  /**
   * Matches a list of profiles against segment rules
   */
  async matchProfiles(rules: SegmentRule[]): Promise<UnifiedCustomerProfile[]> {
    const allProfiles = await customerRepository.list();
    return allProfiles.filter(p => this.evaluateRules(p, rules));
  }

  private evaluateRules(profile: UnifiedCustomerProfile, rules: SegmentRule[]): boolean {
    if (rules.length === 0) return false;

    // By default, rules are combined via AND (all must match)
    for (const rule of rules) {
      const match = this.evaluateSingleRule(profile, rule);
      if (!match) return false;
    }

    return true;
  }

  private compareValues(fieldValue: any, operator: string, ruleValue: string): boolean {
    const strVal = String(fieldValue || '').toLowerCase();
    const strRule = String(ruleValue || '').toLowerCase();
    const numVal = Number(fieldValue);
    const numRule = Number(ruleValue);

    switch (operator) {
      case 'equals':
        return strVal === strRule;
      case 'not_equals':
        return strVal !== strRule;
      case 'greater_than':
        return numVal > numRule;
      case 'less_than':
        return numVal < numRule;
      case 'greater_than_or_equal':
        return numVal >= numRule;
      case 'less_than_or_equal':
        return numVal <= numRule;
      case 'contains':
        return strVal.includes(strRule);
      case 'does_not_contain':
        return !strVal.includes(strRule);
      case 'starts_with':
        return strVal.startsWith(strRule);
      case 'ends_with':
        return strVal.endsWith(strRule);
      case 'regex':
        try {
          return new RegExp(ruleValue, 'i').test(String(fieldValue || ''));
        } catch {
          return false;
        }
      case 'exists':
      case 'not_empty':
        return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
      case 'does_not_exist':
      case 'empty':
        return fieldValue === undefined || fieldValue === null || fieldValue === '';
      case 'in_list':
        return ruleValue.split(',').map(s => s.trim().toLowerCase()).includes(strVal);
      case 'not_in_list':
        return !ruleValue.split(',').map(s => s.trim().toLowerCase()).includes(strVal);
      case 'between': {
        const parts = ruleValue.split(',').map(Number);
        if (parts.length === 2) {
          return numVal >= parts[0] && numVal <= parts[1];
        }
        return false;
      }
      case 'not_between': {
        const parts = ruleValue.split(',').map(Number);
        if (parts.length === 2) {
          return numVal < parts[0] || numVal > parts[1];
        }
        return false;
      }
      case 'date_before':
        return new Date(fieldValue).getTime() < new Date(ruleValue).getTime();
      case 'date_after':
        return new Date(fieldValue).getTime() > new Date(ruleValue).getTime();
      case 'last_7_days': {
        const diff = Date.now() - new Date(fieldValue).getTime();
        return diff >= 0 && diff <= 7 * 86400000;
      }
      case 'last_30_days': {
        const diff = Date.now() - new Date(fieldValue).getTime();
        return diff >= 0 && diff <= 30 * 86400000;
      }
      case 'last_90_days': {
        const diff = Date.now() - new Date(fieldValue).getTime();
        return diff >= 0 && diff <= 90 * 86400000;
      }
      default:
        return false;
    }
  }

  private evaluateSingleRule(profile: UnifiedCustomerProfile, rule: SegmentRule): boolean {
    const { field, operator, value } = rule;

    switch (field) {
      case 'country':
        return this.compareValues(profile.identity.country, operator, value);
      case 'spent': {
        const spent = profile.financial.invoices.reduce((acc, inv) => acc + inv.amount, 0);
        return this.compareValues(spent, operator, value);
      }
      case 'purchase_count': {
        const purchases = profile.financial.invoices.length;
        return this.compareValues(purchases, operator, value);
      }
      case 'email_exists': {
        const email = profile.identity.email;
        const hasEmail = !!email && !email.toLowerCase().includes('anonymous');
        return this.compareValues(hasEmail ? 'true' : '', operator, value);
      }
      case 'campaign': {
        const campaign = profile.behavioralEvents.find(e => (e as any).campaign)?.campaign || '';
        return this.compareValues(campaign, operator, value);
      }
      case 'device': {
        const device = profile.behavioralEvents.find(e => (e as any).device)?.device || '';
        return this.compareValues(device, operator, value);
      }
      case 'risk_score':
        return this.compareValues(profile.identity.riskScore, operator, value);
      case 'ltv': {
        const ltv = profile.financial.subscriptions.reduce((acc, s) => acc + s.cost, 0) * 12;
        return this.compareValues(ltv, operator, value);
      }
      case 'pii_count': {
        const pii = profile.piiTags.filter(t => t.classification !== 'NONE').length;
        return this.compareValues(pii, operator, value);
      }
      case 'quality_score':
        return this.compareValues(profile.confidence, operator, value);
      default:
        return false;
    }
  }
}

export const segmentRepository = new SegmentRepository();
