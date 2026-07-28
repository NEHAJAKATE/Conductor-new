import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';

export interface R2UploadResult {
  bucket: string;
  key: string;
  etag?: string;
  size: number;
  contentType: string;
  uploadTime: string;
}

export class R2Service {
  private client: S3Client | null = null;
  private bucket: string = '';
  private simulationDir = path.resolve(process.cwd(), 'data', 'r2_simulation');
  private isSimulation = true;

  constructor() {
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const endpoint = process.env.R2_ENDPOINT;
    const region = process.env.R2_REGION || 'auto';
    this.bucket = process.env.R2_BUCKET || 'conductor-raw-lake';

    if (accessKeyId && secretAccessKey && endpoint) {
      this.client = new S3Client({
        region,
        endpoint,
        credentials: { accessKeyId, secretAccessKey },
        forcePathStyle: true,
      });
      this.isSimulation = false;
      console.log(`[R2Service] Initialized real Cloudflare R2 Client. Bucket: ${this.bucket}`);
    } else {
      console.log(`[R2Service] Environment variables missing. Activating workspace simulation directory: ${this.simulationDir}`);
      fs.mkdirSync(this.simulationDir, { recursive: true });
    }
  }

  async uploadStream(stream: Readable, key: string, contentType: string): Promise<R2UploadResult> {
    const uploadTime = new Date().toISOString();

    if (!this.isSimulation && this.client) {
      const chunks: Buffer[] = [];
      let size = 0;
      for await (const chunk of stream) {
        chunks.push(chunk);
        size += chunk.length;
      }
      const buffer = Buffer.concat(chunks);

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      });

      const response = await this.client.send(command);
      return {
        bucket: this.bucket,
        key,
        etag: response.ETag?.replace(/"/g, ''),
        size,
        contentType,
        uploadTime,
      };
    } else {
      const targetPath = path.join(this.simulationDir, key.replace(/\//g, '_'));
      const writeStream = fs.createWriteStream(targetPath);
      let size = 0;

      await new Promise<void>((resolve, reject) => {
        stream.on('data', (chunk) => {
          size += chunk.length;
        });
        stream.pipe(writeStream);
        writeStream.on('finish', () => resolve());
        writeStream.on('error', reject);
        stream.on('error', reject);
      });

      return {
        bucket: 'simulated-r2-bucket',
        key,
        etag: `sim-etag-${Date.now()}`,
        size,
        contentType,
        uploadTime,
      };
    }
  }

  async getReadStream(key: string): Promise<Readable> {
    if (key.startsWith('sample-data/')) {
      const samplePath = path.resolve(process.cwd(), key);
      return fs.createReadStream(samplePath);
    }

    if (!this.isSimulation && this.client) {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      const response = await this.client.send(command);
      if (!response.Body) {
        throw new Error(`R2 Object '${key}' has empty body`);
      }
      return response.Body as Readable;
    } else {
      const targetPath = path.join(this.simulationDir, key.replace(/\//g, '_'));
      if (!fs.existsSync(targetPath)) {
        throw new Error(`R2 simulated file not found: ${targetPath}`);
      }
      return fs.createReadStream(targetPath);
    }
  }

  async readFirstLines(key: string, maxLines = 105): Promise<string> {
    const stream = await this.getReadStream(key);
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
        if (!finished) {
          resolve(buffer);
        }
      });

      stream.on('error', (err) => {
        if (!finished) reject(err);
      });
    });
  }
}
