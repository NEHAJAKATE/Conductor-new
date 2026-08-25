"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const bootstrap_1 = require("@/core/services/bootstrap");
const privacy_policy_service_1 = require("@/core/customer360/services/privacy-policy.service");
async function GET(request, { params }) {
    const { uuid } = await params;
    try {
        const context = (0, bootstrap_1.bootstrap)();
        const searchParams = request.nextUrl.searchParams;
        const role = (searchParams.get('role') || 'Analyst');
        const profile = await context.customerRepository.findByUuid(uuid);
        if (!profile) {
            return server_1.NextResponse.json({ message: `Customer profile ${uuid} not found` }, { status: 404 });
        }
        // Clone the profile to apply role-based masking without mutating the memory cache
        const cloned = JSON.parse(JSON.stringify(profile));
        // Mask identity fields
        cloned.piiTags.forEach(tag => {
            const field = tag.fieldName;
            const originalValue = cloned.identity[field];
            if (originalValue !== undefined) {
                cloned.identity[field] = privacy_policy_service_1.privacyPolicyService.maskValue(originalValue, tag.classification, role);
            }
        });
        const isPrivileged = role === 'Admin' || role === 'Owner' || role === 'Compliance Officer' || role === 'Developer';
        // Audit Log masking event
        if (!isPrivileged) {
            console.log(`[Privacy Center] Audit: Role '${role}' accessed masked profile for Customer ID ${uuid}`);
        }
        else {
            console.log(`[Privacy Center] Audit WARNING: ${role} role accessed RAW unmasked profile for Customer ID ${uuid}`);
        }
        return server_1.NextResponse.json(cloned, { status: 200 });
    }
    catch (error) {
        console.error('[Customer 360 API] Fetch single profile failed:', error);
        return server_1.NextResponse.json({ message: error.message }, { status: 500 });
    }
}
