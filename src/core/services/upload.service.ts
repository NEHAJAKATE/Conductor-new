import { Readable } from 'stream';
import { R2Service, R2UploadResult } from './r2.service';

export class UploadService {
  constructor(private readonly r2Service: R2Service) {}

  async uploadFileStream(stream: Readable, originalName: string, contentType: string): Promise<R2UploadResult> {
    const sanitized = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `uploads/${Date.now()}-${sanitized}`;
    console.log(`[UploadService] Initiating direct stream upload to R2 for key: ${key}`);
    return this.r2Service.uploadStream(stream, key, contentType);
  }
}
