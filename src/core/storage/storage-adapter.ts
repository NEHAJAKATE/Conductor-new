import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';

export interface UploadResult {
  bucket: string;
  key: string;
  etag?: string;
  size: number;
  contentType: string;
  uploadTime: string;
}

export interface StorageAdapter {
  uploadStream(stream: Readable, key: string, contentType: string): Promise<UploadResult>;
  getReadStream(key: string): Promise<Readable>;
  readFirstLines(key: string, maxLines: number): Promise<string>;
}

// 1. Local Storage Adapter
export class LocalStorageAdapter implements StorageAdapter {
  private baseDir = path.resolve(process.cwd(), 'data', 'local_storage');

  constructor() {
    fs.mkdirSync(this.baseDir, { recursive: true });
  }

  async uploadStream(stream: Readable, key: string, contentType: string): Promise<UploadResult> {
    const targetPath = path.join(this.baseDir, key.replace(/\//g, '_'));
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    const writeStream = fs.createWriteStream(targetPath);
    let size = 0;

    await new Promise<void>((resolve, reject) => {
      stream.on('data', (chunk) => { size += chunk.length; });
      stream.pipe(writeStream);
      writeStream.on('finish', () => resolve());
      writeStream.on('error', reject);
      stream.on('error', reject);
    });

    return {
      bucket: 'local-lakehouse',
      key,
      etag: `local-hash-${Date.now()}`,
      size,
      contentType,
      uploadTime: new Date().toISOString(),
    };
  }

  async getReadStream(key: string): Promise<Readable> {
    if (key.startsWith('sample-data/')) {
      return fs.createReadStream(path.resolve(process.cwd(), 'data', key.replace(/^sample-data\/?/, '')));
    }
    const targetPath = path.join(this.baseDir, key.replace(/\//g, '_'));
    if (!fs.existsSync(targetPath)) {
      throw new Error(`Local storage file not found: ${targetPath}`);
    }
    return fs.createReadStream(targetPath);
  }

  async readFirstLines(key: string, maxLines: number): Promise<string> {
    const stream = await this.getReadStream(key);
    return readStreamLines(stream, maxLines);
  }
}

// 2. Cloudflare R2 Storage Adapter
export class R2StorageAdapter implements StorageAdapter {
  private client: S3Client | null = null;
  private bucket: string;
  private isSimulation = true;
  private simulationDir = path.resolve(process.cwd(), 'data', 'r2_simulation');

  constructor(config: { accessKeyId?: string; secretAccessKey?: string; endpoint?: string; region?: string; bucket?: string }) {
    this.bucket = config.bucket || process.env.R2_BUCKET || 'conductor-raw-lake';
    const accessKeyId = config.accessKeyId || process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = config.secretAccessKey || process.env.R2_SECRET_ACCESS_KEY;
    const endpoint = config.endpoint || process.env.R2_ENDPOINT;
    const region = config.region || process.env.R2_REGION || 'auto';

    if (accessKeyId && secretAccessKey && endpoint) {
      this.client = new S3Client({
        region,
        endpoint,
        credentials: { accessKeyId, secretAccessKey },
        forcePathStyle: true,
      });
      this.isSimulation = false;
    } else {
      fs.mkdirSync(this.simulationDir, { recursive: true });
    }
  }

  async uploadStream(stream: Readable, key: string, contentType: string): Promise<UploadResult> {
    if (!this.isSimulation && this.client) {
      const chunks: Buffer[] = [];
      let size = 0;
      for await (const chunk of stream) {
        chunks.push(chunk);
        size += chunk.length;
      }
      const buffer = Buffer.concat(chunks);
      await this.client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }));
      return {
        bucket: this.bucket,
        key,
        size,
        contentType,
        uploadTime: new Date().toISOString(),
      };
    } else {
      const targetPath = path.join(this.simulationDir, key.replace(/\//g, '_'));
      const writeStream = fs.createWriteStream(targetPath);
      let size = 0;
      await new Promise<void>((resolve, reject) => {
        stream.on('data', (chunk) => { size += chunk.length; });
        stream.pipe(writeStream);
        writeStream.on('finish', () => resolve());
        writeStream.on('error', reject);
      });
      return {
        bucket: 'simulated-r2',
        key,
        size,
        contentType,
        uploadTime: new Date().toISOString(),
      };
    }
  }

  async getReadStream(key: string): Promise<Readable> {
    if (key.startsWith('sample-data/')) {
      return fs.createReadStream(path.resolve(process.cwd(), 'data', key.replace(/^sample-data\/?/, '')));
    }
    if (!this.isSimulation && this.client) {
      const response = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      return response.Body as Readable;
    }
    const targetPath = path.join(this.simulationDir, key.replace(/\//g, '_'));
    return fs.createReadStream(targetPath);
  }

  async readFirstLines(key: string, maxLines: number): Promise<string> {
    return readStreamLines(await this.getReadStream(key), maxLines);
  }
}

// 3. AWS S3 Storage Adapter
export class S3StorageAdapter implements StorageAdapter {
  private client: S3Client | null = null;
  private bucket: string;
  private isSimulation = true;
  private simulationDir = path.resolve(process.cwd(), 'data', 's3_simulation');

  constructor(config: { accessKeyId?: string; secretAccessKey?: string; region?: string; bucket?: string; endpoint?: string }) {
    this.bucket = config.bucket || 'conductor-s3-lake';
    const accessKeyId = config.accessKeyId;
    const secretAccessKey = config.secretAccessKey;
    const region = config.region || 'us-east-1';
    const endpoint = config.endpoint;

    if (accessKeyId && secretAccessKey) {
      this.client = new S3Client({
        region,
        credentials: { accessKeyId, secretAccessKey },
        ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
      });
      this.isSimulation = false;
    } else {
      fs.mkdirSync(this.simulationDir, { recursive: true });
    }
  }

  async uploadStream(stream: Readable, key: string, contentType: string): Promise<UploadResult> {
    if (!this.isSimulation && this.client) {
      const chunks: Buffer[] = [];
      let size = 0;
      for await (const chunk of stream) {
        chunks.push(chunk);
        size += chunk.length;
      }
      const buffer = Buffer.concat(chunks);
      await this.client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }));
      return {
        bucket: this.bucket,
        key,
        size,
        contentType,
        uploadTime: new Date().toISOString(),
      };
    } else {
      const targetPath = path.join(this.simulationDir, key.replace(/\//g, '_'));
      const writeStream = fs.createWriteStream(targetPath);
      let size = 0;
      await new Promise<void>((resolve, reject) => {
        stream.on('data', (chunk) => { size += chunk.length; });
        stream.pipe(writeStream);
        writeStream.on('finish', () => resolve());
        writeStream.on('error', reject);
      });
      return {
        bucket: 'simulated-s3',
        key,
        size,
        contentType,
        uploadTime: new Date().toISOString(),
      };
    }
  }

  async getReadStream(key: string): Promise<Readable> {
    if (key.startsWith('sample-data/')) {
      return fs.createReadStream(path.resolve(process.cwd(), 'data', key.replace(/^sample-data\/?/, '')));
    }
    if (!this.isSimulation && this.client) {
      const response = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      return response.Body as Readable;
    }
    const targetPath = path.join(this.simulationDir, key.replace(/\//g, '_'));
    return fs.createReadStream(targetPath);
  }

  async readFirstLines(key: string, maxLines: number): Promise<string> {
    return readStreamLines(await this.getReadStream(key), maxLines);
  }
}

// 4. Azure Blob Storage Adapter (Simulation Template)
export class AzureBlobStorageAdapter implements StorageAdapter {
  private simulationDir = path.resolve(process.cwd(), 'data', 'azure_simulation');

  constructor() {
    fs.mkdirSync(this.simulationDir, { recursive: true });
  }

  async uploadStream(stream: Readable, key: string, contentType: string): Promise<UploadResult> {
    const targetPath = path.join(this.simulationDir, key.replace(/\//g, '_'));
    const writeStream = fs.createWriteStream(targetPath);
    let size = 0;
    await new Promise<void>((resolve, reject) => {
      stream.on('data', (chunk) => { size += chunk.length; });
      stream.pipe(writeStream);
      writeStream.on('finish', () => resolve());
      writeStream.on('error', reject);
    });
    return {
      bucket: 'simulated-azure-blob',
      key,
      size,
      contentType,
      uploadTime: new Date().toISOString(),
    };
  }

  async getReadStream(key: string): Promise<Readable> {
    if (key.startsWith('sample-data/')) {
      return fs.createReadStream(path.resolve(process.cwd(), 'data', key.replace(/^sample-data\/?/, '')));
    }
    const targetPath = path.join(this.simulationDir, key.replace(/\//g, '_'));
    return fs.createReadStream(targetPath);
  }

  async readFirstLines(key: string, maxLines: number): Promise<string> {
    return readStreamLines(await this.getReadStream(key), maxLines);
  }
}

// 5. Google Cloud Storage Adapter (Simulation Template)
export class GcsStorageAdapter implements StorageAdapter {
  private simulationDir = path.resolve(process.cwd(), 'data', 'gcs_simulation');

  constructor() {
    fs.mkdirSync(this.simulationDir, { recursive: true });
  }

  async uploadStream(stream: Readable, key: string, contentType: string): Promise<UploadResult> {
    const targetPath = path.join(this.simulationDir, key.replace(/\//g, '_'));
    const writeStream = fs.createWriteStream(targetPath);
    let size = 0;
    await new Promise<void>((resolve, reject) => {
      stream.on('data', (chunk) => { size += chunk.length; });
      stream.pipe(writeStream);
      writeStream.on('finish', () => resolve());
      writeStream.on('error', reject);
    });
    return {
      bucket: 'simulated-gcs-bucket',
      key,
      size,
      contentType,
      uploadTime: new Date().toISOString(),
    };
  }

  async getReadStream(key: string): Promise<Readable> {
    if (key.startsWith('sample-data/')) {
      return fs.createReadStream(path.resolve(process.cwd(), 'data', key.replace(/^sample-data\/?/, '')));
    }
    const targetPath = path.join(this.simulationDir, key.replace(/\//g, '_'));
    return fs.createReadStream(targetPath);
  }

  async readFirstLines(key: string, maxLines: number): Promise<string> {
    return readStreamLines(await this.getReadStream(key), maxLines);
  }
}

// Helper function to read first N lines from a readable stream
function readStreamLines(stream: Readable, maxLines: number): Promise<string> {
  return new Promise((resolve, reject) => {
    let buffer = '';
    let finished = false;

    stream.on('data', (chunk) => {
      if (finished) return;
      buffer += chunk.toString();
      const lines = buffer.split(/\r?\n/);
      if (lines.length > maxLines) {
        finished = true;
        stream.destroy();
        resolve(lines.slice(0, maxLines).join('\n'));
      }
    });

    stream.on('end', () => {
      if (!finished) resolve(buffer);
    });

    stream.on('error', (err) => {
      if (!finished) reject(err);
    });
  });
}

// Factory to resolve storage adapter dynamically
export class StorageAdapterFactory {
  static create(type: string, config: any = {}): StorageAdapter {
    switch (type) {
      case 'local':
        return new LocalStorageAdapter();
      case 's3':
        return new S3StorageAdapter(config);
      case 'azure':
        return new AzureBlobStorageAdapter();
      case 'gcs':
        return new GcsStorageAdapter();
      case 'r2':
      default:
        return new R2StorageAdapter(config);
    }
  }
}
