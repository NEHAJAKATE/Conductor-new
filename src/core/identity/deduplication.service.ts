import { MasterProfile } from './identity.service';

export interface DeduplicateResult {
  deduplicatedRecords: Array<Record<string, any>>;
  duplicatesCount: number;
  mapping: Record<string, string>;
}

export class DeduplicationService {
  async deduplicate(profiles: MasterProfile[]): Promise<DeduplicateResult> {
    console.log(`[DeduplicationService] Running deduplication merge rules on ${profiles.length} master profiles...`);
    const deduplicatedRecords: Array<Record<string, any>> = [];
    const mapping: Record<string, string> = {};
    let duplicatesCount = 0;

    for (const profile of profiles) {
      const records = profile.records;
      if (records.length === 0) continue;

      // Exact & Rule-Based Match (Recency + Quality check)
      let primaryRecord = records[0];
      let bestQualityScore = this.calculateQualityScore(primaryRecord);
      let latestTime = this.extractTimestamp(primaryRecord);

      for (let i = 1; i < records.length; i += 1) {
        const record = records[i];
        const qualityScore = this.calculateQualityScore(record);
        const time = this.extractTimestamp(record);

        let swap = false;
        
        // Exact matching logic - prefer higher quality score first
        if (qualityScore > bestQualityScore) {
          swap = true;
        } else if (qualityScore === bestQualityScore && time > latestTime) {
          swap = true;
        }

        // Fuzzy similarity check logs (Section 12)
        if (this.isFuzzySimilar(primaryRecord, record)) {
          console.log(`[DeduplicationService] Fuzzy similarity matching detected between records.`);
        }

        if (swap) {
          primaryRecord = record;
          bestQualityScore = qualityScore;
          latestTime = time;
        }
        duplicatesCount += 1;
      }

      // Normalized & Attribute Merging logic
      const mergedRecord = { ...primaryRecord };
      const lineage: string[] = [primaryRecord.id || primaryRecord.email || 'primary'];

      for (const record of records) {
        if (record === primaryRecord) continue;
        lineage.push(record.id || record.email || 'duplicate');

        for (const [key, value] of Object.entries(record)) {
          // If primary has a null/empty value, fill it in from a duplicate record (Attribute Merging)
          if ((mergedRecord[key] === null || mergedRecord[key] === undefined || mergedRecord[key] === '') && value !== null && value !== undefined && value !== '') {
            mergedRecord[key] = value;
          }
        }
      }

      // Preserve lineage metadata
      mergedRecord._masterProfileId = profile.masterId;
      mergedRecord._ingestionLineage = lineage.join(' -> ');
      mergedRecord._matchingReason = profile.matchingReason;
      mergedRecord._confidenceScore = profile.confidenceScore;

      deduplicatedRecords.push(mergedRecord);

      records.forEach((rec, idx) => {
        const uniqueKey = rec.id || rec.email || `row-${idx}`;
        mapping[uniqueKey] = profile.masterId;
      });
    }

    return {
      deduplicatedRecords,
      duplicatesCount,
      mapping,
    };
  }

  private calculateQualityScore(record: Record<string, any>): number {
    let score = 0;
    for (const [key, value] of Object.entries(record)) {
      if (value !== null && value !== undefined && value !== '') {
        score += 1;
      }
      if (['email', 'phone', 'mobile'].includes(key.toLowerCase()) && value) {
        score += 2;
      }
      if (['crm_id', 'customer_id', 'id'].includes(key.toLowerCase()) && value) {
        score += 3; // higher priority for solid IDs
      }
    }
    return score;
  }

  private extractTimestamp(record: Record<string, any>): number {
    for (const [key, value] of Object.entries(record)) {
      if (['date', 'time', 'timestamp', 'created_at', 'updated_at', 'hire_date', 'order_date'].includes(key.toLowerCase()) && value) {
        const parsed = Date.parse(value);
        if (!Number.isNaN(parsed)) return parsed;
      }
    }
    return 0;
  }

  // Simple string-distance fuzzy similarity checks for names or addresses
  private isFuzzySimilar(recordA: Record<string, any>, recordB: Record<string, any>): boolean {
    const nameA = String(recordA.name || '').toLowerCase().trim();
    const nameB = String(recordB.name || '').toLowerCase().trim();
    if (!nameA || !nameB) return false;
    
    // Levenshtein / Jaro-Winkler style check (simple substring check for simulation)
    if (nameA === nameB) return true;
    if (nameA.startsWith(nameB) || nameB.startsWith(nameA)) return true;
    return false;
  }
}
