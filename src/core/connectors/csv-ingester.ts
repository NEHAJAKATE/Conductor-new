import fs from 'fs';
import { parse, type Options as ParseOptions } from 'csv-parse';
import { RawStore } from '@/infrastructure/storage/raw-store';
import { IngestOptions, SchemaDefinition } from './connector';
import { Readable } from 'stream';

export class CsvIngester {
  private readonly rawStore = new RawStore();

  constructor(private readonly r2Service?: any) {}

  async ingest(filePath: string, schema: SchemaDefinition, options: IngestOptions): Promise<{ path: string; rows: number }> {
    const delimiter = options.destination?.delimiter ?? ',';
    const encoding = (options.destination?.encoding ?? 'utf8') as BufferEncoding;
    const header = options.destination?.header ?? true;
    const parserOptions: ParseOptions = {
      delimiter,
      bom: true,
      relaxQuotes: true,
      trim: true,
      skip_empty_lines: true,
      from_line: header ? 2 : 1,
    };

    let rowCount = 0;
    const records: Array<Record<string, any>> = [];
    
    let stream: Readable;
    if (filePath.startsWith('r2://') && this.r2Service) {
      const objectKey = filePath.replace(/^r2:\/\/[^\/]+\//, '');
      console.log(`[CsvIngester] Streaming ingestion source directly from R2 objectKey: ${objectKey}`);
      stream = await this.r2Service.getReadStream(objectKey);
    } else {
      console.log(`[CsvIngester] Streaming ingestion source from local file: ${filePath}`);
      stream = fs.createReadStream(filePath, { encoding });
    }

    const parser = parse(parserOptions);

    return new Promise((resolve, reject) => {
      stream.pipe(parser);

      parser.on('readable', () => {
        let row: string[] | null;
        while ((row = parser.read()) !== null) {
          rowCount += 1;
          const record: Record<string, any> = {};
          for (let index = 0; index < schema.fields.length; index += 1) {
            record[schema.fields[index].name] = row[index] ?? null;
          }
          records.push(record);
        }
      });

      parser.on('end', async () => {
        try {
          const result = await this.rawStore.writeRecords(options.destination?.datasetId ?? 'csv', records);
          resolve({ path: result.filePath, rows: result.rowCount });
        } catch (error) {
          reject(error);
        }
      });

      parser.on('error', reject);
      stream.on('error', reject);
    });
  }
}
