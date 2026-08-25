"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const bootstrap_1 = require("@/core/services/bootstrap");
async function POST(request, { params }) {
    const { workflowId } = await params;
    try {
        const context = (0, bootstrap_1.bootstrap)();
        const workflow = await context.workflowService.confirmWorkflow(workflowId);
        return server_1.NextResponse.json(workflow, { status: 200 });
    }
    catch (error) {
        console.error('[Workflow API] Confirm failed:', error);
        return server_1.NextResponse.json({ message: error.message }, { status: 400 });
    }
}
