"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const stream_1 = require("stream");
const storage_adapter_1 = require("@/core/storage/storage-adapter");
const bootstrap_1 = require("@/core/services/bootstrap");
async function POST(request, { params }) {
    const { connectorType } = await params;
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        if (!file) {
            return server_1.NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
        }
        const searchParams = request.nextUrl.searchParams;
        const storageType = searchParams.get('storageType') || 'r2';
        let storageConfig = {};
        const configParam = searchParams.get('storageConfig');
        if (configParam) {
            try {
                storageConfig = JSON.parse(configParam);
            }
            catch { }
        }
        const adapter = storage_adapter_1.StorageAdapterFactory.create(storageType, storageConfig);
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const bufferStream = stream_1.Readable.from(buffer);
        const sanitized = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const key = `uploads/${Date.now()}-${sanitized}`;
        const uploadRes = await adapter.uploadStream(bufferStream, key, file.type || 'text/csv');
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
            }
            catch (ingestErr) {
                console.error(`[Upload Ingest] Warning: Failed to parse and ingest CDP dataset:`, ingestErr);
            }
        }
        const context = (0, bootstrap_1.bootstrap)();
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
        return server_1.NextResponse.json({
            path: `${storageType}://${uploadRes.bucket}/${uploadRes.key}`,
            filename: file.name,
            size: uploadRes.size,
            uploadedAt: uploadRes.uploadTime,
            metadata,
        }, { status: 201 });
    }
    catch (error) {
        console.error('[Upload API] Ingest upload failed:', error);
        return server_1.NextResponse.json({ message: error.message }, { status: 500 });
    }
}
