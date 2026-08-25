"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdempotencyService = void 0;
const crypto_1 = __importDefault(require("crypto"));
class IdempotencyService {
    static seenChecksums = new Set();
    static getSHA256(content) {
        return crypto_1.default.createHash('sha256').update(content).digest('hex');
    }
    static register(checksum) {
        if (this.seenChecksums.has(checksum)) {
            return false; // Already processed
        }
        this.seenChecksums.add(checksum);
        return true; // New checksum registered
    }
    static clear() {
        this.seenChecksums.clear();
    }
}
exports.IdempotencyService = IdempotencyService;
