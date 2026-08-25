/**
 * Conductor Canonical Data Contract
 * Reusable enterprise domain models for B2B/B2C CDP and Data Intelligence
 */

export type BusinessClassification = 
  | 'b2b_dealer'
  | 'b2b_hospital'
  | 'b2b_retailer'
  | 'supplier'
  | 'field_staff'
  | 'b2c_individual'
  | 'unknown';

export interface BusinessAddress {
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  city?: string;
  pinCode?: string;
  area?: string;
  route?: string;
  state?: string;
  country?: string;
}

export interface BusinessContact {
  contactPerson?: string;
  phone1?: string;
  phone2?: string;
  mobile?: string;
  email?: string;
  website?: string;
}

export type CreditStatus = 'WITHIN_LIMIT' | 'APPROACHING_LIMIT' | 'BREACHED' | 'NO_HISTORY';

export interface BusinessCreditProfile {
  // --- Existing ERP static fields (from partyMaster.xls) ---
  creditDays: number;
  creditLimit: number;
  limitBills?: number;
  limitDays?: number;
  limitType?: 'Only Indicate' | 'Stop Bill' | 'None';
  isFrozen?: boolean;

  // --- Dynamic Credit Engine (computed from transaction history) ---
  dynamicCreditLimit?: number;    // avgMonthlySale × creditMultiplier
  avgMonthlySale?: number;        // Average of monthly sale totals
  monthsOfHistory?: number;       // How many months of sales data exist
  creditMultiplier?: number;      // Default 1.5 (45 days), configurable per customer
  creditUtilization?: number;     // (currentOutstanding / dynamicCreditLimit) × 100
  creditStatus?: CreditStatus;    // Computed status
  creditStatusReason?: string;    // Human-readable explanation
  lastCreditComputedAt?: string;  // ISO timestamp of last computation
}

export type OutstandingMatchType = 'DIRECT_CANONICAL_ID' | 'LEDGER_NAME_MATCH' | 'DISPLAY_NAME_FALLBACK';

export interface BusinessEntity {
  id: string; // Deterministic canonical ID (e.g. gstin:09..., pan:..., erp:...)
  name: string;
  legalName?: string;
  ledgerName?: string; // Raw Tally/Marg ERP ledger string, primary match key
  erpCode?: string;
  taxId?: string; // GSTIN / TIN
  pan?: string;
  drugLicenses?: string[];
  classification: BusinessClassification;
  address: BusinessAddress;
  contact: BusinessContact;
  credit: BusinessCreditProfile;
  bankDetails?: {
    bankName?: string;
    branch?: string;
    accountNo?: string;
    ifsc?: string;
  };
  totalSales?: number;
  totalPurchases?: number;
  currentOutstanding?: number;
  outstandingMatchType?: OutstandingMatchType;
  outstandingMatchConfidence?: number;
  outstandingMatchedAt?: string;
  aliasLedgers?: string[]; // Preserves all distinct ledger account strings under this tax ID
  needsReview?: boolean;   // Flags GSTIN/PAN collisions for business review
  reviewReason?: string;
  customAttributes?: Record<string, any>; // Dynamic user-defined custom parameters
  sourceSystem: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 
  | 'sale' 
  | 'purchase' 
  | 'sale_return' 
  | 'purchase_return' 
  | 'stock_adjustment' 
  | 'breakage' 
  | 'price_adjustment'
  | 'other';

export interface TransactionLineItem {
  productId: string;
  productName: string;
  manufacturer?: string;
  batchNumber?: string;
  quantity: number;
  freeQuantity?: number;
  unitRate: number;
  schemeAmount?: number;
  discountAmount?: number;
  netAmount: number;
  gstRate: number;
  taxAmount: number;
  mrp?: number;
  mrpAmount?: number;
}

export interface TransactionEntity {
  id: string;
  invoiceId: string; // Voucher / Bill number (VCN)
  type: TransactionType;
  date: string; // ISO-8601
  partyId?: string;
  partyName: string;
  partyGstin?: string;
  partyPan?: string;
  salesType?: 'Local' | 'Central' | 'Interstate';
  area?: string;
  route?: string;
  items: TransactionLineItem[];
  netAmount: number;
  taxAmount: number;
  grossAmount: number;
  customAttributes?: Record<string, any>; // Dynamic user-defined custom parameters
  sourceSystem: string;
  createdAt: string;
}

export interface ProductEntity {
  id: string;
  name: string;
  manufacturer?: string;
  brand?: string;
  category?: string;
  packing?: string;
  mrp?: number;
  defaultRate?: number;
  gstRate?: number;
  customAttributes?: Record<string, any>;
}

export interface InventoryEntity {
  productId: string;
  productName: string;
  packing?: string;
  manufacturer?: string;
  batchNumber?: string;
  quantityOnHand: number;
  reorderLevel?: number;
  unit: string;
  valuationAmount?: number;
  customAttributes?: Record<string, any>;
  lastUpdated: string;
}

export interface OutstandingEntity {
  businessId: string;
  businessName: string;
  gstin?: string;
  pan?: string;
  totalOutstanding: number;
  isInternalAdjustment?: boolean; // True for non-customer internal ledgers (e.g. suspense, stock shortage)
  // UI standard buckets
  bucket0_30: number;
  bucket31_60: number;
  bucket61_90: number;
  bucket90Plus: number;
  // SOW specific buckets
  bucket30_45?: number;
  bucket45_60?: number;
  bucket60Plus?: number;
  // Monthly snapshot breakdown from Marg ERP
  monthlyBreakdown?: {
    march2026?: number;
    feb2026?: number;
    jan2026?: number;
    dec2025?: number;
    nov2025?: number;
    oct2025?: number;
    olderSep2025?: number;
  };
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskRationale?: string;
  dataSourceType: 'monthly_snapshot' | 'invoice_level';
  notice?: string;
  groupUid?: string;
  customAttributes?: Record<string, any>;
  lastUpdated: string;
}

export interface PaymentEntity {
  id: string;
  date: string; // ISO-8601
  voucherNo?: string;
  accountName: string;
  type: 'receipt' | 'payment';
  amount: number;
  balance: number;
  drCr: 'Dr' | 'Cr';
  particulars?: string;
  customAttributes?: Record<string, any>;
  sourceSystem: string;
}
