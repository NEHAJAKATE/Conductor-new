import { NextResponse } from 'next/server';
import { SchemaManagerService, SchemaDomain, SchemaDataType } from '@/core/schema/schema-manager.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain') as SchemaDomain | null;
    const fields = SchemaManagerService.listFields(domain || undefined);

    const stats = {
      totalFields: fields.length,
      customFieldsCount: fields.filter(f => f.isCustom).length,
      standardFieldsCount: fields.filter(f => !f.isCustom).length,
      customizedStandardCount: fields.filter(f => !f.isCustom && f.isOverride).length,
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

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { oldId, id, domain, label, dataType, description, options, defaultValue, required, resetToDefault } = body;

    if (!oldId) {
      return NextResponse.json(
        { success: false, error: 'Original parameter ID (oldId) is required for updates.' },
        { status: 400 }
      );
    }

    if (resetToDefault) {
      const reset = await SchemaManagerService.resetFieldToDefault(oldId);
      return NextResponse.json({
        success: true,
        message: reset ? `Parameter '${oldId}' reset to default.` : 'No custom override to reset.',
      });
    }

    if (!label) {
      return NextResponse.json(
        { success: false, error: 'Parameter label / name is required.' },
        { status: 400 }
      );
    }

    const result = await SchemaManagerService.updateField(oldId, {
      id,
      domain: domain as SchemaDomain,
      label,
      dataType: dataType as SchemaDataType,
      description,
      options,
      defaultValue,
      required: !!required,
    });

    const msg = result.recordsMigrated > 0
      ? `Parameter '${result.field.label}' updated successfully and migrated ${result.recordsMigrated} data record(s) in real time.`
      : `Parameter '${result.field.label}' updated successfully.`;

    return NextResponse.json({
      success: true,
      message: msg,
      field: result.field,
      recordsMigrated: result.recordsMigrated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update schema parameter' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  return PUT(request);
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
        { success: false, error: `Parameter '${id}' not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Parameter '${id}' removed / reset successfully.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete schema parameter' },
      { status: 500 }
    );
  }
}
