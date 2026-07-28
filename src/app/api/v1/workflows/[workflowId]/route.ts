import { NextResponse, NextRequest } from 'next/server';
import { bootstrap } from '@/core/services/bootstrap';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  const { workflowId } = await params;
  try {
    const context = bootstrap();
    const workflow = await context.workflowService.getWorkflow(workflowId);
    if (!workflow) {
      return NextResponse.json({ message: `Workflow ${workflowId} not found` }, { status: 404 });
    }
    return NextResponse.json(workflow, { status: 200 });
  } catch (error) {
    console.error('[Workflow API] Get status failed:', error);
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}
