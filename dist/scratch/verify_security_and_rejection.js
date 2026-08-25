"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const password_service_1 = require("../src/core/security/password.service");
const session_service_1 = require("../src/core/security/session.service");
const erp_adapter_1 = require("../src/core/adapters/erp-adapter");
const rejection_log_service_1 = require("../src/core/ingestion/rejection-log.service");
function makeRequest(options, body) {
    return new Promise((resolve, reject) => {
        const req = http_1.default.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        statusCode: res.statusCode || 0,
                        headers: res.headers,
                        body: JSON.parse(data),
                    });
                }
                catch {
                    resolve({
                        statusCode: res.statusCode || 0,
                        headers: res.headers,
                        body: data,
                    });
                }
            });
        });
        req.on('error', reject);
        if (body) {
            req.write(typeof body === 'string' ? body : JSON.stringify(body));
        }
        req.end();
    });
}
async function runVerifications() {
    console.log('============================================================');
    console.log('VERIFICATION SUITE — FIX A & FIX B FORENSIC PROOFS');
    console.log('============================================================\n');
    // ------------------------------------------------------------
    // FIX A — PROOF 1: POST /api/v1/auth/session with {"role":"OWNER"}
    // ------------------------------------------------------------
    console.log('--- FIX A (1): Arbitrary Token Minting Exploit Attempt ---');
    const mintAttempt = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/v1/auth/session',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    }, { role: 'OWNER' });
    console.log(`HTTP Status: ${mintAttempt.statusCode}`);
    console.log('Response Payload:', JSON.stringify(mintAttempt.body, null, 2));
    // ------------------------------------------------------------
    // FIX A — PROOF 2: GET /api/v1/auth/session unauthenticated
    // ------------------------------------------------------------
    console.log('\n--- FIX A (2): Unauthenticated GET /api/v1/auth/session ---');
    const getSessionNoAuth = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/v1/auth/session',
        method: 'GET',
    });
    console.log(`HTTP Status: ${getSessionNoAuth.statusCode}`);
    console.log('Response Payload:', JSON.stringify(getSessionNoAuth.body, null, 2));
    // ------------------------------------------------------------
    // FIX A — PROOF 3: Real login via POST /api/v1/auth/login
    // ------------------------------------------------------------
    console.log('\n--- FIX A (3a): Real Login with WRONG Password ---');
    const wrongLogin = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    }, { email: 'owner@agrawaltrading.com', password: 'wrongpassword' });
    console.log(`HTTP Status: ${wrongLogin.statusCode}`);
    console.log('Response Payload:', JSON.stringify(wrongLogin.body, null, 2));
    console.log('\n--- FIX A (3b): Real Login with CORRECT Owner Password ---');
    const validLogin = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    }, { email: 'owner@agrawaltrading.com', password: 'owner123' });
    console.log(`HTTP Status: ${validLogin.statusCode}`);
    console.log('Response Payload (Redacted Token Tail):', {
        success: validLogin.body.success,
        user: validLogin.body.user,
        tokenPrefix: validLogin.body.token ? validLogin.body.token.substring(0, 35) + '...' : null,
    });
    const ownerToken = validLogin.body.token;
    // ------------------------------------------------------------
    // FIX A — PROOF 4: Password Hash at Rest Demonstration
    // ------------------------------------------------------------
    console.log('\n--- FIX A (4): Cryptographic Hash at Rest vs Plaintext ---');
    const sampleHash = password_service_1.PasswordService.hash('owner123');
    console.log(`Input Plaintext: 'owner123'`);
    console.log(`Stored Scrypt Hash: ${sampleHash}`);
    console.log(`Verification of correct password ('owner123'): ${password_service_1.PasswordService.compare('owner123', sampleHash)}`);
    console.log(`Verification of incorrect password ('hacker'): ${password_service_1.PasswordService.compare('hacker', sampleHash)}`);
    // ------------------------------------------------------------
    // FIX A — PROOF 5: Startup Failure with SESSION_SECRET Unset
    // ------------------------------------------------------------
    console.log('\n--- FIX A (5): Crash Failure when SESSION_SECRET is Unset ---');
    const originalSecret = process.env.SESSION_SECRET;
    delete process.env.SESSION_SECRET;
    try {
        session_service_1.SessionService.createToken({ userId: 'test', name: 'test', email: 'test@atc.com', role: 'OWNER' });
        console.log('ERROR: Token creation succeeded without secret!');
    }
    catch (err) {
        console.log(`Caught Expected Fatal Error: "${err.message}"`);
    }
    process.env.SESSION_SECRET = originalSecret;
    // ------------------------------------------------------------
    // FIX B — PROOF: Ingest Test File with 3 Intentionally Bad Rows
    // ------------------------------------------------------------
    console.log('\n--- FIX B (1 & 2): Ingesting Bad Rows & Logging Rejections ---');
    await rejection_log_service_1.RejectionLogService.clear();
    const badCsvContent = [
        'VCN,C_DATE,TYPE2,AMOUNT,PNAME,NAME,QTY,RATE,DISC,DISC2,GST,CGST,SGST,IGST,NET',
        'INV-VALID-01,01-Apr-2024,Sale,1500.00,PHARMA CLINIC,PARACETAMOL 500,10,150.00,0,0,180.00,90.00,90.00,0,1680.00',
        'INV-BAD-01,,Sale,2500.00,KUMAR MEDICAL,AMLO 5MG,10,250.00,0,0,300.00,150.00,150.00,0,2800.00', // BAD ROW 1: Missing invoice date
        'INV-BAD-02,02-Apr-2024,Sale,GARBAGE_AMOUNT,CITY DRUG STORE,TELMA 40MG,5,100.00,0,0,60.00,30.00,30.00,0,560.00', // BAD ROW 2: Garbage unparseable amount
        ',03-Apr-2024,Sale,3200.00,MAHESH MEDICAL,AZITHRAL 500MG,4,800.00,0,0,384.00,192.00,192.00,0,3584.00', // BAD ROW 3: Missing voucher ID (empty VCN)
        'INV-VALID-02,04-Apr-2024,Sale,4000.00,MEDICINE PLAZA,PANTOCID DSR,10,400.00,0,0,480.00,240.00,240.00,0,4480.00',
    ].join('\n');
    const testFilePath = path_1.default.resolve(process.cwd(), 'scratch', 'test_corrupt_journal.csv');
    fs_1.default.writeFileSync(testFilePath, badCsvContent, 'utf8');
    const ingestRes = await erp_adapter_1.ErpAdapter.ingestJournal(testFilePath);
    console.log(`Ingestion Result Report:`, ingestRes.report);
    const logFile = path_1.default.resolve(process.cwd(), 'data', 'ready', 'rejected_rows.jsonl');
    console.log(`\nRaw rejection log file (${logFile}):`);
    const rawLogLines = fs_1.default.readFileSync(logFile, 'utf8').trim().split('\n');
    rawLogLines.forEach((line, idx) => {
        console.log(`[Rejected Entry ${idx + 1}]:\n${JSON.stringify(JSON.parse(line), null, 2)}`);
    });
    // ------------------------------------------------------------
    // FIX B — PROOF 3: Query /api/v1/ingestion/rejected API
    // ------------------------------------------------------------
    console.log('\n--- FIX B (3): Querying /api/v1/ingestion/rejected API with Owner Token ---');
    const rejectedApiRes = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/v1/ingestion/rejected',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${ownerToken}`,
        },
    });
    console.log(`API Status: ${rejectedApiRes.statusCode}`);
    console.log(`API Response Total: ${rejectedApiRes.body.total}`);
    console.log(`API Response Rows:`, JSON.stringify(rejectedApiRes.body.rows, null, 2));
    console.log('\n============================================================');
    console.log('ALL FIX A & FIX B VERIFICATIONS COMPLETED');
    console.log('============================================================');
}
runVerifications().catch(console.error);
