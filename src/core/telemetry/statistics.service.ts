export interface PipelineMetrics {
  rowsUploaded: number;
  rowsValid: number;
  rowsInvalid: number;
  rowsRemoved: number;
  rowsMerged: number;
  duplicatesFound: number;
  profilesCreated: number;
  compressionRatio: number;
  csvSize: number;
  parquetSize: number;
  uploadTimeMs: number;
  transformationTimeMs: number;
  validationTimeMs: number;
  identityResolutionTimeMs: number;
  overallPipelineTimeMs: number;
}

export class StatisticsService {
  private metricsStore = new Map<string, PipelineMetrics>();

  async recordMetrics(workflowId: string, metrics: PipelineMetrics): Promise<PipelineMetrics> {
    console.log(`[StatisticsService] Recording telemetry metrics for workflow: ${workflowId}`);
    this.metricsStore.set(workflowId, metrics);
    return metrics;
  }

  async getMetrics(workflowId: string): Promise<PipelineMetrics | undefined> {
    return this.metricsStore.get(workflowId);
  }

  async listAllMetrics(): Promise<Record<string, PipelineMetrics>> {
    const result: Record<string, PipelineMetrics> = {};
    for (const [key, value] of this.metricsStore.entries()) {
      result[key] = value;
    }
    return result;
  }

  calculateCompressionRatio(csvSize: number, parquetSize: number): number {
    if (parquetSize === 0) return 1.0;
    return parseFloat((csvSize / parquetSize).toFixed(2));
  }
}
