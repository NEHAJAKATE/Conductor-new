"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.privacyPolicyService = exports.PrivacyPolicyService = void 0;
const data_protection_1 = require("./data-protection");
class PrivacyPolicyService {
    maskValue(value, classification, role) {
        if (value === null || value === undefined || value === '')
            return value;
        // Delegate directly to the Custom Data Protection Policy Engine
        return data_protection_1.dataProtectionService.policyEngine(role, '', String(value), classification);
    }
}
exports.PrivacyPolicyService = PrivacyPolicyService;
exports.privacyPolicyService = new PrivacyPolicyService();
