"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const segment_repository_1 = require("@/infrastructure/repositories/segment-repository");
let syncStore = [
    {
        jobId: 'sync-meta-101',
        segmentId: 'seg-premium-india',
        segmentName: 'Premium Indian Customers',
        destination: 'meta',
        status: 'Synced',
        syncTime: new Date(Date.now() - 3600000 * 4).toISOString(),
        rowsSynced: 124,
        latencyMs: 1420,
        retries: 0,
        campaignResults: {
            ctr: 3.42,
            conversionRate: 1.25,
            revenue: 45000,
            roi: 3.8,
            ctrComparison: 18.5
        }
    },
    {
        jobId: 'sync-email-102',
        segmentId: 'seg-active-campaign',
        segmentName: 'Active Campaign Target Group',
        destination: 'email',
        status: 'Synced',
        syncTime: new Date(Date.now() - 3600000 * 8).toISOString(),
        rowsSynced: 87,
        latencyMs: 980,
        retries: 1,
        campaignResults: {
            ctr: 12.8,
            conversionRate: 4.6,
            revenue: 12000,
            roi: 5.2,
            ctrComparison: 32.1
        }
    }
];
async function GET(request) {
    try {
        // Generate analytics summary
        const totalSynced = syncStore.filter(s => s.status === 'Synced').reduce((a, c) => a + c.rowsSynced, 0);
        const totalRevenue = syncStore.reduce((a, c) => a + (c.campaignResults?.revenue || 0), 0);
        const avgRoi = syncStore.length > 0
            ? Number((syncStore.reduce((a, c) => a + (c.campaignResults?.roi || 0), 0) / syncStore.length).toFixed(2))
            : 0;
        return server_1.NextResponse.json({
            jobs: syncStore,
            summary: {
                totalSynced,
                totalRevenue,
                avgRoi,
                campaignsCount: syncStore.length
            }
        }, { status: 200 });
    }
    catch (error) {
        console.error('[Destinations API] Get failed:', error);
        return server_1.NextResponse.json({ message: error.message }, { status: 500 });
    }
}
async function POST(request) {
    try {
        const { segmentId, destination } = await request.json();
        if (!segmentId || !destination) {
            return server_1.NextResponse.json({ message: 'Segment ID and destination are required' }, { status: 400 });
        }
        const segments = await segment_repository_1.segmentRepository.list();
        const segment = segments.find(s => s.id === segmentId);
        if (!segment) {
            return server_1.NextResponse.json({ message: 'Segment not found' }, { status: 404 });
        }
        const matched = await segment_repository_1.segmentRepository.matchProfiles(segment.rules);
        const jobId = `sync-${destination}-${Date.now().toString().slice(-6)}`;
        const newJob = {
            jobId,
            segmentId,
            segmentName: segment.name,
            destination,
            status: 'Synced',
            syncTime: new Date().toISOString(),
            rowsSynced: matched.length,
            latencyMs: Math.floor(400 + Math.random() * 1200),
            retries: 0,
            campaignResults: {
                ctr: Number((2.0 + Math.random() * 5.0).toFixed(2)),
                conversionRate: Number((0.5 + Math.random() * 2.0).toFixed(2)),
                revenue: matched.length * 150,
                roi: Number((2.0 + Math.random() * 3.5).toFixed(1)),
                ctrComparison: Number((10 + Math.random() * 25).toFixed(1))
            }
        };
        syncStore.unshift(newJob);
        return server_1.NextResponse.json({
            message: 'Marketing activation sync completed successfully.',
            job: newJob
        }, { status: 201 });
    }
    catch (error) {
        console.error('[Destinations API] Sync trigger failed:', error);
        return server_1.NextResponse.json({ message: error.message }, { status: 500 });
    }
}
