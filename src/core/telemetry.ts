import { logger } from './logger';

export interface TelemetryEvent {
  eventId: string;
  name: string;
  timestamp: string;
  correlationId?: string;
  durationMs?: number;
  metadata?: Record<string, any>;
}

class TelemetryService {
  emit(name: string, correlationId?: string, durationMs?: number, metadata?: Record<string, any>) {
    const event: TelemetryEvent = {
      eventId: `evt-${Math.random().toString(36).substring(2, 9)}`,
      name,
      timestamp: new Date().toISOString(),
      correlationId,
      durationMs,
      metadata,
    };
    logger.info('telemetry', `Telemetry Event: ${name}`, { event });
  }
}

export const telemetry = new TelemetryService();
