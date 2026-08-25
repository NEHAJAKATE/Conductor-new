"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UuidService = void 0;
const uuid_1 = require("uuid");
const config_1 = require("../../config");
class UuidService {
    static NAMESPACE = config_1.config.identity.namespace;
    static generateUnifiedUuid(canonicalString) {
        // Generate deterministic UUIDv5 using standard namespace and clean string
        const normalized = canonicalString.toLowerCase().trim().replace(/[^a-z0-9@.-]/g, '');
        return (0, uuid_1.v5)(normalized, this.NAMESPACE);
    }
    static generateGoldenUuid(canonicalString) {
        return this.generateUnifiedUuid(canonicalString);
    }
}
exports.UuidService = UuidService;
