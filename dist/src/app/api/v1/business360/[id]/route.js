"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const bootstrap_1 = require("@/core/services/bootstrap");
async function GET(request, { params }) {
    try {
        const { id } = await params;
        const context = (0, bootstrap_1.bootstrap)();
        const business = await context.businessRepository.findById(id);
        if (!business) {
            return server_1.NextResponse.json({ message: `Business account ${id} not found` }, { status: 404 });
        }
        const outstanding = await context.outstandingRepository.findByBusinessId(id);
        const txs = await context.transactionRepository.list({
            partyId: business.name,
            limit: 15,
        });
        return server_1.NextResponse.json({
            business,
            outstanding,
            recentTransactions: txs.items,
        }, { status: 200 });
    }
    catch (error) {
        console.error('[Business 360 API] Detail fetch failed:', error);
        return server_1.NextResponse.json({ message: error.message }, { status: 500 });
    }
}
