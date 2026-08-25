"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityService = void 0;
class IdentityService {
    async resolve(records) {
        console.log(`[IdentityService] Running Identity Resolution on ${records.length} records...`);
        const profiles = [];
        const emailToProfileMap = new Map();
        const phoneToProfileMap = new Map();
        const idToProfileMap = new Map();
        const crmIdToProfileMap = new Map();
        const customerIdToProfileMap = new Map();
        const compositeToProfileMap = new Map();
        let linkedRecordsCount = 0;
        for (const record of records) {
            const email = String(record.email || record.user_email || '').toLowerCase().trim();
            const phone = String(record.phone || record.mobile || '').trim();
            const id = String(record.id || record.user_id || record.emp_id || record.student_id || '').trim();
            const crmId = String(record.crm_id || record.hubspot_id || record.salesforce_id || '').trim();
            const customerId = String(record.customer_id || record.cust_id || '').trim();
            const name = String(record.name || record.contact_name || 'Unnamed Entity').trim();
            const company = String(record.company || record.org || record.organization || '').toLowerCase().trim();
            // Composite Key match vector (e.g., Name + Company)
            const compositeKey = name && company ? `${name.toLowerCase().replace(/\s+/g, '')}_${company}` : '';
            // Resolve matching profile using multiple vectors (Section 11)
            let matchedProfile;
            let reasonFlags = [];
            if (email && emailToProfileMap.has(email)) {
                matchedProfile = emailToProfileMap.get(email);
                reasonFlags.push('Email Address Match');
            }
            else if (phone && phoneToProfileMap.has(phone)) {
                matchedProfile = phoneToProfileMap.get(phone);
                reasonFlags.push('Phone Match');
            }
            else if (id && idToProfileMap.has(id)) {
                matchedProfile = idToProfileMap.get(id);
                reasonFlags.push('Unique ID Match');
            }
            else if (crmId && crmIdToProfileMap.has(crmId)) {
                matchedProfile = crmIdToProfileMap.get(crmId);
                reasonFlags.push('CRM ID Match');
            }
            else if (customerId && customerIdToProfileMap.has(customerId)) {
                matchedProfile = customerIdToProfileMap.get(customerId);
                reasonFlags.push('Customer ID Match');
            }
            else if (compositeKey && compositeToProfileMap.has(compositeKey)) {
                matchedProfile = compositeToProfileMap.get(compositeKey);
                reasonFlags.push('Composite Name+Company Match');
            }
            if (matchedProfile) {
                matchedProfile.records.push(record);
                matchedProfile.linkedRecordCount += 1;
                linkedRecordsCount += 1;
                if (crmId && !matchedProfile.crmId)
                    matchedProfile.crmId = crmId;
                if (customerId && !matchedProfile.customerId)
                    matchedProfile.customerId = customerId;
                // Recalculate confidence score based on intersection vectors (0 - 100)
                let reasons = matchedProfile.matchingReason.split(', ');
                for (const flag of reasonFlags) {
                    if (!reasons.includes(flag)) {
                        reasons.push(flag);
                        // Boost score on multiple matching vectors
                        matchedProfile.confidenceScore = Math.min(100, matchedProfile.confidenceScore + 10);
                    }
                }
                matchedProfile.matchingReason = reasons.join(', ');
            }
            else {
                // Base confidence mapping (Section 11)
                let baseConfidence = 80;
                let mainReason = 'Unique ID Match';
                if (email) {
                    baseConfidence = 85;
                    mainReason = 'Email Address Match';
                }
                else if (crmId) {
                    baseConfidence = 90;
                    mainReason = 'CRM ID Match';
                }
                else if (customerId) {
                    baseConfidence = 90;
                    mainReason = 'Customer ID Match';
                }
                else if (phone) {
                    baseConfidence = 80;
                    mainReason = 'Phone Match';
                }
                else if (compositeKey) {
                    baseConfidence = 70;
                    mainReason = 'Composite Name+Company Match';
                }
                const newProfile = {
                    masterId: `master-${Math.random().toString(36).substring(2, 9)}`,
                    name,
                    email: email || 'unknown-email',
                    phone: phone || undefined,
                    crmId: crmId || undefined,
                    customerId: customerId || undefined,
                    records: [record],
                    linkedRecordCount: 1,
                    confidenceScore: baseConfidence,
                    matchingReason: mainReason,
                };
                profiles.push(newProfile);
                if (email)
                    emailToProfileMap.set(email, newProfile);
                if (phone)
                    phoneToProfileMap.set(phone, newProfile);
                if (id)
                    idToProfileMap.set(id, newProfile);
                if (crmId)
                    crmIdToProfileMap.set(crmId, newProfile);
                if (customerId)
                    customerIdToProfileMap.set(customerId, newProfile);
                if (compositeKey)
                    compositeToProfileMap.set(compositeKey, newProfile);
            }
        }
        return { profiles, linkedRecordsCount };
    }
}
exports.IdentityService = IdentityService;
