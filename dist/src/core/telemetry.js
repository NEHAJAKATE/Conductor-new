"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.telemetry = void 0;
const logger_1 = require("./logger");
class TelemetryService {
    emit(name, correlationId, durationMs, metadata) {
        const event = {
            eventId: `evt-${Math.random().toString(36).substring(2, 9)}`,
            name,
            timestamp: new Date().toISOString(),
            correlationId,
            durationMs,
            metadata,
        };
        logger_1.logger.info('telemetry', `Telemetry Event: ${name}`, { event });
    }
}
exports.telemetry = new TelemetryService();
