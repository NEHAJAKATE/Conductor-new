import { CanonicalMappingService } from '../mapping/canonical-mapping.service';

export class TransformationService {
  async transform(records: Array<Record<string, any>>, schema: any): Promise<Array<Record<string, any>>> {
    console.log(`[TransformationService] Running clean transformations on ${records.length} records...`);
    const cleanRecords: Array<Record<string, any>> = [];

    for (let rIdx = 0; rIdx < records.length; rIdx += 1) {
      const record = records[rIdx];
      const cleanRecord: Record<string, any> = {};

      for (const [key, value] of Object.entries(record)) {
        let cleanVal = value;

        if (typeof cleanVal === 'string') {
          cleanVal = cleanVal.trim().replace(/\s+/g, ' ');

          if (key.toLowerCase().includes('email') && cleanVal.includes('@')) {
            cleanVal = cleanVal.toLowerCase();
          }

          if (key.toLowerCase().includes('phone') || key.toLowerCase().includes('mobile')) {
            cleanVal = cleanVal.replace(/[^0-9+]/g, '');
          }

          if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time') || key === 'C_DATE') {
            cleanVal = CanonicalMappingService.parseDate(cleanVal);
          }
        }

        if (cleanVal === undefined || cleanVal === '' || cleanVal === null) {
          cleanVal = null;
        }

        const fieldDef = schema?.fields?.find((f: any) => f.name === key);
        if (fieldDef && cleanVal !== null) {
          if (fieldDef.type === 'integer') {
            const parsedInt = parseInt(String(cleanVal).replace(/,/g, ''), 10);
            cleanVal = Number.isNaN(parsedInt) ? null : parsedInt;
          } else if (fieldDef.type === 'number') {
            const parsedFloat = parseFloat(String(cleanVal).replace(/,/g, ''));
            cleanVal = Number.isNaN(parsedFloat) ? null : parsedFloat;
          } else if (fieldDef.type === 'boolean') {
            cleanVal = String(cleanVal).toLowerCase() === 'true' || cleanVal === true || cleanVal === 1 || cleanVal === '1';
          }
        }

        cleanRecord[key] = cleanVal;
      }

      cleanRecords.push(cleanRecord);
    }

    return cleanRecords;
  }
}
