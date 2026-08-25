"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const erp_adapter_1 = require("../src/core/adapters/erp-adapter");
const canonical_repositories_1 = require("../src/infrastructure/repositories/canonical-repositories");
const business_repository_1 = require("../src/infrastructure/repositories/business-repository");
async function step1IngestAndSave() {
    console.log('=== TASK 5: STEP 1 - INGESTION AND DISK PERSISTENCE ===');
    // Clear any existing ready state
    await canonical_repositories_1.transactionRepository.clear();
    await canonical_repositories_1.inventoryRepository.clear();
    await canonical_repositories_1.outstandingRepository.clear();
    await business_repository_1.businessRepository.clear();
    // Ingest 1: Master Parties
    const masterPath = path_1.default.resolve(process.cwd(), 'data', 'atc_sample_data', 'partymASTER.xls');
    const { businesses } = await erp_adapter_1.ErpAdapter.ingestPartyMaster(masterPath);
    for (const b of businesses) {
        await business_repository_1.businessRepository.save(b);
    }
    // Ingest 2: Journal Transactions
    const journalPath = path_1.default.resolve(process.cwd(), 'data', 'atc_sample_data', 'date_wise_sale_&_purchase_analysis.csv');
    const { transactions } = await erp_adapter_1.ErpAdapter.ingestJournal(journalPath);
    await canonical_repositories_1.transactionRepository.saveBatch(transactions);
    // Ingest 3: Opening Stock
    const stockPath = path_1.default.resolve(process.cwd(), 'data', 'atc_sample_data', 'OPENING STOCK.XLS');
    const { inventory } = await erp_adapter_1.ErpAdapter.ingestStock(stockPath);
    await canonical_repositories_1.inventoryRepository.saveBatch(inventory);
    // Ingest 4: Outstanding Ledger
    const outPath = path_1.default.resolve(process.cwd(), 'data', 'atc_sample_data', 'OUTSTANDING LEDGER.XLS');
    const { outstandings } = await erp_adapter_1.ErpAdapter.ingestOutstanding(outPath);
    await canonical_repositories_1.outstandingRepository.saveBatch(outstandings);
    const txCount = (await canonical_repositories_1.transactionRepository.list({ limit: 1 })).total;
    const bizCount = await business_repository_1.businessRepository.count();
    const invCount = (await canonical_repositories_1.inventoryRepository.list()).length;
    const outCount = (await canonical_repositories_1.outstandingRepository.list()).length;
    console.log(`\n[STEP 1 INGESTION COMPLETE]`);
    console.log(`  Businesses Count: ${bizCount}`);
    console.log(`  Transactions Count: ${txCount}`);
    console.log(`  Inventory SKUs Count: ${invCount}`);
    console.log(`  Outstanding Accounts Count: ${outCount}`);
    console.log(`\nProcess exiting. Memory will now be completely cleared.`);
}
step1IngestAndSave().catch(console.error);
