"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class ExcalidrawBuilder {
    elements = [];
    seedCounter = 1000;
    nextSeed() {
        return this.seedCounter++;
    }
    addBox(id, x, y, width, height, bgColor, strokeColor, title, subtitle) {
        const seed = this.nextSeed();
        // Box
        this.elements.push({
            id,
            type: 'rectangle',
            x,
            y,
            width,
            height,
            angle: 0,
            strokeColor,
            backgroundColor: bgColor,
            fillStyle: 'solid',
            strokeWidth: 2,
            strokeStyle: 'solid',
            roughness: 1,
            opacity: 100,
            groupIds: [],
            roundness: { type: 3 },
            seed,
            version: 1,
            versionNonce: 1,
            isDeleted: false,
            boundElements: null,
            updated: 1,
            link: null,
            locked: false,
        });
        // Title Text
        this.elements.push({
            id: `${id}_title`,
            type: 'text',
            x: x + 12,
            y: y + 10,
            width: width - 24,
            height: 22,
            angle: 0,
            strokeColor: '#f8fafc',
            backgroundColor: 'transparent',
            fillStyle: 'solid',
            strokeWidth: 1,
            strokeStyle: 'solid',
            roughness: 0,
            opacity: 100,
            groupIds: [],
            roundness: null,
            seed: this.nextSeed(),
            version: 1,
            versionNonce: 1,
            isDeleted: false,
            boundElements: null,
            updated: 1,
            link: null,
            locked: false,
            text: title,
            fontSize: 14,
            fontFamily: 2,
            textAlign: 'left',
            verticalAlign: 'top',
            baseline: 16,
            containerId: null,
            originalText: title,
            lineHeight: 1.2,
        });
        // Subtitle Text
        if (subtitle) {
            this.elements.push({
                id: `${id}_sub`,
                type: 'text',
                x: x + 12,
                y: y + 34,
                width: width - 24,
                height: height - 42,
                angle: 0,
                strokeColor: '#94a3b8',
                backgroundColor: 'transparent',
                fillStyle: 'solid',
                strokeWidth: 1,
                strokeStyle: 'solid',
                roughness: 0,
                opacity: 100,
                groupIds: [],
                roundness: null,
                seed: this.nextSeed(),
                version: 1,
                versionNonce: 1,
                isDeleted: false,
                boundElements: null,
                updated: 1,
                link: null,
                locked: false,
                text: subtitle,
                fontSize: 11,
                fontFamily: 2,
                textAlign: 'left',
                verticalAlign: 'top',
                baseline: 12,
                containerId: null,
                originalText: subtitle,
                lineHeight: 1.2,
            });
        }
    }
    addArrow(id, startX, startY, endX, endY, color = '#64748b') {
        const seed = this.nextSeed();
        const dx = endX - startX;
        const dy = endY - startY;
        this.elements.push({
            id,
            type: 'arrow',
            x: startX,
            y: startY,
            width: Math.abs(dx),
            height: Math.abs(dy),
            angle: 0,
            strokeColor: color,
            backgroundColor: 'transparent',
            fillStyle: 'solid',
            strokeWidth: 2,
            strokeStyle: 'solid',
            roughness: 1,
            opacity: 100,
            groupIds: [],
            roundness: { type: 2 },
            seed,
            version: 1,
            versionNonce: 1,
            isDeleted: false,
            boundElements: null,
            updated: 1,
            link: null,
            locked: false,
            points: [[0, 0], [dx, dy]],
        });
    }
    addSectionHeader(id, x, y, width, title, color) {
        this.elements.push({
            id: `${id}_bg`,
            type: 'rectangle',
            x,
            y,
            width,
            height: 36,
            angle: 0,
            strokeColor: color,
            backgroundColor: `${color}22`,
            fillStyle: 'solid',
            strokeWidth: 1,
            strokeStyle: 'solid',
            roughness: 0,
            opacity: 100,
            groupIds: [],
            roundness: { type: 3 },
            seed: this.nextSeed(),
            version: 1,
            versionNonce: 1,
            isDeleted: false,
            boundElements: null,
            updated: 1,
            link: null,
            locked: false,
        });
        this.elements.push({
            id: `${id}_text`,
            type: 'text',
            x: x + 16,
            y: y + 8,
            width: width - 32,
            height: 20,
            angle: 0,
            strokeColor: color,
            backgroundColor: 'transparent',
            fillStyle: 'solid',
            strokeWidth: 1,
            strokeStyle: 'solid',
            roughness: 0,
            opacity: 100,
            groupIds: [],
            roundness: null,
            seed: this.nextSeed(),
            version: 1,
            versionNonce: 1,
            isDeleted: false,
            boundElements: null,
            updated: 1,
            link: null,
            locked: false,
            text: title,
            fontSize: 14,
            fontFamily: 2,
            textAlign: 'left',
            verticalAlign: 'middle',
            baseline: 14,
            containerId: null,
            originalText: title,
            lineHeight: 1.2,
        });
    }
    exportJSON() {
        return JSON.stringify({
            type: 'excalidraw',
            version: 2,
            source: 'https://excalidraw.com',
            elements: this.elements,
            appState: {
                gridSize: null,
                viewBackgroundColor: '#090d16',
            },
            files: {},
        }, null, 2);
    }
}
function generateDiagram() {
    const b = new ExcalidrawBuilder();
    // Column X coordinates
    const col1 = 60; // Raw Inputs
    const col2 = 360; // Parsing & Sanitization
    const col3 = 680; // Domain Storage & Repos
    const col4 = 1000; // Core Engines
    const col5 = 1320; // Security & API Gateway
    const col6 = 1640; // Frontend UI
    const boxW = 260;
    // Title Banner
    b.addBox('main_title', 60, 20, 1840, 70, '#1e293b', '#38bdf8', '🚀 ATC CONDUCTOR — MASTER ENTERPRISE ARCHITECTURE', 'End-to-End Visual Dataflow, File-by-File Mappings, Zero-Loss Accounting Guardrails & Cryptographic Security');
    // LAYER 1: Raw Inputs
    b.addSectionHeader('sec_raw', col1, 110, boxW, '1. RAW ERP & BANK INPUTS', '#38bdf8');
    b.addBox('raw_journal', col1, 160, boxW, 85, '#0f172a', '#38bdf8', 'date_wise_sale_&_purchase.csv', '86,785 rows • ₹9.50 Cr Sales\nContains Sale, Purc, Returns & Marg discount adjustments.');
    b.addBox('raw_parties', col1, 260, boxW, 80, '#0f172a', '#38bdf8', 'partymASTER.xls', '2,696 B2B Accounts • Drug Lic\nGSTIN, routes, credit limits & party address directory.');
    b.addBox('raw_stock', col1, 355, boxW, 80, '#0f172a', '#38bdf8', 'OPENING STOCK.XLS', '3,947 SKUs • Batch & MRP\nBase opening balances for running inventory ledger.');
    b.addBox('raw_out', col1, 450, boxW, 80, '#0f172a', '#38bdf8', 'OUTSTANDING LEDGER.xls', '630 Overdue Accounts • ₹1.42 Cr\nMonthly age breakdown: Mar, Feb, Jan, Dec & Older.');
    b.addBox('raw_bank', col1, 545, boxW, 80, '#0f172a', '#38bdf8', 'BANK & CASH LEDGERS.XLS', '3,349 Bank Entries • 7 Accounts\nMulti-sheet bank deposits, withdrawals & cheque clearing.');
    // LAYER 2: Parsing & Ingestion
    b.addSectionHeader('sec_ingest', col2, 110, boxW, '2. PARSE, VALIDATE & QUARANTINE', '#f59e0b');
    b.addBox('f_parser', col2, 160, boxW, 85, '#18181b', '#f59e0b', 'parser-factory.ts', 'Binary XLS & CSV Streamer\nStrips byte-order marks, decodes sheets, cleans null matrix cells.');
    b.addBox('f_val', col2, 260, boxW, 80, '#18181b', '#f59e0b', 'validation.service.ts', 'Schema & Domain Classifier\nInfers domain, verifies headers, sanitizes dates & detects PII.');
    b.addBox('f_adapter', col2, 355, boxW, 80, '#18181b', '#f59e0b', 'erp-adapter.ts', 'Domain Data Transformers\nOrchestrates Party, Journal, Stock and Outstanding extractions.');
    b.addBox('f_map', col2, 450, boxW, 80, '#18181b', '#f59e0b', 'canonical-mapping.service.ts', 'Paisa-Level Normalizer\nPreserves signed discounts (-0.01) while computing exact gross/net.');
    b.addBox('f_rej', col2, 545, boxW, 80, '#18181b', '#ef4444', 'rejection-log.service.ts', 'Quarantine Rejection Engine\nPreserves line numbers & exact failure reasons to rejected_rows.jsonl.');
    // LAYER 3: Storage & Repos
    b.addSectionHeader('sec_storage', col3, 110, boxW, '3. STORAGE & REPOSITORIES', '#10b981');
    b.addBox('r_tx', col3, 160, boxW, 85, '#064e3b', '#10b981', 'data/ready/transactions.json', '86,784 Atomic Records\nNet Sales: ₹95,052,611.91\nNet Purchases: ₹93,642,186.16');
    b.addBox('r_biz', col3, 260, boxW, 80, '#064e3b', '#10b981', 'data/ready/businesses.json', '2,696 B2B Accounts\nLazy disk rehydration on system reboot via BusinessRepository.');
    b.addBox('r_inv', col3, 355, boxW, 80, '#064e3b', '#10b981', 'data/ready/inventory.json', '3,947 Running Inventory SKUs\nTracks opening stock, inward purchases & outward sales.');
    b.addBox('r_out', col3, 450, boxW, 80, '#064e3b', '#10b981', 'data/ready/outstanding.json', '630 Debt Ledgers (₹1.42 Cr)\n0-30D, 31-60D, 61-90D, >90D aged customer exposure matrix.');
    b.addBox('r_rej_file', col3, 545, boxW, 80, '#450a0a', '#ef4444', 'data/ready/rejected_rows.jsonl', 'Tamper-Proof Quarantine Log\nJSONL file of quarantined bad rows for audit inspection.');
    // LAYER 4: Business Intelligence Engines
    b.addSectionHeader('sec_engines', col4, 110, boxW, '4. BUSINESS ENGINES', '#8b5cf6');
    b.addBox('e_rep', col4, 160, boxW, 85, '#2e1065', '#8b5cf6', 'report.service.ts', 'Paisa-Level Financial Engine\nExact Gross/Net Sales, Purchases, Output GST & Input Tax Credit.');
    b.addBox('e_inv_ledg', col4, 260, boxW, 80, '#2e1065', '#8b5cf6', 'inventory-ledger.service.ts', 'Running Stock & Reorder Rule\nOpening + Purchases - Sales ± Returns with 25-strip threshold alerts.');
    b.addBox('e_recon', col4, 355, boxW, 80, '#2e1065', '#8b5cf6', 'bank-reconciliation.service.ts', '4-Stage Fuzzy Bank Matcher\nMatches vouchers, exact amounts, date windows & party names.');
    b.addBox('e_auto', col4, 450, boxW, 80, '#2e1065', '#8b5cf6', 'automation.service.ts', 'Rule Engine & Alert Triggers\nDispatches low stock triggers, debt limits & recovery notifications.');
    b.addBox('e_sched', col4, 545, boxW, 80, '#2e1065', '#8b5cf6', 'scheduler.service.ts', 'Cron & Background Jobs\nSchedules automated bank recon, nightly ERP sync & audit logs.');
    // LAYER 5: Security & API Gateway
    b.addSectionHeader('sec_api', col5, 110, boxW, '5. SECURITY & REST API', '#ec4899');
    b.addBox('sec_auth', col5, 160, boxW, 85, '#831843', '#ec4899', 'session.service & password.ts', 'HMAC-SHA256 & Scrypt\nEncrypted session cookies, scrypt password hashes, zero plaintext.');
    b.addBox('sec_rbac', col5, 260, boxW, 80, '#831843', '#ec4899', 'rbac.service.ts & audit.service', 'Server-Side Access Guard\nOWNER vs STAFF permissions. Emits audit trail to audit_logs.jsonl.');
    b.addBox('api_reports', col5, 355, boxW, 80, '#0284c7', '#38bdf8', 'API: /api/v1/reports', 'Financial & GST Aggregates\nDelivers dynamic sales, purchases, spend & tax metrics.');
    b.addBox('api_biz', col5, 450, boxW, 80, '#0284c7', '#38bdf8', 'API: /api/v1/business360', 'B2B Directory & Customer 360\nSearchable party records, transaction history & risk score.');
    b.addBox('api_recon_rej', col5, 545, boxW, 80, '#0284c7', '#38bdf8', 'API: /reconciliation & /rejected', 'Bank Recon & Quarantine API\nDelivers bank matched lines (Owner) & quarantined row details.');
    // LAYER 6: Frontend Views
    b.addSectionHeader('sec_ui', col6, 110, boxW, '6. OPERATOR FRONTEND UI', '#06b6d4');
    b.addBox('ui_home_sales', col6, 160, boxW, 85, '#0e7490', '#06b6d4', 'Overview, Sales & Spend', 'src/app/page.tsx, /sales, /purchases\nLive KPI dashboard, invoice logs, spend breakdown & GST reports.');
    b.addBox('ui_inv', col6, 260, boxW, 80, '#0e7490', '#06b6d4', 'Stock & Auto-Reorder', 'src/app/inventory/page.tsx\n3,947 SKUs running inventory with 1-click PO draft generator.');
    b.addBox('ui_out', col6, 355, boxW, 80, '#0e7490', '#06b6d4', 'Receivables & WhatsApp Recovery', 'src/app/outstanding/page.tsx\nAgeing breakdown & 1-click WhatsApp payment reminders.');
    b.addBox('ui_recon', col6, 450, boxW, 80, '#0e7490', '#06b6d4', 'Bank Reconciliation (Owner)', 'src/app/reconciliation/page.tsx\n679 matched items, ₹58.29 Lakh verified, multi-bill clearing notes.');
    b.addBox('ui_ingest', col6, 545, boxW, 80, '#0e7490', '#06b6d4', '1-Click Connect & Rejection Modal', 'src/app/ingestion/page.tsx\n1-click ingestion workflow & interactive quarantined row inspector.');
    // Arrows across stages
    // Raw -> Parser
    b.addArrow('a_r1', col1 + boxW, 202, col2, 202, '#38bdf8');
    b.addArrow('a_r2', col1 + boxW, 300, col2, 300, '#38bdf8');
    b.addArrow('a_r3', col1 + boxW, 395, col2, 395, '#38bdf8');
    b.addArrow('a_r4', col1 + boxW, 490, col2, 490, '#38bdf8');
    b.addArrow('a_r5', col1 + boxW, 585, col2, 585, '#38bdf8');
    // Parser -> Storage
    b.addArrow('a_p1', col2 + boxW, 202, col3, 202, '#10b981');
    b.addArrow('a_p2', col2 + boxW, 300, col3, 300, '#10b981');
    b.addArrow('a_p3', col2 + boxW, 395, col3, 395, '#10b981');
    b.addArrow('a_p4', col2 + boxW, 490, col3, 490, '#10b981');
    b.addArrow('a_p5', col2 + boxW, 585, col3, 585, '#ef4444');
    // Storage -> Engines
    b.addArrow('a_s1', col3 + boxW, 202, col4, 202, '#8b5cf6');
    b.addArrow('a_s2', col3 + boxW, 300, col4, 300, '#8b5cf6');
    b.addArrow('a_s3', col3 + boxW, 395, col4, 395, '#8b5cf6');
    b.addArrow('a_s4', col3 + boxW, 490, col4, 490, '#8b5cf6');
    // Engines -> Security & API
    b.addArrow('a_e1', col4 + boxW, 202, col5, 202, '#ec4899');
    b.addArrow('a_e2', col4 + boxW, 300, col5, 300, '#ec4899');
    b.addArrow('a_e3', col4 + boxW, 395, col5, 395, '#ec4899');
    b.addArrow('a_e4', col4 + boxW, 490, col5, 490, '#ec4899');
    // API -> UI
    b.addArrow('a_u1', col5 + boxW, 202, col6, 202, '#06b6d4');
    b.addArrow('a_u2', col5 + boxW, 300, col6, 300, '#06b6d4');
    b.addArrow('a_u3', col5 + boxW, 395, col6, 395, '#06b6d4');
    b.addArrow('a_u4', col5 + boxW, 490, col6, 490, '#06b6d4');
    b.addArrow('a_u5', col5 + boxW, 585, col6, 585, '#06b6d4');
    const jsonStr = b.exportJSON();
    const outPath = path_1.default.resolve(process.cwd(), 'conductor_architecture_master.excalidraw');
    fs_1.default.writeFileSync(outPath, jsonStr, 'utf8');
    console.log(`Successfully generated Excalidraw diagram: ${outPath} (${jsonStr.length} bytes)`);
    const brainPath = 'C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\33d534dd-24e7-4e3a-965e-e3e2c1011868\\conductor_architecture_master.excalidraw';
    fs_1.default.writeFileSync(brainPath, jsonStr, 'utf8');
    console.log(`Saved artifact copy: ${brainPath}`);
}
generateDiagram();
