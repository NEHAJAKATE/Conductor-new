"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
exports.DELETE = DELETE;
const server_1 = require("next/server");
const segment_repository_1 = require("@/infrastructure/repositories/segment-repository");
async function GET(request) {
    try {
        const list = await segment_repository_1.segmentRepository.list();
        const evaluated = await Promise.all(list.map(async (seg) => {
            const matched = await segment_repository_1.segmentRepository.matchProfiles(seg.rules);
            return {
                ...seg,
                estimatedSize: matched.length,
                matchedUuids: matched.map(m => m.uuid)
            };
        }));
        return server_1.NextResponse.json(evaluated, { status: 200 });
    }
    catch (error) {
        console.error('[Segments API] List segments failed:', error);
        return server_1.NextResponse.json({ message: error.message }, { status: 500 });
    }
}
async function POST(request) {
    try {
        const { name, description, rules } = await request.json();
        if (!name || !rules || !Array.isArray(rules)) {
            return server_1.NextResponse.json({ message: 'Name and rules array are required' }, { status: 400 });
        }
        const id = `seg-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-6)}`;
        const newSegment = {
            id,
            name,
            description: description || 'Custom dynamic segment',
            rules,
            createdAt: new Date().toISOString()
        };
        await segment_repository_1.segmentRepository.save(newSegment);
        const matched = await segment_repository_1.segmentRepository.matchProfiles(rules);
        return server_1.NextResponse.json({
            message: 'Segment created successfully',
            segment: {
                ...newSegment,
                estimatedSize: matched.length,
                matchedUuids: matched.map(m => m.uuid)
            }
        }, { status: 201 });
    }
    catch (error) {
        console.error('[Segments API] Create segment failed:', error);
        return server_1.NextResponse.json({ message: error.message }, { status: 500 });
    }
}
async function DELETE(request) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const id = searchParams.get('id');
        if (!id) {
            return server_1.NextResponse.json({ message: 'Segment id is required' }, { status: 400 });
        }
        const deleted = await segment_repository_1.segmentRepository.delete(id);
        if (!deleted) {
            return server_1.NextResponse.json({ message: 'Segment not found' }, { status: 404 });
        }
        return server_1.NextResponse.json({ message: 'Segment deleted successfully' }, { status: 200 });
    }
    catch (error) {
        console.error('[Segments API] Delete segment failed:', error);
        return server_1.NextResponse.json({ message: error.message }, { status: 500 });
    }
}
