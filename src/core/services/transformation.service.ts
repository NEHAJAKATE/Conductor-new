export class TransformationService {
  async transform(records: Array<Record<string, any>>, schema: any): Promise<Array<Record<string, any>>> {
    console.log(`[TransformationService] Running clean transformations on ${records.length} records...`);
    const cleanRecords: Array<Record<string, any>> = [];

    for (let rIdx = 0; rIdx < records.length; rIdx += 1) {
      const record = records[rIdx];
      const cleanRecord: Record<string, any> = {};
      let isInvalid = false;

      for (const [key, value] of Object.entries(record)) {
        let cleanVal = value;

        if (typeof cleanVal === 'string') {
          cleanVal = cleanVal.trim().replace(/\s+/g, ' ');

          if (key.toLowerCase().includes('email')) {
            cleanVal = cleanVal.toLowerCase();
          }

          if (key.toLowerCase().includes('phone')) {
            cleanVal = cleanVal.replace(/[^0-9+]/g, '');
          }

          if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) {
            const parsedDate = Date.parse(cleanVal);
            if (!Number.isNaN(parsedDate)) {
              cleanVal = new Date(parsedDate).toISOString();
            }
          }
        }

        if (cleanVal === undefined || cleanVal === '' || cleanVal === null) {
          cleanVal = null;
        }

        const fieldDef = schema?.fields?.find((f: any) => f.name === key);
        if (fieldDef && cleanVal !== null) {
          if (fieldDef.type === 'integer') {
            const parsedInt = parseInt(cleanVal, 10);
            cleanVal = Number.isNaN(parsedInt) ? null : parsedInt;
          } else if (fieldDef.type === 'number') {
            const parsedFloat = parseFloat(cleanVal);
            cleanVal = Number.isNaN(parsedFloat) ? null : parsedFloat;
          } else if (fieldDef.type === 'boolean') {
            cleanVal = String(cleanVal).toLowerCase() === 'true' || cleanVal === true || cleanVal === 1 || cleanVal === '1';
          }
        }

        if (key.toLowerCase() === 'email' && cleanVal !== null) {
          if (!cleanVal.includes('@')) {
            isInvalid = true;
          }
        }

        cleanRecord[key] = cleanVal;
      }

      if (!isInvalid) {
        cleanRecords.push(cleanRecord);
      } else {
        console.log(`[TransformationService] Filtered out malformed record at row index ${rIdx}`);
      }
    }

    return cleanRecords;
  }
}
