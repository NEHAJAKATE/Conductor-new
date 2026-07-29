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
let identityStore: IdentityRecord[] = [
  {
    customerId: 'CUST-8092',
    name: 'Sarah Jenkins',
    email: 'sarah.j@example.com',
    phone: '+1 (555) 019-2834',
    dob: '1990-05-12',
    gender: 'Female',
    address: '742 Evergreen Terrace, Springfield, OR',
    pan: 'ABCDE1234F',
    aadhaar: '5432 1098 7654',
    passport: 'L9876543',
    segment: 'VIP',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    sourceSystem: 'HubSpot CRM',
    ingestedAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    customerId: 'CUST-3912',
    name: 'Marcus Roberts',
    email: 'm.roberts@acme.inc',
    phone: '+1 (555) 987-6543',
    dob: '1985-11-23',
    gender: 'Male',
    address: '1092 Wall Street, NY',
    pan: 'FGHIJ5678K',
    aadhaar: 'Not Linked',
    passport: 'M1234567',
    segment: 'Regular',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    sourceSystem: 'HubSpot CRM',
    ingestedAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    customerId: 'CUST-4421',
    name: 'Rajesh Sharma',
    email: 'rajesh.sharma@domain.co.in',
    phone: '+91 98123 45678',
    dob: '1988-08-15',
    gender: 'Male',
    address: 'A-12, Sector 62, Noida, UP',
    pan: 'LMNOP9012Q',
    aadhaar: '9876 5432 1098',
    passport: 'Z1092384',
    segment: 'VIP',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    sourceSystem: 'HubSpot CRM',
    ingestedAt: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

let behaviorStore: BehaviorRecord[] = [
  // Sarah Jenkins events
  { eventId: 'evt-101', email: 'sarah.j@example.com', type: 'Visited Website', timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), source: 'Web SDK Ingest', details: 'Visited pricing page.' },
  { eventId: 'evt-102', email: 'sarah.j@example.com', type: 'Login', timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), source: 'Auth Ingest', details: 'Authenticated via web UI.' },
  { eventId: 'evt-103', email: 'sarah.j@example.com', type: 'Purchase', timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), source: 'Store Ingest', details: 'Purchased Premium Plan subscription.' },
  { eventId: 'evt-104', email: 'sarah.j@example.com', type: 'Support Ticket', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), source: 'Helpdesk Ingest', details: 'Inquired about invoice billing cycles.' },
  
  // Marcus Roberts events
  { eventId: 'evt-201', email: 'm.roberts@acme.inc', type: 'Website Visit', timestamp: new Date(Date.now() - 3600000 * 6).toISOString(), source: 'Web SDK Ingest', details: 'Visited documentation page.' },
  { eventId: 'evt-202', email: 'm.roberts@acme.inc', type: 'Campaign Click', timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), source: 'Email Ingest', details: 'Clicked Q3 discount link.' },
  
  // Rajesh Sharma events
  { eventId: 'evt-301', email: 'rajesh.sharma@domain.co.in', type: 'Login', timestamp: new Date(Date.now() - 3600000 * 8).toISOString(), source: 'Auth Ingest', details: 'Authenticated on mobile application.' },
  { eventId: 'evt-302', email: 'rajesh.sharma@domain.co.in', type: 'Purchase', timestamp: new Date(Date.now() - 3600000 * 7).toISOString(), source: 'Store Ingest', details: 'Purchased Enterprise license seat.' }
];

let financialStore: FinancialRecord[] = [
  // Sarah Jenkins invoices
  { transactionId: 'tx-101', email: 'sarah.j@example.com', invoiceId: 'INV-4012', amount: 2400.00, date: new Date(Date.now() - 3600000 * 3).toISOString(), status: 'Paid', outstandingBalance: 0, creditLimit: 20000, subscriptionName: 'Premium Suite Plan', subscriptionPrice: 199.00 },
  { transactionId: 'tx-102', email: 'sarah.j@example.com', invoiceId: 'INV-4013', amount: 500.00, date: new Date(Date.now() - 3600000 * 2).toISOString(), status: 'Paid', outstandingBalance: 0, creditLimit: 20000 },
  
  // Marcus Roberts invoices
  { transactionId: 'tx-201', email: 'm.roberts@acme.inc', invoiceId: 'INV-8910', amount: 1500.00, date: new Date(Date.now() - 3600000 * 6).toISOString(), status: 'Paid', outstandingBalance: 0, creditLimit: 10000, subscriptionName: 'Basic Team Plan', subscriptionPrice: 49.00 },
  
  // Rajesh Sharma invoices
  { transactionId: 'tx-301', email: 'rajesh.sharma@domain.co.in', invoiceId: 'INV-3012', amount: 3500.00, date: new Date(Date.now() - 3600000 * 7).toISOString(), status: 'Paid', outstandingBalance: 0, creditLimit: 50000, subscriptionName: 'Enterprise Custom SLA', subscriptionPrice: 499.00 }
];

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
