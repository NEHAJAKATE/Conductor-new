"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const canonical_repositories_1 = require("../src/infrastructure/repositories/canonical-repositories");
const business_repository_1 = require("../src/infrastructure/repositories/business-repository");
async function testPersistence() {
    console.log('Testing Step 7: Disk-backed Persistence across restart...');
    const readyDir = path_1.default.resolve(process.cwd(), 'data', 'ready');
    console.log('Target ready persistence directory:', readyDir);
    // 1. First Process Instance
    const repo1 = new canonical_repositories_1.TransactionRepository();
    await repo1.clear();
    const testTx = {
        id: 'tx_persistence_test_101',
        invoiceId: 'INV-TEST-999',
        type: 'sale',
        date: '2026-08-18T10:00:00.000Z',
        partyName: 'AGRAWAL MEDICO PERSISTENCE TEST',
        items: [{
                productId: 'prod:augmentin_625',
                productName: 'AUGMENTIN 625',
                quantity: 50,
                unitRate: 120,
                netAmount: 6000,
                gstRate: 12,
                taxAmount: 720,
            }],
        netAmount: 6000,
        taxAmount: 720,
        grossAmount: 6720,
        sourceSystem: 'Persistence Test',
        createdAt: new Date().toISOString(),
    };
    await repo1.saveBatch([testTx]);
    console.log('1. Saved test transaction in Instance 1');
    // Verify file exists on disk
    const txFilePath = path_1.default.join(readyDir, 'transactions.json');
    if (!fs_1.default.existsSync(txFilePath)) {
        throw new Error(`Persistence file not found on disk at: ${txFilePath}`);
    }
    console.log('2. Verified transactions.json exists on disk');
    // 2. Simulated Server Restart (Instance 2)
    console.log('3. Simulating server restart (Creating new TransactionRepository instance)...');
    const repo2 = new canonical_repositories_1.TransactionRepository();
    const loadedTxs = await repo2.getAll();
    console.log(`4. Instance 2 loaded ${loadedTxs.length} transactions from disk.`);
    const matched = loadedTxs.find(t => t.id === 'tx_persistence_test_101');
    if (matched && matched.partyName === 'AGRAWAL MEDICO PERSISTENCE TEST' && matched.grossAmount === 6720) {
        console.log('5. Verified loaded transaction content matches original exactly.');
    }
    else {
        console.error('FAILED: Transaction did not survive server restart!');
        process.exit(1);
    }
    // 3. Test BusinessRepository persistence
    const bRepo1 = new business_repository_1.BusinessRepository();
    await bRepo1.clear();
    await bRepo1.save({
        id: 'party_test_persistence_1',
        name: 'TEST PHARMA DISTRIBUTOR',
        legalName: 'TEST PHARMA DISTRIBUTOR PVT LTD',
        taxId: '09AAACR5050K1Z2',
        classification: 'b2b_dealer',
        address: { city: 'Prayagraj' },
        contact: {},
        credit: { creditDays: 30, creditLimit: 200000 },
        sourceSystem: 'Persistence Test',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });
    const bRepo2 = new business_repository_1.BusinessRepository();
    const bList = await bRepo2.list();
    const bMatched = bList.find(b => b.id === 'party_test_persistence_1');
    if (bMatched && bMatched.taxId === '09AAACR5050K1Z2') {
        console.log('6. Verified BusinessRepository survived simulated restart.');
    }
    else {
        console.error('FAILED: BusinessRepository did not survive restart!');
        process.exit(1);
    }
    console.log('\n=====================================================================');
    console.log('>>> STEP 7 PASSED: Data survived restart and reloaded from disk cleanly! <<<');
    console.log('=====================================================================\n');
}
testPersistence().catch(err => {
    console.error(err);
    process.exit(1);
});
