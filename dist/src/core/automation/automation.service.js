"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.automationService = exports.AutomationService = void 0;
class AutomationService {
    rules = [
        {
            id: 'rule-outstanding-alert',
            name: 'Credit Limit & Overdue Aging Alert',
            description: 'Trigger notification when party outstanding balance exceeds ₹50,000 in >90 days bucket',
            triggerType: 'OUTSTANDING_EXCEEDED',
            condition: {
                field: 'bucket90Plus',
                operator: 'greater_than',
                value: 50000,
            },
            action: {
                channel: 'EMAIL',
                recipient: 'accounts@agrawaltrading.com',
                template: 'Payment Reminder: Account {{partyName}} has ₹{{bucket90Plus}} overdue past 90 days.',
            },
            enabled: true,
            executionCount: 14,
            lastTriggeredAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        },
        {
            id: 'rule-low-stock-reorder',
            name: 'Pharma SKU Low Stock Reorder Warning',
            description: 'Trigger purchase recommendation when warehouse inventory drops below 20 units',
            triggerType: 'STOCK_LOW',
            condition: {
                field: 'quantityOnHand',
                operator: 'less_than',
                value: 20,
            },
            action: {
                channel: 'IN_APP_ALERT',
                recipient: 'purchase-desk',
                template: 'Low Stock Alert: {{productName}} has only {{quantityOnHand}} units on hand.',
            },
            enabled: true,
            executionCount: 48,
            lastTriggeredAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
        {
            id: 'rule-ingestion-failure-alert',
            name: 'Pipeline Ingestion Failure Alert',
            description: 'Notify administrator if ERP data connector fails or data latency exceeds SLA',
            triggerType: 'INGESTION_FAILED',
            condition: {
                field: 'status',
                operator: 'equals',
                value: 'FAILED',
            },
            action: {
                channel: 'EMAIL',
                recipient: 'devops@performdigital.com',
                template: 'Ingestion Incident: Job {{jobName}} failed with error: {{errorMessage}}',
            },
            enabled: true,
            executionCount: 0,
        },
        {
            id: 'rule-high-value-sale',
            name: 'High Value B2B Sale Notification',
            description: 'Alert accounts management on transactions exceeding ₹1,00,000',
            triggerType: 'HIGH_VALUE_SALE',
            condition: {
                field: 'netAmount',
                operator: 'greater_than',
                value: 100000,
            },
            action: {
                channel: 'WHATSAPP',
                recipient: '+919452400038',
                template: 'High Value Order: Invoice #{{invoiceId}} for ₹{{netAmount}} placed by {{partyName}}.',
            },
            enabled: true,
            executionCount: 22,
            lastTriggeredAt: new Date(Date.now() - 3600000 * 8).toISOString(),
        },
    ];
    logs = [];
    async listRules() {
        return this.rules;
    }
    async toggleRule(ruleId) {
        const rule = this.rules.find(r => r.id === ruleId);
        if (rule) {
            rule.enabled = !rule.enabled;
        }
        return rule;
    }
    async listLogs() {
        return this.logs;
    }
    async evaluateOutstanding(record) {
        if (record.bucket90Plus > 50000) {
            return this.recordReminder({
                partyName: record.name,
                amount: record.bucket90Plus,
                overdue90Plus: record.bucket90Plus,
                channel: 'EMAIL',
                recipient: 'accounts@agrawaltrading.com',
                message: `High risk overdue alert for ${record.name}`,
            });
        }
        return null;
    }
    async recordReminder(params) {
        const rule = this.rules.find(r => r.id === 'rule-outstanding-alert');
        if (rule) {
            rule.executionCount += 1;
            rule.lastTriggeredAt = new Date().toISOString();
        }
        const logEntry = {
            id: `exec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            ruleId: rule?.id || 'manual-reminder',
            ruleName: 'Manual Payment Recovery Reminder',
            triggeredAt: new Date().toISOString(),
            payload: params,
            actionTaken: `${params.channel} reminder dispatched for ₹${Math.round(params.amount).toLocaleString()} to ${params.recipient || params.partyName}`,
            status: 'SENT',
        };
        this.logs.unshift(logEntry);
        return logEntry;
    }
}
exports.AutomationService = AutomationService;
if (!globalThis.__automationServiceInstance__) {
    globalThis.__automationServiceInstance__ = new AutomationService();
}
exports.automationService = globalThis.__automationServiceInstance__;
