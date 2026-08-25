"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rbac_service_1 = require("../src/core/security/rbac.service");
const audit_service_1 = require("../src/core/audit/audit.service");
async function testRbacAndAudit() {
    console.log('Testing Step 8: Server-Side RBAC Enforcement & Audit Trail...');
    // 1. Test Staff Authorization (Should DENY bank reconciliation)
    const staffRequest = new Request('http://localhost:3000/api/v1/reconciliation', {
        headers: { 'x-user-role': 'STAFF', 'x-user-id': 'staff_counter_1' },
    });
    const staffAuth = rbac_service_1.RbacService.authorize(staffRequest, 'VIEW_BANK_RECONCILIATION');
    console.log('1. Staff Bank Recon Auth Result:', staffAuth);
    if (!staffAuth.allowed && staffAuth.role === 'STAFF') {
        console.log('>>> RBAC Staff 403 Denial Check PASSED! <<<');
    }
    else {
        console.error('>>> RBAC Staff Denial FAILED! Staff was incorrectly granted access! <<<');
        process.exit(1);
    }
    // 2. Test Staff Allowed Permissions (e.g. Sales, Stock)
    const staffSalesAuth = rbac_service_1.RbacService.authorize(staffRequest, 'VIEW_SALES');
    const staffStockAuth = rbac_service_1.RbacService.authorize(staffRequest, 'VIEW_STOCK');
    if (staffSalesAuth.allowed && staffStockAuth.allowed) {
        console.log('>>> Staff Standard Permissions (Sales, Stock) PASSED! <<<');
    }
    else {
        console.error('>>> Staff Standard Permissions FAILED! <<<');
        process.exit(1);
    }
    // 3. Test Owner Authorization (Should ALLOW bank reconciliation)
    const ownerRequest = new Request('http://localhost:3000/api/v1/reconciliation', {
        headers: { 'x-user-role': 'OWNER', 'x-user-id': 'rajat_owner' },
    });
    const ownerAuth = rbac_service_1.RbacService.authorize(ownerRequest, 'VIEW_BANK_RECONCILIATION');
    console.log('\n2. Owner Bank Recon Auth Result:', ownerAuth);
    if (ownerAuth.allowed && ownerAuth.role === 'OWNER') {
        console.log('>>> RBAC Owner Access Check PASSED! <<<');
    }
    else {
        console.error('>>> RBAC Owner Access FAILED! Owner was denied! <<<');
        process.exit(1);
    }
    // 4. Test Audit Logging
    console.log('\n3. Testing Audit Trail Recording...');
    await audit_service_1.AuditService.log({
        actorId: 'rajat_owner',
        actorRole: 'OWNER',
        action: 'BANK_RECONCILIATION_MATCH',
        entityType: 'BANK_STATEMENT',
        entityId: 'AXIS_BANK_ATC',
        description: 'Manual verification test for audit trail',
    });
    const recentLogs = await audit_service_1.AuditService.list({ limit: 5 });
    console.log(`4. Retrieved ${recentLogs.length} audit logs from disk.`);
    const found = recentLogs.find(l => l.actorId === 'rajat_owner' && l.action === 'BANK_RECONCILIATION_MATCH');
    if (found) {
        console.log('>>> Audit Log Verification PASSED! Recorded log found on disk. <<<');
    }
    else {
        console.error('>>> Audit Log Verification FAILED! <<<');
        process.exit(1);
    }
    console.log('\n=====================================================================');
    console.log('>>> STEP 8 PASSED: Server-side RBAC & Immutable Audit Trail Verified! <<<');
    console.log('=====================================================================\n');
}
testRbacAndAudit().catch(err => {
    console.error(err);
    process.exit(1);
});
