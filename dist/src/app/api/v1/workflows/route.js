"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const bootstrap_1 = require("@/core/services/bootstrap");
async function GET() {
    try {
        const context = (0, bootstrap_1.bootstrap)();
        const workflows = await context.workflowRepository.list();
        return server_1.NextResponse.json({ workflows }, { status: 200 });
    }
    catch (error) {
        console.error('[Workflow API] List failed:', error);
        return server_1.NextResponse.json({ message: error.message }, { status: 500 });
    }
}
async function POST(request) {
    try {
        const { filePath, fileName, connectionName, connectorType, storageType, outputFormat, selectedFiles } = await request.json();
        if (!filePath || !fileName) {
            return server_1.NextResponse.json({ message: 'Payload must include filePath and fileName' }, { status: 400 });
        }
        const context = (0, bootstrap_1.bootstrap)();
        const workflow = await context.workflowService.startWorkflow({
            filePath,
            fileName,
            connectionName: connectionName || 'CSV Ingestion Platform',
            connectorType,
            storageType,
            outputFormat,
            selectedFiles,
        });
        return server_1.NextResponse.json(workflow, { status: 201 });
    }
    catch (error) {
        console.error('[Workflow API] Start failed:', error);
        return server_1.NextResponse.json({ message: error.message }, { status: 500 });
    }
}
