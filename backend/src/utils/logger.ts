/**
 * A simple logger utility to standardize log output.
 * It adds a timestamp and log level to each message.
 * In a larger application, this could be replaced with a more robust library
 * like Winston, which supports different transports (e.g., logging to files, cloud services).
 */

const getTimestamp = (): string => new Date().toISOString();

export const logger = {
    /**
     * Logs informational messages. Use this for general application flow events,
     * like server startup or successful connections.
     * @param message - The main log message.
     * @param args - Optional additional data or objects to log.
     */
    info: (message: string, ...args: any[]): void => {
        console.log(`[INFO] ${getTimestamp()}: ${message}`, ...args);
    },

    /**
     * Logs warning messages. Use this for non-critical issues that should be noted,
     * but don't prevent the application from running.
     * @param message - The warning message.
     * @param args - Optional additional data or objects to log.
     */
    warn: (message: string, ...args: any[]): void => {
        console.warn(`[WARN] ${getTimestamp()}: ${message}`, ...args);
    },

    /**
     * Logs error messages. Use this for critical errors, exceptions, and failed operations
     * that require attention.
     * @param message - The error message.
     * @param args - Optional additional data, often an error object or stack trace.
     */
    error: (message: string, ...args: any[]): void => {
        console.error(`[ERROR] ${getTimestamp()}: ${message}`, ...args);
    },
};
