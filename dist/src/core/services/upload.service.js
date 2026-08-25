"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
class UploadService {
    r2Service;
    constructor(r2Service) {
        this.r2Service = r2Service;
    }
    async uploadFileStream(stream, originalName, contentType) {
        const sanitized = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const key = `uploads/${Date.now()}-${sanitized}`;
        console.log(`[UploadService] Initiating direct stream upload to R2 for key: ${key}`);
        return this.r2Service.uploadStream(stream, key, contentType);
    }
}
exports.UploadService = UploadService;
