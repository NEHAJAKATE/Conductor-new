import { NextResponse } from 'next/server';
import { SchemaManagerService, SchemaDomain } from '@/core/schema/schema-manager.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain') as SchemaDomain | null;
    const fields = SchemaManagerService.listFields(domain || undefined);

    const stats = {
      totalFields: fields.length,
      customFieldsCount: fields.filter(f => f.isCustom).length,
      standardFieldsCount: fields.filter(f => !f.isCustom).length,
    };

    return NextResponse.json({
      success: true,
      stats,
      fields,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch schema definitions' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, domain, label, dataType, description, options, defaultValue, required } = body;

    if (!id || !domain || !label) {
      return NextResponse.json(
        { success: false, error: 'Parameter ID, domain, and label are required.' },
        { status: 400 }
      );
    }

    const field = await SchemaManagerService.addField({
      id,
      domain,
      label,
      dataType: dataType || 'text',
      description,
      options,
      defaultValue,
      required: !!required,
    });

    return NextResponse.json({
      success: true,
      message: `Custom parameter '${field.label}' (${field.id}) added to schema successfully.`,
      field,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add custom schema parameter' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Parameter ID is required for deletion.' },
        { status: 400 }
      );
    }

    const deleted = await SchemaManagerService.deleteField(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: `Custom parameter '${id}' not found or is a protected standard field.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Custom parameter '${id}' removed successfully.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete schema parameter' },
      { status: 500 }
    );
  }
}
