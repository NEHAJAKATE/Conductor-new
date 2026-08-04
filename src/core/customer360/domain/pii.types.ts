export type PiiClassification =
  | 'EMAIL'
  | 'PHONE'
  | 'PAN'
  | 'AADHAAR'
  | 'IFSC'
  | 'BANK_ACCOUNT'
  | 'CREDIT_CARD'
  | 'PASSPORT'
  | 'DOB'
  | 'ADDRESS'
  | 'NAME'
  | 'NONE';

export interface PiiFieldTag {
  columnName: string;
  classification: PiiClassification;
  confidence: number;
}
