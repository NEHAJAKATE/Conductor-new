export interface IdentityMatch {
  rule: string;
  matchedField: string;
  matchedValue: string;
  confidenceContribution: number;
}

export interface LinkageReason {
  sourceSystem: string;
  matchingKeys: string[];
  confidenceScore: number;
  explanation: string;
}

export interface IdentityLink {
  sourceId: string;
  sourceSystem: string; // CRM, CSV, Financial File, etc.
  goldenUuid: string;
  linkedAt: string;
  confidenceScore: number;
  reason: LinkageReason;
}
