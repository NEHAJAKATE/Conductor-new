"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const bootstrap_1 = require("@/core/services/bootstrap");
async function GET(request) {
    try {
        const context = (0, bootstrap_1.bootstrap)();
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('query') || '';
        const getStats = searchParams.get('stats') === 'true';
        const classification = searchParams.get('classification');
        const city = searchParams.get('city') || undefined;
        const minOutstanding = searchParams.get('minOutstanding') ? parseFloat(searchParams.get('minOutstanding')) : undefined;
        if (getStats) {
            const stats = await context.businessRepository.getStats();
            return server_1.NextResponse.json(stats, { status: 200 });
        }
        const businesses = await context.businessRepository.list({
            query,
            classification,
            city,
            minOutstanding,
        });
        return server_1.NextResponse.json({ businesses }, { status: 200 });
    }
    catch (error) {
        console.error('[Business 360 API] Fetch failed:', error);
        return server_1.NextResponse.json({ message: error.message }, { status: 500 });
    }
}
async function POST(request) {
    try {
        const body = await request.json();
        const context = (0, bootstrap_1.bootstrap)();
        const entity = await context.businessRepository.save(body);
        return server_1.NextResponse.json(entity, { status: 201 });
    }
    catch (error) {
        console.error('[Business 360 API] Create failed:', error);
        return server_1.NextResponse.json({ message: error.message }, { status: 500 });
    }
}
