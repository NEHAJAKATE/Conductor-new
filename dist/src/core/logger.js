"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
class Logger {
    formatLog(level, category, message, extra) {
        return {
            level,
            category,
            message,
            timestamp: new Date().toISOString(),
            ...extra
        };
    }
    info(category, message, extra) {
        console.log(JSON.stringify(this.formatLog('info', category, message, extra)));
    }
    success(category, message, extra) {
        console.log(JSON.stringify(this.formatLog('success', category, message, extra)));
    }
    warn(category, message, extra) {
        console.warn(JSON.stringify(this.formatLog('warning', category, message, extra)));
    }
    error(category, message, extra) {
        console.error(JSON.stringify(this.formatLog('error', category, message, extra)));
    }
    debug(category, message, extra) {
        if (process.env.NODE_ENV !== 'production') {
            console.log(JSON.stringify(this.formatLog('debug', category, message, extra)));
        }
    }
}
exports.logger = new Logger();
