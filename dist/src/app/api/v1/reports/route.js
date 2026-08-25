"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const bootstrap_1 = require("@/core/services/bootstrap");
const report_service_1 = require("@/core/reports/report.service");
async function GET(request) {
    try {
        const context = (0, bootstrap_1.bootstrap)();
        // No auto-ingest backdoor: reports must only reflect ingested data
        const searchParams = request.nextUrl.searchParams;
        const dataset = (searchParams.get('dataset') || 'sales');
        const startDate = searchParams.get('startDate') || undefined;
        const endDate = searchParams.get('endDate') || undefined;
        const groupBy = searchParams.get('groupBy');
        const filterParty = searchParams.get('filterParty') || undefined;
        const filterCompany = searchParams.get('filterCompany') || undefined;
        const filterRisk = searchParams.get('filterRisk') || undefined;
        const search = searchParams.get('search') || undefined;
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit'), 10) : 50;
        const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset'), 10) : 0;
        const sortBy = searchParams.get('sortBy') || undefined;
        const sortOrder = searchParams.get('sortOrder') || 'desc';
        const queryParams = {
            dataset,
            startDate,
            endDate,
            groupBy,
            filterParty,
            filterCompany,
            filterRisk,
            search,
            limit,
            offset,
            sortBy,
            sortOrder,
        };
        const report = await report_service_1.ReportService.generateReport(queryParams);
        return server_1.NextResponse.json(report, { status: 200 });
    }
    catch (error) {
        console.error('[Reports API] Generate report failed:', error);
        return server_1.NextResponse.json({ message: error.message }, { status: 500 });
    }
}
