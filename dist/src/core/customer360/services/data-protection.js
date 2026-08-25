"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataProtectionService = exports.DataProtectionService = void 0;
const crypto = __importStar(require("crypto"));
// In-Memory Token Vault for tokenized PII mapping
const tokenVault = new Map();
// Encryption Key (Derived from secret or generated statically for demo reliability)
const ENCRYPTION_KEY = crypto.scryptSync('conductor-secret-key-2026', 'conductor-salt-2026', 32);
const IV_LENGTH = 16;
const SALT = 'conductor-salted-hash-2026';
class DataProtectionService {
    /**
     * Generates a salted SHA-256 hash of a string value (e.g., for anonymous matching)
     */
    saltedHash(value) {
        if (!value)
            return '';
        return crypto
            .createHmac('sha256', SALT)
            .update(value.trim().toLowerCase())
            .digest('hex');
    }
    /**
     * Encrypts a string value using AES-256-CBC
     */
    aesEncrypt(value) {
        if (!value)
            return '';
        try {
            const iv = crypto.randomBytes(IV_LENGTH);
            const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
            let encrypted = cipher.update(value, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            return `${iv.toString('hex')}:${encrypted}`;
        }
        catch (err) {
            console.error('[Security] Encryption failed:', err);
            return 'ENCRYPTION_ERROR';
        }
    }
    /**
     * Decrypts a previously AES-encrypted value
     */
    aesDecrypt(encryptedValue) {
        if (!encryptedValue || !encryptedValue.includes(':'))
            return encryptedValue;
        try {
            const parts = encryptedValue.split(':');
            const iv = Buffer.from(parts[0], 'hex');
            const encryptedText = Buffer.from(parts[1], 'hex');
            const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
            const decrypted = Buffer.concat([
                decipher.update(encryptedText),
                decipher.final()
            ]);
            return decrypted.toString('utf8');
        }
        catch (err) {
            console.error('[Security] Decryption failed:', err);
            return 'DECRYPTION_ERROR';
        }
    }
    /**
     * Tokenizes a value, stores it in the token vault, and returns the token id
     */
    tokenize(value, classification) {
        if (!value)
            return '';
        const hash = this.saltedHash(value);
        const tokenId = `TOK-${classification}-${hash.slice(0, 12).toUpperCase()}`;
        if (!tokenVault.has(tokenId)) {
            tokenVault.set(tokenId, { original: value, classification });
        }
        return tokenId;
    }
    /**
     * Detokenizes a token id back to its original value if authorized
     */
    detokenize(tokenId) {
        const entry = tokenVault.get(tokenId);
        return entry ? entry.original : tokenId;
    }
    /**
     * Custom Policy Engine enforcing role-based decryptions/views
     */
    policyEngine(role, fieldName, value, classification) {
        if (!value)
            return '';
        // Owners and Compliance Officers get full raw values
        if (role === 'Owner' || role === 'Admin' || role === 'Compliance Officer') {
            return value;
        }
        // Analysts and AI Agents get tokenized keys only - no raw values
        if (role === 'Analyst' || role === 'AI Agent') {
            return this.tokenize(value, classification);
        }
        // Marketing role gets salted hashes or partial masks
        if (role === 'Marketing') {
            if (classification === 'EMAIL') {
                const parts = value.split('@');
                return parts.length === 2 ? `${parts[0][0]}***@${parts[1]}` : '***@example.com';
            }
            if (classification === 'PHONE') {
                return value.length > 4 ? `******${value.slice(-4)}` : '******';
            }
            return `HASH-${this.saltedHash(value).slice(0, 8).toUpperCase()}`;
        }
        // Default fallback: return tokenized form
        return this.tokenize(value, classification);
    }
    /**
     * Transforms a Customer Profile into an "Agent Safe Dataset" format
     */
    getAgentSafeDataset(profile) {
        return {
            uuid: profile.uuid,
            confidence: profile.confidence,
            identitySummary: {
                segment: profile.identity.segment,
                riskScore: profile.identity.riskScore,
                completionRate: profile.identity.completionRate,
                status: profile.identity.status,
                gender: profile.identity.gender,
                country: profile.identity.country,
                // Hashed/Tokenized fields for agent tracking
                nameHash: this.saltedHash(profile.identity.name || ''),
                emailToken: this.tokenize(profile.identity.email || '', 'EMAIL'),
                phoneToken: this.tokenize(profile.identity.phone || '', 'PHONE')
            },
            behavioralEvents: profile.behavioralEvents.map(e => ({
                eventId: e.eventId,
                type: e.type,
                timestamp: e.timestamp,
                source: e.source,
                details: e.details
            })),
            financialSummary: {
                creditScore: profile.financial.creditScore,
                totalInvoiceAmount: profile.financial.invoices.reduce((acc, inv) => acc + inv.amount, 0),
                unpaidBalance: profile.financial.invoices
                    .filter(inv => inv.status === 'Unpaid' || inv.status === 'Overdue')
                    .reduce((acc, inv) => acc + inv.amount, 0),
                activeSubscriptionsCount: profile.financial.subscriptions.filter(s => s.status === 'Active').length,
                lifetimeValue: profile.financial.subscriptions.reduce((acc, s) => acc + s.cost, 0) * 12
            }
        };
    }
}
exports.DataProtectionService = DataProtectionService;
exports.dataProtectionService = new DataProtectionService();
