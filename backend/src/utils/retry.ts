// Utility for retrying async operations with exponential backoff

interface RetryOptions {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
}

/**
 * Retries an async operation with exponential backoff
 * @param operation The async operation to retry
 * @param options Retry configuration options
 * @returns The result of the operation
 * @throws The last error if all retry attempts fail
 */
export async function retryWithBackoff<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const {
        maxAttempts = 3,
        initialDelay = 1000,
        maxDelay = 10000,
        backoffFactor = 2,
    } = options;

    let lastError: Error;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;

            if (attempt === maxAttempts) {
                throw lastError;
            }

            // Wait before retrying with exponential backoff
            await new Promise(resolve => setTimeout(resolve, delay));
            delay = Math.min(delay * backoffFactor, maxDelay);
        }
    }

    throw lastError!;
}
