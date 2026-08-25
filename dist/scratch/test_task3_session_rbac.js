"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const session_service_1 = require("../src/core/security/session.service");
const rbac_service_1 = require("../src/core/security/rbac.service");
async function testTask3SessionRbac() {
    console.log('=====================================================================');
    console.log('  TASK 3 FORENSIC: SERVER-SIDE SESSION TOKEN AUTH & RBAC PROOF       ');
    console.log('=====================================================================\n');
    // 1. Issue signed Staff session token
    const staffToken = session_service_1.SessionService.createToken({
        userId: 'usr_staff_counter_1',
        name: 'Counter Staff',
        email: 'staff@agrawaltrading.com',
        role: 'STAFF',
    });
    console.log('1. Generated Signed STAFF Session Token (HMAC-SHA256):');
    console.log(`   ${staffToken}\n`);
    // 2. Issue signed Owner session token
    const ownerToken = session_service_1.SessionService.createToken({
        userId: 'usr_rajat_owner',
        name: 'Rajat Agrawal',
        email: 'owner@agrawaltrading.com',
        role: 'OWNER',
    });
    console.log('2. Generated Signed OWNER Session Token (HMAC-SHA256):');
    console.log(`   ${ownerToken}\n`);
    // 3. Attack Simulation: Staff attempts to access Bank Reconciliation while spoofing "x-user-role: OWNER"
    console.log('3. ATTACK TEST: Staff token with spoofed client header "x-user-role: OWNER"...');
    const spoofedStaffRequest = new Request('http://localhost:3000/api/v1/reconciliation', {
        headers: {
            'Authorization': `Bearer ${staffToken}`,
            'x-user-role': 'OWNER', // Malicious client header
            'x-role': 'ADMIN',
        },
    });
    const staffAuth = rbac_service_1.RbacService.authorize(spoofedStaffRequest, 'VIEW_BANK_RECONCILIATION');
    console.log('   Auth Result:', staffAuth);
    if (!staffAuth.allowed && staffAuth.role === 'STAFF') {
        console.log('   >>> PROOF: Server IGNORED client header "x-user-role: OWNER" and returned 403 Forbidden based strictly on verified token payload! <<<\n');
    }
    else {
        console.error('   >>> FAILED! Server honored client-supplied role! <<<');
        process.exit(1);
    }
    // 4. Valid Owner Access
    console.log('4. OWNER ACCESS TEST: Owner token accessing Bank Reconciliation...');
    const ownerRequest = new Request('http://localhost:3000/api/v1/reconciliation', {
        headers: {
            'Authorization': `Bearer ${ownerToken}`,
        },
    });
    const ownerAuth = rbac_service_1.RbacService.authorize(ownerRequest, 'VIEW_BANK_RECONCILIATION');
    console.log('   Auth Result:', ownerAuth);
    if (ownerAuth.allowed && ownerAuth.role === 'OWNER') {
        console.log('   >>> PROOF: Owner session token permitted access (200 OK)! <<<\n');
    }
    else {
        console.error('   >>> FAILED! Owner was denied! <<<');
        process.exit(1);
    }
    // 5. Tampered Token Attack (Signature forgery)
    console.log('5. TAMPER TEST: Modified token payload with forged signature...');
    const [h, d] = staffToken.split('.');
    const tamperedToken = `${h}.${d}.FORGED_SIGNATURE_INVALID_12345`;
    const tamperedRequest = new Request('http://localhost:3000/api/v1/reconciliation', {
        headers: {
            'Authorization': `Bearer ${tamperedToken}`,
        },
    });
    const tamperedAuth = rbac_service_1.RbacService.authorize(tamperedRequest, 'VIEW_BANK_RECONCILIATION');
    console.log('   Auth Result:', tamperedAuth);
    if (!tamperedAuth.allowed && tamperedAuth.error?.includes('401')) {
        console.log('   >>> PROOF: Tampered signature rejected with 401 Unauthorized! <<<\n');
    }
    else {
        console.error('   >>> FAILED! Tampered token was accepted! <<<');
        process.exit(1);
    }
    console.log('=====================================================================');
    console.log('  TASK 3 EVIDENCE COMPLETE: Cryptographic Server-Side RBAC Verified! ');
    console.log('=====================================================================\n');
}
testTask3SessionRbac().catch(console.error);
