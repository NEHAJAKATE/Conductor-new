"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const mockaroo_generator_1 = require("@/core/customer360/services/mockaroo-generator");
const dataset_parser_service_1 = require("@/core/customer360/services/dataset-parser.service");
const bootstrap_1 = require("@/core/services/bootstrap");
const cdp_repositories_1 = require("@/infrastructure/repositories/cdp-repositories");
async function POST(request) {
    try {
        const { datasetType, rowCount } = await request.json();
        const count = Number(rowCount || 20);
        let rows = [];
        let filename = '';
        // Generate identities first if behavior/financial is requested but identities store is empty
        const identities = await cdp_repositories_1.identityRepository.list();
        let currentIdentities = [...identities];
        if (currentIdentities.length === 0 && (datasetType === 'behavior' || datasetType === 'financial')) {
            // Auto-generate seed identities first
            const seed = mockaroo_generator_1.mockarooGenerator.generateIdentities(15);
            const seedRecords = seed.map(id => ({
                ...id,
                sourceSystem: 'auto_seed_identity.csv',
                ingestedAt: new Date().toISOString()
            }));
            for (const id of seedRecords) {
                await cdp_repositories_1.identityRepository.save(id);
            }
            currentIdentities = seedRecords;
        }
        if (datasetType === 'identity') {
            const generated = mockaroo_generator_1.mockarooGenerator.generateIdentities(count);
            rows = generated;
            filename = 'mockaroo_identity_dataset.json';
        }
        else if (datasetType === 'behavior') {
            const generated = mockaroo_generator_1.mockarooGenerator.generateBehavioral(currentIdentities, count);
            rows = generated;
            filename = 'mockaroo_behavioral_dataset.json';
        }
        else if (datasetType === 'financial') {
            const generated = mockaroo_generator_1.mockarooGenerator.generateFinancial(currentIdentities, count);
            rows = generated;
            filename = 'mockaroo_financial_dataset.json';
        }
        else {
            return server_1.NextResponse.json({ message: 'Invalid dataset type.' }, { status: 400 });
        }
        const buffer = Buffer.from(JSON.stringify(rows), 'utf-8');
        const parseResult = await dataset_parser_service_1.datasetParserService.parseAndIngest(buffer, filename);
        // Register metadata
        const context = (0, bootstrap_1.bootstrap)();
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
        return server_1.NextResponse.json({
            message: `Successfully generated and ingested ${parseResult.rowCount} records for ${datasetType}.`,
            filename,
            parseResult,
            metadata
        }, { status: 201 });
    }
    catch (error) {
        console.error('[Mockaroo Ingest API] Generation failed:', error);
        return server_1.NextResponse.json({ message: error.message }, { status: 500 });
    }
}
