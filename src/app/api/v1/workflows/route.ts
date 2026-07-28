import { NextResponse, NextRequest } from 'next/server';
import { bootstrap } from '@/core/services/bootstrap';

export async function POST(request: NextRequest) {
  try {
    const { 
      filePath, 
      fileName, 
      connectionName, 
      connectorType, 
      storageType, 
      outputFormat, 
      selectedFiles 
    } = await request.json();

    if (!filePath || !fileName) {
      return NextResponse.json({ message: 'Payload must include filePath and fileName' }, { status: 400 });
    }

    const context = bootstrap();
    const workflow = await context.workflowService.startWorkflow({
      filePath,
      fileName,
      connectionName: connectionName || 'CSV Ingestion Platform',
      connectorType,
      storageType,
      outputFormat,
      selectedFiles,
    });

    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    console.error('[Workflow API] Start failed:', error);
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}
