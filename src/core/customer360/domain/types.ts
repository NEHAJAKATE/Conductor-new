import { PiiClassification } from './pii.types';

export interface IdentityBlock {
  name?: string;
  email?: string;
  phone?: string;
  pan?: string;
  aadhaar?: string;
  passport?: string;
  dob?: string;
  address?: string;
  customerId?: string;
  photoUrl?: string;
  segment?: 'VIP' | 'Regular' | 'Churn-Risk' | 'Inactive';
  riskScore?: number; // 0-100
  completionRate?: number; // 0-100
  status?: 'Active' | 'Pending' | 'Merged';
  gender?: string;
  country?: string;
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
  sourceSystem?: string;
  ingestedAt?: string;
}

export interface PiiTag {
  fieldName: string;
  classification: PiiClassification;
  masked: boolean;
}

export interface BehavioralEvent {
  eventId: string;
  type: 'Visited Website' | 'Added Cart' | 'Purchased' | 'Refund' | 'Support Ticket' | 'Email Open' | 'Bank Transaction';
  timestamp: string;
  source: string;
  details: string;
  amount?: number;
  campaign?: string;
  device?: string;
  browser?: string;
  geo?: string;
  referral?: string;
}

export interface FinancialAccount {
  accountId: string;
  accountType: 'Savings' | 'Checking' | 'Credit Card' | 'Loan';
  institution: string;
  balance: number;
  currency: string;
}

export interface FinancialCard {
  cardId: string;
  cardType: 'Debit' | 'Credit';
  lastFour: string;
  limit?: number;
  outstanding?: number;
}

export interface FinancialInvoice {
  invoiceId: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Unpaid' | 'Overdue';
}

export interface FinancialSubscription {
  subscriptionId: string;
  serviceName: string;
  cost: number;
  billingCycle: 'Monthly' | 'Yearly';
  status: 'Active' | 'Cancelled';
}

export interface FinancialBlock {
  accounts: FinancialAccount[];
  cards: FinancialCard[];
  loans: Array<{ loanId: string; principal: number; interestRate: number; termMonths: number }>;
  invoices: FinancialInvoice[];
  payments: Array<{ paymentId: string; amount: number; method: string; timestamp: string }>;
  subscriptions: FinancialSubscription[];
  creditScore: number;
}

export interface SourceLineageBlock {
  attributeName: string;
  sourceSystem: string; // CRM, CSV, Financial File, Behaviour File, ERP, Support, Website
  timestamp: string;
  originalValue: string;
}

export interface UnifiedCustomerProfile {
  uuid: string;
  identity: IdentityBlock;
  piiTags: PiiTag[];
  behavioralEvents: BehavioralEvent[];
  financial: FinancialBlock;
  lineage: SourceLineageBlock[];
  confidence: number; // 0-100
  createdAt: string;
  updatedAt: string;
  matchReason?: string;
  evidence?: string[];
  explainability?: string;
}

export type GoldenCustomerProfile = UnifiedCustomerProfile;
