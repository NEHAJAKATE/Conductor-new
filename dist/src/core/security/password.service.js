"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bcrypt = exports.PasswordService = void 0;
const crypto_1 = __importDefault(require("crypto"));
class PasswordService {
    /**
     * Hashes a plaintext password using standard scrypt key derivation with a random 16-byte salt
     */
    static hash(password) {
        if (!password || typeof password !== 'string') {
            throw new Error('Password must be a non-empty string');
        }
        const salt = crypto_1.default.randomBytes(16).toString('hex');
        const derivedKey = crypto_1.default.scryptSync(password, salt, 64);
        return `$scrypt$N=16384,r=8,p=1$${salt}$${derivedKey.toString('hex')}`;
    }
    /**
     * Verifies a plaintext password against a stored cryptographic hash in constant time
     */
    static compare(password, storedHash) {
        try {
            if (!password || !storedHash || typeof password !== 'string' || typeof storedHash !== 'string') {
                return false;
            }
            const parts = storedHash.split('$');
            if (parts.length !== 5 || parts[1] !== 'scrypt') {
                return false;
            }
            const salt = parts[3];
            const originalKey = Buffer.from(parts[4], 'hex');
            const testKey = crypto_1.default.scryptSync(password, salt, originalKey.length);
            return crypto_1.default.timingSafeEqual(originalKey, testKey);
        }
        catch {
            return false;
        }
    }
}
exports.PasswordService = PasswordService;
exports.bcrypt = {
    hash: (pwd) => Promise.resolve(PasswordService.hash(pwd)),
    compare: (pwd, hash) => Promise.resolve(PasswordService.compare(pwd, hash)),
};
