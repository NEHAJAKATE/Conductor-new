import { NextResponse, NextRequest } from 'next/server';
import { bootstrap } from '@/core/services/bootstrap';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  const { workflowId } = await params;
  try {
    const context = bootstrap();
    const workflow = await context.workflowService.confirmWorkflow(workflowId);
    return NextResponse.json(workflow, { status: 200 });
  } catch (error) {
    console.error('[Workflow API] Confirm failed:', error);
    return NextResponse.json({ message: (error as Error).message }, { status: 400 });
  }
}
