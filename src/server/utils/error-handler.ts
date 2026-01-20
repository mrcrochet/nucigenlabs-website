/**
 * Centralized Error Handling Utility
 * 
 * Provides robust error handling with:
 * - User-friendly error messages
 * - Automatic retry with exponential backoff
 * - Timeout management
 * - Error classification
 * - Fallback mechanisms
 */

export interface ErrorContext {
  endpoint?: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

export interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isRetryable: boolean = false,
    public context?: ErrorContext
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Classify error type from error object
 */
export function classifyError(error: any): {
  type: 'network' | 'timeout' | 'rate_limit' | 'auth' | 'validation' | 'server' | 'unknown';
  isRetryable: boolean;
  statusCode: number;
} {
  const message = error?.message?.toLowerCase() || '';
  const status = error?.status || error?.statusCode || 500;

  // Network errors
  if (
    message.includes('network') ||
    message.includes('fetch failed') ||
    message.includes('econnrefused') ||
    message.includes('enotfound') ||
    status === 0
  ) {
    return { type: 'network', isRetryable: true, statusCode: 503 };
  }

  // Timeout errors
  if (
    message.includes('timeout') ||
    message.includes('timed out') ||
    status === 504
  ) {
    return { type: 'timeout', isRetryable: true, statusCode: 504 };
  }

  // Rate limit errors
  if (
    message.includes('rate limit') ||
    message.includes('429') ||
    message.includes('too many requests') ||
    status === 429
  ) {
    return { type: 'rate_limit', isRetryable: true, statusCode: 429 };
  }

  // Auth errors
  if (
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    message.includes('invalid api key') ||
    message.includes('authentication') ||
    status === 401 ||
    status === 403
  ) {
    return { type: 'auth', isRetryable: false, statusCode: status };
  }

  // Validation errors
  if (
    message.includes('validation') ||
    message.includes('invalid') ||
    message.includes('bad request') ||
    status === 400
  ) {
    return { type: 'validation', isRetryable: false, statusCode: 400 };
  }

  // Server errors (5xx)
  if (status >= 500 && status < 600) {
    return { type: 'server', isRetryable: true, statusCode: status };
  }

  return { type: 'unknown', isRetryable: false, statusCode: 500 };
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: any, context?: ErrorContext): string {
  const classification = classifyError(error);
  const endpoint = context?.endpoint || 'service';

  switch (classification.type) {
    case 'network':
      return 'Unable to connect to the service. Please check your internet connection and try again.';
    
    case 'timeout':
      return 'The request took too long to complete. Please try again in a moment.';
    
    case 'rate_limit':
      return 'Too many requests. Please wait a moment before trying again.';
    
    case 'auth':
      if (endpoint.includes('twelvedata')) {
        return 'Market data service authentication failed. Please check your API configuration.';
      }
      return 'Authentication failed. Please log in again.';
    
    case 'validation':
      return error.message || 'Invalid request. Please check your input and try again.';
    
    case 'server':
      return 'The service is temporarily unavailable. Please try again later.';
    
    default:
      return error.message || 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  }
}

/**
 * Create timeout promise
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    ),
  ]);
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    retryableErrors = [],
  } = config;

  let lastError: any;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Check if error is retryable
      const classification = classifyError(error);
      const isRetryable = 
        classification.isRetryable ||
        retryableErrors.some(pattern => 
          error?.message?.toLowerCase().includes(pattern.toLowerCase())
        );

      // Don't retry if not retryable or last attempt
      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase delay for next retry (exponential backoff)
      delay = Math.min(delay * backoffMultiplier, maxDelay);
      
      console.warn(
        `[ErrorHandler] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`,
        { error: error.message, type: classification.type }
      );
    }
  }

  throw lastError;
}

/**
 * Execute with timeout and retry
 */
export async function executeWithRetryAndTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number = 30000,
  retryConfig?: RetryConfig
): Promise<T> {
  return retryWithBackoff(
    () => withTimeout(fn(), timeoutMs),
    retryConfig
  );
}

/**
 * Handle API errors and return standardized response
 */
export function handleApiError(
  error: any,
  context?: ErrorContext
): {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  type: string;
  retryable: boolean;
} {
  const classification = classifyError(error);
  const userMessage = getUserFriendlyMessage(error, context);

  // Log error with context
  console.error('[API Error]', {
    message: error.message,
    type: classification.type,
    statusCode: classification.statusCode,
    context,
    stack: error.stack,
  });

  return {
    success: false,
    error: error.code || classification.type.toUpperCase(),
    message: userMessage,
    statusCode: classification.statusCode,
    type: classification.type,
    retryable: classification.isRetryable,
  };
}

/**
 * Safe async handler wrapper for Express routes
 */
export function asyncHandler(
  handler: (req: any, res: any, next: any) => Promise<any>,
  options: {
    timeout?: number;
    retry?: RetryConfig;
    context?: (req: any) => ErrorContext;
  } = {}
) {
  return async (req: any, res: any, next: any) => {
    try {
      const context = options.context ? options.context(req) : {
        endpoint: req.path,
        userId: req.user?.id,
        requestId: req.id,
      };

      const execute = async () => {
        return await handler(req, res, next);
      };

      if (options.timeout || options.retry) {
        await executeWithRetryAndTimeout(execute, options.timeout, options.retry);
      } else {
        await execute();
      }
    } catch (error: any) {
      const errorResponse = handleApiError(error, {
        endpoint: req.path,
        userId: req.user?.id,
        requestId: req.id,
      });

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  };
}
