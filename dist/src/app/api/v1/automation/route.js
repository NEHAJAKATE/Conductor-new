"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const automation_service_1 = require("@/core/automation/automation.service");
async function GET() {
    try {
        const rules = await automation_service_1.automationService.listRules();
        const logs = await automation_service_1.automationService.listLogs();
        return server_1.NextResponse.json({ rules, logs }, { status: 200 });
    }
    catch (error) {
        console.error('[Automation API] Fetch failed:', error);
        return server_1.NextResponse.json({ message: error.message }, { status: 500 });
    }
}
async function POST(request) {
    try {
        const body = await request.json();
        const action = body.action;
        if (action === 'toggle' && body.ruleId) {
            const updated = await automation_service_1.automationService.toggleRule(body.ruleId);
            return server_1.NextResponse.json({ rule: updated }, { status: 200 });
        }
        if (action === 'send_reminder' || action === 'test_trigger') {
            const payload = body.payload || {};
            const log = await automation_service_1.automationService.recordReminder({
                partyName: payload.partyName || payload.name || 'Valued Account',
                amount: payload.amount || payload.totalOutstanding || payload.bucket90Plus || 0,
                overdue90Plus: payload.overdue90Plus || payload.bucket90Plus || 0,
                channel: payload.channel || 'EMAIL',
                recipient: payload.recipient || payload.email || payload.phone || 'accounts@agrawaltrading.com',
                message: payload.message || undefined,
            });
            return server_1.NextResponse.json({ success: true, log, message: 'Payment reminder dispatched successfully' }, { status: 200 });
        }
        return server_1.NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }
    catch (error) {
        console.error('[Automation API] Action failed:', error);
        return server_1.NextResponse.json({ message: error.message }, { status: 500 });
    }
}
