import { NextResponse, NextRequest } from 'next/server';
import { automationService, AutomationRuleInput } from '@/core/automation/automation.service';

export async function GET() {
  try {
    const rules = await automationService.listRules();
    const logs = await automationService.listLogs();
    return NextResponse.json({ rules, logs }, { status: 200 });
  } catch (error) {
    console.error('[Automation API] Fetch failed:', error);
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;

    if (action === 'toggle' && body.ruleId) {
      const updated = await automationService.toggleRule(body.ruleId);
      return NextResponse.json({ rule: updated }, { status: 200 });
    }

    if (action === 'create' || action === 'update') {
      const input = body.rule as AutomationRuleInput;
      if (!input?.name || !input.description || !input.triggerType || !input.condition?.field || !input.action?.recipient) {
        return NextResponse.json({ message: 'Rule name, description, trigger, condition, and recipient are required' }, { status: 400 });
      }
      const rule = action === 'create'
        ? await automationService.createRule(input)
        : await automationService.updateRule(body.ruleId, input);
      if (!rule) return NextResponse.json({ message: 'Rule not found' }, { status: 404 });
      return NextResponse.json({ rule }, { status: action === 'create' ? 201 : 200 });
    }

    if (action === 'delete' && body.ruleId) {
      const deleted = await automationService.deleteRule(body.ruleId);
      return deleted
        ? NextResponse.json({ success: true }, { status: 200 })
        : NextResponse.json({ message: 'Rule not found' }, { status: 404 });
    }

    if (action === 'send_reminder' || action === 'test_trigger') {
      const payload = body.payload || {};
      const log = await automationService.recordReminder({
        partyName: payload.partyName || payload.name || 'Valued Account',
        amount: payload.amount || payload.totalOutstanding || payload.bucket90Plus || 0,
        overdue90Plus: payload.overdue90Plus || payload.bucket90Plus || 0,
        channel: payload.channel || 'EMAIL',
        recipient: payload.recipient || payload.email || payload.phone || 'accounts@agrawaltrading.com',
        message: payload.message || undefined,
      });
      return NextResponse.json({ success: true, log, message: 'Payment reminder dispatched successfully' }, { status: 200 });
    }

    return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[Automation API] Action failed:', error);
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}
