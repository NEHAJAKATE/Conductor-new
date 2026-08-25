"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atc_ingest_runner_1 = require("../src/core/services/atc-ingest-runner");
async function runFullIngest() {
    console.log('Ingesting all 5 production datasets into Conductor...');
    const res = await atc_ingest_runner_1.AtcIngestRunner.runFullAtcIngestion();
    console.log('Ingestion Completed Successfully:');
    console.log(JSON.stringify(res.totals, null, 2));
}
runFullIngest().catch(console.error);
