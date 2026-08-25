"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageAdapterFactory = exports.GcsStorageAdapter = exports.AzureBlobStorageAdapter = exports.S3StorageAdapter = exports.R2StorageAdapter = exports.LocalStorageAdapter = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// 1. Local Storage Adapter
class LocalStorageAdapter {
    baseDir = path_1.default.resolve(process.cwd(), 'data', 'local_storage');
    constructor() {
        fs_1.default.mkdirSync(this.baseDir, { recursive: true });
    }
    async uploadStream(stream, key, contentType) {
        const targetPath = path_1.default.join(this.baseDir, key.replace(/\//g, '_'));
        fs_1.default.mkdirSync(path_1.default.dirname(targetPath), { recursive: true });
        const writeStream = fs_1.default.createWriteStream(targetPath);
        let size = 0;
        await new Promise((resolve, reject) => {
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
    async getReadStream(key) {
        if (key.startsWith('sample-data/')) {
            return fs_1.default.createReadStream(path_1.default.resolve(process.cwd(), key));
        }
        const targetPath = path_1.default.join(this.baseDir, key.replace(/\//g, '_'));
        if (!fs_1.default.existsSync(targetPath)) {
            throw new Error(`Local storage file not found: ${targetPath}`);
        }
        return fs_1.default.createReadStream(targetPath);
    }
    async readFirstLines(key, maxLines) {
        const stream = await this.getReadStream(key);
        return readStreamLines(stream, maxLines);
    }
}
exports.LocalStorageAdapter = LocalStorageAdapter;
// 2. Cloudflare R2 Storage Adapter
class R2StorageAdapter {
    client = null;
    bucket;
    isSimulation = true;
    simulationDir = path_1.default.resolve(process.cwd(), 'data', 'r2_simulation');
    constructor(config) {
        this.bucket = config.bucket || process.env.R2_BUCKET || 'conductor-raw-lake';
        const accessKeyId = config.accessKeyId || process.env.R2_ACCESS_KEY_ID;
        const secretAccessKey = config.secretAccessKey || process.env.R2_SECRET_ACCESS_KEY;
        const endpoint = config.endpoint || process.env.R2_ENDPOINT;
        const region = config.region || process.env.R2_REGION || 'auto';
        if (accessKeyId && secretAccessKey && endpoint) {
            this.client = new client_s3_1.S3Client({
                region,
                endpoint,
                credentials: { accessKeyId, secretAccessKey },
                forcePathStyle: true,
            });
            this.isSimulation = false;
        }
        else {
            fs_1.default.mkdirSync(this.simulationDir, { recursive: true });
        }
    }
    async uploadStream(stream, key, contentType) {
        if (!this.isSimulation && this.client) {
            const chunks = [];
            let size = 0;
            for await (const chunk of stream) {
                chunks.push(chunk);
                size += chunk.length;
            }
            const buffer = Buffer.concat(chunks);
            await this.client.send(new client_s3_1.PutObjectCommand({
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
        }
        else {
            const targetPath = path_1.default.join(this.simulationDir, key.replace(/\//g, '_'));
            const writeStream = fs_1.default.createWriteStream(targetPath);
            let size = 0;
            await new Promise((resolve, reject) => {
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
    async getReadStream(key) {
        if (key.startsWith('sample-data/')) {
            return fs_1.default.createReadStream(path_1.default.resolve(process.cwd(), key));
        }
        if (!this.isSimulation && this.client) {
            const response = await this.client.send(new client_s3_1.GetObjectCommand({ Bucket: this.bucket, Key: key }));
            return response.Body;
        }
        const targetPath = path_1.default.join(this.simulationDir, key.replace(/\//g, '_'));
        return fs_1.default.createReadStream(targetPath);
    }
    async readFirstLines(key, maxLines) {
        return readStreamLines(await this.getReadStream(key), maxLines);
    }
}
exports.R2StorageAdapter = R2StorageAdapter;
// 3. AWS S3 Storage Adapter
class S3StorageAdapter {
    client = null;
    bucket;
    isSimulation = true;
    simulationDir = path_1.default.resolve(process.cwd(), 'data', 's3_simulation');
    constructor(config) {
        this.bucket = config.bucket || 'conductor-s3-lake';
        const accessKeyId = config.accessKeyId;
        const secretAccessKey = config.secretAccessKey;
        const region = config.region || 'us-east-1';
        const endpoint = config.endpoint;
        if (accessKeyId && secretAccessKey) {
            this.client = new client_s3_1.S3Client({
                region,
                credentials: { accessKeyId, secretAccessKey },
                ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
            });
            this.isSimulation = false;
        }
        else {
            fs_1.default.mkdirSync(this.simulationDir, { recursive: true });
        }
    }
    async uploadStream(stream, key, contentType) {
        if (!this.isSimulation && this.client) {
            const chunks = [];
            let size = 0;
            for await (const chunk of stream) {
                chunks.push(chunk);
                size += chunk.length;
            }
            const buffer = Buffer.concat(chunks);
            await this.client.send(new client_s3_1.PutObjectCommand({
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
        }
        else {
            const targetPath = path_1.default.join(this.simulationDir, key.replace(/\//g, '_'));
            const writeStream = fs_1.default.createWriteStream(targetPath);
            let size = 0;
            await new Promise((resolve, reject) => {
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
    async getReadStream(key) {
        if (key.startsWith('sample-data/')) {
            return fs_1.default.createReadStream(path_1.default.resolve(process.cwd(), key));
        }
        if (!this.isSimulation && this.client) {
            const response = await this.client.send(new client_s3_1.GetObjectCommand({ Bucket: this.bucket, Key: key }));
            return response.Body;
        }
        const targetPath = path_1.default.join(this.simulationDir, key.replace(/\//g, '_'));
        return fs_1.default.createReadStream(targetPath);
    }
    async readFirstLines(key, maxLines) {
        return readStreamLines(await this.getReadStream(key), maxLines);
    }
}
exports.S3StorageAdapter = S3StorageAdapter;
// 4. Azure Blob Storage Adapter (Simulation Template)
class AzureBlobStorageAdapter {
    simulationDir = path_1.default.resolve(process.cwd(), 'data', 'azure_simulation');
    constructor() {
        fs_1.default.mkdirSync(this.simulationDir, { recursive: true });
    }
    async uploadStream(stream, key, contentType) {
        const targetPath = path_1.default.join(this.simulationDir, key.replace(/\//g, '_'));
        const writeStream = fs_1.default.createWriteStream(targetPath);
        let size = 0;
        await new Promise((resolve, reject) => {
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
    async getReadStream(key) {
        if (key.startsWith('sample-data/')) {
            return fs_1.default.createReadStream(path_1.default.resolve(process.cwd(), key));
        }
        const targetPath = path_1.default.join(this.simulationDir, key.replace(/\//g, '_'));
        return fs_1.default.createReadStream(targetPath);
    }
    async readFirstLines(key, maxLines) {
        return readStreamLines(await this.getReadStream(key), maxLines);
    }
}
exports.AzureBlobStorageAdapter = AzureBlobStorageAdapter;
// 5. Google Cloud Storage Adapter (Simulation Template)
class GcsStorageAdapter {
    simulationDir = path_1.default.resolve(process.cwd(), 'data', 'gcs_simulation');
    constructor() {
        fs_1.default.mkdirSync(this.simulationDir, { recursive: true });
    }
    async uploadStream(stream, key, contentType) {
        const targetPath = path_1.default.join(this.simulationDir, key.replace(/\//g, '_'));
        const writeStream = fs_1.default.createWriteStream(targetPath);
        let size = 0;
        await new Promise((resolve, reject) => {
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
    async getReadStream(key) {
        if (key.startsWith('sample-data/')) {
            return fs_1.default.createReadStream(path_1.default.resolve(process.cwd(), key));
        }
        const targetPath = path_1.default.join(this.simulationDir, key.replace(/\//g, '_'));
        return fs_1.default.createReadStream(targetPath);
    }
    async readFirstLines(key, maxLines) {
        return readStreamLines(await this.getReadStream(key), maxLines);
    }
}
exports.GcsStorageAdapter = GcsStorageAdapter;
// Helper function to read first N lines from a readable stream
function readStreamLines(stream, maxLines) {
    return new Promise((resolve, reject) => {
        let buffer = '';
        let finished = false;
        stream.on('data', (chunk) => {
            if (finished)
                return;
            buffer += chunk.toString();
            const lines = buffer.split(/\r?\n/);
            if (lines.length > maxLines) {
                finished = true;
                stream.destroy();
                resolve(lines.slice(0, maxLines).join('\n'));
            }
        });
        stream.on('end', () => {
            if (!finished)
                resolve(buffer);
        });
        stream.on('error', (err) => {
            if (!finished)
                reject(err);
        });
    });
}
// Factory to resolve storage adapter dynamically
class StorageAdapterFactory {
    static create(type, config = {}) {
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
exports.StorageAdapterFactory = StorageAdapterFactory;
