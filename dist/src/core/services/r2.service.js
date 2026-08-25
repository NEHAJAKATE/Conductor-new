"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.R2Service = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class R2Service {
    client = null;
    bucket = '';
    simulationDir = path_1.default.resolve(process.cwd(), 'data', 'r2_simulation');
    isSimulation = true;
    constructor() {
        const accessKeyId = process.env.R2_ACCESS_KEY_ID;
        const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
        const endpoint = process.env.R2_ENDPOINT;
        const region = process.env.R2_REGION || 'auto';
        this.bucket = process.env.R2_BUCKET || 'conductor-raw-lake';
        if (accessKeyId && secretAccessKey && endpoint) {
            this.client = new client_s3_1.S3Client({
                region,
                endpoint,
                credentials: { accessKeyId, secretAccessKey },
                forcePathStyle: true,
            });
            this.isSimulation = false;
            console.log(`[R2Service] Initialized real Cloudflare R2 Client. Bucket: ${this.bucket}`);
        }
        else {
            console.log(`[R2Service] Environment variables missing. Activating workspace simulation directory: ${this.simulationDir}`);
            fs_1.default.mkdirSync(this.simulationDir, { recursive: true });
        }
    }
    async uploadStream(stream, key, contentType) {
        const uploadTime = new Date().toISOString();
        if (!this.isSimulation && this.client) {
            const chunks = [];
            let size = 0;
            for await (const chunk of stream) {
                chunks.push(chunk);
                size += chunk.length;
            }
            const buffer = Buffer.concat(chunks);
            const command = new client_s3_1.PutObjectCommand({
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
        }
        else {
            const targetPath = path_1.default.join(this.simulationDir, key.replace(/\//g, '_'));
            const writeStream = fs_1.default.createWriteStream(targetPath);
            let size = 0;
            await new Promise((resolve, reject) => {
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
    async getReadStream(key) {
        if (key.startsWith('sample-data/')) {
            const samplePath = path_1.default.resolve(process.cwd(), key);
            return fs_1.default.createReadStream(samplePath);
        }
        if (!this.isSimulation && this.client) {
            const command = new client_s3_1.GetObjectCommand({
                Bucket: this.bucket,
                Key: key,
            });
            const response = await this.client.send(command);
            if (!response.Body) {
                throw new Error(`R2 Object '${key}' has empty body`);
            }
            return response.Body;
        }
        else {
            const targetPath = path_1.default.join(this.simulationDir, key.replace(/\//g, '_'));
            if (!fs_1.default.existsSync(targetPath)) {
                throw new Error(`R2 simulated file not found: ${targetPath}`);
            }
            return fs_1.default.createReadStream(targetPath);
        }
    }
    async readFirstLines(key, maxLines = 105) {
        const stream = await this.getReadStream(key);
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
                if (!finished) {
                    resolve(buffer);
                }
            });
            stream.on('error', (err) => {
                if (!finished)
                    reject(err);
            });
        });
    }
}
exports.R2Service = R2Service;
