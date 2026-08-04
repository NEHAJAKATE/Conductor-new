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
  unifiedUuid: string;
  goldenUuid?: string; // legacy alias
  linkedAt: string;
  confidenceScore: number;
  reason: LinkageReason;
}
