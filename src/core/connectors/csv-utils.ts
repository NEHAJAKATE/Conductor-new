import fs from 'fs';
import path from 'path';
import { parse, type Options as ParseOptions } from 'csv-parse';
import { SchemaDefinition, SchemaField } from './connector';
import { Readable } from 'stream';

type InferredType = 'integer' | 'number' | 'boolean' | 'timestamp' | 'string';

const TYPE_PRIORITY: InferredType[] = ['boolean', 'integer', 'number', 'timestamp', 'string'];
const CANDIDATE_DELIMITERS = [',', ';', '\t', '|'];

function parseValue(value: string): string {
  return value.trim();
}

function inferType(values: string[]): InferredType {
  if (values.length === 0) {
    return 'string';
  }

  let currentType: InferredType = 'boolean';

  for (const value of values) {
    if (value === '') {
      continue;
    }
    const valType = detectSingleValueType(value);
    currentType = mergeTypes(currentType, valType);
    if (currentType === 'string') {
      break;
    }
  }

  return currentType;
}

function detectSingleValueType(value: string): InferredType {
  if (/^(true|false)$/i.test(value)) {
    return 'boolean';
  }

  if (/^-?\d+$/.test(value)) {
    return 'integer';
  }

  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return 'number';
  }

  const parsedDate = Date.parse(value);
  if (!Number.isNaN(parsedDate) && value.length > 5 && (value.includes('-') || value.includes('/') || value.includes(':'))) {
    return 'timestamp';
  }

  return 'string';
}

function mergeTypes(typeA: InferredType, typeB: InferredType): InferredType {
  if (typeA === typeB) {
    return typeA;
  }

  const indexA = TYPE_PRIORITY.indexOf(typeA);
  const indexB = TYPE_PRIORITY.indexOf(typeB);
  return TYPE_PRIORITY[Math.max(indexA, indexB)];
}

export async function assertFileReadable(filePath: string): Promise<void> {
  if (filePath.startsWith('r2://') || filePath.startsWith('s3://') || filePath.startsWith('gcs://') || filePath.startsWith('azure://')) return;
  await fs.promises.access(filePath, fs.constants.R_OK);
}

export async function detectDelimiter(source: string | Readable, sampleSize = 8192): Promise<string> {
  let sample = '';
  if (typeof source === 'string') {
    const isPath = source.endsWith('.csv') || source.startsWith('uploads/') || source.startsWith('sample-data/') || source.startsWith('r2://') || source.startsWith('s3://');
    if (!isPath) {
      sample = source;
    } else {
      try {
        const handle = await fs.promises.open(source, 'r');
        const buffer = Buffer.alloc(sampleSize);
        await handle.read(buffer, 0, sampleSize, 0);
        await handle.close();
        sample = buffer.toString('utf-8');
      } catch {
        sample = ',';
      }
    }
  } else {
    sample = await new Promise((resolve) => {
      let data = '';
      source.on('data', (chunk) => {
        data += chunk.toString();
        if (data.length >= sampleSize) {
          source.destroy();
          resolve(data);
        }
      });
      source.on('end', () => resolve(data));
      source.on('error', () => resolve(data));
    });
  }

  let bestDelimiter = ',';
  let bestScore = -Infinity;

  for (const delimiter of CANDIDATE_DELIMITERS) {
    const lines = sample.split(/\r?\n/).slice(0, 5);
    const counts = lines.map((line) => line.split(delimiter).length);
    const score = counts.reduce((sum, count) => sum + count, 0) - Math.abs(counts[0] - counts[counts.length - 1]);

    if (score > bestScore) {
      bestScore = score;
      bestDelimiter = delimiter;
    }
  }

  return bestDelimiter;
}

interface CsvSampleOptions {
  delimiter?: string;
  encoding?: BufferEncoding;
  header?: boolean;
  limit?: number;
  fileSize?: number;
}

export async function sampleCsvRows(
  source: string | Readable,
  options: CsvSampleOptions = {}
): Promise<{ headers: string[]; rows: string[][]; delimiter: string }> {
  let delimiter = options.delimiter;
  if (!delimiter) {
    if (typeof source === 'string') {
      delimiter = await detectDelimiter(source);
    } else {
      delimiter = ',';
    }
  }
  const encoding = options.encoding ?? 'utf8';
  const parserOptions: ParseOptions = {
    delimiter,
    bom: true,
    relaxQuotes: true,
    trim: true,
    skip_empty_lines: true,
  };

  const headers: string[] = [];
  const rows: string[][] = [];

  return new Promise((resolve, reject) => {
    let recordCount = 0;
    
    let stream: Readable;
    if (typeof source === 'string') {
      const isPath = source.endsWith('.csv') || source.startsWith('uploads/') || source.startsWith('sample-data/') || source.startsWith('r2://') || source.startsWith('s3://');
      if (!isPath) {
        let textContent = source;
        let lines = textContent.split(/\r?\n/);
        if (lines.length > 1) {
          lines.pop();
        }
        textContent = lines.join('\n');
        
        const quoteCount = (textContent.match(/"/g) || []).length;
        if (quoteCount % 2 !== 0) {
          textContent += '"';
        }
        stream = Readable.from(textContent);
      } else {
        stream = fs.createReadStream(source, { encoding });
      }
    } else {
      stream = source;
    }

    const parser = parse(parserOptions);
    stream.pipe(parser);

    const limit = options.limit ?? 20;
    parser.on('readable', () => {
      let record: string[] | null;
      while ((record = parser.read()) !== null) {
        if (recordCount < limit) {
          rows.push(record);
        }
        recordCount += 1;
      }
    });

    parser.on('end', () => {
      if (options.header ?? true) {
        if (rows.length === 0) {
          return reject(new Error('CSV file is empty'));
        }
        const firstRow = rows.shift() ?? [];
        const seen = new Set<string>();
        for (let index = 0; index < firstRow.length; index += 1) {
          let rawHeader = firstRow[index]?.trim() || '';
          if (!rawHeader) {
            rawHeader = `column_${index + 1}`;
          }
          let uniqueHeader = rawHeader;
          let suffix = 2;
          while (seen.has(uniqueHeader)) {
            uniqueHeader = `${rawHeader}_${suffix}`;
            suffix += 1;
          }
          seen.add(uniqueHeader);
          headers.push(uniqueHeader);
        }
      } else {
        const columnCount = rows[0]?.length ?? 0;
        for (let index = 0; index < columnCount; index += 1) {
          headers.push(`column_${index + 1}`);
        }
      }
      resolve({ headers, rows, delimiter });
    });

    parser.on('error', reject);
    stream.on('error', reject);
  });
}

export function inferSchema(headers: string[], rows: string[][]): SchemaDefinition {
  const fieldValues: Record<string, string[]> = {};
  headers.forEach((header) => {
    fieldValues[header] = [];
  });

  for (const row of rows) {
    for (let index = 0; index < headers.length; index += 1) {
      const header = headers[index];
      const value = parseValue(row[index] ?? '');
      fieldValues[header].push(value);
    }
  }

  const fields: SchemaField[] = headers.map((header) => {
    const values = fieldValues[header];
    const detectedType = inferType(values);
    const nullable = values.some((value) => value === '');
    return {
      name: header,
      type: detectedType,
      nullable,
      metadata: {
        sampleValues: values.slice(0, 3),
        uniqueSampleValues: Array.from(new Set(values.slice(0, 20))).slice(0, 5),
      },
    };
  });

  const primaryKeys = headers.filter((header) => {
    const values = fieldValues[header].filter((value) => value !== '');
    const uniqueCount = new Set(values).size;
    return values.length > 0 && uniqueCount === values.length && values.length === rows.length;
  });

  return {
    fields,
    version: '1.0',
    raw: {
      headerCount: headers.length,
      sampleRows: Math.min(rows.length, 20),
      primaryKeys,
    },
  };
}

export function validateCsvSample(headers: string[], rows: string[][]): { duplicateColumns: string[]; missingValues: number; rowCount: number; hasMalformedRows: boolean; } {
  const duplicateColumns = headers.filter((value, index) => headers.indexOf(value) !== index);
  let missingValues = 0;
  let rowCount = 0;
  let hasMalformedRows = false;

  for (const row of rows) {
    rowCount += 1;
    if (row.length !== headers.length) {
      hasMalformedRows = true;
    }
    for (const cell of row) {
      if (cell.trim() === '') {
        missingValues += 1;
      }
    }
  }

  return { duplicateColumns, missingValues, rowCount, hasMalformedRows };
}

export async function loadCsvPreview(
  source: string | Readable,
  datasetId: string,
  limit: number,
  options: CsvSampleOptions = {}
): Promise<{ rows: Array<Record<string, any>>; schema: SchemaDefinition; metadata: Record<string, any> }> {
  const sample = await sampleCsvRows(source, { ...options, limit: Math.max(limit, 20) });
  const schema = inferSchema(sample.headers, sample.rows);
  const rows = sample.rows.slice(0, limit).map((row) => {
    const item: Record<string, any> = {};
    sample.headers.forEach((header, index) => {
      item[header] = row[index] ?? null;
    });
    return item;
  });

  let fileSize = options.fileSize ?? 10240;
  if (typeof source === 'string' && !source.startsWith('r2://') && !source.startsWith('s3://')) {
    try {
      fileSize = (await fs.promises.stat(source)).size;
    } catch {}
  }

  return {
    rows,
    schema,
    metadata: {
      delimiter: sample.delimiter,
      sampleSize: rows.length,
      datasetId,
      fileSize,
      rowCount: sample.rows.length,
      headerCount: sample.headers.length,
      source: 'csv',
      encoding: options.encoding ?? 'utf-8',
    },
  };
}
