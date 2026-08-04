export interface LogPayload {
  message: string;
  level: 'info' | 'success' | 'warning' | 'error' | 'debug';
  timestamp: string;
  category: string;
  correlationId?: string;
  [key: string]: any;
}

class Logger {
  private formatLog(level: LogPayload['level'], category: string, message: string, extra?: Record<string, any>): LogPayload {
    return {
      level,
      category,
      message,
      timestamp: new Date().toISOString(),
      ...extra
    };
  }

  info(category: string, message: string, extra?: Record<string, any>) {
    console.log(JSON.stringify(this.formatLog('info', category, message, extra)));
  }

  success(category: string, message: string, extra?: Record<string, any>) {
    console.log(JSON.stringify(this.formatLog('success', category, message, extra)));
  }

  warn(category: string, message: string, extra?: Record<string, any>) {
    console.warn(JSON.stringify(this.formatLog('warning', category, message, extra)));
  }

  error(category: string, message: string, extra?: Record<string, any>) {
    console.error(JSON.stringify(this.formatLog('error', category, message, extra)));
  }

  debug(category: string, message: string, extra?: Record<string, any>) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(JSON.stringify(this.formatLog('debug', category, message, extra)));
    }
  }
}

export const logger = new Logger();
