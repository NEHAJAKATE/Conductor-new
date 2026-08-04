import { NextResponse, NextRequest } from 'next/server';
import { Readable } from 'stream';
import { StorageAdapterFactory } from '@/core/storage/storage-adapter';
import { bootstrap } from '@/core/services/bootstrap';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ connectorType: string }> }
) {
  const { connectorType } = await params;
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const storageType = searchParams.get('storageType') || 'r2';
    let storageConfig: any = {};
    const configParam = searchParams.get('storageConfig');
    if (configParam) {
      try {
        storageConfig = JSON.parse(configParam);
      } catch {}
    }

    const adapter = StorageAdapterFactory.create(storageType, storageConfig);
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const bufferStream = Readable.from(buffer);
    
    const sanitized = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `uploads/${Date.now()}-${sanitized}`;
    
    const uploadRes = await adapter.uploadStream(
      bufferStream,
      key,
      file.type || 'text/csv'
    );

    const lowercaseName = file.name.toLowerCase();
    const isCdpDataset = lowercaseName.includes('identity') || 
                         lowercaseName.includes('behavior') || 
                         lowercaseName.includes('financial') || 
                         lowercaseName.includes('crm') || 
                         lowercaseName.includes('billing') || 
                         lowercaseName.includes('invoice') || 
                         lowercaseName.includes('activity');
                         
    if (isCdpDataset) {
      try {
        const { datasetParserService } = require('@/core/customer360/services/dataset-parser.service');
        await datasetParserService.parseAndIngest(buffer, file.name);
        console.log(`[Upload Ingest] Successfully auto-ingested CDP file ${file.name}.`);
      } catch (ingestErr) {
        console.error(`[Upload Ingest] Warning: Failed to parse and ingest CDP dataset:`, ingestErr);
      }
    }

    const context = bootstrap();
    const metadata = await context.metadataService.registerMetadata({
      datasetId: uploadRes.key,
      datasetName: file.name,
      bucket: uploadRes.bucket,
      objectKey: uploadRes.key,
      size: uploadRes.size,
      delimiter: ',',
      encoding: 'utf-8',
      uploadedBy: 'system-user',
      uploadedAt: uploadRes.uploadTime,
      status: 'raw',
      connector: connectorType,
      checksum: uploadRes.etag || 'md5-hash',
    });

    return NextResponse.json({
      path: `${storageType}://${uploadRes.bucket}/${uploadRes.key}`,
      filename: file.name,
      size: uploadRes.size,
      uploadedAt: uploadRes.uploadTime,
      metadata,
    }, { status: 201 });
  } catch (error) {
    console.error('[Upload API] Ingest upload failed:', error);
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}
