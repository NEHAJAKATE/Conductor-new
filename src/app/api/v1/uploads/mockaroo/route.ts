import { NextRequest, NextResponse } from 'next/server';
import { mockarooGenerator } from '@/core/customer360/services/mockaroo-generator';
import { datasetParserService } from '@/core/customer360/services/dataset-parser.service';
import { bootstrap } from '@/core/services/bootstrap';
import { identityRepository } from '@/infrastructure/repositories/cdp-repositories';

export async function POST(request: NextRequest) {
  try {
    const { datasetType, rowCount } = await request.json();
    const count = Number(rowCount || 20);

    let rows: any[] = [];
    let filename = '';

    // Generate identities first if behavior/financial is requested but identities store is empty
    const identities = await identityRepository.list();
    let currentIdentities = [...identities];

    if (currentIdentities.length === 0 && (datasetType === 'behavior' || datasetType === 'financial')) {
      // Auto-generate seed identities first
      const seed = mockarooGenerator.generateIdentities(15);
      const seedRecords = seed.map(id => ({
        ...id,
        sourceSystem: 'auto_seed_identity.csv',
        ingestedAt: new Date().toISOString()
      }));
      for (const id of seedRecords) {
        await identityRepository.save(id);
      }
      currentIdentities = seedRecords;
    }

    if (datasetType === 'identity') {
      const generated = mockarooGenerator.generateIdentities(count);
      rows = generated;
      filename = 'mockaroo_identity_dataset.json';
    } else if (datasetType === 'behavior') {
      const generated = mockarooGenerator.generateBehavioral(currentIdentities, count);
      rows = generated;
      filename = 'mockaroo_behavioral_dataset.json';
    } else if (datasetType === 'financial') {
      const generated = mockarooGenerator.generateFinancial(currentIdentities, count);
      rows = generated;
      filename = 'mockaroo_financial_dataset.json';
    } else {
      return NextResponse.json({ message: 'Invalid dataset type.' }, { status: 400 });
    }

    const buffer = Buffer.from(JSON.stringify(rows), 'utf-8');
    const parseResult = await datasetParserService.parseAndIngest(buffer, filename);

    // Register metadata
    const context = bootstrap();
    const metadata = await context.metadataService.registerMetadata({
      datasetId: `mockaroo-${datasetType}-${Date.now()}`,
      datasetName: filename,
      bucket: 'mockaroo-vault',
      objectKey: `mockaroo/${filename}`,
      size: buffer.length,
      delimiter: 'JSON',
      encoding: 'utf-8',
      uploadedBy: 'system-agent',
      uploadedAt: new Date().toISOString(),
      status: 'raw',
      connector: 'mockaroo',
      checksum: `md5-${Math.floor(10000 + Math.random() * 90000)}`,
    });

    return NextResponse.json({
      message: `Successfully generated and ingested ${parseResult.rowCount} records for ${datasetType}.`,
      filename,
      parseResult,
      metadata
    }, { status: 201 });
  } catch (error) {
    console.error('[Mockaroo Ingest API] Generation failed:', error);
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}
