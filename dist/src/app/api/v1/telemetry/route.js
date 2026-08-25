"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const bootstrap_1 = require("@/core/services/bootstrap");
async function GET(request) {
    try {
        const context = (0, bootstrap_1.bootstrap)();
        const metrics = await context.statisticsService.listAllMetrics();
        return server_1.NextResponse.json(metrics, { status: 200 });
    }
    catch (error) {
        console.error('[Telemetry API] List failed:', error);
        return server_1.NextResponse.json({ message: error.message }, { status: 500 });
    }
}
