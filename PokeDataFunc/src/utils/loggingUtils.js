"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogManager = exports.LogLevel = void 0;
/**
 * Enum for log levels to control verbosity
 */
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
    LogLevel[LogLevel["TRACE"] = 4] = "TRACE";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
/**
 * Enhanced logging utility that ensures logs are properly captured
 * in Azure Functions, even with asynchronous operations
 */
class LogManager {
    constructor(context, correlationId, level = LogLevel.INFO) {
        this.logs = [];
        this.context = context;
        this.correlationId = correlationId;
        this.level = level;
    }
    /**
     * Log an error message
     */
    error(message) {
        if (this.level >= LogLevel.ERROR) {
            this.logWithLevel("ERROR", message);
        }
    }
    /**
     * Log a warning message
     */
    warn(message) {
        if (this.level >= LogLevel.WARN) {
            this.logWithLevel("WARN", message);
        }
    }
    /**
     * Log an info message
     */
    info(message) {
        if (this.level >= LogLevel.INFO) {
            this.logWithLevel("INFO", message);
        }
    }
    /**
     * Log a debug message
     */
    debug(message) {
        if (this.level >= LogLevel.DEBUG) {
            this.logWithLevel("DEBUG", message);
        }
    }
    /**
     * Log a trace message
     */
    trace(message) {
        if (this.level >= LogLevel.TRACE) {
            this.logWithLevel("TRACE", message);
        }
    }
    /**
     * Log a message with a specific level
     */
    logWithLevel(level, message) {
        const formattedMessage = `[${this.correlationId}] ${level}: ${message}`;
        this.logs.push(formattedMessage);
        // Write immediately but also queue for final flush
        this.context.log(formattedMessage);
    }
    /**
     * Flush all buffered logs to ensure they're captured
     */
    async flush() {
        // Force a small delay to ensure logs are processed
        return new Promise(resolve => {
            setTimeout(() => {
                // Re-log everything one more time to ensure it's captured
                if (this.logs.length > 0) {
                    this.context.log(`[${this.correlationId}] FLUSH: Flushing ${this.logs.length} buffered logs`);
                    this.logs.forEach(message => {
                        this.context.log(`FLUSH: ${message}`);
                    });
                }
                resolve();
            }, 100);
        });
    }
    /**
     * Time an operation and log its duration
     */
    async timeOperation(name, operation) {
        this.info(`Starting operation: ${name}`);
        const startTime = Date.now();
        try {
            const result = await operation();
            const duration = Date.now() - startTime;
            this.info(`Completed operation: ${name} in ${duration}ms`);
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.error(`Failed operation: ${name} after ${duration}ms: ${error.message}`);
            throw error;
        }
    }
}
exports.LogManager = LogManager;
//# sourceMappingURL=loggingUtils.js.map