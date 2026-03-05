import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getTimestamp = (): string => new Date().toISOString();

const LOG_DIR = path.join(__dirname, '../../logs');
const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

// Create logs directory if it doesn't exist
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Determine log level from environment (default: info in production, debug in development)
const CURRENT_LOG_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) ||
    (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

/**
 * Formats log data into a structured string
 */
function formatLogData(data?: Record<string, any>): string {
    if (!data || Object.keys(data).length === 0) return '';
    try {
        return ` ${JSON.stringify(data)}`;
    } catch (_error) {
        return ' [Unserializable data]';
    }
}

/**
 * Writes log to file
 */
function writeToFile(level: LogLevel, message: string): void {
    // Only write to file in production
    if (process.env.NODE_ENV !== 'production') return;

    const logFile = level === 'error' ? 'error.log' : 'combined.log';
    const logPath = path.join(LOG_DIR, logFile);
    const logEntry = `[${level.toUpperCase()}] ${getTimestamp()}: ${message}\n`;

    try {
        fs.appendFileSync(logPath, logEntry);
    } catch (error) {
        // Fail silently if we can't write to file
        console.error('Failed to write to log file:', error);
    }
}

/**
 * Checks if a log level should be logged based on current configuration
 */
function shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] <= LOG_LEVELS[CURRENT_LOG_LEVEL];
}

/**
 * Enhanced logger with structured logging and file output
 */
export const logger = {
    /**
     * Log informational messages
     */
    info: (message: string, data?: Record<string, any>): void => {
        if (!shouldLog('info')) return;

        const logMessage = `${message}${formatLogData(data)}`;
        console.log(`[INFO] ${getTimestamp()}: ${logMessage}`);
        writeToFile('info', logMessage);
    },

    /**
     * Log warning messages
     */
    warn: (message: string, data?: Record<string, any>): void => {
        if (!shouldLog('warn')) return;

        const logMessage = `${message}${formatLogData(data)}`;
        console.warn(`[WARN] ${getTimestamp()}: ${logMessage}`);
        writeToFile('warn', logMessage);
    },

    /**
     * Log error messages
     */
    error: (message: string, error?: Error | Record<string, any> | any): void => {
        if (!shouldLog('error')) return;

        let errorData = '';
        if (error instanceof Error) {
            const extras: Record<string, any> = {
                message: error.message,
                stack: error.stack,
                name: error.name,
            };
            // Capture postgres/drizzle error properties hidden by default
            for (const key of ['code', 'detail', 'severity', 'hint', 'constraint', 'table', 'schema', 'cause']) {
                if ((error as any)[key] !== undefined) {
                    extras[key] = String((error as any)[key]);
                }
            }
            errorData = formatLogData(extras);
        } else if (error) {
            errorData = formatLogData(error);
        }

        const logMessage = `${message}${errorData}`;
        console.error(`[ERROR] ${getTimestamp()}: ${logMessage}`);
        writeToFile('error', logMessage);
    },

    /**
     * Log debug messages (only in development)
     */
    debug: (message: string, data?: Record<string, any>): void => {
        if (!shouldLog('debug')) return;

        const logMessage = `${message}${formatLogData(data)}`;
        console.debug(`[DEBUG] ${getTimestamp()}: ${logMessage}`);
        writeToFile('debug', logMessage);
    },
};
