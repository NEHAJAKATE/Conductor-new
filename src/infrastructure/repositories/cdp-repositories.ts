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
  profileType?: 'Anonymous Visitor' | 'Known Customer' | 'Unified Profile';
  cookieId?: string;
  sessionId?: string;
  browserFingerprint?: string;
  deviceId?: string;
  referrer?: string;
  utmSource?: string;
  browser?: string;
  location?: string;
  device?: string;
  country?: string;
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
  campaign?: string;
  device?: string;
  browser?: string;
  geo?: string;
  referral?: string;
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
  orders?: number;
  subscriptions?: string;
  payments?: number;
  creditScore?: number;
  revenue?: number;
  lifetimeValue?: number;
  balance?: number;
}

// Global dynamic in-memory storage arrays
let identityStore: IdentityRecord[] = [
  {
    customerId: 'CUST-1001',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@gmail.com',
    phone: '+91 98765 43210',
    dob: '1990-05-15',
    gender: 'Male',
    address: 'Flat 402, Sea Breeze, Worli, Mumbai',
    pan: 'ABCDE1234F',
    aadhaar: '1234-5678-9012',
    passport: 'Z1234567',
    segment: 'VIP',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    sourceSystem: 'CRM System',
    ingestedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    profileType: 'Known Customer',
    country: 'India',
    location: 'Mumbai, India'
  },
  {
    customerId: 'CUST-1002',
    name: 'Alice Smith',
    email: 'alice.smith@outlook.com',
    phone: '+1 202 555 0143',
    dob: '1985-11-22',
    gender: 'Female',
    address: '742 Evergreen Terrace, New York',
    pan: 'Not Linked',
    aadhaar: 'Not Linked',
    passport: 'U9876543',
    segment: 'Regular',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    sourceSystem: 'Stripe Billing',
    ingestedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    profileType: 'Known Customer',
    country: 'United States',
    location: 'New York, USA'
  },
  {
    customerId: 'CUST-1003',
    name: 'David Miller',
    email: 'david.miller@gmail.com',
    phone: '+44 20 7946 0958',
    dob: '1992-02-10',
    gender: 'Male',
    address: '221B Baker Street, London',
    pan: 'Not Linked',
    aadhaar: 'Not Linked',
    passport: 'L3456789',
    segment: 'VIP',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    sourceSystem: 'SFTP Folder',
    ingestedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    profileType: 'Unified Profile',
    country: 'United Kingdom',
    location: 'London, UK'
  },
  {
    customerId: 'CUST-1004',
    name: 'Priya Patel',
    email: 'priya.patel@yahoo.com',
    phone: '+91 99999 88888',
    dob: '1995-07-30',
    gender: 'Female',
    address: 'Sector 15, Dwarka, New Delhi',
    pan: 'PQRTS9876Q',
    aadhaar: '9876-5432-1098',
    passport: 'Not Linked',
    segment: 'Regular',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    sourceSystem: 'Web Signup',
    ingestedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    profileType: 'Known Customer',
    country: 'India',
    location: 'Delhi, India'
  },
  {
    customerId: 'anon-cook-8472',
    name: 'Anonymous Visitor',
    email: 'anon-cook-8472@anonymous.com',
    phone: '',
    dob: '',
    gender: 'Unknown',
    address: '',
    pan: 'Not Linked',
    aadhaar: 'Not Linked',
    passport: 'Not Linked',
    segment: 'Regular',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    sourceSystem: 'Website Cookie',
    ingestedAt: new Date(Date.now() - 3600000).toISOString(),
    profileType: 'Anonymous Visitor',
    cookieId: 'cookie-session-8832',
    sessionId: 'session-id-4421',
    browserFingerprint: 'fp-chrome-win11-9472',
    deviceId: 'device-id-5511',
    referrer: 'https://google.com',
    utmSource: 'cpc_search',
    browser: 'Chrome 124.0',
    location: 'Mumbai, India',
    device: 'Mobile (Android)',
    country: 'India'
  },
  {
    customerId: 'anon-cook-9112',
    name: 'Anonymous Visitor',
    email: 'anon-cook-9112@anonymous.com',
    phone: '',
    dob: '',
    gender: 'Unknown',
    address: '',
    pan: 'Not Linked',
    aadhaar: 'Not Linked',
    passport: 'Not Linked',
    segment: 'Regular',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    sourceSystem: 'Website Cookie',
    ingestedAt: new Date(Date.now() - 1800000).toISOString(),
    profileType: 'Anonymous Visitor',
    cookieId: 'cookie-session-9912',
    sessionId: 'session-id-1004',
    browserFingerprint: 'fp-safari-ios17-1102',
    deviceId: 'device-id-8822',
    referrer: 'https://linkedin.com',
    utmSource: 'social_post',
    browser: 'Safari Mobile',
    location: 'New York, USA',
    device: 'iPhone 15',
    country: 'United States'
  }
];
let behaviorStore: BehaviorRecord[] = [
  {
    eventId: 'evt-anon-1',
    customerId: 'anon-cook-8472',
    email: 'anon-cook-8472@anonymous.com',
    type: 'Visited Website',
    timestamp: new Date(Date.now() - 3000000).toISOString(),
    source: 'Clickstream Web SDK',
    details: 'Visited page path: /products/conductor-cdp-suite',
    campaign: 'CDP Launch 2026',
    device: 'Mobile (Android)',
    browser: 'Chrome 124.0',
    geo: 'Mumbai, India',
    referral: 'https://google.com'
  },
  {
    eventId: 'evt-anon-2',
    customerId: 'anon-cook-8472',
    email: 'anon-cook-8472@anonymous.com',
    type: 'Added Cart',
    timestamp: new Date(Date.now() - 2500000).toISOString(),
    source: 'Clickstream Web SDK',
    details: 'Added product to cart: Conductor Enterprise Tier (Tier 1)',
    campaign: 'CDP Launch 2026',
    device: 'Mobile (Android)',
    browser: 'Chrome 124.0',
    geo: 'Mumbai, India',
    referral: 'https://google.com'
  },
  {
    eventId: 'evt-anon-3',
    customerId: 'anon-cook-9112',
    email: 'anon-cook-9112@anonymous.com',
    type: 'Visited Website',
    timestamp: new Date(Date.now() - 1500000).toISOString(),
    source: 'Clickstream Web SDK',
    details: 'Visited page path: /pricing',
    campaign: 'Pricing Campaign',
    device: 'iPhone 15',
    browser: 'Safari Mobile',
    geo: 'New York, USA',
    referral: 'https://linkedin.com'
  },
  {
    eventId: 'evt-known-1',
    customerId: 'CUST-1001',
    email: 'rahul.sharma@gmail.com',
    type: 'Purchased',
    timestamp: new Date(Date.now() - 86400000 * 9).toISOString(),
    source: 'Stripe Billing',
    details: 'Purchased Conductor Pro Annual Plan - $2,400',
    campaign: 'CDP Launch 2026',
    device: 'MacBook Pro',
    browser: 'Chrome 125.0',
    geo: 'Mumbai, India',
    referral: 'Direct'
  },
  {
    eventId: 'evt-known-2',
    customerId: 'CUST-1002',
    email: 'alice.smith@outlook.com',
    type: 'Visited Website',
    timestamp: new Date(Date.now() - 86400000 * 7).toISOString(),
    source: 'Clickstream Web SDK',
    details: 'Visited page: /docs/activations',
    campaign: 'Google Ads Search',
    device: 'Windows Desktop',
    browser: 'Firefox',
    geo: 'New York, USA',
    referral: 'https://google.com'
  }
];
let financialStore: FinancialRecord[] = [
  {
    transactionId: 'txn-1001',
    customerId: 'CUST-1001',
    email: 'rahul.sharma@gmail.com',
    invoiceId: 'inv-worli-8832',
    amount: 2400,
    date: new Date(Date.now() - 86400000 * 9).toISOString(),
    status: 'Paid',
    outstandingBalance: 0,
    creditLimit: 50000,
    subscriptionName: 'Conductor Pro Annual Plan',
    subscriptionPrice: 200,
    revenue: 2400,
    lifetimeValue: 2400,
    balance: 0
  },
  {
    transactionId: 'txn-1002',
    customerId: 'CUST-1002',
    email: 'alice.smith@outlook.com',
    invoiceId: 'inv-springfield-9421',
    amount: 600,
    date: new Date(Date.now() - 86400000 * 7).toISOString(),
    status: 'Paid',
    outstandingBalance: 0,
    creditLimit: 10000,
    subscriptionName: 'Conductor Developer Tier',
    subscriptionPrice: 50,
    revenue: 600,
    lifetimeValue: 600,
    balance: 0
  }
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

  async delete(customerId: string): Promise<void> {
    identityStore = identityStore.filter(r => r.customerId !== customerId);
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
