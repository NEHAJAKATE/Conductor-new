import { NextRequest, NextResponse } from 'next/server';
import { segmentRepository, SegmentDefinition } from '@/infrastructure/repositories/segment-repository';

export async function GET(request: NextRequest) {
  try {
    const list = await segmentRepository.list();
    const evaluated = await Promise.all(list.map(async (seg) => {
      const matched = await segmentRepository.matchProfiles(seg.rules);
      return {
        ...seg,
        estimatedSize: matched.length,
        matchedUuids: matched.map(m => m.uuid)
      };
    }));
    return NextResponse.json(evaluated, { status: 200 });
  } catch (error) {
    console.error('[Segments API] List segments failed:', error);
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, rules } = await request.json();
    if (!name || !rules || !Array.isArray(rules)) {
      return NextResponse.json({ message: 'Name and rules array are required' }, { status: 400 });
    }

    const id = `seg-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-6)}`;
    const newSegment: SegmentDefinition = {
      id,
      name,
      description: description || 'Custom dynamic segment',
      rules,
      createdAt: new Date().toISOString()
    };

    await segmentRepository.save(newSegment);
    const matched = await segmentRepository.matchProfiles(rules);

    return NextResponse.json({
      message: 'Segment created successfully',
      segment: {
        ...newSegment,
        estimatedSize: matched.length,
        matchedUuids: matched.map(m => m.uuid)
      }
    }, { status: 201 });
  } catch (error) {
    console.error('[Segments API] Create segment failed:', error);
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ message: 'Segment id is required' }, { status: 400 });
    }

    const deleted = await segmentRepository.delete(id);
    if (!deleted) {
      return NextResponse.json({ message: 'Segment not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Segment deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('[Segments API] Delete segment failed:', error);
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}
