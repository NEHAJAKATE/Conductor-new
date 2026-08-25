"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const bootstrap_1 = require("@/core/services/bootstrap");
async function GET(request, { params }) {
    const { workflowId } = await params;
    try {
        const context = (0, bootstrap_1.bootstrap)();
        const workflow = await context.workflowService.getWorkflow(workflowId);
        if (!workflow) {
            return server_1.NextResponse.json({ message: `Workflow ${workflowId} not found` }, { status: 404 });
        }
        return server_1.NextResponse.json(workflow, { status: 200 });
    }
    catch (error) {
        console.error('[Workflow API] Get status failed:', error);
        return server_1.NextResponse.json({ message: error.message }, { status: 500 });
    }
}
