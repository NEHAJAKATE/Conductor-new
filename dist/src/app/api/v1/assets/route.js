"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const bootstrap_1 = require("@/core/services/bootstrap");
async function GET(request) {
    try {
        const context = (0, bootstrap_1.bootstrap)();
        const datasets = await context.datasetRepository.list();
        const workflows = await context.workflowRepository.list();
        const completedWorkflows = workflows.filter(w => w.status === 'completed');
        let rawList = [];
        let normalizedList = [];
        let identityList = [];
        for (const dataset of datasets) {
            rawList.push({ name: dataset.displayName, id: dataset.id });
        }
        for (const wf of completedWorkflows) {
            const stats = wf.stages['statistics']?.data;
            if (stats) {
                if (stats.childResults) {
                    for (const child of stats.childResults) {
                        const normPath = child.normalizedPath || child.silverPath;
                        normalizedList.push({ name: child.name.replace(/\.[^/.]+$/, ''), path: normPath });
                    }
                }
                else {
                    const normPath = stats.normalizedPath || stats.silverPath;
                    normalizedList.push({ name: wf.fileName.replace(/\.[^/.]+$/, ''), path: normPath });
                }
                const records = stats.unifiedRecords || [];
                for (const rec of records) {
                    identityList.push({
                        profile_id: rec._masterProfileId || `kp_${Math.floor(1000 + Math.random() * 9000)}`,
                        email: rec.email || rec.user_email || 'unknown',
                        first_seen: rec.timestamp || rec.date || wf.createdAt.toISOString(),
                        intent_score: rec._confidenceScore || rec.intent_score || 85,
                        lifecycle_stage: rec.lifecycle_stage || (rec._confidenceScore > 80 ? 'MQL' : 'Lead'),
                        matching_reason: rec._matchingReason || 'Identity Resolution Match',
                        ingestion_lineage: rec._ingestionLineage || 'Ingested'
                    });
                }
            }
        }
        return server_1.NextResponse.json({
            datasets,
            raw: rawList,
            bronze: rawList,
            bronzeList: rawList,
            rawList,
            normalized: normalizedList,
            silver: normalizedList,
            silverList: normalizedList,
            normalizedList,
            identityList,
        }, { status: 200 });
    }
    catch (error) {
        console.error('[Assets API] Fetch failed:', error);
        return server_1.NextResponse.json({ message: error.message }, { status: 500 });
    }
}
