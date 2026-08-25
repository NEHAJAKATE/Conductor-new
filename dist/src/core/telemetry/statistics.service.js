"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatisticsService = void 0;
class StatisticsService {
    metricsStore = new Map();
    async recordMetrics(workflowId, metrics) {
        console.log(`[StatisticsService] Recording telemetry metrics for workflow: ${workflowId}`);
        this.metricsStore.set(workflowId, metrics);
        return metrics;
    }
    async getMetrics(workflowId) {
        return this.metricsStore.get(workflowId);
    }
    async listAllMetrics() {
        const result = {};
        for (const [key, value] of this.metricsStore.entries()) {
            result[key] = value;
        }
        return result;
    }
    calculateCompressionRatio(csvSize, parquetSize) {
        if (parquetSize === 0)
            return 1.0;
        return parseFloat((csvSize / parquetSize).toFixed(2));
    }
}
exports.StatisticsService = StatisticsService;
