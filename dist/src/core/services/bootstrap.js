"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrap = bootstrap;
const connector_registry_1 = require("@/core/connectors/connector-registry");
const csv_connector_1 = require("@/core/connectors/csv-connector");
const excel_connector_1 = require("@/core/connectors/excel-connector");
const json_connector_1 = require("@/core/connectors/json-connector");
const parquet_connector_1 = require("@/core/connectors/parquet-connector");
const folder_connector_1 = require("@/core/connectors/folder-connector");
const connector_lifecycle_service_1 = require("./connector-lifecycle.service");
const dataset_service_1 = require("./dataset.service");
const job_service_1 = require("./job.service");
const job_runner_1 = require("./job-runner");
const in_memory_repositories_1 = require("@/infrastructure/repositories/in-memory-repositories");
const in_memory_workflow_repository_1 = require("@/infrastructure/repositories/in-memory-workflow-repository");
const workflow_orchestrator_1 = require("@/core/workflow/workflow-orchestrator");
const customer_repository_1 = require("@/infrastructure/repositories/customer-repository");
const business_repository_1 = require("@/infrastructure/repositories/business-repository");
const canonical_repositories_1 = require("@/infrastructure/repositories/canonical-repositories");
// Target Ingestion Architecture Services
const r2_service_1 = require("./r2.service");
const upload_service_1 = require("./upload.service");
const metadata_service_1 = require("./metadata.service");
const validation_service_1 = require("./validation.service");
const transformation_service_1 = require("./transformation.service");
const identity_service_1 = require("@/core/identity/identity.service");
const deduplication_service_1 = require("@/core/identity/deduplication.service");
const parquet_service_1 = require("./parquet.service");
const statistics_service_1 = require("@/core/telemetry/statistics.service");
const scheduler_service_1 = require("@/core/scheduler/scheduler.service");
const automation_service_1 = require("@/core/automation/automation.service");
function bootstrap() {
    if (!globalThis.__appContextInstance__) {
        const r2Service = new r2_service_1.R2Service();
        const uploadService = new upload_service_1.UploadService(r2Service);
        const metadataService = new metadata_service_1.MetadataService();
        const validationService = new validation_service_1.ValidationService();
        const transformationService = new transformation_service_1.TransformationService();
        const identityService = new identity_service_1.IdentityService();
        const deduplicationService = new deduplication_service_1.DeduplicationService();
        const parquetService = new parquet_service_1.ParquetService();
        const statisticsService = new statistics_service_1.StatisticsService();
        const connectorRegistry = new connector_registry_1.ConnectorRegistry();
        connectorRegistry.register(new csv_connector_1.CsvConnector(r2Service));
        connectorRegistry.register(new excel_connector_1.ExcelConnector(r2Service));
        connectorRegistry.register(new json_connector_1.JsonConnector(r2Service));
        connectorRegistry.register(new parquet_connector_1.ParquetConnector(r2Service));
        connectorRegistry.register(new folder_connector_1.FolderConnector(r2Service));
        const connectionRepository = new in_memory_repositories_1.InMemoryConnectionRepository();
        const datasetRepository = new in_memory_repositories_1.InMemoryDatasetRepository();
        const jobRepository = new in_memory_repositories_1.InMemoryJobRepository();
        const workflowRepository = new in_memory_workflow_repository_1.InMemoryWorkflowRepository();
        const lifecycleService = new connector_lifecycle_service_1.ConnectorLifecycleService({ connectorRegistry });
        const jobRunner = new job_runner_1.JobRunner(jobRepository, lifecycleService);
        const jobService = new job_service_1.JobService(jobRepository, jobRunner);
        const datasetService = new dataset_service_1.DatasetService({ lifecycleService, datasetRepository });
        const workflowService = new workflow_orchestrator_1.WorkflowService(workflowRepository, connectionRepository, lifecycleService, datasetService, jobService, r2Service, metadataService, validationService, transformationService, identityService, deduplicationService, parquetService, statisticsService);
        globalThis.__appContextInstance__ = {
            connectorRegistry,
            lifecycleService,
            datasetService,
            connectionRepository,
            datasetRepository,
            jobRepository,
            jobService,
            workflowRepository,
            workflowService,
            r2Service,
            uploadService,
            metadataService,
            validationService,
            transformationService,
            identityService,
            deduplicationService,
            parquetService,
            statisticsService,
            customerRepository: customer_repository_1.customerRepository,
            businessRepository: business_repository_1.businessRepository,
            transactionRepository: canonical_repositories_1.transactionRepository,
            inventoryRepository: canonical_repositories_1.inventoryRepository,
            outstandingRepository: canonical_repositories_1.outstandingRepository,
            schedulerService: scheduler_service_1.schedulerService,
            automationService: automation_service_1.automationService,
        };
    }
    return globalThis.__appContextInstance__;
}
