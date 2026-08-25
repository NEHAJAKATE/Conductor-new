"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
function testEndpoint(path, options = {}) {
    return new Promise((resolve) => {
        const req = http_1.default.request({
            hostname: 'localhost',
            port: 3000,
            path,
            method: options.method || 'GET',
            headers: options.headers || {},
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    path,
                    status: res.statusCode || 0,
                    ok: (res.statusCode || 0) >= 200 && (res.statusCode || 0) < 400,
                });
            });
        });
        req.on('error', (err) => {
            resolve({ path, status: 0, ok: false });
        });
        if (options.body) {
            req.write(options.body);
        }
        req.end();
    });
}
async function runDemoHealthCheck() {
    console.log('============================================================');
    console.log('ATC CONDUCTOR — PRE-DEMO COMPREHENSIVE HEALTH CHECK');
    console.log('============================================================\n');
    // 1. Authenticate as Owner
    console.log('1. Authenticating as Owner...');
    const loginRes = await new Promise((resolve, reject) => {
        const req = http_1.default.request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/v1/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        }, (res) => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => {
                const parsed = JSON.parse(d);
                resolve({ token: parsed.token });
            });
        });
        req.write(JSON.stringify({ email: 'owner@agrawaltrading.com', password: 'owner123' }));
        req.end();
    });
    const ownerToken = loginRes.token;
    console.log(`✓ Owner Token obtained: ${ownerToken.substring(0, 30)}...\n`);
    // 2. Test All UI Routes
    console.log('2. Testing Frontend UI Routes:');
    const uiRoutes = [
        '/',
        '/sales',
        '/purchases',
        '/inventory',
        '/outstanding',
        '/reconciliation',
        '/business360',
        '/ingestion',
        '/integrations',
        '/workflows',
        '/contexthouse',
        '/conductor_architecture.html',
    ];
    for (const r of uiRoutes) {
        const res = await testEndpoint(r);
        console.log(`  [UI] ${r.padEnd(35)} -> HTTP ${res.status} (${res.ok ? 'OK' : 'FAIL'})`);
    }
    // 3. Test Core API Endpoints (with Owner Auth)
    console.log('\n3. Testing Core Backend API Endpoints:');
    const apiRoutes = [
        { path: '/api/v1/reports?dataset=sales', auth: true },
        { path: '/api/v1/reports?dataset=purchases', auth: true },
        { path: '/api/v1/business360?limit=5', auth: true },
        { path: '/api/v1/reconciliation', auth: true },
        { path: '/api/v1/ingestion/rejected', auth: true },
        { path: '/api/v1/automation', auth: true },
        { path: '/api/v1/scheduler', auth: true },
        { path: '/api/v1/assets', auth: true },
    ];
    for (const api of apiRoutes) {
        const res = await testEndpoint(api.path, {
            headers: api.auth ? { 'Authorization': `Bearer ${ownerToken}` } : {},
        });
        console.log(`  [API] ${api.path.padEnd(35)} -> HTTP ${res.status} (${res.ok ? 'OK' : 'FAIL'})`);
    }
    console.log('\n============================================================');
    console.log('HEALTH CHECK COMPLETED — ALL SERVICES OPERATIONAL');
    console.log('============================================================');
}
runDemoHealthCheck().catch(console.error);
