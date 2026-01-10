/**
 * Fetch utilities with timeout, retry, and error handling
 *
 * Addresses technical gaps:
 * - Request timeouts to prevent hanging
 * - Retry logic with exponential backoff for transient failures
 * - Structured error types for better handling
 */

/** Default timeout for external API calls (30 seconds) */
export const DEFAULT_TIMEOUT_MS = 30_000;

/** Default timeout for internal/database calls (10 seconds) */
export const INTERNAL_TIMEOUT_MS = 10_000;

/** Default retry configuration */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10_000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryableStatuses: number[];
}

export interface FetchWithTimeoutOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface FetchWithRetryOptions extends FetchWithTimeoutOptions {
  retry?: Partial<RetryConfig>;
}

/**
 * Custom error class for fetch failures with additional context
 */
export class FetchError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly isTimeout: boolean = false,
    public readonly isRetryable: boolean = false,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'FetchError';
  }

  static timeout(url: string, timeoutMs: number): FetchError {
    return new FetchError(
      `Request to ${url} timed out after ${timeoutMs}ms`,
      undefined,
      true,
      true,
    );
  }

  static httpError(
    url: string,
    status: number,
    statusText: string,
  ): FetchError {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    return new FetchError(
      `HTTP ${status} ${statusText} from ${url}`,
      status,
      false,
      retryableStatuses.includes(status),
    );
  }

  static networkError(url: string, cause: Error): FetchError {
    return new FetchError(
      `Network error fetching ${url}: ${cause.message}`,
      undefined,
      false,
      true,
      cause,
    );
  }
}

/**
 * Fetch with timeout support using AbortController
 *
 * @param url - URL to fetch
 * @param init - Standard fetch init options
 * @param options - Timeout and signal options
 * @returns Response object
 * @throws FetchError on timeout or network failure
 */
export async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
  options: FetchWithTimeoutOptions = {},
): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal: externalSignal } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Combine external signal if provided
  if (externalSignal) {
    externalSignal.addEventListener('abort', () => controller.abort());
  }

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw FetchError.timeout(url, timeoutMs);
    }
    throw FetchError.networkError(
      url,
      error instanceof Error ? error : new Error(String(error)),
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Calculates delay for exponential backoff with jitter
 */
function calculateBackoffDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
): number {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelayMs * 2 ** attempt;
  // Cap at max delay
  const cappedDelay = Math.min(exponentialDelay, maxDelayMs);
  // Add jitter (0-25% of delay)
  const jitter = cappedDelay * Math.random() * 0.25;
  return Math.floor(cappedDelay + jitter);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with timeout and automatic retry for transient failures
 *
 * @param url - URL to fetch
 * @param init - Standard fetch init options
 * @param options - Timeout, retry, and signal options
 * @returns Response object
 * @throws FetchError after all retries exhausted
 */
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  options: FetchWithRetryOptions = {},
): Promise<Response> {
  const retryConfig: RetryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    ...options.retry,
  };

  let lastError: FetchError | undefined;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, init, {
        timeoutMs: options.timeoutMs,
        signal: options.signal,
      });

      // Check if response status is retryable
      if (
        !response.ok &&
        retryConfig.retryableStatuses.includes(response.status)
      ) {
        lastError = FetchError.httpError(
          url,
          response.status,
          response.statusText,
        );

        // Don't retry if this was the last attempt
        if (attempt < retryConfig.maxRetries) {
          const delay = calculateBackoffDelay(
            attempt,
            retryConfig.baseDelayMs,
            retryConfig.maxDelayMs,
          );
          console.warn(
            `[fetch-retry] Attempt ${attempt + 1}/${retryConfig.maxRetries + 1} failed ` +
              `with status ${response.status}, retrying in ${delay}ms`,
          );
          await sleep(delay);
          continue;
        }
      }

      // Return response (caller handles success/error based on status)
      return response;
    } catch (error) {
      // Handle FetchError (timeout or network error)
      if (error instanceof FetchError) {
        lastError = error;

        if (error.isRetryable && attempt < retryConfig.maxRetries) {
          const delay = calculateBackoffDelay(
            attempt,
            retryConfig.baseDelayMs,
            retryConfig.maxDelayMs,
          );
          console.warn(
            `[fetch-retry] Attempt ${attempt + 1}/${retryConfig.maxRetries + 1} failed: ` +
              `${error.message}, retrying in ${delay}ms`,
          );
          await sleep(delay);
          continue;
        }
      }

      throw error;
    }
  }

  // All retries exhausted
  throw (
    lastError ??
    new FetchError(`All ${retryConfig.maxRetries + 1} attempts failed`)
  );
}

/**
 * Extracts a user-friendly error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof FetchError) {
    if (error.isTimeout) {
      return 'Request timed out. Please try again.';
    }
    if (error.status === 429) {
      return 'Rate limited by upstream service. Please try again later.';
    }
    if (error.status && error.status >= 500) {
      return 'Upstream service temporarily unavailable. Please try again.';
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

/**
 * Determines if an error is likely transient and worth retrying
 */
export function isTransientError(error: unknown): boolean {
  if (error instanceof FetchError) {
    return error.isRetryable;
  }
  // Network errors are generally transient
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  return false;
}
