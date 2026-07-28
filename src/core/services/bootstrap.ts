import { ConnectorRegistry } from '@/core/connectors/connector-registry';
import { CsvConnector } from '@/core/connectors/csv-connector';
import { ExcelConnector } from '@/core/connectors/excel-connector';
import { JsonConnector } from '@/core/connectors/json-connector';
import { ParquetConnector } from '@/core/connectors/parquet-connector';
import { FolderConnector } from '@/core/connectors/folder-connector';
import { ConnectorLifecycleService } from './connector-lifecycle.service';
import { DatasetService } from './dataset.service';
import { JobService } from './job.service';
import { JobRunner } from './job-runner';
import { InMemoryConnectionRepository, InMemoryDatasetRepository, InMemoryJobRepository } from '@/infrastructure/repositories/in-memory-repositories';
import { InMemoryWorkflowRepository } from '@/infrastructure/repositories/in-memory-workflow-repository';
import { WorkflowService } from '@/core/workflow/workflow-orchestrator';

// Target Ingestion Architecture Services
import { R2Service } from './r2.service';
import { UploadService } from './upload.service';
import { MetadataService } from './metadata.service';
import { ValidationService } from './validation.service';
import { TransformationService } from './transformation.service';
import { IdentityService } from '@/core/identity/identity.service';
import { DeduplicationService } from '@/core/identity/deduplication.service';
import { ParquetService } from './parquet.service';
import { StatisticsService } from '@/core/telemetry/statistics.service';

export interface AppContext {
  connectorRegistry: ConnectorRegistry;
  lifecycleService: ConnectorLifecycleService;
  datasetService: DatasetService;
  connectionRepository: InMemoryConnectionRepository;
  datasetRepository: InMemoryDatasetRepository;
  jobRepository: InMemoryJobRepository;
  jobService: JobService;
  workflowRepository: InMemoryWorkflowRepository;
  workflowService: WorkflowService;
  r2Service: R2Service;
  uploadService: UploadService;
  metadataService: MetadataService;
  validationService: ValidationService;
  transformationService: TransformationService;
  identityService: IdentityService;
  deduplicationService: DeduplicationService;
  parquetService: ParquetService;
  statisticsService: StatisticsService;
}

let contextInstance: AppContext | null = null;

export function bootstrap(): AppContext {
  if (!contextInstance) {
    const r2Service = new R2Service();
    const uploadService = new UploadService(r2Service);
    const metadataService = new MetadataService();
    const validationService = new ValidationService();
    const transformationService = new TransformationService();
    const identityService = new IdentityService();
    const deduplicationService = new DeduplicationService();
    const parquetService = new ParquetService();
    const statisticsService = new StatisticsService();

    const connectorRegistry = new ConnectorRegistry();
    connectorRegistry.register(new CsvConnector(r2Service));
    connectorRegistry.register(new ExcelConnector(r2Service));
    connectorRegistry.register(new JsonConnector(r2Service));
    connectorRegistry.register(new ParquetConnector(r2Service));
    connectorRegistry.register(new FolderConnector(r2Service));

    const connectionRepository = new InMemoryConnectionRepository();
    const datasetRepository = new InMemoryDatasetRepository();
    const jobRepository = new InMemoryJobRepository();
    const workflowRepository = new InMemoryWorkflowRepository();

    const lifecycleService = new ConnectorLifecycleService({ connectorRegistry });
    const jobRunner = new JobRunner(jobRepository, lifecycleService);
    const jobService = new JobService(jobRepository, jobRunner);
    const datasetService = new DatasetService({ lifecycleService, datasetRepository });

    const workflowService = new WorkflowService(
      workflowRepository,
      connectionRepository,
      lifecycleService,
      datasetService,
      jobService,
      r2Service,
      metadataService,
      validationService,
      transformationService,
      identityService,
      deduplicationService,
      parquetService,
      statisticsService
    );

    contextInstance = {
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
    };
  }

  return contextInstance;
}
