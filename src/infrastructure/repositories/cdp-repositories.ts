export interface IdentityRecord {
  customerId: string;
  name: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  address: string;
  pan: string;
  aadhaar: string;
  passport: string;
  segment: string;
  photoUrl?: string;
  sourceSystem: string;
  ingestedAt: string;
}

export interface BehaviorRecord {
  eventId: string;
  customerId?: string;
  email?: string;
  phone?: string;
  type: string;
  timestamp: string;
  source: string;
  details: string;
}

export interface FinancialRecord {
  transactionId: string;
  customerId?: string;
  email?: string;
  invoiceId: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Unpaid' | 'Refunded';
  outstandingBalance: number;
  creditLimit: number;
  subscriptionName?: string;
  subscriptionPrice?: number;
}

// Global dynamic in-memory storage arrays
let identityStore: IdentityRecord[] = [];
let behaviorStore: BehaviorRecord[] = [];
let financialStore: FinancialRecord[] = [];

export class IdentityRepository {
  async save(record: IdentityRecord): Promise<void> {
    const idx = identityStore.findIndex(r => r.email.toLowerCase() === record.email.toLowerCase() || r.customerId === record.customerId);
    if (idx >= 0) {
      identityStore[idx] = { ...identityStore[idx], ...record };
    } else {
      identityStore.push(record);
    }
  }

  async list(): Promise<IdentityRecord[]> {
    return identityStore;
  }

  async clear(): Promise<void> {
    identityStore = [];
  }
}

export class BehaviorRepository {
  async save(record: BehaviorRecord): Promise<void> {
    const idx = behaviorStore.findIndex(r => r.eventId === record.eventId);
    if (idx >= 0) {
      behaviorStore[idx] = { ...behaviorStore[idx], ...record };
    } else {
      behaviorStore.push(record);
    }
  }

  async list(): Promise<BehaviorRecord[]> {
    return behaviorStore;
  }

  async clear(): Promise<void> {
    behaviorStore = [];
  }
}

export class FinancialRepository {
  async save(record: FinancialRecord): Promise<void> {
    const idx = financialStore.findIndex(r => r.transactionId === record.transactionId);
    if (idx >= 0) {
      financialStore[idx] = { ...financialStore[idx], ...record };
    } else {
      financialStore.push(record);
    }
  }

  async list(): Promise<FinancialRecord[]> {
    return financialStore;
  }

  async clear(): Promise<void> {
    financialStore = [];
  }
}

export const identityRepository = new IdentityRepository();
export const behaviorRepository = new BehaviorRepository();
export const financialRepository = new FinancialRepository();
