"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BronzeStore = exports.RawStore = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class RawStore {
    basePath;
    constructor(basePath = path_1.default.resolve(process.cwd(), 'data', 'raw')) {
        this.basePath = basePath;
    }
    async ensureDirectory() {
        await fs_1.default.promises.mkdir(this.basePath, { recursive: true });
    }
    async createRawFile(datasetId) {
        await this.ensureDirectory();
        const normalized = datasetId.replace(/[^a-zA-Z0-9-_]/g, '_');
        const fileName = `${normalized}-${Date.now()}.ndjson`;
        return path_1.default.join(this.basePath, fileName);
    }
    async createBronzeFile(datasetId) {
        return this.createRawFile(datasetId);
    }
    async writeRecords(datasetId, records) {
        const filePath = await this.createRawFile(datasetId);
        const handle = await fs_1.default.promises.open(filePath, 'w');
        try {
            for (const record of records) {
                await handle.write(`${JSON.stringify(record)}\n`);
            }
        }
        finally {
            await handle.close();
        }
        return { filePath, rowCount: records.length };
    }
}
exports.RawStore = RawStore;
class BronzeStore extends RawStore {
    constructor(basePath = path_1.default.resolve(process.cwd(), 'data', 'raw')) {
        super(basePath);
    }
}
exports.BronzeStore = BronzeStore;
